'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { UIStyles, useDragScroll } from '@/lib/theme/ui'
import { getLevelInfo } from '@/lib/game/gameSystem'
import { CafePopup } from '@/components/cafe/CafePopup'
import { MapSettingsPopup } from '@/components/map/MapSettingsPopup'
import { CelebrationOverlay } from '@/components/overlays/CelebrationOverlay'
import { LedAdBar } from '@/components/overlays/LedAdBar'
import { NotificationPanel } from '@/components/overlays/NotificationPanel'
import { TutorialCoach } from '@/components/overlays/TutorialCoach'
import { XPPanel } from '@/components/overlays/XPPanel'
import { CITIES } from '@/lib/constants'
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
import { TopBar } from '@/components/home/TopBar'
import { FilterBar } from '@/components/home/FilterBar'
import { MapLayer } from '@/components/map/MapLayer'
import { MapOverlays } from '@/components/map/MapOverlays'
import { MapNavControls } from '@/components/map/MapNavControls'
import { SidePanel } from '@/components/panels/SidePanel'
import { BottomNav } from '@/components/home/BottomNav'
import { AppMenu } from '@/components/home/AppMenu'
import { CityPicker } from '@/components/home/pickers/CityPicker'
import { PalettePicker } from '@/components/home/pickers/PalettePicker'
import { BoundaryPicker } from '@/components/home/pickers/BoundaryPicker'
import { MapModePicker } from '@/components/home/pickers/MapModePicker'
import { Toast } from '@/components/overlays/Toast'

