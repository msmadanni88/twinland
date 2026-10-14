-- ─────────────────────────────────────────────────────────────
--  TwinLand — 2026-10-15
--  1) security: profiles readable only by their owner, small hardening
--  2) app owner out of the leaderboard
--  3) comments: admin moderation, business replies, feed with replies
--  4) weekly league with prizes
--  5) referrals with a reward for both people
--  6) web push: subscriptions, keys, hook on notifications
--  Applied with execute_sql in small batches (apply_migration times out).
--  No DROP or DELETE anywhere: the MCP gate hangs on them.
-- ─────────────────────────────────────────────────────────────

-- ═════ 1. security ═════════════════════════════════════════════
-- profiles: the old policy let anyone, signed in or not, read every row
alter policy profiles_read_all on public.profiles to authenticated using (auth.uid() = id);
alter policy profiles_read_all on public.profiles rename to profiles_read_own;
revoke all on public.profiles from anon;

-- public cards for other people: name, avatar, xp and level only
create or replace function public.public_profiles(p_ids uuid[])
returns table(id uuid, name text, avatar text, xp integer, level integer)
language sql stable security definer set search_path = '' as $$
  select p.id, coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'),
         coalesce(p.xp, 0), coalesce(p.level, 1)
    from public.profiles p
   where p.id = any (coalesce(p_ids[1:200], '{}'::uuid[]))
$$;
revoke all on function public.public_profiles(uuid[]) from public, anon;
grant execute on function public.public_profiles(uuid[]) to authenticated;

-- functions that mean nothing without a signed-in user
revoke execute on function public.tl_checkin_milestones() from public, anon, authenticated;
revoke execute on function public.post_cafe_comment(uuid, text) from public, anon;
revoke execute on function public.remove_my_cafe_comment(uuid) from public, anon;
revoke execute on function public.report_cafe_comment(bigint) from public, anon;
revoke execute on function public.my_explore() from public, anon;
grant execute on function public.post_cafe_comment(uuid, text), public.remove_my_cafe_comment(uuid),
  public.report_cafe_comment(bigint), public.my_explore() to authenticated;
alter function public.tl_milestone_steps(integer) set search_path = '';

-- system awards. award_xp refuses to give XP to anyone but the caller, and stays that way.
-- League and referral rewards go through this server-only function instead. No client
-- role can execute it; only other security definer functions call it.
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

-- ═════ 2. app owner out of the leaderboard ═════════════════════
create or replace function public.tl_owner_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u where lower(u.email) = 'msmadani88@gmail.com' limit 1
$$;
revoke all on function public.tl_owner_id() from public, anon, authenticated;

create or replace function public.leaderboard_all(p_scope text, p_region text)
returns table(user_id uuid, name text, avatar text, xp bigint, level integer, streak integer, checkins integer, cafes integer, rank integer)
language plpgsql stable security definer set search_path = '' as $function$
declare v_week timestamptz; v_today date := (now() at time zone 'Asia/Tehran')::date; v_owner uuid := public.tl_owner_id();
begin
  v_week := (date_trunc('week', (now() at time zone 'Asia/Tehran') + interval '2 days') - interval '2 days') at time zone 'Asia/Tehran';
  if p_scope = 'week' then
    return query
      with s as (select h.user_id as uid, sum(h.amount)::bigint as pts from public.xp_history h
                  where h.created_at >= v_week and h.amount > 0 group by h.user_id)
      select p.id, coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), s.pts, coalesce(p.level, 1),
             case when p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             coalesce(u.checkin_count, 0), coalesce(u.cafe_count, 0),
             (rank() over (order by s.pts desc))::integer
        from s join public.profiles p on p.id = s.uid left join public.user_public_stats u on u.user_id = p.id
       where coalesce(p.account_type, 'user') <> 'sme' and p.id is distinct from v_owner;
  elsif p_scope = 'region' then
    return query
      select p.id, coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), r.region_xp::bigint, coalesce(p.level, 1),
             case when p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             r.region_checkins::integer, coalesce(u.cafe_count, 0),
             (rank() over (order by r.region_xp desc))::integer
        from public.region_leaderboard r join public.profiles p on p.id = r.user_id left join public.user_public_stats u on u.user_id = p.id
       where r.region = p_region and coalesce(p.account_type, 'user') <> 'sme' and p.id is distinct from v_owner;
  else
    return query
      select p.id, coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), coalesce(p.xp, 0)::bigint, coalesce(p.level, 1),
             case when p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             coalesce(u.checkin_count, 0), coalesce(u.cafe_count, 0),
             (rank() over (order by coalesce(p.xp, 0) desc))::integer
        from public.profiles p left join public.user_public_stats u on u.user_id = p.id
       where coalesce(p.account_type, 'user') <> 'sme' and p.id is distinct from v_owner;
  end if;
end $function$;

