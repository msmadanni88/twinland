'use client'
// حالت نمایشی نسخه v3.0 — شبیه‌سازی یک شهر شلوغ، فقط روی همین صفحه.
// هیچ‌چیز در دیتابیس نوشته نمی‌شود: کاربرها، چک‌این‌ها، امتیازها، شعارها و کمپین‌های ساختگی
// فقط در حافظه همین تب ساخته می‌شوند و با خاموش کردن یا بستن تب از بین می‌روند.
// وقتی خاموش است، همان داده واقعی بدون هیچ تغییری برمی‌گردد.
import { useEffect, useMemo, useRef, useState } from 'react'

export const DEMO_USER_COUNT = 500
const TICK_MS = 1100

const FIRST = ['سارا', 'علی', 'مریم', 'رضا', 'نگار', 'امیر', 'زهرا', 'محمد', 'الناز', 'حسین', 'نیلوفر', 'پویا', 'آیدا', 'مهدی', 'ترانه', 'کیان', 'شیما', 'آرش', 'هستی', 'سینا', 'یاسمن', 'بهراد', 'پریسا', 'نیما', 'غزل', 'سپهر', 'ملیکا', 'آرمان', 'رها', 'دانیال', 'ستاره', 'ماهان', 'کیمیا', 'پارسا', 'هانیه', 'شایان', 'آوا', 'فرهاد', 'دریا', 'سامان']
const LAST = ['قهوه‌گرد', 'شب‌گرد', 'تهرانی', 'کافه‌نشین', 'لاته', 'ماجراجو', 'پرسه‌زن', 'خوش‌ذوق', 'اسپرسو', 'کاشف', 'همیشه‌بیدار', 'باران', 'آفتاب']
const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🦉', '🐙', '🦄', '🐧', '🐺', '🦋', '🐬', '🦜', '🐢']
const MOTTOS = ['قهوه خوب، حال خوب', 'هر روز یک فنجان آرامش', 'اینجا خانه دوم توست', 'دم‌آوری تازه رسید!', 'بوی قهوه تازه می‌آید', 'امروز کیک خانگی داریم', 'موسیقی زنده، پنجشنبه شب', 'جای دنج برای کار', 'صبحانه تا ظهر', 'منتظرت هستیم', 'لاته آرت رایگان امروز', 'دانه تازه از اتیوپی', 'بارون میاد، چای بچسبه', 'یک فنجان، یک گپ', 'تخفیف دانشجویی هر روز', 'شب‌های بازی فکری', 'کتاب بیاور، قهوه ببر', 'تراس باز شد']
const ITEMS = ['لاته', 'کوکی شکلاتی', 'آفوگاتو', 'چیزکیک', 'کاپوچینو', 'کروسان کره‌ای', 'چای ماسالا', 'موکا', 'براونی', 'آیس آمریکانو', 'وافل', 'ماچا لاته', 'اسپرسو دبل', 'پنکیک', 'دمنوش بهارنارنج', 'پیتزا مارگاریتا']
const QUESTS = [['⚡', 'ساعت طلایی'], ['🎯', 'سه بار در هفته'], ['🍰', 'عصرانه دونفره'], ['🌙', 'شب‌نشینی'], ['☕', 'اولین فنجان'], ['🎲', 'شب بازی'], ['📚', 'کتاب و قهوه'], ['🔥', 'چالش هفت روز'], ['🎁', 'جایزه غافلگیری'], ['🏆', 'مشتری ماه']]
const BADGES = ['کاشف محله', 'قهوه‌شناس', 'شب‌زنده‌دار', 'رفیق همیشگی', 'سحرخیز', 'ماجراجوی شهر', 'استاد لاته', 'کلکسیونر']

function hashOf(s) { s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } return h }
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function makeUsers() {
  const out = []
  for (let i = 0; i < DEMO_USER_COUNT; i++) {
    out.push({ id: 'demo-' + i, name: FIRST[i % FIRST.length] + ' ' + LAST[(i * 7 + (i >> 3)) % LAST.length], avatar: AVATARS[i % AVATARS.length], xp: 40 + Math.floor(Math.pow(Math.random(), 2.2) * 5200), me: false })
  }
  return out
}

