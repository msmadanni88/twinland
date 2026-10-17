-- ─────────────────────────────────────────────────────────────
--  TwinLand — نسخه ظاهر v4.0 «مینیمال» — 2026-10-17
--  1. ردیف نسخه در فهرست نسخه‌ها تا کارت «نسخه ظاهر سایت» در پنل ادمین آن را نشان دهد.
--     با این ردیف چیزی برای کاربران عوض نمی‌شود؛ فعال کردن فقط با set_ui_version('v4.0') یا دکمه «فعال کن».
--  2. تابع my_circle برای «حلقه تو»: چهره کسانی که دعوت کردی، کسی که دعوتت کرد و هم‌کلنی‌ها.
--     فقط نام، چهره و لول برمی‌گرداند؛ شناسه کاربرها بیرون نمی‌رود. فقط برای کاربر واردشده.
-- ─────────────────────────────────────────────────────────────

insert into public.ui_versions (id, seq, name, released_on, notes)
values ('v4.0', 40, 'مینیمال', '2026-10-17',
        'نسخه چهارم: سیاه و سفید با دو حالت روشن و خیلی تیره، شیشه مات همه‌جا، آیکون خطی، ستون ابزار چپ دسکتاپ، نقشه برداری مینیمال بدون نوشته، نشانگر سبز ثابت، کمان روزهای استریک')
on conflict (id) do nothing;

create or replace function public.my_circle()
returns jsonb
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
  one as (
    select distinct on (uid) uid, kind, pri from linked where uid is not null order by uid, pri
  ),
  rows as (
    select coalesce(nullif(p.display_name, ''), 'کاربر') as name, coalesce(p.avatar_emoji, '☕') as avatar,
           coalesce(p.level, 1) as level, o.kind, o.pri, coalesce(p.xp, 0) as xp
      from one o join public.profiles p on p.id = o.uid
  )
  select case when (select id from me) is null then jsonb_build_object('total', 0, 'people', '[]'::jsonb)
    else jsonb_build_object(
      'total', (select count(*) from rows),
      'people', coalesce((select jsonb_agg(jsonb_build_object('name', name, 'avatar', avatar, 'level', level, 'kind', kind) order by pri, xp desc)
                            from (select * from rows order by pri, xp desc limit 12) t), '[]'::jsonb))
  end
$$;
revoke all on function public.my_circle() from public, anon;
grant execute on function public.my_circle() to authenticated;
