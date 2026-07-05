'use client'

import { useState, useEffect } from 'react'
import { buildC, loadPrefs, DEFAULT_PALETTE, DEFAULT_MODE } from '../palettes'
import {
  SB_URL, SB_KEY, getLevelInfo, getSession,
  fetchMyProfile, fetchXpHistory, fetchAwards, subscribeToTables, REASON_LABELS,
} from '../gameSystem'

// مدال‌های محاسبه‌شده از آمار واقعی (fallback وقتی جدول awards هنوز پر نشده)
const BADGE_DEFS = [
  { icon: '🥇', name: 'اولین چک‌این', ok: s => s.checkins >= 1 },
  { icon: '🔥', name: 'استریک ۳ روز', ok: s => s.streak >= 3 },
  { icon: '⭐', name: '۱۰ کافه',      ok: s => s.cafes >= 10 },
  { icon: '🗺️', name: '۵ منطقه',      ok: s => s.zones >= 5 },
  { icon: '👑', name: '۵۰ چک‌این',    ok: s => s.checkins >= 50 },
  { icon: '💎', name: 'کلکسیونر ۲۰',  ok: s => s.cafes >= 20 },
  { icon: '🌙', name: 'شب‌گرد',        ok: s => false },
  { icon: '🏆', name: 'قهرمان هفته',  ok: s => false },
]

function faWhen(iso) {
  const d = new Date(iso).getTime()
  const mins = Math.floor((Date.now() - d) / 60000)
  if (mins < 1) return 'همین الان'
  if (mins < 60) return mins.toLocaleString('fa') + ' دقیقه پیش'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs.toLocaleString('fa') + ' ساعت پیش'
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'دیروز'
  return days.toLocaleString('fa') + ' روز پیش'
}

