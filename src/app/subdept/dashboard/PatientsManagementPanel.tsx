
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Stethoscope, ClipboardList,
  CreditCard, IndianRupee, Plus, Trash2, Eye, ChevronRight, ChevronLeft,
  Phone, Mail, Calendar, Droplet, User, Activity, RefreshCw, Loader2,
  UserCircle, AlertTriangle, Pencil, X
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

// ─── Patient Management Panel ───
export function PatientsManagementPanel() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  // List view state
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [patientEditId, setPatientEditId] = useState<string | null>(null);
  const itemsPerPage = 15;

  // Detail view state
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "appointments" | "medical" | "billing" | "plans">("overview");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);

  const loadPatients = async () => {
    setLoading(true);
    const res = await api(`/api/patients?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`);
    if (res.success) {
      setPatients(res.data.data || []);
      setTotalPages(Math.ceil((res.data.total || 0) / itemsPerPage));
      setTotalCount(res.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    api("/api/auth/me").then(data => {
      if (data.success) {
        setUser(data.data);
        console.log("User role:", data.data.role);
      }
    });
  }, []);

  const loadPatientDetails = async (id: string) => {
    setDetailsLoading(true);
    setDetailTab("overview");
    setAppointments([]);
    setBills([]);
    setProcedures([]);
    setTreatmentPlans([]);

    try {
      const [pRes, aRes, bRes, prRes, tpRes] = await Promise.all([
        api(`/api/patients/${id}`),
        api(`/api/appointments?patientId=${id}`),
        api(`/api/billing?patientId=${id}`),
        api(`/api/subdept/records?patientId=${id}`),
        api(`/api/treatment-plans?patientId=${id}&limit=50`),
      ]);

      if (!pRes.success) {
        throw new Error(pRes.message || "Could not fetch patient details.");
      }

      setPatientDetails(pRes.data);
      if (aRes.success) setAppointments(Array.isArray(aRes.data?.data) ? aRes.data.data : []);
      if (bRes.success) setBills(Array.isArray(bRes.data?.bills) ? bRes.data.bills : Array.isArray(bRes.data) ? bRes.data : []);
      if (prRes.success) setProcedures(Array.isArray(prRes.data?.data) ? prRes.data.data : []);
      if (tpRes.success) setTreatmentPlans(Array.isArray(tpRes.data?.plans) ? tpRes.data.plans : []);

    } catch (error: any) {
      alert(`Failed to load patient dashboard: ${error.message}`);
      setSelectedPatient(null); // Close the view if data loading fails
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => { loadPatients(); }, [currentPage, searchTerm]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api(`/api/patients/${deleteTarget.id}`, "DELETE");
    if (res.success) { setDeleteTarget(null); loadPatients(); }
    else alert(res.message || "Failed to delete patient");
    setDeleting(false);
  };

  const age = (dob?: string) => {
    if (!dob) return "—";
    return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  };

  const statusStyle = (s: string) => {
    const m: any = {
      SCHEDULED: { background: "#E6F4F4", color: "#0E898F" },
      CONFIRMED: { background: "#f0f9ff", color: "#0ea5e9" },
      COMPLETED: { background: "#dcfce7", color: "#16a34a" },
      CANCELLED: { background: "#fee2e2", color: "#dc2626" },
      NO_SHOW: { background: "#fef3c7", color: "#f59e0b" },
      PENDING: { background: "#fef3c7", color: "#f59e0b" },
      PAID: { background: "#dcfce7", color: "#16a34a" },
      PARTIAL: { background: "#fef3c7", color: "#f59e0b" },
    };
    return m[s] || { background: "#f1f5f9", color: "#64748b" };
  };

  const totalPaid = Array.isArray(bills) ? bills.reduce((s, b) => s + (b.paidAmount || 0), 0) : 0;
  const totalPending = Array.isArray(bills) ? bills.reduce((s, b) => s + ((b.total || 0) - (b.paidAmount || 0)), 0) : 0;

  // ── DETAIL VIEW ──
  if (selectedPatient && patientDetails) {
    return (
      <div>
        {/* Breadcrumb header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button
            onClick={() => { setSelectedPatient(null); setPatientDetails(null); }}
            style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#64748b" }}
          >
            <ChevronLeft size={15} /> All Patients
          </button>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{patientDetails.name}</span>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => loadPatientDetails(selectedPatient.id)}
              style={{ padding: "8px 14px", background: "#0E898F", color: "#fff", border: "none", borderRadius: 9, display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {detailsLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2 size={32} color="#0E898F" style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <p style={{ marginTop: 14, color: "#64748b", fontSize: 14 }}>Loading patient records...</p>
          </div>
        ) : (
          <>
            {/* Hero card */}
            <div style={{ background: "linear-gradient(135deg,#07595D 0%,#7c3aed 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 20, color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", border: "2.5px solid rgba(255,255,255,0.35)", flexShrink: 0 }}>
                  <UserCircle size={42} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{patientDetails.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 14 }}>ID: {patientDetails.patientId}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
                    {[
                      { icon: <Phone size={13} />, val: patientDetails.phone },
                      patientDetails.email && { icon: <Mail size={13} />, val: patientDetails.email },
                      patientDetails.gender && { icon: <User size={13} />, val: patientDetails.gender },
                      patientDetails.dateOfBirth && { icon: <Calendar size={13} />, val: `${age(patientDetails.dateOfBirth)} yrs` },
                      patientDetails.bloodGroup && { icon: <Droplet size={13} />, val: patientDetails.bloodGroup },
                    ].filter(Boolean).map((item: any, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.92 }}>
                        {item.icon} {item.val}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                  {[
                    { label: "Visits", val: appointments.length },
                    { label: "Total Paid", val: `₹${totalPaid.toLocaleString()}` },
                    { label: "Pending", val: `₹${totalPending.toLocaleString()}` },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stat chips */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { icon: <CalendarDays size={20} color="#0E898F" />, bg: "#E6F4F4", label: "Appointments", val: appointments.length },
                { icon: <Stethoscope size={20} color="#16a34a" />, bg: "#f0fdf4", label: "Procedures", val: procedures.length },
                { icon: <CreditCard size={20} color="#f59e0b" />, bg: "#fef3c7", label: "Pending Bills", val: `₹${totalPending.toLocaleString()}` },
                { icon: <IndianRupee size={20} color="#16a34a" />, bg: "#dcfce7", label: "Total Revenue", val: `₹${totalPaid.toLocaleString()}` },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 18, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                {[
                  { id: "overview", label: "Overview", icon: <Activity size={14} /> },
                  { id: "appointments", label: "Appointments", icon: <CalendarDays size={14} /> },
                  { id: "medical", label: "Medical History", icon: <Stethoscope size={14} /> },
                  { id: "billing", label: "Billing & Payments", icon: <CreditCard size={14} /> },
                  { id: "plans", label: `Treatment Plans (${treatmentPlans.length})`, icon: <Activity size={14} /> },
                ].map(t => (
                  <button key={t.id} onClick={() => setDetailTab(t.id as any)} style={{
                    flex: 1, padding: "14px 16px", border: "none",
                    background: detailTab === t.id ? "#fff" : "transparent",
                    borderBottom: detailTab === t.id ? "2px solid #0E898F" : "2px solid transparent",
                    color: detailTab === t.id ? "#0E898F" : "#64748b",
                    fontWeight: 600, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.15s"
                  }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                {/* OVERVIEW TAB */}
                {detailTab === "overview" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Personal Information</div>
                      {[
                        ["Patient ID", patientDetails.patientId],
                        ["Full Name", patientDetails.name],
                        ["Phone", patientDetails.phone],
                        ["Email", patientDetails.email || "—"],
                        ["Gender", patientDetails.gender || "—"],
                        ["Date of Birth", patientDetails.dateOfBirth ? new Date(patientDetails.dateOfBirth).toLocaleDateString() : "—"],
                        ["Age", `${age(patientDetails.dateOfBirth)} years`],
                        ["Blood Group", patientDetails.bloodGroup || "—"],
                        ["Address", patientDetails.address || "—"],
                        ["Registered", new Date(patientDetails.createdAt).toLocaleDateString()],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ color: "#64748b", fontSize: 13 }}>{k}</span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Recent Appointments</div>
                      {appointments.length === 0 ? (
                        <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0" }}>No appointments found</div>
                      ) : appointments.slice(0, 6).map((a: any) => (
                        <div key={a.id} style={{ padding: 12, background: "#f8fafc", borderRadius: 9, border: "1px solid #e2e8f0", marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{a.doctor?.name}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(a.appointmentDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>{a.department?.name || "General"}</span>
                            <span style={{ ...statusStyle(a.status), padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{a.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* APPOINTMENTS TAB */}
                {detailTab === "appointments" && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Appointment History ({appointments.length})</div>
                    {appointments.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No appointments found</div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              {["Date & Time", "Doctor", "Department", "Type", "Fee", "Status"].map(h => (
                                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map((a: any) => (
                              <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "14px", fontSize: 13 }}>
                                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{new Date(a.appointmentDate).toLocaleDateString()}</div>
                                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.timeSlot}</div>
                                </td>
                                <td style={{ padding: "14px" }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{a.doctor?.name}</div>
                                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.doctor?.specialization || ""}</div>
                                </td>
                                <td style={{ padding: "14px", fontSize: 13, color: "#64748b" }}>{a.department?.name || "General"}</td>
                                <td style={{ padding: "14px" }}><span style={{ background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{a.type}</span></td>
                                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>₹{(a.consultationFee || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px" }}><span style={{ ...statusStyle(a.status), padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{a.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* MEDICAL TAB */}
                {detailTab === "medical" && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Procedure Records ({procedures.length})</div>
                    {procedures.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No procedure records found</div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              {["Date", "Procedure", "Department", "Type", "Amount", "Performed By", "Status"].map(h => (
                                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {procedures.map((p: any) => (
                              <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "14px", fontSize: 13, color: "#1e293b" }}>{new Date(p.performedAt).toLocaleDateString()}</td>
                                <td style={{ padding: "14px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.procedure?.name}</td>
                                <td style={{ padding: "14px", fontSize: 13, color: "#64748b" }}>{p.subDepartment?.name}</td>
                                <td style={{ padding: "14px" }}><span style={{ background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: 6, fontSize: 11 }}>{p.procedure?.type}</span></td>
                                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>₹{(p.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize: 13, color: "#64748b" }}>{p.performedBy || "—"}</td>
                                <td style={{ padding: "14px" }}><span style={{ ...statusStyle(p.status), padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{p.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* TREATMENT PLANS TAB */}
                {detailTab === "plans" && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Treatment Plans ({treatmentPlans.length})</div>
                    {treatmentPlans.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No treatment plans found</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {treatmentPlans.map((plan: any) => {
                          const pct = plan.totalSessions > 0 ? Math.round((plan.completedSessions / plan.totalSessions) * 100) : 0;
                          const statusColors: any = { ACTIVE: { bg: "#E6F4F4", c: "#0A6B70" }, COMPLETED: { bg: "#f0fdf4", c: "#16a34a" }, CANCELLED: { bg: "#fff5f5", c: "#ef4444" }, ON_HOLD: { bg: "#fefce8", c: "#ca8a04" } };
                          const sc = statusColors[plan.status] || { bg: "#f1f5f9", c: "#64748b" };
                          const balance = (plan.totalCost || 0) - (plan.paidAmount || 0);
                          return (
                            <div key={plan.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{plan.planName}</div>
                                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{plan.service?.name || plan.doctor?.name || ""}</div>
                                </div>
                                <span style={{ ...sc, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, border: `1px solid ${sc.c}33` }}>{plan.status}</span>
                              </div>
                              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 100, overflow: "hidden", marginBottom: 10 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#0E898F,#10b981)", borderRadius: 100 }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                <span style={{ color: "#64748b" }}>{plan.completedSessions}/{plan.totalSessions} sessions ({pct}%)</span>
                                <div style={{ display: "flex", gap: 14 }}>
                                  <span style={{ color: "#16a34a", fontWeight: 600 }}>₹{(plan.paidAmount || 0).toLocaleString()} paid</span>
                                  {balance > 0 && <span style={{ color: "#ef4444", fontWeight: 600 }}>₹{balance.toLocaleString()} due</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* BILLING TAB */}
                {detailTab === "billing" && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Billing & Payments ({bills.length})</div>
                    {bills.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No billing records found</div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              {["Bill No", "Date", "Subtotal", "Discount", "Tax", "Total", "Paid", "Balance", "Status"].map(h => (
                                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bills.map((b: any) => (
                              <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700, color: "#0E898F", fontFamily: "monospace" }}>{b.billNo}</td>
                                <td style={{ padding: "14px", fontSize: 13, color: "#64748b" }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                                <td style={{ padding: "14px", fontSize: 13 }}>₹{(b.subtotal || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize: 13, color: "#16a34a" }}>-₹{(b.discount || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize: 13, color: "#64748b" }}>₹{(b.tax || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize: 13, fontWeight: 700 }}>₹{(b.total || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize: 13, fontWeight: 600, color: "#16a34a" }}>₹{(b.paidAmount || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize: 13, fontWeight: 600, color: (b.total - b.paidAmount) > 0 ? "#dc2626" : "#16a34a" }}>
                                  ₹{((b.total || 0) - (b.paidAmount || 0)).toLocaleString()}
                                </td>
                                <td style={{ padding: "14px" }}><span style={{ ...statusStyle(b.status), padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{b.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Delete confirm modal for patient inside detail view - not needed here */}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Patient Management</h1>
          {totalCount > 0 && (
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>{totalCount} registered patients</p>
          )}
        </div>
        <button
          onClick={() => router.push("/hospitaladmin/appointments")}
          style={{ padding: "10px 20px", background: "linear-gradient(135deg,#0E898F,#07595D)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}
        >
          <Plus size={15} /> Register New Patient
        </button>
      </div>

      {/* Search bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <Search size={16} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search by name, phone number or patient ID..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#334155", background: "transparent" }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 12 }}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "70px 0", textAlign: "center", color: "#94a3b8" }}>
            <Loader2 size={28} color="#0E898F" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontSize: 13 }}>Loading patients...</div>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: "70px 0", textAlign: "center", color: "#94a3b8" }}>
            <UserRound size={40} style={{ opacity: 0.25, margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No patients found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{searchTerm ? "Try a different search term" : "Register your first patient to get started"}</div>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Patient ID", "Patient", "Contact", "Gender", "Age", "Blood Group", "Visits", "Registered", "Actions"].map(h => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "15px 16px" }}>
                      <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6 }}>{p.patientId}</span>
                    </td>
                    <td style={{ padding: "15px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#0ea5e9,#07595D)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{p.name.charAt(0).toUpperCase()}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "15px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{p.phone}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.email || "—"}</div>
                    </td>
                    <td style={{ padding: "15px 16px" }}>
                      <span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>{p.gender || "—"}</span>
                    </td>
                    <td style={{ padding: "15px 16px", fontSize: 13, color: "#64748b" }}>{age(p.dateOfBirth)}</td>
                    <td style={{ padding: "15px 16px" }}>
                      <span style={{ fontSize: 12, background: "#fef3c7", color: "#f59e0b", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{p.bloodGroup || "—"}</span>
                    </td>
                    <td style={{ padding: "15px 16px", fontSize: 13, fontWeight: 700, color: "#0A6B70" }}>{p._count?.appointments || 0}</td>
                    <td style={{ padding: "15px 16px", fontSize: 12, color: "#94a3b8" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "15px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => { setSelectedPatient(p); loadPatientDetails(p.id); }}
                          style={{ padding: "8px", background: "#E6F4F4", color: "#0E898F", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="View Profile"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setPatientEditId(p.id)}
                          style={{ padding: "8px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Edit Profile"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          style={{ padding: "8px", background: "#fff5f5", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Delete Patient"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Page {currentPage} of {totalPages} · {totalCount} patients</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pg = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={i} onClick={() => setCurrentPage(pg)}
                        style={{ width: 32, height: 32, border: "1px solid #e2e8f0", borderRadius: 7, background: currentPage === pg ? "#0E898F" : "#fff", color: currentPage === pg ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1, fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Delete Patient?</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  This will permanently delete <b>{deleteTarget.name}</b> and all their medical history, appointments, and billing records.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 9, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#64748b" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "9px 18px", background: "#ef4444", border: "none", borderRadius: 9, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                {deleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {patientEditId && (
        <PatientEditModal 
          patientId={patientEditId} 
          onClose={() => setPatientEditId(null)} 
          onUpdate={loadPatients} 
        />
      )}
    </div>
  );
}

// ─── Patient Edit Modal Component ───
function PatientEditModal({ patientId, onClose, onUpdate }: { patientId: string; onClose: () => void; onUpdate: () => void }) {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const d = await api(`/api/patients/${patientId}`);
        if (d.success) {
          setForm(d.data);
        } else {
          throw new Error(d.message || "Could not fetch patient details.");
        }
      } catch (error: any) {
        alert(`Failed to load patient for editing: ${error.message}`);
        onClose(); // Close the modal if data loading fails
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const d = await api(`/api/patients/${patientId}`, "PUT", form);
    if (d.success) {
      onUpdate();
      onClose();
    } else {
      setMsg(d.message || "Failed to update patient");
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", width: 400 }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px", color: "#0E898F" }} />
        <div style={{ fontSize: 13, color: "#64748b" }}>Loading patient profile...</div>
      </div>
    </div>
  );

  if (!form) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Edit Patient Profile</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Update basic information for {form.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Full Name</label>
              <input 
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13 }}
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Phone Number</label>
              <input 
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13 }}
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Email</label>
              <input 
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13 }}
                type="email" 
                value={form.email || ""} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Gender</label>
              <select 
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}
                value={form.gender || ""} 
                onChange={e => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Blood Group</label>
              <select 
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}
                value={form.bloodGroup || ""} 
                onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
              >
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Address</label>
              <input 
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13 }}
                value={form.address || ""} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
              />
            </div>
          </div>

          {msg && <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 600 }}>{msg}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
