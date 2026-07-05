'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import {
  getSession, getLevelInfo, clanLevel,
  fetchMyClans, fetchClanStandings, fetchClanMembers, fetchClanMissions, subscribeToTables,
  clanCreate, clanJoin, clanLeave, clanSetActive,
} from '../gameSystem'

const EMBLEMS = ['⚔️', '🌙', '☕', '⛰️', '🔥', '🐺', '🦊', '🦁', '👑', '💎']
const COLORS  = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f97316', '#ef4444', '#eab308']

export default function ClanPage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [tab, setTab] = useState('mine')       // mine | discover | create
  const [myClans, setMyClans] = useState([])
  const [standings, setStandings] = useState([])
  const [members, setMembers] = useState([])
  const [missions, setMissions] = useState([])
  const [activeClan, setActiveClan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => { setPal(loadPrefs()) }, [])

  const showToast = useCallback((m) => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])

  const load = useCallback(async () => {
    const sess = getSession()
    if (!sess || !sess.user) { window.location.href = '/'; return }
    const [mine, stand] = await Promise.all([fetchMyClans(sess), fetchClanStandings(sess)])
    setMyClans(mine)
    setStandings(stand)
    const active = mine.find(m => m.is_active) || mine[0] || null
    setActiveClan(active)
    if (active) {
      const [mem, mis] = await Promise.all([
        fetchClanMembers(sess, active.clan_id),
        fetchClanMissions(sess, active.clan_id),
      ])
      setMembers(mem)
      setMissions(mis)
    } else {
      setMembers([]); setMissions([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // realtime: تغییر عضویت کلن، کلن‌ها، یا XP اعضا → لحظه‌ای آپدیت
  useEffect(() => {
    const unsub = subscribeToTables([
      { table:'clan_members', event:'*' },
      { table:'clans',        event:'*' },
      { table:'profiles',     event:'UPDATE' },
    ], () => load())
    return () => unsub()
  }, [load])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)

  async function onJoin(clanId) {
    const r = await clanJoin(getSession(), clanId)
    if (r && r.ok) { showToast('✅ عضو شدی!'); load() }
    else showToast('خطا: ' + ((r && r.error) || 'نشد'))
  }
  async function onLeave(clanId) {
    const r = await clanLeave(getSession(), clanId)
    if (r && r.ok) { showToast('از کلن خارج شدی'); load() }
    else showToast(r?.error === 'leader_cannot_leave' ? 'رهبر نمی‌تونه خارج شه' : 'خطا')
  }
  async function onSetActive(clanId) {
    const r = await clanSetActive(getSession(), clanId)
    if (r && r.ok) { showToast('کلن فعال عوض شد'); load() }
  }

  const activeStanding = activeClan && standings.find(s => s.id === activeClan.clan_id)

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>کلن</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        {/* تب‌ها */}
        <div style={S.tabs}>
          {[['mine', 'کلن من'], ['discover', 'کشف'], ['create', '+ ساخت']].map(([k, label]) => (
            <button key={k} style={tab === k ? S.tabActive : S.tab} onClick={() => setTab(k)}>{label}</button>
          ))}
        </div>

        {loading && <div style={S.loading}>در حال بارگذاری…</div>}

        {/* ── کلن من ── */}
        {!loading && tab === 'mine' && (
          myClans.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>هنوز عضو کلنی نیستی</div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>یه کلن بساز یا به یکی بپیوند</div>
              <button style={S.primaryBtn} onClick={() => setTab('discover')}>کشف کلن‌ها</button>
            </div>
          ) : (
            <>
              {/* بنر کلن فعال */}
              {activeClan && (
                <div style={{ ...S.banner, background: `linear-gradient(135deg, ${activeClan.clans.color}, ${activeClan.clans.color}cc)` }}>
                  <div style={S.emblem}>{activeClan.clans.emblem}</div>
                  <div style={S.clanName}>{activeClan.clans.name}</div>
                  {activeStanding && (
                    <div style={S.clanMeta}>
                      سطح {clanLevel(activeStanding.xp_total).toLocaleString('fa')} ·
                      رتبه {activeStanding.rank.toLocaleString('fa')} ·
                      {' '}{Number(activeStanding.xp_total).toLocaleString('fa')} XP
                    </div>
                  )}
                  <div style={S.joinCode}>کد دعوت: {activeClan.clans.join_code}</div>
                </div>
              )}

              {/* آمار کلن فعال */}
              {activeStanding && (
                <div style={S.statsGrid}>
                  <Stat S={S} icon="⭐" value={Number(activeStanding.xp_total).toLocaleString('fa')} label="XP کل" />
                  <Stat S={S} icon="📅" value={Number(activeStanding.xp_weekly).toLocaleString('fa')} label="XP هفته" />
                  <Stat S={S} icon="👥" value={Number(activeStanding.member_count).toLocaleString('fa')} label="اعضا" />
                </div>
              )}

              {/* ماموریت کلنی */}
              {missions.length > 0 && (
                <>
                  <div style={S.sectionTitle}>ماموریت کلن</div>
                  <div style={S.list}>
                    {missions.map(m => {
                      const pct = Math.min(100, Math.round((m.progress / m.target) * 100))
                      return (
                        <div key={m.id} style={S.missionCard}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>{m.icon || '🎯'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.title}</div>
                              <div style={{ fontSize: 11, color: C.sub }}>{m.progress.toLocaleString('fa')} از {m.target.toLocaleString('fa')}</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: C.accent }}>+{m.reward_xp} XP</div>
                          </div>
                          <div style={S.progTrack}><div style={{ ...S.progFill, width: pct + '%' }} /></div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* اعضا */}
              <div style={S.sectionTitle}>اعضای کلن</div>
              <div style={S.list}>
                {members.map((m, i) => {
                  const lv = getLevelInfo(m.xp).current
                  return (
                    <div key={m.user_id} style={{ ...S.row, ...(m.me ? S.rowMe : {}) }}>
                      <div style={S.rank}>{(i + 1).toLocaleString('fa')}</div>
                      <div style={{ ...S.rowAvatar, borderColor: lv.color }}>{m.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={S.rowName}>{m.name}{m.me && <span style={S.youTag}>تو</span>}</div>
                        <div style={S.rowRole}>{roleFa(m.role)}</div>
                      </div>
                      <div style={S.rowXp}>{m.xp.toLocaleString('fa')} XP</div>
                    </div>
                  )
                })}
              </div>

              {/* لیست کلن‌های من + سوییچ فعال */}
              {myClans.length > 1 && (
                <>
                  <div style={S.sectionTitle}>کلن‌های من</div>
                  <div style={S.list}>
                    {myClans.map(mc => (
                      <div key={mc.clan_id} style={S.miniClan}>
                        <span style={{ fontSize: 22 }}>{mc.clans.emblem}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{mc.clans.name}</div>
                          <div style={{ fontSize: 10, color: C.sub }}>{roleFa(mc.role)}{mc.is_active && ' · فعال'}</div>
                        </div>
                        {!mc.is_active && <button style={S.smallBtn} onClick={() => onSetActive(mc.clan_id)}>فعال کن</button>}
                        {mc.role !== 'leader' && <button style={S.smallBtnGhost} onClick={() => onLeave(mc.clan_id)}>خروج</button>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeClan && activeClan.role !== 'leader' && myClans.length === 1 && (
                <button style={S.leaveBtn} onClick={() => onLeave(activeClan.clan_id)}>خروج از کلن</button>
              )}
            </>
          )
        )}

        {/* ── کشف ── */}
        {!loading && tab === 'discover' && (
          <>
            <div style={S.sectionTitle}>کلن‌های برتر</div>
            <div style={S.list}>
              {standings.length === 0 && <div style={S.empty}>هنوز کلنی ساخته نشده. اولین باش!</div>}
              {standings.map(c => {
                const isMember = myClans.some(m => m.clan_id === c.id)
                return (
                  <div key={c.id} style={S.clanCard}>
                    <div style={{ ...S.clanEmblem, background: c.color }}>{c.emblem}</div>
                    <div style={{ flex: 1 }}>
                      <div style={S.clanCardName}>{c.name}</div>
                      <div style={S.clanCardMeta}>
                        رتبه {c.rank.toLocaleString('fa')} · {Number(c.member_count).toLocaleString('fa')} عضو · {Number(c.xp_total).toLocaleString('fa')} XP
                      </div>
                    </div>
                    {isMember
                      ? <span style={S.memberTag}>عضوی</span>
                      : <button style={{ ...S.joinBtn, background: c.color }} onClick={() => onJoin(c.id)}>پیوستن</button>}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── ساخت ── */}
        {!loading && tab === 'create' && (
          <CreateClan C={C} S={S} onDone={() => { setTab('mine'); load() }} showToast={showToast} />
        )}
      </div>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  )
}

function CreateClan({ C, S, onDone, showToast }) {
  const [name, setName] = useState('')
  const [emblem, setEmblem] = useState(EMBLEMS[0])
  const [color, setColor] = useState(COLORS[0])
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (name.trim().length < 2) { showToast('اسم کلن خیلی کوتاهه'); return }
    setBusy(true)
    const r = await clanCreate(getSession(), name.trim(), emblem, color, bio.trim() || null)
    setBusy(false)
    if (r && r.ok) { showToast('🎉 کلن ساخته شد!'); onDone() }
    else showToast(r?.error === 'name_taken' ? 'این اسم قبلاً گرفته شده' : 'خطا در ساخت')
  }

  return (
    <div>
      <div style={{ ...S.banner, background: `linear-gradient(135deg, ${color}, ${color}cc)`, marginBottom: 16 }}>
        <div style={S.emblem}>{emblem}</div>
        <div style={S.clanName}>{name || 'نام کلن'}</div>
      </div>

      <label style={S.label}>نام کلن</label>
      <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="مثلا کافه‌نشینان" maxLength={24} />

      <label style={S.label}>آرم</label>
      <div style={S.picker}>
        {EMBLEMS.map(e => (
          <button key={e} onClick={() => setEmblem(e)} style={{ ...S.pickBtn, ...(emblem === e ? S.pickActive : {}) }}>{e}</button>
        ))}
      </div>

      <label style={S.label}>رنگ</label>
      <div style={S.picker}>
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{ ...S.colorDot, background: c, border: color === c ? '3px solid ' + C.text : '3px solid transparent' }} />
        ))}
      </div>

      <label style={S.label}>معرفی (اختیاری)</label>
      <textarea style={{ ...S.input, minHeight: 60 }} value={bio} onChange={e => setBio(e.target.value)} placeholder="کلن ما درباره‌ی…" maxLength={120} />

      <button style={{ ...S.primaryBtn, marginTop: 16, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>
        {busy ? 'در حال ساخت…' : 'ساخت کلن'}
      </button>
    </div>
  )
}

function Stat({ icon, value, label, S }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIcon}>{icon}</div>
      <div style={S.statValue}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  )
}

function roleFa(role) {
  return role === 'leader' ? 'رهبر' : role === 'officer' ? 'افسر' : 'عضو'
}

const mkS = (C) => ({
  page: { minHeight: '100vh', background: C.bg, fontFamily: 'inherit', direction: 'rtl', color: C.text, paddingBottom: 40 },
  topbar: {
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)',
    borderBottom: '1px solid ' + C.border,
  },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: 16 },

  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: C.chip, color: C.sub, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  tabActive: { flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },

  loading: { textAlign: 'center', color: C.sub, fontSize: 13, padding: '30px 0' },
  empty: { textAlign: 'center', color: C.text, padding: '30px 16px' },

  banner: { borderRadius: 20, padding: 22, textAlign: 'center', color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', marginBottom: 16 },
  emblem: { fontSize: 44 },
  clanName: { fontSize: 22, fontWeight: 800, marginTop: 4 },
  clanMeta: { fontSize: 13, opacity: 0.9, marginTop: 4 },
  joinCode: { fontSize: 11, opacity: 0.85, marginTop: 8, background: 'rgba(255,255,255,.2)', display: 'inline-block', padding: '3px 10px', borderRadius: 999 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 },
  statCard: { background: C.card, backdropFilter: 'blur(20px)', border: '1px solid ' + C.border, borderRadius: 16, padding: '12px 6px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 15, fontWeight: 800, marginTop: 2, color: C.text },
  statLabel: { fontSize: 11, color: C.sub },

  sectionTitle: { fontWeight: 800, fontSize: 15, margin: '4px 0 10px', color: C.text },
  list: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },

  missionCard: { background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: '12px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' },
  progTrack: { height: 6, background: C.chip, borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  progFill: { height: '100%', background: C.accent, borderRadius: 999, transition: 'width .5s' },

  row: { display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' },
  rowMe: { border: '2px solid ' + C.accent, background: C.accentL },
  rank: { width: 22, textAlign: 'center', fontWeight: 800, color: C.sub, fontSize: 15 },
  rowAvatar: { width: 40, height: 40, borderRadius: '50%', background: C.card, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  rowName: { fontWeight: 700, fontSize: 14, color: C.text, display: 'flex', alignItems: 'center', gap: 6 },
  youTag: { fontSize: 10, background: C.accent, color: '#fff', borderRadius: 999, padding: '1px 7px' },
  rowRole: { fontSize: 12, color: C.sub },
  rowXp: { color: C.accent, fontWeight: 800, fontSize: 13 },

  miniClan: { display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: '10px 14px' },
  smallBtn: { background: C.accent, color: '#fff', border: 'none', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  smallBtnGhost: { background: 'transparent', color: C.danger, border: '1px solid ' + C.border, borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },

  clanCard: { display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: '12px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' },
  clanEmblem: { width: 46, height: 46, borderRadius: 14, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  clanCardName: { fontWeight: 800, fontSize: 15, color: C.text },
  clanCardMeta: { fontSize: 12, color: C.sub, marginTop: 2 },
  joinBtn: { color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  memberTag: { fontSize: 11, color: C.sub, background: C.chip, borderRadius: 999, padding: '5px 12px' },

  primaryBtn: { width: '100%', padding: 14, borderRadius: 14, border: 'none', background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  leaveBtn: { width: '100%', marginTop: 8, padding: 14, borderRadius: 14, border: 'none', background: C.accentL, color: C.danger, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },

  label: { display: 'block', fontSize: 12, fontWeight: 700, color: C.sub, margin: '14px 0 6px' },
  input: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12, border: '1px solid ' + C.border, background: C.card, color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  picker: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pickBtn: { width: 44, height: 44, borderRadius: 12, border: '1px solid ' + C.border, background: C.card, fontSize: 22, cursor: 'pointer' },
  pickActive: { border: '2px solid ' + C.accent, background: C.accentL },
  colorDot: { width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' },

  toast: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 4000, background: C.text, color: C.bg, borderRadius: 999, padding: '10px 22px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.2)' },
})
