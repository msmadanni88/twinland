// Geometry helpers for the map: district-name digits and point-in-polygon tests
// against Leaflet boundary layers. Pure functions, no React.

// تبدیل ارقام فارسی/عربی به لاتین و استخراج فقط عددها (برای تطبیق نام منطقه)
export function digitsOnly(s){
  if(!s) return ''
  const map={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'}
  return String(s).replace(/[۰-۹٠-٩]/g,d=>map[d]||d).replace(/[^0-9]/g,'')
}

// نقطه داخل چندضلعی؟ (ray-casting). ring آرایه‌ای از [lng,lat] یا {lat,lng}
function pointInRing(lat,lng,ring){
  let inside=false
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const yi=ring[i].lat, xi=ring[i].lng, yj=ring[j].lat, xj=ring[j].lng
    const intersect=((yi>lat)!==(yj>lat)) && (lng < (xj-xi)*(lat-yi)/(yj-yi)+xi)
    if(intersect) inside=!inside
  }
  return inside
}

// کافه داخل یک لایه‌ی Leaflet (polygon/multipolygon)؟
export function cafeInLayer(lat,lng,lyr){
  try{
    const gj=lyr.toGeoJSON()
    const geom=gj.geometry
    const polys = geom.type==='Polygon' ? [geom.coordinates] : geom.type==='MultiPolygon' ? geom.coordinates : []
    for(const poly of polys){
      const outer=poly[0].map(c=>({lng:c[0],lat:c[1]}))
      if(pointInRing(lat,lng,outer)) return true
    }
  }catch(e){}
  return false
}
