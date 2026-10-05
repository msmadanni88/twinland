'use client'
// منوی اصلی: صفحه‌ها، ابزارهای مالک و خروج — جداشده از TwinLand.js
import { ICON, L, ROUTE } from '@/lib/theme/labels'

// showBusiness اختیاری است: نسخه‌های تازه آن را false می‌دهند تا کاربر عادی «پنل کافه‌دار» را نبیند. بدون آن مثل قبل برای همه هست.
export function AppMenu({ demoOn, toggleDemo, showBusiness, C, TH, backfillDistricts, backfilling, effAdmin, isOwner, onLogout, resetMe, setPanelOpen, setPanelTab, setShowMapSettings, setShowMenu, setShowXP, setTab, setTutorialReplay, showMenu, showToast, toggleViewMode, viewAsUser }) {
  return (<>
      {showMenu&&(
        <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,.3)',backdropFilter:'blur(8px)'}} onClick={()=>setShowMenu(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:TH+8,right:14,left:14,maxHeight:'calc(100dvh - '+(TH+28)+'px)',overflowY:'auto',WebkitOverflowScrolling:'touch',background:'linear-gradient(165deg, '+C.accent+'26, transparent 55%), '+C.glassDark,backdropFilter:'blur(24px)',borderRadius:18,border:'1px solid '+C.border,boxShadow:'0 8px 40px rgba(0,0,0,.15)',animation:'fadeIn .2s ease'}}>
            {/* ── سوییچ حالت نمایش — فقط مالک اپ می‌بیندش ───────────────
                امنیت سمت سرور: RPC set_view_mode ایمیل واقعی رو از auth
                چک می‌کنه، پس حتی اگه کسی این UI رو دستکاری کنه، سرور رد
                می‌کنه. سوییچ هم فقط «کم» می‌کنه، قدرتی اضافه نمی‌کنه. */}
            {isOwner&&(
              <div style={{padding:'12px 16px',borderBottom:'1px solid '+C.border,background:viewAsUser?'#10b98114':C.accent+'12'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:19,width:28,textAlign:'center'}}>{viewAsUser?'👤':'👑'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:C.text}}>{viewAsUser?'حالت کاربر عادی':'حالت مالک'}</div>
                    <div style={{fontSize:10,color:C.sub,marginTop:1}}>{viewAsUser?'داری سایت رو مثل یه کاربر معمولی می‌بینی':'همه‌چیز بدون محدودیت'}</div>
                  </div>
                  <button onClick={toggleViewMode} className="tl-press"
                    style={{position:'relative',width:46,height:26,borderRadius:99,border:'none',cursor:'pointer',flexShrink:0,
                      background:viewAsUser?'#10b981':C.chip,transition:'background .25s ease'}}>
                    <span style={{position:'absolute',top:3,right:viewAsUser?23:3,width:20,height:20,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,.3)',transition:'right .25s cubic-bezier(.2,.9,.3,1)'}}/>
                  </button>
                </div>
              </div>
            )}
            {[
              {key:'map',icon:'🗺',img:'/icon_map_active@2x.png',label:'نقشه',href:null},
              {key:'missions',icon:'📋',img:'/icon_mission_active@2x.png',label:'ماموریت‌ها',href:null},
              {key:'profile',icon:ICON.profile,img:'/icon_profile_active@2x.png',label:L.profile,href:ROUTE.profile},
              {key:'rank',icon:ICON.leaderboard,img:'/icon_rank_active@2x.png',label:L.leaderboard,href:ROUTE.leaderboard},
              {key:'clans',icon:ICON.clans,img:'/icon_clan_active@2x.png',label:L.clans,href:ROUTE.clans},
              {key:'quests',icon:ICON.quests,label:L.quests,href:ROUTE.quests},
              {key:'gallery',icon:ICON.gallery,label:L.gallery,href:ROUTE.gallery},
              // قبلاً smeOnly بود و چون حساب تو 'sme' نیست اصلاً رندر نمی‌شد —
              // آیتم پایینی جاش می‌اومد و با همون ضربه می‌رفتی گنجینه.
              // حالا برای همه هست: هر کسی ممکنه کافه‌دار باشه و باید بتونه
              // کافه‌ش رو claim کنه. خودِ صفحه اگه کافه نداشتی راهنمایی می‌کنه.
              {key:'business',icon:ICON.business,label:L.business,href:ROUTE.business},
              {key:'admin',icon:'🛡️',label:'پنل ادمین',href:'/admin',adminOnly:true},
              {key:'xp',icon:ICON.xpSystem,img:'/xp_coin@256-1.png',label:L.xpSystem,href:null},
              {key:'tutorial',icon:ICON.tutorial,label:L.tutorial,href:null},
              {key:'settings',icon:ICON.settings,img:'/settings@256.png',label:L.settings,href:null},
              ...(toggleDemo?[{key:'demo',icon:'🎬',label:demoOn?'خاموش کردن حالت نمایشی':'حالت نمایشی — شهر شلوغ ساختگی',href:null,adminOnly:true}]:[]),
              {key:'reset',icon:'♻️',label:'ریست حساب (تست)',href:null,adminOnly:true},
              {key:'backfill',icon:'🗺️',label:'پرکردن منطقه کافه‌ها',href:null,adminOnly:true},
              {key:'logout',icon:ICON.logout,label:L.logout,href:null},
            ].filter(item=>(!item.adminOnly||effAdmin)&&(item.key!=='business'||showBusiness!==false)).map((item,i,arr)=>{
              const style={width:'100%',display:'flex',alignItems:'center',gap:14,background:'transparent',border:'none',padding:'13px 18px',color:C.text,fontSize:14,fontFamily:'inherit',fontWeight:500,borderBottom:i<arr.length-1?'1px solid '+C.border:'none',textDecoration:'none'}
              if(item.href){
                return <a key={item.key} className="tl-row" href={item.href} style={style}>
                  {item.img?<img src={item.img} alt={item.label} width={26} height={26} style={{objectFit:'contain',display:'block',flexShrink:0}}/>:<span style={{fontSize:20,width:28,textAlign:'center'}}>{item.icon}</span>}{item.label}
                  <span style={{marginRight:'auto',color:C.sub,fontSize:13}}>›</span>
                </a>
              }
              return <button key={item.key} className="tl-row" onClick={()=>{if(item.key==='backfill'){backfillDistricts();return}setShowMenu(false);if(item.key==='demo'){toggleDemo&&toggleDemo();return}if(item.key==='reset'){resetMe();return}if(item.key==='logout'){onLogout&&onLogout();return}if(item.key==='xp'){setShowXP(true);return}if(item.key==='tutorial'){setTutorialReplay(true);return}if(item.key==='settings'){setShowMapSettings(true);return}if(item.key==='missions'){setPanelOpen(true);setPanelTab('missions');return}if(item.key==='map'){setTab('map');setPanelOpen(false);return}showToast('📣 '+item.label+' به زودی!')}} style={style}>
                {item.img?<img src={item.img} alt={item.label} width={26} height={26} style={{objectFit:'contain',display:'block',flexShrink:0}}/>:<span style={{fontSize:20,width:28,textAlign:'center'}}>{item.icon}</span>}{item.key==='backfill'&&backfilling?'در حال پردازش…':item.label}
              </button>
            })}
          </div>
        </div>
      )}
  </>)
}
