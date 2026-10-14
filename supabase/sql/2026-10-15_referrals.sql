-- ─────────────────────────────────────────────────────────────
--  TwinLand — 2026-10-15 — invite a friend, both get a reward
--  Both people get 150 XP when the invited friend makes a first real check-in
--  (do_checkin already checks GPS distance, cooldown and impossible travel).
--  Rules: the account is at most 7 days old and has no check-ins when the code is
--  claimed, no self-invites or two-way invites, business accounts excluded, and an
--  inviter is paid for at most 20 friends in 30 days. Rewards use tl_award_system.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.referral_codes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  invitee uuid primary key references public.profiles(id) on delete cascade,
  inviter uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  status text not null default 'pending' check (status in ('pending', 'rewarded', 'capped')),
  created_at timestamptz not null default now(),
  rewarded_at timestamptz
);
create index if not exists referrals_inviter_idx on public.referrals (inviter, status, rewarded_at);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
revoke all on public.referral_codes, public.referrals from anon, authenticated;

create or replace function public.my_referral() returns jsonb
language plpgsql security definer set search_path = '' as $function$
declare v_uid uuid := auth.uid(); v_code text; v_try integer := 0;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if exists (select 1 from public.profiles where id = v_uid and account_type = 'sme') then
    return jsonb_build_object('ok', false, 'error', 'business'); end if;
  select code into v_code from public.referral_codes where user_id = v_uid;
  while v_code is null and v_try < 8 loop
    v_try := v_try + 1;
    select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::integer, 1), '') into v_code
      from generate_series(1, 6);
    begin
      insert into public.referral_codes (user_id, code) values (v_uid, v_code);
    exception when unique_violation then
      v_code := null;
      select code into v_code from public.referral_codes where user_id = v_uid;
    end;
  end loop;
  return jsonb_build_object('ok', true, 'code', v_code, 'reward', 150,
    'invited', (select count(*) from public.referrals where inviter = v_uid),
    'rewarded', (select count(*) from public.referrals where inviter = v_uid and status = 'rewarded'),
    'pending', (select count(*) from public.referrals where inviter = v_uid and status = 'pending'),
    'invited_by', exists (select 1 from public.referrals where invitee = v_uid));
end $function$;
revoke all on function public.my_referral() from public, anon;
grant execute on function public.my_referral() to authenticated;

create or replace function public.claim_referral(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $function$
declare v_uid uuid := auth.uid(); v_code text := upper(btrim(coalesce(p_code, ''))); v_inviter uuid; v_created timestamptz;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if v_code !~ '^[A-Z2-9]{6}$' then return jsonb_build_object('ok', false, 'error', 'code'); end if;
  select user_id into v_inviter from public.referral_codes where code = v_code;
  if v_inviter is null then return jsonb_build_object('ok', false, 'error', 'code'); end if;
  if v_inviter = v_uid then return jsonb_build_object('ok', false, 'error', 'self'); end if;
  if exists (select 1 from public.referrals where invitee = v_uid) then return jsonb_build_object('ok', false, 'error', 'already'); end if;
  if exists (select 1 from public.referrals where invitee = v_inviter and inviter = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'loop'); end if;
  if exists (select 1 from public.profiles where id = v_uid and account_type = 'sme') then
    return jsonb_build_object('ok', false, 'error', 'business'); end if;
  select created_at into v_created from auth.users where id = v_uid;
  if v_created is null or v_created < now() - interval '7 days' then return jsonb_build_object('ok', false, 'error', 'old'); end if;
  if exists (select 1 from public.checkins where user_id = v_uid) then return jsonb_build_object('ok', false, 'error', 'old'); end if;
  insert into public.referrals (invitee, inviter, code) values (v_uid, v_inviter, v_code) on conflict do nothing;
  perform public.push_notification(v_inviter, 'referral_join', '🎁 دوستت به TwinLand آمد',
    'وقتی اولین چک‌این واقعی‌اش را بزند، هر دو 150 امتیاز می‌گیرید.', '🎁', null);
  return jsonb_build_object('ok', true, 'reward', 150);
end $function$;
revoke all on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;

create or replace function public.tl_referral_on_checkin() returns trigger
language plpgsql security definer set search_path = '' as $function$
declare v_inviter uuid; v_paid integer;
begin
  select inviter into v_inviter from public.referrals where invitee = new.user_id and status = 'pending' for update;
  if v_inviter is null then return new; end if;
  if coalesce(new.xp_awarded, new.xp_earned, 0) <= 0 then return new; end if;
  select count(*) into v_paid from public.referrals
   where inviter = v_inviter and status = 'rewarded' and rewarded_at > now() - interval '30 days';
  perform public.tl_award_system(new.user_id, 150, 'referral_invitee');
  perform public.push_notification(new.user_id, 'referral_reward', '🎁 جایزه دعوت',
    'برای اولین چک‌این با دعوت دوستت 150 امتیاز گرفتی.', '🎁', null);
  if v_paid < 20 then
    perform public.tl_award_system(v_inviter, 150, 'referral_inviter');
    perform public.push_notification(v_inviter, 'referral_reward', '🎁 جایزه دعوت رسید',
      'دوستت اولین چک‌این را زد و 150 امتیاز گرفتی.', '🎁', '/profile');
    update public.referrals set status = 'rewarded', rewarded_at = now() where invitee = new.user_id;
  else
    update public.referrals set status = 'capped', rewarded_at = now() where invitee = new.user_id;
  end if;
  return new;
exception when others then
  -- a referral problem must never break a check-in
  return new;
end $function$;
revoke all on function public.tl_referral_on_checkin() from public, anon, authenticated;
create trigger checkins_referral after insert on public.checkins
  for each row execute function public.tl_referral_on_checkin();
