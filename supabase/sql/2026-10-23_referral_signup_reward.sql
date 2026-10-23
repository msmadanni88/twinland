-- ─────────────────────────────────────────────────────────────
--  دعوت دوست: جایزه همان لحظه ثبت‌نام، نشان‌های پله‌ای دعوت‌کننده — 2026-10-23
--
--  قبلاً جایزه 150 امتیازی بعد از اولین چک‌این دوست دعوت‌شده داده می‌شد. حالا:
--   1. claim_referral همان لحظه ثبت‌نام به هر دو نفر 150 امتیاز می‌دهد و کارت عمومی دعوت‌کننده را برمی‌گرداند
--      تا پنجره خوش‌آمد بتواند چهره و نامش را نشان دهد
--   2. سقف دعوت‌کننده مثل قبل: هر 30 روز حداکثر 20 جایزه. بعد از سقف، دوست تازه باز هم جایزه‌اش را می‌گیرد
--   3. دعوت‌کننده نشان پله‌ای می‌گیرد: 1، 3، 5، 10 و 25 دعوت موفق، هر پله ارزشمندتر
--   4. همه دعوت‌های منتظر قدیمی همین حالا جایزه می‌گیرند
--   5. public_profile برای هر نشان کد و کمیابی را هم می‌دهد تا نشان دعوت در پروفایل عمومی هم درست کشیده شود
--  قاعده‌های ضدتقلب claim_referral دست نخورده: حساب تازه زیر 7 روز، بدون چک‌این، نه کسب‌وکار، نه خودش، نه دور
--  تابع‌های جایزه و نشان فقط از داخل دیتابیس صدا زده می‌شوند و برای کاربر بسته‌اند.
--  پله‌ها با lib/growth/referralTiers.js یکی است؛ اگر یکی عوض شد، دیگری هم.
-- ─────────────────────────────────────────────────────────────

create or replace function public.tl_fa_digits(p text)
returns text language sql immutable set search_path to ''
as $$ select translate(coalesce(p, ''), '0123456789', '۰۱۲۳۴۵۶۷۸۹') $$;

