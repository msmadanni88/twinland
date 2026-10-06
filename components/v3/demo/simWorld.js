// موتور شبیه‌سازی حالت نمایشی نسخه v3.0 — یک «شهر ساختگی» کامل، فقط در حافظه همین تب.
// هیچ خواندن یا نوشتنی در دیتابیس ندارد و هیچ کد اصلی سایت به آن وابسته نیست.
// دنیا تابعی از سه چیز است: یک دانه تصادفی، فهرست مکان‌ها و زمان شروع. برای همین:
//   - با باز و بسته شدن صفحه یا رفتن از نقشه به پنل کسب‌وکار، همان دنیا ادامه پیدا می‌کند و از صفر شروع نمی‌شود
//   - ساعت شبیه‌سازی از ساعت واقعی خوانده می‌شود، پس عقب نمی‌افتد و نمی‌پرد
// با خاموش کردن حالت نمایشی، همه‌چیز از حافظه تب پاک می‌شود.

export const DEMO_USER_COUNT = 5000
const N = DEMO_USER_COUNT
const KEY = 'tl_demo_world'
const TICK_MS = 1000
const MAX_REPLAY = 5400            // دنیای کهنه‌تر از 90 دقیقه از نو ساخته می‌شود
const FEED_MAX = 40

const FIRST = ['سارا', 'علی', 'مریم', 'رضا', 'نگار', 'امیر', 'زهرا', 'محمد', 'الناز', 'حسین', 'نیلوفر', 'پویا', 'آیدا', 'مهدی', 'ترانه', 'کیان', 'شیما', 'آرش', 'هستی', 'سینا', 'یاسمن', 'بهراد', 'پریسا', 'نیما', 'غزل', 'سپهر', 'ملیکا', 'آرمان', 'رها', 'دانیال', 'ستاره', 'ماهان', 'کیمیا', 'پارسا', 'هانیه', 'شایان', 'آوا', 'فرهاد', 'دریا', 'سامان', 'نازنین', 'بردیا', 'مهسا', 'کاوه', 'لیلا', 'امید', 'بهار', 'سهیل']
const LAST = ['قهوه‌گرد', 'شب‌گرد', 'تهرانی', 'کافه‌نشین', 'لاته', 'ماجراجو', 'پرسه‌زن', 'خوش‌ذوق', 'اسپرسو', 'کاشف', 'همیشه‌بیدار', 'باران', 'آفتاب', 'رهگذر', 'خیابان‌گرد', 'موکا', 'نیمه‌شب', 'سحرخیز', 'کتاب‌خوان', 'دوچرخه‌سوار', 'عکاس', 'خوش‌سفر', 'ولیعصر', 'تجریشی', 'دم‌نوش']
const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🦉', '🐙', '🦄', '🐧', '🐺', '🦋', '🐬', '🦜', '🐢', '🐝', '🦔', '🐳']
export const MOTTOS = ['قهوه خوب، حال خوب', 'هر روز یک فنجان آرامش', 'اینجا خانه دوم توست', 'دم‌آوری تازه رسید!', 'بوی قهوه تازه می‌آید', 'امروز کیک خانگی داریم', 'موسیقی زنده، پنجشنبه شب', 'جای دنج برای کار', 'صبحانه تا ظهر', 'منتظرت هستیم', 'لاته آرت رایگان امروز', 'دانه تازه از اتیوپی', 'بارون میاد، چای بچسبه', 'یک فنجان، یک گپ', 'تخفیف دانشجویی هر روز', 'شب‌های بازی فکری', 'کتاب بیاور، قهوه ببر', 'تراس باز شد']
export const ITEMS = ['لاته', 'کوکی شکلاتی', 'آفوگاتو', 'چیزکیک', 'کاپوچینو', 'کروسان کره‌ای', 'چای ماسالا', 'موکا', 'براونی', 'آیس آمریکانو', 'وافل', 'ماچا لاته', 'اسپرسو دبل', 'پنکیک', 'دمنوش بهارنارنج', 'پیتزا مارگاریتا']
const QUESTS = [['⚡', 'ساعت طلایی', 'یک کوکی رایگان'], ['🎯', 'سه بار در هفته', 'تخفیف 20 درصدی'], ['🍰', 'عصرانه دونفره', 'دسر رایگان'], ['🌙', 'شب‌نشینی', 'نوشیدنی دوم رایگان'], ['☕', 'اولین فنجان', 'اسپرسو مهمان ما'], ['🎲', 'شب بازی', 'میز رایگان بازی'], ['📚', 'کتاب و قهوه', 'نشان کتاب‌خوان'], ['🔥', 'چالش هفت روز', 'یک هفته قهوه نیم‌بها'], ['🎁', 'جایزه غافلگیری', 'هدیه سورپرایز'], ['🏆', 'مشتری ماه', 'کارت طلایی']]
const BADGES = ['کاشف محله', 'قهوه‌شناس', 'شب‌زنده‌دار', 'رفیق همیشگی', 'سحرخیز', 'ماجراجوی شهر', 'استاد لاته', 'کلکسیونر']
const MILESTONES = [5, 10, 25, 50, 100, 150, 200, 300]
const KEEPSAKES = ['☕', '🍪', '🥐', '🍰', '🧋', '🍩', '🫖', '🧁', '🍫', '🥯', '🍵', '🥤']
const CLANS = [['شب‌گردهای ولیعصر', '🦉', '#7c5cff'], ['قهوه‌بازها', '☕', '#c0703a'], ['کاشفان شهر', '🧭', '#1f9d8b'], ['تیم لاته', '🥛', '#d98a1f'], ['سحرخیزان', '🌅', '#e2574c'], ['دوچرخه‌سواران', '🚲', '#3b82c4'], ['کتاب‌خوان‌ها', '📚', '#8a6d3b'], ['پرسه‌زن‌های تجریش', '🌿', '#4c9a4c']]
const ME_CLAN = 2
const ME_BADGES = [[1, 'اولین قدم'], [3, 'کاشف محله'], [5, 'قهوه‌شناس'], [10, 'ماجراجوی شهر'], [20, 'افسانه شهر']]

