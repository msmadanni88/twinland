export const metadata = {
  title: 'TwinLand',
  description: 'کشف کافه‌های تهران',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
                   }
