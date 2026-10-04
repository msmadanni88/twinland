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

  /* حباب‌های شناور (شعار، آیتم ویژه، کمپین، ظرفیت تکمیل) — با hover روی
     دسکتاپ یا نگه‌داشتن انگشت روی موبایل (کلاس is-open) از کنار پین بیرون می‌زنند */
  .tl2-sat{position:absolute;display:flex;align-items:center;gap:3px;padding:3px 7px;border-radius:99px;font-size:9.5px;font-weight:800;white-space:nowrap;max-width:118px;overflow:hidden;text-overflow:ellipsis;opacity:0;pointer-events:none;box-shadow:0 3px 8px rgba(0,0,0,.3);z-index:6;transition:opacity .16s}
  .tl2-sat-motto{top:-16px;left:50%;transform:translateX(-50%) scale(.3)}
  .tl2-sat-item{top:3px;right:-12px;transform:scale(.3)}
  .tl2-sat-quest{top:19px;left:-14px;transform:scale(.3);cursor:pointer}
  .tl2-sat-full{bottom:-9px;left:50%;transform:translateX(-50%) scale(.3)}
  @keyframes tl2WiggleC{0%,100%{transform:translateX(-50%) scale(1) rotate(-3deg)}50%{transform:translateX(-50%) scale(1) rotate(3deg)}}
  @keyframes tl2WiggleS{0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1) rotate(3deg)}}
  .tl2-cafe.is-open .tl2-sat,.tl2-pin.is-open .tl2-sat{opacity:1;pointer-events:auto}
  .tl2-cafe.is-open .tl2-sat-motto,.tl2-pin.is-open .tl2-sat-motto{animation:tl2WiggleC 2.6s ease-in-out infinite}
  .tl2-cafe.is-open .tl2-sat-full,.tl2-pin.is-open .tl2-sat-full{animation:tl2WiggleC 2.6s ease-in-out infinite .3s}
  .tl2-cafe.is-open .tl2-sat-item,.tl2-pin.is-open .tl2-sat-item{animation:tl2WiggleS 2.3s ease-in-out infinite .15s}
  .tl2-cafe.is-open .tl2-sat-quest,.tl2-pin.is-open .tl2-sat-quest{animation:tl2WiggleS 2.3s ease-in-out infinite .45s}
  @media (hover:hover) and (pointer:fine){
    .tl2-cafe:hover .tl2-sat,.tl2-pin:hover .tl2-sat{opacity:1;pointer-events:auto}
    .tl2-cafe:hover .tl2-sat-motto,.tl2-pin:hover .tl2-sat-motto{animation:tl2WiggleC 2.6s ease-in-out infinite}
    .tl2-cafe:hover .tl2-sat-full,.tl2-pin:hover .tl2-sat-full{animation:tl2WiggleC 2.6s ease-in-out infinite .3s}
    .tl2-cafe:hover .tl2-sat-item,.tl2-pin:hover .tl2-sat-item{animation:tl2WiggleS 2.3s ease-in-out infinite .15s}
    .tl2-cafe:hover .tl2-sat-quest,.tl2-pin:hover .tl2-sat-quest{animation:tl2WiggleS 2.3s ease-in-out infinite .45s}
  }

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
