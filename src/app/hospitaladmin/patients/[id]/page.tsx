"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, User, Phone, Mail, Calendar, Droplets, MapPin,
  Hash, Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  CalendarCheck, Plus, X, Stethoscope, FileText,
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  SCHEDULED: { color: "#0A6B70", bg: "#E6F4F4", border: "#B3E0E0" },
  CONFIRMED: { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  COMPLETED: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  CANCELLED: { color: "#dc2626", bg: "#fff5f5", border: "#fecaca" },
  NO_SHOW: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  RESCHEDULED: { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
};

const FOLLOWUP_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  PENDING: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  COMPLETED: { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  CANCELLED: { color: "#dc2626", bg: "#fff5f5", border: "#fecaca" },
};

const fmt12 = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} color="#64748b" />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

function FollowUpScheduleModal({
  patientId, onClose, onSuccess
}: { patientId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ followUpDate: "", reason: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    const d = await api("/api/followups", "POST", { patientId, ...form, followUpDate: form.followUpDate });
    if (d.success) { onSuccess(); onClose(); }
    else setMsg(d.message || "Error");
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.4)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>Schedule Follow-up</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={13} /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { k: "followUpDate", l: "Follow-up Date *", type: "date", req: true },
            { k: "reason", l: "Reason", type: "text", req: false },
          ].map(f => (
            <div key={f.k} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{f.l}</label>
              <input required={f.req} type={f.type} min={f.type === "date" ? today : undefined}
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</label>
            <textarea rows={3} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none", resize: "none", fontFamily: "inherit" }}
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          {msg && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"appointments" | "followups">("appointments");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = () => {
    setLoading(true);
    api(`/api/patients/${id}`).then(d => {
      if (d.success) setPatient(d.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id, refreshKey]);

  const updateFollowUpStatus = async (fid: string, status: string) => {
    await api(`/api/followups/${fid}`, "PUT", { status });
    setRefreshKey(k => k + 1);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", gap: 10, color: "#64748b" }}>
      <Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} />Loading patient...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!patient) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b" }}>
      Patient not found.
    </div>
  );

  const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Inter',sans-serif", padding: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <button onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 }}>
          <ArrowLeft size={14} />Back
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
          {/* Patient Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)", position: "sticky", top: 24 }}>
            <div style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)", padding: "28px 24px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 auto 12px", backdropFilter: "blur(4px)" }}>
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{patient.name}</div>
              <div style={{ fontSize: 13, color: "#bae6fd", marginTop: 4 }}>
                {patient.patientId} {patient.gender ? `· ${patient.gender}` : ""}
              </div>
              {age && <div style={{ fontSize: 12, color: "#7dd3fc", marginTop: 2 }}>{age} years old</div>}
            </div>
            <div style={{ padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center", padding: "12px", background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0369a1" }}>{patient._count?.appointments || 0}</div>
                  <div style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 700, textTransform: "uppercase" }}>Visits</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "12px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{patient._count?.followUps || 0}</div>
                  <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, textTransform: "uppercase" }}>Follow-ups</div>
                </div>
              </div>

              <InfoRow icon={Phone} label="Phone" value={patient.phone} />
              <InfoRow icon={Mail} label="Email" value={patient.email} />
              <InfoRow icon={Calendar} label="Date of Birth" value={dob ? `${dob.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}${age ? ` (${age} yrs)` : ""}` : null} />
              <InfoRow icon={Droplets} label="Blood Group" value={patient.bloodGroup} />
              <InfoRow icon={MapPin} label="Address" value={patient.address} />
              <InfoRow icon={Hash} label="Patient ID" value={patient.patientId} />

              <button onClick={() => setShowFollowUp(true)}
                style={{ width: "100%", marginTop: 16, padding: "10px", borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Plus size={13} />Schedule Follow-up
              </button>
              <a href={`/hospitaladmin/appointments?patientId=${patient.id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 8, padding: "10px", borderRadius: 10, border: "1.5px solid #0ea5e9", background: "#fff", color: "#0ea5e9", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                <CalendarCheck size={13} />Book Appointment
              </a>
            </div>
          </div>

          {/* History */}
          <div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, border: "1px solid #e2e8f0", marginBottom: 16, width: "fit-content" }}>
              {(["appointments", "followups"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: activeTab === t ? "#0ea5e9" : "none", color: activeTab === t ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
                  {t === "appointments" ? `Appointments (${patient._count?.appointments || 0})` : `Follow-ups (${patient._count?.followUps || 0})`}
                </button>
              ))}
            </div>

            {activeTab === "appointments" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patient.appointments?.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 14 }}>
                    No appointments yet
                  </div>
                ) : patient.appointments?.map((appt: any) => {
                  const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.SCHEDULED;
                  const date = new Date(appt.appointmentDate);
                  return (
                    <div key={appt.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Hash size={15} color="#7c3aed" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                              {date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginLeft: 8 }}>@ {fmt12(appt.timeSlot)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Token #{appt.tokenNumber || "—"}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700 }}>
                          {appt.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Stethoscope size={11} />{appt.doctor?.name || "—"}
                        </span>
                        {appt.department && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FileText size={11} />{appt.department.name}
                          </span>
                        )}
                        {appt.consultationFee && (
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>₹{appt.consultationFee}</span>
                        )}
                        <span style={{ padding: "1px 8px", borderRadius: 100, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>
                          {appt.type.replace("_", " ")}
                        </span>
                      </div>
                      {appt.notes && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
                          📋 {appt.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "followups" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {patient.followUps?.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 14 }}>
                    No follow-ups scheduled
                  </div>
                ) : patient.followUps?.map((fu: any) => {
                  const fc = FOLLOWUP_COLORS[fu.status] || FOLLOWUP_COLORS.PENDING;
                  const fuDate = new Date(fu.followUpDate);
                  const isPast = fuDate < new Date() && fu.status === "PENDING";
                  return (
                    <div key={fu.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${isPast ? "#fecaca" : "#e2e8f0"}`, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: isPast ? "#fff5f5" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CalendarCheck size={15} color={isPast ? "#ef4444" : "#10b981"} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: isPast ? "#ef4444" : "#1e293b" }}>
                              {fuDate.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                              {isPast && <span style={{ fontSize: 11, marginLeft: 6, color: "#ef4444", fontWeight: 600 }}>OVERDUE</span>}
                            </div>
                            {fu.reason && <div style={{ fontSize: 12, color: "#64748b" }}>{fu.reason}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, background: fc.bg, color: fc.color, border: `1px solid ${fc.border}`, fontWeight: 700 }}>
                            {fu.status}
                          </span>
                          {fu.status === "PENDING" && (
                            <button onClick={() => updateFollowUpStatus(fu.id, "COMPLETED")}
                              style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#f0fdf4", color: "#059669", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              ✓ Done
                            </button>
                          )}
                        </div>
                      </div>
                      {fu.notes && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: 8 }}>
                          📋 {fu.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFollowUp && (
        <FollowUpScheduleModal
          patientId={patient.id}
          onClose={() => setShowFollowUp(false)}
          onSuccess={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
