"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, Plus, X, Loader2, Calendar, Clock, User, Stethoscope,
  Building2, CheckCircle, XCircle, AlertCircle, RefreshCw, Hash,
  Phone, Mail, ChevronRight, Eye, ClipboardList, CalendarCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Patient { id: string; patientId: string; name: string; phone: string; email?: string; gender?: string; dateOfBirth?: string; bloodGroup?: string; }
interface Doctor { id: string; name: string; specialization?: string; departmentId?: string; department?: { name: string }; consultationFee?: number; }
interface Department { id: string; name: string; code: string; }
interface Appointment {
  id: string; patientId: string; doctorId: string; departmentId?: string;
  appointmentDate: string; timeSlot: string; type: string; status: string;
  consultationFee?: number; tokenNumber?: number; notes?: string;
  patient?: Patient; doctor?: Doctor; department?: Department;
  createdAt: string;
}

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SCHEDULED: { label: "Scheduled", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  CONFIRMED: { label: "Confirmed", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  COMPLETED: { label: "Completed", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "#fff5f5", border: "#fecaca" },
  NO_SHOW: { label: "No Show", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  RESCHEDULED: { label: "Rescheduled", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
};

const TYPE_COLORS: Record<string, string> = {
  OPD: "#3b82f6", ONLINE: "#8b5cf6", FOLLOW_UP: "#10b981", EMERGENCY: "#ef4444",
};

const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT SEARCH / QUICK-ADD
// ─────────────────────────────────────────────────────────────────────────────
function PatientSearchBox({ onSelect }: { onSelect: (p: Patient) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", gender: "", bloodGroup: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback((val: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const d = await api(`/api/patients?q=${encodeURIComponent(val)}`);
      setResults(d.data || []);
      setLoading(false);
    }, 300);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    const d = await api("/api/patients", "POST", form);
    if (d.success) { onSelect(d.data.patient); setShowAdd(false); setQ(""); setResults([]); }
    else setMsg(d.message || "Error registering patient");
    setSaving(false);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
        Step 1 — Select or Register Patient
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
            <Search size={15} color="#94a3b8" />
            <input
              style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#334155", flex: 1 }}
              placeholder="Search by name, phone, or Patient ID..."
              value={q}
              onChange={e => { setQ(e.target.value); search(e.target.value); }}
            />
            {loading && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} color="#94a3b8" />}
          </div>
          {results.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 280, overflowY: "auto", marginTop: 4 }}>
              {results.map(p => (
                <button key={p.id} onClick={() => { onSelect(p); setResults([]); setQ(""); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f1f5f9" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.patientId} · {p.phone}</div>
                  </div>
                  {p.gender && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>{p.gender}</span>}
                  <ChevronRight size={13} color="#cbd5e1" />
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px dashed #cbd5e1", background: showAdd ? "#eff6ff" : "#fff", color: showAdd ? "#2563eb" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <Plus size={14} />New Patient
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20, marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 14 }}>Register New Patient</div>
          <form onSubmit={handleRegister} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { k: "name", l: "Full Name *", ph: "John Doe", req: true },
              { k: "phone", l: "Phone *", ph: "+91 98765 43210", req: true },
              { k: "email", l: "Email", ph: "patient@email.com", req: false },
            ].map(f => (
              <div key={f.k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{f.l}</label>
                <input style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                  placeholder={f.ph} value={(form as any)[f.k]} required={f.req}
                  onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Gender</label>
              <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            {msg && <div style={{ gridColumn: "1/-1", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{msg}</div>}
            <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => setShowAdd(false)}
                style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={saving}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}Register & Select
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING FORM
// ─────────────────────────────────────────────────────────────────────────────
function BookingForm({ patient, onSuccess, onCancel }: { patient: Patient; onSuccess: () => void; onCancel: () => void }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({
    departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "",
    type: "OPD", notes: "", consultationFee: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/config/departments?simple=true").then(d => setDepartments(d.data || []));
  }, []);

  useEffect(() => {
    if (!form.departmentId) { setDoctors([]); return; }
    api(`/api/config/doctors?simple=true&departmentId=${form.departmentId}`).then(d => setDoctors(d.data || []));
  }, [form.departmentId]);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate) { setSlots([]); return; }
    setLoadingSlots(true);
    api(`/api/appointments/slots?doctorId=${form.doctorId}&date=${form.appointmentDate}`)
      .then(d => {
        setSlots(d.data?.slots || []);
        setBookedSlots(d.data?.bookedSlots || []);
      })
      .finally(() => setLoadingSlots(false));
  }, [form.doctorId, form.appointmentDate]);

  const selectedDoctor = doctors.find(d => d.id === form.doctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");

    const now = new Date();
    const [y, m, day] = form.appointmentDate.split('-').map(Number);
    const [h, min] = form.timeSlot.split(':').map(Number);
    const selectedDate = new Date(y, m - 1, day, h, min, 0);

    if (selectedDate < now) {
      setMsg("The selected time slot has already passed. Please choose a future time.");
      setSaving(false);
      return;
    }

    const payload: any = {
      patientId: patient.id,
      doctorId: form.doctorId,
      appointmentDate: form.appointmentDate,
      timeSlot: form.timeSlot,
      type: form.type,
      notes: form.notes || null,
    };
    if (form.departmentId) payload.departmentId = form.departmentId;
    if (form.consultationFee) payload.consultationFee = parseFloat(form.consultationFee);

    const d = await api("/api/appointments", "POST", payload);
    if (d.success) { onSuccess(); }
    else setMsg(d.message || "Failed to book appointment");
    setSaving(false);
  };

  const today = new Date().toISOString().split("T")[0];
  const tmrwDate = new Date();
  tmrwDate.setDate(tmrwDate.getDate() + 1);
  const tomorrow = tmrwDate.toISOString().split("T")[0];

  const isSlotPassed = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
    const [y, m, day] = dateStr.split("-").map(Number);
    const [h, min] = timeStr.split(":").map(Number);
    const slotDate = new Date(y, m - 1, day, h, min, 0);
    return slotDate < now;
  };

  return (
    <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
      {/* Selected Patient Banner */}
      <div style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
          {patient.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{patient.name}</div>
          <div style={{ fontSize: 11, color: "#bae6fd" }}>{patient.patientId} · {patient.phone}</div>
        </div>
        <button onClick={onCancel} style={{ marginLeft: "auto", background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <X size={13} />
        </button>
      </div>

      <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
        Step 2 — Appointment Details
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Department */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Department</label>
          <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value, doctorId: "", timeSlot: "" }))}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Doctor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Doctor *</label>
          <select required style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.doctorId} onChange={e => setForm(p => ({ ...p, doctorId: e.target.value, timeSlot: "" }))}>
            <option value="">Select Doctor...</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
          </select>
        </div>

        {/* Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Appointment Date *</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => setForm(p => ({ ...p, appointmentDate: today, timeSlot: "" }))}
                style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${form.appointmentDate === today ? "#0ea5e9" : "#e2e8f0"}`, background: form.appointmentDate === today ? "#eff6ff" : "#f8fafc", color: form.appointmentDate === today ? "#0ea5e9" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
                Today
              </button>
              <button type="button" onClick={() => setForm(p => ({ ...p, appointmentDate: tomorrow, timeSlot: "" }))}
                style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${form.appointmentDate === tomorrow ? "#0ea5e9" : "#e2e8f0"}`, background: form.appointmentDate === tomorrow ? "#eff6ff" : "#f8fafc", color: form.appointmentDate === tomorrow ? "#0ea5e9" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
                Tomorrow
              </button>
            </div>
          </div>
          <input required type="date" min={today}
            style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.appointmentDate} onChange={e => setForm(p => ({ ...p, appointmentDate: e.target.value, timeSlot: "" }))} />
        </div>

        {/* Type */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Type</label>
          <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            <option value="OPD">OPD</option>
            <option value="ONLINE">Online</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>

        {/* Time Slots */}
        {form.doctorId && form.appointmentDate && (
          <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Time Slot *{loadingSlots && <Loader2 size={11} style={{ marginLeft: 6, animation: "spin .7s linear infinite" }} />}
            </label>
            {loadingSlots ? (
              <div style={{ fontSize: 13, color: "#94a3b8", padding: "12px 0" }}>Loading available slots...</div>
            ) : slots.length === 0 ? (
              <div style={{ fontSize: 13, color: "#ef4444", padding: "12px 16px", background: "#fff5f5", borderRadius: 9, border: "1px solid #fecaca" }}>
                No available slots for this date. Doctor may be unavailable or all slots are booked.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {slots.map(slot => {
                  const isBooked = bookedSlots.includes(slot);
                  const isPast = isSlotPassed(form.appointmentDate, slot);
                  const isDisabled = isBooked || isPast;
                  const isSelected = form.timeSlot === slot;
                  return (
                    <button key={slot} type="button" disabled={isDisabled}
                      onClick={() => !isDisabled && setForm(p => ({ ...p, timeSlot: slot }))}
                      title={isPast ? "Time slot has already passed" : isBooked ? "Already booked" : "Available"}
                      style={{
                        padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${isSelected ? "#0ea5e9" : isDisabled ? "#f1f5f9" : "#e2e8f0"}`,
                        background: isSelected ? "#0ea5e9" : isDisabled ? "#f8fafc" : "#fff",
                        color: isSelected ? "#fff" : isDisabled ? "#cbd5e1" : "#334155",
                        fontSize: 12, fontWeight: isSelected ? 700 : 500,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        transition: "all .15s",
                        textDecoration: isDisabled ? "line-through" : "none",
                      }}>
                      {fmt12(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Fee */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Consultation Fee {selectedDoctor?.consultationFee !== undefined ? `(Default: ₹${selectedDoctor.consultationFee})` : ""}
          </label>
          <input type="number" min="0" step="0.01"
            style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            placeholder={selectedDoctor?.consultationFee?.toString() || "0"}
            value={form.consultationFee} onChange={e => setForm(p => ({ ...p, consultationFee: e.target.value }))} />
        </div>

        {/* Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</label>
          <input
            style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            placeholder="Chief complaint or notes..."
            value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>

        {msg && (
          <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 600, background: "#fff5f5", padding: "10px 14px", borderRadius: 9, border: "1px solid #fecaca" }}>
            <AlertCircle size={14} />{msg}
          </div>
        )}

        <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onCancel}
            style={{ padding: "10px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.timeSlot}
            style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: !form.timeSlot ? "#e2e8f0" : "linear-gradient(135deg,#0ea5e9,#0369a1)", color: !form.timeSlot ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: (saving || !form.timeSlot) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: form.timeSlot ? "0 4px 12px rgba(14,165,233,.3)" : "none" }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <CalendarCheck size={14} />}
            Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW-UP MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FollowUpModal({ appointment, onClose, onSuccess }: { appointment: Appointment; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ followUpDate: "", reason: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    const d = await api("/api/followups", "POST", {
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      followUpDate: form.followUpDate,
      reason: form.reason || null,
      notes: form.notes || null,
    });
    if (d.success) { onSuccess(); onClose(); }
    else setMsg(d.message || "Failed to schedule follow-up");
    setSaving(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.4)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#1e293b" }}>Schedule Follow-up</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>
        <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 9, border: "1px solid #bbf7d0", marginBottom: 18, fontSize: 13, color: "#166534" }}>
          <strong>{appointment.patient?.name}</strong> · {appointment.patient?.patientId}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Follow-up Date *</label>
            <input required type="date" min={today}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
              value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Reason</label>
            <input
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
              placeholder="Reason for follow-up..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Doctor Notes</label>
            <textarea rows={3}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
              placeholder="Clinical notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          {msg && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT TABLE
// ─────────────────────────────────────────────────────────────────────────────
function AppointmentTable({ onRefresh }: { onRefresh: number }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [followUpTarget, setFollowUpTarget] = useState<Appointment | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);
    const d = await api(`/api/appointments?${params}`);
    if (d.success) { setAppointments(d.data.data || []); setPagination(d.data.pagination || { page: 1, total: 0, totalPages: 1 }); }
    setLoading(false);
  }, [page, search, statusFilter, dateFilter, onRefresh]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await api(`/api/appointments/${id}`, "PUT", { status });
    load();
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 200 }}>
          <Search size={13} color="#94a3b8" />
          <input style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#334155", width: "100%" }}
            placeholder="Search patient, doctor..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <input type="date"
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none" }}
          value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} />
        <select style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none" }}
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => { setDateFilter(""); setSearch(""); setStatusFilter(""); }}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <RefreshCw size={12} />Clear
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>
          <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />Loading...
        </div>
      ) : appointments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <CalendarCheck size={32} style={{ marginBottom: 10, opacity: .4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No appointments found</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting the date or filters</div>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Token", "Patient", "Doctor", "Date & Time", "Type", "Fee", "Status", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => {
                const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.SCHEDULED;
                const date = new Date(appt.appointmentDate);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <tr key={appt.id} style={{ borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
                        {appt.tokenNumber || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{appt.patient?.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{appt.patient?.patientId}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>{appt.doctor?.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{appt.doctor?.specialization || appt.department?.name || "—"}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? "#2563eb" : "#334155" }}>
                        {isToday ? "Today" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmt12(appt.timeSlot)}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, background: `${TYPE_COLORS[appt.type]}15`, color: TYPE_COLORS[appt.type], fontWeight: 700, border: `1px solid ${TYPE_COLORS[appt.type]}30` }}>
                        {appt.type.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                      {appt.consultationFee !== null && appt.consultationFee !== undefined ? `₹${appt.consultationFee}` : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <select value={appt.status}
                        onChange={e => updateStatus(appt.id, e.target.value)}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {appt.status === "COMPLETED" && (
                          <button onClick={() => setFollowUpTarget(appt)} title="Schedule Follow-up"
                            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f0fdf4", color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CalendarCheck size={13} />
                          </button>
                        )}
                        <a href={`/hospitaladmin/patients/${appt.patientId}`}
                          style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                          <Eye size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Showing {appointments.length} of {pagination.total} appointments</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .5 : 1 }}>
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: page === pagination.totalPages ? "not-allowed" : "pointer", opacity: page === pagination.totalPages ? .5 : 1 }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {followUpTarget && (
        <FollowUpModal
          appointment={followUpTarget}
          onClose={() => setFollowUpTarget(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────────────────────────────────────────
function StatsBar() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    Promise.all([
      api("/api/appointments?stats=true"),
      api("/api/patients?stats=true"),
    ]).then(([a, p]) => {
      setStats({ ...a.data, patientTotal: p.data?.total || 0 });
    });
  }, []);

  if (!stats) return null;
  const items = [
    { label: "Today's Appointments", value: stats.today, color: "#2563eb", bg: "#eff6ff" },
    { label: "Scheduled", value: stats.scheduled, color: "#d97706", bg: "#fffbeb" },
    { label: "Completed", value: stats.completed, color: "#059669", bg: "#f0fdf4" },
    { label: "Total Patients", value: stats.patientTotal, color: "#7c3aed", bg: "#f5f3ff" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
      {items.map(i => (
        <div key={i.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{i.label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: i.color }}>{i.value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
export default function AppointmentPanel() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePatientSelect = (p: Patient) => {
    setSelectedPatient(p);
    setShowBooking(true);
  };

  const handleBookingSuccess = () => {
    setShowBooking(false);
    setSelectedPatient(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <StatsBar />

      {/* Booking Area */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarCheck size={18} color="#0ea5e9" />New Appointment
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Search existing patient or register new one to book</div>
          </div>
          {showBooking && (
            <button onClick={() => { setShowBooking(false); setSelectedPatient(null); }}
              style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <X size={12} />Clear
            </button>
          )}
        </div>

        {!showBooking ? (
          <PatientSearchBox onSelect={handlePatientSelect} />
        ) : (
          selectedPatient && (
            <BookingForm
              patient={selectedPatient}
              onSuccess={handleBookingSuccess}
              onCancel={() => { setShowBooking(false); setSelectedPatient(null); }}
            />
          )
        )}
      </div>

      {/* Today's/All Appointments */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={18} color="#3b82f6" />Appointments
        </div>
        <AppointmentTable onRefresh={refreshKey} />
      </div>
    </div>
  );
}
