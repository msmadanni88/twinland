import { Analytics } from '@vercel/analytics/react'

export const metadata = {
  title: 'TwinLand',
  description: 'کشف کافه‌های تهران',
}

// Global CSS is injected as raw HTML on purpose. Passing it as a text child
// (<style>{`...`}</style>) makes the server escape ' and & into &#x27; / &amp;,
// which the browser does NOT decode inside <style>. That broke the font rule on
// first paint and caused React hydration errors #418/#425/#423 on every page.
const GLOBAL_CSS = `
  :root{
    /* پالت C — Steel & Sky */
    --t-title:#1E293B;
    --t-body:#64748B;
    --t-accent:#0284C7;
    --d-title:#F8FAFC;
    --d-body:#94A3B8;
    --d-accent:#38BDF8;
  }
  *{font-family:'Estedad','Vazirmatn',Tahoma,sans-serif !important}
  body{margin:0}
`

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Estedad:wght@400;500;600;700;800;900&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  )
}
