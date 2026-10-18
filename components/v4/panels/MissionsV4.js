'use client'
// ─────────────────────────────────────────────────────────────
//  ماموریت‌ها و رویدادها — زبانه پنل، نسخه v4.0
//  جستجو در نام رویداد، جایزه، نام کافه و منطقه؛ فیلتر وضعیت؛ مرتب کردن بر اساس تاریخ، پایان، امتیاز و منطقه.
//  داده و قاعده‌ها همان MissionsTab است: رویدادهای فعال، پیشرفت و کدهای جایزه خود کاربر، و تازه شدن لحظه‌ای.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SB_KEY, SB_URL } from '@/lib/config'
import { ROUTE } from '@/lib/theme/labels'
import { getSession, subscribeToChanges, subscribeToTables } from '@/lib/game/gameSystem'
import { districtLabel, timeLeft } from '@/lib/events/format'
import { track } from '@/lib/analytics'
import { EventArt } from '@/components/events/EventArt'
import { Icon } from '@/components/v4/icons'
import { R } from '@/components/v4/theme'
import { useV4 } from '@/components/v4/kit/context'
import { Btn, Chip, Empty, Field, Skeleton, Tag, faDigits } from '@/components/v4/kit/kit'
import { Meter } from '@/components/v4/kit/Meter'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const FILTERS = [['all', 'همه'], ['open', 'انجام‌نشده'], ['going', 'در جریان'], ['done', 'انجام‌شده'], ['discount', 'تخفیف‌دار'], ['soon', 'رو به پایان']]
const SORTS = [['new', 'تازه‌ترین', 'clock'], ['ending', 'نزدیک به پایان', 'calendar'], ['xp', 'بیشترین امتیاز', 'star'], ['district', 'منطقه', 'map']]
const norm = (s) => String(s || '').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/[‌\s]+/g, ' ').trim().toLowerCase()
  .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
