-- ─────────────────────────────────────────────────────────────
--  TwinLand — پروفایل تازه، حریم خصوصی و عکس پروفایل — 2026-10-18
--
--  1. ستون‌های تازه پروفایل: درباره من، مسیر عکس، آواتار آماده و تنظیم حریم خصوصی
--  2. نام عمومی: اگر کاربر نامش را پنهان کرده، یا نامی نگذاشته، یا نامش همان ابتدای ایمیلش است و خودش تأییدش نکرده،
--     به‌جای آن یک نام مستعار ثابت نشان داده می‌شود. ابتدای ایمیل دیگر هیچ‌جا عمومی دیده نمی‌شود.
--  3. کارت عمومی هر نفر از یک تابع می‌آید: tl_card. همه فهرست‌های نسخه v4.0 همین شکل را می‌گیرند.
--  4. محل نگه‌داری عکس پروفایل با دسترسی فقط به پوشه خود کاربر و سقف چهار فایل
--  5. تابع‌های تازه: ویرایش پروفایل، تنظیم حریم خصوصی، پروفایل عمومی، رتبه‌بندی با عکس، نظرها با عکس و کارت‌های عمومی
--  6. تابع‌ها و نماهای قدیمی همان شکل خروجی را نگه می‌دارند و فقط نام عمومی و آمار را طبق حریم خصوصی برمی‌گردانند
--  7. کد دعوت برای حساب مالک اپ هم ساخته می‌شود
-- ─────────────────────────────────────────────────────────────

-- 1. ستون‌ها
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists avatar_preset text;
alter table public.profiles add column if not exists privacy jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_bio_len') then
    alter table public.profiles add constraint profiles_bio_len check (bio is null or char_length(bio) <= 160);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_privacy_obj') then
    alter table public.profiles add constraint profiles_privacy_obj check (jsonb_typeof(privacy) = 'object');
  end if;
end $$;

-- 2. ابزارهای کوچک
create or replace function public.tl_priv(p jsonb, k text, d boolean) returns boolean
language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(coalesce(p, '{}'::jsonb) -> k) = 'boolean' then (p ->> k)::boolean else d end
$$;

create or replace function public.tl_alias(p_id uuid) returns text
language sql immutable set search_path = '' as $$
  select (array['کاشف','مسافر','رهگذر','شب‌گرد','کتاب‌خوان','نقشه‌خوان','ماجراجو','کافه‌گرد',
                'شهرگرد','قهوه‌شناس','عکاس','نوازنده','نویسنده','پیاده‌رو','ستاره‌شناس','گردشگر'])
           [1 + ((hashtext(p_id::text)::bigint % 16 + 16) % 16)::int]
      || ' ' ||
         (array['آرام','کنجکاو','خندان','سحرخیز','خوش‌سفر','بی‌باک','مهربان','پرانرژی',
                'خیال‌پرداز','خوش‌ذوق','آفتابی','بارانی','باحوصله','تیزبین','بی‌قرار','شاد'])
           [1 + ((hashtext(p_id::text || ':a')::bigint % 16 + 16) % 16)::int]
$$;

create or replace function public.tl_avatar_url(p_path text) returns text
language sql immutable set search_path = '' as $$
  select case when p_path is null or p_path = '' then null
    else 'https://pkkdepecbzrnmejnseqg.supabase.co/storage/v1/object/public/avatars/' || p_path end
$$;

