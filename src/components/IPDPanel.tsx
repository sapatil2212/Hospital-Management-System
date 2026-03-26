"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BedDouble, Plus, Search, RefreshCw, Loader2, X, CheckCircle2,
  User, Phone, Stethoscope, Calendar, Clock, AlertTriangle, LogOut, Download
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const daysSince = (d: string | Date | null | undefined) => {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
};

const CSS = `
  @keyframes ipdFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ipdSpin{to{transform:rotate(360deg)}}
  .ipd-spin{animation:ipdSpin .7s linear infinite}
  .ipd-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .ipd-modal{background:#fff;border-radius:18px;width:100%;max-width:560px;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:ipdFadeUp .25s ease;max-height:90vh;overflow-y:auto}
  .ipd-modal-hd{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc;border-radius:18px 18px 0 0;position:sticky;top:0;z-index:1}
  .ipd-modal-title{font-size:17px;font-weight:800;color:#1e293b}
  .ipd-modal-body{padding:24px;display:flex;flex-direction:column;gap:16px}
  .ipd-modal-foot{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;background:#f8fafc;border-radius:0 0 18px 18px}
  .ipd-field{display:flex;flex-direction:column;gap:5px}
  .ipd-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .ipd-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
  .ipd-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;font-family:inherit;transition:border-color .2s}
  .ipd-input:focus{border-color:#0E898F;box-shadow:0 0 0 3px rgba(14,137,143,.1)}
  .ipd-input::placeholder{color:#94a3b8}
  .ipd-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;font-family:inherit;cursor:pointer}
  .ipd-btn-primary{padding:10px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,#0E898F,#07595D);color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(14,137,143,.28);transition:all .15s;font-family:inherit}
  .ipd-btn-primary:hover{transform:translateY(-1px)}
  .ipd-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .ipd-btn-ghost{padding:10px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
  .ipd-btn-ghost:hover{background:#f8fafc}
  .ipd-btn-danger{padding:8px 14px;border-radius:8px;border:none;background:#ef4444;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px}
  .ipd-btn-sm{padding:6px 12px;border-radius:7px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit;transition:all .12s;white-space:nowrap}
  .ipd-btn-sm:hover{background:#f8fafc}
  .ipd-btn-sm.teal{background:#E6F4F4;border-color:#B3E0E0;color:#0A6B70}
  .ipd-btn-sm.red{background:#fff5f5;border-color:#fecaca;color:#dc2626}
`;

interface BedOverview {
  wards: Ward[];
  summary: { total: number; available: number; occupied: number; maintenance: number; reserved: number };
}
interface Ward {
  id: string;
  name: string;
  type: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  beds: Bed[];
}
interface Bed {
  id: string;
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
  type?: string;
  activeAllocation?: Allocation | null;
}
interface Allocation {
  id: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  diagnosis?: string;
  admittingDoctorName?: string;
  admissionDate: string;
  expectedDischargeDate?: string;
  status: string;
}

