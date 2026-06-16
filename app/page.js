'use client'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const [cafes, setCafes] = useState([])
  const [sel, setSel] = useState(null)

  useEffect(() => {
    fetch('https://pkkdepecbzrnmejnseqg.supabase.co/rest/v1/cafes?select=*&is_active=eq.true', {
      headers: {
        'apikey': 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId',
        'Authorization': 'Bearer sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'
      }
    }).then(r => r.json()).then(setCafes)
  }, [])

  useEffect(() => {
    if (mapInst.current || !mapRef.current) return
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(css)
    const js = document.createElement('script')
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    js.onload = () => {
      const L = window.L
      const m = L.map(mapRef.current, { center: [35.7219, 51.3979], zoom: 12, zoomControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m)
      mapInst.current = m
    }
    document.head.appendChild(js)
  }, [])

  useEffect(() => {
    if (!mapInst.current || !cafes.length) return
    const interval = setInterval(() => {
      if (!window.L) return
      clearInterval(interval)
      const L = window.L
      cafes.forEach(c => {
        const color = c.is_top ? '#FFE66D' : '#FFD9B7'
        const icon = L.divIcon({
          html: `<div style="background:white;border:2.5px solid ${color};border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,.15)">☕</div>`,
          iconSize: [34, 34], iconAnchor: [17, 34], className: ''
        })
        L.marker([c.lat, c.lng], { icon })
          .on('click', () => setSel(c))
          .addTo(mapInst.current)
      })
    }, 300)
  }, [cafes])

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Vazirmatn,sans-serif', direction: 'rtl', overflow: 'hidden' }}>
      <div style={{ background: 'white', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #FFD9B7', boxShadow: '0 2px 8px rgba(0,0,0,.08)', zIndex: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#6B4226' }}>🏙️ Twin<span style={{ color: '#FF8FA3' }}>Land</span></div>
        <div style={{ fontSize: 13, color: '#A08C8C' }}>{cafes.length} کافه</div>
      </div>
      <div ref={mapRef} style={{ flex: 1 }} />
      {sel && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: 20, boxShadow: '0 -4px 20px rgba(0,0,0,.15)', zIndex: 1000 }}>
          <div style={{ width: 40, height: 4, background: '#FFD9B7', borderRadius: 99, margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#6B4226' }}>{sel.name}</div>
          <div style={{ fontSize: 13, color: '#A08C8C', marginTop: 4 }}>{sel.description}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {sel.tags?.map(t => <span key={t} style={{ background: '#FFF8F0', border: '1px solid #FFD9B7', borderRadius: 99, fontSize: 11, padding: '2px 10px', color: '#6B4226' }}>{t}</span>)}
          </d
