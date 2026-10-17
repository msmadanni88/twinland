'use client'
// استایل نسخه v4.0 — همه زیر کلاس .tl4 تا روی نسخه‌های دیگر اثر نگذارد.
// V2Styles هم کنارش هست، چون اجزای مشترک (پنجره کافه، نوار رویداد، پین‌ها) کلاس‌های .tl2 را لازم دارند.
//
// ردیف «پیوسته به لبه»: ردیف انتخاب‌شده یا زیر ماوس یک قرص توپر می‌شود که به لبه قاب می‌چسبد
// و دو گوشه گرد وارونه دارد، مثل زبانه‌ای که از دیواره بیرون آمده.
//   tl4-row r  → به لبه راست قاب می‌چسبد
//   tl4-row l  → به لبه چپ قاب می‌چسبد
//   tl4-row b  → به لبه پایین می‌چسبد (زبانه بالای محتوا)
// رنگ از متغیرهای --fa (انتخاب‌شده) و --fh (زیر ماوس) و شعاع از --fr می‌آید.
export function V4Styles({ C, T }) {
  const css = `
  .tl4{--fr:14px;--fa:${C.accent};--fh:${T.hover};--fon:${T.onAccent}}
  .tl4 .leaflet-container{background:${T.mapBg} !important}
  .tl4 .leaflet-container:not(.tl-vector) .leaflet-tile-pane{filter:${T.tileFilter} !important;transition:filter .4s}
  .tl4 .leaflet-control-attribution{background:${T.glass} !important;color:${C.sub} !important;border:1px solid ${T.hair};backdrop-filter:${T.blur};-webkit-backdrop-filter:${T.blur};font-size:9.5px !important}
  .tl4 .leaflet-control-attribution a{color:${C.sub} !important}

  .tl4-glass{background:${T.glass};backdrop-filter:${T.blur};-webkit-backdrop-filter:${T.blur};border:1px solid ${T.hair}}
  .tl4-glass-strong{background:${T.glassStrong};backdrop-filter:${T.blur};-webkit-backdrop-filter:${T.blur};border:1px solid ${T.hair}}

  .tl4-row{position:relative;--f:transparent;background:var(--f);transition:background .18s ease,color .18s ease}
  .tl4-row::before,.tl4-row::after{content:'';position:absolute;width:var(--fr);height:var(--fr);pointer-events:none;opacity:0;transition:opacity .18s ease}
  .tl4-row.is-on{--f:var(--fa);color:var(--fon) !important}
  .tl4-row.is-on::before,.tl4-row.is-on::after{opacity:1}
  @media (hover:hover) and (pointer:fine){
    .tl4-row:not(.is-on):not(:disabled):hover{--f:var(--fh)}
    .tl4-row:not(.is-on):not(:disabled):hover::before,.tl4-row:not(.is-on):not(:disabled):hover::after{opacity:1}
  }
  .tl4-row.r{border-radius:var(--fr) 0 0 var(--fr)}
  .tl4-row.r::before{top:calc(-1 * var(--fr));right:0;background:radial-gradient(circle at 0 0,transparent calc(var(--fr) - .6px),var(--f) var(--fr))}
  .tl4-row.r::after{bottom:calc(-1 * var(--fr));right:0;background:radial-gradient(circle at 0 100%,transparent calc(var(--fr) - .6px),var(--f) var(--fr))}
  .tl4-row.l{border-radius:0 var(--fr) var(--fr) 0}
  .tl4-row.l::before{top:calc(-1 * var(--fr));left:0;background:radial-gradient(circle at 100% 0,transparent calc(var(--fr) - .6px),var(--f) var(--fr))}
  .tl4-row.l::after{bottom:calc(-1 * var(--fr));left:0;background:radial-gradient(circle at 100% 100%,transparent calc(var(--fr) - .6px),var(--f) var(--fr))}
  .tl4-row.b{border-radius:var(--fr) var(--fr) 0 0}
  .tl4-row.b::before{bottom:0;left:calc(-1 * var(--fr));background:radial-gradient(circle at 0 0,transparent calc(var(--fr) - .6px),var(--f) var(--fr))}
  .tl4-row.b::after{bottom:0;right:calc(-1 * var(--fr));background:radial-gradient(circle at 100% 0,transparent calc(var(--fr) - .6px),var(--f) var(--fr))}

  .tl4-btn{transition:background .18s ease,color .18s ease,transform .14s cubic-bezier(.34,1.56,.64,1)}
  @media (hover:hover) and (pointer:fine){ .tl4-btn:not(.is-on):hover{background:${T.hover} !important} }
  .tl4-btn:active,.tl4-press:active{transform:scale(.95)}
  .tl4-press{transition:transform .14s cubic-bezier(.34,1.56,.64,1),opacity .2s}
  @media (hover:hover) and (pointer:fine){ .tl4-press:hover{opacity:.88} }
  .tl4-btn.is-on{background:${C.accent} !important;color:${T.onAccent} !important;border-color:transparent !important}

  .tl4-rail-label{white-space:nowrap;overflow:hidden;transition:opacity .2s ease, max-width .28s ease}
  .tl4-tipbox{position:absolute;left:calc(100% + 12px);top:50%;transform:translateY(-50%);white-space:nowrap;padding:5px 10px;border-radius:10px;font-size:11.5px;font-weight:800;color:${C.text};background:${T.glassStrong};backdrop-filter:${T.blur};-webkit-backdrop-filter:${T.blur};border:1px solid ${T.hair};box-shadow:${T.shadow1};pointer-events:none;opacity:0;transition:opacity .15s ease;z-index:5}
  @media (hover:hover) and (pointer:fine){ .tl4-row:hover .tl4-tipbox{opacity:1} }

  .tl4 .tl2-pin-live{font-variant-numeric:tabular-nums}
  .tl4-pin{position:relative;width:30px;height:38px;cursor:pointer;transform-origin:50% 96%;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
  .tl4-pin:hover,.tl4-pin.is-open{transform:translateY(-2px) scale(1.08)}
  .tl4-pin-head{position:absolute;left:1px;top:1px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:2px solid}
  .tl4-pin-tail{position:absolute;left:50%;top:27px;width:2px;height:8px;margin-left:-1px;border-radius:2px}
  .tl4-pin-dot{position:absolute;left:50%;bottom:0;width:6px;height:3px;margin-left:-3px;border-radius:50%;background:rgba(0,0,0,.28);filter:blur(.6px)}
  .tl4-pin-badge{position:absolute;min-width:15px;height:15px;padding:0 3px;border-radius:99px;border:1.5px solid;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:900;box-sizing:border-box;line-height:1}
  .tl4-minor{width:11px;height:11px;border-radius:50%;border:2px solid;box-sizing:border-box;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .15s}
  .tl4-minor:hover{transform:scale(1.5)}
  .tl4-cluster{border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:900;box-sizing:border-box;backdrop-filter:${T.blur};-webkit-backdrop-filter:${T.blur};transition:transform .2s cubic-bezier(.34,1.56,.64,1);font-variant-numeric:tabular-nums}
  .tl4-cluster:hover{transform:scale(1.08)}
  .tl4 .leaflet-marker-icon:has(.tl4-pin:hover),.tl4 .leaflet-marker-icon:has(.tl4-pin.is-open){z-index:100000 !important}

  @keyframes tl4Spin{to{transform:rotate(360deg)}}
  @keyframes tl4Fade{from{opacity:0}to{opacity:1}}
  @keyframes tl4Pop{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion: reduce){ .tl4 *{animation:none !important;transition:none !important} }
  `
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
