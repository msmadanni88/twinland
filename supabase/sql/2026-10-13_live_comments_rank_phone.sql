-- ============================================================================
-- 2026-10-13 (Tehran evening) — live counter fix, café comments, leaderboard RPCs, phone-OTP table
-- Applied to project pkkdepecbzrnmejnseqg in four migrations (names in comments).
-- Every function is SECURITY DEFINER with an empty search_path and fully qualified names.
-- Tables are reachable only through these functions: RLS on, no policies, all direct grants revoked.
-- ============================================================================

-- ── 1) live_now: distinct people who checked in during the last 2 hours, city-wide ─────────────
-- Bug fixed: the top-bar number used to be the SUM of the per-café distinct counts, so one person
-- checking in at 7 places showed as 7 "online". The per-café view cafe_live_counts is unchanged.
create or replace function public.live_now() returns integer
language sql stable security definer set search_path = '' as $$
  select count(distinct c.user_id)::integer
    from public.checkins c
   where c.created_at > now() - interval '2 hours'
$$;
revoke all on function public.live_now() from public;
grant execute on function public.live_now() to anon, authenticated;

-- ── 2) café comments ────────────────────────────────────────────────────────────────────────────
create table if not exists public.cafe_comments (
  id           bigint generated always as identity primary key,
  cafe_id      uuid not null references public.cafes(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  body         text not null check (char_length(body) between 2 and 400),
  created_at   timestamptz not null default now(),
  edited_at    timestamptz,
  hidden       boolean not null default false,   -- hidden by reports (3 different people) or by the owner
  removed      boolean not null default false,   -- removed by its author (soft delete; writing again restores it)
  report_count integer not null default 0,
  unique (cafe_id, user_id)
);
create index if not exists cafe_comments_cafe_idx on public.cafe_comments (cafe_id, created_at desc) where not hidden;
-- NOTE: applied live as: create table (without 'removed') then 'alter table add column removed'. The tool blocks DELETE and DROP statements,
-- so authors soft-delete with remove_my_cafe_comment instead of a hard delete.
create table if not exists public.cafe_comment_reports (
  comment_id bigint not null references public.cafe_comments(id) on delete cascade,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.cafe_comments        enable row level security;
alter table public.cafe_comment_reports enable row level security;
revoke all on public.cafe_comments        from anon, authenticated;
revoke all on public.cafe_comment_reports from anon, authenticated;

-- strips control and direction-override characters, collapses whitespace (ZWNJ is kept: Persian needs it)
create or replace function public.tl_clean_text(p text) returns text
language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(regexp_replace(coalesce(p, ''), '[\u0001-\u0008\u000b\u000c\u000e-\u001f‎‏‪-‮⁦-⁩]', '', 'g'), '\s+', ' ', 'g'))
$$;
revoke all on function public.tl_clean_text(text) from public;

-- one comment per person per place; posting again edits it. Business accounts cannot comment.
-- Rejected: links, @handles, phone-number-like digit runs. Limits: 5 new comments per 24 h, 20 s between edits.
create or replace function public.post_cafe_comment(p_cafe uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_acct text; v_body text; v_flat text; v_id bigint; v_recent integer; v_prev timestamptz; v_exists boolean;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select account_type into v_acct from public.profiles where id = v_uid;
  if not found then return jsonb_build_object('ok', false, 'error', 'profile'); end if;
  if v_acct = 'sme' then return jsonb_build_object('ok', false, 'error', 'business'); end if;
  if not exists (select 1 from public.cafes where id = p_cafe and is_active) then return jsonb_build_object('ok', false, 'error', 'cafe'); end if;
  v_body := public.tl_clean_text(p_body);
  if char_length(v_body) < 2   then return jsonb_build_object('ok', false, 'error', 'short'); end if;
  if char_length(v_body) > 400 then return jsonb_build_object('ok', false, 'error', 'long');  end if;
  if v_body ~* '(https?:|www\.|t\.me/|@[a-z0-9_]{3,}|\.(com|ir|net|org|me|co|io)([^a-z]|$))' then return jsonb_build_object('ok', false, 'error', 'no_links'); end if;
  v_flat := regexp_replace(translate(v_body, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'), '[\s\-\.\+]', '', 'g');
  if v_flat ~ '[0-9]{8,}' then return jsonb_build_object('ok', false, 'error', 'no_phone'); end if;
  select true, coalesce(edited_at, created_at) into v_exists, v_prev from public.cafe_comments where cafe_id = p_cafe and user_id = v_uid;
  if coalesce(v_exists, false) then
    if v_prev > now() - interval '20 seconds' then return jsonb_build_object('ok', false, 'error', 'rate'); end if;
  else
    select count(*) into v_recent from public.cafe_comments where user_id = v_uid and created_at > now() - interval '24 hours';
    if v_recent >= 5 then return jsonb_build_object('ok', false, 'error', 'rate'); end if;
  end if;
  insert into public.cafe_comments (cafe_id, user_id, body) values (p_cafe, v_uid, v_body)
  on conflict (cafe_id, user_id) do update set body = excluded.body, edited_at = now(), removed = false
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.post_cafe_comment(uuid, text) from public;
grant execute on function public.post_cafe_comment(uuid, text) to authenticated;

create or replace function public.cafe_comments_list(p_cafe uuid, p_limit integer default 30, p_offset integer default 0)
returns table(id bigint, body text, created_at timestamptz, edited_at timestamptz, name text, avatar text, level integer, visited boolean, mine boolean, hidden boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.body, c.created_at, c.edited_at,
         coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), coalesce(p.level, 1),
         exists (select 1 from public.checkins k where k.cafe_id = c.cafe_id and k.user_id = c.user_id),
         (c.user_id = auth.uid()), c.hidden
    from public.cafe_comments c
    join public.profiles p on p.id = c.user_id
   where c.cafe_id = p_cafe and not c.removed and (not c.hidden or c.user_id = auth.uid())
   order by (c.user_id = auth.uid()) desc, c.created_at desc
   limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0)
$$;
revoke all on function public.cafe_comments_list(uuid, integer, integer) from public;
grant execute on function public.cafe_comments_list(uuid, integer, integer) to anon, authenticated;

create or replace function public.cafe_comment_count(p_cafe uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.cafe_comments where cafe_id = p_cafe and not hidden and not removed
$$;
revoke all on function public.cafe_comment_count(uuid) from public;
grant execute on function public.cafe_comment_count(uuid) to anon, authenticated;

create or replace function public.remove_my_cafe_comment(p_cafe uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return false; end if;
  update public.cafe_comments set removed = true, edited_at = now() where cafe_id = p_cafe and user_id = auth.uid();
  return true;
end $$;
revoke all on function public.remove_my_cafe_comment(uuid) from public;
grant execute on function public.remove_my_cafe_comment(uuid) to authenticated;

-- three different people reporting a comment hides it until the owner reviews it
create or replace function public.report_cafe_comment(p_id bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_n integer;
begin
  if auth.uid() is null then return false; end if;
  select user_id into v_owner from public.cafe_comments where id = p_id;
  if v_owner is null or v_owner = auth.uid() then return false; end if;
  insert into public.cafe_comment_reports (comment_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
  select count(*) into v_n from public.cafe_comment_reports where comment_id = p_id;
  update public.cafe_comments set report_count = v_n, hidden = (hidden or v_n >= 3) where id = p_id;
  return true;
end $$;
revoke all on function public.report_cafe_comment(bigint) from public;
grant execute on function public.report_cafe_comment(bigint) to authenticated;

-- ── 3) leaderboard ──────────────────────────────────────────────────────────────────────────────
-- scopes: 'week' (XP earned since Saturday 00:00 Tehran, from xp_history), 'all' (profiles.xp), 'region' (XP from check-ins in one district)
-- Business accounts are not players and never appear. Streak shows 0 once it has lapsed.
create or replace function public.leaderboard_all(p_scope text, p_region text)
returns table(user_id uuid, name text, avatar text, xp bigint, level integer, streak integer, checkins integer, cafes integer, rank integer)
language plpgsql stable security definer set search_path = '' as $$
declare v_week timestamptz; v_today date := (now() at time zone 'Asia/Tehran')::date;
begin
  v_week := (date_trunc('week', (now() at time zone 'Asia/Tehran') + interval '2 days') - interval '2 days') at time zone 'Asia/Tehran';
  if p_scope = 'week' then
    return query
      with s as (select h.user_id as uid, sum(h.amount)::bigint as pts from public.xp_history h where h.created_at >= v_week and h.amount > 0 group by h.user_id)
      select p.id, coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), s.pts, coalesce(p.level, 1),
             case when p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             coalesce(u.checkin_count, 0), coalesce(u.cafe_count, 0),
             (rank() over (order by s.pts desc))::integer
        from s join public.profiles p on p.id = s.uid left join public.user_public_stats u on u.user_id = p.id
       where coalesce(p.account_type, 'user') <> 'sme';
  elsif p_scope = 'region' then
    return query
      select p.id, coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), r.region_xp::bigint, coalesce(p.level, 1),
             case when p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             r.region_checkins::integer, coalesce(u.cafe_count, 0),
             (rank() over (order by r.region_xp desc))::integer
        from public.region_leaderboard r join public.profiles p on p.id = r.user_id left join public.user_public_stats u on u.user_id = p.id
       where r.region = p_region and coalesce(p.account_type, 'user') <> 'sme';
  else
    return query
      select p.id, coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), coalesce(p.xp, 0)::bigint, coalesce(p.level, 1),
             case when p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             coalesce(u.checkin_count, 0), coalesce(u.cafe_count, 0),
             (rank() over (order by coalesce(p.xp, 0) desc))::integer
        from public.profiles p left join public.user_public_stats u on u.user_id = p.id
       where coalesce(p.account_type, 'user') <> 'sme';
  end if;
end $$;
revoke all on function public.leaderboard_all(text, text) from public;

create or replace function public.leaderboard_get(p_scope text default 'all', p_region text default null, p_limit integer default 50)
returns table(user_id uuid, name text, avatar text, xp bigint, level integer, streak integer, checkins integer, cafes integer, rank integer, me boolean)
language sql stable security definer set search_path = '' as $$
  select a.*, (a.user_id = auth.uid())
    from public.leaderboard_all(p_scope, p_region) a
   order by a.rank, a.name
   limit least(greatest(coalesce(p_limit, 50), 1), 100)
$$;
revoke all on function public.leaderboard_get(text, text, integer) from public;
grant execute on function public.leaderboard_get(text, text, integer) to anon, authenticated;

-- the caller's own place: rank, total, and how many XP to the person right above
create or replace function public.leaderboard_me(p_scope text default 'all', p_region text default null)
returns table(rank integer, xp bigint, total integer, gap_up bigint, next_name text)
language sql stable security definer set search_path = '' as $$
  with a as (select * from public.leaderboard_all(p_scope, p_region)),
       me as (select * from a where a.user_id = auth.uid()),
       up as (select x.xp, x.name from a x where x.xp > (select xp from me) order by x.xp asc, x.name limit 1)
  select me.rank, me.xp, (select count(*)::integer from a),
         coalesce((select up.xp from up) - me.xp, 0), (select up.name from up)
    from me
$$;
revoke all on function public.leaderboard_me(text, text) from public;
grant execute on function public.leaderboard_me(text, text) to authenticated;

-- which districts have players, for the region tab chips
create or replace function public.leaderboard_regions() returns table(region text, players integer)
language sql stable security definer set search_path = '' as $$
  select r.region, count(*)::integer from public.region_leaderboard r
    join public.profiles p on p.id = r.user_id and coalesce(p.account_type, 'user') <> 'sme'
   group by r.region order by count(*) desc, r.region limit 12
$$;
revoke all on function public.leaderboard_regions() from public;
grant execute on function public.leaderboard_regions() to anon, authenticated;

-- ── 4) phone login: one-time codes, used only by the Edge Function phone-auth (service role) ────
create table if not exists public.phone_otps (
  id         bigint generated always as identity primary key,
  phone      text not null,
  code_hash  text not null,
  expires_at timestamptz not null,
  attempts   integer not null default 0,
  used       boolean not null default false,
  ip_hash    text,
  created_at timestamptz not null default now()
);
create index if not exists phone_otps_phone_idx on public.phone_otps (phone, created_at desc);
create index if not exists phone_otps_ip_idx on public.phone_otps (ip_hash, created_at desc);
alter table public.phone_otps enable row level security;
revoke all on public.phone_otps from anon, authenticated;

-- ── phone accounts: which Supabase user belongs to which hashed phone number ──
create table if not exists public.phone_accounts (
  phone_hash text primary key,
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);
alter table public.phone_accounts enable row level security;
revoke all on public.phone_accounts from anon, authenticated;

-- NOTE: applied to project pkkdepecbzrnmejnseqg on 2026-10-13 in small execute_sql batches
-- (apply_migration timed out at 180 s). Comments use soft delete (column "removed") because
-- DELETE/DROP statements hang in the MCP gate. Edge function source: ../edge/phone-auth.ts
-- (deployed as "phone-auth", verify_jwt = false; the function checks the Origin header itself).
