// Formatting helpers.

// «۵ دقیقه پیش» style relative time in Persian.
export function faAgo(iso){
  const mins=Math.floor((Date.now()-new Date(iso).getTime())/60000)
  if(mins<1) return 'همین الان'
  if(mins<60) return mins.toLocaleString('fa')+' دقیقه پیش'
  const hrs=Math.floor(mins/60)
  if(hrs<24) return hrs.toLocaleString('fa')+' ساعت پیش'
  return Math.floor(hrs/24).toLocaleString('fa')+' روز پیش'
}
