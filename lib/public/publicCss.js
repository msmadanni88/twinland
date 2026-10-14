// ظاهر مشترک صفحه‌های عمومی: صفحه هر کافه و فهرست کافه‌ها. روشن و تاریک با تنظیم دستگاه.
export const PUBLIC_CSS = `
.pub{--bg:#f6f4ef;--card:#ffffff;--text:#1d2433;--sub:#667085;--line:#e7e2d8;--accent:#0f766e;--accent2:#14b8a6;--gold:#b7791f;--goldbg:#fdf3dc;--okbg:#e7f6ee;--ok:#15803d;--warnbg:#fde8e8;--warn:#b42318;--onaccent:#ffffff;
  min-height:100vh;background:var(--bg);color:var(--text);direction:rtl;font-size:15px;line-height:1.9}
@media (prefers-color-scheme:dark){.pub{--bg:#0f1222;--card:#171b31;--text:#f3f4f8;--sub:#9aa3b8;--line:#262b47;--accent:#2dd4bf;--accent2:#5eead4;--gold:#f6c867;--goldbg:#3a2f14;--okbg:#12301f;--ok:#4ade80;--warnbg:#3a1616;--warn:#fca5a5;--onaccent:#04201c}}
.pub *{box-sizing:border-box}
.pub a{color:var(--accent);text-decoration:none}
.pub .top{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.pub .brand{display:flex;align-items:center;gap:8px;font-weight:900;color:var(--text);font-size:17px}
.pub .brand img{border-radius:10px}
.pub .wrap{max-width:760px;margin:0 auto;padding:12px 16px 32px}
.pub .crumbs{display:flex;flex-wrap:wrap;gap:6px;font-size:12.5px;color:var(--sub);margin:4px 2px 12px}
.pub .crumbs a{color:var(--sub)}
.pub .card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:18px;margin-bottom:14px;box-shadow:0 6px 24px rgba(16,24,40,.05)}
.pub h1{font-size:24px;line-height:1.5;margin:0;font-weight:900}
.pub h2{font-size:17px;margin:0 0 12px;font-weight:900}
.pub .hero{background:linear-gradient(150deg,color-mix(in srgb,var(--accent) 14%,var(--card)),var(--card) 60%)}
.pub .hero-row{display:flex;gap:14px;align-items:center}
.pub .logo{width:64px;height:64px;flex-shrink:0;border-radius:18px;overflow:hidden;background:var(--goldbg);display:flex;align-items:center;justify-content:center;font-size:30px}
.pub .logo img{width:100%;height:100%;object-fit:cover}
.pub .hero-text{min-width:0}
.pub .meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.pub .chip{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:800;border-radius:99px;padding:3px 10px;background:color-mix(in srgb,var(--text) 7%,transparent);color:var(--text)}
.pub .chip.gold{background:var(--goldbg);color:var(--gold)}
.pub .chip.ok{background:var(--okbg);color:var(--ok)}
.pub .chip.warn{background:var(--warnbg);color:var(--warn)}
.pub .stars{color:#f5b83d;letter-spacing:1px}.pub .stars .off{color:color-mix(in srgb,var(--text) 22%,transparent)}
.pub .motto{font-size:15px;margin:14px 0 0;color:var(--text)}
.pub .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:14px;background:var(--accent);color:var(--onaccent);font-weight:900;padding:12px 18px;font-size:15px}
.pub .btn.small{padding:7px 14px;font-size:13px;border-radius:11px}
.pub .btn.wide{display:flex;width:100%;margin-top:16px}
.pub .btn.ghost{background:transparent;color:var(--accent);border:1.5px solid var(--accent);margin-top:12px;width:100%}
.pub .hint{font-size:12.5px;color:var(--sub);text-align:center;margin:8px 0 0}
.pub .info{list-style:none;padding:0;margin:0}
.pub .info li{display:flex;gap:12px;padding:8px 0;border-bottom:1px dashed var(--line)}
.pub .info li:last-child{border-bottom:none}
.pub .info b{flex:0 0 74px;color:var(--sub);font-weight:800;font-size:13px}
.pub .info span,.pub .info a{min-width:0;overflow-wrap:anywhere}
.pub .links,.pub .near{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.pub .pill{display:inline-flex;border:1px solid var(--line);border-radius:99px;padding:6px 14px;font-size:13px;font-weight:800;color:var(--text);background:var(--card)}
.pub .quests{display:flex;flex-direction:column;gap:10px}
.pub .quest{display:flex;gap:12px;align-items:flex-start;border:1px solid var(--line);border-radius:16px;padding:12px}
.pub .q-ic{width:42px;height:42px;flex-shrink:0;border-radius:13px;background:var(--goldbg);display:flex;align-items:center;justify-content:center;font-size:22px}
.pub .q-body{min-width:0;flex:1}
.pub .q-title{font-weight:900}
.pub .q-sub{font-size:13px;color:var(--sub)}
.pub .q-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.pub .photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.pub .photos img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:var(--line)}
.pub .menu{list-style:none;padding:0;margin:0}
.pub .menu li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px dashed var(--line)}
.pub .menu li:last-child{border-bottom:none}
.pub .m-price{color:var(--sub);white-space:nowrap;font-size:13.5px}
.pub .cm{border-top:1px solid var(--line);padding:12px 0}
.pub .cm:first-of-type{border-top:none;padding-top:0}
.pub .cm-head{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.pub .cm p{margin:6px 0 0;overflow-wrap:anywhere;white-space:pre-wrap}
.pub .av{width:30px;height:30px;border-radius:10px;background:var(--goldbg);display:inline-flex;align-items:center;justify-content:center}
.pub .reply{margin-top:8px;padding:8px 12px;border-radius:12px;background:color-mix(in srgb,var(--accent) 9%,transparent);border-right:3px solid var(--accent)}
.pub .reply b{font-size:12.5px;color:var(--accent)}
.pub .reply p{margin:2px 0 0;font-size:14px}
.pub .muted{color:var(--sub)}.pub .small{font-size:12px}
.pub .foot{text-align:center;font-size:12.5px;color:var(--sub);padding:18px 16px 30px}
.pub .dist{margin-bottom:14px}
.pub .dist h2{display:flex;justify-content:space-between;align-items:baseline}
.pub .dist h2 small{font-size:12px;color:var(--sub);font-weight:700}
.pub .jump{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.pub .lead{color:var(--sub);margin:6px 0 0}
`
