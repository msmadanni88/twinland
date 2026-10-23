'use client'
// ─────────────────────────────────────────────────────────────
//  صفحه اصلی — نسخه ظاهر v4.0 «مینیمال»
//  منطق همان hookهای مشترک نسخه‌های قبل است و همه ویژگی‌های v3.0 (کشف نقشه، نوار رویداد، دنبال کردن، حالت نمایشی) را دارد.
//  فقط ظاهر عوض شده: سیاه و سفید با دو حالت روشن و خیلی تیره، شیشه مات همه‌جا، آیکون خطی،
//  ستون ابزار چپ روی دسکتاپ، نقشه برداری مینیمال بدون نوشته، نشانگر سبز ثابت و کمان روزهای استریک.
//  کد v2.0 و v3.0 دست نخورده؛ این فایل و پوشه components/v4 جدا هستند و با عوض کردن نسخه سایت جابه‌جا می‌شوند.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { UIStyles } from '@/lib/theme/ui'
import { getLevelInfo } from '@/lib/game/gameSystem'
import { CITIES } from '@/lib/constants'
import { useV4Theme } from '@/components/v4/useV4Theme'
import { MapSettingsPopup } from '@/components/map/MapSettingsPopup'
import { CelebrationOverlay } from '@/components/overlays/CelebrationOverlay'
import { LedAdBar } from '@/components/overlays/LedAdBar'
import { TutorialCoach } from '@/components/overlays/TutorialCoach'
import { Toast } from '@/components/overlays/Toast'
import { useViewport } from '@/components/home/hooks/useViewport'
import { useToast } from '@/components/home/hooks/useToast'
import { useMapDisplay } from '@/components/home/hooks/useMapDisplay'
import { useFreshToken } from '@/components/home/hooks/useFreshToken'
import { useCafes } from '@/components/home/hooks/useCafes'
import { useUserData } from '@/components/home/hooks/useUserData'
import { useCafeMap } from '@/components/home/hooks/useCafeMap'
import { useOwnerTools } from '@/components/home/hooks/useOwnerTools'
import { useCheckin } from '@/components/home/hooks/useCheckin'
import { HomeGlobalStyles } from '@/components/home/HomeGlobalStyles'
import { V2Styles } from '@/components/v2/V2Styles'
import { CafeSheet } from '@/components/v2/cafe/CafeSheet'
import { useExploreCells } from '@/components/v3/map/useExploreCells'
import { exploreMessage } from '@/components/v3/map/ExploreProgress'
import { useEventFeed } from '@/components/events/useEventFeed'
import { DOCK_RAIL_LIFT } from '@/components/v3/events/EventDock'
import { useDemoSim } from '@/components/v3/demo/useDemoSim'
import { DemoLayer } from '@/components/v3/demo/DemoLayer'
import { useMapFollow } from '@/components/v3/map/useMapFollow'
import { DemoConsole, SimClan, SimDashboard, SimMissions, SimProfile, SimRank } from '@/components/v3/demo/DemoPanels'
import { setTracking } from '@/lib/track'
import { identifyUser, initAnalytics, track } from '@/lib/analytics'
import { takeOpenCafe } from '@/lib/growth/entry'
import { ReferralCelebrationV4 } from '@/components/v4/growth/ReferralCelebrationV4'
import { V4_FLAGS } from '@/components/v4/flags'
import { V4_COLOR, v4Layout } from '@/components/v4/theme'
import { V4Styles } from '@/components/v4/V4Styles'
import { makePinStyleV4 } from '@/components/v4/map/pinsV4'
import { MapLoaderV4, MapStageV4 } from '@/components/v4/map/MapStageV4'
import { DEFAULT_SKIN_V4, LABELS_KEY_V4, MINI, SKIN_KEY_V4, isKnownSkinV4 } from '@/components/v4/map/skinsV4'
import { makeVectorBaseV4 } from '@/components/v4/map/vectorBaseV4'
import { TopBarV4 } from '@/components/v4/home/TopBarV4'
import { ZoneChipsV4 } from '@/components/v4/home/ZoneChipsV4'
import { HudV4 } from '@/components/v4/home/HudV4'
import { HudSquaresV4 } from '@/components/v4/home/HudSquaresV4'
import { RailV4, useRailOpen } from '@/components/v4/home/RailV4'
import { DockV4 } from '@/components/v4/home/DockV4'
import { MenuV4 } from '@/components/v4/home/MenuV4'
import { BoundaryPickerV4, CityPickerV4, SkinPickerV4 } from '@/components/v4/home/PickersV4'
import { PanelShellV4 } from '@/components/v4/panels/PanelShellV4'
import { useCheckinDays } from '@/components/v4/home/useCheckinDays'
import { V4Provider } from '@/components/v4/kit/context'
import { UserAvatar } from '@/components/v4/kit/UserAvatar'
import { PersonSheet } from '@/components/v4/profile/PersonSheet'
import { XpSheetV4 } from '@/components/v4/overlays/XpSheetV4'
import { NotificationsV4 } from '@/components/v4/overlays/NotificationsV4'