export default function ProfilePage() {
  const [pal, setPal] = useState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  const [tab, setTab] = useState('badges')
  const [profile, setProfile] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [xpHistory, setXpHistory] = useState([])
  const [awards, setAwards] = useState([])

  useEffect(() => { setPal(loadPrefs()) }, [])

  useEffect(() => {
    const sess = getSession()
    if (!sess || !sess.user) { window.location.href = '/'; return }
    const uid = sess.user.id
    const h = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (sess.access_token || SB_KEY) }

    let alive = true
    // پروفایل واقعی (منبع واحد XP)
    fetchMyProfile(sess).then(p => { if (alive && p) setProfile(p) })
    // چک‌این‌های واقعی (برای آمار و مدال‌ها)
    fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at,cafes(name,description,zone)&order=created_at.desc&limit=50', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setCheckins(rows) }).catch(() => {})
    // تاریخچه‌ی دقیق XP + جوایز
    fetchXpHistory(sess).then(rows => { if (alive) setXpHistory(rows) })
    fetchAwards(sess).then(rows => { if (alive) setAwards(rows) })

    // realtime: پروفایل، بج‌ها، تاریخچه و چک‌این‌ها لحظه‌ای آپدیت شن
    const reloadCheckins=()=>fetch(SB_URL + '/rest/v1/checkins?user_id=eq.' + uid + '&select=cafe_id,xp_awarded,created_at,cafes(name,description,zone)&order=created_at.desc&limit=50', { headers: h })
      .then(r => r.json()).then(rows => { if (alive && Array.isArray(rows)) setCheckins(rows) }).catch(() => {})
    const unsub = subscribeToTables([
      { table:'profiles',   event:'UPDATE', filter:'id=eq.'+uid },
      { table:'awards',     event:'*',      filter:'user_id=eq.'+uid },
      { table:'xp_history', event:'INSERT', filter:'user_id=eq.'+uid },
      { table:'checkins',   event:'INSERT', filter:'user_id=eq.'+uid },
    ],(p)=>{
      if(!alive) return
      if(p.table==='profiles' && p.record) setProfile(prev => ({ ...(prev || {}), ...p.record }))
      if(p.table==='xp_history') fetchXpHistory(sess).then(rows => { if (alive) setXpHistory(rows) })
      if(p.table==='awards') fetchAwards(sess).then(rows => { if (alive) setAwards(rows) })
      if(p.table==='checkins') reloadCheckins()
    })
    return () => { alive = false; unsub() }
  }, [])

  const C = buildC(pal.palette, pal.mode)
  const S = mkS(C)

  const xp = profile?.xp || 0
  const { current, next, progress } = getLevelInfo(xp)
  const name = profile?.display_name || 'کاربر'
  const streak = profile?.streak || 0
  const joinedDays = profile?.created_at
    ? Math.max(1, Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / 86400000)) : 1

  const checkinCount = checkins.length
  const cafeCount = new Set(checkins.map(c => c.cafe_id)).size
  const zoneCount = new Set(checkins.map(c => c.cafes?.zone).filter(Boolean)).size
  const stats = { checkins: checkinCount, cafes: cafeCount, streak, zones: zoneCount }

  // مدال‌ها: اگه جدول awards پر شده از همون استفاده کن، وگرنه از آمار محاسبه کن
  const earnedBadges = awards.filter(a => a.kind === 'badge')
  const useRealAwards = earnedBadges.length > 0

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <a href="/" style={S.backBtn}>‹ نقشه</a>
        <div style={S.brand}>پروفایل</div>
        <div style={{ width: 64 }} />
      </div>

      <div style={S.container}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img src="/icon_profile_active@2x.png" alt="پروفایل" width={88} height={88} style={{ objectFit: 'contain', display: 'inline-block' }} />
        </div>

        {/* هدر پروفایل */}
        <div style={S.card}>
          <div style={S.headerRow}>
            <div style={{ ...S.avatar, borderColor: current.color }}>{current.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={S.name}>{name}</div>
              <div style={{ ...S.levelPill, background: current.color }}>{current.icon} {current.name}</div>
            </div>
          </div>

          <div style={S.xpRow}>
            <span style={S.xpLabel}>{xp.toLocaleString('fa')} XP</span>
            <span style={S.xpNext}>
              {next ? `تا ${next.name}: ${(next.minXP - xp).toLocaleString('fa')} XP` : 'حداکثر لول!'}
            </span>
          </div>
          <div style={S.xpTrack}>
            <div style={{ ...S.xpFill, width: progress + '%', background: current.color }} />
          </div>
        </div>

        {/* آمار واقعی */}
        <div style={S.statsGrid}>
          <Stat S={S} icon="📍" value={checkinCount} label="چک‌این" />
          <Stat S={S} icon="☕" value={cafeCount} label="کافه" />
          <Stat S={S} icon="🔥" value={streak} label="استریک" />
          <Stat S={S} icon="📅" value={joinedDays} label="روز فعال" />
        </div>

        {/* تب‌ها */}
        <div style={S.tabs}>
          <button style={tab === 'badges' ? S.tabActive : S.tab} onClick={() => setTab('badges')}>مدال‌ها</button>
          <button style={tab === 'history' ? S.tabActive : S.tab} onClick={() => setTab('history')}>تاریخچه</button>
        </div>

        {tab === 'badges' && (
          <div style={S.badgeGrid}>
            {useRealAwards
              ? earnedBadges.map((b, i) => (
                <div key={i} style={S.badge}>
                  <div style={S.badgeIcon}>{b.icon || '🏅'}</div>
                  <div style={S.badgeName}>{b.title}</div>
                  <div style={S.badgeWhen}>{faWhen(b.earned_at)}</div>
                </div>
              ))
              : BADGE_DEFS.map((b, i) => {
                const earned = b.ok(stats)
                return (
                  <div key={i} style={{ ...S.badge, opacity: earned ? 1 : 0.35 }}>
                    <div style={S.badgeIcon}>{b.icon}</div>
                    <div style={S.badgeName}>{b.name}</div>
                    {!earned && <div style={S.badgeLock}>قفل</div>}
                  </div>
                )
              })}
          </div>
        )}

        {tab === 'history' && (
          <div style={S.historyList}>
            {/* تاریخچه‌ی دقیق XP از جدول xp_history */}
            {xpHistory.length > 0 && xpHistory.map((h, i) => (
              <div key={'xp' + i} style={S.historyItem}>
                <div style={S.historyIcon}>⭐</div>
                <div style={{ flex: 1 }}>
                  <div style={S.historyCafe}>{REASON_LABELS[h.reason] || h.reason}</div>
                  <div style={S.historyArea}>{faWhen(h.created_at)} · مجموع: {(h.resulting_xp || 0).toLocaleString('fa')}</div>
                </div>
                <div style={S.historyXp}>+{(h.amount || 0).toLocaleString('fa')} XP</div>
              </div>
            ))}

            {/* اگه هنوز تاریخچه‌ی XP نداریم، از چک‌این‌ها نشون بده */}
            {xpHistory.length === 0 && checkins.map((h, i) => (
              <div key={'ci' + i} style={S.historyItem}>
                <div style={S.historyIcon}>☕</div>
                <div style={{ flex: 1 }}>
                  <div style={S.historyCafe}>{h.cafes?.name || 'کافه'}</div>
                  <div style={S.historyArea}>{(h.cafes?.description || '') + ' · ' + faWhen(h.created_at)}</div>
                </div>
                <div style={S.historyXp}>+{(h.xp_awarded || 0).toLocaleString('fa')} XP</div>
              </div>
            ))}

            {xpHistory.length === 0 && checkins.length === 0 && (
              <div style={{ textAlign: 'center', color: C.sub, fontSize: 13, padding: '24px 0' }}>
                هنوز چک‌این نکردی. برو روی نقشه یه کافه رو بزن! ☕
              </div>
            )}
          </div>
        )}

        <button style={S.editBtn}>ویرایش پروفایل</button>
      </div>
    </div>
  )
}