export function TwinLand({ session, onLogout }) {

  const [city,       setCity]       = useState('tehran')
  const [mapMode,    setMapMode]    = useState('normal')
  const [zone,       setZone]       = useState('all')
  const [search,     setSearch]     = useState('')
  const logoTapRef = useRef({count:0,timer:null})
  const [selCafe,    setSelCafe]    = useState(null)
  const [activeEventCafeId, setActiveEventCafeId] = useState(null)
  const [tab,        setTab]        = useState('map')
  const [panelOpen,  setPanelOpen]  = useState(false)
  const [panelTab,   setPanelTab]   = useState('dashboard')
  const panelTabsRef = useDragScroll()   // نوار تب‌های ساید بار: چرخ ماوس + کشیدن با کلیک
  const [showMenu,   setShowMenu]   = useState(false)
  const [showCity,   setShowCity]   = useState(false)
  const [showMode,   setShowMode]   = useState(false)
  const [showXP,     setShowXP]     = useState(false)
  const [showNotif,  setShowNotif]  = useState(false)
  const [tutorialReplay, setTutorialReplay] = useState(false)   // پخش دوباره از منوی «آموزش»
  const [navOpen,    setNavOpen]    = useState(false)
  const [xpAnim,     setXpAnim]     = useState(null)
  const [boundaryMode, setBoundaryMode] = useState('off') // 'off' | 'province' | 'district'
  const [showBoundary, setShowBoundary] = useState(false)
  const [showMapSettings, setShowMapSettings] = useState(false)
  const [showPalette, setShowPalette] = useState(false)

  // ── منطق صفحه در hookهای جدا — components/home/hooks ──
  const { isDesktop, isMobile } = useViewport()
  const { C, paletteKey, pickPalette, themeMode, toggleMode } = useThemePalette()
  const { showToast, toast } = useToast()
  const { mapDisplay, setMapDisplay } = useMapDisplay()
  const { freshToken } = useFreshToken({ session })
  const { cafes, live } = useCafes({ showToast })
  const { accountType, checkedIn, coins, effAdmin, favs, isOwner, markAllNotifRead, markNotifRead, notifications, setCheckedIn, setCoins, setFavs, setStreak, setTutorialSeen, setViewAsUser, setXp, streak, tutorialLoaded, tutorialSeen, userName, viewAsUser, xp } = useUserData({ freshToken, session })
  const { applyRegionFilter, clearRegionFilter, filterApplied, filtered, mapInst, mapLoading, mapRef, panMap, regionFilter, regionResults, selectedRegions, setRegionFilter, setShowRegionFilter, setShowRegionResults, showRegionFilter, showRegionResults } = useCafeMap({ C, activeEventCafeId, boundaryMode, cafes, checkedIn, city, live, mapDisplay, mapMode, search, setSelCafe, showToast, themeMode, zone })
  const { backfillDistricts, backfilling, claimSecretXP, resetMe, toggleViewMode } = useOwnerTools({ freshToken, session, setViewAsUser, setXp, showToast, viewAsUser })
  const { celebration, doCheckin, setCelebration } = useCheckin({ checkedIn, effAdmin, freshToken, isOwner, session, setCheckedIn, setCoins, setSelCafe, setStreak, setXp, showToast, xp })
  const levelInfo = getLevelInfo(xp)

  // فقط روی دسکتاپ واقعی (با ماوس) پنل auto-open بشه
  useEffect(()=>{
    if(typeof window==='undefined') return
    const hasMouse = window.matchMedia('(pointer:fine)').matches
    if(isDesktop && hasMouse) setPanelOpen(true)
  },[isDesktop])

  const gainXP = useCallback((amount)=>{
    setXp(prev=>prev+amount); setXpAnim({amount}); setTimeout(()=>setXpAnim(null),1800)
  },[])

  // تپ روی لوگو: ۱ بار = صفحه اصلی، ۳ بار = XP مخفی (فقط یک‌بار برای هر کاربر)
  async function onLogoTap(){
    const t=logoTapRef.current
    t.count++
    clearTimeout(t.timer)
    if(t.count>=3){
      t.count=0
      claimSecretXP()
      return
    }
    t.timer=setTimeout(()=>{
      if(t.count===1){
        // یک تپ: برو صفحه اصلی (بستن پنل‌ها و رفتن به نمای نقشه)
        setPanelOpen(false); setTab('map')
        const c=CITIES[city]; if(mapInst.current&&c) mapInst.current.flyTo([c.lat,c.lng],c.zoom)
      }
      t.count=0
    },450)
  }
  function goZone(z){
    setZone(z.key)
    if(z.lat&&mapInst.current) mapInst.current.flyTo([z.lat,z.lng],13)
    else if(z.key==='all'&&mapInst.current){ const c=CITIES[city]; mapInst.current.flyTo([c.lat,c.lng],c.zoom) }
  }

  const TH=isMobile?52:56, BH=isMobile?58:62
  const PANEL_W=isDesktop?300:280
  const panelIsOverlay=!isDesktop
  const totalLive=Object.values(live).reduce((a,b)=>a+b,0)

  return (
    <div style={{height:'100dvh',width:'100vw',display:'flex',flexDirection:'column',fontFamily:"'Estedad','Vazirmatn',system-ui,sans-serif",direction:'rtl',background:C.bg,overflow:'hidden',position:'fixed',inset:0}}>
      <HomeGlobalStyles C={C}/>

      <TopBar C={C} TH={TH} city={city} isMobile={isMobile} levelInfo={levelInfo} notifications={notifications} onLogoTap={onLogoTap} panelOpen={panelOpen} setPanelOpen={setPanelOpen} setShowBoundary={setShowBoundary} setShowCity={setShowCity} setShowMenu={setShowMenu} setShowMode={setShowMode} setShowNotif={setShowNotif} setShowPalette={setShowPalette} setShowXP={setShowXP} showNotif={showNotif} xp={xp}/>

      <FilterBar C={C} goZone={goZone} search={search} setSearch={setSearch} zone={zone}/>

      {/* BODY */}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>

        <MapLayer C={C} applyRegionFilter={applyRegionFilter} mapLoading={mapLoading} mapMode={mapMode} mapRef={mapRef} regionFilter={regionFilter} regionResults={regionResults} selectedRegions={selectedRegions} setRegionFilter={setRegionFilter} setShowRegionFilter={setShowRegionFilter} setShowRegionResults={setShowRegionResults} showRegionFilter={showRegionFilter} showRegionResults={showRegionResults}/>

        <MapOverlays C={C} PANEL_W={PANEL_W} cafes={cafes} checkedIn={checkedIn} clearRegionFilter={clearRegionFilter} filterApplied={filterApplied} filtered={filtered} isDesktop={isDesktop} panelOpen={panelOpen} regionResults={regionResults} selectedRegions={selectedRegions} setActiveEventCafeId={setActiveEventCafeId} setSelCafe={setSelCafe} setShowRegionFilter={setShowRegionFilter} setShowRegionResults={setShowRegionResults} showRegionFilter={showRegionFilter} showRegionResults={showRegionResults} streak={streak} totalLive={totalLive}/>

        <MapNavControls C={C} city={city} mapInst={mapInst} navOpen={navOpen} panMap={panMap} panelOpen={panelOpen} setNavOpen={setNavOpen} showBoundary={showBoundary} showCity={showCity} showMapSettings={showMapSettings} showMenu={showMenu} showMode={showMode} showPalette={showPalette} showRegionFilter={showRegionFilter} showRegionResults={showRegionResults} showXP={showXP}/>

        <SidePanel C={C} PANEL_W={PANEL_W} cafes={cafes} checkedIn={checkedIn} coins={coins} filtered={filtered} levelInfo={levelInfo} live={live} panelIsOverlay={panelIsOverlay} panelOpen={panelOpen} panelTab={panelTab} panelTabsRef={panelTabsRef} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setSearch={setSearch} setSelCafe={setSelCafe} setShowXP={setShowXP} showToast={showToast} streak={streak} totalLive={totalLive} userName={userName} xp={xp}/>
        <LedAdBar C={C} />
      </div>

      <BottomNav BH={BH} C={C} isMobile={isMobile} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setTab={setTab} tab={tab}/>

      {selCafe&&<CafePopup C={C} cafe={selCafe} live={live} favs={favs} setFavs={setFavs} checkedIn={checkedIn} isAdmin={effAdmin} onClose={()=>setSelCafe(null)} onCheckin={()=>doCheckin(selCafe)} showToast={showToast}/>}
      {showXP&&<XPPanel C={C} xp={xp} levelInfo={levelInfo} streak={streak} onClose={()=>setShowXP(false)}/>}
      {showNotif&&<NotificationPanel C={C} notifications={notifications} onMark={markNotifRead} onMarkAll={markAllNotifRead} onClose={()=>setShowNotif(false)}/>}
      <UIStyles/>
      <TutorialCoach C={C} session={session} accountType={accountType} tutorialSeen={tutorialSeen} setTutorialSeen={setTutorialSeen} tutorialLoaded={tutorialLoaded} replay={tutorialReplay} onReplayEnd={()=>setTutorialReplay(false)} isMobile={isMobile}/>
      {celebration&&<CelebrationOverlay C={C} data={celebration} onClose={()=>setCelebration(null)}/>}

      <AppMenu C={C} TH={TH} backfillDistricts={backfillDistricts} backfilling={backfilling} effAdmin={effAdmin} isOwner={isOwner} onLogout={onLogout} resetMe={resetMe} setPanelOpen={setPanelOpen} setPanelTab={setPanelTab} setShowMapSettings={setShowMapSettings} setShowMenu={setShowMenu} setShowXP={setShowXP} setTab={setTab} setTutorialReplay={setTutorialReplay} showMenu={showMenu} showToast={showToast} toggleViewMode={toggleViewMode} viewAsUser={viewAsUser}/>

      <CityPicker C={C} city={city} setCity={setCity} setShowCity={setShowCity} showCity={showCity} showToast={showToast}/>

      <PalettePicker C={C} paletteKey={paletteKey} pickPalette={pickPalette} setShowPalette={setShowPalette} showPalette={showPalette} themeMode={themeMode} toggleMode={toggleMode}/>

      {showMapSettings&&(
        <MapSettingsPopup C={C} value={mapDisplay} setValue={setMapDisplay} onClose={()=>setShowMapSettings(false)} />
      )}
      <BoundaryPicker C={C} boundaryMode={boundaryMode} setBoundaryMode={setBoundaryMode} setShowBoundary={setShowBoundary} showBoundary={showBoundary} showToast={showToast}/>

      <MapModePicker C={C} mapMode={mapMode} setMapMode={setMapMode} setShowMode={setShowMode} showMode={showMode} showToast={showToast}/>

      {xpAnim&&<div className="xp-float" style={{position:'fixed',top:'30%',left:'50%',transform:'translateX(-50%)',zIndex:9999,pointerEvents:'none',fontSize:28,fontWeight:900,color:C.accent,textShadow:'0 2px 12px rgba(0,0,0,.2)'}}>+{xpAnim.amount} XP ⭐</div>}

      <Toast BH={BH} C={C} toast={toast}/>
    </div>
  )
}