-- نام عمومی هر نفر. فقط شناسه می‌گیرد، پس نمی‌شود با آن چیزی درباره ایمیل کسی حدس زد.
create or replace function public.tl_public_name(p_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select case
    when p.id is null then 'کاربر'
    when not public.tl_priv(p.privacy, 'show_name', true) then public.tl_alias(p.id)
    when nullif(btrim(coalesce(p.display_name, '')), '') is null then public.tl_alias(p.id)
    when lower(btrim(p.display_name)) = lower(split_part(coalesce(u.email, ''), '@', 1))
         and not public.tl_priv(p.privacy, 'name_confirmed', false) then public.tl_alias(p.id)
    else btrim(p.display_name) end
  from (select p_id as id) x
  left join public.profiles p on p.id = x.id
  left join auth.users u on u.id = x.id
$$;

-- کارت عمومی یکسان برای همه فهرست‌ها
create or replace function public.tl_card(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when p.id is null then null else jsonb_build_object(
    'id', p.id,
    'name', public.tl_public_name(p.id),
    'emoji', coalesce(nullif(p.avatar_emoji, ''), '☕'),
    'photo', case when public.tl_priv(p.privacy, 'show_photo', true) then public.tl_avatar_url(p.avatar_path) end,
    'preset', nullif(p.avatar_preset, ''),
    'level', coalesce(p.level, 1),
    'public', public.tl_priv(p.privacy, 'profile_public', true)) end
  from (select p_id as id) x left join public.profiles p on p.id = x.id
$$;

revoke all on function public.tl_priv(jsonb, text, boolean), public.tl_alias(uuid), public.tl_avatar_url(text),
  public.tl_public_name(uuid), public.tl_card(uuid) from public;
grant execute on function public.tl_priv(jsonb, text, boolean), public.tl_alias(uuid), public.tl_avatar_url(text),
  public.tl_public_name(uuid), public.tl_card(uuid) to anon, authenticated;

-- 3. محل عکس پروفایل
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = 524288, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.tl_avatar_files(p_uid uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from storage.objects o
   where o.bucket_id = 'avatars' and (storage.foldername(o.name))[1] = p_uid::text
$$;
revoke all on function public.tl_avatar_files(uuid) from public, anon;
grant execute on function public.tl_avatar_files(uuid) to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars: own folder read') then
    create policy "avatars: own folder read" on storage.objects for select to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars: own folder upload') then
    create policy "avatars: own folder upload" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
                  and array_length(storage.foldername(name), 1) = 1
                  and lower(storage.extension(name)) in ('webp', 'jpg', 'jpeg', 'png')
                  and public.tl_avatar_files(auth.uid()) < 4);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars: own folder delete') then
    create policy "avatars: own folder delete" on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- 4. ویرایش پروفایل خود کاربر؛ ستون‌های تازه فقط از همین راه عوض می‌شوند
create or replace function public.update_my_profile(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); r public.profiles; v_name text; v_bio text; v_city text; v_emoji text; v_preset text; v_path text;
  v_old text; v_priv jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p is null or jsonb_typeof(p) <> 'object' then return jsonb_build_object('ok', false, 'error', 'input'); end if;
  select * into r from public.profiles where id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'profile'); end if;
  v_name := r.display_name; v_bio := r.bio; v_city := r.city; v_emoji := r.avatar_emoji;
  v_preset := r.avatar_preset; v_path := r.avatar_path; v_old := r.avatar_path; v_priv := coalesce(r.privacy, '{}'::jsonb);

  if p ? 'display_name' then
    v_name := regexp_replace(btrim(coalesce(p ->> 'display_name', '')), '\s+', ' ', 'g');
    if char_length(v_name) < 2 or char_length(v_name) > 30 then return jsonb_build_object('ok', false, 'error', 'name_len'); end if;
    if v_name ~* '(https?://|www\.|[<>{}\\]|@)' then return jsonb_build_object('ok', false, 'error', 'name_chars'); end if;
    v_priv := v_priv || jsonb_build_object('name_confirmed', true);
  end if;
  if p ? 'bio' then
    v_bio := nullif(btrim(regexp_replace(coalesce(p ->> 'bio', ''), '[\r\n\t]+', ' ', 'g')), '');
    if v_bio is not null and char_length(v_bio) > 160 then return jsonb_build_object('ok', false, 'error', 'bio_len'); end if;
    if v_bio ~* '(https?://|www\.|\.ir\y|\.com\y|@[a-z0-9_]{3,})' then return jsonb_build_object('ok', false, 'error', 'bio_links'); end if;
  end if;
  if p ? 'city' then
    v_city := p ->> 'city';
    if v_city is null or v_city not in ('tehran','mashhad','isfahan','shiraz','tabriz','karaj','rasht','kish','gorgan') then
      return jsonb_build_object('ok', false, 'error', 'city'); end if;
  end if;
  if p ? 'avatar_emoji' then
    v_emoji := nullif(btrim(coalesce(p ->> 'avatar_emoji', '')), '');
    if v_emoji is not null and (char_length(v_emoji) > 8 or v_emoji ~ '[A-Za-z0-9<>]') then
      return jsonb_build_object('ok', false, 'error', 'emoji'); end if;
  end if;
  if p ? 'avatar_preset' then
    v_preset := nullif(p ->> 'avatar_preset', '');
    if v_preset is not null and v_preset !~ '^[a-z0-9_-]{1,32}$' then return jsonb_build_object('ok', false, 'error', 'preset'); end if;
  end if;
  if p ? 'avatar_path' then
    v_path := nullif(p ->> 'avatar_path', '');
    if v_path is not null then
      if v_path !~ ('^' || v_uid::text || '/[A-Za-z0-9_-]{6,64}\.(webp|jpg|jpeg|png)$') then
        return jsonb_build_object('ok', false, 'error', 'photo_path'); end if;
      if not exists (select 1 from storage.objects o where o.bucket_id = 'avatars' and o.name = v_path) then
        return jsonb_build_object('ok', false, 'error', 'photo_missing'); end if;
    end if;
  end if;

  update public.profiles set display_name = v_name, bio = v_bio, city = v_city, avatar_emoji = coalesce(v_emoji, avatar_emoji),
         avatar_preset = v_preset, avatar_path = v_path, privacy = v_priv, updated_at = now()
   where id = v_uid;
  return jsonb_build_object('ok', true, 'old_path', case when v_old is distinct from v_path then v_old end,
                            'public_name', public.tl_public_name(v_uid));
end $$;

create or replace function public.set_my_privacy(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_add jsonb := '{}'::jsonb; k text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p is null or jsonb_typeof(p) <> 'object' then return jsonb_build_object('ok', false, 'error', 'input'); end if;
  foreach k in array array['profile_public','show_name','show_photo','show_email','show_stats','show_badges','show_clan'] loop
    if jsonb_typeof(p -> k) = 'boolean' then v_add := v_add || jsonb_build_object(k, (p ->> k)::boolean); end if;
  end loop;
  update public.profiles set privacy = coalesce(privacy, '{}'::jsonb) || v_add, updated_at = now() where id = v_uid;
  return jsonb_build_object('ok', true, 'privacy', (select privacy from public.profiles where id = v_uid),
                            'public_name', public.tl_public_name(v_uid));
end $$;

-- پروفایل عمومی یک نفر، فقط همان چیزهایی که خودش اجازه داده
create or replace function public.public_profile(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := auth.uid(); r public.profiles; v_self boolean; v_today date := (now() at time zone 'Asia/Tehran')::date;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into r from public.profiles where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  v_self := (v_me = p_id);
  if not v_self and coalesce(r.account_type, 'user') = 'sme' then return jsonb_build_object('ok', false, 'error', 'missing'); end if;
  if not v_self and not public.tl_priv(r.privacy, 'profile_public', true) then
    return jsonb_build_object('ok', false, 'error', 'private', 'card', public.tl_card(p_id) - 'id');
  end if;
  return jsonb_build_object(
    'ok', true, 'self', v_self, 'card', public.tl_card(p_id),
    'bio', nullif(r.bio, ''), 'city', r.city,
    'joined', to_char(date_trunc('month', r.created_at at time zone 'Asia/Tehran'), 'YYYY-MM-DD'),
    'level', coalesce(r.level, 1),
    'xp', case when v_self or public.tl_priv(r.privacy, 'show_stats', true) then coalesce(r.xp, 0) end,
    'stats', case when v_self or public.tl_priv(r.privacy, 'show_stats', true) then jsonb_build_object(
        'checkins', (select count(*) from public.checkins k where k.user_id = p_id),
        'cafes', (select count(distinct k.cafe_id) from public.checkins k where k.user_id = p_id),
        'streak', case when r.last_checkin_date >= v_today - 1 then coalesce(r.streak, 0) else 0 end) end,
    'badges', case when v_self or public.tl_priv(r.privacy, 'show_badges', true) then (
        select coalesce(jsonb_agg(jsonb_build_object('icon', a.icon, 'title', a.title, 'at', a.earned_at) order by a.earned_at desc), '[]'::jsonb)
          from (select * from public.awards w where w.user_id = p_id and w.kind = 'badge' order by w.earned_at desc limit 24) a) end,
    'items', case when v_self or public.tl_priv(r.privacy, 'show_badges', true) then
        (select count(*) from public.awards w where w.user_id = p_id and w.kind <> 'badge') end,
    'clan', case when v_self or public.tl_priv(r.privacy, 'show_clan', true) then (
        select jsonb_build_object('name', c.name, 'emblem', c.emblem) from public.clan_members m join public.clans c on c.id = m.clan_id
         where m.user_id = p_id and coalesce(m.is_active, true) limit 1) end,
    'email', case when public.tl_priv(r.privacy, 'show_email', false) then (select u.email from auth.users u where u.id = p_id) end,
    'privacy', case when v_self then r.privacy end);
end $$;

create or replace function public.public_cards(p_ids uuid[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(public.tl_card(x.id)), '[]'::jsonb)
    from (select distinct unnest(coalesce(p_ids[1:100], '{}'::uuid[])) as id) x
   where public.tl_card(x.id) is not null
$$;

-- 5. نسخه‌های تازه فهرست‌ها برای v4.0، با کارت کامل
create or replace function public.leaderboard_cards(p_scope text, p_region text, p_limit integer) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(public.tl_card(a.user_id) || jsonb_build_object('rank', a.rank, 'xp', a.xp, 'streak', a.streak,
           'checkins', a.checkins, 'cafes', a.cafes, 'me', a.me) order by a.rank, a.name), '[]'::jsonb)
    from public.leaderboard_get(p_scope, p_region, p_limit) a
$$;

create or replace function public.comments_feed_v4(p_cafe uuid, p_limit integer, p_offset integer) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x.j order by x.mine desc, x.created_at desc), '[]'::jsonb) from (
    select (c.user_id = auth.uid()) as mine, c.created_at,
           jsonb_build_object('id', c.id, 'body', c.body, 'created_at', c.created_at, 'edited_at', c.edited_at,
             'visited', exists (select 1 from public.checkins k where k.cafe_id = c.cafe_id and k.user_id = c.user_id),
             'mine', (c.user_id = auth.uid()), 'hidden', c.hidden, 'reply_body', c.reply_body, 'reply_at', c.reply_at,
             'author', case when public.tl_priv(p.privacy, 'profile_public', true) then public.tl_card(c.user_id)
                            else public.tl_card(c.user_id) - 'id' end) as j
      from public.cafe_comments c join public.profiles p on p.id = c.user_id
     where c.cafe_id = p_cafe and not c.removed and (not c.hidden or c.user_id = auth.uid())
     order by (c.user_id = auth.uid()) desc, c.created_at desc
     limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0)) x
