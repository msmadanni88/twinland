export const metadata = {
  title: 'TwinLand',
  description: 'کشف کافه‌های تهران',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
