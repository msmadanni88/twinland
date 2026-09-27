'use client'
// کارت «نسخه ظاهر سایت» در پنل ادمین — فقط برای مالک اپ دیده می‌شود.
// همان کار دستورهای set_ui_version و ui_rollback را با یک دکمه انجام می‌دهد.
import { useCallback, useEffect, useState } from 'react'
import { SB_URL, SB_KEY } from '@/lib/config'
import { getSession } from '@/lib/game/gameSystem'
import { UI_REVALIDATE_SECONDS, UI_VERSIONS } from '@/lib/ui/versions'

const OWNER_EMAIL = 'msmadani88@gmail.com'
const ERRORS = {
  not_owner: 'فقط مالک اپ می‌تواند نسخه ظاهر را عوض کند.',
  unknown_version: 'این نسخه در دیتابیس ثبت نشده.',
  no_older_version: 'نسخه قدیمی‌تری برای برگشت وجود ندارد.',
}

function faDate(iso) {
  try { return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }) }
  catch (e) { return iso }
}

export function UiVersionCard({ C }) {
  const [isOwner, setIsOwner] = useState(false)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const call = useCallback(async (fn, body) => {
    const s = getSession()
    const r = await fetch(SB_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + (s && s.access_token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    })
    return r.json()
  }, [])

  const load = useCallback(async () => {
    try { const j = await call('ui_version_status'); if (j && j.ok) setStatus(j) } catch (e) {}
  }, [call])

  useEffect(() => {
    const s = getSession()
    const owner = !!(s && s.user && s.user.email && s.user.email.toLowerCase() === OWNER_EMAIL)
    setIsOwner(owner)
    if (owner) load()
  }, [load])

  async function run(fn, body) {
    setBusy(true); setMsg(null)
    try {
      const j = await call(fn, body)
      if (j && j.ok) {
        setMsg(j.changed === false
          ? 'سایت همین الان روی ' + j.version + ' است.'
          : 'سایت روی ' + j.version + ' رفت. حداکثر تا ' + UI_REVALIDATE_SECONDS + ' ثانیه به همه می‌رسد.')
      } else setMsg((j && ERRORS[j.error]) || 'خطا در تغییر نسخه.')
      await load()
    } catch (e) { setMsg('خطا در ارتباط با سرور.') }
    setBusy(false)
  }

  if (!isOwner) return null
  const current = status && status.current
  const dbIds = new Set(((status && status.versions) || []).map(v => v.id))
  const known = UI_VERSIONS.filter(v => dbIds.has(v.id))

  const btn = (primary) => ({
    border: primary ? 'none' : '1px solid ' + C.border, borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 700,
    fontFamily: 'inherit', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
    background: primary ? C.accent : C.chip, color: primary ? C.accentText : C.chipText, textDecoration: 'none',
  })

  return (
    <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>🎨 نسخه ظاهر سایت</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>فقط برای مالک اپ · تغییر برای همه کاربران</div>
        </div>
        <button onClick={() => run('ui_rollback')} disabled={busy} style={btn(false)}>↩ برگشت به نسخه قبل</button>
      </div>

      {known.map(v => {
        const on = v.id === current
        return (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 8,
            background: on ? C.accentL : C.chip, border: '1px solid ' + (on ? C.accent : 'transparent') }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{v.id} · {v.name}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{v.date}{on ? ' · فعال روی سایت' : ''}</div>
            </div>
            <a href={'/?ui=' + v.id} style={btn(false)}>پیش‌نمایش</a>
            {!on && <button onClick={() => run('set_ui_version', { p_version: v.id })} disabled={busy} style={btn(true)}>فعال کن</button>}
          </div>
        )
      })}

      {msg && <div style={{ fontSize: 12, color: C.text, background: C.chip, borderRadius: 10, padding: '8px 12px', marginTop: 6 }}>{msg}</div>}

      {status && status.log && status.log.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginBottom: 6 }}>تاریخچه تغییر نسخه</div>
          {status.log.slice(0, 6).map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: C.sub, lineHeight: 1.9 }}>
              {faDate(l.changed_at)} — {l.from_version || 'شروع'} ← {l.to_version}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