export function hashOf(s) { s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } return h }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
export const nameOf = (i) => FIRST[i % FIRST.length] + ' ' + LAST[(i * 7 + (i >> 4)) % LAST.length]
const avatarOf = (i) => AVATARS[(i * 5 + (i >> 3)) % AVATARS.length]
const fa = (n) => Number(n || 0).toLocaleString('fa')

// ویترین ساختگی هر مکان — فقط از شناسه‌اش ساخته می‌شود تا همیشه همان باشد
export function decorOf(c) {
  const h = hashOf(c.id)
  const q = QUESTS[h % QUESTS.length]
  return {
    motto: MOTTOS[h % MOTTOS.length],
    item: h % 10 < 7 ? ITEMS[(h >>> 4) % ITEMS.length] : null,
    quest: h % 10 < 5 ? { id: 'demo-q-' + c.id, icon: q[0], title: q[1], reward_label: q[2], target: 1 + (h >>> 6) % 3, xp: 60 + ((h >>> 8) % 5) * 20 } : null,
    full: h % 13 === 0,
  }
}

function syntheticCafes(seed) {
  const r = mulberry32(seed ^ 0x51ed)
  const ds = ['منطقه 6', 'منطقه 3', 'منطقه 1', 'منطقه 2', 'منطقه 7', 'منطقه 11', 'منطقه 12']
  const out = []
  for (let i = 0; i < 48; i++) out.push({ id: 'dp' + i, name: 'مکان نمونه ' + (i + 1), lat: 35.7219 + (r() - 0.5) * 0.07, lng: 51.3979 + (r() - 0.5) * 0.09, district: ds[i % ds.length] })
  return out
}

