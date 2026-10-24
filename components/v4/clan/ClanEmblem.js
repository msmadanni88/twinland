'use client'
// نشان کلن — یک طرح برای همه جاها: صفحه کلن، زبانه پنل، داشبورد، پروفایل و برگه کافه
// مربع گوشه‌دار با رنگ کلن کم‌رنگ، آیکون خطی کلن و عدد سطح کوچک در گوشه.
// اگر نشان کلن قدیمی یک ایموجی باشد، همان ایموجی نشان داده می‌شود.
import { Icon, ICON_NAMES } from '@/components/v4/icons'
import { useV4 } from '@/components/v4/kit/context'
import { R } from '@/components/v4/theme'

const fa = (n) => Number(n || 0).toLocaleString('fa')

function tint(hex, a) {
  const h = String(hex || '#8B5CF6').replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16)
  if (isNaN(n)) return 'rgba(139,92,246,' + a + ')'
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
}

export function ClanEmblem({ clan, size = 48, showLevel = true, style, C: c, T: t }) {
  const { C, T } = useV4({ C: c, T: t })
  const color = (clan && clan.color) || '#8B5CF6'
  const key = clan && clan.emblem
  const isIcon = key && ICON_NAMES.includes(key)
  const lvl = clan && clan.level
  return (
    <span role="img" aria-label={(clan && clan.name) ? 'نشان کلن ' + clan.name : 'نشان کلن'}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, borderRadius: R.box, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(150deg,' + tint(color, T.dark ? 0.32 : 0.22) + ',' + tint(color, T.dark ? 0.12 : 0.08) + ')',
        border: '1.5px solid ' + tint(color, 0.7), color: T.dark ? '#FFFFFF' : color, ...style }}>
      {isIcon ? <Icon name={key} size={Math.round(size * 0.5)} stroke={1.9} /> : <span style={{ fontSize: Math.round(size * 0.5), lineHeight: 1 }}>{key || '⚔️'}</span>}
      {showLevel && lvl ? (
        <span style={{ position: 'absolute', bottom: -6, left: -6, minWidth: Math.max(18, size * 0.38), height: Math.max(18, size * 0.38), padding: '0 4px', boxSizing: 'border-box',
          borderRadius: R.pill, background: color, color: '#FFFFFF', border: '2px solid ' + (T.dark ? '#18181B' : '#FFFFFF'),
          fontSize: Math.max(10, size * 0.22), fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{fa(lvl)}</span>
      ) : null}
    </span>
  )
}

export { tint as clanTint }