$$;

revoke all on function public.update_my_profile(jsonb), public.set_my_privacy(jsonb), public.public_profile(uuid),
  public.public_cards(uuid[]) from public, anon;
grant execute on function public.update_my_profile(jsonb), public.set_my_privacy(jsonb), public.public_profile(uuid),
  public.public_cards(uuid[]) to authenticated;
revoke all on function public.leaderboard_cards(text, text, integer), public.comments_feed_v4(uuid, integer, integer) from public;
grant execute on function public.leaderboard_cards(text, text, integer), public.comments_feed_v4(uuid, integer, integer) to anon, authenticated;

-- 6. حلقه تو با کارت کامل
create or replace function public.my_circle() returns jsonb
language sql stable security definer set search_path = '' as $$
  with me as (select auth.uid() as id),
  linked as (
    select r.invitee as uid, 'invited'::text as kind, 1 as pri from public.referrals r join me on r.inviter = me.id
    union all
    select r.inviter, 'inviter', 0 from public.referrals r join me on r.invitee = me.id
    union all
    select m2.user_id, 'clan', 2
      from public.clan_members m1
      join me on m1.user_id = me.id and coalesce(m1.is_active, true)
      join public.clan_members m2 on m2.clan_id = m1.clan_id and coalesce(m2.is_active, true) and m2.user_id <> me.id
  ),
  one as (select distinct on (uid) uid, kind, pri from linked where uid is not null order by uid, pri),
  rows as (select o.uid, o.kind, o.pri, coalesce(p.xp, 0) as xp from one o join public.profiles p on p.id = o.uid)
  select case when (select id from me) is null then jsonb_build_object('total', 0, 'people', '[]'::jsonb)
    else jsonb_build_object('total', (select count(*) from rows),
      'people', coalesce((select jsonb_agg(public.tl_card(t.uid) || jsonb_build_object('kind', t.kind, 'avatar', public.tl_card(t.uid) ->> 'emoji') order by t.pri, t.xp desc)
                            from (select * from rows order by pri, xp desc limit 12) t), '[]'::jsonb)) end