function build(cfg) {
  const rng = mulberry32(cfg.seed)
  const C = cfg.cafes.length
  const W = {
    cfg, rng, C, tick: 0,
    xp: new Int32Array(N), visits: new Uint16Array(N), at: new Int16Array(N).fill(-1), leaveAt: new Int32Array(N), clan: new Int8Array(N).fill(-1),
    seen: new Uint8Array(Math.ceil(N * C / 8)), leave: [], ord: [], cum: new Float64Array(C), wSum: 0,
    cafes: [], clans: CLANS.map((c, i) => ({ id: 'clan-' + i, name: c[0], emblem: c[1], color: c[2], xp: 0, members: 0, checkins: 0 })),
    counters: { checkins: 0, badges: 0, quests: 0, questDone: 0, newVisitors: 0 },
    feed: [], evN: 0, liveEv: [], questRev: 0, silent: true, ckThisTick: 0,
    me: { baseXp: 0, name: 'تو', dxp: 0, coins: 0, newChecked: [], items: [], badges: [], q: {}, done: [] },
    snap: null,
  }
  for (let i = 0; i < 256; i++) W.leave.push([])
  cfg.cafes.forEach((c, i) => {
    const d = decorOf(c)
    const w = 0.5 + Math.pow(rng(), 2) * 3.5
    W.wSum += w; W.cum[i] = W.wSum
    const quest = c.q ? { id: c.q.id, icon: c.q.icon || '🎯', title: c.q.title, reward_label: 'جایزه کمپین', target: 1 + (hashOf(c.id) >>> 6) % 3, xp: 80 } : d.quest
    W.cafes.push({ id: c.id, name: c.name, lat: c.lat, lng: c.lng, district: c.district || 'تهران', w, present: 0, today: 0, total: Math.round(w * 420 + rng() * 240), base30: Math.round(w * 900 + rng() * 300),
      newV: 0, retV: 0, hours: new Array(24).fill(0), clanCk: new Array(CLANS.length).fill(0), clanMem: new Array(CLANS.length).fill(0),
      quest: quest ? { ...quest, joined: Math.round(rng() * 60), done: Math.round(rng() * 25) } : null })
  })
  for (let i = 0; i < N; i++) {
    W.xp[i] = 40 + Math.floor(Math.pow(rng(), 2.4) * 9000)
    W.visits[i] = Math.min(400, Math.floor(W.xp[i] / 60))
    if (rng() < 0.55) { const k = Math.floor(Math.pow(rng(), 1.5) * CLANS.length); W.clan[i] = k; W.clans[k].members++; W.clans[k].xp += W.xp[i] }
    const k = Math.min(W.visits[i], 22)
    for (let j = 0; j < k; j++) { const bit = i * C + Math.floor(rng() * C); W.seen[bit >> 3] |= 1 << (bit & 7) }
    W.ord.push(i)
  }
  W.clan[0] = ME_CLAN; W.xp[0] = 0; W.visits[0] = 0
  // از همان اول، چند صد نفر در مکان‌ها نشسته‌اند
  for (let j = 0; j < 320; j++) {
    const u = 1 + Math.floor(rng() * (N - 1)); const ci = pickCafe(W); const stay = 5 + Math.floor(rng() * 170)
    if (W.at[u] >= 0) continue
    W.at[u] = ci; W.cafes[ci].present++; W.leaveAt[u] = stay; W.leave[stay & 255].push(u)
  }
  return W
}

function pickCafe(W) {
  const x = W.rng() * W.wSum; let lo = 0, hi = W.C - 1
  while (lo < hi) { const m = (lo + hi) >> 1; if (W.cum[m] < x) lo = m + 1; else hi = m }
  return lo
}

function emit(W, ev) {
  if (W.silent) return
  ev.key = ++W.evN; ev.t = W.tick
  W.feed.unshift(ev); if (W.feed.length > FEED_MAX) W.feed.length = FEED_MAX
  W.liveEv.push(ev)
}

