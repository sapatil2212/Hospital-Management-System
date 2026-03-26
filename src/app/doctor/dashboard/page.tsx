"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays, ChevronRight, ChevronLeft,
  UserRound, Loader2, PlayCircle, CheckCircle2, X, FileText, Clock, RefreshCw, Pencil, Activity, ClipboardCheck
} from "lucide-react";

import PatientProfilePanel from "@/components/PatientProfilePanel";
import PrescriptionSettingsPanel from "@/components/PrescriptionSettingsPanel";
import { useDoctorDashboard } from "./DoctorDashboardContext";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_H = ["M","T","W","T","F","S","S"];

const TYPE_LABEL: Record<string, string> = {
  OPD: "OPD", ONLINE: "Online", FOLLOW_UP: "Follow-up", EMERGENCY: "Emergency",
};
const STATUS_CFG: Record<string, { label: string; dot: string; badge: [string, string, string] }> = {
  SCHEDULED:   { label: "Scheduled",   dot: "#94a3b8", badge: ["#f8fafc",   "#475569",  "#e2e8f0"] },
  CONFIRMED:   { label: "Confirmed",   dot: "#10b981", badge: ["#f0fdf4",   "#16a34a",  "#bbf7d0"] },
  IN_PROGRESS: { label: "In Progress", dot: "#0E898F", badge: ["#E6F4F4",   "#0A6B70",  "#B3E0E0"] },
  COMPLETED:   { label: "Completed",   dot: "#059669", badge: ["#f0fdf4",   "#059669",  "#a7f3d0"] },
  CANCELLED:   { label: "Cancelled",   dot: "#ef4444", badge: ["#fff5f5",   "#ef4444",  "#fecaca"] },
  NO_SHOW:     { label: "No Show",     dot: "#f97316", badge: ["#fff7ed",   "#c2410c",  "#fed7aa"] },
  RESCHEDULED: { label: "Rescheduled", dot: "#a855f7", badge: ["#faf5ff",   "#7c3aed",  "#e9d5ff"] },
};