$$;
revoke all on function public.my_circle() from public, anon;
grant execute on function public.my_circle() to authenticated;

-- 7. تابع‌ها و نماهای قدیمی: همان شکل خروجی، با نام عمومی و آمار طبق حریم خصوصی
create or replace view public.user_public_stats as
select p.id as user_id,
       case when public.tl_priv(p.privacy, 'show_stats', true) then coalesce(ck.checkin_count, 0) else 0 end as checkin_count,
       case when public.tl_priv(p.privacy, 'show_stats', true) then coalesce(ck.cafe_count, 0) else 0 end as cafe_count,
       case when public.tl_priv(p.privacy, 'show_stats', true) then coalesce(fv.fav_count, 0) else 0 end as fav_count
  from public.profiles p
  left join (select checkins.user_id, count(*)::integer as checkin_count, count(distinct checkins.cafe_id)::integer as cafe_count
               from public.checkins group by checkins.user_id) ck on ck.user_id = p.id
  left join (select favorites.user_id, count(*)::integer as fav_count from public.favorites group by favorites.user_id) fv on fv.user_id = p.id;

create or replace view public.region_leaderboard as
select public.region_num(ci.district) as region, ci.user_id,
       public.tl_public_name(p.id) as display_name, p.avatar_emoji,
       sum(ci.xp_awarded) as region_xp, count(*) as region_checkins
  from public.checkins ci join public.profiles p on p.id = ci.user_id
 where public.region_num(ci.district) is not null
 group by public.region_num(ci.district), ci.user_id, p.id, p.avatar_emoji;

