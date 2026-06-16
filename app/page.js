الان همه متن رو پاک کن و این کد رو جاش بذار:

```js
'use client'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cafes')
      .then(r => r.json())
      .then(data => { setCafes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    s.onload = () => {
      const L = window.L
      const m = L.map(mapRef.current, {
        center: [35.7219, 51.3979], zoom: 12, zoomControl: false
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(m)
      mapInst.current = m
    }
    document.head.appendChild(s)
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(l)
  }, [])

  useEffect(() => {
    if (!mapInst.current || !cafes.length) return
    const L = window.L
    cafes.forEach(c => {
      const icon = L.divIcon({
        html: `<div style="background:white;border:2.5px solid #FFD9B7;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.15)">☕</div>`,
        iconSize: [32, 32], iconAnchor: [16, 32], className: ''
      })
      L.marker([c.lat, c.lng], { icon })
        .bindPopup(`<b>${c.name}</b><br>${c.description || ''}`)
        .addTo(mapInst.current)
    })
  }, [cafes])

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ background: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #FFD9B7', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#6B4226' }}>
          🏙️ Twin<span style={{ color: '#FF8FA3' }}>Land</span>
        </div>
        <div style={{ fontSize: 13, color: '#A08C8C' }}>
          {loading ? 'در حال بارگذاری...' : `${cafes.length} کافه`}
        </div>
      </div>
      <div ref={mapRef} style={{ flex: 1 }} />
    </div>
  )
}
```

بعد **Commit changes** بزن ✅