-- نشان‌های پله‌ای دعوت‌کننده؛ خروجی: بالاترین نشانی که همین حالا تازه گرفته شد، یا null
create or replace function public.tl_referral_badges(p_inviter uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_n integer; v_new jsonb := null; t record;
begin
  if p_inviter is null then return null; end if;
  select count(*) into v_n from public.referrals where inviter = p_inviter and status in ('rewarded', 'capped');
  for t in
    select * from (values
      (1,  'ref_1',  'دعوت‌کننده', '🤝', 'common'),
      (3,  'ref_3',  'میزبان',     '🎟', 'rare'),
      (5,  'ref_5',  'سفیر',       '🎖', 'rare'),
      (10, 'ref_10', 'چهره محله',  '🏅', 'epic'),
      (25, 'ref_25', 'افسانه شهر', '👑', 'legendary')
    ) as x(need, code, title, icon, rarity)
    order by need
  loop
    exit when v_n < t.need;
    insert into public.awards (user_id, kind, code, title, icon, rarity, source)
    values (p_inviter, 'badge', t.code, t.title, t.icon, t.rarity, 'platform')
    on conflict (user_id, code) do nothing;
    if found then
      v_new := jsonb_build_object('code', t.code, 'title', t.title, 'icon', t.icon, 'rarity', t.rarity, 'need', t.need, 'count', v_n);
    end if;
  end loop;
  return v_new;
end $$;

-- جایزه یک دعوت منتظر: به دوست تازه و، اگر سقف پر نشده، به دعوت‌کننده؛ با اعلان برای هر دو
create or replace function public.tl_referral_reward(p_invitee uuid)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare
  r record; v_paid integer; v_status text; v_badge jsonb;
  v_inviter_name text; v_invitee_name text; v_inviter_link text; v_invitee_link text;
begin
  select * into r from public.referrals where invitee = p_invitee and status = 'pending' for update;
  if not found then return null; end if;

  select count(*) into v_paid from public.referrals
   where inviter = r.inviter and status = 'rewarded' and rewarded_at > now() - interval '30 days';
  v_status := case when v_paid < 20 then 'rewarded' else 'capped' end;

  perform public.tl_award_system(r.invitee, 150, 'referral_invitee');
  if v_status = 'rewarded' then
    perform public.tl_award_system(r.inviter, 150, 'referral_inviter');
  end if;
  update public.referrals set status = v_status, rewarded_at = now() where invitee = r.invitee;

  v_inviter_name := public.tl_public_name(r.inviter);
  v_invitee_name := public.tl_public_name(r.invitee);
  -- پیوند پروفایل فقط وقتی که آن نفر پروفایلش را عمومی گذاشته است
  select case when public.tl_priv(p.privacy, 'profile_public', true) then '/profile?u=' || p.id end
    into v_inviter_link from public.profiles p where p.id = r.inviter;
  select case when public.tl_priv(p.privacy, 'profile_public', true) then '/profile?u=' || p.id end
    into v_invitee_link from public.profiles p where p.id = r.invitee;

  perform public.push_notification(r.invitee, 'referral_welcome', 'جایزه خوش‌آمد',
    case when v_status = 'rewarded'
      then 'با دعوت ' || v_inviter_name || ' آمدی و هر دو ۱۵۰ امتیاز گرفتید.'
      else 'با دعوت ' || v_inviter_name || ' آمدی و ۱۵۰ امتیاز گرفتی.' end,
    '🎁', v_inviter_link);

  if v_status = 'rewarded' then
    perform public.push_notification(r.inviter, 'referral_reward', 'دوستت با دعوت تو آمد',
      v_invitee_name || ' با پیوند تو ثبت‌نام کرد و هر دو ۱۵۰ امتیاز گرفتید.', '🎁', v_invitee_link);
  else
    perform public.push_notification(r.inviter, 'referral_join', 'دوستت با دعوت تو آمد',
      v_invitee_name || ' با پیوند تو ثبت‌نام کرد. سقف ۲۰ جایزه دعوت در ۳۰ روز پر شده، پس این بار فقط دوستت امتیاز گرفت.', '🎁', v_invitee_link);
  end if;

  v_badge := public.tl_referral_badges(r.inviter);
  if v_badge is not null then
    perform public.push_notification(r.inviter, 'referral_badge', 'نشان تازه: ' || (v_badge->>'title'),
      'برای ' || public.tl_fa_digits(v_badge->>'need') || ' دعوت موفق. هر چه دوستان بیشتری بیایند، نشان بعدی ارزشمندتر است.',
      '🏅', '/profile?tab=badges');
  end if;

  return jsonb_build_object('status', v_status, 'badge', v_badge);
end $$;

-- ثبت کد دعوت بعد از ثبت‌نام؛ جایزه همان لحظه
create or replace function public.claim_referral(p_code text)
returns jsonb language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid := auth.uid(); v_code text := upper(btrim(coalesce(p_code, ''))); v_inviter uuid; v_created timestamptz; v_res jsonb;
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
  if not found then return jsonb_build_object('ok', false, 'error', 'already'); end if;
  v_res := public.tl_referral_reward(v_uid);

  return jsonb_build_object('ok', true, 'reward', 150,
    'both', coalesce(v_res->>'status', '') = 'rewarded',
    'inviter', public.tl_card(v_inviter),
    'xp', (select xp from public.profiles where id = v_uid));
end $$;

-- دعوت منتظر قدیمی، اگر هنوز مانده باشد، با اولین چک‌این جایزه‌اش را می‌گیرد
create or replace function public.tl_referral_on_checkin()
returns trigger language plpgsql security definer set search_path to ''
as $$
begin
  if exists (select 1 from public.referrals where invitee = new.user_id and status = 'pending') then
    perform public.tl_referral_reward(new.user_id);
  end if;
  return new;
exception when others then
  return new;
end $$;

-- تابع‌های داخلی برای کاربر بسته
revoke all on function public.tl_referral_badges(uuid) from public, anon, authenticated;
revoke all on function public.tl_referral_reward(uuid) from public, anon, authenticated;
revoke all on function public.tl_fa_digits(text) from public, anon, authenticated;
grant execute on function public.claim_referral(text) to authenticated;

-- نشان‌ها در پروفایل عمومی: کد و کمیابی هم
do $$
declare d text; a text := $x$jsonb_build_object('icon', a.icon, 'title', a.title, 'at', a.earned_at)$x$;
        b text := $x$jsonb_build_object('icon', a.icon, 'title', a.title, 'code', a.code, 'rarity', a.rarity, 'at', a.earned_at)$x$;
begin
  select pg_get_functiondef('public.public_profile(uuid)'::regprocedure) into d;
  if position(b in d) > 0 then return; end if;
  if position(a in d) = 0 then raise exception 'public_profile badges block not found'; end if;
  execute replace(d, a, b);
end $$;

-- مالک اپ با حساب کسب‌وکار بازی می‌کند و کد دعوت دارد؛ پروفایل عمومی‌اش هم مثل کاربرها باز می‌شود
do $$
declare d text;
        a text := $x$if not v_self and coalesce(r.account_type, 'user') = 'sme' then$x$;
        b text := $x$if not v_self and coalesce(r.account_type, 'user') = 'sme' and r.id is distinct from public.tl_owner_id() then$x$;
begin
  select pg_get_functiondef('public.public_profile(uuid)'::regprocedure) into d;
  if position(b in d) > 0 then return; end if;
  if position(a in d) = 0 then raise exception 'public_profile sme block not found'; end if;
  execute replace(d, a, b);
end $$;

-- جایزه دعوت‌های منتظر قدیمی، همین حالا
do $$
declare r record;
begin
  for r in select invitee from public.referrals where status = 'pending' order by created_at loop
    perform public.tl_referral_reward(r.invitee);
  end loop;
end $$;
