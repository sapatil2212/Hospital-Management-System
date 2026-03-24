"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ViewRecordModal, EditRecordModal, TransferPatientModal, ViewPrescriptionModal } from "./modals";
import {
  LogOut, Loader2, Bell, User, Phone, Mail, Activity, LayoutDashboard,
  Layers, ArrowRight, CheckCircle, Clock, Stethoscope, Settings,
  Users, ClipboardList, Building2, Search, RefreshCw, X, ChevronRight,
  Smile, Sparkles, Scissors, Heart, Microscope, Pill, Receipt, Scan,
  TestTube2, HelpCircle, PlayCircle, CheckCircle2, AlertCircle,
  CalendarDays, FileText, TrendingUp, FlaskConical,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, DollarSign, IndianRupee,
  Save, Ban, ChevronDown, MessageSquare, UserCheck, Eye
} from "lucide-react";

// ─── Department metadata ──────────────────────────────────────────────────────
type DeptMeta = { Icon: any; gradient: string; accent: string; lightBg: string; borderColor: string };
const SUB_DEPT_META: Record<string, DeptMeta> = {
  DENTAL:      { Icon: Smile,       gradient: "linear-gradient(135deg,#06b6d4,#0891b2)", accent: "#0891b2", lightBg: "#ecfeff", borderColor: "#a5f3fc" },
  DERMATOLOGY: { Icon: Sparkles,    gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8", borderColor: "#fbcfe8" },
  HAIR:        { Icon: Scissors,    gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)", accent: "#6d28d9", lightBg: "#f5f3ff", borderColor: "#ddd6fe" },
  ONCOLOGY:    { Icon: Activity,    gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed", borderColor: "#fed7aa" },
  CARDIOLOGY:  { Icon: Heart,       gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", accent: "#b91c1c", lightBg: "#fff5f5", borderColor: "#fecaca" },
  PATHOLOGY:   { Icon: Microscope,  gradient: "linear-gradient(135deg,#10b981,#047857)", accent: "#047857", lightBg: "#f0fdf4", borderColor: "#a7f3d0" },
  PHARMACY:    { Icon: Pill,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#07595D", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  BILLING:     { Icon: Receipt,     gradient: "linear-gradient(135deg,#f59e0b,#b45309)", accent: "#b45309", lightBg: "#fffbeb", borderColor: "#fde68a" },
  RADIOLOGY:   { Icon: Scan,        gradient: "linear-gradient(135deg,#6366f1,#4338ca)", accent: "#4338ca", lightBg: "#eef2ff", borderColor: "#c7d2fe" },
  LABORATORY:  { Icon: TestTube2,   gradient: "linear-gradient(135deg,#14b8a6,#0f766e)", accent: "#0f766e", lightBg: "#f0fdfa", borderColor: "#99f6e4" },
  PROCEDURE:   { Icon: Stethoscope, gradient: "linear-gradient(135deg,#84cc16,#4d7c0f)", accent: "#4d7c0f", lightBg: "#f7fee7", borderColor: "#d9f99d" },
  OTHER:       { Icon: Layers,      gradient: "linear-gradient(135deg,#64748b,#334155)", accent: "#334155", lightBg: "#f8fafc", borderColor: "#e2e8f0" },
};

const PROC_TYPE_COLOR: Record<string, string> = {
  DIAGNOSTIC: "#0E898F", TREATMENT: "#10b981", CONSULTATION: "#8b5cf6",
  SURGERY: "#ef4444", THERAPY: "#f97316", MEDICATION: "#06b6d4", OTHER: "#94a3b8",
};

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  SCHEDULED:   { label: "Scheduled",   bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  CONFIRMED:   { label: "Confirmed",   bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  IN_PROGRESS: { label: "In Progress", bg: "#E6F4F4", color: "#0A6B70", border: "#B3E0E0" },
  COMPLETED:   { label: "Completed",   bg: "#f0fdf4", color: "#059669", border: "#a7f3d0" },
  CANCELLED:   { label: "Cancelled",   bg: "#fff5f5", color: "#ef4444", border: "#fecaca" },
  NO_SHOW:     { label: "No Show",     bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const initials = (n: string) => (n || "SD").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
const calcAge  = (dob: string) => dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null;

const BLANK_PROC = { name:"", description:"", type:"OTHER", fee:"", duration:"", sequence:"0", isActive:true };
const BLANK_REC  = { patientId:"", patientSearch:"", procedureId:"", appointmentId:"", amount:"", notes:"", performedBy:"", status:"COMPLETED" };

export default function SubDeptDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview"|"queue"|"procedures"|"records"|"dept">("overview");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Queue
  const [queue, setQueue] = useState<any[]>([]);
  const [queueMeta, setQueueMeta] = useState<any>({});
  const [queueLoading, setQueueLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [queueSearch, setQueueSearch] = useState("");
  const [recordingFor, setRecordingFor] = useState<any>(null);

  // Procedures CRUD
  const [procs, setProcs]             = useState<any[]>([]);
  const [procsLoading, setProcsLoading] = useState(false);
  const [showProcForm, setShowProcForm] = useState(false);
  const [editingProc, setEditingProc]   = useState<any>(null);
  const [procForm, setProcForm]         = useState<any>(BLANK_PROC);
  const [procSaving, setProcSaving]     = useState(false);
  const [procMsg, setProcMsg]           = useState("");

  // Records
  const [records, setRecords]           = useState<any[]>([]);
  const [recordsMeta, setRecordsMeta]   = useState<any>({});
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsSearch, setRecordsSearch]   = useState("");
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordForm, setRecordForm]         = useState<any>(BLANK_REC);
  const [recordSaving, setRecordSaving]     = useState(false);
  const [recordMsg, setRecordMsg]           = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [viewingRecord, setViewingRecord]   = useState<any>(null);
  const [editingRecord, setEditingRecord]   = useState<any>(null);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [viewPrescription, setViewPrescription] = useState<any>(null);
  const [subDepts, setSubDepts]             = useState<any[]>([]);
  const [transferForm, setTransferForm]     = useState({ subDeptId: "", notes: "" });
  const [transferring, setTransferring]     = useState(false);

  // ── Load profile ──
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" }).then(r => r.json());
        if (!me.success || me.data?.role !== "SUB_DEPT_HEAD") { router.push("/login"); return; }
        setUser(me.data);
        const prof = await fetch("/api/subdept/me", { credentials: "include" }).then(r => r.json());
        if (prof.success) setProfile(prof.data);
      } catch { router.push("/login"); }
      setLoading(false);
    })();
  }, [router]);

  // ── Load queue ──
  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    const res = await fetch("/api/subdept/queue", { credentials: "include" }).then(r => r.json());
    if (res.success) { setQueue(res.data.queue || []); setQueueMeta(res.data); }
    setQueueLoading(false);
  }, []);

  useEffect(() => { if (tab === "queue") loadQueue(); }, [tab, loadQueue]);

  // ── Load procedures (HOD's own) ──
  const loadProcs = useCallback(async () => {
    setProcsLoading(true);
    const res = await fetch("/api/subdept/procedures", { credentials: "include" }).then(r => r.json());
    if (res.success) setProcs(res.data || []);
    setProcsLoading(false);
  }, []);

  useEffect(() => { if (tab === "procedures") loadProcs(); }, [tab, loadProcs]);

  // ── Load records ──
  const loadRecords = useCallback(async (search = "") => {
    setRecordsLoading(true);
    const url = `/api/subdept/records?limit=30${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(url, { credentials: "include" }).then(r => r.json());
    if (res.success) { setRecords(res.data?.records || []); setRecordsMeta(res.data?.stats || {}); }
    setRecordsLoading(false);
  }, []);

  useEffect(() => { if (tab === "records") loadRecords(); }, [tab, loadRecords]);

  // Load subdepartments for transfer
  useEffect(() => {
    fetch("/api/config/subdepartments?limit=50", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setSubDepts(d.data?.data || d.data || []); })
      .catch(() => {});
  }, []);

  // ── Procedure CRUD ──
  const openAddProc  = () => { setEditingProc(null); setProcForm(BLANK_PROC); setProcMsg(""); setShowProcForm(true); };
  const openEditProc = (p: any) => { setEditingProc(p); setProcForm({ name:p.name, description:p.description||"" , type:p.type, fee:p.fee??"" , duration:p.duration??"" , sequence:p.sequence??0, isActive:p.isActive }); setProcMsg(""); setShowProcForm(true); };

  const saveProc = async () => {
    if (!procForm.name.trim()) { setProcMsg("Name is required"); return; }
    setProcSaving(true); setProcMsg("");
    const url = editingProc ? `/api/subdept/procedures/${editingProc.id}` : "/api/subdept/procedures";
    const method = editingProc ? "PUT" : "POST";
    const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(procForm) }).then(r => r.json());
    if (res.success) { setShowProcForm(false); await loadProcs(); }
    else setProcMsg(res.message || "Failed to save");
    setProcSaving(false);
  };

  const deleteProc = async (id: string) => {
    if (!confirm("Delete this procedure?")) return;
    await fetch(`/api/subdept/procedures/${id}`, { method: "DELETE", credentials: "include" });
    await loadProcs();
  };

  const toggleProcActive = async (p: any) => {
    await fetch(`/api/subdept/procedures/${p.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    await loadProcs();
  };

  // ── Patient search for record form ──
  const searchPatients = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setPatientResults([]); return; }
    const res = await fetch(`/api/patients?search=${encodeURIComponent(q)}&limit=8`, { credentials: "include" }).then(r => r.json());
    if (res.success) setPatientResults(res.data?.patients || res.data || []);
  }, []);

  // ── Save record ──
  const saveRecord = async () => {
    if (!recordForm.patientId || !recordForm.procedureId || !recordForm.amount) { setRecordMsg("Patient, procedure and amount are required"); return; }
    setRecordSaving(true); setRecordMsg("");
    const res = await fetch("/api/subdept/records", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recordForm) }).then(r => r.json());
    if (res.success) { setShowRecordForm(false); setRecordForm(BLANK_REC); setRecordingFor(null); await loadRecords(); }
    else setRecordMsg(res.message || "Failed to save");
    setRecordSaving(false);
  };

  // ── Edit record ──
  const handleEditRecord = async (recordId: string, updates: any) => {
    const res = await fetch(`/api/subdept/records/${recordId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    }).then(r => r.json());
    
    if (res.success) {
      setEditingRecord(null);
      await loadRecords();
    } else {
      alert(res.message || "Failed to update record");
    }
  };

  // ── Transfer patient ──
  const handleTransferPatient = async (record: any, transferData: any) => {
    if (!record.appointment?.id) {
      alert("Cannot transfer: No appointment linked to this record");
      return;
    }

    const res = await fetch(`/api/appointments/${record.appointment.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subDepartmentId: transferData.subDeptId,
        subDeptNote: transferData.notes || `Transferred from ${profile?.name || "previous department"}`
      })
    }).then(r => r.json());

    if (res.success) {
      setTransferTarget(null);
      setTransferForm({ subDeptId: "", notes: "" });
      alert(`Patient ${record.patient?.name} transferred successfully!`);
    } else {
      alert(res.message || "Failed to transfer patient");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const meta       = SUB_DEPT_META[profile?.type || "OTHER"] || SUB_DEPT_META.OTHER;
  const { Icon: DeptIcon } = meta;
  const profileProcs: any[] = profile?.procedures || [];
  const activeProcs   = procs.length > 0 ? procs.filter((p: any) => p.isActive) : profileProcs.filter((p: any) => p.isActive);
  const displayProcs  = procs.length > 0 ? procs : profileProcs;
  const hodName       = profile?.hodName || user?.name || "HOD";
  const deptName      = profile?.name    || "Sub-Department";
  const today         = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  const navItems = [
    { id: "overview",    label: "Overview",       icon: <LayoutDashboard size={16}/> },
    { id: "queue",       label: "Referrals Today", icon: <UserCheck size={16}/>, badge: queue.length || null },
    { id: "procedures",  label: "Procedures",     icon: <ClipboardList size={16}/> },
    { id: "records",     label: "Patient Records", icon: <IndianRupee size={16}/>, badge: recordsMeta.todayRecords || null },
    { id: "dept",        label: "Department",     icon: <Building2 size={16}/> },
  ];

  const filteredQueue = queue.filter(q => {
    return !queueSearch ||
      q.patient?.name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      q.patient?.patientId?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      String(q.tokenNumber || "").includes(queueSearch);
  });

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif", background:"#f0f4f8" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:meta.gradient, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 8px 24px rgba(0,0,0,.12)" }}>
          <Loader2 size={22} color="#fff" style={{ animation:"spin .7s linear infinite" }} />
        </div>
        <div style={{ fontSize:14, fontWeight:600, color:"#475569" }}>Loading portal...</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        body{font-family:'Inter',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .sd2{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0f4f8}
        .sd2-sb{width:224px;background:#fff;border-right:1px solid var(--bc);display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04)}
        .sd2-logo{padding:20px 20px 16px;border-bottom:1px solid var(--bc);display:flex;align-items:center;gap:10px}
        .sd2-logo-ic{width:38px;height:38px;border-radius:11px;background:var(--grad);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);flex-shrink:0}
        .sd2-nav{flex:1;padding:12px;overflow-y:auto}
        .sd2-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:10px 0 5px}
        .sd2-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .sd2-nb:hover{background:var(--lbg);color:var(--acc)}
        .sd2-nb.on{background:var(--lbg);color:var(--acc);font-weight:600}
        .sd2-nb-dot{display:none;width:3px;height:20px;background:var(--acc);border-radius:4px;position:absolute;left:0}
        .sd2-nb.on .sd2-nb-dot{display:block}
        .sd2-nb svg{color:#94a3b8;flex-shrink:0;transition:color .15s}
        .sd2-nb.on svg,.sd2-nb:hover svg{color:var(--acc)}
        .sd2-foot{padding:14px 16px 18px;border-top:1px solid var(--bc)}
        .sd2-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:var(--lbg);border:1px solid var(--bc);margin-bottom:10px}
        .sd2-av{width:34px;height:34px;border-radius:9px;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .sd2-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .sd2-logout:hover{background:#fee2e2}
        .sd2-main{margin-left:224px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .sd2-topbar{height:64px;background:#fff;border-bottom:1px solid var(--bc);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .sd2-search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:260px}
        .sd2-search input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .sd2-search input::placeholder{color:#94a3b8}
        .sd2-body{padding:24px;overflow-y:auto;animation:fadeUp .35s ease}
        .sd2-card{background:#fff;border-radius:14px;border:1px solid var(--bc);box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;margin-bottom:18px}
        .sd2-card-hd{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .sd2-card-title{font-size:14px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px}
        .sd2-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid var(--bc);display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:transform .2s,box-shadow .2s}
        .sd2-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
        .sd2-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700}
        .sd2-tbl{width:100%;border-collapse:collapse}
        .sd2-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:10px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .sd2-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .sd2-tbl tbody tr:hover td{background:#fafbff}
        .sd2-tbl tbody tr:last-child td{border-bottom:none}
        .sd2-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:8px;border:none;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
        .sd2-q-row{border-bottom:1px solid #f1f5f9;transition:background .15s}
        .sd2-q-row:hover{background:#fafbff}
        .sd2-q-row:last-child{border-bottom:none}
        .sd2-expand{background:#f8fafc;border-top:1px solid #f1f5f9;padding:14px 18px;animation:fadeUp .2s ease}
        .sd2-flow-step{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:#475569}
        .sd2-flow-arrow{color:#94a3b8;font-size:11px}
        .sd2-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700}
      `}</style>

      <div className="sd2" style={{"--grad":meta.gradient,"--acc":meta.accent,"--lbg":meta.lightBg,"--bc":meta.borderColor} as any}>

        {/* ── Sidebar ── */}
        <aside className="sd2-sb">
          <div className="sd2-logo">
            <div className="sd2-logo-ic"><DeptIcon size={18} color="#fff"/></div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#1e293b",lineHeight:1.2}}>{deptName}</div>
              <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{profile?.type?.replace(/_/g," ")} Portal</div>
            </div>
          </div>

          <nav className="sd2-nav">
            <div className="sd2-nav-sec">Navigation</div>
            {navItems.map(n => (
              <button key={n.id} className={`sd2-nb${tab===n.id?" on":""}`} onClick={()=>setTab(n.id as any)}>
                <div className="sd2-nb-dot"/>
                <span style={{display:"flex"}}>{n.icon}</span>
                {n.label}
                {n.badge ? <span style={{marginLeft:"auto",minWidth:18,height:18,borderRadius:9,background:meta.accent,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{n.badge}</span> : null}
              </button>
            ))}
            <div className="sd2-nav-sec">Help</div>
            <button className="sd2-nb"><span style={{display:"flex"}}><HelpCircle size={16}/></span>Support</button>
          </nav>

          <div className="sd2-foot">
            <div className="sd2-user">
              <div className="sd2-av">{initials(hodName)}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hodName}</div>
                <div style={{fontSize:10,fontWeight:500,color:meta.accent}}>Sub-Dept Head</div>
              </div>
            </div>
            <button className="sd2-logout" onClick={logout}><LogOut size={13}/>Log Out</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="sd2-main">

          {/* Top Bar */}
          <header className="sd2-topbar">
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{
                tab==="overview"?"Overview":tab==="queue"?"Patient Queue":tab==="procedures"?"Procedures":tab==="records"?"Patient Records":"Department Info"
              }</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{today}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {tab==="queue" && (
                <div className="sd2-search">
                  <Search size={13} color="#94a3b8"/>
                  <input placeholder="Search patient, token…" value={queueSearch} onChange={e=>setQueueSearch(e.target.value)}/>
                </div>
              )}
              {tab==="queue" && (
                <button onClick={loadQueue} style={{width:36,height:36,borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} title="Refresh queue">
                  <RefreshCw size={14} color={queueLoading?"#94a3b8":meta.accent} style={queueLoading?{animation:"spin .7s linear infinite"}:{}}/>
                </button>
              )}
              <div style={{width:36,height:36,borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
                <Bell size={15} color="#64748b"/>
                <span style={{position:"absolute",top:8,right:8,width:6,height:6,borderRadius:"50%",background:meta.accent,border:"1.5px solid #fff"}}/>
              </div>
              <div 
                style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:10,background:meta.lightBg,border:`1px solid ${meta.borderColor}`,cursor:"pointer",position:"relative"}}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{initials(hodName)}</div>
                <div><div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{hodName.split(" ")[0]}</div><div style={{fontSize:10,color:meta.accent}}>HOD</div></div>
                <ChevronDown size={14} color="#64748b" />
                
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
                      border: `1px solid ${meta.borderColor}`,
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      zIndex: 70,
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: 16, borderBottom: `1px solid ${meta.borderColor}` }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{hodName}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); router.push("/subdept/profile"); }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = meta.lightBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <Settings size={16} color="#64748b" />
                          Account Settings
                        </button>
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
                            marginTop: 4,
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

          <div className="sd2-body">

            {/* ═══════════════════ OVERVIEW ═══════════════════ */}
            {tab==="overview" && (<>
              {/* Hero Banner */}
              <div style={{background:meta.gradient,borderRadius:18,padding:"26px 28px",marginBottom:20,color:"#fff",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:-20,top:-20,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
                <div style={{position:"absolute",right:70,bottom:-35,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
                <div style={{position:"relative",display:"flex",alignItems:"center",gap:20}}>
                  <div style={{width:60,height:60,borderRadius:16,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <DeptIcon size={28} color="#fff"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",opacity:.75,marginBottom:4}}>{profile?.type?.replace(/_/g," ")} Department</div>
                    <h1 style={{fontSize:24,fontWeight:800,marginBottom:4,lineHeight:1.2}}>{deptName}</h1>
                    {profile?.description && <p style={{fontSize:13,opacity:.82,maxWidth:520}}>{profile.description}</p>}
                  </div>
                  <div style={{flexShrink:0,textAlign:"right"}}>
                    <div style={{fontSize:11,opacity:.7,marginBottom:4}}>Department Status</div>
                    <span style={{background:"rgba(255,255,255,.2)",padding:"4px 12px",borderRadius:100,fontSize:12,fontWeight:700}}>{profile?.isActive?"● Active":"○ Inactive"}</span>
                  </div>
                </div>
                {profile?.flow && (
                  <div style={{marginTop:16,display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
                    {profile.flow.split("→").map((step: string, i: number, arr: string[]) => (
                      <span key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{background:"rgba(255,255,255,.15)",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{step.trim()}</span>
                        {i < arr.length-1 && <ChevronRight size={12} color="rgba(255,255,255,.7)"/>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:20}}>
                {[
                  { label:"Active Procedures", value:activeProcs.length, Icon:ClipboardList, color:meta.accent, bg:meta.lightBg },
                  { label:"Total Procedures",  value:displayProcs.length, Icon:Layers,       color:"#6366f1",  bg:"#eef2ff" },
                  { label:"Referrals Today",   value:queue.length||"—",  Icon:UserCheck,     color:"#10b981",  bg:"#f0fdf4",
                    onClick:()=>{setTab("queue");loadQueue();} },
                  { label:"Records Today",     value:recordsMeta.todayRecords||0, Icon:ClipboardList, color:"#f59e0b", bg:"#fffbeb",
                    onClick:()=>{setTab("records");loadRecords();} },
                  { label:"Total Records",     value:recordsMeta.totalRecords||0, Icon:Layers, color:"#6366f1", bg:"#eef2ff",
                    onClick:()=>{setTab("records");loadRecords();} },
                ].map((s,i)=>{
                  const SI = s.Icon;
                  return (
                    <div key={i} className="sd2-sc" onClick={s.onClick} style={{cursor:s.onClick?"pointer":"default"}}>
                      <div style={{width:44,height:44,borderRadius:12,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <SI size={20} color={s.color}/>
                      </div>
                      <div>
                        <div style={{fontSize:22,fontWeight:800,color:"#1e293b"}}>{s.value}</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom: Procedures preview + HOD */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:18}}>
                <div className="sd2-card">
                  <div className="sd2-card-hd">
                    <span className="sd2-card-title"><ClipboardList size={15} color={meta.accent}/>Procedure Catalog</span>
                    <span style={{fontSize:11,color:"#94a3b8"}}>{activeProcs.length} active / {procs.length} total</span>
                  </div>
                  <div style={{padding:"10px 0"}}>
                    {displayProcs.slice(0,6).map((p:any)=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 18px",borderBottom:"1px solid #f8fafc"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:PROC_TYPE_COLOR[p.type]||"#94a3b8",flexShrink:0}}/>
                        <div style={{flex:1,fontSize:13,fontWeight:500,color:p.isActive?"#334155":"#94a3b8"}}>{p.name}</div>
                        <span style={{fontSize:10,padding:"2px 7px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontWeight:700}}>{p.type}</span>
                        {p.fee!=null && <span style={{fontSize:11,fontWeight:700,color:"#10b981",minWidth:40,textAlign:"right"}}>₹{p.fee}</span>}
                      </div>
                    ))}
                    {displayProcs.length>6 && <div style={{padding:"10px 18px",fontSize:12,color:meta.accent,fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("procedures")}>View all {displayProcs.length} procedures →</div>}
                    {displayProcs.length===0 && <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13}}>No procedures configured yet</div>}
                  </div>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {/* HOD */}
                  <div className="sd2-card">
                    <div className="sd2-card-hd"><span className="sd2-card-title"><User size={14} color={meta.accent}/>Head of Department</span></div>
                    <div style={{padding:"16px"}}>
                      {profile?.hodName ? (<>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                          <div style={{width:46,height:46,borderRadius:12,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff"}}>{initials(profile.hodName)}</div>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{profile.hodName}</div>
                            <div style={{fontSize:11,color:"#94a3b8"}}>Head of Department</div>
                          </div>
                        </div>
                        {profile.hodEmail && <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#64748b",marginBottom:6}}><Mail size={11}/>{profile.hodEmail}</div>}
                        {profile.hodPhone && <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#64748b"}}><Phone size={11}/>{profile.hodPhone}</div>}
                      </>) : <div style={{padding:"20px 0",textAlign:"center",color:"#94a3b8",fontSize:13}}>No HOD assigned</div>}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div style={{background:meta.lightBg,borderRadius:12,border:`1px solid ${meta.borderColor}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Department Details</div>
                    {[
                      ["Type",        profile?.type?.replace(/_/g," ")],
                      ["Code",        profile?.code || "—"],
                      ["Parent Dept", profile?.department?.name || "Independent"],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:7}}>
                        <span style={{color:"#64748b"}}>{k}</span>
                        <span style={{fontWeight:600,color:"#1e293b"}}>{v}</span>
                      </div>
                    ))}
                    <div style={{borderTop:`1px solid ${meta.borderColor}`,paddingTop:8,marginTop:4,fontSize:11,color:"#94a3b8"}}>
                      Login: {profile?.loginEmail || user?.email || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </>)}

            {/* ═══════════════════ DOCTOR REFERRALS QUEUE ═══════════════════ */}
            {tab==="queue" && (<>
              {/* Info banner */}
              <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1.5px solid #bbf7d0",borderRadius:14,padding:"14px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
                <UserCheck size={20} color="#16a34a"/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#166534"}}>Doctor-Referred Patients Only</div>
                  <div style={{fontSize:12,color:"#16a34a",marginTop:2}}>Only patients whose consultation is <strong>completed</strong> and doctor has explicitly referred to <strong>{deptName}</strong> appear here.</div>
                </div>
                <div style={{marginLeft:"auto",textAlign:"right"}}>
                  <div style={{fontSize:24,fontWeight:800,color:"#16a34a"}}>{queue.length}</div>
                  <div style={{fontSize:11,color:"#16a34a"}}>Today&apos;s referrals</div>
                </div>
              </div>

              {/* Queue table */}
              <div className="sd2-card" style={{marginBottom:0}}>
                <div className="sd2-card-hd">
                  <span className="sd2-card-title"><UserCheck size={15} color={meta.accent}/>Doctor Referrals — Today</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {queueLoading && <Loader2 size={14} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                    <button onClick={loadQueue} style={{padding:"5px 12px",borderRadius:8,background:meta.lightBg,border:`1px solid ${meta.borderColor}`,color:meta.accent,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><RefreshCw size={11}/>Refresh</button>
                  </div>
                </div>

                {queueLoading && queue.length===0 ? (
                  <div style={{padding:"48px",textAlign:"center",color:"#94a3b8",fontSize:13,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                    <Loader2 size={22} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>
                    Loading referrals…
                  </div>
                ) : filteredQueue.length===0 ? (
                  <div style={{padding:"56px 24px",textAlign:"center"}}>
                    <UserCheck size={36} color="#e2e8f0" style={{marginBottom:10}}/>
                    <div style={{fontSize:14,fontWeight:600,color:"#94a3b8"}}>No referrals for today</div>
                    <div style={{fontSize:12,color:"#cbd5e1",marginTop:4}}>Patients will appear here after a doctor completes their consultation and selects <strong>{deptName}</strong> as the referral</div>
                  </div>
                ) : (
                  <table className="sd2-tbl">
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th>Patient</th>
                        <th>Referred On</th>
                        <th>Referred By</th>
                        <th>Doctor&apos;s Referral Note</th>
                        <th>Suggested Procedures</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQueue.map((q:any)=>{
                        const exp = expandedRow===q.id;
                        return (
                          <>
                            <tr key={q.id} className="sd2-q-row" style={{cursor:"pointer"}} onClick={()=>setExpandedRow(exp?null:q.id)}>
                              <td>
                                <div style={{width:34,height:34,borderRadius:10,background:meta.lightBg,border:`1.5px solid ${meta.borderColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:meta.accent}}>
                                  {q.tokenNumber||"—"}
                                </div>
                              </td>
                              <td>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#0ea5e9,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff",flexShrink:0}}>
                                    {(q.patient?.name||"P").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{q.patient?.name||"Unknown"}</div>
                                    <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>
                                      {q.patient?.patientId||""}{q.patient?.age ? ` · ${q.patient.age}y` : ""}{q.patient?.gender ? ` · ${q.patient.gender.charAt(0)}` : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>
                                  {q.appointmentDate ? new Date(q.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                                </div>
                                <div style={{fontSize:11,color:"#94a3b8"}}>{q.timeSlot||"—"}</div>
                              </td>
                              <td>
                                <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{q.doctor?.name||"—"}</div>
                                <div style={{fontSize:11,color:"#94a3b8"}}>{q.doctor?.specialization||q.doctor?.department||""}</div>
                              </td>
                              <td style={{maxWidth:200}}>
                                {q.subDeptNote
                                  ? <div style={{fontSize:12,color:"#166534",background:"#f0fdf4",borderRadius:7,padding:"5px 8px",border:"1px solid #bbf7d0",lineHeight:1.4}}><MessageSquare size={10} style={{marginRight:5,verticalAlign:"middle",color:"#16a34a"}}/>{q.subDeptNote}</div>
                                  : q.doctorNotes
                                    ? <div style={{fontSize:12,color:"#64748b",fontStyle:"italic"}}>{q.doctorNotes.slice(0,60)}{q.doctorNotes.length>60?"…":""}</div>
                                    : <span style={{fontSize:11,color:"#94a3b8"}}>—</span>
                                }
                              </td>
                              <td>
                                {q.suggestedProcedures?.length>0
                                  ? q.suggestedProcedures.map((p:any,i:number)=>(
                                    <span key={i} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"2px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontSize:10,fontWeight:700}}>{p.name}</span>
                                  ))
                                  : <span style={{fontSize:11,color:"#94a3b8"}}>—</span>
                                }
                              </td>
                              <td onClick={e=>e.stopPropagation()}>
                                <div style={{display:"flex",gap:6,flexWrap:"nowrap"}}>
                                  <button className="sd2-btn" style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}}
                                    onClick={()=>{ setRecordForm({...BLANK_REC, patientId:q.patient?.id||"" , patientSearch:q.patient?.name||"" , appointmentId:q.id, amount:q.suggestedProcedures?.[0]?.fee||"" , procedureId:q.suggestedProcedures?.[0]?.id||""}); setShowRecordForm(true); setTab("records"); }}>
                                    <Plus size={11}/>Record Procedure
                                  </button>
                                  <button className="sd2-btn" style={{background:"#f8fafc",color:"#64748b",border:"1px solid #e2e8f0"}} onClick={()=>setExpandedRow(exp?null:q.id)}>
                                    <FileText size={11}/>{exp?"Hide":"Details"}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {exp && (
                              <tr key={`${q.id}-exp`}>
                                <td colSpan={7} style={{padding:0}}>
                                  <div className="sd2-expand">
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                                      <div>
                                        <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><Stethoscope size={12} color={meta.accent}/>Doctor&apos;s Consultation Notes</div>
                                        <div style={{background:"#fff",borderRadius:10,border:`1px solid ${meta.borderColor}`,padding:"12px 14px",fontSize:13,color:"#334155",lineHeight:1.6,minHeight:56}}>
                                          {q.doctorNotes ? q.doctorNotes : <span style={{color:"#94a3b8",fontStyle:"italic"}}>No consultation notes</span>}
                                        </div>
                                        {q.subDeptNote && (
                                          <div style={{marginTop:10,background:"#f0fdf4",borderRadius:10,border:"1.5px solid #bbf7d0",padding:"12px 14px"}}>
                                            <div style={{fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:5,display:"flex",alignItems:"center",gap:5}}><MessageSquare size={11}/>Referral Instructions</div>
                                            <div style={{fontSize:13,color:"#166534",lineHeight:1.6}}>{q.subDeptNote}</div>
                                          </div>
                                        )}
                                        <div style={{marginTop:10,display:"flex",gap:10}}>
                                          {[["Type",q.type],["Fee",q.consultationFee?`₹${q.consultationFee}`:"—"],["Phone",q.patient?.phone||"—"]].map(([k,v])=>(
                                            <div key={k} style={{flex:1,background:"#fff",borderRadius:9,padding:"8px 10px",border:"1px solid #e2e8f0",textAlign:"center"}}>
                                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:2}}>{k}</div>
                                              <div style={{fontSize:12,fontWeight:700,color:"#334155"}}>{v}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><TrendingUp size={12} color={meta.accent}/>Patient Journey</div>
                                        {profile?.flow ? (
                                          <div style={{background:"#fff",borderRadius:10,border:`1px solid ${meta.borderColor}`,padding:"12px 14px"}}>
                                            {profile.flow.split("→").map((step:string,i:number,arr:string[])=>{
                                              const isHere = step.trim().toLowerCase().includes(deptName.split(" ")[0].toLowerCase());
                                              return (
                                                <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:i<arr.length-1?8:0}}>
                                                  <div style={{width:22,height:22,borderRadius:"50%",background:isHere?meta.gradient:"#f1f5f9",border:`2px solid ${isHere?meta.accent:"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                                    <span style={{fontSize:9,fontWeight:800,color:isHere?"#fff":"#94a3b8"}}>{i+1}</span>
                                                  </div>
                                                  <span style={{fontSize:12,fontWeight:isHere?700:500,color:isHere?meta.accent:"#64748b"}}>{step.trim()}</span>
                                                  {isHere && <span style={{marginLeft:"auto",fontSize:9,padding:"1px 6px",borderRadius:100,background:meta.lightBg,color:meta.accent,fontWeight:700,border:`1px solid ${meta.borderColor}`}}>HERE</span>}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px",color:"#94a3b8",fontSize:12}}>
                                            OPD → <strong style={{color:meta.accent}}>{deptName}</strong> → Billing
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>)}

            {/* ═══════════════════ PROCEDURES CRUD ═══════════════════ */}
            {tab==="procedures" && (<>
              {/* Add/Edit Procedure Modal */}
              {showProcForm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowProcForm(false)}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:540,boxShadow:"0 24px 60px rgba(0,0,0,.18)",fontFamily:"'Inter',sans-serif",animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>{editingProc?"Edit Procedure":"Add New Procedure"}</div>
                        <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Fill in the procedure details below</div>
                      </div>
                      <button onClick={()=>setShowProcForm(false)} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Name *</label>
                        <input value={procForm.name} onChange={e=>setProcForm((f:any)=>({...f,name:e.target.value}))} placeholder="e.g. Dental Scaling" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Type</label>
                        <select value={procForm.type} onChange={e=>setProcForm((f:any)=>({...f,type:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          {["DIAGNOSTIC","TREATMENT","CONSULTATION","SURGERY","THERAPY","MEDICATION","OTHER"].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Fee (₹)</label>
                        <input type="number" value={procForm.fee} onChange={e=>setProcForm((f:any)=>({...f,fee:e.target.value}))} placeholder="0" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Duration (min)</label>
                        <input type="number" value={procForm.duration} onChange={e=>setProcForm((f:any)=>({...f,duration:e.target.value}))} placeholder="30" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Description</label>
                        <input value={procForm.description} onChange={e=>setProcForm((f:any)=>({...f,description:e.target.value}))} placeholder="Optional description" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                    </div>
                    {procMsg && <div style={{fontSize:12,color:"#ef4444",marginTop:12,fontWeight:600}}>{procMsg}</div>}
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveProc} disabled={procSaving} style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 14px ${meta.accent}33`}}>
                        {procSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        {editingProc?"Save Changes":"Add Procedure"}
                      </button>
                      <button onClick={()=>setShowProcForm(false)} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="sd2-card" style={{marginBottom:0}}>
                <div className="sd2-card-hd">
                  <span className="sd2-card-title"><ClipboardList size={15} color={meta.accent}/>Procedure Catalog</span>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {procsLoading && <Loader2 size={13} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                    <span style={{fontSize:11,color:"#94a3b8"}}>{activeProcs.length} active</span>
                    <button onClick={openAddProc} style={{padding:"6px 14px",borderRadius:9,background:meta.gradient,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",border:"none",display:"flex",alignItems:"center",gap:5}}><Plus size={13}/>Add Procedure</button>
                  </div>
                </div>
                {displayProcs.length===0 ? (
                  <div style={{padding:"56px",textAlign:"center"}}>
                    <FlaskConical size={36} color="#e2e8f0" style={{marginBottom:10}}/>
                    <div style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:6}}>No procedures yet</div>
                    <button onClick={openAddProc} style={{padding:"8px 18px",borderRadius:9,background:meta.lightBg,border:`1px solid ${meta.borderColor}`,color:meta.accent,fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><Plus size={12}/>Add First Procedure</button>
                  </div>
                ) : (
                  <table className="sd2-tbl">
                    <thead><tr><th>#</th><th>Procedure Name</th><th>Type</th><th>Fee</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {displayProcs.map((p:any,i:number)=>(
                        <tr key={p.id}>
                          <td style={{color:"#94a3b8",fontWeight:600}}>{i+1}</td>
                          <td>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:PROC_TYPE_COLOR[p.type]||"#94a3b8",flexShrink:0}}/>
                              <div>
                                <div style={{fontSize:13,fontWeight:600,color:p.isActive?"#1e293b":"#94a3b8"}}>{p.name}</div>
                                {p.description && <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{p.description}</div>}
                              </div>
                            </div>
                          </td>
                          <td><span className="sd2-badge" style={{background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8"}}>{p.type}</span></td>
                          <td style={{fontWeight:700,color:p.fee!=null?"#10b981":"#94a3b8"}}>{p.fee!=null?`₹${p.fee}`:"—"}</td>
                          <td style={{color:"#64748b"}}>{p.duration?`${p.duration} min`:"—"}</td>
                          <td>
                            <button onClick={()=>toggleProcActive(p)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                              {p.isActive
                                ? <><ToggleRight size={18} color="#22c55e"/><span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>Active</span></>
                                : <><ToggleLeft size={18} color="#94a3b8"/><span style={{fontSize:11,fontWeight:600,color:"#94a3b8"}}>Inactive</span></>}
                            </button>
                          </td>
                          <td>
                            <div style={{display:"flex",gap:6}}>
                              <button className="sd2-btn" style={{background:"#E6F4F4",color:"#0A6B70",border:"1px solid #B3E0E0"}} onClick={()=>openEditProc(p)}><Edit2 size={11}/>Edit</button>
                              <button className="sd2-btn" style={{background:"#fff5f5",color:"#ef4444",border:"1px solid #fecaca"}} onClick={()=>deleteProc(p.id)}><Trash2 size={11}/>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>)}

            {/* ═══════════════════ PATIENT RECORDS ═══════════════════ */}
            {tab==="records" && (<>
              {/* Procedure Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
                {[
                  {label:"Today's Procedures", value:recordsMeta.todayRecords||0,  color:"#6366f1", bg:"#eef2ff"},
                  {label:"Total Procedures Done",value:recordsMeta.totalRecords||0, color:meta.accent, bg:meta.lightBg},
                ].map((s,i)=>(
                  <div key={i} style={{background:s.bg,borderRadius:12,padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                    <div style={{fontSize:28,fontWeight:800,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{s.label}</div>
                    {i===0&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Billing managed by Finance Dept</div>}
                  </div>
                ))}
              </div>

              {/* Record Procedure Modal */}
              {showRecordForm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>{setShowRecordForm(false);setRecordForm(BLANK_REC);}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:580,boxShadow:"0 24px 60px rgba(0,0,0,.18)",fontFamily:"'Inter',sans-serif",animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>Record Procedure Performed</div>
                        <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Log a procedure done on a patient</div>
                      </div>
                      <button onClick={()=>{setShowRecordForm(false);setRecordForm(BLANK_REC);}} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      {/* Patient search */}
                      <div style={{gridColumn:"1/-1",position:"relative"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Patient *</label>
                        <input value={recordForm.patientSearch} onChange={e=>{ setRecordForm((f:any)=>({...f,patientSearch:e.target.value,patientId:""})); searchPatients(e.target.value); }}
                          placeholder="Search patient by name, ID or phone…" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                        {patientResults.length>0 && !recordForm.patientId && (
                          <div style={{position:"absolute",zIndex:50,top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",overflow:"hidden",maxHeight:220,overflowY:"auto"}}>
                            {patientResults.map((pt:any)=>(
                              <div key={pt.id} onClick={()=>{ setRecordForm((f:any)=>({...f,patientId:pt.id,patientSearch:`${pt.name} (${pt.patientId})`})); setPatientResults([]); }}
                                style={{padding:"10px 14px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #f8fafc",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="#fff")}>
                                <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11,flexShrink:0}}>{pt.name?.charAt(0)}</div>
                                <div><div style={{fontWeight:600,color:"#1e293b"}}>{pt.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{pt.patientId} · {pt.phone}</div></div>
                              </div>
                            ))}
                          </div>
                        )}
                        {recordForm.patientId && <div style={{marginTop:4,fontSize:11,color:"#16a34a",fontWeight:600}}>✓ Patient selected</div>}
                      </div>
                      {/* Procedure */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Procedure *</label>
                        <select value={recordForm.procedureId} onChange={e=>{ const p = displayProcs.find((x:any)=>x.id===e.target.value); setRecordForm((f:any)=>({...f,procedureId:e.target.value,amount:p?.fee?.toString()||f.amount})); }}
                          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          <option value="">— Select Procedure —</option>
                          {displayProcs.filter((p:any)=>p.isActive).map((p:any)=>(
                            <option key={p.id} value={p.id}>{p.name}{p.fee!=null?` — ₹${p.fee}`:""}</option>
                          ))}
                        </select>
                      </div>
                      {/* Amount */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Amount Charged (₹) *</label>
                        <input type="number" value={recordForm.amount} onChange={e=>setRecordForm((f:any)=>({...f,amount:e.target.value}))} placeholder="0" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      {/* Performed by */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Performed By</label>
                        <input value={recordForm.performedBy} onChange={e=>setRecordForm((f:any)=>({...f,performedBy:e.target.value}))} placeholder={hodName} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      {/* Status */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Status</label>
                        <select value={recordForm.status} onChange={e=>setRecordForm((f:any)=>({...f,status:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          {["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                        </select>
                      </div>
                      {/* Notes */}
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Notes</label>
                        <input value={recordForm.notes} onChange={e=>setRecordForm((f:any)=>({...f,notes:e.target.value}))} placeholder="Optional procedure notes" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                    </div>
                    {recordMsg && <div style={{fontSize:12,color:"#ef4444",marginTop:12,fontWeight:600}}>{recordMsg}</div>}
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveRecord} disabled={recordSaving} style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 14px ${meta.accent}33`}}>
                        {recordSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        Save Record
                      </button>
                      <button onClick={()=>{setShowRecordForm(false);setRecordForm(BLANK_REC);}} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Records Table */}
              <div className="sd2-card" style={{marginBottom:0}}>
                <div className="sd2-card-hd">
                  <span className="sd2-card-title"><IndianRupee size={15} color={meta.accent}/>Patient Procedure Records</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div className="sd2-search" style={{width:220}}>
                      <Search size={12} color="#94a3b8"/>
                      <input placeholder="Search patient…" value={recordsSearch} onChange={e=>{setRecordsSearch(e.target.value);loadRecords(e.target.value);}}/>
                    </div>
                    {recordsLoading && <Loader2 size={13} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                    <button onClick={()=>setShowRecordForm(true)} style={{padding:"6px 14px",borderRadius:9,background:meta.gradient,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",border:"none",display:"flex",alignItems:"center",gap:5}}><Plus size={13}/>New Record</button>
                  </div>
                </div>
                {records.length===0 ? (
                  <div style={{padding:"56px",textAlign:"center"}}>
                    <IndianRupee size={36} color="#e2e8f0" style={{marginBottom:10}}/>
                    <div style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:6}}>No procedure records yet</div>
                    <button onClick={()=>setShowRecordForm(true)} style={{padding:"8px 18px",borderRadius:9,background:meta.lightBg,border:`1px solid ${meta.borderColor}`,color:meta.accent,fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><Plus size={12}/>Record First Procedure</button>
                  </div>
                ) : (
                  <table className="sd2-tbl">
                    <thead><tr><th>Date</th><th>Patient</th><th>Procedure</th><th>Type</th><th>Amount</th><th>Performed By</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {records.map((r:any)=>(
                        <tr key={r.id}>
                          <td style={{fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>
                            {new Date(r.performedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}<br/>
                            <span style={{fontSize:10}}>{new Date(r.performedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
                          </td>
                          <td>
                            <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{r.patient?.name||"—"}</div>
                            <div style={{fontSize:11,color:"#94a3b8"}}>{r.patient?.patientId} · {r.patient?.phone}</div>
                          </td>
                          <td style={{fontSize:13,fontWeight:600,color:"#334155"}}>{r.procedure?.name||"—"}</td>
                          <td><span className="sd2-badge" style={{background:(PROC_TYPE_COLOR[r.procedure?.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[r.procedure?.type]||"#94a3b8"}}>{r.procedure?.type||"—"}</span></td>
                          <td style={{fontWeight:800,color:"#10b981",fontSize:14}}>₹{r.amount}</td>
                          <td style={{fontSize:12,color:"#64748b"}}>{r.performedBy||"—"}</td>
                          <td>
                            <span className="sd2-badge" style={{
                              background:r.status==="COMPLETED"?"#f0fdf4":r.status==="CANCELLED"?"#fff5f5":"#fffbeb",
                              color:r.status==="COMPLETED"?"#16a34a":r.status==="CANCELLED"?"#ef4444":"#b45309",
                              border:`1px solid ${r.status==="COMPLETED"?"#bbf7d0":r.status==="CANCELLED"?"#fecaca":"#fde68a"}`
                            }}>{r.status.replace(/_/g," ")}</span>
                          </td>
                          <td>
                            <div style={{display:"flex",gap:5,flexWrap:"nowrap"}}>
                              <button onClick={()=>setViewingRecord(r)} className="sd2-btn" style={{background:"#E6F4F4",color:"#0E898F",border:"1px solid #B3E0E0",padding:"4px 8px"}} title="View Details">
                                <Eye size={11}/>
                              </button>
                              <button onClick={()=>setEditingRecord(r)} className="sd2-btn" style={{background:"#fef3c7",color:"#d97706",border:"1px solid #fde68a",padding:"4px 8px"}} title="Edit Record">
                                <Edit2 size={11}/>
                              </button>
                              <button onClick={()=>{setTransferTarget(r);setTransferForm({subDeptId:"",notes:""});}} className="sd2-btn" style={{background:"#f0fdf4",color:"#10b981",border:"1px solid #bbf7d0",padding:"4px 8px"}} title="Transfer Patient">
                                <ArrowRight size={11}/>
                              </button>
                              {r.appointment?.id && (
                                <button onClick={()=>setViewPrescription(r.appointment)} className="sd2-btn" style={{background:"#fdf4ff",color:"#a855f7",border:"1px solid #e9d5ff",padding:"4px 8px"}} title="View Prescription">
                                  <FileText size={11}/>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>)}

            {/* ═══════════════════ DEPARTMENT INFO ═══════════════════ */}
            {tab==="dept" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                {/* HOD */}
                <div className="sd2-card">
                  <div className="sd2-card-hd"><span className="sd2-card-title"><User size={14} color={meta.accent}/>Head of Department</span></div>
                  <div style={{padding:"20px"}}>
                    {profile?.hodName ? (<>
                      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:14,background:meta.lightBg,borderRadius:12,border:`1px solid ${meta.borderColor}`}}>
                        <div style={{width:56,height:56,borderRadius:14,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:20,color:"#fff",flexShrink:0}}>{initials(profile.hodName)}</div>
                        <div>
                          <div style={{fontSize:16,fontWeight:700,color:"#1e293b"}}>{profile.hodName}</div>
                          <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Head of Department</div>
                          <span style={{display:"inline-block",marginTop:6,padding:"2px 8px",borderRadius:100,background:meta.lightBg,color:meta.accent,fontSize:10,fontWeight:700,border:`1px solid ${meta.borderColor}`}}>{deptName}</span>
                        </div>
                      </div>
                      {[["Email",profile.hodEmail,<Mail key="m" size={13}/>],["Phone",profile.hodPhone,<Phone key="p" size={13}/>]].map(([k,v,icon])=>
                        v ? <div key={String(k)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:13,color:"#334155"}}><span style={{color:meta.accent,display:"flex"}}>{icon}</span>{v}</div> : null
                      )}
                    </>) : <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13}}>No HOD assigned yet</div>}
                  </div>
                </div>

                {/* Department details */}
                <div className="sd2-card">
                  <div className="sd2-card-hd"><span className="sd2-card-title"><Building2 size={14} color={meta.accent}/>Department Details</span></div>
                  <div style={{padding:"20px"}}>
                    {[
                      ["Name",       deptName],
                      ["Type",       profile?.type?.replace(/_/g," ")],
                      ["Short Code", profile?.code||"—"],
                      ["Parent Dept",profile?.department?.name||"Independent"],
                      ["Status",     profile?.isActive?"Active":"Inactive"],
                      ["Login Email",profile?.loginEmail||user?.email||"—"],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f8fafc"}}>
                        <span style={{fontSize:12,color:"#64748b"}}>{k}</span>
                        <span style={{fontSize:13,fontWeight:600,color:k==="Status"?(profile?.isActive?"#16a34a":"#ef4444"):"#1e293b"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient flow */}
                {profile?.flow && (
                  <div className="sd2-card" style={{gridColumn:"1/-1"}}>
                    <div className="sd2-card-hd"><span className="sd2-card-title"><TrendingUp size={14} color={meta.accent}/>Patient Flow &amp; Workflow</span></div>
                    <div style={{padding:"20px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        {profile.flow.split("→").map((step:string,i:number,arr:string[])=>(
                          <span key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,background:meta.lightBg,border:`1.5px solid ${meta.borderColor}`,borderRadius:10,padding:"10px 16px"}}>
                              <div style={{width:24,height:24,borderRadius:"50%",background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{i+1}</div>
                              <span style={{fontSize:13,fontWeight:600,color:meta.accent}}>{step.trim()}</span>
                            </div>
                            {i<arr.length-1 && <ChevronRight size={16} color="#94a3b8"/>}
                          </span>
                        ))}
                      </div>
                      <div style={{marginTop:16,padding:"12px 16px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",fontSize:12,color:"#64748b",lineHeight:1.6}}>
                        <strong style={{color:"#334155"}}>How it works:</strong> Patients arrive after OPD consultation or doctor referral. The sub-department team performs the assigned procedures, updates status to &ldquo;Completed&rdquo;, and directs the patient to the next stage as shown above.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modals */}
      {viewingRecord && <ViewRecordModal record={viewingRecord} onClose={() => setViewingRecord(null)} meta={meta} />}
      {editingRecord && <EditRecordModal record={editingRecord} onClose={() => setEditingRecord(null)} onSave={handleEditRecord} meta={meta} />}
      {transferTarget && <TransferPatientModal record={transferTarget} subDepts={subDepts} onClose={() => setTransferTarget(null)} onTransfer={handleTransferPatient} meta={meta} />}
      {viewPrescription && <ViewPrescriptionModal appointment={viewPrescription} onClose={() => setViewPrescription(null)} meta={meta} />}
    </>
  );
}