const BED_STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  AVAILABLE:   { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Available" },
  OCCUPIED:    { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Occupied" },
  MAINTENANCE: { bg: "#fef3c7", color: "#b45309", border: "#fde68a", label: "Maintenance" },
  RESERVED:    { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd", label: "Reserved" },
};

function AllocateModal({ bed, onClose, onDone }: { bed: Bed; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    patientName: "", patientAge: "", patientGender: "Male", patientPhone: "",
    attendantName: "", attendantPhone: "", diagnosis: "", admittingDoctorName: "",
    admissionDate: new Date().toISOString().split("T")[0],
    expectedDischargeDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName.trim()) { setError("Patient name is required"); return; }
    setSaving(true);
    setError("");
    const payload: any = {
      bedId: bed.id,
      patientName: form.patientName.trim(),
      patientAge: form.patientAge ? parseInt(form.patientAge) : undefined,
      patientGender: form.patientGender || undefined,
      patientPhone: form.patientPhone || undefined,
      attendantName: form.attendantName || undefined,
      attendantPhone: form.attendantPhone || undefined,
      diagnosis: form.diagnosis || undefined,
      admittingDoctorName: form.admittingDoctorName || undefined,
      admissionDate: form.admissionDate || undefined,
      expectedDischargeDate: form.expectedDischargeDate || undefined,
      notes: form.notes || undefined,
    };
    const res = await api("/api/ipd/allocate-bed", "POST", payload);
    setSaving(false);
    if (res.success) { onDone(); onClose(); }
    else setError(res.message || "Failed to allocate bed");
  };

  return (
    <div className="ipd-overlay" onClick={onClose}>
      <div className="ipd-modal" onClick={e => e.stopPropagation()}>
        <div className="ipd-modal-hd">
          <div>
            <div className="ipd-modal-title">Admit Patient — Bed {bed.bedNumber}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Fill patient admission details</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="ipd-modal-body">
            {error && <div style={{ background: "#fff5f5", color: "#dc2626", padding: "10px 14px", borderRadius: 9, fontSize: 13, border: "1px solid #fecaca" }}>{error}</div>}
            <div className="ipd-grid-2">
              <div className="ipd-field" style={{ gridColumn: "1/-1" }}>
                <label className="ipd-lbl">Patient Name *</label>
                <input className="ipd-input" value={form.patientName} onChange={e => set("patientName", e.target.value)} placeholder="Full name" required />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Age</label>
                <input className="ipd-input" type="number" min="0" max="150" value={form.patientAge} onChange={e => set("patientAge", e.target.value)} placeholder="e.g. 35" />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Gender</label>
                <select className="ipd-select" value={form.patientGender} onChange={e => set("patientGender", e.target.value)}>
                  {["Male","Female","Other"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Patient Phone</label>
                <input className="ipd-input" value={form.patientPhone} onChange={e => set("patientPhone", e.target.value)} placeholder="Phone number" />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Admitting Doctor</label>
                <input className="ipd-input" value={form.admittingDoctorName} onChange={e => set("admittingDoctorName", e.target.value)} placeholder="Doctor name" />
              </div>
              <div className="ipd-field" style={{ gridColumn: "1/-1" }}>
                <label className="ipd-lbl">Diagnosis / Reason</label>
                <input className="ipd-input" value={form.diagnosis} onChange={e => set("diagnosis", e.target.value)} placeholder="Primary diagnosis" />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Admission Date</label>
                <input className="ipd-input" type="date" value={form.admissionDate} onChange={e => set("admissionDate", e.target.value)} />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Expected Discharge</label>
                <input className="ipd-input" type="date" value={form.expectedDischargeDate} onChange={e => set("expectedDischargeDate", e.target.value)} />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Attendant Name</label>
                <input className="ipd-input" value={form.attendantName} onChange={e => set("attendantName", e.target.value)} placeholder="Attendant" />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Attendant Phone</label>
                <input className="ipd-input" value={form.attendantPhone} onChange={e => set("attendantPhone", e.target.value)} placeholder="Phone" />
              </div>
              <div className="ipd-field" style={{ gridColumn: "1/-1" }}>
                <label className="ipd-lbl">Notes</label>
                <textarea className="ipd-input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes..." style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>
          <div className="ipd-modal-foot">
            <button type="button" className="ipd-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ipd-btn-primary" disabled={saving}>
              {saving && <Loader2 size={13} className="ipd-spin" />}
              {saving ? "Admitting..." : "Admit Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DischargeModal({ allocation, bedNumber, onClose, onDone }: { allocation: Allocation; bedNumber: string; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState("");
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api("/api/ipd/discharge-bed", "POST", {
      allocationId: allocation.id,
      actualDischargeDate: dischargeDate || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (res.success) { onDone(); onClose(); }
    else alert(res.message || "Failed to discharge");
  };

  return (
    <div className="ipd-overlay" onClick={onClose}>
      <div className="ipd-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="ipd-modal-hd">
          <div>
            <div className="ipd-modal-title">Discharge Patient</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Bed {bedNumber} · {allocation.patientName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="ipd-modal-body">
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c2410c", marginBottom: 6 }}>Confirm Discharge</div>
              <div style={{ fontSize: 12, color: "#7c3aed" }}>
                Admitting: {fmtDate(allocation.admissionDate)} ({daysSince(allocation.admissionDate)} days) ·
                {allocation.diagnosis && ` ${allocation.diagnosis}`}
              </div>
            </div>
            <div className="ipd-field">
              <label className="ipd-lbl">Discharge Date</label>
              <input className="ipd-input" type="date" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} />
            </div>
            <div className="ipd-field">
              <label className="ipd-lbl">Discharge Notes</label>
              <textarea className="ipd-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Discharge summary / instructions..." style={{ resize: "vertical" }} />
            </div>
          </div>
          <div className="ipd-modal-foot">
            <button type="button" className="ipd-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ipd-btn-danger" disabled={saving}>
              {saving && <Loader2 size={13} className="ipd-spin" />}
              {saving ? "Discharging..." : "Discharge Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IPDPanel() {
  const [overview, setOverview] = useState<BedOverview | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"beds" | "admissions">("beds");
  const [search, setSearch] = useState("");
  const [allocateBed, setAllocateBed] = useState<Bed | null>(null);
  const [dischargingAlloc, setDischargingAlloc] = useState<{ allocation: Allocation; bedNumber: string } | null>(null);
  const [updatingBedId, setUpdatingBedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, al] = await Promise.all([
      api("/api/ipd/bed-status"),
      api("/api/ipd/bed-status?type=allocations&status=ACTIVE"),
    ]);
    if (ov.success) setOverview(ov.data);
    if (al.success) setAllocations(al.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBedStatusChange = async (bedId: string, status: "AVAILABLE" | "MAINTENANCE" | "RESERVED") => {
    setUpdatingBedId(bedId);
    await api("/api/ipd/bed-status", "PATCH", { bedId, status });
    setUpdatingBedId(null);
    load();
  };

  const filteredWards = overview?.wards?.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.beds.some(b => b.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.activeAllocation?.patientName?.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const filteredAllocations = allocations.filter(a =>
    !search ||
    a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    a.bed?.bedNumber?.toLowerCase().includes(search.toLowerCase()) ||
    a.bed?.ward?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const summary = overview?.summary;

  return (
    <>
      <style>{CSS}</style>

      {allocateBed && (
        <AllocateModal bed={allocateBed} onClose={() => setAllocateBed(null)} onDone={load} />
      )}
      {dischargingAlloc && (
        <DischargeModal
          allocation={dischargingAlloc.allocation}
          bedNumber={dischargingAlloc.bedNumber}
          onClose={() => setDischargingAlloc(null)}
          onDone={load}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0 }}>IPD — Ward & Bed Management</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
            {summary ? `${summary.total} beds · ${summary.occupied} occupied · ${summary.available} available` : "Loading..."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 9, padding: 3 }}>
            {[{ id: "beds", label: "Bed Map" }, { id: "admissions", label: "Admissions" }].map(v => (
              <button key={v.id} onClick={() => setView(v.id as any)}
                style={{ padding: "6px 14px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: view === v.id ? "#fff" : "transparent", color: view === v.id ? "#0E898F" : "#64748b", boxShadow: view === v.id ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}>
                {v.label}
              </button>
            ))}
          </div>
          <a href="/api/export/ipd" download title="Export IPD admissions as CSV"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            <Download size={13} />Export CSV
          </a>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Beds", val: summary.total, bg: "#f1f5f9", color: "#475569" },
            { label: "Occupied", val: summary.occupied, bg: "#fff7ed", color: "#c2410c" },
            { label: "Available", val: summary.available, bg: "#f0fdf4", color: "#16a34a" },
            { label: "Maintenance", val: summary.maintenance + summary.reserved, bg: "#fef3c7", color: "#b45309" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${s.color}22` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", marginBottom: 18 }}>
        <Search size={15} color="#94a3b8" />
        <input
          placeholder={view === "beds" ? "Search ward or bed number..." : "Search patient or bed..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#334155", background: "transparent" }}
        />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={14} /></button>}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 0", color: "#94a3b8" }}>
          <Loader2 size={22} color="#0E898F" className="ipd-spin" /> Loading ward data...
        </div>
      ) : view === "beds" ? (
        /* ── BED MAP VIEW ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filteredWards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <BedDouble size={36} style={{ margin: "0 auto 12px", display: "block", opacity: .3 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>No wards configured</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add wards & beds in Configure → Ward & Bed Setup</div>
            </div>
          ) : filteredWards.map(ward => (
            <div key={ward.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <BedDouble size={18} color="#0E898F" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{ward.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{ward.type} · {ward.totalBeds} beds</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>{ward.availableBeds} available</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>{ward.occupiedBeds} occupied</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, padding: 16 }}>
                {ward.beds.map((bed: Bed) => {
                  const sc = BED_STATUS_CFG[bed.status] || BED_STATUS_CFG.AVAILABLE;
                  const alloc = bed.activeAllocation;
                  const days = alloc ? daysSince(alloc.admissionDate) : 0;
                  return (
                    <div key={bed.id} style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, borderRadius: 12, padding: 14, position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>Bed {bed.bedNumber}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                      </div>

                      {bed.status === "AVAILABLE" && (
                        <button className="ipd-btn-sm teal" onClick={() => setAllocateBed(bed)} style={{ width: "100%", justifyContent: "center" }}>
                          <Plus size={11} /> Admit Patient
                        </button>
                      )}

                      {bed.status === "OCCUPIED" && alloc && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>{alloc.patientName}</div>
                          {alloc.patientAge && <div style={{ fontSize: 11, color: "#64748b" }}>{alloc.patientAge}y {alloc.patientGender}</div>}
                          {alloc.diagnosis && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontStyle: "italic" }}>{alloc.diagnosis}</div>}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>{days}d admitted</span>
                            <button className="ipd-btn-sm red" onClick={() => setDischargingAlloc({ allocation: alloc, bedNumber: bed.bedNumber })}>
                              <LogOut size={10} /> Discharge
                            </button>
                          </div>
                        </>
                      )}

                      {(bed.status === "MAINTENANCE" || bed.status === "RESERVED") && (
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <button className="ipd-btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 10 }}
                            disabled={updatingBedId === bed.id}
                            onClick={() => handleBedStatusChange(bed.id, "AVAILABLE")}>
                            {updatingBedId === bed.id ? <Loader2 size={9} className="ipd-spin" /> : <CheckCircle2 size={10} />}
                            Mark Available
                          </button>
                        </div>
                      )}

                      {bed.status === "AVAILABLE" && (
                        <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                          <button className="ipd-btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 10 }}
                            onClick={() => handleBedStatusChange(bed.id, "MAINTENANCE")}>
                            <AlertTriangle size={9} /> Maint.
                          </button>
                          <button className="ipd-btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 10 }}
                            onClick={() => handleBedStatusChange(bed.id, "RESERVED")}>
                            <Clock size={9} /> Reserve
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── ADMISSIONS LIST VIEW ── */
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Active Admissions ({filteredAllocations.length})</div>
          </div>
          {filteredAllocations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <User size={32} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>No active admissions</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    {["Bed", "Patient", "Age/Gender", "Diagnosis", "Doctor", "Admitted", "Days", "Exp. Discharge", "Action"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((a: any) => {
                    const days = daysSince(a.admissionDate);
                    const overdue = a.expectedDischargeDate && new Date(a.expectedDischargeDate) < new Date();
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "13px 14px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0E898F" }}>{a.bed?.bedNumber || "—"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.bed?.ward?.name || ""}</div>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{a.patientName}</div>
                          {a.patientPhone && <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><Phone size={9} />{a.patientPhone}</div>}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#64748b" }}>
                          {a.patientAge ? `${a.patientAge}y` : "—"} {a.patientGender || ""}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#475569", maxWidth: 160 }}>
                          {a.diagnosis || "—"}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#64748b" }}>
                          {a.admittingDoctorName ? <><Stethoscope size={11} style={{ display: "inline", marginRight: 4 }} />{a.admittingDoctorName}</> : "—"}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                          {fmtDate(a.admissionDate)}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: days > 7 ? "#fff7ed" : "#f0fdf4", color: days > 7 ? "#c2410c" : "#16a34a" }}>{days}d</span>
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, whiteSpace: "nowrap", color: overdue ? "#dc2626" : "#64748b", fontWeight: overdue ? 700 : 400 }}>
                          {overdue && <AlertTriangle size={11} style={{ display: "inline", marginRight: 4 }} />}
                          {fmtDate(a.expectedDischargeDate)}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <button className="ipd-btn-sm red"
                            onClick={() => setDischargingAlloc({ allocation: a, bedNumber: a.bed?.bedNumber || "" })}>
                            <LogOut size={11} /> Discharge
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
