// صفحه عمومی هر کافه، برای گوگل و برای کسی که پیوند کافه را از دوستش گرفته.
// سمت سرور ساخته می‌شود و هر یک ساعت تازه می‌شود. بدون ورود باز می‌شود و فقط داده عمومی دارد:
// نشانی، ساعت کار، راه‌های تماس، امتیاز ستاره، رویدادهای فعال، منو، عکس، نظرها با جواب کافه
// و کافه‌های همان منطقه. دکمه اصلی همان کافه را روی نقشه TwinLand باز می‌کند.
import { notFound } from 'next/navigation'
import { photoUrl } from '@/lib/cafeContent'
import { SITE, UUID_RE, cafeTitle, districtLabel, faDigits, instagramUrl, sbGet, sbRpc, telHref, websiteUrl } from '@/lib/public/sbServer'
import { PUBLIC_CSS } from '@/lib/public/publicCss'

export const revalidate = 3600

const SELECT = 'id,name,branch,brand,district,address,phone,website,instagram,opening_hours,motto,description,lat,lng,tier,category,cuisine,neshan_url,google_url,balad_url,logo_url,is_full'

async function getCafe(id) {
  if (!UUID_RE.test(id)) return null
  const rows = await sbGet('cafes?id=eq.' + id + '&is_active=eq.true&select=' + SELECT + '&limit=1')
  return Array.isArray(rows) && rows[0] ? rows[0] : null
}

function summary(c) {
  const where = [districtLabel(c.district), 'تهران'].filter(Boolean).join('، ')
  const lead = c.motto || c.description
  return (lead ? lead + ' · ' : '') + cafeTitle(c) + ' در ' + where + ': نشانی، ساعت کار، رویدادها و تخفیف‌های فعال و نظر مردم در TwinLand.'
}

export async function generateMetadata({ params }) {
  const c = await getCafe(params.id)
  if (!c) return { title: 'کافه پیدا نشد', robots: { index: false } }
  const title = cafeTitle(c) + ' · ' + districtLabel(c.district || 'تهران')
  const description = summary(c).slice(0, 300)
  const url = SITE + '/cafe/' + c.id
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', locale: 'fa_IR', siteName: 'TwinLand', images: c.logo_url ? [c.logo_url] : ['/icons/icon-512.png'] },
    twitter: { card: 'summary', title, description },
  }
}

function hoursForSchema(v) {
  // فقط قالب استاندارد OpenStreetMap مثل Mo-Su 08:00-23:00 در داده ساختاریافته می‌آید
  return v && /^(Mo|Tu|We|Th|Fr|Sa|Su)[a-zA-Z ,\-:0-9;]+$/.test(v) ? v : undefined
}

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 3600) return 'کمتر از یک ساعت پیش'
  if (s < 86400) return faDigits(Math.round(s / 3600)) + ' ساعت پیش'
  if (s < 86400 * 30) return faDigits(Math.round(s / 86400)) + ' روز پیش'
  return faDigits(Math.round(s / 86400 / 30)) + ' ماه پیش'
}

function daysLeft(iso) {
  if (!iso) return null
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400e3)
  return d <= 0 ? 'امروز تمام می‌شود' : faDigits(d) + ' روز مانده'
}

const Stars = ({ v }) => {
  const n = Math.round(Number(v) || 0)
  return <span className="stars" aria-hidden="true">{'★★★★★'.slice(0, n)}<span className="off">{'★★★★★'.slice(n)}</span></span>
}

