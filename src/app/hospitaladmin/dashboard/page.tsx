"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Activity, ChevronRight,
  Plus, Pencil, Trash2, Filter, Bed, CheckCircle2, AlertTriangle,
  TrendingUp, Stethoscope, ClipboardList, BarChart2, X, CalendarCheck, RefreshCw
} from "lucide-react";

/* ── Mock Data ── */
const mockStaff = [
  { id:"1", name:"Dr. Priya Sharma", role:"DOCTOR", dept:"Cardiology", status:"active", patients:24 },
  { id:"2", name:"Dr. Rajan Mehta", role:"DOCTOR", dept:"Neurology", status:"active", patients:18 },
  { id:"3", name:"Neha Patil", role:"RECEPTIONIST", dept:"Front Desk", status:"active", patients:0 },
  { id:"4", name:"Amit Kumar", role:"STAFF", dept:"Radiology", status:"inactive", patients:0 },
  { id:"5", name:"Dr. Sunita Rao", role:"DOCTOR", dept:"Pediatrics", status:"active", patients:31 },
];
const mockPatients = [
  { id:"P001", name:"Rajesh Verma", age:54, blood:"O+", dept:"Cardiology", date:"20/03/26", gender:"Male", status:"OPD" },
  { id:"P002", name:"Meena Joshi", age:38, blood:"A+", dept:"Neurology", date:"20/03/26", gender:"Female", status:"IPD" },
  { id:"P003", name:"Suresh Das", age:8, blood:"B-", dept:"Pediatrics", date:"20/03/26", gender:"Male", status:"OPD" },
  { id:"P004", name:"Kavita Singh", age:45, blood:"AB+", dept:"Cardiology", date:"19/03/26", gender:"Female", status:"OPD" },
  { id:"P005", name:"Ankit Tiwari", age:29, blood:"O-", dept:"Neurology", date:"18/03/26", gender:"Male", status:"Discharged" },
];
const mockAppointments = [
  { id:"A001", patient:"Rajesh Verma", doctor:"Dr. Priya Sharma", dept:"Cardiology", time:"09:00 AM", status:"confirmed" },
  { id:"A002", patient:"Meena Joshi", doctor:"Dr. Rajan Mehta", dept:"Neurology", time:"09:30 AM", status:"waiting" },
  { id:"A003", patient:"Suresh Das", doctor:"Dr. Sunita Rao", dept:"Pediatrics", time:"10:00 AM", status:"in-progress" },
  { id:"A004", patient:"Kavita Singh", doctor:"Dr. Priya Sharma", dept:"Cardiology", time:"11:00 AM", status:"confirmed" },
  { id:"A005", patient:"Ankit Tiwari", doctor:"Dr. Rajan Mehta", dept:"Neurology", time:"11:30 AM", status:"cancelled" },
];
const barData = [
  { month:"Jan", val:220 }, { month:"Feb", val:180 }, { month:"Mar", val:340 }, { month:"Apr", val:160 },
  { month:"May", val:200 }, { month:"Jun", val:290 }, { month:"Jul", val:310 }, { month:"Aug", val:270 }, { month:"Sep", val:250 },
];
const reports = [
  { icon:<Stethoscope size={14}/>, msg:"Ventilator unit requires inspection in ICU", time:"5 minutes ago", highlight:true },
  { icon:<Settings size={14}/>, msg:"Breakdown in elevator on 2nd floor", time:"18 minutes ago", highlight:false },
  { icon:<AlertTriangle size={14}/>, msg:"Damage reported at the main entrance door", time:"2 hours ago", highlight:false },
];
const doctorAppts = [
  { name:"Cardiology", doctor:"Dr. Priya Sharma", time:"09:00 – 12:00", active:false },
  { name:"Pediatrics", doctor:"Dr. Sunita Rao", time:"10:00 – 13:00", active:true },
  { name:"Neurology", doctor:"Dr. Rajan Mehta", time:"11:00 – 14:00", active:false },
  { name:"Radiology", doctor:"Amit Kumar", time:"02:00 – 05:00", active:false },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_H = ["M","T","W","T","F","S","S"];

function MiniCalendar() {
  const today = new Date();
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const firstDay = new Date(cur.y, cur.m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const isToday = (d: number | null) => d === today.getDate() && cur.m === today.getMonth() && cur.y === today.getFullYear();
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:16, fontWeight:700, color:"#1e293b" }}>{MONTHS[cur.m]} {cur.y}</span>
        <div style={{ display:"flex", gap:4 }}>
          {["‹","›"].map((a,i)=>(
            <button key={i} onClick={()=>setCur(c=>{const nm=c.m+(i?1:-1);return nm<0?{y:c.y-1,m:11}:nm>11?{y:c.y+1,m:0}:{...c,m:nm};})}
              style={{ width:26,height:26,borderRadius:8,border:"none",background:i?"#3b82f6":"#e2e8f0",color:i?"#fff":"#64748b",cursor:"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:6 }}>
        {DAYS_H.map((d,i)=><div key={i} style={{ textAlign:"center",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((d,i)=>(
          <div key={i} style={{ textAlign:"center",fontSize:12,fontWeight:isToday(d)?700:400,padding:"5px 0",borderRadius:8,cursor:d?"pointer":"default",background:isToday(d)?"#3b82f6":"transparent",color:isToday(d)?"#fff":d?"#334155":"transparent",transition:"background .15s" }}>
            {d||""}
          </div>
        ))}
      </div>
    </div>
  );
}

type NavTab = "overview" | "appointments" | "staff" | "patients" | "settings";

export default function HospitalAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<NavTab>("overview");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name:"", email:"", role:"DOCTOR", password:"" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [search, setSearch] = useState("");
  const [apptStats, setApptStats] = useState<any>(null);
  const [patientStats, setPatientStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials:"include" })
      .then(r=>r.json())
      .then(d=>{
        if(!d.success){router.push("/login");return;}
        if(d.data.role==="DOCTOR"){router.push("/doctor/dashboard");return;}
        if(d.data.role==="STAFF"||d.data.role==="RECEPTIONIST"){router.push("/staff/dashboard");return;}
        if(d.data.role!=="HOSPITAL_ADMIN"){router.push("/login");return;}
        setUser(d.data); setLoading(false);
      })
      .catch(()=>router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetch("/api/appointments?stats=true", { credentials:"include" }).then(r=>r.json()).then(d=>{ if(d.success) setApptStats(d.data); });
      fetch("/api/patients?stats=true", { credentials:"include" }).then(r=>r.json()).then(d=>{ if(d.success) setPatientStats(d.data); });
    }
  }, [loading]);

  const logout = async () => { await fetch("/api/auth/logout",{method:"POST",credentials:"include"}); router.push("/login"); };
  const handleAddStaff = async (e:React.FormEvent) => {
    e.preventDefault(); setCreating(true); setCreateMsg("");
    try {
      const res = await fetch("/api/user/create",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(newStaff)});
      const d = await res.json();
      if(d.success){setCreateMsg("✓ Staff added!"); setTimeout(()=>setShowAddStaff(false),1500);}
      else setCreateMsg(d.message||"Failed.");
    } catch { setCreateMsg("Network error."); }
    finally { setCreating(false); }
  };

  const initials = (n:string) => n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  const maxBar = Math.max(...barData.map(b=>b.val));

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",gap:14,color:"#64748b",fontSize:14}}>
      <div style={{width:32,height:32,border:"3px solid #bfdbfe",borderTop:"3px solid #3b82f6",borderRadius:"50%",animation:"sp 0.8s linear infinite"}}/>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      Loading dashboard...
    </div>
  );

  const navItems: { id:NavTab; label:string; icon:React.ReactNode; route?:string }[] = [
    { id:"overview",      label:"Dashboard",     icon:<LayoutDashboard size={16}/> },
    { id:"appointments",  label:"Appointments",  icon:<CalendarDays size={16}/>,  route:"/hospitaladmin/appointments" },
    { id:"staff",         label:"Staff",         icon:<Users size={16}/> },
    { id:"patients",      label:"Patients",      icon:<UserRound size={16}/>, route:"/hospitaladmin/appointments" },
    { id:"settings",      label:"Settings",      icon:<Settings size={16}/> },
  ];

  const todayAppts = apptStats?.today ?? mockAppointments.length;
  const totalPatients = patientStats?.total ?? 412;
  const newPatientsToday = patientStats?.newToday ?? 0;
  const completedAppts = apptStats?.completed ?? 0;

  const stats = [
    { label:"Total Staff",    val:mockStaff.length,   sub:`${mockStaff.filter(s=>s.role==="DOCTOR").length} doctors`,        icon:<Users size={20} color="#fff"/>,       bg:"#eff6ff", iconBg:"#3b82f6" },
    { label:"Total Patients", val:totalPatients,      sub:newPatientsToday>0?`+${newPatientsToday} new today`:"lifetime records", icon:<UserRound size={20} color="#fff"/>,    bg:"#f0fdf4", iconBg:"#10b981" },
    { label:"Today Appointments", val:todayAppts,     sub:`${completedAppts} completed`,                                      icon:<CalendarDays size={20} color="#fff"/>, bg:"#fdf4ff", iconBg:"#a855f7" },
    { label:"Available Beds", val:14,                 sub:"2 ICU, 12 general",                                                icon:<Bed size={20} color="#fff"/>,          bg:"#fff7ed", iconBg:"#f59e0b" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        input,select,button{font-family:'Inter',sans-serif}
        .hd{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0f4f8}
        .hd-sb{width:220px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04)}
        .hd-sb-logo{padding:20px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px}
        .hd-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
        .hd-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .hd-logo-sub{font-size:10px;color:#94a3b8}
        .hd-nav{flex:1;padding:12px 12px;overflow-y:auto}
        .hd-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
        .hd-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .hd-nb:hover{background:#f8fafc;color:#334155}
        .hd-nb.on{background:#eff6ff;color:#2563eb;font-weight:600}
        .hd-nb-dot{display:none;width:3px;border-radius:4px;height:22px;background:#3b82f6;position:absolute;left:0}
        .hd-nb.on .hd-nb-dot{display:block}
        .hd-sb-foot{padding:14px 16px 18px;border-top:1px solid #f1f5f9}
        .hd-user-chip{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:10px}
        .hd-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .hd-uname{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hd-urole{font-size:10px;font-weight:500;color:#3b82f6}
        .hd-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .hd-logout:hover{background:#fee2e2}
        .hd-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .hd-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .hd-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px;transition:border-color .2s}
        .hd-search-wrap:focus-within{border-color:#93c5fd}
        .hd-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .hd-search::placeholder{color:#94a3b8}
        .hd-topbar-right{display:flex;align-items:center;gap:12px}
        .hd-notif{width:36px;height:36px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:background .15s}
        .hd-notif:hover{background:#eff6ff}
        .hd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#ef4444;border:1.5px solid #fff}
        .hd-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer}
        .hd-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
        .hd-profile-name{font-size:12px;font-weight:600;color:#1e293b}
        .hd-profile-role{font-size:10px;color:#64748b}
        .hd-body{display:grid;grid-template-columns:1fr 260px;flex:1;min-height:0}
        .hd-center{padding:22px 20px;overflow-y:auto}
        .hd-right{background:#fff;border-left:1px solid #e2e8f0;padding:22px 18px;overflow-y:auto}
        .hd-pg-title{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
        .hd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        @media(max-width:1100px){.hd-stats{grid-template-columns:repeat(2,1fr)}}
        .hd-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04);transition:transform .2s,box-shadow .2s;cursor:default}
        .hd-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.08)}
        .hd-sc-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .hd-sc-lbl{font-size:11px;font-weight:500;color:#94a3b8;margin-bottom:2px}
        .hd-sc-val{font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
        .hd-sc-sub{font-size:10px;color:#94a3b8;margin-top:3px}
        .hd-mid{display:grid;grid-template-columns:1fr 220px;gap:14px;margin-bottom:18px}
        .hd-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);overflow:hidden}
        .hd-card-head{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .hd-card-title{font-size:14px;font-weight:700;color:#1e293b}
        .hd-card-sub{font-size:11px;color:#94a3b8;margin-top:2px}
        .hd-card-body{padding:16px 18px}
        .hd-card-icon-btn{width:28px;height:28px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:background .15s}
        .hd-card-icon-btn:hover{background:#eff6ff;color:#3b82f6}
        .hd-chart{display:flex;align-items:flex-end;gap:10px;height:140px}
        .hd-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1}
        .hd-bar{width:100%;border-radius:6px 6px 0 0;transition:opacity .2s;cursor:pointer;min-width:18px}
        .hd-bar:hover{opacity:.8}
        .hd-bar-lbl{font-size:10px;color:#94a3b8;font-weight:500}
        .hd-report-item{padding:10px;border-radius:10px;margin-bottom:8px;cursor:pointer}
        .hd-ri-msg{font-size:12px;font-weight:500;color:#334155;line-height:1.4}
        .hd-ri-time{font-size:10px;color:#94a3b8;margin-top:4px}
        .hd-tbl-wrap{overflow-x:auto}
        .hd-tbl{width:100%;border-collapse:collapse;min-width:500px}
        .hd-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .hd-tbl td{padding:11px 12px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .hd-tbl tr:last-child td{border-bottom:none}
        .hd-tbl tbody tr:hover td{background:#fafbfc}
        .hd-td-name{font-weight:600;color:#1e293b}
        .hd-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap}
        .hd-right-sec{margin-bottom:22px}
        .hd-right-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px}
        .hd-appt-item{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;cursor:pointer;transition:all .15s;background:#fff}
        .hd-appt-item.active{background:#3b82f6;border-color:#3b82f6}
        .hd-appt-item.active .hd-appt-name{color:#fff}
        .hd-appt-item.active .hd-appt-doc{color:rgba(255,255,255,0.75)}
        .hd-appt-item.active .hd-appt-time{color:rgba(255,255,255,0.7)}
        .hd-appt-ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#eff6ff}
        .hd-appt-item.active .hd-appt-ic{background:rgba(255,255,255,0.18)}
        .hd-appt-name{font-size:13px;font-weight:700;color:#1e293b;flex:1}
        .hd-appt-doc{font-size:11px;color:#64748b;margin-top:1px}
        .hd-appt-time{font-size:10px;color:#94a3b8;white-space:nowrap}
        .hd-btn-primary{padding:8px 16px;border-radius:9px;border:none;background:#3b82f6;color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;box-shadow:0 4px 12px rgba(59,130,246,0.25)}
        .hd-btn-primary:hover{background:#2563eb;transform:translateY(-1px)}
        .hd-filter-btn{padding:6px 14px;border-radius:8px;background:#f1f5f9;border:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px}
        .hd-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .hd-modal{background:#fff;border-radius:18px;padding:28px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .hd-modal-title{font-size:18px;font-weight:800;color:#1e293b;margin-bottom:4px}
        .hd-modal-sub{font-size:13px;color:#64748b;margin-bottom:20px}
        .hd-mf{margin-bottom:13px}
        .hd-ml{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:5px}
        .hd-mi{width:100%;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s}
        .hd-mi:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,0.25)}
        .hd-mi::placeholder{color:#94a3b8}
        .hd-ma{display:flex;gap:10px;margin-top:18px}
        .hd-mcancel{flex:1;padding:10px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer}
        .hd-mcancel:hover{background:#f8fafc}
        .hd-msubmit{flex:2;padding:10px;border-radius:9px;border:none;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,0.25)}
        .hd-msubmit:disabled{opacity:.55;cursor:not-allowed}
        .hd-spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite}
        @keyframes sp{to{transform:rotate(360deg)}}
        .hd-msg-ok{font-size:12px;color:#10b981;margin-top:8px;text-align:center;font-weight:600}
        .hd-msg-err{font-size:12px;color:#ef4444;margin-top:8px;text-align:center}
        .mb16{margin-bottom:16px}
      `}</style>

      {showAddStaff && (
        <div className="hd-modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowAddStaff(false)}}>
          <div className="hd-modal">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div className="hd-modal-title">Add Staff Member</div>
              <button onClick={()=>setShowAddStaff(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:4}}><X size={18}/></button>
            </div>
            <div className="hd-modal-sub">Create a new user within your hospital.</div>
            <form onSubmit={handleAddStaff}>
              {[{key:"name",lbl:"Full Name",ph:"Dr. John Doe"},{key:"email",lbl:"Email",ph:"doctor@hospital.com"},{key:"password",lbl:"Password",ph:"Min 6 characters"}].map(f=>(
                <div key={f.key} className="hd-mf">
                  <label className="hd-ml">{f.lbl}</label>
                  <input type={f.key==="password"?"password":"text"} className="hd-mi" placeholder={f.ph} value={(newStaff as any)[f.key]} onChange={e=>setNewStaff(n=>({...n,[f.key]:e.target.value}))} required/>
                </div>
              ))}
              <div className="hd-mf">
                <label className="hd-ml">Role</label>
                <select className="hd-mi" style={{cursor:"pointer"}} value={newStaff.role} onChange={e=>setNewStaff(n=>({...n,role:e.target.value}))}>
                  <option value="DOCTOR">Doctor</option><option value="RECEPTIONIST">Receptionist</option><option value="STAFF">Staff</option>
                </select>
              </div>
              {createMsg && <div className={createMsg.startsWith("✓")?"hd-msg-ok":"hd-msg-err"}>{createMsg}</div>}
              <div className="hd-ma">
                <button type="button" className="hd-mcancel" onClick={()=>setShowAddStaff(false)}>Cancel</button>
                <button type="submit" className="hd-msubmit" disabled={creating}>{creating?<span className="hd-spin"/>:"Add Staff Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hd">
        <aside className="hd-sb">
          <div className="hd-sb-logo">
            <div className="hd-logo-ic"><Stethoscope size={18} color="white"/></div>
            <div><div className="hd-logo-tx">MediCare+</div><div className="hd-logo-sub">Hospital Admin</div></div>
          </div>
          <nav className="hd-nav">
            <div className="hd-nav-sec">General</div>
            {navItems.slice(0,4).map(n=>(
              <button key={n.id} className={`hd-nb${tab===n.id?" on":""}`} onClick={()=>n.route?router.push(n.route):setTab(n.id)} style={{position:"relative"}}>
                {tab===n.id && <div className="hd-nb-dot"/>}
                <span style={{color:tab===n.id?"#2563eb":"#94a3b8",display:"flex"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div className="hd-nav-sec">System</div>
            {navItems.slice(4).map(n=>(
              <button key={n.id} className={`hd-nb${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)} style={{position:"relative"}}>
                {tab===n.id && <div className="hd-nb-dot"/>}
                <span style={{color:tab===n.id?"#2563eb":"#94a3b8",display:"flex"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <button className="hd-nb" onClick={()=>router.push("/hospitaladmin/configure")}>
              <span style={{color:"#94a3b8",display:"flex"}}><Building2 size={16}/></span>
              Configure Hospital
            </button>
            <button className="hd-nb">
              <span style={{color:"#94a3b8",display:"flex"}}><HelpCircle size={16}/></span>
              Support
            </button>
          </nav>
          <div className="hd-sb-foot">
            <div className="hd-user-chip">
              <div className="hd-av">{user?.name ? initials(user.name) : "HA"}</div>
              <div style={{overflow:"hidden"}}>
                <div className="hd-uname">{user?.name || "Hospital Admin"}</div>
                <div className="hd-urole">Hospital Admin</div>
              </div>
            </div>
            <button className="hd-logout" onClick={logout}>
              <LogOut size={13}/> Log Out
            </button>
          </div>
        </aside>

        <main className="hd-main">
          <header className="hd-topbar">
            <div className="hd-search-wrap">
              <Search size={14} color="#94a3b8"/>
              <input className="hd-search" placeholder="What are you searching..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="hd-topbar-right">
              <div className="hd-notif"><Bell size={16} color="#64748b"/><span className="hd-notif-dot"/></div>
              <div className="hd-notif"><MessageSquare size={16} color="#64748b"/></div>
              <div className="hd-profile">
                <div className="hd-profile-av">{user?.name ? initials(user.name) : "HA"}</div>
                <div><div className="hd-profile-name">{user?.name?.split(" ")[0] || "Admin"}</div><div className="hd-profile-role">Hosp. Admin</div></div>
              </div>
            </div>
          </header>

          <div className="hd-body">
            <div className="hd-center">
              {tab === "overview" && (<>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                  <div className="hd-pg-title" style={{marginBottom:0}}>Dashboard</div>
                  <button className="hd-filter-btn"><Filter size={12}/>This Week<ChevronRight size={12}/></button>
                </div>
                <div className="hd-stats">
                  {stats.map((s,i)=>(
                    <div key={i} className="hd-sc" style={{background:s.bg}}>
                      <div className="hd-sc-icon" style={{background:s.iconBg}}>{s.icon}</div>
                      <div><div className="hd-sc-lbl">{s.label}</div><div className="hd-sc-val">{s.val}</div><div className="hd-sc-sub">{s.sub}</div></div>
                    </div>
                  ))}
                </div>
                <div className="hd-mid">
                  <div className="hd-card">
                    <div className="hd-card-head">
                      <div><div className="hd-card-title">Patient Activity</div><div className="hd-card-sub">Monthly OPD visits</div></div>
                      <div className="hd-card-icon-btn"><BarChart2 size={14}/></div>
                    </div>
                    <div className="hd-card-body">
                      <div style={{display:"flex",alignItems:"flex-end",gap:0}}>
                        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",height:140,paddingRight:8,alignItems:"flex-end"}}>
                          {[500,400,300,200,100,0].map(v=><span key={v} style={{fontSize:9,color:"#cbd5e1",lineHeight:1}}>{v}</span>)}
                        </div>
                        <div className="hd-chart" style={{flex:1}}>
                          {barData.map((b,i)=>(
                            <div key={i} className="hd-bar-wrap">
                              <div className="hd-bar" style={{height:`${(b.val/maxBar)*130}px`,background:i===2||i===6?"linear-gradient(180deg,#3b82f6,#60a5fa)":"linear-gradient(180deg,#bfdbfe,#dbeafe)"}}/>
                              <span className="hd-bar-lbl">{b.month}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hd-card">
                    <div className="hd-card-head">
                      <div className="hd-card-title">Reports</div>
                      <div className="hd-card-icon-btn"><Activity size={14}/></div>
                    </div>
                    <div className="hd-card-body" style={{padding:"12px 14px"}}>
                      {reports.map((r,i)=>(
                        <div key={i} className="hd-report-item" style={{background:r.highlight?"linear-gradient(135deg,#3b82f6,#1d4ed8)":"#f8fafc",border:r.highlight?"none":"1px solid #f1f5f9",marginBottom:8}}>
                          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                            <span style={{marginTop:1,color:r.highlight?"#fff":"#3b82f6",display:"flex",flexShrink:0}}>{r.icon}</span>
                            <div>
                              <div className="hd-ri-msg" style={{color:r.highlight?"#fff":"#334155"}}>{r.msg}</div>
                              <div className="hd-ri-time" style={{color:r.highlight?"rgba(255,255,255,0.65)":"#94a3b8"}}>{r.time}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hd-card mb16">
                  <div className="hd-card-head">
                    <div><div className="hd-card-title">Latest Patient Data</div><div className="hd-card-sub">{mockPatients.length} recent records</div></div>
                    <button className="hd-card-icon-btn" onClick={()=>setTab("patients")}><ChevronRight size={14}/></button>
                  </div>
                  <div className="hd-tbl-wrap">
                    <table className="hd-tbl">
                      <thead><tr><th>No</th><th>Date In</th><th>Name</th><th>Age</th><th>Blood</th><th>Gender</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {mockPatients.map((p,i)=>(
                          <tr key={p.id}>
                            <td style={{color:"#94a3b8",fontSize:12}}>0{i+1}</td>
                            <td style={{fontSize:12}}>{p.date}</td>
                            <td className="hd-td-name">{p.name}</td>
                            <td>{p.age}</td>
                            <td><span style={{color:"#ef4444",fontWeight:700}}>{p.blood}</span></td>
                            <td>{p.gender}</td>
                            <td><span className="hd-badge" style={p.status==="IPD"?{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}:p.status==="Discharged"?{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe"}:{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}}>{p.status}</span></td>
                            <td>
                              <div style={{display:"flex",gap:6}}>
                                <button className="hd-card-icon-btn" style={{background:"#eff6ff",color:"#3b82f6",border:"none"}}><Pencil size={12}/></button>
                                <button className="hd-card-icon-btn" style={{background:"#fff5f5",color:"#ef4444",border:"none"}}><Trash2 size={12}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>)}

              {tab==="appointments" && (
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",borderRadius:16,padding:"28px 28px",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:22,fontWeight:800,marginBottom:6,display:"flex",alignItems:"center",gap:10}}><CalendarCheck size={24}/>Appointment Management</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,.75)",maxWidth:440}}>Book appointments, manage follow-ups, and view your full patient registry in the dedicated module.</div>
                    </div>
                    <button onClick={()=>router.push("/hospitaladmin/appointments")} style={{padding:"12px 24px",borderRadius:12,border:"none",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8}}>
                      Open Module <ChevronRight size={16}/>
                    </button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    {[
                      {label:"Book Appointment",desc:"Search patient + pick doctor + select slot",color:"#3b82f6",bg:"#eff6ff",path:"/hospitaladmin/appointments",icon:<CalendarCheck size={18}/>},
                      {label:"Follow-up Dashboard",desc:"Track pending, overdue and completed follow-ups",color:"#10b981",bg:"#f0fdf4",path:"/hospitaladmin/appointments",icon:<RefreshCw size={18}/>},
                      {label:"Patient Registry",desc:"View full patient history and profiles",color:"#7c3aed",bg:"#f5f3ff",path:"/hospitaladmin/appointments",icon:<Users size={18}/>},
                    ].map((card)=>(
                      <button key={card.label} onClick={()=>router.push(card.path)}
                        style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"18px 20px",cursor:"pointer",textAlign:"left",transition:"all .15s",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                        <div style={{width:40,height:40,borderRadius:11,background:card.bg,display:"flex",alignItems:"center",justifyContent:"center",color:card.color,marginBottom:12}}>{card.icon}</div>
                        <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:4}}>{card.label}</div>
                        <div style={{fontSize:12,color:"#94a3b8"}}>{card.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab==="staff" && (
                <div className="hd-card mb16">
                  <div className="hd-card-head">
                    <div><div className="hd-card-title">Staff Registry</div><div className="hd-card-sub">{mockStaff.length} members</div></div>
                    <button className="hd-btn-primary" onClick={()=>{setShowAddStaff(true);setCreateMsg("");}}><Plus size={14}/>Add Staff</button>
                  </div>
                  <div className="hd-tbl-wrap">
                    <table className="hd-tbl">
                      <thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>Patients</th><th>Status</th></tr></thead>
                      <tbody>
                        {mockStaff.map(s=>(
                          <tr key={s.id}>
                            <td>
                              <div style={{display:"flex",alignItems:"center",gap:9}}>
                                <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(s.name)}</div>
                                <span className="hd-td-name">{s.name}</span>
                              </div>
                            </td>
                            <td><span className="hd-badge" style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe"}}>{s.role.replace("_"," ")}</span></td>
                            <td>{s.dept}</td>
                            <td>{s.patients||"—"}</td>
                            <td><span className="hd-badge" style={s.status==="active"?{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}:{background:"#fff5f5",color:"#ef4444",border:"1px solid #fecaca"}}>{s.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab==="patients" && (
                <div style={{background:"linear-gradient(135deg,#7c3aed,#4c1d95)",borderRadius:16,padding:"28px 28px",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:22,fontWeight:800,marginBottom:6,display:"flex",alignItems:"center",gap:10}}><Users size={24}/>Patient Registry</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,.75)"}}>Manage lifetime patient records, view appointment history, and schedule follow-ups.</div>
                  </div>
                  <button onClick={()=>router.push("/hospitaladmin/appointments")} style={{padding:"12px 24px",borderRadius:12,border:"none",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:8}}>
                    Open Module <ChevronRight size={16}/>
                  </button>
                </div>
              )}

              {tab==="settings" && (
                <div className="hd-card mb16">
                  <div className="hd-card-head"><div className="hd-card-title">System Settings</div></div>
                  <div className="hd-card-body">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {[["Hospital Name",user?.hospital?.name||"—"],["Admin Email",user?.email||"—"],["Timezone","IST (UTC+5:30)"],["Auth","JWT + HTTP-only Cookies"],["Session TTL","7 Days"],["DB","MySQL — TiDB Cloud"]].map(([k,v])=>(
                        <div key={k} style={{padding:"14px 16px",borderRadius:11,background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{k}</div>
                          <div style={{fontSize:13,fontWeight:600,color:"#334155"}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="hd-right">
              <div className="hd-right-sec">
                <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Date</div>
                <MiniCalendar/>
              </div>
              <div className="hd-right-sec" style={{marginTop:22}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div className="hd-right-title">Doctors on Duty</div>
                  <div className="hd-card-icon-btn" style={{cursor:"pointer"}}><BarChart2 size={12}/></div>
                </div>
                {doctorAppts.map((d,i)=>(
                  <div key={i} className={`hd-appt-item${d.active?" active":""}`}>
                    <div className="hd-appt-ic">
                      <Stethoscope size={17} color={d.active?"#fff":"#3b82f6"}/>
                    </div>
                    <div style={{flex:1,overflow:"hidden"}}>
                      <div className="hd-appt-name">{d.name}</div>
                      <div className="hd-appt-doc">{d.doctor}</div>
                      <div className="hd-appt-time">{d.time}</div>
                    </div>
                    <ChevronRight size={14} color={d.active?"rgba(255,255,255,0.7)":"#94a3b8"}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
