export default function Home() {
  return (
    <div style={{
      height: '100dvh',
      background: '#FFF8F0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      direction: 'rtl'
    }}>
      <div style={{
        background: 'white',
        padding: '12px 16px',
        borderBottom: '2px solid #FFD9B7',
        fontSize: 18,
        fontWeight: 700,
        color: '#6B4226'
      }}>
        🏙️ TwinLand نقشه ☕
      </div>
      <iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox=51.15%2C35.57%2C51.62%2C35.82&layer=mapnik"
        style={{ flex: 1, border: 'none' }}
      />
    </div>
  )
}
