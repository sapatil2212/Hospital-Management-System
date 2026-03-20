"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Users, ClipboardList, Stethoscope, LogOut, Search,
  Bell, MessageSquare, HelpCircle, ChevronRight, AlertTriangle,
  Pill, Clock, HeartPulse, BarChart2, Filter, UserRound, Activity
} from "lucide-react";

const myPatients = [
  { id:"P001", name:"Rajesh Verma", age:54, blood:"O+", condition:"Hypertension", nextVisit:"Today 09:00 AM", status:"stable", gender:"Male" },
  { id:"P002", name:"Kavita Singh", age:45, blood:"AB+", condition:"Arrhythmia", nextVisit:"Today 11:00 AM", status:"monitor", gender:"Female" },
  { id:"P003", name:"Mohan Lal", age:67, blood:"B+", condition:"Heart Failure", nextVisit:"Tomorrow", status:"critical", gender:"Male" },
  { id:"P004", name:"Sunita Bose", age:33, blood:"A-", condition:"Angina", nextVisit:"25 Mar", status:"stable", gender:"Female" },
  { id:"P005", name:"Harish Gupta", age:59, blood:"O+", condition:"CAD Post-op", nextVisit:"26 Mar", status:"recovering", gender:"Male" },
];
const myAppointments = [
  { time:"09:00 AM", patient:"Rajesh Verma", type:"Follow-up", status:"in-progress" },
  { time:"09:30 AM", patient:"—", type:"Break", status:"break" },
  { time:"11:00 AM", patient:"Kavita Singh", type:"Consultation", status:"confirmed" },
  { time:"12:00 PM", patient:"New Patient", type:"OPD Walk-in", status:"waiting" },
  { time:"02:00 PM", patient:"Mohan Lal", type:"IPD Review", status:"confirmed" },
  { time:"04:00 PM", patient:"Sunita Bose", type:"Test Results", status:"confirmed" },
];
const prescriptions = [
  { patient:"Rajesh Verma", drug:"Amlodipine 5mg", freq:"Once daily", duration:"30 days", date:"20 Mar 2026" },
  { patient:"Kavita Singh", drug:"Metoprolol 25mg", freq:"Twice daily", duration:"14 days", date:"20 Mar 2026" },
  { patient:"Mohan Lal", drug:"Furosemide 40mg + Spironolactone 25mg", freq:"Morning", duration:"Ongoing", date:"19 Mar 2026" },
];
const barData = [
  {month:"Jan",val:14},{month:"Feb",val:18},{month:"Mar",val:24},{month:"Apr",val:19},{month:"May",val:22},{month:"Jun",val:16},{month:"Jul",val:20},{month:"Aug",val:28},{month:"Sep",val:24},
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_H = ["M","T","W","T","F","S","S"];

function MiniCalendar({ accent = "#10b981" }: { accent?: string }) {
  const today = new Date();
  const [cur, setCur] = useState({ y:today.getFullYear(), m:today.getMonth() });
  const firstDay = new Date(cur.y,cur.m,1).getDay();
  const offset = firstDay===0?6:firstDay-1;
  const days = new Date(cur.y,cur.m+1,0).getDate();
  const cells:(number|null)[] = [...Array(offset).fill(null),...Array.from({length:days},(_,i)=>i+1)];
  while(cells.length%7!==0) cells.push(null);
  const isToday = (d:number|null) => d===today.getDate()&&cur.m===today.getMonth()&&cur.y===today.getFullYear();
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>{MONTHS[cur.m]} {cur.y}</span>
        <div style={{display:"flex",gap:4}}>
          {["‹","›"].map((a,i)=>(
            <button key={i} onClick={()=>setCur(c=>{const nm=c.m+(i?1:-1);return nm<0?{y:c.y-1,m:11}:nm>11?{y:c.y+1,m:0}:{...c,m:nm};})}
              style={{width:26,height:26,borderRadius:8,border:"none",background:i?accent:"#e2e8f0",color:i?"#fff":"#64748b",cursor:"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{a}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {DAYS_H.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:12,fontWeight:isToday(d)?700:400,padding:"5px 0",borderRadius:8,cursor:d?"pointer":"default",background:isToday(d)?accent:"transparent",color:isToday(d)?"#fff":d?"#334155":"transparent"}}>{d||""}</div>
        ))}
      </div>
    </div>
  );
}

type Tab = "schedule"|"patients"|"prescriptions";

export default function DoctorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("schedule");

  useEffect(()=>{
    fetch("/api/auth/me",{credentials:"include"}).then(r=>r.json()).then(d=>{if(!d.success){router.push("/login");return;}setUser(d.data);setLoading(false);}).catch(()=>router.push("/login"));
  },[router]);

  const logout = async()=>{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});router.push("/login");};
  const initials = (n:string) => n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  const maxBar = Math.max(...barData.map(b=>b.val));

  if(loading) return <div style={{minHeight:"100vh",background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",color:"#64748b",fontSize:14,gap:14}}>
    <div style={{width:32,height:32,border:"3px solid #bbf7d0",borderTop:"3px solid #10b981",borderRadius:"50%",animation:"sp .8s linear infinite"}}/>
    <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>Loading Doctor Portal...
  </div>;

  const navItems = [
    {id:"schedule" as Tab, label:"Schedule",      icon:<CalendarDays size={16}/>},
    {id:"patients" as Tab, label:"My Patients",   icon:<UserRound size={16}/>},
    {id:"prescriptions" as Tab, label:"Prescriptions", icon:<Pill size={16}/>},
  ];

  return (<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f0fdf4}::-webkit-scrollbar-thumb{background:#a7f3d0;border-radius:4px}
      input,select,button{font-family:'Inter',sans-serif}
      .doc{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0fdf9}
      .doc-sb{width:220px;background:#fff;border-right:1px solid #d1fae5;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(16,185,129,0.06)}
      .doc-logo{padding:20px 20px 16px;border-bottom:1px solid #ecfdf5;display:flex;align-items:center;gap:10px}
      .doc-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.3)}
      .doc-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
      .doc-logo-sub{font-size:10px;color:#94a3b8;margin-top:0px}
      .doc-nav{flex:1;padding:12px 12px;overflow-y:auto}
      .doc-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:12px 0 6px}
      .doc-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
      .doc-nb:hover{background:#ecfdf5;color:#047857}
      .doc-nb.on{background:#d1fae5;color:#059669;font-weight:600}
      .doc-nb-dot{display:none;width:3px;height:20px;background:#10b981;border-radius:4px;position:absolute;left:0}
      .doc-nb.on .doc-nb-dot{display:block}
      .doc-nb svg{color:#94a3b8;flex-shrink:0}
      .doc-nb.on svg{color:#059669}
      .doc-sb-foot{padding:14px 16px 18px;border-top:1px solid #ecfdf5}
      .doc-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;margin-bottom:10px}
      .doc-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#10b981,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
      .doc-uname{font-size:12px;font-weight:600;color:#1e293b}
      .doc-urole{font-size:10px;font-weight:500;color:#059669}
      .doc-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
      .doc-logout:hover{background:#fee2e2}
      .doc-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
      .doc-topbar{height:64px;background:#fff;border-bottom:1px solid #d1fae5;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(16,185,129,0.06)}
      .doc-search-wrap{display:flex;align-items:center;gap:8px;background:#f0fdf4;border:1px solid #d1fae5;border-radius:10px;padding:8px 14px;width:280px}
      .doc-search-wrap:focus-within{border-color:#6ee7b7}
      .doc-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
      .doc-search::placeholder{color:#94a3b8}
      .doc-tb-right{display:flex;align-items:center;gap:12px}
      .doc-notif{width:36px;height:36px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
      .doc-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#10b981;border:1.5px solid #fff}
      .doc-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;cursor:pointer}
      .doc-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#10b981,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
      .doc-profile-name{font-size:12px;font-weight:600;color:#1e293b}
      .doc-profile-role{font-size:10px;color:#059669}
      .doc-body{display:grid;grid-template-columns:1fr 260px;flex:1}
      .doc-center{padding:22px 20px;overflow-y:auto}
      .doc-right{background:#fff;border-left:1px solid #d1fae5;padding:22px 18px;overflow-y:auto}
      .doc-pg-title{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
      .doc-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
      .doc-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #d1fae5;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(16,185,129,0.06);transition:transform .2s,box-shadow .2s}
      .doc-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.08)}
      .doc-sc-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
      .doc-sc-lbl{font-size:11px;font-weight:500;color:#94a3b8;margin-bottom:2px}
      .doc-sc-val{font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
      .doc-sc-sub{font-size:10px;color:#94a3b8;margin-top:3px}
      .doc-mid{display:grid;grid-template-columns:1fr 220px;gap:14px;margin-bottom:18px}
      .doc-card{background:#fff;border-radius:14px;border:1px solid #d1fae5;box-shadow:0 1px 4px rgba(16,185,129,0.05);overflow:hidden;margin-bottom:16px}
      .doc-card-head{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ecfdf5}
      .doc-card-title{font-size:14px;font-weight:700;color:#1e293b}
      .doc-card-sub{font-size:11px;color:#94a3b8;margin-top:2px}
      .doc-card-body{padding:16px 18px}
      .doc-tbl{width:100%;border-collapse:collapse}
      .doc-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #ecfdf5}
      .doc-tbl td{padding:11px 12px;font-size:13px;color:#475569;border-bottom:1px solid #f0fdf4}
      .doc-tbl tr:last-child td{border-bottom:none}
      .doc-tbl tbody tr:hover td{background:#f0fdf9}
      .doc-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
      .doc-chart{display:flex;align-items:flex-end;gap:8px;height:120px}
      .doc-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:5px;flex:1}
      .doc-bar{width:100%;border-radius:5px 5px 0 0;transition:opacity .2s;cursor:pointer;min-width:14px}
      .doc-bar:hover{opacity:.8}
      .doc-bar-lbl{font-size:10px;color:#94a3b8;font-weight:500}
      .doc-tl-item{display:flex;align-items:center;gap:12px;padding:10px;border-radius:10px;margin-bottom:8px;background:#f0fdf9;border:1px solid #ecfdf5}
      .doc-tl-time{font-size:12px;font-weight:700;color:#64748b;width:75px;flex-shrink:0}
      .doc-tl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
      .doc-tl-patient{font-size:13px;font-weight:600;color:#1e293b;flex:1}
      .doc-tl-type{font-size:11px;color:#64748b}
      .doc-right-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px}
      .doc-critical-card{padding:12px;border-radius:10px;margin-bottom:10px;cursor:pointer;transition:box-shadow .2s}
      .doc-critical-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.08)}
    `}</style>

    <div className="doc">
      <aside className="doc-sb">
        <div className="doc-logo">
          <div className="doc-logo-ic"><Stethoscope size={17} color="white"/></div>
          <div><div className="doc-logo-tx">MediCare+</div><div className="doc-logo-sub">Doctor Portal</div></div>
        </div>
        <nav className="doc-nav">
          <div className="doc-nav-sec">My Work</div>
          {navItems.map(n=>(
            <button key={n.id} className={`doc-nb${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
              <div className="doc-nb-dot"/>
              <span style={{color:tab===n.id?"#059669":"#94a3b8",display:"flex"}}>{n.icon}</span>
              {n.label}
            </button>
          ))}
          <div className="doc-nav-sec">Settings</div>
          <button className="doc-nb"><span style={{color:"#94a3b8",display:"flex"}}><HelpCircle size={16}/></span>Support</button>
        </nav>
        <div className="doc-sb-foot">
          <div className="doc-user">
            <div className="doc-av">{user?.name?initials(user.name):"DR"}</div>
            <div><div className="doc-uname">{user?.name||"Doctor"}</div><div className="doc-urole">Doctor · Cardiology</div></div>
          </div>
          <button className="doc-logout" onClick={logout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Log Out
          </button>
        </div>
      </aside>

      <main className="doc-main">
        <header className="doc-topbar">
          <div className="doc-search-wrap"><Search size={14} color="#94a3b8"/><input className="doc-search" placeholder="Search patients, prescriptions..."/></div>
          <div className="doc-tb-right">
            <div className="doc-notif"><Bell size={16} color="#64748b"/><span className="doc-notif-dot"/></div>
            <div className="doc-profile">
              <div className="doc-profile-av">{user?.name?initials(user.name):"DR"}</div>
              <div><div className="doc-profile-name">{user?.name?.split(" ")[0]||"Doctor"}</div><div className="doc-profile-role">Doctor 🩺</div></div>
            </div>
          </div>
        </header>

        <div className="doc-body">
          <div className="doc-center">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div className="doc-pg-title" style={{marginBottom:0}}>Good morning, Dr. {user?.name?.split(" ").slice(-1)[0]||"Doctor"} 👋</div>
              <span style={{fontSize:12,color:"#64748b",background:"#f0fdf4",border:"1px solid #d1fae5",padding:"5px 12px",borderRadius:8,fontWeight:500}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long"})}</span>
            </div>

            <div className="doc-stats">
              {[
                {icon:<CalendarDays size={20} color="#fff"/>, label:"Today's Slots", val:myAppointments.filter(a=>a.status!=="break").length, sub:"2 remaining",   bg:"#eff6ff", iconBg:"#3b82f6"},
                {icon:<UserRound size={20} color="#fff"/>,    label:"My Patients",  val:myPatients.length,                                   sub:"3 active today", bg:"#f0fdf4", iconBg:"#10b981"},
                {icon:<AlertTriangle size={20} color="#fff"/>,label:"Critical",     val:myPatients.filter(p=>p.status==="critical").length,    sub:"needs attention",bg:"#fff5f5", iconBg:"#ef4444"},
                {icon:<Pill size={20} color="#fff"/>,         label:"Prescriptions",val:prescriptions.length,                                 sub:"issued today",   bg:"#fdf4ff", iconBg:"#a855f7"},
              ].map((s,i)=>(
                <div key={i} className="doc-sc" style={{background:s.bg}}>
                  <div className="doc-sc-icon" style={{background:s.iconBg}}>{s.icon}</div>
                  <div><div className="doc-sc-lbl">{s.label}</div><div className="doc-sc-val">{s.val}</div><div className="doc-sc-sub">{s.sub}</div></div>
                </div>
              ))}
            </div>

            {tab==="schedule"&&(<>
              <div className="doc-mid">
                <div className="doc-card">
                  <div className="doc-card-head"><div><div className="doc-card-title">Patient Visits — This Month</div></div></div>
                  <div className="doc-card-body">
                    <div style={{display:"flex",alignItems:"flex-end",gap:0}}>
                      <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",height:120,paddingRight:8,alignItems:"flex-end"}}>
                        {[30,20,10,0].map(v=><span key={v} style={{fontSize:9,color:"#cbd5e1"}}>{v}</span>)}
                      </div>
                      <div className="doc-chart" style={{flex:1}}>
                        {barData.map((b,i)=>(
                          <div key={i} className="doc-bar-wrap">
                            <div className="doc-bar" style={{height:`${(b.val/maxBar)*110}px`,background:i===2||i===7?"linear-gradient(180deg,#10b981,#34d399)":"linear-gradient(180deg,#a7f3d0,#d1fae5)"}}/>
                            <span className="doc-bar-lbl">{b.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="doc-card">
                  <div className="doc-card-head"><div className="doc-card-title">Today's Timeline</div></div>
                  <div className="doc-card-body" style={{padding:"8px 12px"}}>
                    {myAppointments.map((a,i)=>(
                      <div key={i} className="doc-tl-item">
                        <div className="doc-tl-time">{a.time}</div>
                        <div className="doc-tl-dot" style={{background:a.status==="in-progress"?"#3b82f6":a.status==="break"?"#e2e8f0":a.status==="waiting"?"#f59e0b":"#10b981"}}/>
                        <div style={{flex:1}}>
                          <div className="doc-tl-patient">{a.patient}</div>
                          <div className="doc-tl-type">{a.type}</div>
                        </div>
                        <span className="doc-badge" style={a.status==="in-progress"?{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe"}:a.status==="break"?{background:"#f8fafc",color:"#94a3b8",border:"1px solid #e2e8f0"}:a.status==="waiting"?{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}:{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}}>{a.status.replace("-"," ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>)}

            {tab==="patients"&&(
              <div className="doc-card">
                <div className="doc-card-head"><div><div className="doc-card-title">My Patients</div><div className="doc-card-sub">{myPatients.length} under your care</div></div></div>
                <table className="doc-tbl">
                  <thead><tr><th>Name</th><th>Age</th><th>Blood</th><th>Condition</th><th>Next Visit</th><th>Status</th></tr></thead>
                  <tbody>
                    {myPatients.map(p=>(
                      <tr key={p.id}>
                        <td style={{fontWeight:600,color:"#1e293b"}}>{p.name}</td>
                        <td>{p.age}</td>
                        <td><span style={{color:"#ef4444",fontWeight:700}}>{p.blood}</span></td>
                        <td>{p.condition}</td>
                        <td style={{fontSize:12}}>{p.nextVisit}</td>
                        <td><span className="doc-badge" style={p.status==="critical"?{background:"#fff5f5",color:"#ef4444",border:"1px solid #fecaca"}:p.status==="monitor"?{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}:p.status==="recovering"?{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe"}:{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab==="prescriptions"&&(
              <div className="doc-card">
                <div className="doc-card-head"><div><div className="doc-card-title">Prescriptions Issued</div><div className="doc-card-sub">{prescriptions.length} today</div></div></div>
                <table className="doc-tbl">
                  <thead><tr><th>Patient</th><th>Drug / Dosage</th><th>Frequency</th><th>Duration</th><th>Date</th></tr></thead>
                  <tbody>
                    {prescriptions.map((p,i)=>(
                      <tr key={i}>
                        <td style={{fontWeight:600,color:"#1e293b"}}>{p.patient}</td>
                        <td style={{color:"#a855f7",fontWeight:500}}>{p.drug}</td>
                        <td>{p.freq}</td>
                        <td>{p.duration}</td>
                        <td style={{fontSize:12}}>{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="doc-right">
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Date</div>
              <MiniCalendar accent="#10b981"/>
            </div>
            <div>
              <div className="doc-right-title">⚠️ Critical &amp; Monitor Cases</div>
              {myPatients.filter(p=>p.status==="critical"||p.status==="monitor").map(p=>(
                <div key={p.id} className="doc-critical-card" style={{background:p.status==="critical"?"#fff5f5":"#fefce8",border:`1px solid ${p.status==="critical"?"#fecaca":"#fde68a"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{p.name}</div>
                    <span className="doc-badge" style={p.status==="critical"?{background:"#fff5f5",color:"#ef4444",border:"1px solid #fecaca"}:{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}}>{p.status}</span>
                  </div>
                  <div style={{fontSize:12,color:"#64748b"}}>{p.condition} · Age {p.age}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Next: {p.nextVisit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  </>);
}