function ConsultModal({ appt, onClose, onDone, onStartPrescription, setSelectedPatientId }: { appt: any; onClose: () => void; onDone: () => void; onStartPrescription: (id: string) => void; setSelectedPatientId: (id: string) => void }) {
  const [notes, setNotes] = useState(appt.notes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [subDeptId, setSubDeptId] = useState<string>(appt.subDepartmentId || "");
  const [subDeptNote, setSubDeptNote] = useState<string>(appt.subDeptNote || "");
  const [showReferral, setShowReferral] = useState(!!(appt.subDepartmentId));
  const [transferToBilling, setTransferToBilling] = useState(false);
  const [billingNote, setBillingNote] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [showServicePlan, setShowServicePlan] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [planCreated, setPlanCreated] = useState(false);

  useEffect(() => {
    api("/api/config/subdepartments?limit=50").then(r => {
      if (r.success) setSubDepts(r.data?.data || r.data || []);
    }).catch(() => {});
    api("/api/config/services?isActive=true&limit=100").then(r => {
      if (r.success) setServices(r.data?.services || r.data?.data || []);
    }).catch(() => {});
  }, []);

  const doBillingTransfer = async () => {
    const r = await api("/api/billing/transfer", "POST", {
      appointmentId: appt.id,
      note: billingNote || "Transferred from consultation"
    });
    if (!r.success) {
      setMsg(r.message || "Failed to transfer to billing");
      return false;
    }
    return true;
  };

  const handleStartPrescription = async () => {
    if (transferToBilling) {
      setSaving(true);
      const ok = await doBillingTransfer();
      setSaving(false);
      if (!ok) return;
    }
    onStartPrescription(appt.id);
  };

  const handleCompleteAndBill = async () => {
    setSaving(true);
    const body: any = { status: "COMPLETED", notes: notes || undefined };
    if (showReferral && subDeptId) {
      body.subDepartmentId = subDeptId;
      body.subDeptNote = subDeptNote || undefined;
    }
    const d = await api(`/api/appointments/${appt.id}`, "PUT", body);
    if (d.success) {
      await doBillingTransfer();
      onDone(); onClose();
    } else {
      setMsg(d.message || "Failed to complete");
    }
    setSaving(false);
  };

  const update = async (status: string) => {
    setSaving(true);
    const body: any = { status, notes: notes || undefined };
    if (showReferral && subDeptId) {
      body.subDepartmentId = subDeptId;
      body.subDeptNote = subDeptNote || undefined;
    } else if (!showReferral) {
      body.subDepartmentId = null;
      body.subDeptNote = null;
    }
    
    // Transfer to billing if selected
    if (transferToBilling) {
      const ok = await doBillingTransfer();
      if (!ok) { setSaving(false); return; }
    }
    
    const d = await api(`/api/appointments/${appt.id}`, "PUT", body);
    if (d.success) {
      if (status === "COMPLETED" && showServicePlan && selectedServiceId && appt.patient?.id && !planCreated) {
        const svc = services.find((s: any) => s.id === selectedServiceId);
        api("/api/treatment-plans", "POST", {
          patientId: appt.patient.id,
          serviceId: selectedServiceId,
          doctorId: appt.doctorId,
          departmentId: appt.departmentId,
          planName: svc?.name || "Treatment Plan",
          totalSessions: svc?.sessionCount || 1,
          totalCost: svc?.price || 0,
        }).then(() => setPlanCreated(true)).catch(() => {});
      }
      onDone(); onClose();
    }
    else setMsg(d.message || "Failed to update");
    setSaving(false);
  };

  const sc = STATUS_CFG[appt.status] || STATUS_CFG.SCHEDULED;
  const patientName = appt.patient?.name || "Patient";
  const apptDate = new Date(appt.appointmentDate);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif", margin: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Patient Consultation</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{apptDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {appt.timeSlot}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><X size={14} /></button>
        </div>

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

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Consultation Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Diagnosis, prescription, follow-up instructions..."
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
        </div>

        <div style={{ marginBottom: 18, background: showReferral ? "#f0fdf4" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${showReferral ? "#bbf7d0" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setShowReferral(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: showReferral ? "#22c55e" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={showReferral ? "#fff" : "#94a3b8"} style={{ transform: showReferral ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: showReferral ? "#166534" : "#64748b" }}>
                {showReferral ? "Referring to Sub-Department" : "Refer to Sub-Department (optional)"}
              </span>
            </div>
            {appt.subDepartmentId && <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Previously Referred</span>}
          </button>
          {showReferral && (
            <div style={{ padding: "0 14px 14px" }}>
              <select value={subDeptId} onChange={e => setSubDeptId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bbf7d0", background: "#fff", fontSize: 13, color: "#334155", outline: "none", marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>
                <option value="">— Select Sub-Department —</option>
                {subDepts.map((sd: any) => (
                  <option key={sd.id} value={sd.id}>{sd.name} ({sd.type})</option>
                ))}
              </select>
              <textarea value={subDeptNote} onChange={e => setSubDeptNote(e.target.value)} rows={2}
                placeholder="Referral instructions for sub-dept"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bbf7d0", background: "#fff", fontSize: 12, color: "#334155", outline: "none", resize: "none", fontFamily: "'Inter',sans-serif" }} />
              {!subDeptId && <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 5, fontWeight: 600 }}>Select a sub-department to save the referral.</p>}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14, background: transferToBilling ? "#fef3c7" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${transferToBilling ? "#fde68a" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setTransferToBilling(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: transferToBilling ? "#f59e0b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={transferToBilling ? "#fff" : "#94a3b8"} style={{ transform: transferToBilling ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: transferToBilling ? "#92400e" : "#64748b" }}>
                {transferToBilling ? "Transferring to Billing" : "Transfer to Billing (optional)"}
              </span>
            </div>
          </button>
          {transferToBilling && (
            <div style={{ padding: "0 14px 14px" }}>
              <textarea value={billingNote} onChange={e => setBillingNote(e.target.value)} rows={2}
                placeholder="Billing notes (optional)..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #fde68a", background: "#fff", fontSize: 12, color: "#334155", outline: "none", resize: "none", fontFamily: "'Inter',sans-serif" }} />
              <div style={{ fontSize: 11, color: "#92400e", marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                ✓ Patient will be sent to billing queue with consultation fee
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14, background: showServicePlan ? "#eff6ff" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${showServicePlan ? "#bfdbfe" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setShowServicePlan(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: showServicePlan ? "#3b82f6" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={showServicePlan ? "#fff" : "#94a3b8"} style={{ transform: showServicePlan ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: showServicePlan ? "#1d4ed8" : "#64748b" }}>Assign Service Package (optional)</span>
            </div>
            {planCreated && <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Plan Created</span>}
          </button>
          {showServicePlan && (
            <div style={{ padding: "0 14px 14px" }}>
              <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bfdbfe", background: "#fff", fontSize: 13, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif" }}>
                <option value="">— Select Package —</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.sessionCount} sessions · ₹{s.price?.toLocaleString()}</option>
                ))}
              </select>
              {selectedServiceId && (
                <div style={{ fontSize: 11, color: "#1d4ed8", marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  ✓ Treatment plan will be auto-created when consultation is completed
                </div>
              )}
              {services.length === 0 && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>No service packages configured yet. Add them in Configure → Services & Packages.</div>
              )}
            </div>
          )}
        </div>

        {msg && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10, fontWeight: 600 }}>{msg}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
            <button onClick={handleStartPrescription} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <PlayCircle size={15} />}
              Start Consultation
            </button>
          )}
          {appt.status === "IN_PROGRESS" && (
            <button onClick={handleStartPrescription} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <PlayCircle size={15} />}
              Continue Prescription
            </button>
          )}
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS") && transferToBilling && (
            <button onClick={handleCompleteAndBill} disabled={saving}
              style={{ padding: "11px 16px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(245,158,11,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={15} />}
              Complete & Bill
            </button>
          )}
          {appt.status === "COMPLETED" && (
            <button onClick={() => update("COMPLETED")} disabled={saving || (showReferral && !subDeptId)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, background: "#f0fdf4", color: "#059669", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1.5px solid #bbf7d0" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : "Update Notes & Referral"}
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
          <button 
            onClick={() => { setSelectedPatientId(appt.patient.id); onClose(); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, fontSize: 12, color: "#0E898F", fontWeight: 600, background: "none", border: "none", cursor: "pointer", width: "100%" }}
          >
            <FileText size={12} />View Full Patient Profile
          </button>
        )}
      </div>
    </div>
  );
}

function MiniCalendar({ accent = "#10b981", selectedDate, onDateSelect }: { accent?: string; selectedDate?: Date; onDateSelect?: (d: Date) => void }) {
  const today = new Date();
  const [cur, setCur] = useState({ y: selectedDate?.getFullYear() || today.getFullYear(), m: selectedDate?.getMonth() ?? today.getMonth() });
  const firstDay = new Date(cur.y,cur.m,1).getDay();
  const offset = firstDay===0?6:firstDay-1;
  const days = new Date(cur.y,cur.m+1,0).getDate();
  const cells:(number|null)[] = [...Array(offset).fill(null),...Array.from({length:days},(_,i)=>i+1)];
  while(cells.length%7!==0) cells.push(null);
  const isTodayCell = (d:number|null) => d===today.getDate()&&cur.m===today.getMonth()&&cur.y===today.getFullYear();
  const isSelected = (d:number|null) => selectedDate && d===selectedDate.getDate()&&cur.m===selectedDate.getMonth()&&cur.y===selectedDate.getFullYear();
  const handleClick = (d:number|null) => { if(d && onDateSelect) onDateSelect(new Date(cur.y, cur.m, d)); };
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
        {cells.map((d,i)=>{
          const sel = isSelected(d);
          const tod = isTodayCell(d);
          return (
            <div key={i} onClick={()=>handleClick(d)} style={{textAlign:"center",fontSize:12,fontWeight:(sel||tod)?700:400,padding:"5px 0",borderRadius:8,cursor:d?"pointer":"default",background:sel?accent:tod?accent+"33":"transparent",color:sel?"#fff":tod?accent:d?"#334155":"transparent",border:tod&&!sel?`1px solid ${accent}`:'1px solid transparent'}}>{d||""}</div>
          );
        })}
      </div>
    </div>
  );
}

const SCHED_DURATIONS = [10,15,20,30,45,60];
const SCHED_DAY_LABELS: Record<string,string> = { MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat",SUNDAY:"Sun" };
const ALL_SCHED_DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

function ScheduleMgmtTab({ accent, localSchedule, setLocalSchedule, scheduleLoading, scheduleSaving, setScheduleSaving, scheduleMsg, setScheduleMsg, fetchWeeklySchedule }: {
  accent: string;
  localSchedule: Record<string,{startTime:string;endTime:string;slotDuration:number;isActive:boolean}>;
  setLocalSchedule: React.Dispatch<React.SetStateAction<Record<string,{startTime:string;endTime:string;slotDuration:number;isActive:boolean}>>>;
  scheduleLoading: boolean;
  scheduleSaving: boolean;
  setScheduleSaving: (v: boolean) => void;
  scheduleMsg: {type:"success"|"error";text:string}|null;
  setScheduleMsg: (v: {type:"success"|"error";text:string}|null) => void;
  fetchWeeklySchedule: () => void;
}) {
  const setDay = (day: string, field: string, val: any) =>
    setLocalSchedule(p => ({ ...p, [day]: { ...p[day], [field]: val } }));

  const applyTemplate = (activeDays: string[]) =>
    setLocalSchedule(p => { const n={...p}; ALL_SCHED_DAYS.forEach(d => { n[d]={...n[d], isActive: activeDays.includes(d)}; }); return n; });

  const slotsFor = (start: string, end: string, dur: number) => {
    const [sh,sm] = start.split(":").map(Number);
    const [eh,em] = end.split(":").map(Number);
    const mins = (eh*60+em) - (sh*60+sm);
    return mins > 0 ? Math.floor(mins/dur) : 0;
  };

  const saveAll = async () => {
    setScheduleSaving(true);
    setScheduleMsg(null);
    const schedules = ALL_SCHED_DAYS.filter(d => localSchedule[d]?.isActive).map(d => ({
      day: d, startTime: localSchedule[d].startTime, endTime: localSchedule[d].endTime,
      slotDuration: localSchedule[d].slotDuration, isActive: true,
    }));
    const res = await fetch("/api/doctor/availability", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ schedules }) }).then(r=>r.json());
    setScheduleSaving(false);
    if (res.success) { setScheduleMsg({ type:"success", text:`Schedule saved — ${schedules.length} working day(s) configured` }); fetchWeeklySchedule(); }
    else setScheduleMsg({ type:"error", text: res.message || "Failed to save schedule" });
  };

  return (
    <div className="doc-card">
      <div className="doc-card-head" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div className="doc-card-title">Schedule Setup</div>
          <div className="doc-card-sub">Configure weekly availability and appointment slot durations</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={fetchWeeklySchedule} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1px solid #d1fae5",background:"#f0fdf4",color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={11}/>Reload
          </button>
          <button onClick={saveAll} disabled={scheduleSaving}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${accent},#059669)`,color:"#fff",fontSize:12,fontWeight:700,cursor:scheduleSaving?"not-allowed":"pointer",opacity:scheduleSaving?.7:1}}>
            {scheduleSaving ? <><Loader2 size={12} style={{animation:"spin .7s linear infinite"}}/>Saving...</> : <>Save Schedule</>}
          </button>
        </div>
      </div>

      {scheduleMsg && (
        <div style={{margin:"14px 18px 0",padding:"10px 14px",borderRadius:9,background:scheduleMsg.type==="success"?"#f0fdf4":"#fff5f5",color:scheduleMsg.type==="success"?"#16a34a":"#dc2626",fontSize:13,fontWeight:600,border:`1px solid ${scheduleMsg.type==="success"?"#bbf7d0":"#fecaca"}`}}>
          {scheduleMsg.text}
        </div>
      )}

      {scheduleLoading ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"40px 0",color:"#94a3b8"}}>
          <Loader2 size={18} style={{animation:"spin .7s linear infinite"}}/>Loading schedule...
        </div>
      ) : (
        <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:8,marginBottom:4,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>Quick set:</span>
            {[
              {label:"Mon–Fri", days:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]},
              {label:"Mon–Sat", days:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"]},
              {label:"All Week", days:ALL_SCHED_DAYS},
            ].map(tmpl=>(
              <button key={tmpl.label} onClick={()=>applyTemplate(tmpl.days)}
                style={{padding:"4px 11px",borderRadius:7,border:`1px solid ${accent}44`,background:`${accent}11`,color:accent,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {tmpl.label}
              </button>
            ))}
            <button onClick={()=>applyTemplate([])}
              style={{padding:"4px 11px",borderRadius:7,border:"1px solid #fecaca",background:"#fff5f5",color:"#dc2626",fontSize:11,fontWeight:600,cursor:"pointer"}}>
              Clear All
            </button>
          </div>

          {ALL_SCHED_DAYS.map(day => {
            const s = localSchedule[day] || {startTime:"09:00",endTime:"17:00",slotDuration:30,isActive:false};
            const slots = slotsFor(s.startTime, s.endTime, s.slotDuration);
            return (
              <div key={day} style={{display:"grid",gridTemplateColumns:"80px 1fr",background:s.isActive?`${accent}08`:"#f8fafc",borderRadius:12,border:`1.5px solid ${s.isActive?accent+"33":"#e2e8f0"}`,overflow:"hidden",transition:"all .2s"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"14px 10px",borderRight:`1px solid ${s.isActive?accent+"22":"#e2e8f0"}`,background:s.isActive?`${accent}15`:"#f1f5f9",cursor:"pointer",userSelect:"none"}}
                  onClick={()=>setDay(day,"isActive",!s.isActive)}>
                  <div style={{width:36,height:20,borderRadius:100,background:s.isActive?accent:"#cbd5e1",position:"relative",transition:"background .2s",marginBottom:6}}>
                    <div style={{position:"absolute",top:2,left:s.isActive?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)",transition:"left .2s"}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:s.isActive?accent:"#94a3b8"}}>{SCHED_DAY_LABELS[day]}</span>
                </div>
                <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:14,opacity:s.isActive?1:.45,transition:"opacity .2s",flexWrap:"wrap"}}>
                  {[
                    {label:"Start", field:"startTime", value:s.startTime, type:"time"},
                    {label:"End",   field:"endTime",   value:s.endTime,   type:"time"},
                  ].map(inp=>(
                    <div key={inp.field} style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:11,color:"#64748b",fontWeight:600}}>{inp.label}</span>
                      <input type={inp.type} value={inp.value} disabled={!s.isActive}
                        onChange={e=>setDay(day,inp.field,e.target.value)}
                        style={{padding:"5px 8px",borderRadius:7,border:"1px solid #d1fae5",fontSize:12,color:"#334155",background:"#fff",outline:"none",fontFamily:"inherit"}}/>
                    </div>
                  ))}
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:11,color:"#64748b",fontWeight:600}}>Slot</span>
                    <select value={s.slotDuration} disabled={!s.isActive} onChange={e=>setDay(day,"slotDuration",Number(e.target.value))}
                      style={{padding:"5px 8px",borderRadius:7,border:"1px solid #d1fae5",fontSize:12,color:"#334155",background:"#fff",outline:"none",fontFamily:"inherit",cursor:"pointer"}}>
                      {SCHED_DURATIONS.map(d=><option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                  {s.isActive && (slots > 0
                    ? <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:100,background:`${accent}15`,color:accent}}>{slots} slots/day</span>
                    : <span style={{fontSize:11,color:"#ef4444",fontWeight:600}}>⚠ Invalid range</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Tab = "schedule"|"patients"|"prescription-settings"|"treatment-plans"|"attendance"|"schedule-mgmt";

const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const isSameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

function DoctorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { doctor, accent, doctorName } = useDoctorDashboard();
  
  const [tab, setTab] = useState<Tab>("schedule");

  useEffect(() => {
    const urlTab = (searchParams.get("tab") as Tab) || "schedule";
    setTab(urlTab);
  }, [searchParams]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [consultAppt, setConsultAppt] = useState<any>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [activePlansCount, setActivePlansCount] = useState<number | null>(null);
  const [myPlans, setMyPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansFilter, setPlansFilter] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string,any>>({});
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{type:"success"|"error";text:string}|null>(null);
  const SCHED_DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
  const initLocalSchedule = () => {
    const init: Record<string,{startTime:string;endTime:string;slotDuration:number;isActive:boolean}> = {};
    SCHED_DAYS.forEach(d => { init[d] = { startTime:"09:00", endTime:"17:00", slotDuration:30, isActive:false }; });
    return init;
  };
  const [localSchedule, setLocalSchedule] = useState<Record<string,{startTime:string;endTime:string;slotDuration:number;isActive:boolean}>>(initLocalSchedule);

  const isToday = isSameDay(selectedDate, new Date());
  const goDate = (offset: number) => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + offset); return d; });

  const fetchAppointments = useCallback(async (doctorId: string, departmentId?: string, date?: string) => {
    setLoadingAppts(true);
    let url = `/api/appointments?doctorId=${doctorId}&date=${date || fmtDate(new Date())}&limit=50&sortBy=timeSlot&sortOrder=asc`;
    if (departmentId) url += `&departmentId=${departmentId}`;
    const d = await api(url);
    if (d.success) setAppointments(d.data?.data || []);
    setLoadingAppts(false);
  }, []);

  const fetchAllPatients = useCallback(async (doctorId: string, departmentId?: string) => {
    let url = `/api/appointments?doctorId=${doctorId}&limit=200&sortBy=appointmentDate&sortOrder=desc`;
    if (departmentId) url += `&departmentId=${departmentId}`;
    const d = await api(url);
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
    if (doctor) {
      fetch("/api/doctor/attendance", { method: "POST", credentials: "include" }).catch(() => {});
      if (tab === "schedule") {
        fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate));
      }
      if (tab === "schedule" || tab === "patients") {
        fetchAllPatients(doctor.id, doctor.department?.id);
      }
      if (tab === "schedule" || tab === "treatment-plans") {
        api(`/api/treatment-plans?doctorId=${doctor.id}&status=ACTIVE&limit=1`).then(r => {
          if (r.success) setActivePlansCount(r.data?.total ?? r.data?.plans?.length ?? 0);
        }).catch(() => {});
      }
    }
  }, [doctor, tab, fetchAppointments, fetchAllPatients]);

  const fetchMyPlans = useCallback(async (doctorId: string, filter = "") => {
    setPlansLoading(true);
    const url = `/api/treatment-plans?doctorId=${doctorId}&limit=50${filter ? `&status=${filter}` : ""}`;
    const d = await api(url);
    if (d.success) setMyPlans(d.data?.plans || []);
    setPlansLoading(false);
  }, []);

  useEffect(() => {
    if (doctor && tab === "treatment-plans") {
      fetchMyPlans(doctor.id, plansFilter);
    }
  }, [tab, doctor, plansFilter, fetchMyPlans]);

  const fetchAttendance = useCallback(async (month: string) => {
    setAttendanceLoading(true);
    const d = await api(`/api/doctor/attendance?month=${month}`);
    if (d.success) setAttendance(d.data || []);
    setAttendanceLoading(false);
  }, []);

  useEffect(() => {
    if (doctor && tab === "attendance") {
      fetchAttendance(attendanceMonth);
    }
  }, [tab, doctor, attendanceMonth, fetchAttendance]);

  const fetchWeeklySchedule = useCallback(async () => {
    setScheduleLoading(true);
    const d = await api("/api/doctor/availability");
    if (d.success) {
      setWeeklySchedule(d.data || {});
      const sdays = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
      setLocalSchedule(prev => {
        const next = { ...prev };
        sdays.forEach(day => {
          const ex = (d.data || {})[day];
          next[day] = ex
            ? { startTime: ex.startTime||"09:00", endTime: ex.endTime||"17:00", slotDuration: ex.slotDuration||30, isActive: ex.isActive!==false }
            : { startTime:"09:00", endTime:"17:00", slotDuration:30, isActive:false };
        });
        return next;
      });
    }
    setScheduleLoading(false);
  }, []);

  useEffect(() => {
    if (doctor && tab === "schedule-mgmt") {
      fetchWeeklySchedule();
    }
  }, [tab, doctor, fetchWeeklySchedule]);

  useEffect(() => {
    if (doctor && tab === "schedule") {
      fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate));
    }
  }, [selectedDate, doctor, tab, fetchAppointments]);

  const handleStartPrescription = (appointmentId: string) => {
    router.push(`/doctor/dashboard/prescription/${appointmentId}`);
  };

  const handleViewPrescription = (appointmentId: string) => {
    router.push(`/doctor/dashboard/prescription/${appointmentId}?mode=view`);
  };

  const handleEditPrescription = (appointmentId: string) => {
    router.push(`/doctor/dashboard/prescription/${appointmentId}?edit=1`);
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    if (!doctor) return;
    setUpdatingStatusId(appointmentId);
    const r = await api(`/api/appointments/${appointmentId}`, "PUT", { status });
    if (r?.success) {
      await fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate));
      await fetchAllPatients(doctor.id, doctor.department?.id);
    }
    setUpdatingStatusId(null);
  };

  const todayTotal = appointments.length;
  const todayDone = appointments.filter(a => a.status === "COMPLETED").length;
  const todayRemaining = appointments.filter(a => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)).length;
  const inProgress = appointments.find(a => a.status === "IN_PROGRESS");

  return (
    <>
      {consultAppt && (
        <ConsultModal
          appt={consultAppt}
          onClose={() => setConsultAppt(null)}
          onDone={() => doctor && fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate))}
          onStartPrescription={handleStartPrescription}
          setSelectedPatientId={setSelectedPatientId}
        />
      )}
      <style>{`
        .doc-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px}
        .doc-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #d1fae5;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(16,185,129,0.06);transition:transform .2s,box-shadow .2s}
        .doc-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.08)}
        .doc-sc-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .doc-sc-lbl{font-size:11px;font-weight:500;color:#94a3b8;margin-bottom:2px}
        .doc-sc-val{font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
        .doc-sc-sub{font-size:10px;color:#94a3b8;margin-top:3px}
        .doc-card{background:#fff;border-radius:14px;border:1px solid #d1fae5;box-shadow:0 1px 4px rgba(16,185,129,0.05);overflow:hidden;margin-bottom:16px}
        .doc-card-head{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ecfdf5}
        .doc-card-title{font-size:14px;font-weight:700;color:#1e293b}
        .doc-card-sub{font-size:11px;color:#94a3b8;margin-top:2px}
        .doc-tbl{width:100%;border-collapse:collapse}
        .doc-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #ecfdf5}
        .doc-tbl td{padding:11px 12px;font-size:13px;color:#475569;border-bottom:1px solid #f0fdf4}
        .doc-tbl tr:last-child td{border-bottom:none}
        .doc-tbl tbody tr:hover td{background:#f0fdf9}
        .doc-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .doc-right{background:#fff;border-left:1px solid #d1fae5;padding:22px 18px;overflow-y:auto;position:fixed;right:0;top:64px;bottom:0;width:260px}
        .doc-right-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px}
        .doc-critical-card{padding:12px;border-radius:10px;margin-bottom:10px;cursor:pointer;transition:box-shadow .2s}
        .doc-critical-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.08)}
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 0 }}>
        <div>
          {selectedPatientId ? (
            <PatientProfilePanel 
              patientId={selectedPatientId} 
              onBack={() => setSelectedPatientId(null)} 
            />
          ) : (
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                <div className="doc-pg-title" style={{marginBottom:0}}>Good morning, Dr. {doctorName.split(" ").slice(-1)[0]} 👋</div>
                <span style={{fontSize:12,color:"#64748b",background:"#f0fdf4",border:"1px solid #d1fae5",padding:"5px 12px",borderRadius:8,fontWeight:500}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long"})}</span>
              </div>

              <div className="doc-stats">
                {[
                  {icon:<CalendarDays size={20} color="#fff"/>, label:isToday?"Today's Appointments":"Appointments", val:todayTotal, sub:`${todayRemaining} remaining`, bg:"#E6F4F4", iconBg:"#0E898F"},
                  {icon:<CheckCircle2 size={20} color="#fff"/>, label:"Completed", val:todayDone, sub:isToday?"today so far":"on this day", bg:"#f0fdf4", iconBg:"#10b981"},
                  {icon:<Clock size={20} color="#fff"/>, label:"Remaining", val:todayRemaining, sub:"scheduled / confirmed", bg:"#fff7ed", iconBg:"#f59e0b"},
                  {icon:<UserRound size={20} color="#fff"/>, label:"Total Patients", val:allPatients.length, sub:"all time", bg:"#fdf4ff", iconBg:"#a855f7"},
                  {icon:<Activity size={20} color="#fff"/>, label:"Active Plans", val:activePlansCount??"—", sub:"treatment plans", bg:"#f0fdf4", iconBg:"#059669"},
                ].map((s,i)=>(
                  <div key={i} className="doc-sc" style={{background:s.bg}}>
                    <div className="doc-sc-icon" style={{background:s.iconBg}}>{s.icon}</div>
                    <div><div className="doc-sc-lbl">{s.label}</div><div className="doc-sc-val">{s.val}</div><div className="doc-sc-sub">{s.sub}</div></div>
                  </div>
                ))}
              </div>

              {inProgress && (
                <div style={{background:"linear-gradient(135deg,#0E898F,#07595D)",borderRadius:14,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",color:"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"pulse 1.5s ease-in-out infinite"}}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>Consultation in progress — {inProgress.patient?.name}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.75)"}}>Token #{inProgress.tokenNumber} · {inProgress.timeSlot} · {TYPE_LABEL[inProgress.type]}</div>
                    </div>
                  </div>
                  <button onClick={()=>handleStartPrescription(inProgress.id)}
                    style={{padding:"8px 16px",borderRadius:9,border:"none",background:"rgba(255,255,255,.2)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    Continue →
                  </button>
                </div>
              )}

              {tab==="schedule" && (
                <div className="doc-card">
                  <div className="doc-card-head">
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <button onClick={()=>goDate(-1)} style={{width:30,height:30,borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}><ChevronLeft size={14}/></button>
                      <div style={{textAlign:"center",minWidth:140}}>
                        <div className="doc-card-title">{isToday ? "Today's Appointments" : "Appointments"}</div>
                        <div className="doc-card-sub">{selectedDate.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
                      </div>
                      <button onClick={()=>goDate(1)} style={{width:30,height:30,borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}><ChevronRight size={14}/></button>
                      {!isToday && <button onClick={()=>setSelectedDate(new Date())} style={{padding:"5px 10px",borderRadius:7,border:"1px solid #d1fae5",background:"#f0fdf4",color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer"}}>Today</button>}
                      <input type="date" value={fmtDate(selectedDate)} onChange={e=>{if(e.target.value) setSelectedDate(new Date(e.target.value+"T00:00:00"))}} style={{padding:"5px 8px",borderRadius:7,border:"1px solid #e2e8f0",background:"#f8fafc",fontSize:12,color:"#334155",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}/>
                    </div>
                    <button onClick={()=>doctor && fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate))}
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
                      <div style={{fontSize:14,fontWeight:600,color:"#64748b"}}>No appointments {isToday?"today":"on this day"}</div>
                      <div style={{fontSize:12,marginTop:4}}>Your schedule is clear {isToday?"for today":"for "+selectedDate.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
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
                                <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={() => a.patient?.id && setSelectedPatientId(a.patient.id)}>
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
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  {canConsult && (
                                    <button onClick={()=>handleStartPrescription(a.id)}
                                      style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"none",background:a.status==="IN_PROGRESS"?"linear-gradient(135deg,#0E898F,#0A6B70)":"linear-gradient(135deg,#10b981,#059669)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:a.status==="IN_PROGRESS"?"0 3px 10px rgba(59,130,246,.3)":"0 3px 10px rgba(16,185,129,.3)"}}>
                                      <PlayCircle size={12}/>{a.status==="IN_PROGRESS"?"Continue":"Consult"}
                                    </button>
                                  )}
                                  {a.status === "COMPLETED" && (
                                    <>
                                      <button onClick={()=>handleViewPrescription(a.id)}
                                        style={{display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#334155",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                                        <FileText size={12}/>View Rx
                                      </button>
                                      <button onClick={()=>handleEditPrescription(a.id)}
                                        style={{display:"flex",alignItems:"center",gap:5,padding:"6px 10px",borderRadius:8,border:"1px solid #B3E0E0",background:"#E6F4F4",color:"#0A6B70",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                                        <Pencil size={12}/>Edit Rx
                                      </button>
                                    </>
                                  )}
                                  {!canConsult && a.status !== "COMPLETED" && <span style={{fontSize:11,color:"#94a3b8"}}>—</span>}
                                  <select
                                    value={a.status}
                                    disabled={updatingStatusId === a.id}
                                    onChange={(e) => updateAppointmentStatus(a.id, e.target.value)}
                                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 11, color: "#334155", cursor: updatingStatusId === a.id ? "not-allowed" : "pointer" }}
                                  >
                                    {["SCHEDULED","CONFIRMED","IN_PROGRESS","COMPLETED","NO_SHOW","CANCELLED","RESCHEDULED"].map(s => (
                                      <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

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
                          <tr key={p.id} onClick={() => setSelectedPatientId(p.id)} style={{cursor:"pointer"}}>
                            <td><span style={{fontFamily:"monospace",fontWeight:700,color:"#0369a1",background:"#f0f9ff",padding:"3px 8px",borderRadius:6,fontSize:11}}>{p.patientId}</span></td>
                            <td style={{fontWeight:600,color:"#1e293b"}}>{p.name}</td>
                            <td style={{color:"#64748b"}}>{p.phone||"—"}</td>
                            <td>{p.gender ? <span style={{fontSize:10,background:"#f1f5f9",color:"#475569",padding:"3px 7px",borderRadius:100,fontWeight:600}}>{p.gender}</span> : "—"}</td>
                            <td style={{fontSize:12,color:"#64748b"}}>{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—"}</td>
                            <td>{p.lastType ? <span style={{fontSize:10,background:"#f1f5f9",color:"#475569",padding:"3px 7px",borderRadius:6,fontWeight:600}}>{TYPE_LABEL[p.lastType]||p.lastType}</span> : "—"}</td>
                            <td>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPatientId(p.id); }}
                                style={{fontSize:11,color:"#0E898F",fontWeight:600,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                                Profile <ChevronRight size={11}/>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab==="prescription-settings" && <PrescriptionSettingsPanel />}

              {tab==="treatment-plans" && (
                <div className="doc-card">
                  <div className="doc-card-head">
                    <div>
                      <div className="doc-card-title">My Treatment Plans</div>
                      <div className="doc-card-sub">{activePlansCount ?? "—"} active · {myPlans.length} shown</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {["",("ACTIVE"),("COMPLETED"),("ON_HOLD"),("CANCELLED")].map(f=>(
                        <button key={f} onClick={()=>setPlansFilter(f)}
                          style={{padding:"5px 12px",borderRadius:8,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",
                            background:plansFilter===f?accent+"22":"#f8fafc",color:plansFilter===f?accent:"#64748b"}}>
                          {f||"All"}
                        </button>
                      ))}
                      <button onClick={()=>doctor&&fetchMyPlans(doctor.id,plansFilter)}
                        style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,border:"1px solid #d1fae5",background:"#f0fdf4",color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                        <RefreshCw size={11}/>Refresh
                      </button>
                    </div>
                  </div>
                  {plansLoading ? (
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"40px 0",color:"#94a3b8"}}>
                      <Loader2 size={18} style={{animation:"spin .7s linear infinite"}}/>Loading treatment plans...
                    </div>
                  ) : myPlans.length === 0 ? (
                    <div style={{textAlign:"center",padding:"48px 20px",color:"#94a3b8"}}>
                      <Activity size={32} style={{marginBottom:10,opacity:.4}}/>
                      <div style={{fontSize:14,fontWeight:600,color:"#64748b"}}>No treatment plans found</div>
                    </div>
                  ) : (
                    <div style={{padding:"0 0 4px"}}>
                      {myPlans.map((plan:any)=>{
                        const pct = plan.totalSessions>0?Math.round((plan.completedSessions/plan.totalSessions)*100):0;
                        const STATUS_SC:any={ACTIVE:{bg:"#E6F4F4",c:"#0A6B70"},COMPLETED:{bg:"#f0fdf4",c:"#16a34a"},CANCELLED:{bg:"#fff5f5",c:"#ef4444"},ON_HOLD:{bg:"#fefce8",c:"#ca8a04"}};
                        const sc=STATUS_SC[plan.status]||{bg:"#f8fafc",c:"#64748b"};
                        const bal=(plan.totalCost||0)-(plan.paidAmount||0);
                        return (
                          <div key={plan.id} style={{padding:"14px 18px",borderBottom:"1px solid #f0fdf4"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                              <div>
                                <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{plan.planName}</div>
                                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
                                  {plan.patient?.name} · {plan.service?.name||""}
                                </div>
                              </div>
                              <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                                <span style={{...sc,padding:"3px 10px",borderRadius:100,fontSize:10,fontWeight:700,border:`1px solid ${sc.c}33`}}>{plan.status}</span>
                                {bal>0&&<span style={{fontSize:11,color:"#ef4444",fontWeight:600}}>₹{bal.toLocaleString()} due</span>}
                              </div>
                            </div>
                            <div style={{height:5,background:"#e2e8f0",borderRadius:100,overflow:"hidden",marginBottom:6}}>
                              <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${accent},#10b981)`,borderRadius:100}}/>
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8"}}>
                              <span>{plan.completedSessions}/{plan.totalSessions} sessions ({pct}%)</span>
                              <span>₹{(plan.paidAmount||0).toLocaleString()} paid of ₹{(plan.totalCost||0).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "attendance" && (
            <div className="doc-card">
              <div className="doc-card-head" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div className="doc-card-title">My Attendance</div>
                  <div className="doc-card-sub">Monthly login &amp; punctuality records</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input
                    type="month"
                    value={attendanceMonth}
                    onChange={e=>setAttendanceMonth(e.target.value)}
                    style={{padding:"6px 10px",borderRadius:8,border:"1px solid #d1fae5",fontSize:12,color:"#334155",outline:"none",background:"#f0fdf4",fontFamily:"inherit"}}
                  />
                  <button onClick={()=>fetchAttendance(attendanceMonth)}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1px solid #d1fae5",background:"#f0fdf4",color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                    <RefreshCw size={11}/>Refresh
                  </button>
                </div>
              </div>

              {(() => {
                const statusCfg: Record<string,{bg:string;c:string;label:string}> = {
                  PRESENT:  {bg:"#f0fdf4",c:"#16a34a",label:"Present"},
                  LATE:     {bg:"#fefce8",c:"#ca8a04",label:"Late"},
                  HALF_DAY: {bg:"#fff7ed",c:"#ea580c",label:"Half Day"},
                  ABSENT:   {bg:"#fff5f5",c:"#dc2626",label:"Absent"},
                };
                const presentCount = attendance.filter(a=>a.status==="PRESENT").length;
                const lateCount    = attendance.filter(a=>a.status==="LATE").length;
                const halfCount    = attendance.filter(a=>a.status==="HALF_DAY").length;
                return (
                  <>
                    {/* Summary chips */}
                    <div style={{display:"flex",gap:10,padding:"14px 18px",borderBottom:"1px solid #f0fdf4"}}>
                      {[{label:"Present",val:presentCount,bg:"#f0fdf4",c:"#16a34a"},{label:"Late",val:lateCount,bg:"#fefce8",c:"#ca8a04"},{label:"Half Day",val:halfCount,bg:"#fff7ed",c:"#ea580c"},{label:"Total",val:attendance.length,bg:"#f8fafc",c:"#475569"}].map((s,i)=>(
                        <div key={i} style={{flex:1,background:s.bg,borderRadius:10,padding:"10px 14px",textAlign:"center",border:`1px solid ${s.c}22`}}>
                          <div style={{fontSize:10,fontWeight:600,color:s.c,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{s.label}</div>
                          <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.val}</div>
                        </div>
                      ))}
                    </div>

                    {attendanceLoading ? (
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"40px 0",color:"#94a3b8"}}>
                        <Loader2 size={18} style={{animation:"spin .7s linear infinite"}}/>Loading attendance...
                      </div>
                    ) : attendance.length === 0 ? (
                      <div style={{textAlign:"center",padding:"48px 20px",color:"#94a3b8"}}>
                        <ClipboardCheck size={32} style={{marginBottom:10,opacity:.3,display:"block",margin:"0 auto 10px"}}/>
                        <div style={{fontSize:14,fontWeight:600,color:"#64748b"}}>No attendance records for this month</div>
                        <div style={{fontSize:12,marginTop:4}}>Records appear automatically on login</div>
                      </div>
                    ) : (
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
                              {["Date","Day","Status","Login Time","Notes"].map(h=>(
                                <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.map((rec:any)=>{
                              const sc = statusCfg[rec.status] || statusCfg.PRESENT;
                              const d = new Date(rec.date);
                              const dayName = d.toLocaleDateString("en-IN",{weekday:"short"});
                              const dateStr = d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
                              const loginTime = rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—";
                              return (
                                <tr key={rec.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                                  <td style={{padding:"12px 14px",fontSize:13,fontWeight:600,color:"#1e293b"}}>{dateStr}</td>
                                  <td style={{padding:"12px 14px",fontSize:12,color:"#64748b"}}>{dayName}</td>
                                  <td style={{padding:"12px 14px"}}>
                                    <span style={{padding:"3px 10px",borderRadius:100,fontSize:10,fontWeight:700,background:sc.bg,color:sc.c,border:`1px solid ${sc.c}33`}}>{sc.label}</span>
                                  </td>
                                  <td style={{padding:"12px 14px",fontSize:12,color:"#64748b"}}>{loginTime}</td>
                                  <td style={{padding:"12px 14px",fontSize:11,color:"#94a3b8"}}>{rec.notes||"—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {tab === "schedule-mgmt" && <ScheduleMgmtTab
            accent={accent}
            localSchedule={localSchedule}
            setLocalSchedule={setLocalSchedule}
            scheduleLoading={scheduleLoading}
            scheduleSaving={scheduleSaving}
            setScheduleSaving={setScheduleSaving}
            scheduleMsg={scheduleMsg}
            setScheduleMsg={setScheduleMsg}
            fetchWeeklySchedule={fetchWeeklySchedule}
          />}
        </div>

        {/* Right Sidebar */}
        <div className="doc-right">
          <div style={{marginBottom:22}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Date</div>
            <MiniCalendar accent={accent} selectedDate={selectedDate} onDateSelect={setSelectedDate}/>
          </div>
          <div>
            <div className="doc-right-title" style={{marginBottom:10}}>{isToday?"Today's Queue":"Queue · "+selectedDate.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
            {appointments.length === 0 ? (
              <div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"16px 0"}}>No appointments {isToday?"today":"on this day"}</div>
            ) : appointments.slice(0,6).map((a:any)=>{
              const sc = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
              return (
                <div key={a.id} className="doc-critical-card" style={{background:a.status==="IN_PROGRESS"?"#E6F4F4":a.status==="COMPLETED"?"#f0fdf4":"#f8fafc",border:`1px solid ${a.status==="IN_PROGRESS"?"#B3E0E0":a.status==="COMPLETED"?"#bbf7d0":"#e2e8f0"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{a.patient?.name||"—"}</div>
                    <span className="doc-badge" style={{background:sc.badge[0],color:sc.badge[1],border:`1px solid ${sc.badge[2]}`}}>{sc.label}</span>
                  </div>
                  <div style={{fontSize:11,color:"#64748b"}}>{a.timeSlot} · Token #{a.tokenNumber||"—"}</div>
                  {["SCHEDULED","CONFIRMED","IN_PROGRESS"].includes(a.status) && (
                    <button onClick={()=>setConsultAppt(a)}
                      style={{marginTop:7,width:"100%",padding:"5px 0",borderRadius:7,border:"none",background:a.status==="IN_PROGRESS"?"#0E898F":accent,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                      {a.status==="IN_PROGRESS"?"Continue":"Consult"}
                    </button>
                  )}
                  {a.status === "COMPLETED" && (
                    <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                      <button onClick={()=>handleViewPrescription(a.id)}
                        style={{flex:1,padding:"5px 0",borderRadius:7,border:"1px solid #e2e8f0",background:"#fff",color:"#334155",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        View Rx
                      </button>
                      <button onClick={()=>handleEditPrescription(a.id)}
                        style={{flex:1,padding:"5px 0",borderRadius:7,border:"1px solid #B3E0E0",background:"#E6F4F4",color:"#0A6B70",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DoctorDashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", fontSize: 14, gap: 14 }}>
        <Loader2 size={24} style={{ animation: "spin .7s linear infinite" }} />
        Loading dashboard...
      </div>
    }>
      <DoctorDashboardContent />
    </Suspense>
  );
}