create or replace function public.public_profiles(p_ids uuid[])
returns table(id uuid, name text, avatar text, xp integer, level integer)
language sql stable security definer set search_path = '' as $$
  select p.id, public.tl_public_name(p.id), coalesce(p.avatar_emoji, '☕'), coalesce(p.xp, 0), coalesce(p.level, 1)
    from public.profiles p
   where p.id = any (coalesce(p_ids[1:200], '{}'::uuid[]))
$$;

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
      select p.id, public.tl_public_name(p.id), coalesce(p.avatar_emoji, '☕'), s.pts, coalesce(p.level, 1),
             case when public.tl_priv(p.privacy, 'show_stats', true) and p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             coalesce(u.checkin_count, 0), coalesce(u.cafe_count, 0),
             (rank() over (order by s.pts desc))::integer
        from s join public.profiles p on p.id = s.uid left join public.user_public_stats u on u.user_id = p.id
       where coalesce(p.account_type, 'user') <> 'sme' and p.id is distinct from v_owner;
  elsif p_scope = 'region' then
    return query
      select p.id, public.tl_public_name(p.id), coalesce(p.avatar_emoji, '☕'), r.region_xp::bigint, coalesce(p.level, 1),
             case when public.tl_priv(p.privacy, 'show_stats', true) and p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             case when public.tl_priv(p.privacy, 'show_stats', true) then r.region_checkins::integer else 0 end, coalesce(u.cafe_count, 0),
             (rank() over (order by r.region_xp desc))::integer
        from public.region_leaderboard r join public.profiles p on p.id = r.user_id left join public.user_public_stats u on u.user_id = p.id
       where r.region = p_region and coalesce(p.account_type, 'user') <> 'sme' and p.id is distinct from v_owner;
  else
    return query
      select p.id, public.tl_public_name(p.id), coalesce(p.avatar_emoji, '☕'), coalesce(p.xp, 0)::bigint, coalesce(p.level, 1),
             case when public.tl_priv(p.privacy, 'show_stats', true) and p.last_checkin_date >= v_today - 1 then coalesce(p.streak, 0) else 0 end,
             coalesce(u.checkin_count, 0), coalesce(u.cafe_count, 0),
             (rank() over (order by coalesce(p.xp, 0) desc))::integer
        from public.profiles p left join public.user_public_stats u on u.user_id = p.id
       where coalesce(p.account_type, 'user') <> 'sme' and p.id is distinct from v_owner;
  end if;
