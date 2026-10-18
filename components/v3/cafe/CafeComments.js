'use client'
// نظرهای هر کافه. همه‌چیز از راه تابع‌های دیتابیس می‌گذرد (جدول نظرها مستقیم باز نیست)؛ قاعده‌ها سمت سرور اجرا می‌شود:
//  • هر کاربر برای هر کافه یک نظر دارد و می‌تواند ویرایشش کند. حساب کسب‌وکار نظر نمی‌گذارد.
//  • حداکثر ۵ نظر تازه در ۲۴ ساعت، و بین دو ویرایش ۲۰ ثانیه. پیوند، شناسه و شماره تلفن در متن مجاز نیست.
//  • سه گزارش از سه نفر مختلف، نظر را پنهان می‌کند. نویسنده نظر خودش را می‌تواند بردارد.
//  • کنار نام کسانی که در همین کافه چک‌این کرده‌اند نشان «اینجا بوده» می‌آید.
//  • جواب صاحب کافه زیر هر نظر می‌آید؛ مدیر سایت می‌تواند نظر را پنهان یا برگرداند.
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { alpha } from '@/components/v2/theme'
import { track } from '@/lib/analytics'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const MAX = 400

const ERR = {
  auth: 'برای نظر دادن اول وارد شو',
  profile: 'پروفایلت کامل نیست؛ یک بار خارج و دوباره وارد شو',
  business: 'حساب کسب‌وکار نمی‌تواند نظر بگذارد',
  cafe: 'این کافه پیدا نشد',
  short: 'نظرت خیلی کوتاه است',
  long: 'نظرت از ۴۰۰ حرف بیشتر است',
  no_links: 'پیوند و شناسه شبکه‌های اجتماعی در نظر مجاز نیست',
  no_phone: 'شماره تلفن در نظر مجاز نیست',
  rate: 'کمی صبر کن؛ پشت‌سرهم نمی‌شود نظر گذاشت',
  blocked: 'این نظر را مدیر سایت برداشته و دوباره باز نمی‌شود',
}

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 90) return 'همین الان'
  if (s < 3600) return fa(Math.round(s / 60)) + ' دقیقه پیش'
  if (s < 86400) return fa(Math.round(s / 3600)) + ' ساعت پیش'
  if (s < 86400 * 30) return fa(Math.round(s / 86400)) + ' روز پیش'
  return fa(Math.round(s / 86400 / 30)) + ' ماه پیش'
}

function rpc(name, body, token) {
  return fetch(SB_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (token || SB_KEY), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}

function Avatar({ a, name, C, T }) {
  const isUrl = a && /^(https?:)?\/\//.test(a)
  return (
    <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: (T.r || 12), overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900,
      background: T.accentSoft, color: C.accent, border: '1px solid ' + T.hair }}>
      {isUrl ? <img src={a} alt="" width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        : (a && a.length <= 4 ? a : String(name || '؟').trim().slice(0, 1))}
    </span>
  )
}

