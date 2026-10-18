'use client'
// ─────────────────────────────────────────────────────────────
//  گالری کلکسیون — نسخه v4.0
//  همان داده صفحه گالری (کاتالوگ آیتم‌ها و آیتم‌های خودم، با کافه‌ای که از آن گرفته‌ام)
//  در قاب صفحه‌های v4: کارت سیاه و سفید، نوار پیشرفت مشترک و قرص‌های فیلتر.
//  رنگ کمیابی خود آیتم‌ها می‌ماند، چون بخشی از تصویر آیتم است؛ آیتم قفل خاکستری است.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { getSession, subscribeToTables } from '@/lib/game/gameSystem'
import { L, SOURCE_LABEL, rarityOf } from '@/lib/theme/labels'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { V4Page } from '@/components/v4/kit/V4Page'
import { Btn, Card, Chip, Empty, Skeleton } from '@/components/v4/kit/kit'
import { Meter } from '@/components/v4/kit/Meter'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const FILTERS = [['all', 'همه'], ['owned', 'مال من'], ['locked', 'قفل'], ['platform', 'اکتشافی'], ['business', 'کمپینی']]

export default function GalleryV4() {
  return <V4Page title={L.gallery}><GalleryBody /></V4Page>
}

function GalleryBody() {
  const { C, T } = useV4()
  const [defs, setDefs] = useState([])
  const [owned, setOwned] = useState({})
  const [cafeMap, setCafeMap] = useState({})
  const [bizMap, setBizMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [flipped, setFlipped] = useState(false)

  const load = useCallback(async () => {
    const s = getSession()
    if (!s || !s.user) { window.location.href = '/'; return }
    const h = { apikey: SB_KEY, Authorization: 'Bearer ' + s.access_token }
    const get = (url) => fetch(SB_URL + '/rest/v1/' + url, { headers: h }).then(r => (r.ok ? r.json() : [])).catch(() => [])
    const [allDefs, myAwards, allCafes, allBiz] = await Promise.all([
      get('collectible_defs?select=*&order=rarity.asc,created_at.asc'),
      get('awards?user_id=eq.' + s.user.id + '&select=*'),
      get('cafes?select=id,name,district'),
      get('businesses?select=id,cafe_id'),
    ])
    setDefs(Array.isArray(allDefs) ? allDefs : [])
    const om = {}; (Array.isArray(myAwards) ? myAwards : []).forEach(a => { if (a.code) om[a.code] = a }); setOwned(om)
    const cm = {}; (Array.isArray(allCafes) ? allCafes : []).forEach(c => { cm[c.id] = c }); setCafeMap(cm)
    const bm = {}; (Array.isArray(allBiz) ? allBiz : []).forEach(b => { bm[b.id] = b.cafe_id }); setBizMap(bm)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const s = getSession()
    if (!s || !s.user) return
    return subscribeToTables([{ table: 'awards', event: '*', filter: 'user_id=eq.' + s.user.id }, { table: 'collectible_defs', event: '*' }], () => load())
  }, [load])

  const visible = defs.filter(d => {
    if (filter === 'owned') return !!owned[d.code]
    if (filter === 'locked') return !owned[d.code]
    if (filter === 'platform') return d.source === 'platform'
    if (filter === 'business') return d.source === 'business'
    return true
  })
  const ownedCount = defs.filter(d => owned[d.code]).length
  const pct = defs.length ? Math.round(ownedCount / defs.length * 100) : 0
  const originOf = (def) => {
    const aw = owned[def.code]
    const viaBiz = aw && aw.business_id ? bizMap[aw.business_id] : null
    const cid = viaBiz || (aw && aw.cafe_id) || def.cafe_id || null
    return cid ? cafeMap[cid] : null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .gl4-flip{transition:transform .65s cubic-bezier(.4,.2,.2,1);transform-style:preserve-3d}
        .gl4-flip.on{transform:rotateY(180deg)}
        .gl4-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:${R.box}px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
        .gl4-back{transform:rotateY(180deg)}
      ` }} />
      <Card style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{L.gallerySub}</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fa(ownedCount)}<span style={{ fontSize: 14, color: C.sub, fontWeight: 600 }}> از {fa(defs.length)}</span></div>
        <div style={{ margin: '12px 0 6px' }}><Meter value={pct} segments={5} size="lg" /></div>
        <div style={{ fontSize: 11, color: C.sub }}>{pct === 100 ? 'همه را جمع کرده‌ای!' : fa(pct) + '٪ کامل · ' + fa(defs.length - ownedCount) + ' آیتم مانده'}</div>
      </Card>

      <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
        {FILTERS.map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}
      </div>

      {loading ? <Skeleton h={110} n={2} />
        : visible.length === 0 ? <Empty icon="image" title="چیزی اینجا نیست" text="با رویدادهای کافه‌ها و کشف شهر آیتم تازه می‌گیری." />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            {visible.map((d, i) => {
              const isOwned = !!owned[d.code]
              const rr = rarityOf(d.rarity)
              return (
                <button key={d.code} type="button" className="tl4-press" onClick={() => { setFlipped(false); setSelected(d) }} aria-label={isOwned ? d.title : 'آیتم قفل'}
                  style={{ aspectRatio: '1', borderRadius: R.box, border: '1px solid ' + (isOwned ? 'transparent' : T.hair), background: isOwned ? rr.grad : T.chip, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    cursor: 'pointer', fontFamily: 'inherit', padding: '6px 4px', animation: 'tl4Pop .35s both', animationDelay: Math.min(i * 25, 500) + 'ms' }}>
                  {isOwned ? <span style={{ fontSize: 36 }}>{d.icon}</span> : <Icon name="lock" size={24} color={C.sub} />}
                  {isOwned && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#fff', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,.45)', lineHeight: 1.3 }}>{d.title}</span>}
                </button>
              )
            })}
          </div>}

      {selected && (() => {
        const isOwned = !!owned[selected.code]
        const aw = owned[selected.code]
        const rr = rarityOf(selected.rarity)
        const origin = originOf(selected)
        const Row = ({ k, v, mono }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.chip, borderRadius: R.box, padding: '7px 11px' }}>
            <span style={{ fontSize: 10, color: C.sub, flexShrink: 0, minWidth: 38 }}>{k}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text, flex: 1, textAlign: 'left', direction: mono ? 'ltr' : 'rtl', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
          </div>
        )
        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: T.dark ? 'rgba(0,0,0,.6)' : 'rgba(20,20,22,.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20, animation: 'tl4Fade .2s' }}>
            <div onClick={e => e.stopPropagation()} style={{ perspective: 1400, width: '100%', maxWidth: 330 }}>
              <div className={'gl4-flip' + (flipped ? ' on' : '')} onClick={() => isOwned && setFlipped(f => !f)} style={{ position: 'relative', width: '100%', aspectRatio: '3/4', cursor: isOwned ? 'pointer' : 'default' }}>
                <div className="gl4-face" style={{ background: isOwned ? rr.grad : T.glassMenu, border: '1px solid ' + T.hair, boxShadow: T.shadow2 }}>
                  {isOwned ? <div style={{ fontSize: 78 }}>{selected.icon}</div> : <Icon name="lock" size={56} color={C.sub} />}
                  <div style={{ fontSize: 19, fontWeight: 900, color: isOwned ? '#fff' : C.text, textAlign: 'center', marginTop: 14, textShadow: isOwned ? '0 2px 8px rgba(0,0,0,.35)' : 'none' }}>{isOwned ? selected.title : 'هنوز قفل است'}</div>
                  <span style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: isOwned ? '#fff' : C.text, background: isOwned ? 'rgba(0,0,0,.28)' : T.chip, borderRadius: R.pill, padding: '4px 13px' }}>{rr.label}</span>
                  <div style={{ position: 'absolute', bottom: 16, fontSize: 10.5, color: isOwned ? 'rgba(255,255,255,.9)' : C.sub, fontWeight: 700 }}>{isOwned ? 'بزن تا پشتش را ببینی' : 'با رویدادها و کشف شهر بازش کن'}</div>
                </div>
                <div className="gl4-face gl4-back" style={{ background: C.card, border: '1px solid ' + T.hairStrong, boxShadow: T.shadow2, justifyContent: 'flex-start' }}>
                  <div style={{ fontSize: 34, marginBottom: 4 }}>{selected.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text, textAlign: 'center' }}>{selected.title}</div>
                  <span style={{ marginTop: 7, fontSize: 10, fontWeight: 800, color: C.text, background: T.chip, border: '1px solid ' + T.hair, borderRadius: R.pill, padding: '3px 11px' }}>{rr.label}</span>
                  <div style={{ width: '100%', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Row k="از کجا" v={origin ? origin.name + (origin.district ? ' · منطقه ' + origin.district : '') : (SOURCE_LABEL[selected.source] || '—')} />
                    {aw && aw.earned_at && <Row k="کی" v={new Date(aw.earned_at).toLocaleDateString('fa-IR-u-ca-persian', { timeZone: 'Asia/Tehran' }) + ' · ' + new Date(aw.earned_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })} />}
                    <Row k="نوع" v={SOURCE_LABEL[selected.source] || selected.source || '—'} />
                    {aw && aw.code && <Row k="کد" v={aw.code} mono />}
                  </div>
                  {selected.description && <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.8, textAlign: 'center', marginTop: 12 }}>{selected.description}</div>}
                </div>
              </div>
              <Btn kind="ghost" block onClick={() => setSelected(null)} style={{ marginTop: 14 }}>بستن</Btn>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
