"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Users, Stethoscope, LogOut, Search,
  Bell, HelpCircle, ChevronRight, AlertTriangle,
  Pill, BarChart2, UserRound, Activity, Loader2,
  PlayCircle, CheckCircle2, X, FileText, Clock, RefreshCw,
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const barData = [
  {month:"Jan",val:14},{month:"Feb",val:18},{month:"Mar",val:24},{month:"Apr",val:19},{month:"May",val:22},{month:"Jun",val:16},{month:"Jul",val:20},{month:"Aug",val:28},{month:"Sep",val:24},
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_H = ["M","T","W","T","F","S","S"];

// ─── Appointment type / status helpers ───
const TYPE_LABEL: Record<string, string> = {
  OPD: "OPD", ONLINE: "Online", FOLLOW_UP: "Follow-up", EMERGENCY: "Emergency",
};
const STATUS_CFG: Record<string, { label: string; dot: string; badge: [string, string, string] }> = {
  SCHEDULED:   { label: "Scheduled",   dot: "#94a3b8", badge: ["#f8fafc",   "#475569",  "#e2e8f0"] },
  CONFIRMED:   { label: "Confirmed",   dot: "#10b981", badge: ["#f0fdf4",   "#16a34a",  "#bbf7d0"] },
  IN_PROGRESS: { label: "In Progress", dot: "#3b82f6", badge: ["#eff6ff",   "#2563eb",  "#bfdbfe"] },
  COMPLETED:   { label: "Completed",   dot: "#059669", badge: ["#f0fdf4",   "#059669",  "#a7f3d0"] },
  CANCELLED:   { label: "Cancelled",   dot: "#ef4444", badge: ["#fff5f5",   "#ef4444",  "#fecaca"] },
  NO_SHOW:     { label: "No Show",     dot: "#f97316", badge: ["#fff7ed",   "#c2410c",  "#fed7aa"] },
  RESCHEDULED: { label: "Rescheduled", dot: "#a855f7", badge: ["#faf5ff",   "#7c3aed",  "#e9d5ff"] },
};

// ─── Consult Modal ───
function ConsultModal({ appt, onClose, onDone }: { appt: any; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState(appt.notes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const update = async (status: string) => {
    setSaving(true);
    const d = await api(`/api/appointments/${appt.id}`, "PUT", { status, notes: notes || undefined });
    if (d.success) { onDone(); onClose(); }
    else setMsg(d.message || "Failed to update");
    setSaving(false);
  };

  const sc = STATUS_CFG[appt.status] || STATUS_CFG.SCHEDULED;
  const patientName = appt.patient?.name || "Patient";
  const apptDate = new Date(appt.appointmentDate);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Patient Consultation</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{apptDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {appt.timeSlot}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><X size={14} /></button>
        </div>

        {/* Patient Card */}
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 18, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{patientName}</div>
              <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 8, marginTop: 2 }}>
                <span>{appt.patient?.patientId}</span>
                {appt.patient?.phone && <><span>·</span><span>{appt.patient.phone}</span></>}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 100, background: sc.badge[0], color: sc.badge[1], border: `1px solid ${sc.badge[2]}`, fontWeight: 700 }}>{sc.label}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {[
              ["Type", TYPE_LABEL[appt.type] || appt.type],
              ["Token", appt.tokenNumber ? `#${appt.tokenNumber}` : "—"],
              ["Fee", appt.consultationFee ? `₹${appt.consultationFee}` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: "#fff", borderRadius: 9, padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Consultation Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Diagnosis, prescription, follow-up instructions..."
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
        </div>

        {msg && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10, fontWeight: 600 }}>{msg}</div>}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {appt.status === "SCHEDULED" || appt.status === "CONFIRMED" ? (
            <button onClick={() => update("IN_PROGRESS")} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <PlayCircle size={15} />}
              Start Consultation
            </button>
          ) : null}
          {appt.status === "IN_PROGRESS" ? (
            <button onClick={() => update("COMPLETED")} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(16,185,129,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={15} />}
              Mark Complete
            </button>
          ) : null}
          {appt.status === "COMPLETED" && (
            <button onClick={() => update("COMPLETED")} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, background: "#f0fdf4", color: "#059669", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1.5px solid #bbf7d0" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : "Update Notes"}
            </button>
          )}
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
            <button onClick={() => update("NO_SHOW")} disabled={saving}
              style={{ padding: "11px 16px", borderRadius: 11, border: "1.5px solid #fed7aa", background: "#fff7ed", color: "#c2410c", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              No Show
            </button>
          )}
        </div>

        {appt.patient?.id && (
          <a href={`/hospitaladmin/patients/${appt.patient.id}`} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, fontSize: 12, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
            <FileText size={12} />View Full Patient Profile
          </a>
        )}
      </div>
    </div>
  );
}

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

