// خواندن داده عمومی برای صفحه‌های سمت سرور، مثل صفحه هر کافه و نقشه سایت.
// فقط با کلید عمومی و فقط داده‌ای که برای مهمان هم باز است؛ نتیجه در Next حافظه می‌شود.
import { SB_KEY, SB_URL } from '@/lib/config'

const H = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }

export async function sbGet(path, revalidate = 3600) {
  try {
    const r = await fetch(SB_URL + '/rest/v1/' + path, { headers: H, next: { revalidate } })
    if (!r.ok) return null
    return await r.json()
  } catch (e) { return null }
}

export async function sbRpc(name, body, revalidate = 3600) {
  try {
    const r = await fetch(SB_URL + '/rest/v1/rpc/' + name, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}), next: { revalidate },
    })
    if (!r.ok) return null
    return await r.json()
  } catch (e) { return null }
}

// همه مکان‌های فعال، صفحه به صفحه؛ PostgREST در هر درخواست حداکثر 1000 ردیف می‌دهد
export async function allActiveCafes(select = 'id,name,branch,district', revalidate = 21600) {
  const out = []
  for (let off = 0; off < 10000; off += 1000) {
    const page = await sbGet('cafes?is_active=eq.true&select=' + select + '&order=name.asc&limit=1000&offset=' + off, revalidate)
    if (!Array.isArray(page)) break
    out.push(...page)
    if (page.length < 1000) break
  }
  return out
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const SITE = 'https://twinland.ir'

export function cafeTitle(c) {
  if (!c) return 'کافه'
  return c.branch && !String(c.name || '').includes(c.branch) ? c.name + ' · ' + c.branch : c.name
}

export const faDigits = (v) => String(v == null ? '' : v).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])

export function districtLabel(d) {
  if (!d) return ''
  const s = String(d).trim()
  return faDigits(/^\d+$/.test(s) ? 'منطقه ' + s : s)
}

export function telHref(v) {
  if (!v) return null
  let s = String(v).replace(/[^0-9+]/g, '')
  if (s.endsWith('+')) s = '+' + s.slice(0, -1)
  return s.length >= 7 ? 'tel:' + s : null
}

export function instagramUrl(v) {
  if (!v) return null
  const s = String(v).trim()
  if (/^https?:\/\//i.test(s)) return s
  const h = s.replace(/^@/, '').replace(/^instagram\.com\//i, '').replace(/\/$/, '')
  return /^[a-z0-9._]{2,40}$/i.test(h) ? 'https://instagram.com/' + h : null
}

export function websiteUrl(v) {
  if (!v) return null
  const s = String(v).trim()
  if (/^https?:\/\//i.test(s)) return s
  return /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(s) ? 'https://' + s : null
}