const districtNo = (s) => { const m = String(s || '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).match(/\d+/); return m ? Number(m[0]) : 999 }

export function MissionsV4({ cafes, highlightQuestId, setSelCafe, showToast }) {
  const { C, T } = useV4()
  const [quests, setQuests] = useState(null)
  const [progress, setProgress] = useState({})
  const [redemptions, setRedemptions] = useState({})
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('new')
  const [sortOpen, setSortOpen] = useState(false)
  const sess = getSession()
  const uid = sess && sess.user && sess.user.id

  const load = useCallback(() => {
    const h = { apikey: SB_KEY, Authorization: 'Bearer ' + ((sess && sess.access_token) || SB_KEY) }
    fetch(SB_URL + '/rest/v1/quests?active=eq.true&or=(ends_at.is.null,ends_at.gt.' + new Date().toISOString() + ')&select=id,title,description,icon,art_key,category,reward_label,reward_xp,discount_pct,target_count,cafe_id,created_at,ends_at,cafes(name,district)&order=created_at.desc&limit=80', { headers: h })
      .then(r => r.json()).then(rows => setQuests(Array.isArray(rows) ? rows : [])).catch(() => setQuests(qs => qs || []))
    if (uid) {
      fetch(SB_URL + '/rest/v1/quest_progress?user_id=eq.' + uid + '&select=quest_id,progress,completed', { headers: h })
        .then(r => r.json()).then(rows => { const m = {}; (Array.isArray(rows) ? rows : []).forEach(p => { m[p.quest_id] = p }); setProgress(m) }).catch(() => {})
      fetch(SB_URL + '/rest/v1/redemptions?user_id=eq.' + uid + '&select=quest_id,code', { headers: h })
        .then(r => r.json()).then(rows => { const m = {}; (Array.isArray(rows) ? rows : []).forEach(r => { m[r.quest_id] = r }); setRedemptions(m) }).catch(() => {})
    }
  }, [uid]) // eslint-disable-line

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const a = subscribeToChanges(['quests'], () => load())
    let b = () => {}
    if (uid) b = subscribeToTables([{ table: 'quest_progress', event: '*', filter: 'user_id=eq.' + uid }, { table: 'redemptions', event: '*', filter: 'user_id=eq.' + uid }], () => load())
    return () => { a(); b() }
  }, [load, uid])
  useEffect(() => {
    if (!highlightQuestId || !quests) return
    const el = document.getElementById('quest4-' + highlightQuestId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightQuestId, quests])
  useEffect(() => {
    if (!q) return
    const t = setTimeout(() => track('missions_search', { len: q.length }), 900)
    return () => clearTimeout(t)
  }, [q])

  const view = useMemo(() => {
    if (!quests) return null
    const now = Date.now()
    const needle = norm(q)
    let rows = quests.map(x => {
      const p = progress[x.id]
      return { ...x, _cur: p ? p.progress : 0, _done: !!(p && p.completed), _cafe: (x.cafes && x.cafes.name) || 'کافه', _dist: (x.cafes && x.cafes.district) || '' }
    })
    if (needle) rows = rows.filter(x => norm([x.title, x.description, x.reward_label, x._cafe, x._dist, districtLabel(x._dist)].join(' ')).includes(needle))
    rows = rows.filter(x => {
      if (filter === 'open') return !x._done
      if (filter === 'going') return !x._done && x._cur > 0
      if (filter === 'done') return x._done
      if (filter === 'discount') return (x.discount_pct || 0) > 0
      if (filter === 'soon') return x.ends_at && new Date(x.ends_at).getTime() - now < 72 * 3600e3
      return true
    })
    const by = {
      new: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      ending: (a, b) => (a.ends_at ? new Date(a.ends_at).getTime() : Infinity) - (b.ends_at ? new Date(b.ends_at).getTime() : Infinity),
      xp: (a, b) => (b.reward_xp || 0) - (a.reward_xp || 0),
      district: (a, b) => districtNo(a._dist) - districtNo(b._dist) || String(a._cafe).localeCompare(String(b._cafe), 'fa'),
    }[sort]
    return rows.sort(by)
  }, [quests, progress, q, filter, sort])

  function openCafe(x) {
    const cafe = (cafes || []).find(c => c.id === x.cafe_id)
    if (cafe) setSelCafe && setSelCafe({ ...cafe, _from: { source: 'quest', refType: 'quest', refId: String(x.id) } })
    else showToast && showToast('این کافه الان روی نقشه نیست؛ از صفحه رویدادها امتحان کن', 'warn')
  }

  const sortLabel = (SORTS.find(s => s[0] === sort) || SORTS[0])[1]
  let lastDist = null
  return (
    <div style={{ padding: '12px 12px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 900 }}>ماموریت‌ها و رویدادها</div>
        {quests && <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>{fa(quests.length)} فعال</span>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Field icon="search" value={q} onChange={setQ} onClear={() => setQ('')} placeholder="جستجوی رویداد، جایزه، کافه یا منطقه" style={{ flex: 1 }} />
        <button type="button" className={'tl4-btn' + (sortOpen ? ' is-on' : '')} onClick={() => setSortOpen(v => !v)} aria-expanded={sortOpen} aria-label={'مرتب کردن: ' + sortLabel} title={'مرتب کردن: ' + sortLabel}
          style={{ width: 42, height: 42, borderRadius: R.box, border: '1px solid ' + (sortOpen ? 'transparent' : T.hair), background: sortOpen ? C.accent : T.chip, color: sortOpen ? T.onAccent : C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="sort" size={19} />
        </button>
      </div>

      {sortOpen && (
        <div role="radiogroup" aria-label="مرتب کردن" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 6, marginTop: 8, padding: 6, borderRadius: R.box, background: T.chip, border: '1px solid ' + T.hair, animation: 'tl4Pop .18s ease' }}>
          {SORTS.map(([k, l, ic]) => {
            const on = sort === k
            return (
              <button key={k} type="button" role="radio" aria-checked={on} className="tl4-press" onClick={() => { setSort(k); setSortOpen(false); track('missions_sort', { by: k }) }}
                style={{ height: 36, borderRadius: R.box, border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: on ? 900 : 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: on ? C.accent : 'transparent', color: on ? T.onAccent : C.text }}>
                <Icon name={ic} size={15} />{l}
              </button>
            )
          })}
        </div>
      )}

      <div className="tl4-noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '10px -12px 12px', padding: '0 12px' }}>
        {FILTERS.map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}
      </div>

      {!view && <Skeleton h={112} n={3} />}
      {view && quests.length === 0 && (
        <Empty icon="target" title="الان رویداد فعالی نیست" text="کافه‌دارها به‌زودی چیز تازه‌ای منتشر می‌کنند و همین‌جا دیده می‌شود." action={<Btn kind="ghost" href={ROUTE.quests}>صفحه رویدادها</Btn>} />
      )}
      {view && quests.length > 0 && view.length === 0 && (
        <Empty icon="search" title="چیزی پیدا نشد" text={q ? 'با کلمه دیگری جستجو کن یا فیلتر را بردار.' : 'با این فیلتر رویدادی نیست.'}
          action={<Btn kind="ghost" onClick={() => { setQ(''); setFilter('all') }}>پاک کردن جستجو و فیلتر</Btn>} />
      )}

      {view && view.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {view.map(x => {
            const head = sort === 'district' && x._dist !== lastDist ? (lastDist = x._dist, faDigits(districtLabel(x._dist)) || 'بدون منطقه') : null
            return (
              <div key={x.id}>
                {head && <div style={{ fontSize: 11.5, fontWeight: 900, color: C.sub, margin: '6px 4px 6px' }}>{head}</div>}
                <MissionCard x={x} hl={String(x.id) === String(highlightQuestId)} red={redemptions[x.id]} onGo={() => openCafe(x)} />
              </div>
            )
          })}
          <Btn kind="ghost" block icon="list" href={ROUTE.quests} style={{ marginTop: 6 }}>صفحه کامل رویدادها</Btn>
        </div>
      )}
    </div>
  )
}

function MissionCard({ x, hl, red, onGo }) {
  const { C, T } = useV4()
  const target = x.target_count || 1
  const pct = Math.min(100, Math.round((x._cur / target) * 100))
  const left = timeLeft(x.ends_at)
  return (
    <div id={'quest4-' + x.id} style={{ borderRadius: R.box, padding: 12, background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
      border: '1px solid ' + (hl ? C.text : T.hair), boxShadow: hl ? '0 0 0 3px ' + T.hairStrong : 'none', transition: 'box-shadow .3s, border-color .3s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <EventArt ev={x} size={46} style={{ borderRadius: R.box }} />
          {x._done && <span style={{ position: 'absolute', right: -4, bottom: -4, width: 20, height: 20, borderRadius: '50%', background: C.text, color: T.onAccent, border: '2px solid ' + C.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={12} stroke={2.6} /></span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 900, color: C.text, lineHeight: 1.6 }}>{x.title}</div>
            {x.reward_xp > 0 && <span style={{ fontSize: 11, fontWeight: 900, color: C.text, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>+{fa(x.reward_xp)} XP</span>}
          </div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{x._cafe}{x._dist ? ' · ' + faDigits(districtLabel(x._dist)) : ''}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {x.reward_label && <Tag>{x.reward_label}</Tag>}
            {x.discount_pct > 0 && !/تخفیف/.test(x.reward_label || '') && <Tag>{fa(x.discount_pct)}٪ تخفیف</Tag>}
            {left && <Tag strong={left.urgent}>{left.text} مانده</Tag>}
          </div>
          {target > 1 && (
            <div style={{ marginTop: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.sub, marginBottom: 5 }}>
                <span style={{ fontWeight: x._done ? 900 : 600, color: x._done ? C.text : C.sub }}>{x._done ? 'کامل شد' : fa(x._cur) + ' از ' + fa(target) + ' چک‌این'}</span>
                <span>{fa(pct)}٪</span>
              </div>
              <Meter value={pct} segments={Math.min(10, target)} size="sm" />
            </div>
          )}
        </div>
      </div>
      {x._done
        ? <div style={{ marginTop: 10, borderRadius: R.box, padding: '8px 10px', textAlign: 'center', border: '1px dashed ' + T.hairStrong, fontSize: 11.5, fontWeight: 800, color: C.text }}>
            {x.reward_label || 'جایزه گرفتی'}{red && red.code ? ' · کد: ' + red.code : ''}
          </div>
        : <Btn block size="sm" icon="pin" onClick={onGo} style={{ marginTop: 10 }}>برو به {x._cafe} و چک‌این کن</Btn>}
    </div>
  )
}
