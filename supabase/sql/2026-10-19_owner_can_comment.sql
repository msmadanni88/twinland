-- ─────────────────────────────────────────────────────────────
--  TwinLand — مالک اپ با حساب کسب‌وکار هم بازی می‌کند — 2026-10-19
--  مشکل: حساب دنی کسب‌وکار ثبت شده و در حالت «کاربر عادی» دکمه چک‌این نداشت.
--  سمت سرور چک‌این و امتیاز دادن مالک را از قبل می‌پذیرفتند؛ فقط ثبت نظر مالک را رد می‌کرد.
--  حالا ثبت نظر هم مالک را می‌پذیرد. حساب‌های کسب‌وکار دیگر مثل قبل نظر نمی‌گذارند.
--  آزموده در تراکنش برگشت‌خورده: نظر مالک پذیرفته شد.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.post_cafe_comment(p_cafe uuid, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_acct text; v_body text; v_flat text; v_id bigint; v_recent integer; v_prev timestamptz; v_exists boolean; v_blocked boolean;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select account_type into v_acct from public.profiles where id = v_uid;
  if not found then return jsonb_build_object('ok', false, 'error', 'profile'); end if;
  if v_acct = 'sme' and not public.is_app_owner() then return jsonb_build_object('ok', false, 'error', 'business'); end if;
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