export default async function CafePage({ params }) {
  const c = await getCafe(params.id)
  if (!c) notFound()
  const now = new Date().toISOString()
  const [rating, comments, quests, menu, photos, nearby] = await Promise.all([
    sbRpc('cafe_rating', { p_cafe_id: c.id }),
    sbRpc('cafe_comments_feed', { p_cafe: c.id, p_limit: 6, p_offset: 0 }),
    sbGet('quests?cafe_id=eq.' + c.id + '&active=eq.true&starts_at=lte.' + encodeURIComponent(now) + '&or=(ends_at.is.null,ends_at.gt.' + encodeURIComponent(now) + ')&select=id,title,description,reward_label,discount_pct,ends_at,icon&order=created_at.desc&limit=6', 600),
    sbGet('cafe_menu_items?cafe_id=eq.' + c.id + '&is_available=eq.true&select=id,section,name,description,price_toman&order=sort.asc&limit=12'),
    sbGet('cafe_photos?cafe_id=eq.' + c.id + '&select=id,storage_path,caption&order=sort.asc&limit=6'),
    c.district ? sbGet('cafes?district=eq.' + encodeURIComponent(c.district) + '&is_active=eq.true&id=neq.' + c.id + '&select=id,name,branch,tier&order=is_top.desc,name.asc&limit=8', 21600) : null,
  ])
  const rate = rating && rating.ok ? rating : null
  const title = cafeTitle(c)
  const insta = instagramUrl(c.instagram) || (c.website && /instagram\.com/i.test(c.website) ? c.website : null)
  const site = c.website && !/instagram\.com/i.test(c.website) ? websiteUrl(c.website) : null
  const tel = telHref(c.phone)
  const google = c.google_url || (c.lat && c.lng ? 'https://www.google.com/maps/search/?api=1&query=' + c.lat + ',' + c.lng : null)
  const openInApp = '/?cafe=' + c.id

  const ld = {
    '@context': 'https://schema.org',
    '@type': c.category === 'restaurant' ? 'Restaurant' : 'CafeOrCoffeeShop',
    name: title,
    url: SITE + '/cafe/' + c.id,
    image: c.logo_url || undefined,
    description: c.motto || c.description || undefined,
    telephone: c.phone || undefined,
    servesCuisine: c.cuisine || undefined,
    address: { '@type': 'PostalAddress', streetAddress: c.address || undefined, addressLocality: 'تهران', addressRegion: 'تهران', addressCountry: 'IR' },
    geo: c.lat && c.lng ? { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng } : undefined,
    openingHours: hoursForSchema(c.opening_hours),
    sameAs: [insta, site].filter(Boolean),
    aggregateRating: rate && rate.count >= 3 ? { '@type': 'AggregateRating', ratingValue: rate.avg, ratingCount: rate.count, bestRating: 5, worstRating: 1 } : undefined,
  }
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'TwinLand', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'کافه‌های تهران', item: SITE + '/cafes' },
      { '@type': 'ListItem', position: 3, name: title, item: SITE + '/cafe/' + c.id },
    ],
  }

  return (
    <div className="pub">
      <style dangerouslySetInnerHTML={{ __html: PUBLIC_CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, '\\u003c') }} />

      <header className="top">
        <a href="/" className="brand"><img src="/icons/icon-192.png" alt="" width="34" height="34" /><span>TwinLand</span></a>
        <a href={openInApp} className="btn small">باز کردن نقشه</a>
      </header>

      <main className="wrap">
        <nav className="crumbs" aria-label="مسیر">
          <a href="/">TwinLand</a><span>›</span><a href="/cafes">کافه‌های تهران</a>{c.district && <><span>›</span><a href={'/cafes#d-' + encodeURIComponent(c.district)}>{districtLabel(c.district)}</a></>}
        </nav>

        <section className="hero card">
          <div className="hero-row">
            <div className="logo">{c.logo_url ? <img src={c.logo_url} alt="" width="64" height="64" /> : <span>☕</span>}</div>
            <div className="hero-text">
              <h1>{title}</h1>
              <div className="meta">
                {c.district && <span className="chip">{districtLabel(c.district)}</span>}
                {c.tier === 'featured' && <span className="chip gold">منتخب TwinLand</span>}
                {c.is_full && <span className="chip warn">الان پر است</span>}
                {rate && rate.count > 0 && <span className="chip"><Stars v={rate.avg} /> {faDigits(rate.avg)} از {faDigits(rate.count)} نظر</span>}
              </div>
            </div>
          </div>
          {(c.motto || c.description) && <p className="motto">{c.motto || c.description}</p>}
          <a href={openInApp} className="btn wide">باز کردن روی نقشه TwinLand و چک‌این</a>
          <p className="hint">با چک‌این در همین کافه امتیاز، آیتم کلکسیونی و جایزه واقعی می‌گیری.</p>
        </section>

        <section className="card">
          <h2>اطلاعات</h2>
          <ul className="info">
            {c.address && <li><b>نشانی</b><span>{faDigits(c.address)}</span></li>}
            {c.opening_hours && <li><b>ساعت کار</b><span dir="auto">{faDigits(c.opening_hours)}</span></li>}
            {c.phone && <li><b>تلفن</b>{tel ? <a href={tel} dir="ltr">{c.phone}</a> : <span dir="ltr">{c.phone}</span>}</li>}
            {c.cuisine && <li><b>منو</b><span>{c.cuisine}</span></li>}
          </ul>
          <div className="links">
            {insta && <a href={insta} rel="nofollow noopener" target="_blank" className="pill">اینستاگرام</a>}
            {site && <a href={site} rel="nofollow noopener" target="_blank" className="pill">وب‌سایت</a>}
            {c.neshan_url && <a href={c.neshan_url} rel="nofollow noopener" target="_blank" className="pill">مسیر در نشان</a>}
            {c.balad_url && <a href={c.balad_url} rel="nofollow noopener" target="_blank" className="pill">مسیر در بلد</a>}
            {google && <a href={google} rel="nofollow noopener" target="_blank" className="pill">نقشه گوگل</a>}
          </div>
        </section>

        {Array.isArray(quests) && quests.length > 0 && (
          <section className="card">
            <h2>رویدادها و تخفیف‌های فعال</h2>
            <div className="quests">
              {quests.map(q => (
                <div key={q.id} className="quest">
                  <div className="q-ic">{q.icon && q.icon.length <= 4 ? q.icon : '🎯'}</div>
                  <div className="q-body">
                    <div className="q-title">{q.title}</div>
                    {q.reward_label && <div className="q-sub">جایزه: {q.reward_label}</div>}
                    <div className="q-tags">
                      {q.discount_pct > 0 && <span className="chip gold">{faDigits(q.discount_pct)} درصد تخفیف</span>}
                      {q.ends_at && <span className="chip">{daysLeft(q.ends_at)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <a href={openInApp} className="btn ghost">شرکت در رویداد روی نقشه</a>
          </section>
        )}

        {Array.isArray(photos) && photos.length > 0 && (
          <section className="card">
            <h2>عکس‌ها</h2>
            <div className="photos">
              {photos.map(p => <img key={p.id} src={photoUrl(p.storage_path)} alt={p.caption || title} loading="lazy" />)}
            </div>
          </section>
        )}

        {Array.isArray(menu) && menu.length > 0 && (
          <section className="card">
            <h2>از منو</h2>
            <ul className="menu">
              {menu.map(m => (
                <li key={m.id}><span className="m-name">{m.name}</span>{m.price_toman > 0 && <span className="m-price">{Number(m.price_toman).toLocaleString('fa')} تومان</span>}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="card">
          <h2>نظر مردم</h2>
          {(!Array.isArray(comments) || comments.length === 0) && <p className="muted">هنوز کسی درباره این کافه نظر نداده. اولین نفر باش.</p>}
          {Array.isArray(comments) && comments.map(r => (
            <article key={r.id} className="cm">
              <div className="cm-head"><span className="av">{r.avatar && r.avatar.length <= 4 ? r.avatar : '☕'}</span><b>{r.name}</b>{r.visited && <span className="chip ok">اینجا بوده</span>}<span className="muted small">{ago(r.created_at)}</span></div>
              <p>{r.body}</p>
              {r.reply_body && <div className="reply"><b>پاسخ {title}</b><p>{r.reply_body}</p></div>}
            </article>
          ))}
          <a href={openInApp} className="btn ghost">نوشتن نظر در TwinLand</a>
        </section>

        {Array.isArray(nearby) && nearby.length > 0 && (
          <section className="card">
            <h2>کافه‌های دیگر {districtLabel(c.district)}</h2>
            <div className="near">
              {nearby.map(n => <a key={n.id} href={'/cafe/' + n.id} className="pill">{cafeTitle(n)}</a>)}
            </div>
          </section>
        )}
      </main>

      <footer className="foot">
        <a href="/">TwinLand</a> · نقشه بازی‌وار کشف شهر و کافه‌های تهران · <a href="/cafes">همه کافه‌ها</a>
      </footer>
    </div>
  )
}
