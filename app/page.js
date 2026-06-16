'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [cafes, setCafes] = useState([])

  useEffect(() => {
    fetch('https://pkkdepecbzrnmejnseqg.supabase.co/rest/v1/cafes?select=*', {
      headers: {
        'apikey': 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId',
        'Authorization': 'Bearer sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'
      }
    }).then(r => r.json()).then(data => setCafes(Array.isArray(data) ? data : []))
  }, [])

  const params = cafes.map(c => `marker=${c.lat}%2C${c.lng}`).join('&')
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=51.15%2C35.57%2C51.62%2C35.82&layer=mapnik${cafes.length ? '&' + params : ''}`

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', fontFamily:'sans-serif', direction:'rtl', background:'#FFF8F0' }}>
      <div style={{ background:'white', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'2px solid #FFD9B7', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#6B4226' }}>🏙️ Twin<span style={{ color:'#FF8FA3' }}>Land</span></div>
        <div style={{ fontSize:13, color:'#A08C8C' }}>{cafes.length > 0 ? `${cafes.length} کافه` : 'در حال بارگذاری...'}</div>
      </div>
      <iframe src={mapSrc} style={{ flex:1, border:'none' }} />
      <div style={{ background:'white', borderTop:'2px solid #FFD9B7', display:'flex', justifyContent:'space-around', padding:'10px 0' }}>
        {[['🗺','نقشه'],['📋','ماموریت'],['🛡','کلن'],['🏆','رتبه']].map(([icon,lbl]) => (
          <div key={lbl} style={{ display:'flex', flexDirection:'column', alignItems:'center', fontSize:10, color:'#A08C8C', gap:2 }}>
            <span style={{ fontSize:22 }}>{icon}</span>{lbl}
          </div>
        ))}
      </div>
    </div>
  )
}