end $function$;

create or replace function public.cafe_comments_feed(p_cafe uuid, p_limit integer default 30, p_offset integer default 0)
returns table(id bigint, body text, created_at timestamptz, edited_at timestamptz, name text, avatar text, level integer, visited boolean, mine boolean, hidden boolean, reply_body text, reply_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.body, c.created_at, c.edited_at,
         public.tl_public_name(p.id), coalesce(p.avatar_emoji, '☕'), coalesce(p.level, 1),
         exists (select 1 from public.checkins k where k.cafe_id = c.cafe_id and k.user_id = c.user_id),
         (c.user_id = auth.uid()), c.hidden, c.reply_body, c.reply_at
    from public.cafe_comments c
    join public.profiles p on p.id = c.user_id
   where c.cafe_id = p_cafe and not c.removed and (not c.hidden or c.user_id = auth.uid())
   order by (c.user_id = auth.uid()) desc, c.created_at desc
   limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0)
$$;

create or replace function public.cafe_comments_list(p_cafe uuid, p_limit integer default 30, p_offset integer default 0)
returns table(id bigint, body text, created_at timestamptz, edited_at timestamptz, name text, avatar text, level integer, visited boolean, mine boolean, hidden boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.body, c.created_at, c.edited_at,
         public.tl_public_name(p.id), coalesce(p.avatar_emoji, '☕'), coalesce(p.level, 1),
         exists (select 1 from public.checkins k where k.cafe_id = c.cafe_id and k.user_id = c.user_id),
         (c.user_id = auth.uid()), c.hidden
    from public.cafe_comments c
    join public.profiles p on p.id = c.user_id
   where c.cafe_id = p_cafe and not c.removed and (not c.hidden or c.user_id = auth.uid())
   order by (c.user_id = auth.uid()) desc, c.created_at desc
   limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0)
$$;

create or replace function public.business_comments(p_business_id bigint, p_limit integer default 30, p_offset integer default 0)
returns table(id bigint, body text, created_at timestamptz, edited_at timestamptz, name text, avatar text, level integer, visited boolean, hidden boolean, reply_body text, reply_at timestamptz, total integer, unanswered integer)
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
           public.tl_public_name(c.user_id), coalesce(p.avatar_emoji, '☕'), coalesce(p.level, 1),
           exists (select 1 from public.checkins k where k.cafe_id = c.cafe_id and k.user_id = c.user_id),
           c.hidden, c.reply_body, c.reply_at,
           (select count(*)::integer from base),
           (select count(*)::integer from base b2 where b2.reply_body is null and not b2.hidden)
      from base c left join public.profiles p on p.id = c.user_id
     order by (c.reply_body is null and not c.hidden) desc, c.created_at desc
     limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0);
end $function$;

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
                 'rank', lr.rank, 'name', public.tl_public_name(p.id),
                 'avatar', coalesce(p.avatar_emoji, '☕'), 'pts', lr.pts, 'prize', lr.prize_title,
                 'me', lr.user_id = auth.uid(), 'card', public.tl_card(p.id)) order by lr.rank), '[]'::jsonb)
          from public.league_results lr join public.profiles p on p.id = lr.user_id
         where lr.week_start = v_prev))
  ) into v_out;
  return v_out;
end $function$;

-- کد دعوت برای مالک اپ هم ساخته می‌شود، حتی اگر حسابش کسب‌وکار باشد
create or replace function public.my_referral() returns jsonb
language plpgsql security definer set search_path = '' as $function$
declare v_uid uuid := auth.uid(); v_code text; v_try integer := 0;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if exists (select 1 from public.profiles where id = v_uid and account_type = 'sme') and v_uid is distinct from public.tl_owner_id() then
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