type Tab = "schedule"|"patients";

function getDeptAccent(deptName?: string): string {
  if (!deptName) return "#10b981";
  const n = deptName.toLowerCase();
  if (n.includes("cardio")) return "#ef4444";
  if (n.includes("neuro")) return "#8b5cf6";
  if (n.includes("ortho")) return "#f59e0b";
  if (n.includes("pedia") || n.includes("child")) return "#3b82f6";
  if (n.includes("gyne") || n.includes("obs")) return "#ec4899";
  if (n.includes("onco") || n.includes("cancer")) return "#6366f1";
  if (n.includes("derma") || n.includes("skin")) return "#14b8a6";
  if (n.includes("ophthal") || n.includes("eye")) return "#0ea5e9";
  if (n.includes("ent") || n.includes("ear")) return "#f97316";
  if (n.includes("surgery") || n.includes("surgical")) return "#dc2626";
  if (n.includes("radio") || n.includes("imaging")) return "#7c3aed";
  if (n.includes("emergency") || n.includes("icu")) return "#ef4444";
  return "#10b981";
}

const TODAY = new Date().toISOString().split("T")[0];

export default function DoctorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("schedule");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [consultAppt, setConsultAppt] = useState<any>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);

  const fetchAppointments = useCallback(async (doctorId: string) => {
    setLoadingAppts(true);
    const d = await api(`/api/appointments?doctorId=${doctorId}&date=${TODAY}&limit=50&sortBy=timeSlot&sortOrder=asc`);
    if (d.success) setAppointments(d.data?.data || []);
    setLoadingAppts(false);
  }, []);

  const fetchAllPatients = useCallback(async (doctorId: string) => {
    const d = await api(`/api/appointments?doctorId=${doctorId}&limit=200&sortBy=appointmentDate&sortOrder=desc`);
    if (d.success) {
      const seen = new Set<string>();
      const unique: any[] = [];
      for (const a of (d.data?.data || [])) {
        if (a.patient && !seen.has(a.patient.id)) {
          seen.add(a.patient.id);
          unique.push({ ...a.patient, lastVisit: a.appointmentDate, lastType: a.type });
        }
      }
      setAllPatients(unique);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { router.push("/login"); return; }
        // Role-based redirect: only DOCTOR may access this dashboard
        const role = d.data.role;
        if (role === "HOSPITAL_ADMIN") { router.push("/hospitaladmin/dashboard"); return; }
        if (role === "STAFF" || role === "RECEPTIONIST") { router.push("/staff/dashboard"); return; }
        if (role === "SUPER_ADMIN") { router.push("/superadmin/dashboard"); return; }
        if (role === "SUB_DEPT_HEAD") { router.push("/subdept/dashboard"); return; }
        if (role !== "DOCTOR") { router.push("/login"); return; }
        fetch("/api/doctor/attendance", { method: "POST", credentials: "include" }).catch(() => {});
        return fetch("/api/doctor/me", { credentials: "include" });
      })
      .then(r => r?.json())
      .then(d => {
        if (d?.success) {
          setDoctor(d.data);
          fetchAppointments(d.data.id);
          fetchAllPatients(d.data.id);
        }
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router, fetchAppointments, fetchAllPatients]);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); router.push("/login"); }; // login is the general hospital login
  const initials = (n: string) => n.split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase();
  const maxBar = Math.max(...barData.map(b => b.val));
  const accent = getDeptAccent(doctor?.department?.name);
  const deptName = doctor?.department?.name || "General";
  const doctorName = doctor?.name || "Doctor";

  // Derived stats
  const todayTotal = appointments.length;
  const todayDone = appointments.filter(a => a.status === "COMPLETED").length;
  const todayRemaining = appointments.filter(a => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)).length;
  const inProgress = appointments.find(a => a.status === "IN_PROGRESS");

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", fontSize: 14, gap: 14 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #bbf7d0", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "sp .8s linear infinite" }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>Loading Doctor Portal...
    </div>
  );

  const navItems = [
    { id: "schedule" as Tab, label: "Today's Schedule", icon: <CalendarDays size={16} /> },
    { id: "patients" as Tab, label: "My Patients",      icon: <UserRound size={16} /> },
  ];

  return (<>
    {consultAppt && (
      <ConsultModal
        appt={consultAppt}
        onClose={() => setConsultAppt(null)}
        onDone={() => doctor && fetchAppointments(doctor.id)}
      />
    )}
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f0fdf4}::-webkit-scrollbar-thumb{background:#a7f3d0;border-radius:4px}
      input,select,button,textarea{font-family:'Inter',sans-serif}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      .doc{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0fdf9}
      .doc-sb{width:220px;background:#fff;border-right:1px solid #d1fae5;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(16,185,129,0.06)}
      .doc-logo{padding:20px 20px 16px;border-bottom:1px solid #ecfdf5;display:flex;align-items:center;gap:10px}
      .doc-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.3)}
      .doc-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
      .doc-logo-sub{font-size:10px;color:#94a3b8;margin-top:0px}
      .doc-nav{flex:1;padding:12px 12px;overflow-y:auto}
      .doc-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:12px 0 6px}
      .doc-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
      .doc-nb:hover{background:#f0fdf4;color:#047857}
      .doc-nb.on{background:var(--dept-bg,#d1fae5);color:var(--dept-accent,#059669);font-weight:600}
      .doc-nb-dot{display:none;width:3px;height:20px;background:#10b981;border-radius:4px;position:absolute;left:0}
      .doc-nb.on .doc-nb-dot{display:block}
      .doc-nb svg{color:#94a3b8;flex-shrink:0}
      .doc-nb.on svg{color:var(--dept-accent,#059669)}
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

    <div className="doc" style={{'--dept-accent':accent,'--dept-bg':accent+'22'} as any}>
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
            {doctor?.profileImage
              ? <img src={doctor.profileImage} alt={doctorName} style={{width:32,height:32,borderRadius:9,objectFit:"cover"}}/>
              : <div className="doc-av" style={{background:`linear-gradient(135deg,${accent},#3b82f6)`}}>{initials(doctorName)}</div>
            }
            <div><div className="doc-uname">{doctorName}</div><div className="doc-urole" style={{color:accent}}>Doctor · {deptName}</div></div>
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
              {doctor?.profileImage
                ? <img src={doctor.profileImage} alt={doctorName} style={{width:30,height:30,borderRadius:8,objectFit:"cover"}}/>
                : <div className="doc-profile-av" style={{background:`linear-gradient(135deg,${accent},#3b82f6)`}}>{initials(doctorName)}</div>
              }
              <div><div className="doc-profile-name">{doctorName.split(" ")[0]}</div><div className="doc-profile-role" style={{color:accent}}>{deptName}</div></div>
            </div>
          </div>
        </header>

        <div className="doc-body">
          <div className="doc-center">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div className="doc-pg-title" style={{marginBottom:0}}>Good morning, Dr. {doctorName.split(" ").slice(-1)[0]} 👋</div>
              <span style={{fontSize:12,color:"#64748b",background:"#f0fdf4",border:"1px solid #d1fae5",padding:"5px 12px",borderRadius:8,fontWeight:500}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long"})}</span>
            </div>

            {/* Stats */}
            <div className="doc-stats">
              {[
                {icon:<CalendarDays size={20} color="#fff"/>, label:"Today's Appointments", val:todayTotal,     sub:`${todayRemaining} remaining`,  bg:"#eff6ff", iconBg:"#3b82f6"},
                {icon:<CheckCircle2 size={20} color="#fff"/>, label:"Completed",            val:todayDone,      sub:"today so far",                  bg:"#f0fdf4", iconBg:"#10b981"},
                {icon:<Clock size={20} color="#fff"/>,        label:"Remaining",            val:todayRemaining, sub:"scheduled / confirmed",         bg:"#fff7ed", iconBg:"#f59e0b"},
                {icon:<UserRound size={20} color="#fff"/>,    label:"Total Patients",       val:allPatients.length, sub:"all time",                  bg:"#fdf4ff", iconBg:"#a855f7"},
              ].map((s,i)=>(
                <div key={i} className="doc-sc" style={{background:s.bg}}>
                  <div className="doc-sc-icon" style={{background:s.iconBg}}>{s.icon}</div>
                  <div><div className="doc-sc-lbl">{s.label}</div><div className="doc-sc-val">{s.val}</div><div className="doc-sc-sub">{s.sub}</div></div>
                </div>
              ))}
            </div>

            {/* In-Progress Banner */}
            {inProgress && (
              <div style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",borderRadius:14,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",color:"#fff"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"pulse 1.5s ease-in-out infinite"}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:700}}>Consultation in progress — {inProgress.patient?.name}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,.75)"}}>Token #{inProgress.tokenNumber} · {inProgress.timeSlot} · {TYPE_LABEL[inProgress.type]}</div>
                  </div>
                </div>
                <button onClick={()=>setConsultAppt(inProgress)}
                  style={{padding:"8px 16px",borderRadius:9,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  Continue →
                </button>
              </div>
            )}

            {/* Schedule Tab */}
            {tab==="schedule" && (
              <div className="doc-card">
                <div className="doc-card-head">
                  <div>
                    <div className="doc-card-title">Today's Appointments</div>
                    <div className="doc-card-sub">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</div>
                  </div>
                  <button onClick={()=>doctor && fetchAppointments(doctor.id)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1px solid #d1fae5",background:"#f0fdf4",color:"#059669",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    <RefreshCw size={12}/>Refresh
                  </button>
                </div>
                {loadingAppts ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"40px 0",color:"#94a3b8"}}>
                    <Loader2 size={18} style={{animation:"spin .7s linear infinite"}}/>Loading appointments...
                  </div>
                ) : appointments.length === 0 ? (
                  <div style={{textAlign:"center",padding:"48px 20px",color:"#94a3b8"}}>
                    <CalendarDays size={32} style={{marginBottom:10,opacity:.4}}/>
                    <div style={{fontSize:14,fontWeight:600,color:"#64748b"}}>No appointments today</div>
                    <div style={{fontSize:12,marginTop:4}}>Your schedule is clear for today</div>
                  </div>
                ) : (
                  <table className="doc-tbl">
                    <thead><tr><th>Token</th><th>Time</th><th>Patient</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {appointments.map((a:any)=>{
                        const sc = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
                        const canConsult = ["SCHEDULED","CONFIRMED","IN_PROGRESS"].includes(a.status);
                        return (
                          <tr key={a.id}>
                            <td><span style={{fontFamily:"monospace",fontWeight:700,color:"#0369a1",background:"#f0f9ff",padding:"3px 8px",borderRadius:6,fontSize:12}}>#{a.tokenNumber||"—"}</span></td>
                            <td style={{fontWeight:600,color:"#334155"}}>{a.timeSlot}</td>
                            <td>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${accent},#0ea5e9)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11,flexShrink:0}}>
                                  {(a.patient?.name||"?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{fontWeight:600,color:"#1e293b",fontSize:13}}>{a.patient?.name||"—"}</div>
                                  <div style={{fontSize:10,color:"#94a3b8"}}>{a.patient?.patientId}</div>
                                </div>
                              </div>
                            </td>
                            <td><span style={{fontSize:11,background:"#f1f5f9",color:"#475569",padding:"3px 8px",borderRadius:6,fontWeight:600}}>{TYPE_LABEL[a.type]||a.type}</span></td>
                            <td><span className="doc-badge" style={{background:sc.badge[0],color:sc.badge[1],border:`1px solid ${sc.badge[2]}`}}>{sc.label}</span></td>
                            <td>
                              {canConsult ? (
                                <button onClick={()=>setConsultAppt(a)}
                                  style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"none",background:a.status==="IN_PROGRESS"?"linear-gradient(135deg,#3b82f6,#2563eb)":"linear-gradient(135deg,#10b981,#059669)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:a.status==="IN_PROGRESS"?"0 3px 10px rgba(59,130,246,.3)":"0 3px 10px rgba(16,185,129,.3)"}}>
                                  <PlayCircle size={12}/>{a.status==="IN_PROGRESS"?"Continue":"Consult"}
                                </button>
                              ) : (
                                <span style={{fontSize:11,color:"#94a3b8"}}>{a.status==="COMPLETED"?"Done":"—"}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Patients Tab */}
            {tab==="patients" && (
              <div className="doc-card">
                <div className="doc-card-head">
                  <div><div className="doc-card-title">My Patients</div><div className="doc-card-sub">{allPatients.length} unique patients</div></div>
                </div>
                {allPatients.length === 0 ? (
                  <div style={{textAlign:"center",padding:"48px 20px",color:"#94a3b8"}}>
                    <UserRound size={32} style={{marginBottom:10,opacity:.4}}/>
                    <div style={{fontSize:14,fontWeight:600,color:"#64748b"}}>No patients yet</div>
                  </div>
                ) : (
                  <table className="doc-tbl">
                    <thead><tr><th>Patient ID</th><th>Name</th><th>Phone</th><th>Gender</th><th>Last Visit</th><th>Last Type</th><th></th></tr></thead>
                    <tbody>
                      {allPatients.map((p:any)=>(
                        <tr key={p.id}>
                          <td><span style={{fontFamily:"monospace",fontWeight:700,color:"#0369a1",background:"#f0f9ff",padding:"3px 8px",borderRadius:6,fontSize:11}}>{p.patientId}</span></td>
                          <td style={{fontWeight:600,color:"#1e293b"}}>{p.name}</td>
                          <td style={{color:"#64748b"}}>{p.phone||"—"}</td>
                          <td>{p.gender ? <span style={{fontSize:10,background:"#f1f5f9",color:"#475569",padding:"3px 7px",borderRadius:100,fontWeight:600}}>{p.gender}</span> : "—"}</td>
                          <td style={{fontSize:12,color:"#64748b"}}>{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—"}</td>
                          <td>{p.lastType ? <span style={{fontSize:10,background:"#f1f5f9",color:"#475569",padding:"3px 7px",borderRadius:6,fontWeight:600}}>{TYPE_LABEL[p.lastType]||p.lastType}</span> : "—"}</td>
                          <td>
                            <a href={`/hospitaladmin/patients/${p.id}`} target="_blank" rel="noreferrer"
                              style={{fontSize:11,color:"#3b82f6",fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",gap:3}}>
                              Profile <ChevronRight size={11}/>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          <div className="doc-right">
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Date</div>
              <MiniCalendar accent={accent}/>
            </div>
            <div>
              <div className="doc-right-title" style={{marginBottom:10}}>Today's Queue</div>
              {appointments.length === 0 ? (
                <div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"16px 0"}}>No appointments today</div>
              ) : appointments.slice(0,6).map((a:any)=>{
                const sc = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
                return (
                  <div key={a.id} className="doc-critical-card" style={{background:a.status==="IN_PROGRESS"?"#eff6ff":a.status==="COMPLETED"?"#f0fdf4":"#f8fafc",border:`1px solid ${a.status==="IN_PROGRESS"?"#bfdbfe":a.status==="COMPLETED"?"#bbf7d0":"#e2e8f0"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{a.patient?.name||"—"}</div>
                      <span className="doc-badge" style={{background:sc.badge[0],color:sc.badge[1],border:`1px solid ${sc.badge[2]}`}}>{sc.label}</span>
                    </div>
                    <div style={{fontSize:11,color:"#64748b"}}>{a.timeSlot} · Token #{a.tokenNumber||"—"}</div>
                    {["SCHEDULED","CONFIRMED","IN_PROGRESS"].includes(a.status) && (
                      <button onClick={()=>setConsultAppt(a)}
                        style={{marginTop:7,width:"100%",padding:"5px 0",borderRadius:7,border:"none",background:a.status==="IN_PROGRESS"?"#3b82f6":accent,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        {a.status==="IN_PROGRESS"?"Continue":"Consult"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  </>);
}
