'use client'
// تنظیم حریم خصوصی — هر کلید همان لحظه در سرور ذخیره می‌شود و سرور فقط همین هفت کلید را می‌پذیرد
import { useEffect, useState } from 'react'
import { rpc, setMyPrivacy } from '@/lib/profile/people'
import { track } from '@/lib/analytics'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Toggle } from '@/components/v4/kit/kit'

export const PRIVACY_ROWS = [
  { key: 'profile_public', icon: 'globe', title: 'پروفایل عمومی', sub: 'دیگران با زدن روی اسمت صفحه‌ات را می‌بینند. خاموش باشد، فقط اسم و چهره‌ات دیده می‌شود.' },
  { key: 'show_name', icon: 'user', title: 'نمایش اسم', sub: (alias) => 'خاموش باشد، همه‌جا به‌جای اسمت نام مستعار «' + (alias || '…') + '» دیده می‌شود.' },
  { key: 'show_photo', icon: 'camera', title: 'نمایش عکس', sub: 'خاموش باشد، دیگران به‌جای عکست آواتار یا حرف اول اسمت را می‌بینند.' },
  { key: 'show_stats', icon: 'star', title: 'نمایش آمار', sub: 'تعداد چک‌این‌ها، کافه‌ها و روزهای پشت هم. امتیاز و جایگاهت در رتبه‌بندی همیشه دیده می‌شود، چون جدول بدون آن معنی ندارد.' },
  { key: 'show_badges', icon: 'medal', title: 'نمایش نشان‌ها و آیتم‌ها', sub: 'نشان‌هایی که گرفته‌ای و تعداد آیتم‌های کلکسیونت.' },
  { key: 'show_clan', icon: 'users', title: 'نمایش کلن', sub: 'نام کلنی که عضوش هستی.' },
  { key: 'show_email', icon: 'mail', title: 'نمایش ایمیل', sub: 'پیشنهاد نمی‌کنیم. روشن باشد، هر کاربر واردشده‌ای ایمیلت را در پروفایلت می‌بیند.', warn: true },
]

export function PrivacySettings({ me, showToast }) {
  const { C, T } = useV4()
  const [p, setP] = useState(me ? me.privacy : null)
  const [alias, setAlias] = useState('')
  const [busyKey, setBusyKey] = useState(null)
  useEffect(() => { if (me) setP(me.privacy) }, [me])
  useEffect(() => { if (me && me.id) rpc('tl_alias', { p_id: me.id }).then(a => { if (typeof a === 'string') setAlias(a) }) }, [me && me.id]) // eslint-disable-line

  async function flip(key, val) {
    if (!p || busyKey) return
    const prev = p
    setP({ ...p, [key]: val }); setBusyKey(key)
    const r = await setMyPrivacy({ [key]: val })
    setBusyKey(null)
    if (!r.ok) { setP(prev); showToast && showToast('ذخیره نشد؛ دوباره امتحان کن', 'warn'); return }
    track('privacy_set', { key, on: val })
    if (key === 'show_email' && val) showToast && showToast('ایمیلت حالا در پروفایلت دیده می‌شود')
  }

  if (!p) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {PRIVACY_ROWS.map(row => {
        const on = !!p[row.key]
        const disabled = row.key !== 'profile_public' && row.key !== 'show_name' && row.key !== 'show_photo' && !p.profile_public
        const sub = typeof row.sub === 'function' ? row.sub(alias) : row.sub
        return (
          <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: R.box, border: '1px solid ' + (row.warn && on ? T.hairStrong : T.hair), background: T.chip, opacity: disabled ? 0.55 : 1 }}>
            <span style={{ width: 34, height: 34, borderRadius: R.box, background: T.dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={on ? row.icon : (row.icon === 'globe' ? 'lock' : row.icon)} size={18} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{row.title}</div>
              <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.7, marginTop: 2 }}>{disabled ? 'وقتی پروفایل خصوصی است، این بخش برای هیچ‌کس دیده نمی‌شود.' : sub}</div>
            </div>
            <Toggle on={on} onChange={(v) => flip(row.key, v)} label={row.title} disabled={busyKey === row.key} />
          </div>
        )
      })}
    </div>
  )
}
