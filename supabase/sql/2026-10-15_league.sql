-- ─────────────────────────────────────────────────────────────
--  TwinLand — 2026-10-15 — weekly league with prizes
--  A week runs Saturday 00:00 to Saturday 00:00 Tehran time, same as the weekly leaderboard.
--  Weeks close lazily: league_status() closes any finished week the first time anyone asks.
--  XP prizes go through tl_award_system, which no client role can execute.
-- ─────────────────────────────────────────────────────────────

create or replace function public.tl_award_system(p_user uuid, p_amount integer, p_reason text)
returns void language plpgsql security definer set search_path = '' as $function$
declare v_xp integer; v_old integer; v_level integer; v_rank integer;
begin
  if p_user is null or p_amount is null or p_amount <= 0 or p_amount > 2000 then return; end if;
  select level into v_old from public.profiles where id = p_user;
  update public.profiles set xp = coalesce(xp, 0) + p_amount where id = p_user returning xp into v_xp;
  if v_xp is null then return; end if;
  -- Level thresholds must stay identical to award_xp, do_checkin and app/gameSystem.js.
  v_level := case when v_xp >= 2000 then 6 when v_xp >= 1000 then 5 when v_xp >= 600 then 4
                  when v_xp >= 300 then 3 when v_xp >= 100 then 2 else 1 end;
  update public.profiles set level = v_level where id = p_user;
  select count(*) + 1 into v_rank from public.profiles where coalesce(xp, 0) > v_xp;
  insert into public.xp_history (user_id, amount, reason, ref_id, resulting_xp, rank_after)
  values (p_user, p_amount, p_reason, null, v_xp, v_rank);
  if v_level > coalesce(v_old, 1) then
    perform public.push_notification(p_user, 'level_up', '🎉 لول آپ شدی!', 'حالا لول ' || v_level || ' هستی.', '⭐', '/profile');
  end if;
end $function$;
revoke all on function public.tl_award_system(uuid, integer, text) from public, anon, authenticated;

create or replace function public.tl_week_start(p_at timestamptz default now()) returns date
language sql stable set search_path = '' as $$
  select (date_trunc('week', (p_at at time zone 'Asia/Tehran') + interval '2 days') - interval '2 days')::date
$$;

create table if not exists public.league_prizes (
  week_start date not null,
  rank smallint not null check (rank between 1 and 3),
  title text not null check (char_length(title) between 2 and 80),
  cafe_id uuid references public.cafes(id),
  xp_bonus integer not null default 0 check (xp_bonus between 0 and 2000),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (week_start, rank)
);
create table if not exists public.league_results (
  week_start date not null,
  rank smallint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pts bigint not null,
  prize_title text,
  cafe_id uuid,
  xp_bonus integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (week_start, user_id)
);
create table if not exists public.league_weeks (
  week_start date primary key,
  closed_at timestamptz not null default now(),
  players integer not null default 0,
  winners integer not null default 0
);
alter table public.league_prizes enable row level security;
alter table public.league_results enable row level security;
alter table public.league_weeks enable row level security;
revoke all on public.league_prizes, public.league_results, public.league_weeks from anon, authenticated;

-- the league starts with the week of Saturday 10 October 2026; a winner needs at least 50 points
create or replace function public.league_close_due() returns integer
language plpgsql security definer set search_path = '' as $function$
declare
  v_cur date := public.tl_week_start(now());
  v_ws date; v_from timestamptz; v_to timestamptz; v_closed integer := 0; v_players integer; v_w integer;
  v_owner uuid := public.tl_owner_id();
  r record; v_title text; v_cafe uuid; v_xp integer; v_cafe_name text;
