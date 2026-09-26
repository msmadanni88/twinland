// App-wide constants for the home screen: supported cities, map zones, bottom
// navigation, quick filters, café marker colours and layout breakpoints.


export const CITIES = {
  tehran:  { name:'تهران',  lat:35.7219, lng:51.3979, zoom:12 },
  mashhad: { name:'مشهد',   lat:36.2972, lng:59.6067, zoom:12 },
  isfahan: { name:'اصفهان', lat:32.6539, lng:51.6660, zoom:12 },
  shiraz:  { name:'شیراز',  lat:29.5918, lng:52.5837, zoom:12 },
  tabriz:  { name:'تبریز',  lat:38.0962, lng:46.2738, zoom:12 },
  karaj:   { name:'کرج',    lat:35.8400, lng:50.9391, zoom:12 },
  rasht:   { name:'رشت',    lat:37.2809, lng:49.5831, zoom:12 },
  kish:    { name:'کیش',    lat:26.5267, lng:53.9800, zoom:13 },
}

export const XP_CONFIG = {
  checkin:20, checkin_top:30, checkin_first:50, streak_bonus:10, event_bonus:40,
}

export const ZONES = [
  { key:'all',    label:'همه' },
  { key:'north',  label:'شمال', lat:35.766, lng:51.41 },
  { key:'south',  label:'جنوب', lat:35.635, lng:51.42 },
  { key:'center', label:'مرکز', lat:35.703, lng:51.41 },
  { key:'east',   label:'شرق',  lat:35.721, lng:51.50 },
  { key:'west',   label:'غرب',  lat:35.728, lng:51.34 },
  { key:'top',    label:'⭐ برتر' },
]

export const NAV = [
  { key:'map',      img:'icon_map',     label:'نقشه'    },
  { key:'missions', img:'icon_mission', label:'ماموریت' },
  { key:'clan',     img:'icon_clan',    label:'کلن'     },
  { key:'rank',     img:'icon_rank',    label:'رتبه'    },
  { key:'profile',  img:'icon_profile', label:'پروفایل' },
]

export const QUICK_FILTERS = [
  {tag:'صبحانه',icon:'🌅'},{tag:'شبانه',icon:'🌙'},
  {tag:'کتاب',icon:'📚'},{tag:'موسیقی',icon:'🎵'},
  {tag:'دنج',icon:'🛋'},{tag:'اسپشالتی',icon:'☕'},
]

const CAFE_COLORS = ['#FF6B35','#E84393','#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']

export function getColor(name) {
  let h=0; for (let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h)
  return CAFE_COLORS[Math.abs(h)%CAFE_COLORS.length]
}

export const BP = { mobile:640, tablet:1024 }
