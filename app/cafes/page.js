// فهرست همه کافه‌های فعال، دسته‌بندی‌شده بر اساس منطقه. برای گوگل و برای گشتن بدون نقشه.
import { PUBLIC_CSS } from '@/lib/public/publicCss'
import { SITE, allActiveCafes, cafeTitle, districtLabel, faDigits } from '@/lib/public/sbServer'

export const revalidate = 21600

export const metadata = {
  title: 'کافه‌های تهران بر اساس منطقه',
  description: 'فهرست کافه‌های تهران روی نقشه بازی‌وار TwinLand، منطقه به منطقه: نشانی، ساعت کار، رویدادها و نظر مردم.',
  alternates: { canonical: SITE + '/cafes' },
}

function districtOrder(d) {
  const m = String(d || '').match(/\d+/)
  return m ? Number(m[0]) : 999
}

export default async function CafesPage() {
  // این صفحه فهرست کافه‌هاست؛ نوع‌های تازه v5.0 صفحه خودشان را دارند ولی این‌جا نمی‌آیند
  const cafes = (await allActiveCafes('id,name,branch,district,tier,category')).filter(c => !c.category || c.category === 'cafe' || c.category === 'restaurant')
  const groups = new Map()
  for (const c of cafes) {
    const k = c.district || 'بدون منطقه'
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(c)
  }
  const keys = [...groups.keys()].sort((a, b) => districtOrder(a) - districtOrder(b) || a.localeCompare(b, 'fa'))
  return (
    <div className="pub">
      <style dangerouslySetInnerHTML={{ __html: PUBLIC_CSS }} />
      <header className="top">
        <a href="/" className="brand"><img src="/icons/icon-192.png" alt="" width="34" height="34" /><span>TwinLand</span></a>
        <a href="/" className="btn small">باز کردن نقشه</a>
      </header>
      <main className="wrap">
        <section className="card hero">
          <h1>کافه‌های تهران</h1>
          <p className="lead">{faDigits(cafes.length.toLocaleString('en'))} کافه در {faDigits(keys.length)} منطقه. روی هر کافه بزن تا نشانی، ساعت کار، رویدادها و نظر مردم را ببینی.</p>
        </section>
        <nav className="jump" aria-label="منطقه‌ها">
          {keys.map(k => <a key={k} href={'#d-' + encodeURIComponent(k)} className="pill">{districtLabel(k)}</a>)}
        </nav>
        {keys.map(k => (
          <section key={k} id={'d-' + encodeURIComponent(k)} className="card dist">
            <h2>{districtLabel(k)} <small>{faDigits(groups.get(k).length)} کافه</small></h2>
            <div className="near">
              {groups.get(k).map(c => <a key={c.id} href={'/cafe/' + c.id} className="pill">{cafeTitle(c)}</a>)}
            </div>
          </section>
        ))}
      </main>
      <footer className="foot"><a href="/">TwinLand</a> · نقشه بازی‌وار کشف شهر و کافه‌های تهران</footer>
    </div>
  )
}