function doCheckin(W, u, ci, hour) {
  const c = W.cafes[ci], isMe = u === 0, rng = W.rng
  if (W.at[u] >= 0) { W.cafes[W.at[u]].present--; W.at[u] = -1 }
  const bit = u * W.C + ci, first = !(W.seen[bit >> 3] & (1 << (bit & 7)))
  W.seen[bit >> 3] |= 1 << (bit & 7)
  let gain = 50 + (first ? 30 : 0)
  W.visits[u]++
  c.present++; c.today++; c.total++; c.hours[hour]++
  if (first) { c.newV++; W.counters.newVisitors++ } else c.retV++
  const stay = 35 + Math.floor(rng() * 150)
  W.at[u] = ci; W.leaveAt[u] = W.tick + stay; W.leave[(W.tick + stay) & 255].push(u)
  W.counters.checkins++
  const name = isMe ? W.me.name : nameOf(u)
  let questDone = null
  if (c.quest) {
    const q = c.quest
    q.joined++
    const roll = rng()
    if (isMe) {
      const p = W.me.q[q.id] || (W.me.q[q.id] = { progress: 0, completed: false, code: null })
      if (!p.completed) { p.progress++; if (p.progress >= q.target) { p.completed = true; p.code = 'DEMO-' + (1000 + hashOf(q.id + ':' + W.tick) % 9000); questDone = q; W.me.done.push({ ...q, joined: undefined, done: undefined, cafe_id: c.id, cafeName: c.name, district: c.district }) } }
    } else if (roll < 0.45 / q.target) questDone = q
    if (questDone) { q.done++; gain += q.xp; W.counters.questDone++ }
  }
  let badge = null
  if (isMe) {
    W.me.coins += 5
    if (W.me.newChecked.indexOf(c.id) < 0) {
      W.me.newChecked = W.me.newChecked.concat([c.id])
      W.me.items = [{ id: 'k-' + c.id, icon: KEEPSAKES[hashOf(c.id) % KEEPSAKES.length], name: 'یادگاری ' + c.name, cafe: c.name, t: W.tick }].concat(W.me.items)
      const b = ME_BADGES.find(x => x[0] === W.me.newChecked.length)
      if (b) { badge = b[1]; W.me.badges = [{ name: b[1], t: W.tick }].concat(W.me.badges) }
    }
  } else if (MILESTONES.indexOf(W.visits[u]) >= 0) badge = BADGES[(u + W.visits[u]) % BADGES.length]
  if (badge) { gain += 100; W.counters.badges++ }
  W.xp[u] += gain
  if (isMe) W.me.dxp += gain
  const k = W.clan[u]
  if (k >= 0) { const cl = W.clans[k]; cl.xp += gain; cl.checkins++; c.clanCk[k]++; if (first) c.clanMem[k]++ }
  // در جریان رویدادها فقط دو چک‌این در هر ثانیه نوشته می‌شود؛ بقیه شمرده می‌شوند ولی صف را شلوغ نمی‌کنند
  if (isMe || W.ckThisTick < 2) { W.ckThisTick++; emit(W, { type: 'checkin', icon: isMe ? '⭐' : '📍', text: name + ' در ' + c.name + ' چک‌این کرد', tail: '+' + fa(gain) + ' XP', cafeId: c.id, me: isMe, isNew: first }) }
  else if (!W.silent) W.liveEv.push({ type: 'quiet', cafeId: c.id })
  if (questDone && (isMe || rng() < 0.5)) emit(W, { type: 'quest_done', icon: '🎁', text: name + ' کمپین «' + questDone.title + '» را در ' + c.name + ' کامل کرد', tail: '', cafeId: c.id, me: isMe })
  if (badge) emit(W, { type: 'badge', icon: '🏅', text: name + ' نشان «' + badge + '» گرفت', tail: '', cafeId: c.id, me: isMe })
  return gain
}