// چهره نویسنده هر نظر در برگه کافه؛ همان چهره مشترک سایت
const CommentAvatarV4 = ({ person }) => <UserAvatar person={person} size={36} />

export function TwinLandV4({ session, onLogout }) {
  const [city, setCity] = useState('tehran')
  const [skinId, setSkinIdState] = useState(DEFAULT_SKIN_V4)
  const [labels, setLabels] = useState(!!V4_FLAGS.labelsDefault)
  const [mapProgress, setMapProgress] = useState(0)
  // صفحه بارگذاری هیچ‌وقت بیشتر از این نمی‌ماند، حتی اگر کتابخانه نقشه نرسد؛ بقیه اپ باید در دسترس بماند
  const [loaderCap, setLoaderCap] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoaderCap(true), 12000); return () => clearTimeout(t) }, [])
  const { isDesktop, isMobile } = useViewport()
  const { C, T, themeMode, toggleMode } = useV4Theme()
  const Lay = v4Layout({ isMobile, isDesktop })

  // زیرنقشه: حالت و نوشته‌ها با ref خوانده می‌شوند تا ساختن دوباره لازم نباشد
  const modeRef = useRef(themeMode); modeRef.current = themeMode
  const labelsRef = useRef(labels); labelsRef.current = labels
  const mobileRef = useRef(isMobile); mobileRef.current = isMobile
  const progressAt = useRef(0)
  const basemap = useMemo(() => makeVectorBaseV4({
    getMode: () => modeRef.current,
    getLabels: () => labelsRef.current,
    mobile: () => mobileRef.current,
    prefetch: !!V4_FLAGS.prefetchTiles,
    onProgress: (p) => { const now = Date.now(); if (p >= 1 || now - progressAt.current > 120) { progressAt.current = now; setMapProgress(p) } },
  }), [])
  useEffect(() => { basemap.setMode(themeMode) }, [basemap, themeMode])
  useEffect(() => { basemap.setLabels(labels) }, [basemap, labels])
  useEffect(() => {
    try {
      const s = localStorage.getItem(SKIN_KEY_V4); if (isKnownSkinV4(s)) setSkinIdState(s)
      const l = localStorage.getItem(LABELS_KEY_V4); if (l === '1' || l === '0') setLabels(l === '1')
    } catch (e) {}
  }, [])
  const setSkinId = (id) => { if (!isKnownSkinV4(id)) return; setSkinIdState(id); try { localStorage.setItem(SKIN_KEY_V4, id) } catch (e) {} }
  const toggleLabels = () => setLabels(v => { const n = !v; try { localStorage.setItem(LABELS_KEY_V4, n ? '1' : '0') } catch (e) {} track('map_labels', { on: n }); return n })

  const [zone, setZone] = useState('all')
  const [search, setSearch] = useState('')
  const logoTapRef = useRef({ count: 0, timer: null })
  const [selCafe, setSelCafe] = useState(null)
  const [activeEvent, setActiveEvent] = useState({ id: null, tone: null })
  const activeEventCafeId = activeEvent.id
  const setActiveEventCafeId = useCallback((id, tone) => setActiveEvent(p => (p.id === id && p.tone === (tone || null) ? p : { id, tone: tone || null })), [])
  const [follow, setFollow] = useState(true)
  useEffect(() => { try { if (localStorage.getItem('tl_follow') === '0') setFollow(false) } catch (e) {} }, [])
  const [tab, setTab] = useState('map')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState('dashboard')
  const [highlightQuestId, setHighlightQuestId] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showCity, setShowCity] = useState(false)
  const [showSkin, setShowSkin] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [tutorialReplay, setTutorialReplay] = useState(false)
  const [boundaryMode, setBoundaryMode] = useState('off')
  const [showBoundary, setShowBoundary] = useState(false)
  const [showMapSettings, setShowMapSettings] = useState(false)
  const [railOpen, toggleRail] = useRailOpen()
  // پروفایل هر نفر که از رتبه‌بندی، کلن، حلقه یا نظرها باز شود
  const [personId, setPersonId] = useState(null)
  const openPerson = useCallback((id) => { setPersonId(id); track('person_open', { from: 'home' }) }, [])

  const pinStyle = useMemo(() => makePinStyleV4(C, T), [C, T])
  const { showToast, toast } = useToast()
  const { mapDisplay, setMapDisplay } = useMapDisplay()
  const { freshToken } = useFreshToken({ session })
  const { cafes: realCafes, live: realLive, liveTotal: realLiveTotal } = useCafes({ showToast })
  const [demoOn, setDemoOn] = useState(false)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('demo') === '1') sessionStorage.setItem('tl_demo', '1')
      if (sp.get('demo') === '0') sessionStorage.removeItem('tl_demo')
      setDemoOn(sessionStorage.getItem('tl_demo') === '1')
    } catch (e) {}
  }, [])
  const toggleDemo = () => setDemoOn(v => { try { if (v) sessionStorage.removeItem('tl_demo'); else sessionStorage.setItem('tl_demo', '1') } catch (e) {} return !v })
  const [showConsole, setShowConsole] = useState(false)
  const { accountType, checkedIn: realCheckedIn, checkedToday, setCheckedToday, coins: realCoins, effAdmin, favs, isOwner, markAllNotifRead, markNotifRead, notifications, setCheckedIn, setCoins, setFavs, setStreak, setTutorialSeen, setViewAsUser, setXp, streak: realStreak, tutorialLoaded, tutorialSeen, userName, viewAsUser, xp: realXp } = useUserData({ freshToken, session })
  const demo = useDemoSim({ cafes: realCafes, enabled: demoOn, live: realLive, me: { name: userName, xp: realXp, coins: realCoins, streak: realStreak, checkedIn: realCheckedIn } })
  const cafes = demo.cafes, live = demo.live
  useEffect(() => { setTracking(!demo.on); return () => setTracking(true) }, [demo.on])
  const xp = demo.on ? demo.me.xp : realXp
  const coins = demo.on ? demo.me.coins : realCoins
  const streak = demo.on ? demo.me.streak : realStreak
  const checkedIn = demo.on ? demo.me.checkedIn : realCheckedIn
  const checkinDays = useCheckinDays(realCheckedIn.size, !demo.on)
  function onQuestTap(cafe, questId) { setHighlightQuestId(questId); setPanelTab('missions'); setPanelOpen(true) }
  const { applyRegionFilter, clearRegionFilter, filterApplied, filtered, mapInst, mapLoading, mapRef, panMap, regionFilter, regionResults, selectedRegions, setRegionFilter, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults } = useCafeMap({ C, activeEventCafeId, activeEventTone: activeEvent.tone, basemap, boundaryMode, cafes, checkedIn, city, live, mapDisplay, mapMode: 'normal', onQuestTap, pinStyle, search, setSelCafe, showToast, skinId, themeMode, zone })
  const { backfillDistricts, backfilling, claimSecretXP, resetMe, toggleViewMode } = useOwnerTools({ freshToken, session, setViewAsUser, setXp, showToast, viewAsUser })
  const exploreRefreshRef = useRef(null)
  const { celebration, doCheckin, setCelebration } = useCheckin({ checkedIn: realCheckedIn, checkedToday, setCheckedToday, onDone: () => exploreRefreshRef.current && exploreRefreshRef.current(), effAdmin, freshToken, isOwner, session, setCheckedIn, setCoins, setSelCafe, setStreak, setXp, showToast, xp: realXp })
  function demoCheckin(cafe) {
    const r = demo.checkinMe(cafe)
    if (r.ok) { showToast('چک‌این نمایشی ثبت شد · +' + r.gain.toLocaleString('fa') + ' XP'); setSelCafe(null) }
    else showToast(r.reason === 'dup' ? 'قبلاً اینجا بودی!' : 'چک‌این نمایشی ثبت نشد', 'warn')
  }
  function demoOpenCafe(id) {
    const c = cafes.find(x => x.id === id); if (!c) return
    setShowConsole(false); setSelCafe(c)
    try { if (mapInst.current) mapInst.current.flyTo([c.lat, c.lng], Math.max(mapInst.current.getZoom(), 15)) } catch (e) {}
  }
  const demoTabs = demo.on ? {
    dashboard: <SimDashboard C={C} snap={demo.snap} me={demo.me} onCafe={demoOpenCafe} />,
    missions: <SimMissions C={C} snap={demo.snap} highlightQuestId={highlightQuestId} onCafe={demoOpenCafe} />,
    rank: <SimRank C={C} snap={demo.snap} me={demo.me} />,
    clan: <SimClan C={C} snap={demo.snap} />,
    profile: <SimProfile C={C} snap={demo.snap} me={demo.me} />,
  } : null
  const levelInfo = getLevelInfo(xp)
  const compact = V4_FLAGS.compactMobileHud && isMobile
  const showLed = !!V4_FLAGS.ledBar
  const bannerBottom = V4_FLAGS.bottomEventBar ? (isMobile ? (compact ? 'mobile' : null) : 'desktop') : null
  const eventWidgets = !!(bannerBottom && V4_FLAGS.eventWidgets)
  const getPos = useCallback(() => { try { const c = mapInst.current && mapInst.current.getCenter(); return c ? { lat: c.lat, lng: c.lng } : null } catch (e) { return null } }, [mapInst])
  const dockFeed = useEventFeed({ slot: 'bar', limit: 12, getPos, enabled: eventWidgets })
  const railLift = eventWidgets && isMobile && dockFeed.events.length > 0 ? DOCK_RAIL_LIFT : 0
  const questCount = useMemo(() => cafes.filter(c => c.active_quest).length, [cafes])
  const isBiz = accountType === 'sme'
  const exploreSkin = skinId === MINI ? 'v4-mini-' + (themeMode === 'light' ? 'light' : 'dark') : skinId
  const hex = useExploreCells({ C, cafes, checkedIn, enabled: true, mapInst, mapLoading, session, skinId: exploreSkin, offline: demo.on })
  exploreRefreshRef.current = hex.refresh

  useEffect(() => {
    initAnalytics()
    if (session && session.user && session.user.id) identifyUser(session.user.id)
    track('app_open', { ui: 'v4', mobile: isMobile })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session && session.user && session.user.id])

  const openCafeRef = useRef(undefined)
  useEffect(() => {
    if (openCafeRef.current === undefined) openCafeRef.current = takeOpenCafe()
    const id = openCafeRef.current
    if (!id || mapLoading || !realCafes || !realCafes.length) return
    openCafeRef.current = null
    const c = realCafes.find(x => x.id === id)
    if (!c) return
    setSelCafe(c)
    track('cafe_deeplink', { cafe_id: id })
    try { if (mapInst.current && c.lat && c.lng) mapInst.current.flyTo([c.lat, c.lng], Math.max(mapInst.current.getZoom(), 16), { duration: 1.2 }) } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realCafes, mapLoading])

  // نتیجه کد دعوت: پنجره خوش‌آمد و جایزه در ReferralCelebrationV4

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isDesktop && window.matchMedia('(pointer:fine)').matches) setPanelOpen(true)
  }, [isDesktop])

  // رنگ نوار وضعیت مرورگر گوشی هم‌رنگ حالت روشن یا تیره
  useEffect(() => {
    try {
      let m = document.querySelector('meta[name="theme-color"]')
      if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m) }
      m.setAttribute('content', T.mapBg)
    } catch (e) {}
  }, [T.mapBg])

  function onLogoTap() {
    const t = logoTapRef.current
    t.count++
    clearTimeout(t.timer)
    if (t.count >= 3) { t.count = 0; claimSecretXP(); return }
    t.timer = setTimeout(() => {
      if (t.count === 1) {
        setPanelOpen(false); setTab('map')
        const c = CITIES[city]; if (mapInst.current && c) mapInst.current.flyTo([c.lat, c.lng], c.zoom)
      }
      t.count = 0
    }, 450)
  }
  function goZone(z) {
    setZone(z.key)
    if (z.lat && mapInst.current) mapInst.current.flyTo([z.lat, z.lng], 13)
    else if (z.key === 'all' && mapInst.current) { const c = CITIES[city]; mapInst.current.flyTo([c.lat, c.lng], c.zoom) }
  }

  const docked = isDesktop
  const rightInset = docked && panelOpen ? Lay.panelW + Lay.gap * 2 : Lay.gap
  // ستون ابزار دسکتاپ جای ردیف منطقه‌ها و دکمه‌های فیلتر را از چپ کم می‌کند
  const leftInset = isMobile ? Lay.gap : Lay.gap * 2 + (railOpen ? Lay.railWOpen : Lay.railW)
  const sumLive = Object.values(live).reduce((a, b) => a + b, 0)
  const totalLive = demo.on ? sumLive : (realLiveTotal != null ? realLiveTotal : sumLive)
  const anySheet = showRegionFilter || showRegionResults || showXP || showMenu || showCity || showSkin || showBoundary || showMapSettings || (!docked && panelOpen) || !!personId
  const followAvailable = V4_FLAGS.mapFollow && eventWidgets
  const followOn = followAvailable && follow
  const eventCafe = useMemo(() => (activeEventCafeId ? cafes.find(c => c.id === activeEventCafeId) || null : null), [cafes, activeEventCafeId])
  const followInsets = useCallback(() => ({
    top: Lay.hudTop + 44,
    right: docked && panelOpen ? Lay.panelW + Lay.gap * 2 : 0,
    bottom: Lay.aboveDock + 112,
    left: isMobile ? 0 : leftInset,
  }), [Lay.hudTop, Lay.panelW, Lay.gap, Lay.aboveDock, docked, panelOpen, isMobile, leftInset])
  useMapFollow({ enabled: followOn && !demo.on, mapInst, target: eventCafe, blocked: anySheet || !!selCafe || showNotif || showConsole, getInsets: followInsets })
  function toggleFollow() {
    setFollow(v => {
      const nv = !v
      try { localStorage.setItem('tl_follow', nv ? '1' : '0') } catch (e) {}
      track('follow_toggle', { on: nv })
      showToast(nv ? 'نقشه حالا رویداد روشن را دنبال می‌کند' : 'دنبال کردن رویداد خاموش شد')
      return nv
    })
  }
  function onToggleMode() {
    toggleMode()
    track('theme_mode', { mode: themeMode === 'dark' ? 'light' : 'dark', ui: 'v4' })
  }

  return (
    <V4Provider C={C} T={T} openPerson={openPerson}>
    <div className="tl2 tl4" data-skin={skinId} data-mode={themeMode}
      style={{ position: 'fixed', inset: 0, height: '100dvh', width: '100vw', overflow: 'hidden', direction: 'rtl', background: T.mapBg, color: C.text,
        fontFamily: "'Estedad','Vazirmatn',system-ui,sans-serif", colorScheme: themeMode === 'dark' ? 'dark' : 'light' }}>
      <HomeGlobalStyles C={C} />
      <V2Styles C={C} T={T} />
      <V4Styles C={C} T={T} />

      <MapStageV4 C={C} T={T} applyRegionFilter={applyRegionFilter} mapRef={mapRef} regionFilter={regionFilter} regionResults={regionResults} selectedRegions={selectedRegions} setRegionFilter={setRegionFilter} setShowRegionFilter={setShowRegionFilter} setShowRegionResults={setShowRegionResults} showRegionFilter={showRegionFilter} showRegionResults={showRegionResults} />

      <TopBarV4 C={C} T={T} Lay={Lay} city={city} isMobile={isMobile} levelInfo={levelInfo} notifications={notifications} onLogoTap={onLogoTap} search={search} setSearch={setSearch} setShowCity={setShowCity} setShowMenu={setShowMenu} setShowNotif={setShowNotif} setShowXP={setShowXP} showMenu={showMenu} showNotif={showNotif} xp={xp} />

      <ZoneChipsV4 C={C} T={T} Lay={Lay} compact={compact} open={filtersOpen} goZone={goZone} isMobile={isMobile} leftInset={leftInset} rightInset={rightInset} search={search} setSearch={setSearch} zone={zone} />

      <HudV4 C={C} T={T} Lay={Lay} bannerBottom={bannerBottom} eventWidgets={eventWidgets} getPos={getPos} compact={compact} filtersOpen={filtersOpen} cafes={cafes} checkedIn={checkedIn} checkinDays={checkinDays} clearRegionFilter={clearRegionFilter} filterApplied={filterApplied} filtered={filtered} isMobile={isMobile} leftInset={leftInset} regionResults={regionResults} rightInset={rightInset} selectedRegions={selectedRegions} setActiveEventCafeId={setActiveEventCafeId} setSelCafe={setSelCafe} setShowRegionFilter={setShowRegionFilter} setShowRegionResults={setShowRegionResults} showRegionFilter={showRegionFilter} showRegionResults={showRegionResults} streak={streak} totalLive={totalLive} />

      <RailV4 C={C} T={T} Lay={Lay} isMobile={isMobile} hidden={isMobile && anySheet} liftBy={railLift} open={railOpen} onToggleOpen={toggleRail}
        mapInst={mapInst} panMap={panMap} city={city} skinId={skinId} labels={labels} toggleLabels={toggleLabels} boundaryMode={boundaryMode} themeMode={themeMode} toggleMode={onToggleMode}
        follow={followOn} onToggleFollow={followAvailable ? toggleFollow : null}
        setShowSkin={setShowSkin} setShowBoundary={setShowBoundary} setShowCity={setShowCity}
        hex={hex} showExplore={!isMobile && !mapLoading && !demo.on} onExplore={() => showToast(exploreMessage(hex.progress))} />

      {compact && !anySheet && (
        <HudSquaresV4 C={C} T={T} Lay={Lay} checkinDays={checkinDays} filterActive={zone !== 'all' || !!search} filtersOpen={filtersOpen} hex={hex} questCount={questCount} rightInset={rightInset} setFiltersOpen={setFiltersOpen} streak={streak}
          onExplore={() => showToast(exploreMessage(hex.progress))}
          onMissions={() => { setPanelTab('missions'); setPanelOpen(true) }} />
      )}

      <DemoLayer C={C} T={T} Lay={isMobile ? Lay : { ...Lay, gap: leftInset }} compact={compact} demo={demo} isMobile={isMobile} onOff={toggleDemo} onConsole={() => setShowConsole(true)} />
      {showConsole && <DemoConsole C={C} demo={demo} onClose={() => setShowConsole(false)} onCafe={demoOpenCafe} />}

      {showLed && <div className="tl2-led" style={{ position: 'absolute', left: 0, right: rightInset, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.aboveDock - 4) + 'px)', height: 44, zIndex: 50, pointerEvents: 'none', transition: 'right .35s ease' }}>
        <LedAdBar C={C} />
      </div>}

      <DockV4 C={C} T={T} Lay={Lay} isMobile={isMobile} panelOpen={panelOpen} panelTab={panelTab} rightInset={rightInset} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setTab={setTab} />

      <PanelShellV4 demoTabs={demoTabs} C={C} T={T} Lay={Lay} cafes={cafes} checkedIn={checkedIn} coins={coins} docked={docked} filtered={filtered} highlightQuestId={highlightQuestId} levelInfo={levelInfo} live={live} panelOpen={panelOpen} panelTab={panelTab} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setSearch={setSearch} setSelCafe={setSelCafe} setShowXP={setShowXP} showToast={showToast} streak={streak} totalLive={totalLive} userName={userName} xp={xp} />

      {selCafe && <CafeSheet commentAvatar={CommentAvatarV4} onPerson={openPerson} tint={V4_COLOR.pin} headTint={themeMode === 'dark' ? '#3A3A40' : '#C9C9CF'} noPlay={isBiz && !isOwner} canClaim={isBiz} C={C} T={T} cafe={selCafe} live={live} favs={favs} setFavs={setFavs} checkedIn={checkedIn} checkedToday={!demo.on ? checkedToday : null} isAdmin={effAdmin} onClose={() => setSelCafe(null)} onCheckin={() => (demo.on ? demoCheckin(selCafe) : doCheckin(selCafe))} showToast={showToast} />}
      {showXP && <XpSheetV4 xp={xp} levelInfo={levelInfo} streak={streak} onClose={() => setShowXP(false)} />}
      {showNotif && <NotificationsV4 notifications={notifications} onMark={markNotifRead} onMarkAll={markAllNotifRead} onClose={() => setShowNotif(false)} />}
      <UIStyles />
      <TutorialCoach neon="#FFFFFF" C={C} session={session} accountType={accountType} tutorialSeen={tutorialSeen} setTutorialSeen={setTutorialSeen} tutorialLoaded={tutorialLoaded} replay={tutorialReplay} onReplayEnd={() => setTutorialReplay(false)} isMobile={isMobile} />
      {celebration && <CelebrationOverlay C={C} data={celebration} onClose={() => setCelebration(null)} />}
      {!demo.on && <ReferralCelebrationV4 notifications={notifications} onMark={markNotifRead} onXp={setXp} onPerson={openPerson} showToast={showToast} />}

      <MenuV4 C={C} T={T} TH={Lay.barTop + Lay.barH} isMobile={isMobile} demoOn={demo.on} toggleDemo={toggleDemo} showBusiness={isBiz || isOwner || effAdmin} backfillDistricts={backfillDistricts} backfilling={backfilling} effAdmin={effAdmin} isOwner={isOwner} onLogout={onLogout} resetMe={resetMe} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setShowMapSettings={setShowMapSettings} setShowMenu={setShowMenu} setShowXP={setShowXP} setTab={setTab} setTutorialReplay={setTutorialReplay} showMenu={showMenu} showToast={showToast} themeMode={themeMode} toggleMode={onToggleMode} toggleViewMode={toggleViewMode} viewAsUser={viewAsUser} />
      <CityPickerV4 C={C} T={T} show={showCity} setShow={setShowCity} city={city} setCity={setCity} showToast={showToast} />
      <SkinPickerV4 C={C} T={T} show={showSkin} setShow={setShowSkin} skinId={skinId} setSkinId={setSkinId} showToast={showToast} />
      <BoundaryPickerV4 C={C} T={T} show={showBoundary} setShow={setShowBoundary} boundaryMode={boundaryMode} setBoundaryMode={setBoundaryMode} showToast={showToast} />
      {showMapSettings && <MapSettingsPopup C={C} value={mapDisplay} setValue={setMapDisplay} onClose={() => setShowMapSettings(false)} />}

      <Toast BH={Lay.aboveDock + 36} C={C} toast={toast} />
      <MapLoaderV4 C={C} T={T} show={mapLoading && !loaderCap} progress={mapProgress} monoLogo={!!V4_FLAGS.monoLogo} />
      {personId && <PersonSheet id={personId} onClose={() => setPersonId(null)} />}
    </div>
    </V4Provider>
  )
}
