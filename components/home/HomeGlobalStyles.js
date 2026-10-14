'use client'
// استایل‌های سراسری صفحه‌ی اصلی: انیمیشن‌ها، نقشه و نام منبع نقشه — جداشده از TwinLand.js

export function HomeGlobalStyles({ C }) {
  return (<>
      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;900&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
        button{cursor:pointer;transition:opacity .15s,transform .1s}
        button:active{opacity:.75;transform:scale(.96)}
        input{outline:none}
        @keyframes tlNavPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        input::placeholder{color:#AEAEB2}
        .leaflet-container{background:#E8E4DC !important}
        .leaflet-control-attribution{font-size:9px !important;line-height:13px !important;padding:0 6px !important;margin:0 !important;background:${C.chip}d9 !important;color:${C.chipText} !important;border-radius:0 6px 0 0;direction:ltr}
        .leaflet-control-attribution a{color:inherit !important;text-decoration:none}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes xpFloat{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1;transform:translateY(-44px) scale(1.2)}100%{opacity:0;transform:translateY(-70px) scale(.9)}}
        @keyframes shimmer{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
        @keyframes ledScroll{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        @keyframes evSlide{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes coachPop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes tlConfetti{0%{transform:translateY(-8vh) rotate(0deg)}100%{transform:translateY(108vh) rotate(720deg)}}
        @keyframes tlCelebPop{0%{opacity:0;transform:translateY(30px) scale(.85)}60%{opacity:1;transform:translateY(-6px) scale(1.03)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes tlCelebGlow{0%,100%{box-shadow:0 0 40px 4px rgba(255,255,255,.06)}50%{box-shadow:0 0 70px 10px rgba(255,255,255,.14)}}
        @keyframes tlShuttle{from{transform:translateX(0)}to{transform:translateX(var(--shift,0px))}}
        .tl-shuttle{animation:tlShuttle var(--dur,8s) ease-in-out 1s infinite alternate}
        /* انیمیشن مودالِ کافه در دسکتاپ — بقیه‌ی کلاس‌های tl-* در app/ui.js */
        @keyframes cpZoom{from{opacity:0;transform:translate(-50%,-50%) scale(.94)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes tlSpotPulse{0%,100%{box-shadow:0 0 0 100vmax rgba(0,0,0,.62),0 0 0 3px #CCFF00,0 0 18px 3px #CCFF0088}50%{box-shadow:0 0 0 100vmax rgba(0,0,0,.62),0 0 0 3px #CCFF00,0 0 30px 8px #CCFF00cc}}
        @keyframes tlRingPulse{0%{transform:scale(.4);opacity:.9}70%{transform:scale(2.1);opacity:0}100%{transform:scale(2.1);opacity:0}}
        .tl-event-pulse-ring{width:30px;height:30px;border-radius:50%;border:5px solid var(--pulse-color,#1a1a1a);box-shadow:0 0 4px 1px var(--pulse-color,#1a1a1a);animation:tlRingPulse 1.3s ease-out infinite}
        /* نشانگر رویداد روی نقشه: هسته، دو موج و مدار خط‌چین. رنگ از --bc که JS از رنگ رویداد می‌سازد */
        .tl-beacon{position:relative;width:72px;height:72px;pointer-events:none;--bc:#888;--bc12:rgba(136,136,136,.12);--bc30:rgba(136,136,136,.3);--bc45:rgba(136,136,136,.45);--bc70:rgba(136,136,136,.7)}
        .tl-beacon>span{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%)}
        .tl-beacon-r{width:70px;height:70px;background:radial-gradient(circle,var(--bc30) 0,var(--bc12) 55%,transparent 72%);border:1.5px solid var(--bc70);animation:tlBeaconRing 2.4s cubic-bezier(.2,.6,.3,1) infinite}
        .tl-beacon-r2{animation-delay:1.2s}
        .tl-beacon-orbit{width:36px;height:36px;border:1.5px dashed var(--bc);opacity:.9;animation:tlBeaconSpin 10s linear infinite}
        .tl-beacon-core{width:14px;height:14px;background:var(--bc);border:2.5px solid #fff;box-shadow:0 0 0 4px var(--bc45),0 5px 16px var(--bc70);animation:tlBeaconIn .55s cubic-bezier(.34,1.56,.64,1) both,tlBeaconBeat 1.4s ease-in-out .55s infinite alternate}
        @keyframes tlBeaconRing{0%{transform:translate(-50%,-50%) scale(.22);opacity:.95}80%{opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
        @keyframes tlBeaconSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes tlBeaconIn{from{transform:translate(-50%,-50%) scale(0)}to{transform:translate(-50%,-50%) scale(1)}}
        @keyframes tlBeaconBeat{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(-50%,-50%) scale(1.18)}}
        @media (prefers-reduced-motion:reduce){.tl-beacon-r,.tl-beacon-orbit,.tl-beacon-core{animation:none}.tl-beacon-r{transform:translate(-50%,-50%) scale(.6);opacity:.6}}
        .xp-float{animation:xpFloat 1.8s ease forwards}
        .mission-bar{transition:width .8s ease}
        .boundary-tip{background:rgba(28,28,30,.88)!important;color:#fff!important;border:none!important;border-radius:8px!important;font-family:'Vazirmatn',sans-serif!important;font-size:11px!important;font-weight:600!important;padding:4px 9px!important;box-shadow:0 2px 10px rgba(0,0,0,.25)!important}
        .boundary-tip::before{display:none!important}
      `}}/>
  </>)
}