begin
  for v_ws in select gs::date from generate_series(greatest(date '2026-10-10', v_cur - 28), v_cur - 7, interval '7 days') gs loop
    if exists (select 1 from public.league_weeks w where w.week_start = v_ws) then continue; end if;
    perform pg_advisory_xact_lock(hashtext('tl_league_' || v_ws::text));
    if exists (select 1 from public.league_weeks w where w.week_start = v_ws) then continue; end if;
    v_from := (v_ws::timestamp) at time zone 'Asia/Tehran';
    v_to := ((v_ws + 7)::timestamp) at time zone 'Asia/Tehran';
    v_w := 0;
    select count(distinct h.user_id) into v_players from public.xp_history h
     where h.created_at >= v_from and h.created_at < v_to and h.amount > 0;
    for r in
      with s as (
        select h.user_id as uid, sum(h.amount)::bigint as pts, max(h.created_at) as last_at
          from public.xp_history h
         where h.created_at >= v_from and h.created_at < v_to and h.amount > 0
           and coalesce(h.reason, '') not like 'league%' and coalesce(h.reason, '') not like 'referral%'
         group by h.user_id)
      select s.uid, s.pts, row_number() over (order by s.pts desc, s.last_at asc) as rk
        from s join public.profiles p on p.id = s.uid
       where coalesce(p.account_type, 'user') <> 'sme' and p.id is distinct from v_owner and s.pts >= 50
       order by rk limit 3
    loop
      v_title := null; v_cafe := null; v_xp := null; v_cafe_name := null;
      select lp.title, lp.cafe_id, lp.xp_bonus into v_title, v_cafe, v_xp
        from public.league_prizes lp where lp.week_start = v_ws and lp.rank = r.rk and lp.active;
      if v_title is null then
        v_title := (array['نشان طلای لیگ هفته', 'نشان نقره لیگ هفته', 'نشان برنز لیگ هفته'])[r.rk];
        v_xp := (array[300, 200, 100])[r.rk];
      end if;
      if v_cafe is not null then select c.name into v_cafe_name from public.cafes c where c.id = v_cafe; end if;
      insert into public.league_results (week_start, rank, user_id, pts, prize_title, cafe_id, xp_bonus)
      values (v_ws, r.rk, r.uid, r.pts, v_title, v_cafe, coalesce(v_xp, 0)) on conflict do nothing;
      insert into public.awards (user_id, kind, code, title, icon, rarity, source)
      values (r.uid, 'badge', 'league_' || to_char(v_ws, 'YYYYMMDD') || '_' || r.rk,
              (array['قهرمان لیگ هفته', 'نفر دوم لیگ هفته', 'نفر سوم لیگ هفته'])[r.rk],
              (array['🥇', '🥈', '🥉'])[r.rk], (array['legendary', 'epic', 'rare'])[r.rk], 'league')
      on conflict (user_id, code) do nothing;
      perform public.tl_award_system(r.uid, coalesce(v_xp, 0), 'league_week');
      perform public.push_notification(r.uid, 'league_win',
        (array['🏆 قهرمان لیگ هفته شدی!', '🥈 نفر دوم لیگ هفته شدی!', '🥉 نفر سوم لیگ هفته شدی!'])[r.rk],
        'جایزه: ' || v_title || coalesce(' در ' || v_cafe_name, ''), '🏆', '/leaderboard');
      v_w := v_w + 1;
    end loop;
    insert into public.league_weeks (week_start, players, winners) values (v_ws, coalesce(v_players, 0), v_w)
    on conflict do nothing;
    v_closed := v_closed + 1;
  end loop;
  return v_closed;
end $function$;
revoke all on function public.league_close_due() from public, anon, authenticated;

create or replace function public.league_status() returns jsonb
language plpgsql security definer set search_path = '' as $function$
declare v_cur date := public.tl_week_start(now()); v_prev date := public.tl_week_start(now()) - 7; v_out jsonb;
begin
  perform public.league_close_due();
  select jsonb_build_object(
    'week_start', v_cur,
    'ends_at', ((v_cur + 7)::timestamp) at time zone 'Asia/Tehran',
    'min_pts', 50,
    'prizes', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'rank', k,
               'title', coalesce(lp.title, (array['نشان طلای لیگ هفته', 'نشان نقره لیگ هفته', 'نشان برنز لیگ هفته'])[k]),
               'cafe_id', lp.cafe_id, 'cafe_name', c.name,
               'xp_bonus', coalesce(lp.xp_bonus, (array[300, 200, 100])[k]),
               'custom', lp.title is not null) order by k), '[]'::jsonb)
        from generate_series(1, 3) k
        left join public.league_prizes lp on lp.week_start = v_cur and lp.rank = k and lp.active
        left join public.cafes c on c.id = lp.cafe_id),
    'last', jsonb_build_object(
      'week_start', v_prev,
      'winners', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'rank', lr.rank, 'name', coalesce(nullif(p.display_name, ''), 'کاربر'),
                 'avatar', coalesce(p.avatar_emoji, '☕'), 'pts', lr.pts, 'prize', lr.prize_title,
                 'me', lr.user_id = auth.uid()) order by lr.rank), '[]'::jsonb)
          from public.league_results lr join public.profiles p on p.id = lr.user_id
         where lr.week_start = v_prev))
  ) into v_out;
  return v_out;
