'use client'
// ─────────────────────────────────────────────────────────────
//  صفحه اصلی — نسخه ظاهر v2.0 «فانوس»
//  منطق همان hookهای مشترک نسخه v1.0 است؛ فقط چیدمان و ظاهر عوض شده:
//  نقشه تمام‌صفحه، نوار فرمان و داک شناور، پنل شیشه‌ای، پین‌های فانوسی و پنجره تازه کافه.
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react'
import { UIStyles } from '@/lib/theme/ui'
import { getLevelInfo } from '@/lib/game/gameSystem'
import { CITIES } from '@/lib/constants'
import { MapSettingsPopup } from '@/components/map/MapSettingsPopup'
import { CelebrationOverlay } from '@/components/overlays/CelebrationOverlay'
import { LedAdBar } from '@/components/overlays/LedAdBar'
import { NotificationPanel } from '@/components/overlays/NotificationPanel'
import { TutorialCoach } from '@/components/overlays/TutorialCoach'
import { XPPanel } from '@/components/overlays/XPPanel'
import { Toast } from '@/components/overlays/Toast'
import { useViewport } from '@/components/home/hooks/useViewport'
import { useThemePalette } from '@/components/home/hooks/useThemePalette'
import { useToast } from '@/components/home/hooks/useToast'
import { useMapDisplay } from '@/components/home/hooks/useMapDisplay'
import { useFreshToken } from '@/components/home/hooks/useFreshToken'
import { useCafes } from '@/components/home/hooks/useCafes'
import { useUserData } from '@/components/home/hooks/useUserData'
import { useCafeMap } from '@/components/home/hooks/useCafeMap'
import { useOwnerTools } from '@/components/home/hooks/useOwnerTools'
import { useCheckin } from '@/components/home/hooks/useCheckin'
import { HomeGlobalStyles } from '@/components/home/HomeGlobalStyles'
import { AppMenu } from '@/components/home/AppMenu'
import { CityPicker } from '@/components/home/pickers/CityPicker'
import { PalettePicker } from '@/components/home/pickers/PalettePicker'
import { BoundaryPicker } from '@/components/home/pickers/BoundaryPicker'
import { v2Layout, v2Tokens } from '@/components/v2/theme'
import { V2Styles } from '@/components/v2/V2Styles'
import { makePinStyle } from '@/components/v2/map/pins'
import { MapStage } from '@/components/v2/map/MapStage'
import { DEFAULT_SKIN, SKIN_STORAGE_KEY, isKnownSkin, skinInfo } from '@/components/v2/map/skins'
import { makeVectorBase } from '@/components/v2/map/vectorBase'
import { SkinPicker } from '@/components/v2/map/SkinPicker'
import { CommandBar } from '@/components/v2/home/CommandBar'
import { ZoneChips } from '@/components/v2/home/ZoneChips'
import { HudOverlays } from '@/components/v2/home/HudOverlays'
import { MapToolRail } from '@/components/v2/home/MapToolRail'
import { Dock } from '@/components/v2/home/Dock'
import { PanelShell } from '@/components/v2/panels/PanelShell'
import { CafeSheet } from '@/components/v2/cafe/CafeSheet'
import { useHexFog } from '@/components/v3/map/useHexFog'
import { V3_FLAGS } from '@/components/v3/flags'
import { HudSquares } from '@/components/v3/home/HudSquares'
import { useDemoSim } from '@/components/v3/demo/useDemoSim'
import { DemoLayer } from '@/components/v3/demo/DemoLayer'
import { DemoConsole, SimClan, SimDashboard, SimMissions, SimProfile, SimRank } from '@/components/v3/demo/DemoPanels'

