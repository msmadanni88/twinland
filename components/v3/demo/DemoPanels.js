'use client'
// پنل‌های حالت نمایشی نسخه v3.0 — همان پنج تب پنل اصلی، ولی از دنیای شبیه‌سازی تغذیه می‌شوند.
// پنل‌های واقعی دست نخورده‌اند؛ این‌ها فقط وقتی حالت نمایشی روشن است جای آن‌ها نشان داده می‌شوند.
import { getLevelInfo } from '@/lib/game/gameSystem'
import { onColor } from '@/lib/theme/ui'
import { sim } from '@/components/v3/demo/simWorld'
import { buildBiz } from '@/components/v3/demo/simBiz'

const fa = (n) => Number(n || 0).toLocaleString('fa')
const Note = ({ C, children }) => <div style={{ fontSize: 11, color: C.danger, fontWeight: 800, marginBottom: 10 }}>🎬 {children || 'شبیه‌سازی — همه عددها ساختگی است'}</div>
const Title = ({ C, children }) => <div style={{ fontSize: 13, fontWeight: 900, color: C.text, margin: '14px 0 8px' }}>{children}</div>
const box = (C, hl) => ({ background: hl ? C.accentL : C.card, border: hl ? '2px solid ' + C.accent : '1px solid ' + C.border, borderRadius: 14, padding: '10px 12px' })
const wrap = { padding: '12px 12px 32px' }

function Kpis({ C, items }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
    {items.map((k, i) => <div key={i} style={{ ...box(C), textAlign: 'center', padding: '10px 6px' }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{k[0]} {fa(k[1])}</div>
      <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>{k[2]}</div>
    </div>)}
  </div>
}

function Feed({ C, feed, max }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {feed.slice(0, max).map(e => <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: C.text, background: e.me ? C.accentL : C.chip, borderRadius: 10, padding: '6px 9px', animation: 'tl2Fade .4s both' }}>
      <span style={{ flexShrink: 0 }}>{e.icon}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.text}</span>
      {e.tail && <span style={{ flexShrink: 0, color: C.accent, fontWeight: 900 }}>{e.tail}</span>}
    </div>)}
  </div>
}

