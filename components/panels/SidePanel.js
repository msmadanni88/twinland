'use client'
// پنل شیشه‌ای کناری با تب‌های داشبورد، ماموریت، رتبه، کلن و پروفایل — جداشده از TwinLand.js
import { ClanTab } from '@/components/panels/ClanTab'
import { DashboardTab } from '@/components/panels/DashboardTab'
import { MissionsTab } from '@/components/panels/MissionsTab'
import { ProfileTab } from '@/components/panels/ProfileTab'
import { RankTab } from '@/components/panels/RankTab'
import { hscroll, onColor } from '@/lib/theme/ui'

export function SidePanel({ C, PANEL_W, cafes, checkedIn, coins, filtered, levelInfo, live, panelIsOverlay, panelOpen, panelTab, panelTabsRef, setPanelOpen, setPanelTab, setSearch, setSelCafe, setShowXP, showToast, streak, totalLive, userName, xp }) {
  return (<>
        {/* GLASS PANEL */}
        {panelOpen&&(
          <>
            {panelIsOverlay&&(
              <div onClick={()=>setPanelOpen(false)} style={{position:'absolute',inset:0,zIndex:19,background:'rgba(0,0,0,.25)',backdropFilter:'blur(2px)',WebkitBackdropFilter:'blur(2px)'}}/>
            )}
            <div style={{position:'absolute',top:0,right:0,bottom:0,width:PANEL_W,zIndex:20,background:'linear-gradient(165deg, '+C.accent+'26, transparent 55%), '+C.glassDark,backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',borderLeft:'1px solid '+C.border,boxShadow:'-4px 0 32px rgba(0,0,0,.12)',display:'flex',flexDirection:'column',animation:panelIsOverlay?'slideUp .3s ease':'fadeIn .2s ease'}}>
              {/* tabs — روی ویندوز چرخ ماوس عمودیه و نوار افقی اسکرول نمی‌شد؛
                   حالا چرخ ماوس به اسکرول افقی ترجمه می‌شه و دو طرفش fade داره
                   تا معلوم باشه هنوز تب هست. با درگ هم می‌شه کشیدش. */}
              <div ref={panelTabsRef} className="tl-hscroll"
                style={{...hscroll,gap:6,padding:'14px 12px 10px',flexShrink:0,borderBottom:'1px solid '+C.border}}>
                {[{key:'dashboard',icon:'📊',img:null,imgActive:'/dashboard@256.png',imgInactive:'/dashboard@256_disabled.png',label:'داشبورد'},{key:'missions',icon:'📋',img:'icon_mission',label:'ماموریت'},{key:'rank',icon:'🏆',img:'icon_rank',label:'رتبه'},{key:'clan',icon:'🛡',img:'icon_clan',label:'کلن'},{key:'profile',icon:'👤',img:'icon_profile',label:'پروفایل'}].map(t=>(
                  <button key={t.key} className="tl-press" onClick={()=>setPanelTab(t.key)} style={{flexShrink:0,background:panelTab===t.key?C.accent:C.chip,border:'none',borderRadius:10,padding:'8px 12px',fontSize:12,fontWeight:700,fontFamily:'inherit',color:panelTab===t.key?onColor(C.accent):C.sub,display:'flex',alignItems:'center',justifyContent:'center',gap:5,whiteSpace:'nowrap'}}>
                    {t.imgActive
                      ? <img src={panelTab===t.key?t.imgActive:t.imgInactive} alt={t.label} width={19} height={19} style={{objectFit:'contain',display:'block'}}/>
                      : t.img
                      ? <img src={'/'+t.img+(panelTab===t.key?'_active':'_inactive')+'_L.png'} alt={t.label} width={18} height={18} style={{objectFit:'contain',display:'block'}}/>
                      : <span>{t.icon}</span>}
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="tl-vscroll" style={{flex:1,overflowY:'auto'}}>
                {panelTab==='dashboard'&&<DashboardTab C={C} cafes={cafes} filtered={filtered} live={live} totalLive={totalLive} showToast={showToast} setSearch={setSearch} checkedIn={checkedIn} xp={xp} levelInfo={levelInfo} streak={streak} setShowXP={setShowXP}/>}
                {panelTab==='missions'&&<MissionsTab C={C} cafes={cafes} setSelCafe={setSelCafe} showToast={showToast}/>}
                {panelTab==='rank'&&<RankTab C={C}/>}
                {panelTab==='clan'&&<ClanTab C={C}/>}
                {panelTab==='profile'&&<ProfileTab C={C} xp={xp} levelInfo={levelInfo} streak={streak} checkedIn={checkedIn} userName={userName} coins={coins}/>}
              </div>
            </div>
          </>
        )}
  </>)
}