-- 8. سخت‌گیری بعد از آزمون امنیتی
-- شمارش فایل‌های عکس فقط برای خود کاربر؛ برای دیگران همیشه صفر
create or replace function public.tl_avatar_files(p_uid uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select case when p_uid is null or p_uid is distinct from auth.uid() then 0 else
    (select count(*)::integer from storage.objects o
      where o.bucket_id = 'avatars' and (storage.foldername(o.name))[1] = p_uid::text) end
$$;

-- آمار منطقه هم از تنظیم «نمایش آمار» پیروی می‌کند
create or replace view public.region_leaderboard as
 SELECT region_num(ci.district) AS region,
    ci.user_id,
    tl_public_name(p.id) AS display_name,
    p.avatar_emoji,
    sum(ci.xp_awarded) AS region_xp,
    case when tl_priv(p.privacy, 'show_stats', true) then count(*) else 0::bigint end AS region_checkins
   FROM checkins ci
     JOIN profiles p ON p.id = ci.user_id
  WHERE region_num(ci.district) IS NOT NULL
  GROUP BY region_num(ci.district), ci.user_id, p.id, p.avatar_emoji;

-- نام، شهر و چهره فقط از راه update_my_profile عوض می‌شوند تا همه بررسی‌ها اجرا شود
revoke update (display_name, username, city, avatar_emoji) on public.profiles from authenticated;
revoke update (display_name, username, city, avatar_emoji) on public.profiles from anon;

-- آزمون امنیتی 2026-10-18 در تراکنش برگشت‌خورده، 49 مورد، همه درست:
--   مهمان: خواندن جدول پروفایل، پروفایل عمومی، ویرایش و شمارش عکس بسته است. در رتبه‌بندی و نمای منطقه
--   هیچ نامی برابر ابتدای ایمیل تأییدنشده نیست، کلید email نیست، عکس پنهان و آمار پنهان دیده نمی‌شود.
--   کاربر: ردیف دیگران را نمی‌خواند، نام و امتیاز و حریم را مستقیم عوض نمی‌کند، پروفایل خصوصی فقط کارت بی‌شناسه
--   می‌دهد، حساب کسب‌وکار پیدا نمی‌شود، همه بررسی‌های نام، درباره من، شهر، چهره، آواتار و مسیر عکس کار می‌کنند،
--   فهرست سفید حریم خصوصی کلیدهای دیگر را نمی‌پذیرد، بارگذاری در پوشه دیگران، زیرپوشه، پسوند svg و فایل پنجم رد
--   می‌شود و نویسنده نظر با پروفایل خصوصی شناسه ندارد. مالک اپ کد دعوت می‌گیرد.

-- 9. گرگان به فهرست شهرها اضافه شد؛ کلید خانه‌های نقشه هم همان فهرست lib/constants.js را دارد
create or replace function public.tl_cell_key(p_lat double precision, p_lng double precision) returns text
language sql immutable parallel safe set search_path = public as $$
  with o as (
    select v.k, v.lat::double precision as lat, v.lng::double precision as lng
      from (values
        ('tehran', 35.7219, 51.3979), ('mashhad', 36.2972, 59.6067), ('isfahan', 32.6539, 51.6660),
        ('shiraz', 29.5918, 52.5837), ('tabriz', 38.0962, 46.2738), ('karaj', 35.8400, 50.9391),
        ('rasht', 37.2809, 49.5831), ('kish', 26.5267, 53.9800), ('gorgan', 36.8427, 54.4439)
      ) v(k, lat, lng)
     order by power(v.lat - p_lat, 2) + power((v.lng - p_lng) * cos(radians(p_lat)), 2)
     limit 1
  ), xy as (
    select k, (p_lng - lng) * 111320 * cos(radians(lat)) as x, (p_lat - lat) * 110540 as y from o
  ), f as (
    select k, (sqrt(3::double precision) / 3 * x - y / 3) / 175 as fq, (2::double precision / 3 * y) / 175 as fr from xy
  ), g as (
    select k, fq, fr, -fq - fr as fs, floor(fq + 0.5) as q, floor(fr + 0.5) as r, floor(-fq - fr + 0.5) as s from f
  )
  select k || ':' ||
         (case when abs(q - fq) > abs(r - fr) and abs(q - fq) > abs(s - fs) then -r - s else q end)::int || ':' ||
         (case when not (abs(q - fq) > abs(r - fr) and abs(q - fq) > abs(s - fs)) and abs(r - fr) > abs(s - fs) then -q - s else r end)::int
    from g
$$;