export function SimDashboard({ C, snap, me, onCafe }) {
  const lv = getLevelInfo(me.xp)
  return <div style={wrap}>
    <Note C={C} />
    <div style={{ ...box(C, true), display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 26 }}>😎</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{me.name} · {lv.current.name}</div>
        <div style={{ height: 6, background: C.chip, borderRadius: 99, overflow: 'hidden', marginTop: 6 }}><div style={{ height: '100%', width: lv.progress + '%', background: C.accent, borderRadius: 99, transition: 'width .6s' }} /></div>
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{fa(me.xp)} XP</div>
        <div style={{ fontSize: 10.5, color: C.sub }}>رتبه {fa(snap.me.rank)} از {fa(snap.users)}</div>
      </div>
    </div>
    <Kpis C={C} items={[['🟢', snap.totalLive, 'نفر همین الان در مکان‌ها'], ['📍', snap.counters.checkins, 'چک‌این از شروع نمایش'], ['🏅', snap.counters.badges, 'نشان داده‌شده'], ['🎁', snap.counters.questDone, 'کمپین کامل‌شده']]} />
    <Title C={C}>🔥 شلوغ‌ترین مکان‌ها همین الان</Title>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {snap.hot.map((h, i) => <button key={h.id} className="tl2-press" onClick={() => onCafe && onCafe(h.id)} style={{ ...box(C), display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', width: '100%' }}>
        <span style={{ width: 20, fontWeight: 900, color: C.sub, fontSize: 12 }}>{fa(i + 1)}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
        <span style={{ fontSize: 11, color: C.sub, flexShrink: 0 }}>امروز {fa(h.today)}</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: onColor(C.danger), background: C.danger, borderRadius: 99, padding: '1px 8px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fa(h.present)}</span>
      </button>)}
    </div>
    <Title C={C}>⚡ جریان زنده</Title>
    <Feed C={C} feed={snap.feed} max={8} />
  </div>
}

export function SimMissions({ C, snap, highlightQuestId, onCafe }) {
  const mine = snap.me.done.filter(d => !snap.quests.some(q => q.id === d.id))
  const card = (q, done, prog, code) => {
    const hl = String(q.id) === String(highlightQuestId)
    const pct = done ? 100 : Math.min(100, Math.round(((prog || 0) / (q.target || 1)) * 100))
    return <div key={q.id} id={'quest-' + q.id} style={{ background: done ? C.green + '18' : C.card, border: '1px solid ' + (hl ? C.accent : done ? C.green + '55' : C.border), borderRadius: 14, padding: 12, boxShadow: hl ? '0 0 0 3px ' + C.accent + '33' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: done ? C.green + '20' : C.accent + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{done ? '✅' : q.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{q.title}</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: C.accent, flexShrink: 0 }}>+{fa(q.xp)} XP</div>
          </div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{q.cafeName} · {q.district}</div>
          {q.joined !== undefined && <div style={{ fontSize: 10.5, color: C.sub, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>👥 {fa(q.joined)} شرکت‌کننده · 🎁 {fa(q.done)} نفر کامل کرده‌اند</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '7px 0 4px' }}>
            <span style={{ fontSize: 10, color: done ? C.green : C.sub, fontWeight: done ? 800 : 400 }}>{done ? 'تکمیل شد ✓' : 'پیشرفت تو: ' + fa(prog || 0) + ' از ' + fa(q.target)}</span>
            <span style={{ fontSize: 10, color: C.sub }}>{fa(pct)}٪</span>
          </div>
          <div style={{ height: 5, background: C.chip, borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: pct + '%', background: done ? C.green : C.accent, borderRadius: 99, transition: 'width .5s' }} /></div>
        </div>
      </div>
      {done
        ? <div style={{ marginTop: 10, background: C.green + '15', border: '1px dashed ' + C.green, borderRadius: 10, padding: '8px 10px', textAlign: 'center', fontSize: 11.5, color: C.green, fontWeight: 800 }}>🎁 {q.reward_label}{code ? ' — کد نمایشی: ' + code : ''}</div>
        : <button className="tl2-press" onClick={() => onCafe && onCafe(q.cafe_id)} style={{ marginTop: 10, width: '100%', background: C.accent, border: 'none', borderRadius: 10, padding: 8, fontSize: 12, color: onColor(C.accent), fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>📍 برو به {q.cafeName}</button>}
    </div>
  }
  return <div style={wrap}>
    <Note C={C} />
    <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>{fa(snap.quests.length)} کمپین فعال · {fa(snap.counters.quests)} کمپین تازه از شروع نمایش</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mine.map(q => card(q, true, q.target, (snap.me.q[q.id] || {}).code))}
      {snap.quests.slice(0, 24).map(q => card(q, !!(q.my && q.my.completed), q.my ? q.my.progress : 0, q.my && q.my.code))}
    </div>
  </div>
}

export function SimRank({ C, snap, me }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const rows = snap.leaders.slice(0, 15)
  const meRow = { ...snap.meRow, xp: me.xp, name: me.name }
  const list = rows.some(r => r.me) ? rows : rows.concat([meRow])
  const d = snap.me.rankDelta
  return <div style={wrap}>
    <Note C={C}>شبیه‌سازی — جدول ساختگی {fa(snap.users)} کاربر، هر ثانیه تازه می‌شود</Note>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {list.map(p => <div key={p.id} style={{ ...box(C, p.me), display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ minWidth: 30, textAlign: 'center', fontSize: p.rank <= 3 ? 18 : 12, fontWeight: 900, color: p.rank <= 3 ? C.text : C.sub }}>{medals[p.rank] || fa(p.rank)}</div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{p.avatar}</div>
        <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name} {p.clan}{p.me && <span style={{ fontSize: 9, background: C.accent, color: onColor(C.accent), borderRadius: 99, padding: '1px 7px', marginRight: 6 }}>تو{d > 0 ? ' ▲' + fa(d) : ''}</span>}</div>
        <div style={{ fontSize: 12, fontWeight: 900, color: C.accent, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fa(p.me ? me.xp : p.xp)} XP</div>
      </div>)}
    </div>
  </div>
}

export function SimClan({ C, snap }) {
  const top = snap.clans[0] ? snap.clans[0].xp : 1
  return <div style={wrap}>
    <Note C={C} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {snap.clans.map(k => <div key={k.id} style={box(C, k.mine)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, textAlign: 'center', fontWeight: 900, color: C.sub, fontSize: 13 }}>{fa(k.rank)}</div>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{k.emblem}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text }}>{k.name}{k.mine && <span style={{ fontSize: 9, background: C.accent, color: onColor(C.accent), borderRadius: 99, padding: '1px 7px', marginRight: 6 }}>کلن تو</span>}</div>
            <div style={{ fontSize: 10.5, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{fa(k.members)} عضو · {fa(k.checkins)} چک‌این در این نمایش</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 900, color: C.accent, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fa(k.xp)}</div>
        </div>
        <div style={{ height: 5, background: C.chip, borderRadius: 99, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: Math.round(k.xp / top * 100) + '%', background: k.color, borderRadius: 99, transition: 'width .6s' }} /></div>
      </div>)}
    </div>
  </div>
}

export function SimProfile({ C, snap, me }) {
  const lv = getLevelInfo(me.xp)
  const stats = [['🔥', me.streak, 'استریک'], ['☕', me.checkedIn.size, 'مکان'], ['🪙', me.coins, 'سکه'], ['⭐', lv.current.level || 1, 'لِوِل']]
  return <div style={wrap}>
    <Note C={C} />
    <div style={{ background: C.grad, borderRadius: 18, padding: 16, textAlign: 'center', color: '#fff', marginBottom: 10 }}>
      <div style={{ fontSize: 34 }}>😎</div>
      <div style={{ fontSize: 17, fontWeight: 900 }}>{me.name}</div>
      <div style={{ fontSize: 12, opacity: 0.92, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{lv.current.name} · {fa(me.xp)} XP · رتبه {fa(snap.me.rank)}</div>
      {snap.me.dxp > 0 && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.92 }}>+{fa(snap.me.dxp)} XP در این نمایش</div>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
      {stats.map((s, i) => <div key={i} style={{ ...box(C), textAlign: 'center', padding: '10px 4px' }}>
        <div style={{ fontSize: 17 }}>{s[0]}</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fa(s[1])}</div>
        <div style={{ fontSize: 10, color: C.sub }}>{s[2]}</div>
      </div>)}
    </div>
    <Title C={C}>🖼 گنجینه · {fa(snap.me.items.length)} یادگاری تازه</Title>
    {snap.me.items.length === 0
      ? <div style={{ ...box(C), fontSize: 12, color: C.sub, textAlign: 'center' }}>با اولین چک‌این نمایشی، اولین یادگاری همین‌جا می‌نشیند</div>
      : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {snap.me.items.slice(0, 12).map(it => <div key={it.id} style={{ ...box(C), textAlign: 'center', padding: '10px 6px', animation: 'tl2Fade .5s both' }}>
          <div style={{ fontSize: 26 }}>{it.icon}</div>
          <div style={{ fontSize: 10.5, color: C.text, fontWeight: 700, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.cafe}</div>
        </div>)}
      </div>}
    {snap.me.badges.length > 0 && <>
      <Title C={C}>🏅 نشان‌های تازه</Title>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{snap.me.badges.map(b => <span key={b.name} style={{ fontSize: 11.5, fontWeight: 800, color: C.text, background: C.chip, border: '1px solid ' + C.border, borderRadius: 99, padding: '4px 10px' }}>🏅 {b.name}</span>)}</div>
    </>}
  </div>
}

export function SimBizCard({ C, snap }) {
  const W = sim.world()
  if (!W) return null
  const b = buildBiz(W)
  const q = b.d.qstats[0]
  return <div style={wrap}>
    <Note C={C}>شبیه‌سازی — پنل کسب‌وکار «{b.name}»</Note>
    <Kpis C={C} items={[['🟢', b.present, 'نفر همین الان اینجا'], ['📍', b.today, 'چک‌این امروز'], ['🆕', b.newToday, 'مشتری تازه در این نمایش'], ['🔁', b.retToday, 'مشتری برگشتی در این نمایش']]} />
    <div style={{ ...box(C), marginTop: 8, fontSize: 12, color: C.text, lineHeight: 1.9 }}>
      <div>🏆 رتبه {fa(b.d.rank.rank_in_district)} از {fa(b.d.rank.total_in_district)} در {b.d.rank.district}</div>
      {q && <div>🎁 کمپین فعال: {fa(q.completions)} تکمیل · {fa(q.redemptions_used)} کد استفاده‌شده</div>}
      <div>🛡 کلن برتر: {b.d.clans[0].emblem} {b.d.clans[0].clan_name} با {fa(b.d.clans[0].total_checkins)} چک‌این</div>
    </div>
    <a href="/business?demo=1" style={{ display: 'block', marginTop: 10, textAlign: 'center', background: C.accent, color: onColor(C.accent), borderRadius: 12, padding: 11, fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>باز کردن پنل کامل کسب‌وکار با همین دنیا ›</a>
  </div>
}

// اتاق کنترل: همه پنل‌ها کنار هم و زنده، برای دیدن کل شبیه‌سازی در یک نگاه
export function DemoConsole({ C, demo, onClose, onCafe }) {
  if (!demo.on) return null
  const snap = demo.snap, me = demo.me
  const cards = [
    ['📊 نمای کلی شهر', <SimDashboard key="d" C={C} snap={snap} me={me} onCafe={onCafe} />],
    ['🏆 رتبه‌بندی', <SimRank key="r" C={C} snap={snap} me={me} />],
    ['🎯 کمپین‌ها و ماموریت‌ها', <SimMissions key="m" C={C} snap={snap} onCafe={onCafe} />],
    ['🛡 کلن‌ها', <SimClan key="c" C={C} snap={snap} />],
    ['👤 پروفایل و گنجینه', <SimProfile key="p" C={C} snap={snap} me={me} />],
    ['🏪 سمت کسب‌وکار', <SimBizCard key="b" C={C} snap={snap} />],
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: C.bg || C.card, color: C.text, display: 'flex', flexDirection: 'column', direction: 'rtl', animation: 'tl2Fade .25s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px', borderBottom: '1px solid ' + C.border, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>🎬 اتاق کنترل شبیه‌سازی</div>
          <div style={{ fontSize: 11, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{fa(snap.users)} کاربر ساختگی · {fa(snap.places)} مکان · ثانیه {fa(snap.tick)} · هیچ‌چیز در سایت واقعی ثبت نمی‌شود</div>
        </div>
        <button className="tl2-press" onClick={onClose} style={{ border: 'none', background: C.accent, color: onColor(C.accent), borderRadius: 12, padding: '9px 14px', fontSize: 12.5, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 }}>برگشت به نقشه</button>
      </div>
      <div className="tl-vscroll" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 12, maxWidth: 1500, margin: '0 auto' }}>
          {cards.map(c => <section key={c[0]} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 560 }}>
            <div style={{ padding: '11px 14px', fontSize: 13, fontWeight: 900, borderBottom: '1px solid ' + C.border, flexShrink: 0 }}>{c[0]}</div>
            <div className="tl-vscroll" style={{ overflowY: 'auto' }}>{c[1]}</div>
          </section>)}
        </div>
      </div>
    </div>
  )
}
