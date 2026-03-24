"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Activity, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, CheckCircle2, AlertTriangle,
  Plus, ChevronRight, Shield, TrendingUp, ServerCrash, Cpu, Database,
  BarChart2, Filter, X, User, ChevronDown
} from "lucide-react";

const hospitals_mock = [
  { id:"1", name:"Rajashree Hospital", email:"raj@hospital.com", mobile:"+91 98765 43210", isVerified:true, createdAt:"2026-01-10", patients:412 },
  { id:"2", name:"Sunrise Clinic", email:"sunrise@clinic.com", mobile:"+91 90590 53938", isVerified:true, createdAt:"2026-02-14", patients:187 },
  { id:"3", name:"Apollo Multispeciality", email:"apollo@health.com", mobile:"+91 77001 22334", isVerified:false, createdAt:"2026-03-01", patients:0 },
];
const activity_mock = [
  { time:"2 min ago", msg:"New hospital 'Apollo Multispeciality' onboarded", type:"info" },
  { time:"18 min ago", msg:"Sunrise Clinic admin changed password", type:"warn" },
  { time:"1 hr ago", msg:"Rajashree Hospital verified", type:"success" },
  { time:"3 hr ago", msg:"Failed login attempt on superadmin portal", type:"danger" },
  { time:"5 hr ago", msg:"Prisma schema migrated successfully", type:"success" },
];
const activityIcons: Record<string, React.ReactNode> = {
  info:    <Building2 size={13}/>,
  warn:    <AlertTriangle size={13}/>,
  success: <CheckCircle2 size={13}/>,
  danger:  <Shield size={13}/>,
};
const barData = [
  {month:"Jan",val:1},{month:"Feb",val:2},{month:"Mar",val:3},{month:"Apr",val:2},{month:"May",val:1},{month:"Jun",val:2},{month:"Jul",val:3},{month:"Aug",val:2},{month:"Sep",val:1},
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_H = ["M","T","W","T","F","S","S"];

function MiniCalendar() {
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
        <span style={{fontSize:16,fontWeight:700,color:"#1e293b"}}>{MONTHS[cur.m]} {cur.y}</span>
        <div style={{display:"flex",gap:4}}>
          {["‹","›"].map((a,i)=>(
            <button key={i} onClick={()=>setCur(c=>{const nm=c.m+(i?1:-1);return nm<0?{y:c.y-1,m:11}:nm>11?{y:c.y+1,m:0}:{...c,m:nm};})}
              style={{width:26,height:26,borderRadius:8,border:"none",background:i?"#dc2626":"#e2e8f0",color:i?"#fff":"#64748b",cursor:"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {DAYS_H.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:12,fontWeight:isToday(d)?700:400,padding:"5px 0",borderRadius:8,cursor:d?"pointer":"default",background:isToday(d)?"#dc2626":"transparent",color:isToday(d)?"#fff":d?"#334155":"transparent"}}>
            {d||""}
          </div>
        ))}
      </div>
    </div>
  );
}

type Tab = "overview"|"hospitals"|"activity"|"settings";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [newHospital, setNewHospital] = useState({name:"",email:"",mobile:"",adminName:"",password:""});
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(()=>{
    fetch("/api/auth/me",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(!d.success||d.data?.role!=="SUPER_ADMIN") router.push("/superadmin/login");
      else setLoading(false);
    }).catch(()=>router.push("/superadmin/login"));
  },[router]);

  const logout = async()=>{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});router.push("/superadmin/login");};
  const handleCreate = async(e:React.FormEvent)=>{
    e.preventDefault();setCreating(true);setCreateMsg("");
    try{const res=await fetch("/api/hospital/create",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(newHospital)});const d=await res.json();if(d.success){setCreateMsg("✓ Hospital created!");setTimeout(()=>setShowModal(false),1500);}else setCreateMsg(d.message||"Failed.");}
    catch{setCreateMsg("Network error.");}finally{setCreating(false);}
  };

  const filtered = hospitals_mock.filter(h=>h.name.toLowerCase().includes(search.toLowerCase())||h.email.toLowerCase().includes(search.toLowerCase()));
  const maxPat = Math.max(...hospitals_mock.map(h=>h.patients),1);

  if(loading) return <div style={{minHeight:"100vh",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",color:"#64748b",fontSize:14,gap:14}}>
    <div style={{width:32,height:32,border:"3px solid #fee2e2",borderTop:"3px solid #dc2626",borderRadius:"50%",animation:"sp .8s linear infinite"}}/>
    <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>Verifying root access...
  </div>;

  const navItems:{id:Tab;label:string;icon:React.ReactNode}[]=[
    {id:"overview",  label:"Dashboard", icon:<LayoutDashboard size={16}/>},
    {id:"hospitals", label:"Hospitals",  icon:<Building2 size={16}/>},
    {id:"activity",  label:"Activity",   icon:<Activity size={16}/>},
    {id:"settings",  label:"Settings",   icon:<Settings size={16}/>},
  ];

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#fef2f2}::-webkit-scrollbar-thumb{background:#fca5a5;border-radius:4px}
      input,select,button{font-family:'Inter',sans-serif}
      .sad{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#fef7f7}
      .sad-sb{width:220px;background:#fff;border-right:1px solid #fee2e2;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(220,38,38,0.06)}
      .sad-logo{padding:20px 20px 16px;border-bottom:1px solid #fef2f2;display:flex;align-items:center;gap:10px}
      .sad-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#dc2626,#991b1b);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(220,38,38,0.3)}
      .sad-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
      .sad-logo-sub{font-size:10px;color:#94a3b8;margin-top:0px}
      .sad-nav{flex:1;padding:12px 12px;overflow-y:auto}
      .sad-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:12px 0 6px}
      .sad-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
      .sad-nb:hover{background:#fef2f2;color:#991b1b}
      .sad-nb.on{background:#fff5f5;color:#dc2626;font-weight:600}
      .sad-nb-dot{display:none;width:3px;height:20px;background:#dc2626;border-radius:4px;position:absolute;left:0}
      .sad-nb.on .sad-nb-dot{display:block}
      .sad-nb svg{color:#94a3b8;transition:color .15s;flex-shrink:0}
      .sad-nb.on svg{color:#dc2626}
      .sad-sb-foot{padding:14px 16px 18px;border-top:1px solid #fef2f2}
      .sad-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#fef2f2;border:1px solid #fee2e2;margin-bottom:10px}
      .sad-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#dc2626,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
      .sad-uname{font-size:12px;font-weight:600;color:#1e293b}
      .sad-urole{font-size:10px;font-weight:500;color:#dc2626}
      .sad-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
      .sad-logout:hover{background:#fee2e2}
      .sad-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
      .sad-topbar{height:64px;background:#fff;border-bottom:1px solid #fee2e2;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(220,38,38,0.06)}
      .sad-search-wrap{display:flex;align-items:center;gap:8px;background:#fef7f7;border:1px solid #fee2e2;border-radius:10px;padding:8px 14px;width:280px}
      .sad-search-wrap:focus-within{border-color:#fca5a5}
      .sad-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
      .sad-search::placeholder{color:#94a3b8}
      .sad-tb-right{display:flex;align-items:center;gap:12px}
      .sad-notif{width:36px;height:36px;border-radius:10px;background:#fef7f7;border:1px solid #fee2e2;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
      .sad-notif:hover{background:#fff5f5}
      .sad-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#dc2626;border:1.5px solid #fff}
      .sad-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#fef7f7;border:1px solid #fee2e2;cursor:pointer}
      .sad-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#dc2626,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
      .sad-profile-name{font-size:12px;font-weight:600;color:#1e293b}
      .sad-profile-role{font-size:10px;color:#dc2626}
      .sad-body{display:grid;grid-template-columns:1fr 260px;flex:1}
      .sad-center{padding:22px 20px;overflow-y:auto}
      .sad-right{background:#fff;border-left:1px solid #fee2e2;padding:22px 18px;overflow-y:auto}
      .sad-pg-title{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
      .sad-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
      .sad-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #fee2e2;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(220,38,38,0.05);transition:transform .2s,box-shadow .2s;cursor:default}
      .sad-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.08)}
      .sad-sc-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
      .sad-sc-lbl{font-size:11px;font-weight:500;color:#94a3b8;margin-bottom:2px}
      .sad-sc-val{font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
      .sad-sc-sub{font-size:10px;color:#94a3b8;margin-top:3px}
      .sad-mid{display:grid;grid-template-columns:1fr 220px;gap:14px;margin-bottom:18px}
      .sad-card{background:#fff;border-radius:14px;border:1px solid #fee2e2;box-shadow:0 1px 4px rgba(220,38,38,0.05);overflow:hidden;margin-bottom:16px}
      .sad-card-head{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #fef2f2}
      .sad-card-title{font-size:14px;font-weight:700;color:#1e293b}
      .sad-card-sub{font-size:11px;color:#94a3b8;margin-top:2px}
      .sad-card-body{padding:16px 18px}
      .sad-icon-btn{width:28px;height:28px;border-radius:8px;background:#fef7f7;border:1px solid #fee2e2;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8}
      .sad-chart{display:flex;align-items:flex-end;gap:10px;height:100px}
      .sad-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:5px;flex:1}
      .sad-bar{width:100%;border-radius:5px 5px 0 0;transition:opacity .2s;cursor:pointer;min-width:14px}
      .sad-bar:hover{opacity:.8}
      .sad-bar-lbl{font-size:10px;color:#94a3b8;font-weight:500}
      .sad-tbl-wrap{overflow-x:auto}
      .sad-tbl{width:100%;border-collapse:collapse;min-width:400px}
      .sad-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #fef2f2}
      .sad-tbl td{padding:11px 12px;font-size:13px;color:#475569;border-bottom:1px solid #fef7f7}
      .sad-tbl tr:last-child td{border-bottom:none}
      .sad-tbl tbody tr:hover td{background:#fef7f7}
      .sad-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
      .sad-act-item{display:flex;align-items:flex-start;gap:10px;padding:12px;border-radius:10px;background:#fef7f7;border:1px solid #fef2f2;margin-bottom:8px}
      .sad-act-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
      .sad-act-msg{font-size:12px;color:#334155;line-height:1.5;font-weight:500}
      .sad-act-time{font-size:10px;color:#94a3b8;margin-top:3px}
      .sad-btn-red{padding:7px 14px;border-radius:9px;border:none;background:#dc2626;color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(220,38,38,0.25);transition:all .15s}
      .sad-btn-red:hover{background:#b91c1c;transform:translateY(-1px)}
      .sad-right-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px}
      .sad-health-item{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #fef2f2}
      .sad-health-item:last-child{border-bottom:none}
      .sad-health-key{font-size:12px;color:#64748b}
      .sad-health-val{font-size:12px;font-weight:600;color:#16a34a}
      .sad-hbar{height:3px;background:#fee2e2;border-radius:4px;overflow:hidden;margin-top:3px;width:80px}
      .sad-hfill{height:100%;border-radius:4px;background:linear-gradient(90deg,#10b981,#34d399)}
      .sad-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
      .sad-modal{background:#fff;border-radius:18px;padding:28px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
      .sad-modal-title{font-size:18px;font-weight:800;color:#1e293b;margin-bottom:4px}
      .sad-modal-sub{font-size:13px;color:#64748b;margin-bottom:20px}
      .sad-mf{margin-bottom:13px}
      .sad-ml{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:5px}
      .sad-mi{width:100%;background:#fef7f7;border:1.5px solid #fee2e2;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s}
      .sad-mi:focus{border-color:#fca5a5;box-shadow:0 0 0 3px rgba(252,165,165,0.25)}
      .sad-mi::placeholder{color:#94a3b8}
      .sad-ma{display:flex;gap:10px;margin-top:18px}
      .sad-mcancel{flex:1;padding:10px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer}
      .sad-msubmit{flex:2;padding:10px;border-radius:9px;border:none;background:#dc2626;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(220,38,38,0.25)}
      .sad-msubmit:disabled{opacity:.55;cursor:not-allowed}
      .sad-spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite}
      @keyframes sp{to{transform:rotate(360deg)}}
      .sad-msg-ok{font-size:12px;color:#10b981;margin-top:8px;text-align:center;font-weight:600}
      .sad-msg-err{font-size:12px;color:#ef4444;margin-top:8px;text-align:center}
      .sad-filter-btn{padding:6px 14px;border-radius:8px;background:#fef7f7;border:1px solid #fee2e2;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px}
    `}</style>

    {showModal&&(
      <div className="sad-modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
        <div className="sad-modal">
          <div className="sad-modal-title">Onboard New Hospital</div>
          <div className="sad-modal-sub">Create a hospital tenant and its first admin account.</div>
          <form onSubmit={handleCreate}>
            {[{key:"name",lbl:"Hospital Name",ph:"e.g. Sunrise Clinic"},{key:"email",lbl:"Admin Email",ph:"admin@hospital.com"},{key:"mobile",lbl:"Mobile",ph:"+91 98765 43210"},{key:"adminName",lbl:"Admin Full Name",ph:"Dr. John Doe"},{key:"password",lbl:"Admin Password",ph:"Min 6 characters"}].map(f=>(
              <div key={f.key} className="sad-mf"><label className="sad-ml">{f.lbl}</label>
                <input type={f.key==="password"?"password":"text"} className="sad-mi" placeholder={f.ph} value={(newHospital as any)[f.key]} onChange={e=>setNewHospital(n=>({...n,[f.key]:e.target.value}))} required/>
              </div>
            ))}
            {createMsg&&<div className={createMsg.startsWith("✓")?"sad-msg-ok":"sad-msg-err"}>{createMsg}</div>}
            <div className="sad-ma">
              <button type="button" className="sad-mcancel" onClick={()=>setShowModal(false)}>Cancel</button>
              <button type="submit" className="sad-msubmit" disabled={creating}>{creating?<span className="sad-spin"/>:"Create Hospital"}</button>
            </div>
          </form>
        </div>
      </div>
    )}

    <div className="sad">
      <aside className="sad-sb">
        <div className="sad-logo">
          <div className="sad-logo-ic"><Building2 size={18} color="white"/></div>
          <div><div className="sad-logo-tx">HMS Root</div><div className="sad-logo-sub">Super Admin</div></div>
        </div>
        <nav className="sad-nav">
          <div className="sad-nav-sec">System</div>
          {navItems.map(n=>(
            <button key={n.id} className={`sad-nb${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
              <div className="sad-nb-dot"/>
              <span style={{color:tab===n.id?"#dc2626":"#94a3b8",display:"flex"}}>{n.icon}</span>
              {n.label}
            </button>
          ))}
          <div className="sad-nav-sec">Help</div>
          <button className="sad-nb"><span style={{color:"#94a3b8",display:"flex"}}><HelpCircle size={16}/></span>Support</button>
        </nav>
        <div className="sad-sb-foot">
          <div className="sad-user">
            <div className="sad-av">SA</div>
            <div><div className="sad-uname">Super Admin</div><div className="sad-urole">Root Access</div></div>
          </div>
          <button className="sad-logout" onClick={logout}><LogOut size={13}/> Log Out</button>
        </div>
      </aside>

      <main className="sad-main">
        <header className="sad-topbar">
          <div className="sad-search-wrap">
            <Search size={14} color="#94a3b8"/>
            <input className="sad-search" placeholder="Search hospitals, users..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="sad-tb-right">
            <div className="sad-notif"><Bell size={16} color="#64748b"/><span className="sad-notif-dot"/></div>
            <div className="sad-notif"><MessageSquare size={16} color="#64748b"/></div>
            <div className="sad-profile" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} style={{ position: "relative", cursor: "pointer" }}>
              <div className="sad-profile-av">SA</div>
              <div><div className="sad-profile-name">Super Admin</div><div className="sad-profile-role">Root Access</div></div>
              <ChevronDown size={14} color="#64748b" style={{ marginLeft: 6 }} />
              
              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <>
                  <div 
                    style={{ position: "fixed", inset: 0, zIndex: 60 }} 
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 200,
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #fee2e2",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    zIndex: 70,
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: 16, borderBottom: "1px solid #fef2f2" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Super Admin</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Root Access</div>
                    </div>
                    <div style={{ padding: 8 }}>
                      <button 
                        onClick={() => { setProfileDropdownOpen(false); logout(); }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: "transparent",
                          color: "#ef4444",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <LogOut size={16} color="#ef4444" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="sad-body">
          <div className="sad-center">
            {tab==="overview"&&(<>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                <div className="sad-pg-title" style={{marginBottom:0}}>Dashboard</div>
                <button className="sad-filter-btn"><Filter size={12}/>This Week<ChevronRight size={12}/></button>
              </div>
              <div className="sad-stats">
                {[
                  {icon:<Building2 size={20} color="#fff"/>,    label:"Total Hospitals",  val:hospitals_mock.length,                                    sub:"1 pending approval", bg:"#fff5f5", iconBg:"#dc2626"},
                  {icon:<CheckCircle2 size={20} color="#fff"/>,  label:"Verified Tenants",  val:hospitals_mock.filter(h=>h.isVerified).length,            sub:"2 active",           bg:"#f0fdf4", iconBg:"#10b981"},
                  {icon:<TrendingUp size={20} color="#fff"/>,    label:"Total Patients",   val:hospitals_mock.reduce((s,h)=>s+h.patients,0),             sub:"across all hospitals",bg:"#E6F4F4", iconBg:"#0E898F"},
                  {icon:<AlertTriangle size={20} color="#fff"/>, label:"Pending",           val:hospitals_mock.filter(h=>!h.isVerified).length,            sub:"needs verification",  bg:"#fefce8", iconBg:"#ca8a04"},
                ].map((s,i)=>(
                  <div key={i} className="sad-sc" style={{background:s.bg}}>
                    <div className="sad-sc-icon" style={{background:s.iconBg}}>{s.icon}</div>
                    <div><div className="sad-sc-lbl">{s.label}</div><div className="sad-sc-val">{s.val}</div><div className="sad-sc-sub">{s.sub}</div></div>
                  </div>
                ))}
              </div>

              <div className="sad-mid">
                <div className="sad-card">
                  <div className="sad-card-head"><div><div className="sad-card-title">Hospital Growth</div><div className="sad-card-sub">Onboarded tenants per month</div></div></div>
                  <div className="sad-card-body">
                    <div style={{display:"flex",alignItems:"flex-end",gap:0}}>
                      <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",height:100,paddingRight:8,alignItems:"flex-end"}}>
                        {[5,4,3,2,1,0].map(v=><span key={v} style={{fontSize:9,color:"#cbd5e1"}}>{v}</span>)}
                      </div>
                      <div className="sad-chart" style={{flex:1}}>
                        {barData.map((b,i)=>(
                          <div key={i} className="sad-bar-wrap">
                            <div className="sad-bar" style={{height:`${(b.val/5)*90}px`,background:b.val>2?"linear-gradient(180deg,#dc2626,#ef4444)":"linear-gradient(180deg,#fecaca,#fee2e2)"}}/>
                            <span className="sad-bar-lbl">{b.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sad-card">
                  <div className="sad-card-head"><div className="sad-card-title">System Alerts</div></div>
                  <div className="sad-card-body" style={{padding:"12px 14px"}}>
                    {activity_mock.slice(0,3).map((a,i)=>(
                      <div key={i} style={{padding:"10px",borderRadius:10,background:i===0?"linear-gradient(135deg,#dc2626,#b91c1c)":"#fef7f7",border:i===0?"none":"1px solid #fef2f2",marginBottom:8}}>
                        <div style={{fontSize:12,color:i===0?"#fff":"#334155",fontWeight:500,lineHeight:1.4}}>{a.msg}</div>
                        <div style={{fontSize:10,color:i===0?"rgba(255,255,255,0.65)":"#94a3b8",marginTop:4}}>{a.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sad-card">
                <div className="sad-card-head">
                  <div><div className="sad-card-title">Registered Hospitals</div><div className="sad-card-sub">All tenants</div></div>
                  <button className="sad-btn-red" onClick={()=>setShowModal(true)}><Plus size={14}/>Add Hospital</button>
                </div>
                <div className="sad-tbl-wrap">
                  <table className="sad-tbl">
                    <thead><tr><th>No</th><th>Hospital Name</th><th>Email</th><th>Mobile</th><th>Patients</th><th>Status</th><th>Joined</th></tr></thead>
                    <tbody>
                      {filtered.map((h,i)=>(
                        <tr key={h.id}>
                          <td style={{color:"#94a3b8",fontSize:12}}>0{i+1}</td>
                          <td style={{fontWeight:600,color:"#1e293b"}}>{h.name}</td>
                          <td>{h.email}</td>
                          <td style={{fontSize:12}}>{h.mobile}</td>
                          <td>{h.patients}</td>
                          <td><span className="sad-badge" style={h.isVerified?{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}:{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}}>{h.isVerified?"✓ Active":"⏳ Pending"}</span></td>
                          <td style={{fontSize:12}}>{new Date(h.createdAt).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>)}

            {tab==="hospitals"&&(
              <div className="sad-card">
                <div className="sad-card-head">
                  <div><div className="sad-card-title">All Hospitals</div><div className="sad-card-sub">{hospitals_mock.length} tenants</div></div>
                  <div style={{display:"flex",gap:10}}>
                    <input className="sad-mi" style={{width:200,padding:"7px 12px",fontSize:12}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
                    <button className="sad-btn-red" onClick={()=>setShowModal(true)}>+ Add Hospital</button>
                  </div>
                </div>
                <div className="sad-tbl-wrap">
                  <table className="sad-tbl">
                    <thead><tr><th>No</th><th>Name</th><th>Email</th><th>Mobile</th><th>Patients</th><th>Status</th><th>Joined</th></tr></thead>
                    <tbody>
                      {filtered.map((h,i)=>(
                        <tr key={h.id}>
                          <td style={{color:"#94a3b8",fontSize:12}}>0{i+1}</td>
                          <td style={{fontWeight:600,color:"#1e293b"}}>{h.name}</td>
                          <td>{h.email}</td>
                          <td style={{fontSize:12}}>{h.mobile}</td>
                          <td>{h.patients}</td>
                          <td><span className="sad-badge" style={h.isVerified?{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}:{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}}>{h.isVerified?"✓ Active":"⏳ Pending"}</span></td>
                          <td style={{fontSize:12}}>{new Date(h.createdAt).toLocaleDateString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab==="activity"&&(
              <div className="sad-card">
                <div className="sad-card-head"><div><div className="sad-card-title">System Activity</div><div className="sad-card-sub">All critical events</div></div></div>
                <div className="sad-card-body">
                  {activity_mock.map((a,i)=>(
                    <div key={i} className="sad-act-item">
                      <div className="sad-act-dot" style={{background:{info:"#0E898F",warn:"#f59e0b",success:"#10b981",danger:"#ef4444"}[a.type]}}/>
                      <div><div className="sad-act-msg">{a.msg}</div><div className="sad-act-time">{a.time}</div></div>
                      <span className="sad-badge" style={a.type==="success"?{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}:a.type==="danger"?{background:"#fff5f5",color:"#ef4444",border:"1px solid #fecaca"}:a.type==="warn"?{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}:{background:"#E6F4F4",color:"#0A6B70",border:"1px solid #B3E0E0"}}>{a.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="settings"&&(
              <div className="sad-card">
                <div className="sad-card-head"><div className="sad-card-title">System Configuration</div></div>
                <div className="sad-card-body">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[["Framework","Next.js 14 (App Router)"],["ORM","Prisma v5"],["Database","MySQL (TiDB Cloud)"],["Auth","JWT + HTTP-only Cookies"],["Tenant Isolation","hospitalId-scoped"],["Session TTL","7 Days"],["Roles","5 role types"],["Architecture","Multi-Tenant SaaS"]].map(([k,v])=>(
                      <div key={k} style={{padding:"13px 16px",borderRadius:11,background:"#fef7f7",border:"1px solid #fee2e2"}}>
                        <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{k}</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#334155"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sad-right">
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Date</div>
              <MiniCalendar/>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div className="sad-right-title">System Health</div>
              </div>
              {[{key:"Database",val:"Online ✓",pct:100},{key:"API Server",val:"Healthy ✓",pct:100},{key:"Auth Service",val:"Online ✓",pct:100},{key:"Email",val:"Active ✓",pct:98},{key:"CPU Usage",val:"12%",pct:12},{key:"Memory",val:"43%",pct:43}].map(i=>(
                <div key={i.key} className="sad-health-item">
                  <div><div className="sad-health-key">{i.key}</div><div className="sad-hbar"><div className="sad-hfill" style={{width:`${i.pct}%`}}/></div></div>
                  <div className="sad-health-val" style={{color:i.pct<50?"#ca8a04":"#16a34a"}}>{i.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  </>);
}
