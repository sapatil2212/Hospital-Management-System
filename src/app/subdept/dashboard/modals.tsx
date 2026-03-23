"use client";
import { X, Loader2, Save, ArrowRight, FileText, Pill, Activity } from "lucide-react";

// View Record Modal
export function ViewRecordModal({ record, onClose, meta }: any) {
  if (!record) return null;
  
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Procedure Record Details</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Patient Information</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{record.patient?.name || "Unknown"}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{record.patient?.patientId} • {record.patient?.phone}</div>
            {record.patient?.email && <div style={{ fontSize: 13, color: "#64748b" }}>{record.patient.email}</div>}
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Procedure Details</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{record.procedure?.name || "—"}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{record.procedure?.description || "No description"}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, background: `${meta.accent}18`, color: meta.accent, fontWeight: 700 }}>{record.procedure?.type || "—"}</span>
              {record.procedure?.duration && <span style={{ fontSize: 11, color: "#94a3b8" }}>Duration: {record.procedure.duration} min</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Amount Charged</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>₹{record.amount}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Status</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: record.status === "COMPLETED" ? "#16a34a" : record.status === "CANCELLED" ? "#ef4444" : "#b45309" }}>{record.status.replace(/_/g, " ")}</div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Performed Details</div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 4 }}>
              <strong>Date:</strong> {new Date(record.performedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 13, color: "#334155" }}>
              <strong>Performed By:</strong> {record.performedBy || "—"}
            </div>
          </div>

          {record.notes && (
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Notes</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{record.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Record Modal
export function EditRecordModal({ record, onClose, onSave, meta }: any) {
  const [form, setForm] = React.useState({
    amount: record?.amount?.toString() || "",
    performedBy: record?.performedBy || "",
    status: record?.status || "COMPLETED",
    notes: record?.notes || "",
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(record.id, form);
    setSaving(false);
  };

  if (!record) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Edit Procedure Record</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 12, marginBottom: 18, fontSize: 12, color: "#0369a1" }}>
          <strong>{record.patient?.name}</strong> • {record.procedure?.name}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Amount (₹)</label>
              <input type="number" min="0" step="0.01" required
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Status</label>
              <select
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Performed By</label>
            <input type="text"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
              placeholder="Technician/Staff name" value={form.performedBy} onChange={e => setForm(p => ({ ...p, performedBy: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</label>
            <textarea rows={3}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
              placeholder="Additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .5 : 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: meta.gradient, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Transfer Patient Modal
export function TransferPatientModal({ record, subDepts, onClose, onTransfer, meta }: any) {
  const [form, setForm] = React.useState({ subDeptId: "", notes: "" });
  const [transferring, setTransferring] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subDeptId) return;
    setTransferring(true);
    await onTransfer(record, form);
    setTransferring(false);
  };

  if (!record) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Transfer Patient</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12, marginBottom: 18, fontSize: 12, color: "#166534" }}>
          Transferring <strong>{record.patient?.name}</strong> to another sub-department for further procedures
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Transfer To Sub-Department *</label>
            <select required
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
              value={form.subDeptId} onChange={e => setForm(p => ({ ...p, subDeptId: e.target.value }))}>
              <option value="">Select Sub-Department...</option>
              {subDepts.map((sd: any) => (
                <option key={sd.id} value={sd.id}>{sd.name} ({sd.type})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Transfer Notes</label>
            <textarea rows={3}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
              placeholder="Reason for transfer, instructions for next department..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={transferring}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: transferring ? "not-allowed" : "pointer", opacity: transferring ? .5 : 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={transferring}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: transferring ? "not-allowed" : "pointer", opacity: transferring ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {transferring && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
              <ArrowRight size={13} />
              {transferring ? "Transferring..." : "Transfer Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Prescription Modal
export function ViewPrescriptionModal({ appointment, onClose, meta }: any) {
  const [prescription, setPrescription] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (appointment?.id) {
      fetch(`/api/prescriptions/by-appointment/${appointment.id}`, { credentials: "include" })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const p = { ...d.data };
            const parseJ = (v: any, fb: any) => { if (!v) return fb; if (typeof v === "string") { try { return JSON.parse(v); } catch { return fb; } } return v; };
            p.medications = parseJ(p.medications, []);
            p.labTests    = parseJ(p.labTests, []);
            p.vitals      = parseJ(p.vitals, {});
            p.icdCodes    = parseJ(p.icdCodes, []);
            p.referrals   = parseJ(p.referrals, []);
            setPrescription(p);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [appointment]);

  if (!appointment) return null;

  const meds  = Array.isArray(prescription?.medications) ? prescription.medications : [];
  const tests = Array.isArray(prescription?.labTests)    ? prescription.labTests    : [];
  const refs  = Array.isArray(prescription?.referrals)   ? prescription.referrals   : [];
  const vitals: any = prescription?.vitals || {};
  const hasVitals = Object.values(vitals).some((v: any) => v);

  const doctor  = prescription?.doctor;
  const patient = prescription?.patient;
  const h       = doctor?.hospital;
  const hs      = h?.settings;

  const patientAge = patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000)
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Outer shell: close button + scrollable document */}
      <div style={{ width: "100%", maxWidth: 780, maxHeight: "94vh", display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.35)" }}>

        {/* Toolbar */}
        <div style={{ background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="#94a3b8" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Doctor&apos;s Prescription</span>
            {prescription?.prescriptionNo && (
              <span style={{ fontSize: 11, color: "#64748b", background: "#334155", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                {prescription.prescriptionNo}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#334155", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
            <X size={15} />
          </button>
        </div>

        {/* Scrollable prescription body */}
        <div style={{ background: "#f1f5f9", overflowY: "auto", flex: 1, padding: "24px 20px" }}>
          {loading ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <Loader2 size={36} color={meta.accent} style={{ animation: "spin .7s linear infinite", marginBottom: 14 }} />
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading prescription...</div>
            </div>
          ) : !prescription ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <FileText size={44} color="#cbd5e1" style={{ marginBottom: 14 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8" }}>No prescription found</div>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 6 }}>The doctor hasn&apos;t created a prescription for this appointment yet</div>
            </div>
          ) : (
            /* ─── Prescription Document ──────────────── */
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", fontFamily: "Georgia, 'Times New Roman', serif", color: "#1a1a1a", fontSize: 12, lineHeight: 1.5, boxShadow: "0 2px 12px rgba(0,0,0,.08)" }}>

              {/* ── Hospital Header ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2.5px solid #1e293b", paddingBottom: 14, marginBottom: 18, gap: 16 }}>
                {hs?.logo && (
                  <img src={hs.logo} alt="Logo" style={{ height: 56, objectFit: "contain", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", fontFamily: "Inter, sans-serif", letterSpacing: "-.02em" }}>
                    {hs?.hospitalName || h?.name || "Medical Center"}
                  </div>
                  {hs?.address && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{hs.address}</div>}
                  <div style={{ display: "flex", gap: 18, marginTop: 3, fontSize: 10, color: "#475569" }}>
                    {(hs?.phone || h?.mobile) && <span>Tel: {hs?.phone || h?.mobile}</span>}
                    {hs?.email && <span>Email: {hs.email}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>Prescription No.</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", fontFamily: "Inter, sans-serif" }}>{prescription.prescriptionNo || "—"}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                    {new Date(prescription.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* ── Doctor + Patient ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>Dr. {doctor?.name}</div>
                  <div style={{ fontSize: 11, color: "#334155", fontWeight: 600 }}>{doctor?.specialization}</div>
                  {doctor?.qualification && <div style={{ fontSize: 10, color: "#64748b" }}>{doctor.qualification}</div>}
                  {doctor?.registrationNo && <div style={{ fontSize: 10, color: "#64748b" }}>Reg No: {doctor.registrationNo}</div>}
                  {doctor?.department?.name && <div style={{ fontSize: 10, color: "#64748b" }}>Dept: {doctor.department.name}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>{patient?.name}</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>
                    ID: {patient?.patientId}
                    {patient?.gender && <span> &nbsp;|&nbsp; {patient.gender}</span>}
                    {patientAge !== null && <span> &nbsp;|&nbsp; {patientAge} yrs</span>}
                  </div>
                  {patient?.phone && <div style={{ fontSize: 10, color: "#64748b" }}>Ph: {patient.phone}</div>}
                  {patient?.bloodGroup && <div style={{ fontSize: 10, color: "#64748b" }}>Blood: {patient.bloodGroup}</div>}
                </div>
              </div>

              {/* ── Vitals ── */}
              {hasVitals && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 18 }}>
                  {[["BP", vitals.bp], ["Pulse", vitals.pulse], ["Temp", vitals.temp], ["Weight", vitals.weight], ["Height", vitals.height], ["SpO2", vitals.spo2], ["RR", vitals.rr || vitals.respiratoryRate]].map(([k, v]) => v ? (
                    <div key={k}>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#64748b", fontFamily: "Inter, sans-serif" }}>{k}: </span>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>
                    </div>
                  ) : null)}
                </div>
              )}

              {/* ── Chief Complaint ── */}
              {prescription.chiefComplaint && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#334155", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>CHIEF COMPLAINT</div>
                  <div style={{ paddingLeft: 12, borderLeft: "3px solid #cbd5e1", whiteSpace: "pre-wrap", fontSize: 12, color: "#1e293b" }}>{prescription.chiefComplaint}</div>
                </div>
              )}

              {/* ── Diagnosis ── */}
              {prescription.diagnosis && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#334155", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>DIAGNOSIS</div>
                  <div style={{ paddingLeft: 12, borderLeft: "3px solid #334155" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{prescription.diagnosis}</span>
                    {Array.isArray(prescription.icdCodes) && prescription.icdCodes.length > 0 && (
                      <span style={{ fontSize: 10, color: "#64748b", marginLeft: 8 }}>(ICD: {prescription.icdCodes.join(", ")})</span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Medications (Rx) ── */}
              {meds.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10, borderBottom: "2px solid #1e293b", paddingBottom: 5, display: "flex", alignItems: "center", gap: 10, fontFamily: "Inter, sans-serif" }}>
                    <span style={{ fontSize: 22, fontStyle: "italic", lineHeight: 1 }}>Rx</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Medications</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid #334155", background: "#f8fafc" }}>
                        {["Medication", "Dosage", "Frequency", "Duration", "Route"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", fontFamily: "Inter, sans-serif", color: "#475569", fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {meds.map((m: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ fontWeight: 700, fontSize: 12 }}>{m.name}</div>
                            {m.instructions && <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic", marginTop: 1 }}>{m.instructions}</div>}
                          </td>
                          <td style={{ padding: "10px 8px", fontWeight: 600 }}>{m.dosage || "—"}</td>
                          <td style={{ padding: "10px 8px" }}>
                            <span style={{ padding: "2px 6px", background: "#f1f5f9", borderRadius: 4, fontWeight: 700, fontSize: 10, fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>{m.frequency || "—"}</span>
                          </td>
                          <td style={{ padding: "10px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{m.duration || "—"}</td>
                          <td style={{ padding: "10px 8px", color: "#64748b", whiteSpace: "nowrap" }}>{m.route || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Investigations + Referrals + Advice (2-col) ── */}
              <div style={{ display: "grid", gridTemplateColumns: tests.length > 0 || refs.length > 0 ? "1fr 1fr" : "1fr", gap: 24, marginBottom: 18 }}>
                <div>
                  {tests.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, color: "#334155", fontFamily: "Inter, sans-serif" }}>INVESTIGATIONS</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11 }}>
                        {tests.map((t: any, i: number) => (
                          <li key={i} style={{ marginBottom: 5 }}>
                            <span style={{ fontWeight: 700 }}>{t.name}</span>
                            <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 5px", border: "1px solid #cbd5e1", borderRadius: 3, textTransform: "uppercase", fontFamily: "Inter, sans-serif", color: "#64748b" }}>{t.urgency}</span>
                            {t.notes && <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{t.notes}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {refs.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, color: "#334155", fontFamily: "Inter, sans-serif" }}>REFERRALS</div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11 }}>
                        {refs.map((r: any, i: number) => (
                          <li key={i} style={{ marginBottom: 5 }}>
                            Refer to <span style={{ fontWeight: 700 }}>{r.subDeptName}</span>
                            {r.reason && <div style={{ fontSize: 10, color: "#64748b" }}>Reason: {r.reason}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  {prescription.advice && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6, color: "#334155", fontFamily: "Inter, sans-serif" }}>ADVICE / INSTRUCTIONS</div>
                      <div style={{ fontSize: 11, whiteSpace: "pre-wrap", lineHeight: 1.6, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>{prescription.advice}</div>
                    </div>
                  )}

                  {prescription.followUpDate && (
                    <div style={{ padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e", textTransform: "uppercase", fontFamily: "Inter, sans-serif", marginBottom: 3 }}>Next Follow-up</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#b45309" }}>
                        {new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      {prescription.followUpNotes && <div style={{ fontSize: 10, color: "#b45309", marginTop: 2 }}>{prescription.followUpNotes}</div>}
                    </div>
                  )}

                  {prescription.doctorNotes && (
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", fontFamily: "Inter, sans-serif", marginBottom: 3 }}>Doctor&apos;s Notes</div>
                      <div style={{ fontSize: 11, color: "#0c4a6e", whiteSpace: "pre-wrap" }}>{prescription.doctorNotes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer: Stamp + Signature ── */}
              <div style={{ marginTop: 30, paddingTop: 20, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                {/* Hospital Stamp */}
                <div style={{ textAlign: "center", minWidth: 120 }}>
                  {doctor?.hospitalStamp ? (
                    <img src={doctor.hospitalStamp} alt="Hospital Stamp" style={{ height: 70, objectFit: "contain", opacity: 0.85 }} />
                  ) : (
                    <div style={{ width: 90, height: 70, border: "2px dashed #cbd5e1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "Inter, sans-serif", textAlign: "center", padding: 4 }}>Hospital<br/>Stamp</span>
                    </div>
                  )}
                </div>

                {/* Doctor Signature */}
                <div style={{ textAlign: "center", minWidth: 180 }}>
                  {doctor?.signature ? (
                    <img src={doctor.signature} alt="Doctor Signature" style={{ height: 60, objectFit: "contain", marginBottom: 4 }} />
                  ) : (
                    <div style={{ height: 52 }} />
                  )}
                  <div style={{ borderTop: "1.5px solid #334155", paddingTop: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "Inter, sans-serif" }}>Dr. {doctor?.name}</div>
                    {doctor?.specialization && <div style={{ fontSize: 10, fontWeight: 600, color: "#475569" }}>{doctor.specialization}</div>}
                    {doctor?.registrationNo && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>Reg No: {doctor.registrationNo}</div>}
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1, fontStyle: "italic" }}>Digital Signature</div>
                  </div>
                </div>
              </div>

              {/* ── Document Footer ── */}
              <div style={{ marginTop: 16, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize: 9, color: "#94a3b8", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
                This is a computer-generated prescription. Issued on {new Date(prescription.createdAt || Date.now()).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add React import at the top
import * as React from "react";