function step(W) {
  W.tick++; W.ckThisTick = 0
  const rng = W.rng
  const hour = new Date(W.cfg.startedAt + W.tick * TICK_MS).getHours()
  const b = W.leave[W.tick & 255]
  for (let i = 0; i < b.length; i++) { const u = b[i]; if (W.at[u] >= 0 && W.leaveAt[u] === W.tick) { W.cafes[W.at[u]].present--; W.at[u] = -1 } }
  b.length = 0
  const k = 2 + (rng() < 0.6 ? 1 : 0) + (rng() < 0.5 ? 1 : 0) + (rng() < 0.25 ? 1 : 0)
  for (let j = 0; j < k; j++) {
    const u = 1 + Math.floor(rng() * (N - 1)), ci = pickCafe(W)
    if (W.at[u] >= 0) continue
    doCheckin(W, u, ci, hour)
  }
  if (rng() < 0.03) {
    const ci = Math.floor(rng() * W.C), q = QUESTS[Math.floor(rng() * QUESTS.length)], c = W.cafes[ci]
    c.quest = { id: 'demo-q-' + c.id + '-' + W.tick, icon: q[0], title: q[1], reward_label: q[2], target: 1 + Math.floor(rng() * 3), xp: 60 + Math.floor(rng() * 5) * 20, joined: 0, done: 0 }
    W.counters.quests++; W.questRev++
    emit(W, { type: 'quest_new', icon: '🎉', text: c.name + ' کمپین «' + q[1] + '» گذاشت', tail: '', cafeId: c.id, quest: c.quest })
  }
  // خود تو هم هر 45 ثانیه یک جای تازه چک‌این می‌کنی تا بالا رفتن امتیاز، نشان و گنجینه دیده شود
  if (W.tick % 45 === 20) {
    const list = []
    for (let i = 0; i < W.C; i++) if (W.me.newChecked.indexOf(W.cafes[i].id) < 0) list.push(i)
    const ci = list.length ? list[Math.floor(rng() * list.length)] : Math.floor(rng() * W.C)
    doCheckin(W, 0, ci, hour)
  }
  const acts = W.cfg.acts
  for (let i = 0; i < acts.length; i++) if (acts[i].t === W.tick) { const ci = W.cafes.findIndex(c => c.id === acts[i].id); if (ci >= 0) doCheckin(W, 0, ci, hour) }
}

function makeSnap(W) {
  const xp = W.xp
  W.ord.sort((a, b) => (xp[b] - xp[a]) || (a - b))
  const row = (u, rank) => ({ id: 'demo-' + u, name: u === 0 ? W.me.name : nameOf(u), avatar: u === 0 ? '😎' : avatarOf(u), xp: xp[u], rank, me: u === 0, clan: W.clan[u] >= 0 ? W.clans[W.clan[u]].emblem : '' })
  const leaders = []
  for (let i = 0; i < 20; i++) leaders.push(row(W.ord[i], i + 1))
  const meRank = W.ord.indexOf(0) + 1
  const live = {}; let totalLive = 0
  for (let i = 0; i < W.C; i++) { const c = W.cafes[i]; live[c.id] = c.present; totalLive += c.present }
  const clans = W.clans.map((c, i) => ({ ...c, mine: i === ME_CLAN })).sort((a, b) => b.xp - a.xp).map((c, i) => ({ ...c, rank: i + 1 }))
  const quests = W.cafes.filter(c => c.quest).map(c => ({ ...c.quest, cafe_id: c.id, cafeName: c.name, district: c.district, my: W.me.q[c.quest.id] || null })).sort((a, b) => b.joined - a.joined)
  const hot = W.cafes.slice().sort((a, b) => b.present - a.present).slice(0, 6).map(c => ({ id: c.id, name: c.name, district: c.district, present: c.present, today: c.today }))
  const prev = W.snap && W.snap.me
  const me = { name: W.me.name, xp: xp[0], dxp: W.me.dxp, coins: W.me.coins, newChecked: W.me.newChecked, items: W.me.items, badges: W.me.badges, q: W.me.q, done: W.me.done, rank: meRank,
    clan: clans.find(c => c.mine), rankDelta: prev ? prev.rank - meRank : 0 }
  W.snap = { tick: W.tick, users: N, places: W.C, counters: { ...W.counters }, live, totalLive, feed: W.feed.slice(0, 14), leaders, meRow: row(0, meRank), me, clans, quests, hot, questRev: W.questRev, synthetic: !!W.cfg.synthetic, startedAt: W.cfg.startedAt }
}

// ── نگهداری و ساعت ──
let W = null, timer = null
const subs = new Set(), liveSubs = new Set()
const save = (cfg) => { try { sessionStorage.setItem(KEY, JSON.stringify(cfg)) } catch (e) {} }
const load = () => { try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return c && c.seed && Array.isArray(c.cafes) && c.cafes.length ? c : null } catch (e) { return null } }
const slim = (list) => list.filter(c => c && c.id != null && isFinite(c.lat) && isFinite(c.lng)).map(c => ({ id: c.id, name: c.name || 'مکان', lat: +c.lat, lng: +c.lng, district: c.district || null, q: c.active_quest ? { id: c.active_quest.id, title: c.active_quest.title, icon: c.active_quest.icon } : undefined }))
const targetTick = () => Math.floor((Date.now() - W.cfg.startedAt) / TICK_MS)

