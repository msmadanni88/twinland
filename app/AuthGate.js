'use client'
import { useState, useEffect } from 'react'

const SB_URL = 'https://pkkdepecbzrnmejnseqg.supabase.co'
const SB_KEY = 'sb_publishable_g2Qy4sXwgvYPchIU3aB4ew_JTvP1PId'

// --- Supabase Auth (GoTrue) REST helper ---
async function gotrue(path, body){
  try{
    const r = await fetch(SB_URL+'/auth/v1/'+path,{
      method:'POST',
      headers:{'apikey':SB_KEY,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    })
    const data = await r.json().catch(()=>({}))
    return { ok:r.ok, status:r.status, data }
  }catch(e){
    return { ok:false, status:0, data:{ error_description:'network' } }
  }
}

function saveSession(d){
  const s = {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: Date.now() + ((d.expires_in||3600)*1000),
    user: d.user || null,
  }
  try{ localStorage.setItem('tl_session', JSON.stringify(s)) }catch(e){}
  return s
}

function faErr(msg){
  const m = String(msg||'').toLowerCase()
  if(m==='network') return 'اتصال برقرار نشد. اینترنتت رو چک کن'
  if(m.includes('invalid login')) return 'ایمیل یا رمز اشتباهه'
  if(m.includes('already') && m.includes('regist')) return 'این ایمیل قبلاً ثبت شده — وارد شو'
  if(m.includes('email not confirmed')) return 'ایمیلت هنوز تأیید نشده؛ صندوق ورودیت رو چک کن'
  if(m.includes('password') && m.includes('6')) return 'رمز باید حداقل ۶ کاراکتر باشه'
  if(m.includes('rate limit') || m.includes('too many')) return 'تلاش زیاد شد، چند دقیقه بعد امتحان کن'
  if(m.includes('invalid email') || m.includes('unable to validate email')) return 'ایمیل معتبر نیست'
  return msg ? 'خطا: '+msg : 'یه مشکلی پیش اومد، دوباره امتحان کن'
}

const KEYFRAMES = `
@keyframes tlPop{0%{transform:scale(.4) translateY(34px);opacity:0}60%{transform:scale(1.08) translateY(0);opacity:1}100%{transform:scale(1)}}
@keyframes tlUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes tlBlob{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(34px,-26px) scale(1.18)}}
@keyframes tlFloat{0%{transform:translateY(30px) rotate(0);opacity:0}12%{opacity:.55}88%{opacity:.55}100%{transform:translateY(-115vh) rotate(40deg);opacity:0}}
@keyframes tlFill{from{width:0}to{width:100%}}
@keyframes tlSpin{to{transform:rotate(360deg)}}
.tl-in{animation:tlUp .5s both}
.tl-cta:active{transform:scale(.96)}
.tl-inp:focus{border-color:#22d3ee !important;background:rgba(255,255,255,.08) !important}
`

const FLOATERS = ['☕','💎','🔮','📍','⭐','🪙','☕','💎']

export default function AuthGate({ onAuthed }){
  const [view,setView] = useState('welcome') // welcome | auth
  const [tab,setTab]   = useState('email')   // email | phone
  const [mode,setMode] = useState('login')   // login | signup | forgot
  const [email,setEmail] = useState('')
  const [pass,setPass]   = useState('')
  const [name,setName]   = useState('')
  const [busy,setBusy]   = useState(false)
  const [msg,setMsg]     = useState(null)    // {type:'err'|'ok', text}

  useEffect(()=>{
    if(view!=='welcome') return
    const t = setTimeout(()=>setView('auth'), 2600)
    return ()=>clearTimeout(t)
  },[view])

  const reset = ()=>setMsg(null)

  async function doLogin(){
    if(!email||!pass){ setMsg({type:'err',text:'ایمیل و رمز رو وارد کن'}); return }
    setBusy(true); reset()
    const { ok, data } = await gotrue('token?grant_type=password',{ email:email.trim(), password:pass })
    setBusy(false)
    if(ok && data.access_token) onAuthed(saveSession(data))
    else setMsg({type:'err',text:faErr(data.error_description||data.msg||data.error)})
  }
  async function doSignup(){
    if(!email||!pass){ setMsg({type:'err',text:'ایمیل و رمز رو وارد کن'}); return }
    if(pass.length<6){ setMsg({type:'err',text:'رمز حداقل ۶ کاراکتر باشه'}); return }
    setBusy(true); reset()
    const { ok, data } = await gotrue('signup',{ email:email.trim(), password:pass, data:{ display_name:(name.trim()||email.split('@')[0]) } })
    setBusy(false)
    if(ok && data.access_token) onAuthed(saveSession(data))
    else if(ok && data.user && !data.access_token){ setMsg({type:'ok',text:'ثبت‌نام شد! لینک تأیید به ایمیلت رفت — بعد از تأیید وارد شو'}); setMode('login') }
    else setMsg({type:'err',text:faErr(data.error_description||data.msg||data.error)})
  }
  async function doForgot(){
    if(!email){ setMsg({type:'err',text:'اول ایمیلت رو وارد کن'}); return }
    setBusy(true); reset()
    const { ok, data } = await gotrue('recover',{ email:email.trim() })
    setBusy(false)
    if(ok) setMsg({type:'ok',text:'لینک بازیابی رمز به ایمیلت فرستاده شد 📧'})
    else setMsg({type:'err',text:faErr(data.error_description||data.msg||data.error)})
  }

  const submit = ()=>{ if(mode==='login') doLogin(); else if(mode==='signup') doSignup(); else doForgot() }

  // ---- styles ----
  const S = {
    root:{position:'fixed',inset:0,zIndex:9999,overflow:'hidden',background:'linear-gradient(160deg,#0b0714 0%,#140a24 45%,#0a0f1e 100%)',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',direction:'rtl',color:'#f1ecff'},
    blob:(c,x,y,s)=>({position:'absolute',width:s,height:s,left:x,top:y,borderRadius:'50%',background:c,filter:'blur(70px)',opacity:.55,animation:'tlBlob 9s ease-in-out infinite'}),
    card:{position:'relative',zIndex:3,width:'min(380px,90vw)',background:'rgba(18,12,32,.72)',backdropFilter:'blur(22px)',WebkitBackdropFilter:'blur(22px)',border:'1px solid rgba(255,255,255,.10)',borderRadius:24,padding:'26px 22px 24px',boxShadow:'0 24px 60px rgba(0,0,0,.5)'},
    tabWrap:{display:'flex',gap:6,background:'rgba(255,255,255,.05)',borderRadius:14,padding:5,marginBottom:18},
    tabBtn:(on)=>({flex:1,border:'none',borderRadius:10,padding:'9px 0',fontSize:13,fontWeight:800,fontFamily:'inherit',cursor:'pointer',color:on?'#0b0714':'#b7aede',background:on?'linear-gradient(135deg,#ff3dd4,#22d3ee)':'transparent',transition:'all .2s'}),
    label:{fontSize:12,color:'#9a91b8',margin:'0 4px 6px',fontWeight:700},
    inp:{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,.05)',border:'1.5px solid rgba(255,255,255,.10)',borderRadius:13,padding:'13px 15px',fontSize:14,color:'#f1ecff',fontFamily:'inherit',outline:'none',marginBottom:12,transition:'all .2s'},
    cta:{width:'100%',border:'none',borderRadius:14,padding:'14px 0',fontSize:15,fontWeight:900,fontFamily:'inherit',color:'#0b0714',cursor:'pointer',background:'linear-gradient(135deg,#ff3dd4,#7c3aed,#22d3ee)',boxShadow:'0 8px 24px rgba(124,58,237,.35)',transition:'transform .12s',opacity:busy?.7:1},
    link:{background:'none',border:'none',color:'#22d3ee',fontSize:12.5,fontFamily:'inherit',cursor:'pointer',fontWeight:700,padding:4},
    spinner:{display:'inline-block',width:16,height:16,border:'2.5px solid rgba(11,7,20,.35)',borderTopColor:'#0b0714',borderRadius:'50%',animation:'tlSpin .7s linear infinite',verticalAlign:'-3px'},
  }

  return (
    <div style={S.root}>
      <style>{KEYFRAMES}</style>
      <div style={S.blob('radial-gradient(circle,#ff3dd4,transparent)','-60px','-40px','260px')}/>
      <div style={S.blob('radial-gradient(circle,#22d3ee,transparent)','65%','55%','300px')}/>
      <div style={S.blob('radial-gradient(circle,#7c3aed,transparent)','20%','70%','240px')}/>

      {/* floating game emojis */}
      {FLOATERS.map((e,i)=>(
        <span key={i} style={{position:'absolute',bottom:-40,left:(8+i*12)+'%',fontSize:20+(i%3)*8,opacity:0,animation:`tlFloat ${7+i%4}s linear ${i*0.7}s infinite`,pointerEvents:'none',zIndex:1}}>{e}</span>
      ))}

      {view==='welcome' ? (
        <div style={{position:'relative',zIndex:3,textAlign:'center',padding:20}}>
          <img src="/twinland_logo.webp" alt="TwinLand" style={{width:'min(300px,78vw)',filter:'drop-shadow(0 12px 30px rgba(0,0,0,.5))',animation:'tlPop .8s cubic-bezier(.34,1.5,.5,1) both'}}/>
          <div style={{fontSize:20,fontWeight:900,marginTop:14,animation:'tlUp .6s .35s both'}}>به توین‌لند خوش اومدی 👋</div>
          <div style={{fontSize:13.5,color:'#b7aede',marginTop:8,animation:'tlUp .6s .5s both'}}>شهرت رو کشف کن، کافه‌ها رو فتح کن ✨</div>
          <button className="tl-cta" onClick={()=>setView('auth')} style={{...S.cta,width:'auto',padding:'12px 30px',marginTop:22,animation:'tlUp .6s .65s both'}}>بزن بریم ✨</button>
          <div style={{width:150,height:4,background:'rgba(255,255,255,.1)',borderRadius:99,margin:'22px auto 0',overflow:'hidden'}}>
            <div style={{height:'100%',background:'linear-gradient(90deg,#ff3dd4,#22d3ee)',borderRadius:99,animation:'tlFill 2.6s linear both'}}/>
          </div>
        </div>
      ) : (
        <div className="tl-in" style={S.card}>
          <div style={{textAlign:'center',marginBottom:16}}>
            <img src="/twinland_logo.webp" alt="TwinLand" style={{width:130,filter:'drop-shadow(0 6px 16px rgba(0,0,0,.4))'}}/>
            <div style={{fontSize:15,fontWeight:800,marginTop:6,color:'#f1ecff'}}>{mode==='signup'?'ساخت حساب':mode==='forgot'?'بازیابی رمز':'ورود به حساب'}</div>
          </div>

          <div style={S.tabWrap}>
            <button style={S.tabBtn(tab==='email')} onClick={()=>{setTab('email');reset()}}>📧 ایمیل</button>
            <button style={S.tabBtn(tab==='phone')} onClick={()=>{setTab('phone');reset()}}>📱 موبایل</button>
          </div>

          {tab==='phone' ? (
            <div style={{textAlign:'center',padding:'14px 6px'}}>
              <div style={{fontSize:34,marginBottom:8}}>🚧</div>
              <div style={{fontSize:14,fontWeight:800,marginBottom:6}}>ورود با شماره — به‌زودی</div>
              <div style={{fontSize:12.5,color:'#9a91b8',lineHeight:1.9}}>ارسال کد پیامکی با پنل پیامک ایرانی به‌زودی فعال می‌شه. فعلاً با ایمیل وارد شو.</div>
              <button style={{...S.link,marginTop:12,fontSize:13}} onClick={()=>{setTab('email');reset()}}>→ ورود با ایمیل</button>
            </div>
          ) : (
            <div>
              {mode==='signup' && (<>
                <div style={S.label}>نام نمایشی</div>
                <input className="tl-inp" style={S.inp} value={name} onChange={e=>setName(e.target.value)} placeholder="مثلاً دانی"/>
              </>)}

              <div style={S.label}>ایمیل</div>
              <input className="tl-inp" style={S.inp} type="email" inputMode="email" dir="ltr" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"/>

              {mode!=='forgot' && (<>
                <div style={S.label}>رمز عبور</div>
                <input className="tl-inp" style={S.inp} type="password" dir="ltr" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit()}} placeholder="••••••••"/>
              </>)}

              {msg && (
                <div style={{fontSize:12.5,fontWeight:700,padding:'9px 12px',borderRadius:10,marginBottom:12,textAlign:'center',color:msg.type==='ok'?'#34d399':'#fb7185',background:msg.type==='ok'?'rgba(52,211,153,.12)':'rgba(251,113,133,.12)',border:'1px solid '+(msg.type==='ok'?'rgba(52,211,153,.3)':'rgba(251,113,133,.3)')}}>{msg.text}</div>
              )}

              <button className="tl-cta" style={S.cta} disabled={busy} onClick={submit}>
                {busy ? <span style={S.spinner}/> : (mode==='signup'?'ثبت‌نام':mode==='forgot'?'ارسال لینک بازیابی':'ورود')}
              </button>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                {mode==='login' ? (
                  <>
                    <button style={S.link} onClick={()=>{setMode('signup');reset()}}>ساخت حساب جدید</button>
                    <button style={S.link} onClick={()=>{setMode('forgot');reset()}}>فراموشی رمز؟</button>
                  </>
                ) : (
                  <button style={S.link} onClick={()=>{setMode('login');reset()}}>→ برگشت به ورود</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