// hexFog فقط در نسخه v3.0 روشن است؛ بدون آن این صفحه دقیقاً همان v2.0 است
export function TwinLandV2({ session, onLogout, hexFog = false }) {
  const [city, setCity] = useState('tehran')
  // پوسته نقشه — جای چهار حالت رنگی قدیم؛ انتخاب کاربر روی همین دستگاه می‌ماند
  const [skinId, setSkinIdState] = useState(DEFAULT_SKIN)
  const basemap = useMemo(() => makeVectorBase(), [])
  const [zone, setZone] = useState('all')
  const [search, setSearch] = useState('')
  const logoTapRef = useRef({ count: 0, timer: null })
  const [selCafe, setSelCafe] = useState(null)
  const [activeEventCafeId, setActiveEventCafeId] = useState(null)
  const [tab, setTab] = useState('map')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState('dashboard')
  // کلیک روی حباب کمپین/ماموریت روی نقشه → پنل ماموریت‌ها باز و همون کارت هایلایت می‌شه
  const [highlightQuestId, setHighlightQuestId] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)   // ردیف جستجو و منطقه‌ها در چیدمان تازه موبایل
  const [showMenu, setShowMenu] = useState(false)
  const [showCity, setShowCity] = useState(false)
  const [showMode, setShowMode] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [tutorialReplay, setTutorialReplay] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [boundaryMode, setBoundaryMode] = useState('off')
  const [showBoundary, setShowBoundary] = useState(false)
  const [showMapSettings, setShowMapSettings] = useState(false)
  const [showPalette, setShowPalette] = useState(false)

  // ── منطق مشترک با نسخه v1.0 ──
  const { isDesktop, isMobile } = useViewport()
  const { C, paletteKey, pickPalette, themeMode, toggleMode } = useThemePalette()
  const T = useMemo(() => v2Tokens(C), [C])
  const Lay = v2Layout({ isMobile, isDesktop })
  const cafeArt = skinInfo(skinId).cafeArt
  const pinStyle = useMemo(() => makePinStyle(C, T, cafeArt), [C, T, cafeArt])
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SKIN_STORAGE_KEY)
      if (isKnownSkin(saved)) setSkinIdState(saved)
      else if (themeMode === 'dark') setSkinIdState('ember')
    } catch (e) {}
    // فقط یک بار در شروع؛ بعد از آن انتخاب خود کاربر معتبر است
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const setSkinId = (id) => { if (!isKnownSkin(id)) return; setSkinIdState(id); try { localStorage.setItem(SKIN_STORAGE_KEY, id) } catch (e) {} }
  const { showToast, toast } = useToast()
  const { mapDisplay, setMapDisplay } = useMapDisplay()
  const { freshToken } = useFreshToken({ session })
  const { cafes: realCafes, live: realLive } = useCafes({ showToast })
  // حالت نمایشی: فقط در v3.0، فقط روی همین تب، بدون هیچ نوشتنی در دیتابیس. با /?demo=1 روشن و با /?demo=0 خاموش می‌شود
  const [demoOn, setDemoOn] = useState(false)
  useEffect(() => {
    if (!hexFog) return
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('demo') === '1') sessionStorage.setItem('tl_demo', '1')
      if (sp.get('demo') === '0') sessionStorage.removeItem('tl_demo')
      setDemoOn(sessionStorage.getItem('tl_demo') === '1')
    } catch (e) {}
  }, [hexFog])
  const toggleDemo = () => setDemoOn(v => { try { if (v) sessionStorage.removeItem('tl_demo'); else sessionStorage.setItem('tl_demo', '1') } catch (e) {} return !v })
  const [showConsole, setShowConsole] = useState(false)
  const { accountType, checkedIn: realCheckedIn, coins: realCoins, effAdmin, favs, isOwner, markAllNotifRead, markNotifRead, notifications, setCheckedIn, setCoins, setFavs, setStreak, setTutorialSeen, setViewAsUser, setXp, streak: realStreak, tutorialLoaded, tutorialSeen, userName, viewAsUser, xp: realXp } = useUserData({ freshToken, session })
  // در حالت نمایشی، نقشه و پنل‌ها از دنیای شبیه‌سازی تغذیه می‌شوند؛ وضعیت واقعی کاربر فقط خوانده می‌شود و دست نمی‌خورد
  const demo = useDemoSim({ cafes: realCafes, enabled: hexFog && demoOn, live: realLive, me: { name: userName, xp: realXp, coins: realCoins, streak: realStreak, checkedIn: realCheckedIn } })
  const cafes = demo.cafes, live = demo.live
  const xp = demo.on ? demo.me.xp : realXp
  const coins = demo.on ? demo.me.coins : realCoins
  const streak = demo.on ? demo.me.streak : realStreak
  const checkedIn = demo.on ? demo.me.checkedIn : realCheckedIn
  function onQuestTap(cafe, questId) { setHighlightQuestId(questId); setPanelTab('missions'); setPanelOpen(true) }
  const { applyRegionFilter, clearRegionFilter, filterApplied, filtered, mapInst, mapLoading, mapRef, panMap, regionFilter, regionResults, selectedRegions, setRegionFilter, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults } = useCafeMap({ C, activeEventCafeId, basemap, boundaryMode, cafes, checkedIn, city, live, mapDisplay, mapMode: 'normal', onQuestTap, pinStyle, search, setSelCafe, showToast, skinId, themeMode, zone })
  const { backfillDistricts, backfilling, claimSecretXP, resetMe, toggleViewMode } = useOwnerTools({ freshToken, session, setViewAsUser, setXp, showToast, viewAsUser })
  const { celebration, doCheckin, setCelebration } = useCheckin({ checkedIn: realCheckedIn, effAdmin, freshToken, isOwner, session, setCheckedIn, setCoins, setSelCafe, setStreak, setXp, showToast, xp: realXp })
  // چک‌این در حالت نمایشی: بدون موقعیت‌یاب و بدون هیچ درخواستی به سرور، فقط در دنیای شبیه‌سازی
  function demoCheckin(cafe) {
    const r = demo.checkinMe(cafe)
    if (r.ok) { showToast('🎬 چک‌این نمایشی ثبت شد · +' + r.gain.toLocaleString('fa') + ' XP'); setSelCafe(null) }
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
  // چیدمان تازه موبایل و پنهان بودن نوار LED فقط در v3.0 و با کلیدهای components/v3/flags.js
  const compact = hexFog && V3_FLAGS.compactMobileHud && isMobile
  const showLed = !hexFog || V3_FLAGS.ledBar
  const bannerBottom = hexFog && V3_FLAGS.bottomEventBar ? (isMobile ? (compact ? 'mobile' : null) : 'desktop') : null
  const questCount = useMemo(() => cafes.filter(c => c.active_quest).length, [cafes])
  // کافه‌دار بودن: گزینه‌های مالکیت کافه فقط برای حساب کافه‌دار و مالک اپ دیده می‌شود
  const isBiz = accountType === 'sme'
  const hex = useHexFog({ cafes, checkedIn, city, enabled: hexFog, mapInst, mapLoading, session, showToast, skinId })

  // پنل روی دسکتاپ واقعی با ماوس از اول باز است — مثل نسخه قبل
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isDesktop && window.matchMedia('(pointer:fine)').matches) setPanelOpen(true)
  }, [isDesktop])

  // یک ضربه روی لوگو: برگشت به نقشه — سه ضربه: امتیاز مخفی، یک بار برای هر کاربر
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
  const totalLive = Object.values(live).reduce((a, b) => a + b, 0)
  const anySheet = showRegionFilter || showRegionResults || showXP || showMenu || showCity || showMode || showBoundary || showPalette || showMapSettings || (!docked && panelOpen)

  return (
    <div className="tl2" data-skin={skinId}
      style={{ position: 'fixed', inset: 0, height: '100dvh', width: '100vw', overflow: 'hidden', direction: 'rtl', background: T.mapBg, color: C.text,
        fontFamily: "'Estedad','Vazirmatn',system-ui,sans-serif" }}>
      <HomeGlobalStyles C={C} />
      <V2Styles C={C} T={T} />

      <MapStage C={C} T={T} applyRegionFilter={applyRegionFilter} mapLoading={mapLoading} mapRef={mapRef} regionFilter={regionFilter} regionResults={regionResults} selectedRegions={selectedRegions} setRegionFilter={setRegionFilter} setShowRegionFilter={setShowRegionFilter} setShowRegionResults={setShowRegionResults} showRegionFilter={showRegionFilter} showRegionResults={showRegionResults} />

      <CommandBar xpProminent={hexFog && V3_FLAGS.prominentXp} C={C} T={T} Lay={Lay} city={city} isMobile={isMobile} levelInfo={levelInfo} notifications={notifications} onLogoTap={onLogoTap} search={search} setSearch={setSearch} setShowCity={setShowCity} setShowMenu={setShowMenu} setShowNotif={setShowNotif} setShowXP={setShowXP} showNotif={showNotif} xp={xp} />

      <ZoneChips C={C} T={T} Lay={Lay} compact={compact} open={filtersOpen} goZone={goZone} isMobile={isMobile} rightInset={rightInset} search={search} setSearch={setSearch} zone={zone} />

      <HudOverlays C={C} T={T} Lay={Lay} bannerBottom={bannerBottom} compact={compact} filtersOpen={filtersOpen} cafes={cafes} checkedIn={checkedIn} clearRegionFilter={clearRegionFilter} filterApplied={filterApplied} filtered={filtered} isMobile={isMobile} regionResults={regionResults} rightInset={rightInset} selectedRegions={selectedRegions} setActiveEventCafeId={setActiveEventCafeId} setSelCafe={setSelCafe} setShowRegionFilter={setShowRegionFilter} setShowRegionResults={setShowRegionResults} showRegionFilter={showRegionFilter} showRegionResults={showRegionResults} streak={streak} totalLive={totalLive} />

      <MapToolRail C={C} T={T} Lay={Lay} city={city} hidden={anySheet} isMobile={isMobile} mapInst={mapInst} navOpen={navOpen} panMap={panMap} setNavOpen={setNavOpen} setShowBoundary={setShowBoundary} setShowCity={setShowCity} setShowMode={setShowMode} setShowPalette={setShowPalette} />

      {compact && !anySheet && (
        <HudSquares C={C} T={T} Lay={Lay} filterActive={zone !== 'all' || !!search} filtersOpen={filtersOpen} hex={hex} questCount={questCount} rightInset={rightInset} setFiltersOpen={setFiltersOpen} streak={streak}
          onStreak={() => showToast(streak >= 1 ? '🔥 ' + Number(streak).toLocaleString('fa') + ' روز پشت سر هم چک‌این کردی. فردا هم بیا تا نسوزد!' : '🔥 امروز چک‌این کن تا استریکت شروع شود')}
          onExplore={() => showToast(hex.open === 0 ? '🧭 اولین چک‌این، پایگاهت را می‌سازد و نقشه را باز می‌کند' : '🧭 کشف نقشه: ' + hex.found.toLocaleString('fa') + ' از ' + hex.total.toLocaleString('fa') + ' خانه. با چک‌این در کافه تازه، خانه بعدی باز می‌شود')}
          onMissions={() => { setPanelTab('missions'); setPanelOpen(true) }} />
      )}

      <DemoLayer C={C} T={T} Lay={Lay} compact={compact} demo={demo} isMobile={isMobile} onOff={toggleDemo} onConsole={() => setShowConsole(true)} />
      {showConsole && <DemoConsole C={C} demo={demo} onClose={() => setShowConsole(false)} onCafe={demoOpenCafe} />}

      {hexFog && !compact && !mapLoading && !demo.on && (
        <div className="tl3-explore" style={{ position: 'absolute', left: Lay.gap, top: Lay.hudTop + (bannerBottom ? 0 : 78), zIndex: 55, background: T.glassStrong, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: '1px solid ' + T.hair, borderRadius: 99, padding: '5px 11px', fontSize: 11, fontWeight: 800, color: C.text, boxShadow: T.shadow1 || T.shadow2, pointerEvents: 'none', maxWidth: 'calc(100vw - 24px)' }}>
          {hex.open === 0
            ? '🧭 اولین چک‌این، پایگاهت را می‌سازد'
            : '🧭 کشف نقشه: ' + hex.found.toLocaleString('fa') + ' از ' + hex.total.toLocaleString('fa') + ' خانه'}
        </div>
      )}

      {/* نوار تبلیغ LED — جزء مشترک، بالای داک */}
      {showLed && <div className="tl2-led" style={{ position: 'absolute', left: 0, right: rightInset, bottom: 'calc(env(safe-area-inset-bottom, 0px) + ' + (Lay.aboveDock - 4) + 'px)', height: 44, zIndex: 50, pointerEvents: 'none', transition: 'right .35s ease' }}>
        <LedAdBar C={C} />
      </div>}

      <Dock C={C} T={T} Lay={Lay} isMobile={isMobile} panelOpen={panelOpen} panelTab={panelTab} rightInset={rightInset} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setTab={setTab} />

      <PanelShell demoTabs={demoTabs} C={C} T={T} Lay={Lay} cafes={cafes} checkedIn={checkedIn} coins={coins} docked={docked} filtered={filtered} highlightQuestId={highlightQuestId} levelInfo={levelInfo} live={live} panelOpen={panelOpen} panelTab={panelTab} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setSearch={setSearch} setSelCafe={setSelCafe} setShowXP={setShowXP} showToast={showToast} streak={streak} totalLive={totalLive} userName={userName} xp={xp} />

      {selCafe && <CafeSheet noPlay={isBiz && !effAdmin} canClaim={isBiz} C={C} T={T} cafe={selCafe} live={live} favs={favs} setFavs={setFavs} checkedIn={checkedIn} isAdmin={effAdmin} onClose={() => setSelCafe(null)} onCheckin={() => (demo.on ? demoCheckin(selCafe) : doCheckin(selCafe))} showToast={showToast} />}
      {showXP && <XPPanel C={C} xp={xp} levelInfo={levelInfo} streak={streak} onClose={() => setShowXP(false)} />}
      {showNotif && <NotificationPanel C={C} notifications={notifications} onMark={markNotifRead} onMarkAll={markAllNotifRead} onClose={() => setShowNotif(false)} />}
      <UIStyles />
      <TutorialCoach C={C} session={session} accountType={accountType} tutorialSeen={tutorialSeen} setTutorialSeen={setTutorialSeen} tutorialLoaded={tutorialLoaded} replay={tutorialReplay} onReplayEnd={() => setTutorialReplay(false)} isMobile={isMobile} />
      {celebration && <CelebrationOverlay C={C} data={celebration} onClose={() => setCelebration(null)} />}

      <AppMenu demoOn={demo.on} toggleDemo={hexFog ? toggleDemo : null} showBusiness={isBiz || isOwner || effAdmin} C={C} TH={Lay.barTop + Lay.barH} backfillDistricts={backfillDistricts} backfilling={backfilling} effAdmin={effAdmin} isOwner={isOwner} onLogout={onLogout} resetMe={resetMe} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setShowMapSettings={setShowMapSettings} setShowMenu={setShowMenu} setShowXP={setShowXP} setTab={setTab} setTutorialReplay={setTutorialReplay} showMenu={showMenu} showToast={showToast} toggleViewMode={toggleViewMode} viewAsUser={viewAsUser} />
      <CityPicker C={C} city={city} setCity={setCity} setShowCity={setShowCity} showCity={showCity} showToast={showToast} />
      <PalettePicker C={C} paletteKey={paletteKey} pickPalette={pickPalette} setShowPalette={setShowPalette} showPalette={showPalette} themeMode={themeMode} toggleMode={toggleMode} />
      {showMapSettings && <MapSettingsPopup C={C} value={mapDisplay} setValue={setMapDisplay} onClose={() => setShowMapSettings(false)} />}
      <BoundaryPicker C={C} boundaryMode={boundaryMode} setBoundaryMode={setBoundaryMode} setShowBoundary={setShowBoundary} showBoundary={showBoundary} showToast={showToast} />
      <SkinPicker C={C} T={T} setShowSkin={setShowMode} setSkinId={setSkinId} showSkin={showMode} showToast={showToast} skinId={skinId} />

      <Toast BH={Lay.aboveDock + 36} C={C} toast={toast} />
    </div>
  )
}
