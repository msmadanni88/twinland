// طرح‌های موقت تصویر ویجت — با کد کشیده شده‌اند تا طرح‌های خود دنی آماده شود.
// هر طرح روی بوم 64 در 64 است و با رنگ گروهش (c) و رنگ روشن‌ترش (l) پر می‌شود.
// برای عوض کردن یکی از آن‌ها با تصویر واقعی: lib/events/art.js را ببین.
import React from 'react'

const INK = '#2a2118'
const CREAM = '#fff4de'
const SW = 2.6
const st = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round', strokeLinecap: 'round' }
const nf = { fill: 'none', ...st }

export const ART_SVG = {
  cup: ({ c, l }) => (<>
    <ellipse cx="30" cy="56" rx="21" ry="3.4" fill={l} {...st} />
    <path d="M13 27h34v12a15 15 0 0 1-15 15h-4a15 15 0 0 1-15-15z" fill={c} {...st} />
    <path d="M47 30h3.5a6 6 0 0 1 0 12H45" {...nf} />
    <ellipse cx="30" cy="27" rx="17" ry="3.6" fill={CREAM} {...st} />
    <path d="M22 21c-3-3 3-5 0-10M31 21c-3-3 3-5 0-10M40 21c-3-3 3-5 0-10" {...nf} strokeWidth="2.2" />
  </>),
  latte: ({ c, l }) => (<>
    <path d="M52 29c7 0 8 11 0 11" {...nf} />
    <circle cx="30" cy="34" r="23" fill={CREAM} {...st} />
    <circle cx="30" cy="34" r="16.5" fill="#9a6a44" {...st} />
    <path d="M30 44c-9-5-10-10-6.5-13.2 2.4-2 5.3-.8 6.5 2.2 1.2-3 4.1-4.2 6.5-2.2C40 34 39 39 30 44z" fill={CREAM} {...st} strokeWidth="2" />
  </>),
  teapot: ({ c, l }) => (<>
    <path d="M12 28c-6 0-7 10 0 11" {...nf} />
    <path d="M52 20c8 2 6 14-4 18" {...nf} />
    <path d="M14 30a18 18 0 0 1 36 0v8a14 14 0 0 1-14 14h-8a14 14 0 0 1-14-14z" fill={c} {...st} />
    <path d="M26 14h12" {...nf} />
    <circle cx="32" cy="11" r="3" fill={l} {...st} />
    <path d="M22 32a8 8 0 0 1 8-8" {...nf} stroke={CREAM} strokeWidth="2.4" />
    <rect x="18" y="52" width="28" height="5" rx="2.5" fill={l} {...st} />
  </>),
  bean: ({ c, l }) => (<>
    <ellipse cx="32" cy="32" rx="17" ry="24" transform="rotate(35 32 32)" fill="#8a5a3a" {...st} />
    <path d="M22 14c8 8-2 14 4 22s-2 12 6 18" {...nf} stroke={CREAM} transform="rotate(0 32 32)" strokeWidth="2.6" />
  </>),
  croissant: ({ c, l }) => (<>
    <path d="M6 42c2-17 14-28 26-28s24 11 26 28c-4-3-7-3-10 0-3-5-7-5-10 0-3-5-7-5-10 0-3-5-7-5-10 0-3-3-6-3-12 0z" fill={c} {...st} />
    <path d="M20 19l5 17M32 15v21M44 19l-5 17" {...nf} strokeWidth="2.2" />
    <path d="M14 30c3-5 6-8 10-10" {...nf} stroke={l} strokeWidth="2.4" />
  </>),
  cake: ({ c, l }) => (<>
    <path d="M8 34l34-14 14 8v21a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill={CREAM} {...st} />
    <path d="M8 34l34-14 14 8-34 15z" fill={c} {...st} />
    <path d="M8 46h48" {...nf} stroke={c} strokeWidth="4" />
    <circle cx="44" cy="15" r="5" fill="#e23b55" {...st} />
    <path d="M44 10c1-3 3-4 6-4" {...nf} strokeWidth="2.2" />
  </>),
  cookie: ({ c, l }) => (<>
    <circle cx="32" cy="32" r="23" fill="#e2b176" {...st} />
    <circle cx="23" cy="24" r="3.4" fill="#5a3a22" /><circle cx="39" cy="22" r="3" fill="#5a3a22" />
    <circle cx="42" cy="37" r="3.6" fill="#5a3a22" /><circle cx="26" cy="41" r="3.2" fill="#5a3a22" />
    <circle cx="33" cy="32" r="2.4" fill="#5a3a22" />
    <path d="M52 22c2 3 3 6 3 10" {...nf} stroke={CREAM} strokeWidth="2.2" />
  </>),
  icecream: ({ c, l }) => (<>
    <path d="M20 31h24L32 59z" fill="#e8b46a" {...st} />
    <path d="M25 37l7 14M32 33l5 12M27 33l-1 0" {...nf} strokeWidth="1.8" />
    <circle cx="32" cy="23" r="13" fill={c} {...st} />
    <circle cx="23" cy="29" r="8" fill={l} {...st} />
    <circle cx="32" cy="9" r="3.4" fill="#e23b55" {...st} />
  </>),
  burger: ({ c, l }) => (<>
    <path d="M10 28a22 17 0 0 1 44 0z" fill="#e2a65c" {...st} />
    <circle cx="24" cy="20" r="1.5" fill={CREAM} /><circle cx="33" cy="16" r="1.5" fill={CREAM} /><circle cx="41" cy="21" r="1.5" fill={CREAM} />
    <path d="M9 32c4 4 8-3 12 1s8-3 12 1 8-3 12 1 6 0 10-2" fill="none" stroke="#3a9a4a" strokeWidth="5" strokeLinecap="round" />
    <rect x="9" y="38" width="46" height="7" rx="3.5" fill="#6a3b25" {...st} />
    <path d="M10 48h44a4 4 0 0 1-4 8H14a4 4 0 0 1-4-8z" fill="#e2a65c" {...st} />
  </>),
  tag: ({ c, l }) => (<>
    <path d="M8 12a4 4 0 0 1 4-4h20l24 24a4 4 0 0 1 0 5.6L37.6 55.6a4 4 0 0 1-5.6 0L8 32z" fill={c} {...st} />
    <circle cx="19" cy="19" r="4" fill={CREAM} {...st} />
    <path d="M26 42l16-16" {...nf} stroke={CREAM} strokeWidth="3.2" />
    <circle cx="28" cy="30" r="2.6" fill={CREAM} /><circle cx="40" cy="42" r="2.6" fill={CREAM} />
  </>),
  gift: ({ c, l }) => (<>
    <rect x="9" y="26" width="46" height="12" rx="3" fill={l} {...st} />
    <rect x="12" y="38" width="40" height="19" rx="3" fill={c} {...st} />
    <path d="M32 26v31" {...nf} stroke={CREAM} strokeWidth="5" />
    <path d="M32 26c-4-10-14-10-12-4s8 4 12 4zM32 26c4-10 14-10 12-4s-8 4-12 4z" fill={CREAM} {...st} />
  </>),
  ticket: ({ c, l }) => (<>
    <path d="M6 20a3 3 0 0 1 3-3h46a3 3 0 0 1 3 3v8a5 5 0 0 0 0 8v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8a5 5 0 0 0 0-8z" fill={c} {...st} />
    <path d="M42 18v28" {...nf} strokeDasharray="3 4" stroke={CREAM} />
    <path d="M24 26l2.6 5.4 5.9.8-4.3 4.1 1 5.8L24 39.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill={CREAM} {...st} strokeWidth="1.8" />
  </>),
  key: ({ c, l }) => (<>
    <circle cx="22" cy="22" r="13" fill={c} {...st} />
    <circle cx="22" cy="22" r="5" fill={CREAM} {...st} />
    <path d="M31 31l24 24M44 44l6-6M50 50l5-5" {...nf} strokeWidth="5" stroke={INK} />
    <path d="M31 31l24 24M44 44l6-6M50 50l5-5" {...nf} strokeWidth="2" stroke={l} />
  </>),
  party: ({ c, l }) => (<>
    <path d="M8 58l12-34 22 22z" fill={c} {...st} />
    <path d="M14 42l14 14M18 32l18 18" {...nf} stroke={CREAM} strokeWidth="2" />
    <path d="M30 14c0-6 6-4 4-10M44 22c6-2 6-8 12-6M40 36c6 2 10 8 16 6" {...nf} strokeWidth="2.4" />
    <circle cx="50" cy="8" r="2.6" fill="#e23b55" /><circle cx="56" cy="30" r="2.6" fill={l} stroke={INK} strokeWidth="1.4" />
    <rect x="22" y="6" width="6" height="6" rx="1" fill="#3aa0e0" transform="rotate(20 25 9)" />
  </>),
  music: ({ c, l }) => (<>
    <path d="M24 46V14l28-6v32" {...nf} strokeWidth="3" />
    <path d="M24 22l28-6" {...nf} strokeWidth="3" />
    <ellipse cx="17" cy="47" rx="9" ry="7" fill={c} {...st} />
    <ellipse cx="45" cy="41" rx="9" ry="7" fill={c} {...st} />
  </>),
  book: ({ c, l }) => (<>
    <path d="M32 18c-6-5-16-6-24-4v36c8-2 18-1 24 4z" fill={CREAM} {...st} />
    <path d="M32 18c6-5 16-6 24-4v36c-8-2-18-1-24 4z" fill={c} {...st} />
    <path d="M14 24c4-1 8 0 12 2M14 32c4-1 8 0 12 2" {...nf} strokeWidth="2" />
    <path d="M32 18v36" {...nf} />
  </>),
  palette: ({ c, l }) => (<>
    <path d="M32 8C17 8 6 19 6 32s10 24 22 24c5 0 6-3 4-6s-1-7 4-7h8c8 0 14-5 14-12C58 18 47 8 32 8z" fill={CREAM} {...st} />
    <circle cx="19" cy="30" r="4.4" fill="#e23b55" {...st} strokeWidth="1.8" />
    <circle cx="28" cy="19" r="4.4" fill="#f2c230" {...st} strokeWidth="1.8" />
    <circle cx="41" cy="19" r="4.4" fill="#3aa0e0" {...st} strokeWidth="1.8" />
    <circle cx="49" cy="29" r="4.4" fill="#3aa86a" {...st} strokeWidth="1.8" />
  </>),
  gamepad: ({ c, l }) => (<>
    <path d="M18 18h28c9 0 14 9 15 21 .8 9-6 11-10 5l-5-7H18l-5 7c-4 6-11 4-10-5 1-12 6-21 15-21z" fill={c} {...st} />
    <path d="M20 26v10M15 31h10" {...nf} stroke={CREAM} strokeWidth="3.4" />
    <circle cx="42" cy="27" r="3" fill={CREAM} {...st} strokeWidth="1.6" /><circle cx="48" cy="33" r="3" fill={l} {...st} strokeWidth="1.6" />
  </>),
  moon: ({ c, l }) => (<>
    <path d="M44 8a24 24 0 1 0 12 36A20 20 0 0 1 44 8z" fill={c} {...st} />
    <circle cx="48" cy="14" r="2.2" fill={CREAM} /><circle cx="56" cy="26" r="1.6" fill={CREAM} /><circle cx="14" cy="10" r="1.6" fill={l} stroke={INK} strokeWidth="1" />
  </>),
  star: ({ c, l }) => (<>
    <path d="M32 6l7.6 16.2 17.6 2.2-13 12.2 3.4 17.5L32 45.4 16.4 54.1l3.4-17.5-13-12.2 17.6-2.2z" fill={c} {...st} />
    <path d="M24 22l8-10" {...nf} stroke={CREAM} strokeWidth="2.4" />
  </>),
  heart: ({ c, l }) => (<>
    <path d="M32 55C12 40 6 29 6 21A13 13 0 0 1 32 16a13 13 0 0 1 26 5c0 8-6 19-26 34z" fill={c} {...st} />
    <path d="M15 20c0-4 3-6 6-6" {...nf} stroke={CREAM} strokeWidth="2.6" />
  </>),
  trophy: ({ c, l }) => (<>
    <path d="M18 8h28v14a14 14 0 0 1-28 0z" fill={c} {...st} />
    <path d="M18 14H8c0 10 4 14 11 15M46 14h10c0 10-4 14-11 15" {...nf} />
    <path d="M32 36v10" {...nf} strokeWidth="4" />
    <path d="M22 56a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4z" fill={l} {...st} />
    <path d="M24 14v8" {...nf} stroke={CREAM} strokeWidth="2.4" />
  </>),
  crown: ({ c, l }) => (<>
    <path d="M8 46L6 18l14 14 12-20 12 20 14-14-2 28z" fill={c} {...st} />
    <rect x="8" y="46" width="48" height="8" rx="2" fill={l} {...st} />
    <circle cx="32" cy="14" r="2.6" fill={CREAM} /><circle cx="7" cy="17" r="2.6" fill={CREAM} /><circle cx="57" cy="17" r="2.6" fill={CREAM} />
  </>),
  gem: ({ c, l }) => (<>
    <path d="M18 10h28l12 14-26 32L6 24z" fill={c} {...st} />
    <path d="M6 24h52M18 10l8 14 6 32M46 10l-8 14-6 32M26 24h12" {...nf} strokeWidth="2" />
    <path d="M20 14l-6 8" {...nf} stroke={CREAM} strokeWidth="2.4" />
  </>),
  flame: ({ c, l }) => (<>
    <path d="M32 6c2 10 14 16 14 32a14 14 0 0 1-28 0c0-8 4-10 6-16 3 3 4 5 5 7 2-6 2-14 3-23z" fill={c} {...st} />
    <path d="M32 58a8 8 0 0 1-8-8c0-6 5-8 8-14 3 6 8 8 8 14a8 8 0 0 1-8 8z" fill={l} {...st} />
  </>),
  leaf: ({ c, l }) => (<>
    <path d="M10 54C6 28 24 8 56 8c0 28-14 46-40 46" fill={c} {...st} />
    <path d="M10 54C22 40 32 30 46 20" {...nf} stroke={CREAM} strokeWidth="2.6" />
  </>),
  clock: ({ c, l }) => (<>
    <circle cx="32" cy="34" r="22" fill={CREAM} {...st} />
    <circle cx="32" cy="34" r="22" fill="none" stroke={c} strokeWidth="5" strokeDasharray="90 60" strokeLinecap="round" transform="rotate(-90 32 34)" />
    <circle cx="32" cy="34" r="22" fill="none" {...st} />
    <path d="M32 21v13l9 6" {...nf} strokeWidth="3" />
    <path d="M26 7h12" {...nf} strokeWidth="3.2" />
  </>),
  pin: ({ c, l }) => (<>
    <path d="M32 6a18 18 0 0 0-18 18c0 14 18 32 18 32s18-18 18-32A18 18 0 0 0 32 6z" fill={c} {...st} />
    <circle cx="32" cy="24" r="7" fill={CREAM} {...st} />
    <ellipse cx="32" cy="58" rx="10" ry="2.4" fill="rgba(0,0,0,.2)" />
  </>),
}