function fresh(cafes, synthetic) {
  const seed = (Math.floor(Math.random() * 0x7fffffff) || 1)
  const cfg = { seed, startedAt: Date.now(), cafes: cafes || syntheticCafes(seed), synthetic: !!synthetic, acts: [] }
  save(cfg); return cfg
}
function boot(cfg) {
  const keep = W && W.me ? { baseXp: W.me.baseXp, name: W.me.name } : null
  W = build(cfg)
  if (keep) { W.me.baseXp = keep.baseXp; W.me.name = keep.name; W.xp[0] = keep.baseXp }
  advance(true)
}
function advance(force) {
  if (!W) return
  let target = targetTick()
  if (target - W.tick > MAX_REPLAY || target < W.tick) { boot(fresh(W.cfg.cafes, W.cfg.synthetic)); return }
  if (target === W.tick && !force) return
  W.liveEv = []
  while (W.tick < target) { W.silent = target - W.tick > 14; step(W) }
  W.silent = false
  makeSnap(W)
  const evs = W.liveEv; W.liveEv = []
  subs.forEach(f => { try { f() } catch (e) {} })
  if (evs.length) liveSubs.forEach(f => { try { f(evs, W.snap) } catch (e) {} })
}

export const sim = {
  // cafes: فهرست واقعی مکان‌ها روی نقشه؛ در پنل کسب‌وکار که فهرستی در دست نیست null داده می‌شود
  start(cafes) {
    if (typeof window === 'undefined') return
    const real = cafes && cafes.length ? slim(cafes) : null
    const ids = real ? new Set(real.map(c => String(c.id))) : null
    const sameList = (cfg) => !real || (!cfg.synthetic && cfg.cafes.length === real.length && cfg.cafes.every(c => ids.has(String(c.id))))
    if (!W || !sameList(W.cfg)) {
      const stored = load()
      const ok = stored && sameList(stored) && Date.now() - stored.startedAt < MAX_REPLAY * TICK_MS && Date.now() >= stored.startedAt
      boot(ok ? stored : fresh(real, !real))
    }
    if (!timer) timer = setInterval(() => advance(false), 250)
  },
  pause() { if (timer && subs.size === 0) { clearInterval(timer); timer = null } },
  // خاموش کردن کامل: دنیا و هر چه در حافظه تب مانده پاک می‌شود
  clear() { if (timer) { clearInterval(timer); timer = null } W = null; try { sessionStorage.removeItem(KEY) } catch (e) {} subs.forEach(f => { try { f() } catch (e) {} }) },
  subscribe(f) { subs.add(f); return () => { subs.delete(f) } },
  onLive(f) { liveSubs.add(f); return () => { liveSubs.delete(f) } },
  getSnapshot() { return W ? W.snap : null },
  world() { return W },
  setMe({ xp, name }) {
    if (!W) return
    const bx = Math.max(0, Number(xp) || 0)
    if (name) W.me.name = name
    if (bx !== W.me.baseXp) { W.me.baseXp = bx; W.xp[0] = bx + W.me.dxp }
  },
  // چک‌این دستی خود کاربر در حالت نمایشی — فقط در همین دنیا ثبت می‌شود
  checkinMe(cafeId) {
    if (!W) return null
    const ci = W.cafes.findIndex(c => c.id === cafeId); if (ci < 0) return null
    advance(false)
    W.cfg.acts.push({ t: W.tick, id: cafeId }); save(W.cfg)
    W.liveEv = []; W.silent = false
    const gain = doCheckin(W, 0, ci, new Date().getHours())
    makeSnap(W)
    const evs = W.liveEv; W.liveEv = []
    subs.forEach(f => { try { f() } catch (e) {} })
    liveSubs.forEach(f => { try { f(evs, W.snap) } catch (e) {} })
    return gain
  },
}