export function useDemoSim({ cafes, enabled, live }) {
  const usersRef = useRef(null)
  const [demoLive, setDemoLive] = useState({})
  const [questRev, setQuestRev] = useState({})          // کمپین‌های تازه‌ای که کافه‌ها وسط نمایش می‌گذارند
  const [feed, setFeed] = useState([])
  const [leaders, setLeaders] = useState([])
  const [counts, setCounts] = useState({ checkins: 0, badges: 0, quests: 0 })
  const cafesRef = useRef(cafes)
  cafesRef.current = cafes

  // ویترین ساختگی برای کافه‌هایی که خودشان چیزی نگذاشته‌اند
  const demoCafes = useMemo(() => {
    if (!enabled) return cafes
    return cafes.map(c => {
      const h = hashOf(c.id)
      const rev = questRev[c.id]
      const q = rev ? { id: 'demo-q-' + c.id + '-' + rev.n, title: rev.title, icon: rev.icon }
        : (c.active_quest || (h % 10 < 4 ? { id: 'demo-q-' + c.id, title: QUESTS[h % QUESTS.length][1], icon: QUESTS[h % QUESTS.length][0] } : null))
      return {
        ...c,
        motto: c.motto || MOTTOS[h % MOTTOS.length],
        featured_item_name: c.featured_item_name || (h % 10 < 7 ? ITEMS[(h >> 4) % ITEMS.length] : null),
        active_quest: q,
        is_full: c.is_full || (h % 13 === 0),
      }
    })
  }, [cafes, enabled, questRev])

  useEffect(() => {
    if (!enabled) { usersRef.current = null; setDemoLive({}); setQuestRev({}); setFeed([]); setLeaders([]); setCounts({ checkins: 0, badges: 0, quests: 0 }); return }
    if (!cafesRef.current.length) return
    const users = usersRef.current = makeUsers()
    const start = {}
    cafesRef.current.forEach(c => { start[c.id] = Math.floor(Math.pow(Math.random(), 1.8) * 14) })
    setDemoLive(start)
    const top = () => [...users].sort((a, b) => b.xp - a.xp).slice(0, 5).map((u, i) => ({ ...u, rank: i + 1 }))
    setLeaders(top())
    let n = 0
    const openPin = (cafeId) => {
      try {
        const lv = document.getElementById('lv-' + cafeId)
        const host = lv && lv.closest('.tl2-cafe,.tl2-pin')
        if (!host || host.classList.contains('is-open')) return
        host.classList.add('is-open', 'tl3-demo-pop')
        setTimeout(() => { try { host.classList.remove('is-open', 'tl3-demo-pop') } catch (e) {} }, 5200)
      } catch (e) {}
    }
    const push = (ev) => setFeed(f => [{ ...ev, key: ++n }].concat(f).slice(0, 4))
    const t = setInterval(() => {
      const list = cafesRef.current
      if (!list.length) return
      const cafe = pick(list), u = pick(users)
      const r = Math.random()
      if (r < 0.74) {
        const gain = Math.random() < 0.3 ? 80 : 50
        u.xp += gain
        setDemoLive(m => {
          const next = { ...m, [cafe.id]: Math.min(40, (m[cafe.id] || 0) + 1) }
          const other = pick(list).id                       // یکی هم جای دیگر می‌رود بیرون
          if (other !== cafe.id && next[other] > 0 && Math.random() < 0.8) next[other] = next[other] - 1
          return next
        })
        setCounts(c => ({ ...c, checkins: c.checkins + 1 }))
        push({ icon: '📍', text: u.name + ' در ' + cafe.name + ' چک‌این کرد', tail: '+' + gain.toLocaleString('fa') + ' XP' })
        openPin(cafe.id)
      } else if (r < 0.88) {
        u.xp += 120
        setCounts(c => ({ ...c, badges: c.badges + 1 }))
        push({ icon: '🏅', text: u.name + ' نشان «' + pick(BADGES) + '» گرفت', tail: '' })
      } else if (r < 0.95) {
        const q = pick(QUESTS)
        setQuestRev(m => ({ ...m, [cafe.id]: { n: ((m[cafe.id] && m[cafe.id].n) || 0) + 1, title: q[1], icon: q[0] } }))
        setCounts(c => ({ ...c, quests: c.quests + 1 }))
        push({ icon: '🎉', text: cafe.name + ' کمپین «' + q[1] + '» گذاشت', tail: '' })
        setTimeout(() => openPin(cafe.id), 400)
      } else {
        const l = top()
        push({ icon: '🏆', text: l[0].name + ' صدر جدول است', tail: l[0].xp.toLocaleString('fa') + ' XP' })
      }
      if (n % 3 === 0) setLeaders(top())
    }, TICK_MS)
    // هر چند ثانیه چند پین تصادفی هم خودشان باز می‌شوند تا نقشه زنده دیده شود
    const t2 = setInterval(() => {
      try {
        const hosts = [...document.querySelectorAll('.tl2-cafe,.tl2-pin')].filter(h => h.querySelector('.tl2-orbit') && !h.classList.contains('is-open'))
        for (let i = 0; i < 2 && hosts.length; i++) {
          const h = hosts.splice(Math.floor(Math.random() * hosts.length), 1)[0]
          h.classList.add('is-open', 'tl3-demo-pop')
          setTimeout(() => { try { h.classList.remove('is-open', 'tl3-demo-pop') } catch (e) {} }, 4600)
        }
      } catch (e) {}
    }, 2600)
    return () => {
      clearInterval(t); clearInterval(t2)
      try { document.querySelectorAll('.tl3-demo-pop').forEach(h => h.classList.remove('is-open', 'tl3-demo-pop')) } catch (e) {}
    }
  }, [enabled, cafes.length > 0])

  if (!enabled) return { cafes, live, feed: [], leaders: null, counts, on: false }
  return { cafes: demoCafes, live: demoLive, feed, leaders, counts, on: true }
}