end $function$;
grant execute on function public.league_status() to anon, authenticated;

-- platform owner sets the prizes of the current week or a later one
create or replace function public.admin_league_set_prize(p_week date, p_rank integer, p_title text, p_cafe uuid default null, p_xp integer default 0)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare v_title text := public.tl_clean_text(p_title);
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  if p_week is null or p_week < public.tl_week_start(now()) or extract(isodow from p_week) <> 6 then
    return jsonb_build_object('ok', false, 'error', 'week'); end if;
  if p_rank not between 1 and 3 then return jsonb_build_object('ok', false, 'error', 'rank'); end if;
  if char_length(v_title) = 0 then
    update public.league_prizes set active = false, updated_at = now() where week_start = p_week and rank = p_rank;
    return jsonb_build_object('ok', true, 'cleared', true);
  end if;
  if char_length(v_title) < 2 or char_length(v_title) > 80 then return jsonb_build_object('ok', false, 'error', 'title'); end if;
  if p_cafe is not null and not exists (select 1 from public.cafes where id = p_cafe) then
    return jsonb_build_object('ok', false, 'error', 'cafe'); end if;
  insert into public.league_prizes (week_start, rank, title, cafe_id, xp_bonus, active, updated_at)
  values (p_week, p_rank, v_title, p_cafe, least(greatest(coalesce(p_xp, 0), 0), 2000), true, now())
  on conflict (week_start, rank) do update
    set title = excluded.title, cafe_id = excluded.cafe_id, xp_bonus = excluded.xp_bonus, active = true, updated_at = now();
  return jsonb_build_object('ok', true);
end $function$;
revoke all on function public.admin_league_set_prize(date, integer, text, uuid, integer) from public, anon;
grant execute on function public.admin_league_set_prize(date, integer, text, uuid, integer) to authenticated;

create or replace function public.admin_league_overview() returns jsonb
language plpgsql security definer set search_path = '' as $function$
declare v_cur date := public.tl_week_start(now());
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  return jsonb_build_object('ok', true, 'current', v_cur,
    'weeks', (select jsonb_agg(jsonb_build_object('week_start', x.w,
                'prizes', (select coalesce(jsonb_agg(jsonb_build_object('rank', lp.rank, 'title', lp.title, 'cafe_id', lp.cafe_id,
                             'cafe_name', c.name, 'xp_bonus', lp.xp_bonus) order by lp.rank), '[]'::jsonb)
                             from public.league_prizes lp left join public.cafes c on c.id = lp.cafe_id
                            where lp.week_start = x.w and lp.active)) order by x.w)
                from (select v_cur as w union all select v_cur + 7) x),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('week_start', lw.week_start, 'players', lw.players,
                  'winners', (select coalesce(jsonb_agg(jsonb_build_object('rank', lr.rank, 'name', coalesce(nullif(p.display_name, ''), 'کاربر'),
                                'pts', lr.pts, 'prize', lr.prize_title) order by lr.rank), '[]'::jsonb)
                                from public.league_results lr join public.profiles p on p.id = lr.user_id
                               where lr.week_start = lw.week_start)) order by lw.week_start desc), '[]'::jsonb)
                  from (select * from public.league_weeks order by week_start desc limit 6) lw));
end $function$;
revoke all on function public.admin_league_overview() from public, anon;
grant execute on function public.admin_league_overview() to authenticated;