// نسخه v4.0 دو ورودی اختیاری می‌دهد: AuthorAvatar (چهره مشترک سایت) و onAuthor (باز کردن پروفایل نویسنده).
// با این دو، فهرست از comments_feed_v4 خوانده می‌شود که کارت عمومی نویسنده را طبق حریم خصوصی‌اش دارد.
// بدون آن‌ها رفتار همان نسخه قبل است.
export function CafeComments({ C, T, cafe, token, uid, noPlay = false, showToast, AuthorAvatar = null, onAuthor = null }) {
  const [rows, setRows] = useState(null)       // null = در حال بارگذاری
  const [fail, setFail] = useState(false)
  const [more, setMore] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const PAGE = 20

  const load = useCallback((offset) => {
    const fn = AuthorAvatar ? 'comments_feed_v4' : 'cafe_comments_feed'
    return rpc(fn, { p_cafe: cafe.id, p_limit: PAGE + 1, p_offset: offset }, token).then(r0 => {
      const r = AuthorAvatar && Array.isArray(r0) ? r0.map(x => ({ ...x, author: x.author || null, name: (x.author && x.author.name) || 'کاربر', level: (x.author && x.author.level) || 0 })) : r0
      if (!Array.isArray(r)) { setFail(true); if (!offset) setRows([]); return }
      setFail(false)
      const page = r.slice(0, PAGE)
      setMore(r.length > PAGE)
      setRows(prev => (offset ? [...(prev || []), ...page] : page))
    })
  }, [cafe.id, token, AuthorAvatar])

  useEffect(() => { setRows(null); setText(''); setEditing(false); load(0) }, [cafe.id, load])

  const mine = rows ? rows.find(r => r.mine) : null
  const canWrite = !!uid && !noPlay
  const showComposer = canWrite && (!mine || editing)

  async function submit() {
    const body = text.trim()
    if (busy) return
    if (body.length < 2) { showToast && showToast(ERR.short, 'warn'); return }
    setBusy(true)
    const r = await rpc('post_cafe_comment', { p_cafe: cafe.id, p_body: body }, token)
    setBusy(false)
    if (r && r.ok) {
      track('comment_post', { cafe_id: cafe.id, edit: !!mine, len: body.length })
      showToast && showToast(mine ? 'نظرت ویرایش شد' : 'نظرت ثبت شد. ممنون!')
      setText(''); setEditing(false); load(0)
    } else {
      showToast && showToast((r && ERR[r.error]) || 'نظر ثبت نشد؛ دوباره امتحان کن', 'warn')
    }
  }
  async function removeMine() {
    if (busy) return
    setBusy(true)
    const ok = await rpc('remove_my_cafe_comment', { p_cafe: cafe.id }, token)
    setBusy(false)
    if (ok === true) { showToast && showToast('نظرت برداشته شد'); setText(''); setEditing(false); load(0) }
    else showToast && showToast('برداشته نشد؛ دوباره امتحان کن', 'warn')
  }
  async function report(row) {
    if (!uid) { showToast && showToast(ERR.auth, 'warn'); return }
    const ok = await rpc('report_cafe_comment', { p_id: row.id }, token)
    showToast && showToast(ok === true ? 'گزارشت ثبت شد. ممنون' : 'گزارش ثبت نشد', ok === true ? undefined : 'warn')
  }

  const box = { borderRadius: T.r || 16, border: '1px solid ' + T.hair, background: T.chip, padding: 12 }

  return (
    <div>
      {!uid && <div style={{ ...box, fontSize: 12.5, color: C.sub, textAlign: 'center', lineHeight: 1.9, marginBottom: 12 }}>برای نظر دادن اول وارد شو</div>}
      {uid && noPlay && <div style={{ ...box, fontSize: 12.5, color: C.sub, textAlign: 'center', lineHeight: 1.9, marginBottom: 12 }}>حساب کسب‌وکار فقط نظرها را می‌بیند و نظر نمی‌گذارد</div>}

      {showComposer && (
        <div style={{ ...box, marginBottom: 14 }}>
          <textarea value={text} onChange={e => setText(e.target.value.slice(0, MAX))} rows={3} maxLength={MAX}
            placeholder={mine ? 'نظرت را ویرایش کن' : 'از این کافه بگو: فضا، قهوه، دسترسی…'}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: C.text, fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.9 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: text.length > MAX - 40 ? C.danger : C.sub }}>{fa(text.length)} از {fa(MAX)}</span>
            <span style={{ flex: 1 }} />
            {editing && <button className="tl2-press" onClick={() => { setEditing(false); setText('') }} style={{ height: 34, padding: '0 12px', border: 'none', borderRadius: (T.r || 11), background: 'transparent', color: C.sub, fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}>انصراف</button>}
            <button className="tl2-press" onClick={submit} disabled={busy || text.trim().length < 2}
              style={{ height: 34, padding: '0 16px', border: 'none', borderRadius: (T.r || 11), background: C.accent, color: T.onAccent, fontSize: 12.5, fontWeight: 900, fontFamily: 'inherit', opacity: busy || text.trim().length < 2 ? 0.5 : 1 }}>
              {busy ? '…' : mine ? 'ذخیره' : 'ثبت نظر'}
            </button>
          </div>
        </div>
      )}

      {rows === null && [0, 1, 2].map(i => <div key={i} style={{ height: 64, borderRadius: 16, background: T.chip, marginBottom: 8, opacity: 0.6 }} />)}
      {rows && rows.length === 0 && !fail && <div style={{ textAlign: 'center', padding: '22px 8px', color: C.sub, fontSize: 13, lineHeight: 2 }}>هنوز نظری نیست.<br />اولین نفر باش</div>}
      {fail && <div style={{ textAlign: 'center', padding: 16, color: C.sub, fontSize: 12.5 }}>نظرها لود نشد. <button onClick={() => load(0)} style={{ border: 'none', background: 'none', color: C.accent, fontWeight: 800, fontFamily: 'inherit' }}>دوباره</button></div>}

      {rows && rows.map(r => (
        <div key={r.id} style={{ ...box, marginBottom: 8, background: r.mine ? alpha(C.accent, 0.08) : T.chip, borderColor: r.mine ? alpha(C.accent, 0.35) : T.hair, opacity: r.hidden ? 0.6 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {AuthorAvatar ? <AuthorAvatar person={r.author || { name: r.name }} /> : <Avatar a={r.avatar} name={r.name} C={C} T={T} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {onAuthor && r.author && r.author.id
                  ? <button type="button" onClick={() => onAuthor(r.author)} style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 900, color: C.text }}>{r.name || 'کاربر'}</button>
                  : <span style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{r.name || 'کاربر'}</span>}
                {r.level > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, color: C.sub }}>سطح {fa(r.level)}</span>}
                {r.visited && <span style={{ fontSize: 10.5, fontWeight: 900, padding: '2px 8px', borderRadius: 99, background: alpha(C.green, 0.16), color: C.green }}>اینجا بوده</span>}
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{ago(r.created_at)}{r.edited_at ? ' · ویرایش‌شده' : ''}{r.hidden ? ' · فقط برای خودت دیده می‌شود' : ''}</div>
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 2, marginTop: 8, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{r.body}</div>
          {r.reply_body && (
            <div style={{ marginTop: 8, padding: '8px 11px', borderRadius: (T.r || 12), background: alpha(C.accent, 0.08), borderRight: '3px solid ' + C.accent }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: C.accent }}>پاسخ {cafe.name || 'کافه'}{r.reply_at ? <span style={{ color: C.sub, fontWeight: 700 }}> · {ago(r.reply_at)}</span> : null}</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.9, marginTop: 3, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{r.reply_body}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
            {r.mine ? <>
              <button onClick={() => { setText(r.body); setEditing(true) }} style={{ border: 'none', background: 'none', padding: 0, color: C.accent, fontSize: 12, fontWeight: 800, fontFamily: 'inherit' }}>ویرایش</button>
              <button onClick={removeMine} style={{ border: 'none', background: 'none', padding: 0, color: C.danger, fontSize: 12, fontWeight: 800, fontFamily: 'inherit' }}>برداشتن</button>
            </> : (
              <button onClick={() => report(r)} style={{ border: 'none', background: 'none', padding: 0, color: C.sub, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit' }}>گزارش</button>
            )}
          </div>
        </div>
      ))}
      {more && <button className="tl2-press" onClick={() => load(rows.length)} style={{ width: '100%', height: 40, border: '1px solid ' + T.hair, borderRadius: (T.r || 12), background: T.chip, color: C.text, fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit' }}>نظرهای بیشتر</button>}
    </div>
  )
}