function Stat({ icon, value, label, S }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIcon}>{icon}</div>
      <div style={S.statValue}>{Number(value).toLocaleString('fa')}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  )
}

const mkS = (C) => ({
  page: {
    minHeight: '100vh', background: C.bg, fontFamily: 'inherit',
    direction: 'rtl', color: C.text, paddingBottom: 40,
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: C.glassDark, backdropFilter: 'blur(20px)',
    borderBottom: '1px solid ' + C.border,
  },
  backBtn: { width: 64, fontSize: 15, color: C.accent, textDecoration: 'none', fontWeight: 700 },
  brand: { fontWeight: 800, fontSize: 17, color: C.text },
  container: { maxWidth: 480, margin: '0 auto', padding: '16px' },
  card: {
    background: C.card, backdropFilter: 'blur(28px)',
    border: '1px solid ' + C.border, borderRadius: 20, padding: 18,
    boxShadow: '0 8px 30px rgba(0,0,0,0.06)', marginBottom: 14,
  },
  headerRow: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, background: C.card, border: '3px solid', flexShrink: 0,
  },
  name: { fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 },
  levelPill: {
    display: 'inline-block', color: '#fff', fontSize: 12, fontWeight: 700,
    padding: '3px 10px', borderRadius: 999,
  },
  xpRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 },
  xpLabel: { fontWeight: 800, color: C.text },
  xpNext: { color: C.sub },
  xpTrack: { height: 10, background: C.chip, borderRadius: 999, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 999, transition: 'width .6s ease' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 },
  statCard: {
    background: C.card, backdropFilter: 'blur(20px)',
    border: '1px solid ' + C.border,
    borderRadius: 16, padding: '12px 6px', textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: 800, marginTop: 2, color: C.text },
  statLabel: { fontSize: 11, color: C.sub },

  tabs: { display: 'flex', gap: 8, marginBottom: 14 },
  tab: {
    flex: 1, padding: '10px', borderRadius: 12, border: 'none',
    background: C.chip, color: C.sub, fontWeight: 700,
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  },
  tabActive: {
    flex: 1, padding: '10px', borderRadius: 12, border: 'none',
    background: C.accent, color: '#fff', fontWeight: 700,
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  },

  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 },
  badge: {
    background: C.card, border: '1px solid ' + C.border,
    borderRadius: 16, padding: '12px 4px', textAlign: 'center', position: 'relative',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  badgeIcon: { fontSize: 26 },
  badgeName: { fontSize: 10, color: C.text, marginTop: 4, lineHeight: 1.3 },
  badgeLock: { fontSize: 9, color: C.sub, marginTop: 2 },
  badgeWhen: { fontSize: 8, color: C.accent, marginTop: 2 },

  historyList: { display: 'flex', flexDirection: 'column', gap: 8 },
  historyItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: C.card, border: '1px solid ' + C.border,
    borderRadius: 14, padding: '10px 14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  historyIcon: {
    width: 38, height: 38, borderRadius: '50%', background: C.accentL,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
  },
  historyCafe: { fontWeight: 700, fontSize: 14, color: C.text },
  historyArea: { fontSize: 12, color: C.sub },
  historyXp: { color: C.accent, fontWeight: 800, fontSize: 13 },

  editBtn: {
    width: '100%', marginTop: 18, padding: '14px',
    borderRadius: 14, border: 'none', background: C.accent, color: '#fff',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
})