create or replace function public.leaderboard_regions()
returns table(region text, players integer)
language sql stable security definer set search_path = '' as $$
  select r.region, count(*)::integer from public.region_leaderboard r
    join public.profiles p on p.id = r.user_id and coalesce(p.account_type, 'user') <> 'sme'
   where p.id is distinct from public.tl_owner_id()
   group by r.region order by count(*) desc, r.region limit 12
$$;

-- ═════ 3. comments ══════════════════════════════════════════════
alter table public.cafe_comments
  add column if not exists reply_body text,
  add column if not exists reply_at timestamptz,
  add column if not exists reply_by uuid,
  add column if not exists mod_locked boolean not null default false,
  add column if not exists mod_at timestamptz;

-- reports cannot re-hide a comment the platform owner already reviewed
create or replace function public.report_cafe_comment(p_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $function$
declare v_owner uuid; v_n integer;
begin
  if auth.uid() is null then return false; end if;
  select user_id into v_owner from public.cafe_comments where id = p_id;
  if v_owner is null or v_owner = auth.uid() then return false; end if;
  insert into public.cafe_comment_reports (comment_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
  select count(*) into v_n from public.cafe_comment_reports where comment_id = p_id;
  update public.cafe_comments
     set report_count = v_n,
         hidden = case when mod_locked then hidden else (hidden or v_n >= 3) end
   where id = p_id;
  return true;
end $function$;

-- an author cannot bring back a comment the platform owner removed
create or replace function public.post_cafe_comment(p_cafe uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare
  v_uid uuid := auth.uid();
  v_acct text; v_body text; v_flat text; v_id bigint; v_recent integer; v_prev timestamptz; v_exists boolean; v_blocked boolean;
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
  select true, coalesce(edited_at, created_at), (removed and mod_locked) into v_exists, v_prev, v_blocked
    from public.cafe_comments where cafe_id = p_cafe and user_id = v_uid;
  if coalesce(v_blocked, false) then return jsonb_build_object('ok', false, 'error', 'blocked'); end if;
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
end $function$;

-- the list the app and the public page read: same as cafe_comments_list plus the business reply
create or replace function public.cafe_comments_feed(p_cafe uuid, p_limit integer default 30, p_offset integer default 0)
returns table(id bigint, body text, created_at timestamptz, edited_at timestamptz, name text, avatar text, level integer,
              visited boolean, mine boolean, hidden boolean, reply_body text, reply_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.body, c.created_at, c.edited_at,
         coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), coalesce(p.level, 1),
         exists (select 1 from public.checkins k where k.cafe_id = c.cafe_id and k.user_id = c.user_id),
         (c.user_id = auth.uid()), c.hidden, c.reply_body, c.reply_at
    from public.cafe_comments c
    join public.profiles p on p.id = c.user_id
   where c.cafe_id = p_cafe and not c.removed and (not c.hidden or c.user_id = auth.uid())
   order by (c.user_id = auth.uid()) desc, c.created_at desc
   limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0)
$$;
grant execute on function public.cafe_comments_feed(uuid, integer, integer) to anon, authenticated;

-- platform owner: the moderation queue
create or replace function public.admin_comments_queue(p_filter text default 'reported', p_limit integer default 60)
returns table(id bigint, cafe_id uuid, cafe_name text, body text, author text, created_at timestamptz,
              report_count integer, hidden boolean, removed boolean, mod_locked boolean, reply_body text)
language plpgsql stable security definer set search_path = '' as $function$
begin
  if not public.is_app_owner() then return; end if;
  return query
    select c.id, c.cafe_id, f.name, c.body, coalesce(nullif(p.display_name, ''), 'کاربر'), c.created_at,
           c.report_count, c.hidden, c.removed, c.mod_locked, c.reply_body
      from public.cafe_comments c
      join public.cafes f on f.id = c.cafe_id
      left join public.profiles p on p.id = c.user_id
     where case when p_filter = 'all' then true
                when p_filter = 'hidden' then c.hidden and not c.removed
                else (c.report_count > 0 or c.hidden) and not c.removed end
     order by (c.hidden and not c.mod_locked) desc, c.report_count desc, c.created_at desc
     limit least(greatest(coalesce(p_limit, 60), 1), 200);
end $function$;
revoke all on function public.admin_comments_queue(text, integer) from public, anon;
grant execute on function public.admin_comments_queue(text, integer) to authenticated;

create or replace function public.admin_comment_moderate(p_id bigint, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare v_user uuid;
begin
  if not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  select user_id into v_user from public.cafe_comments where id = p_id;
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if p_action = 'hide' then
    update public.cafe_comments set hidden = true, mod_locked = true, mod_at = now() where id = p_id;
    perform public.push_notification(v_user, 'comment_hidden', 'نظرت پنهان شد',
      'یکی از نظرهایت با قاعده‌های نظر جور نبود و پنهان شد. فقط خودت آن را می‌بینی.', '🙈', null);
  elsif p_action = 'restore' then
    update public.cafe_comments set hidden = false, removed = false, mod_locked = true, mod_at = now() where id = p_id;
  elsif p_action = 'remove' then
    update public.cafe_comments set removed = true, hidden = true, mod_locked = true, mod_at = now() where id = p_id;
  elsif p_action = 'clear_reply' then
    update public.cafe_comments set reply_body = null, reply_at = null, reply_by = null where id = p_id;
  else
    return jsonb_build_object('ok', false, 'error', 'action');
  end if;
  return jsonb_build_object('ok', true);
end $function$;
revoke all on function public.admin_comment_moderate(bigint, text) from public, anon;
grant execute on function public.admin_comment_moderate(bigint, text) to authenticated;

-- business: comments of its own place, unanswered first
create or replace function public.business_comments(p_business_id bigint, p_limit integer default 30, p_offset integer default 0)
returns table(id bigint, body text, created_at timestamptz, edited_at timestamptz, name text, avatar text, level integer,
              visited boolean, hidden boolean, reply_body text, reply_at timestamptz, total integer, unanswered integer)
language plpgsql stable security definer set search_path = '' as $function$
declare v_cafe uuid;
begin
  select b.cafe_id into v_cafe from public.businesses b
   where b.id = p_business_id and b.owner_id = auth.uid() and b.status = 'verified';
  if v_cafe is null and public.is_app_owner() then
    select b.cafe_id into v_cafe from public.businesses b where b.id = p_business_id;
  end if;
  if v_cafe is null then return; end if;
  return query
    with base as (select c.* from public.cafe_comments c where c.cafe_id = v_cafe and not c.removed)
    select c.id, c.body, c.created_at, c.edited_at,
           coalesce(nullif(p.display_name, ''), 'کاربر'), coalesce(p.avatar_emoji, '☕'), coalesce(p.level, 1),
           exists (select 1 from public.checkins k where k.cafe_id = c.cafe_id and k.user_id = c.user_id),
           c.hidden, c.reply_body, c.reply_at,
           (select count(*)::integer from base),
           (select count(*)::integer from base b2 where b2.reply_body is null and not b2.hidden)
      from base c left join public.profiles p on p.id = c.user_id
     order by (c.reply_body is null and not c.hidden) desc, c.created_at desc
     limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0);
end $function$;
revoke all on function public.business_comments(bigint, integer, integer) from public, anon;
grant execute on function public.business_comments(bigint, integer, integer) to authenticated;

create or replace function public.business_reply_comment(p_comment_id bigint, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare
  v_cafe uuid; v_author uuid; v_prev_reply text; v_prev_at timestamptz; v_name text; v_body text; v_flat text;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select c.cafe_id, c.user_id, c.reply_body, c.reply_at, f.name into v_cafe, v_author, v_prev_reply, v_prev_at, v_name
    from public.cafe_comments c join public.cafes f on f.id = c.cafe_id
   where c.id = p_comment_id and not c.removed;
  if v_cafe is null then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if not exists (select 1 from public.businesses b where b.cafe_id = v_cafe and b.owner_id = auth.uid() and b.status = 'verified')
     and not public.is_app_owner() then
    return jsonb_build_object('ok', false, 'error', 'denied');
  end if;
  if v_prev_at is not null and v_prev_at > now() - interval '20 seconds' then
    return jsonb_build_object('ok', false, 'error', 'rate');
  end if;
  v_body := public.tl_clean_text(p_body);
  if char_length(v_body) = 0 then
    update public.cafe_comments set reply_body = null, reply_at = null, reply_by = null where id = p_comment_id;
    return jsonb_build_object('ok', true, 'cleared', true);
  end if;
  if char_length(v_body) < 2   then return jsonb_build_object('ok', false, 'error', 'short'); end if;
  if char_length(v_body) > 400 then return jsonb_build_object('ok', false, 'error', 'long');  end if;
  if v_body ~* '(https?:|www\.|t\.me/|@[a-z0-9_]{3,}|\.(com|ir|net|org|me|co|io)([^a-z]|$))' then return jsonb_build_object('ok', false, 'error', 'no_links'); end if;
  v_flat := regexp_replace(translate(v_body, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'), '[\s\-\.\+]', '', 'g');
  if v_flat ~ '[0-9]{8,}' then return jsonb_build_object('ok', false, 'error', 'no_phone'); end if;
  update public.cafe_comments set reply_body = v_body, reply_at = now(), reply_by = auth.uid() where id = p_comment_id;
  if v_prev_reply is null then
    perform public.push_notification(v_author, 'comment_reply', v_name || ' به نظرت جواب داد', left(v_body, 120), '💬', null);
  end if;
  return jsonb_build_object('ok', true);
end $function$;
revoke all on function public.business_reply_comment(bigint, text) from public, anon;
grant execute on function public.business_reply_comment(bigint, text) to authenticated;

-- the public café page shows the average stars
grant execute on function public.cafe_rating(uuid) to anon;
