'use client'
// استایل سراسری نسخه v2.0 — همه قانون‌ها زیر کلاس .tl2 هستند تا روی نسخه‌های دیگر اثر نگذارند.
import { alpha } from '@/components/v2/theme'

export function V2Styles({ C, T }) {
  const css = `
  .tl2{--tl2-ink:${C.text};--tl2-sub:${C.sub};--tl2-accent:${C.accent}}
  .tl2 .leaflet-container{background:${T.mapBg} !important;font-family:inherit}
  /* فقط وقتی پوسته برداری بالا نیامده و کاشی عکسی پشتیبان نشان داده می‌شود */
  .tl2 .leaflet-container:not(.tl-vector):not(.tl-plain) .leaflet-tile-pane{filter:${T.tileFilter} !important;transition:filter .5s}
  .tl2 .leaflet-container.tl-plain .leaflet-tile-pane{filter:none !important}
  .tl2 .leaflet-container.tl-vector .leaflet-tile-pane{filter:none !important}
  .tl2 .leaflet-gl-layer canvas{outline:none}
  .tl2 .leaflet-control-attribution{background:${alpha(C.card, 0.7)} !important;color:${C.sub} !important;border-radius:8px !important;margin:0 0 6px 8px !important;padding:1px 7px !important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}

  /* پین فانوسی */
  .tl2-pin{position:relative;width:40px;height:50px;cursor:pointer;transform-origin:50% 96%;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
  .tl2-pin:hover,.tl2-pin.is-open{transform:translateY(-3px) scale(1.08)}
  .tl2-pin-head{position:absolute;left:3px;top:2px;width:34px;height:34px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;box-sizing:border-box;line-height:1}
  .tl2-pin-tail{position:absolute;left:50%;top:29px;width:11px;height:11px;margin-left:-5.5px;transform:rotate(45deg);border-right:2px solid;border-bottom:2px solid;border-radius:0 0 3px 0;box-sizing:border-box}
  .tl2-pin-shadow{position:absolute;left:50%;bottom:1px;width:16px;height:5px;margin-left:-8px;border-radius:50%;background:rgba(0,0,0,.38);filter:blur(1.5px)}
  .tl2-pin-star{position:absolute;top:-4px;left:-2px;width:17px;height:17px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;box-sizing:border-box}
  .tl2-pin-live{position:absolute;top:-5px;right:-3px;min-width:19px;height:19px;padding:0 4px;border-radius:99px;border:2px solid;align-items:center;justify-content:center;font-size:10px;font-weight:800;box-sizing:border-box}
  .tl2-pin.is-top .tl2-pin-head{animation:tl2Breath 3.2s ease-in-out infinite}
  @keyframes tl2Breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}

  /* کافه نقاشی‌شده — پوسته‌های کارتونی و مدادی */
  .tl2-cafe{position:relative;width:44px;height:48px;cursor:pointer;transform-origin:50% 92%;transition:transform .2s cubic-bezier(.34,1.56,.64,1);filter:drop-shadow(0 3px 3px rgba(0,0,0,.28))}
  .tl2-cafe:hover,.tl2-cafe.is-open{transform:translateY(-3px) scale(1.1)}
  .tl2-cafe-shadow{position:absolute;left:50%;bottom:2px;width:30px;height:7px;margin-left:-15px;border-radius:50%;background:rgba(0,0,0,.28);filter:blur(2px)}

  /* منظومه دور پین: ابر شعار، آیتم ویژه، کمپین و ظرفیت تکمیل — با hover روی
     دسکتاپ یا نگه‌داشتن انگشت روی موبایل (کلاس is-open) از پشت پین بیرون می‌زنند.
     بسته شدن 0.25 ثانیه تأخیر دارد تا موس بتواند از پین به گره برسد. */
  .tl2 .leaflet-marker-icon:has(.tl2-cafe:hover),.tl2 .leaflet-marker-icon:has(.tl2-pin:hover),.tl2 .leaflet-marker-icon:has(.is-open){z-index:100000 !important}
  .tl2-orbit{position:absolute;width:0;height:0;pointer-events:none}
  .tl2-links{position:absolute;left:0;top:0;overflow:visible;pointer-events:none;z-index:0 !important}
  .tl2-link{fill:none;stroke-width:2;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .28s ease .25s}
  .tl2-dot{transform-box:fill-box;transform-origin:center;transform:scale(0);transition:transform .2s ease .25s}
  .tl2-node{position:absolute;transform:translate(-50%,-50%) scale(0);visibility:hidden;pointer-events:none;z-index:6;filter:drop-shadow(0 3px 3px rgba(0,0,0,.32));transition:transform .24s cubic-bezier(.34,1.56,.64,1) .25s,visibility 0s .5s}
  .tl2-node-in{display:flex;flex-direction:column;align-items:center;gap:2px}
  .tl2-node-quest{cursor:pointer}
  .tl2-disc{width:34px;height:34px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1;box-sizing:border-box}
  .tl2-tag{max-width:96px;padding:0 7px;border-radius:99px;border:1.5px solid;font-size:9.5px;font-weight:800;line-height:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box}
  .tl2-cloud{position:relative}
  .tl2-cloud svg{position:absolute;left:0;top:0;overflow:visible;z-index:0 !important}
  .tl2-cloud-shape{transform-box:fill-box;transform-origin:center}
  .tl2-cloud-txt{z-index:1;position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 14px;font-size:10px;font-weight:800;line-height:13px;overflow-wrap:anywhere;unicode-bidi:plaintext}
  @keyframes tl2Bob{0%,100%{transform:translateY(0) rotate(0deg)}30%{transform:translateY(-2.5px) rotate(-2deg)}70%{transform:translateY(1.5px) rotate(2deg)}}
  @keyframes tl2Puff{0%,100%{transform:scale(1)}50%{transform:scale(1.045,1.07)}}
  @keyframes tl2Blink{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
  .tl2-cafe.is-open .tl2-node,.tl2-pin.is-open .tl2-node{transform:translate(-50%,-50%) scale(var(--s,1));visibility:visible;pointer-events:auto;transition-delay:var(--d,0s),0s}
  .tl2-cafe.is-open .tl2-link,.tl2-pin.is-open .tl2-link{stroke-dashoffset:0;transition-delay:var(--d,0s)}
  .tl2-cafe.is-open .tl2-dot,.tl2-pin.is-open .tl2-dot{transform:scale(1);transition-delay:var(--d,0s)}
  .tl2-cafe.is-open .tl2-node-in,.tl2-pin.is-open .tl2-node-in{animation:tl2Bob 3.2s ease-in-out infinite;animation-delay:var(--b,0s)}
  .tl2-cafe.is-open .tl2-cloud-shape,.tl2-pin.is-open .tl2-cloud-shape{animation:tl2Puff 2.6s ease-in-out infinite}
  .tl2-cafe.is-open .tl2-dot,.tl2-pin.is-open .tl2-dot{animation:tl2Blink 1.8s ease-in-out infinite .4s}
  @media (hover:hover) and (pointer:fine){
    .tl2-cafe:hover .tl2-node,.tl2-pin:hover .tl2-node{transform:translate(-50%,-50%) scale(var(--s,1));visibility:visible;pointer-events:auto;transition-delay:var(--d,0s),0s}
    .tl2-cafe:hover .tl2-link,.tl2-pin:hover .tl2-link{stroke-dashoffset:0;transition-delay:var(--d,0s)}
    .tl2-cafe:hover .tl2-dot,.tl2-pin:hover .tl2-dot{transform:scale(1);transition-delay:var(--d,0s)}
    .tl2-cafe:hover .tl2-node-in,.tl2-pin:hover .tl2-node-in{animation:tl2Bob 3.2s ease-in-out infinite;animation-delay:var(--b,0s)}
    .tl2-cafe:hover .tl2-cloud-shape,.tl2-pin:hover .tl2-cloud-shape{animation:tl2Puff 2.6s ease-in-out infinite}
    .tl2-cafe:hover .tl2-dot,.tl2-pin:hover .tl2-dot{animation:tl2Blink 1.8s ease-in-out infinite .4s}
  }

  /* نسخه v3.0 — پرچم پایگاه و نرم آمدن مه */
  .tl3-base-flag{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:900;background:${C.card};color:${C.text};border:1.5px solid ${C.text};box-shadow:0 3px 8px rgba(0,0,0,.35)}
  .tl3-fog-deep,.tl3-fog-ring{animation:tl2Fade .6s ease both}
  .tl3-fog-open,.tl3-fog-base{animation:tl2Fade .9s ease both}

  /* خوشه */
  .tl2-cluster{border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:900;box-sizing:border-box;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
  .tl2-cluster:hover{transform:scale(1.08)}

  /* رفتار دکمه‌ها */
  .tl2 button{font-family:inherit}
  .tl2-press{transition:transform .14s cubic-bezier(.34,1.56,.64,1),background .2s,box-shadow .2s,color .2s}
  .tl2-press:active{transform:scale(.95)}
  .tl2-press:focus-visible,.tl2 input:focus-visible{outline:2px solid ${C.accent};outline-offset:2px}
  .tl2-noscroll{scrollbar-width:none}
  .tl2-noscroll::-webkit-scrollbar{display:none}
  .tl2-fade-x{-webkit-mask-image:linear-gradient(to left,transparent 0,#000 14px,#000 calc(100% - 22px),transparent 100%);mask-image:linear-gradient(to left,transparent 0,#000 14px,#000 calc(100% - 22px),transparent 100%)}
  .tl2-led > *{pointer-events:auto}
  .tl2 input::placeholder{color:${C.sub};opacity:.85}

  @keyframes tl2Rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tl2Drop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tl2Sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes tl2Pop{from{opacity:0;transform:translate(-50%,-48%) scale(.96)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
  @keyframes tl2Fade{from{opacity:0}to{opacity:1}}
  @keyframes tl2Slide{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
  @media (prefers-reduced-motion: reduce){
    .tl2 *,.tl2-pin,.tl2-cluster{animation:none !important;transition:none !important}
  }
  `
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
