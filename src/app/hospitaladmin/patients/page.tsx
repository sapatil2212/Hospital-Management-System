"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Stethoscope, ClipboardList,
  CreditCard, IndianRupee, Plus, Trash2, Eye, ChevronRight, ChevronLeft,
  Phone, Mail, Calendar, Droplet, User, Activity, RefreshCw, Loader2,
  UserCircle, AlertTriangle
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

// ─── Patient Management Panel ───
function PatientsPanel() {
  const router = useRouter();

  // List view state
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const itemsPerPage = 15;

  // Detail view state
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "appointments" | "medical" | "billing">("overview");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);

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

  const loadPatientDetails = async (id: string) => {
    setDetailsLoading(true);
    setDetailTab("overview");
    setAppointments([]);
    setBills([]);
    setProcedures([]);

    const [pRes, aRes, bRes, prRes] = await Promise.all([
      api(`/api/patients/${id}`),
      api(`/api/appointments?patientId=${id}`),
      api(`/api/billing?patientId=${id}`),
      api(`/api/subdept/records?patientId=${id}`)
    ]);

    if (pRes.success) setPatientDetails(pRes.data);
    if (aRes.success) setAppointments(Array.isArray(aRes.data?.data) ? aRes.data.data : []);
    if (bRes.success) setBills(Array.isArray(bRes.data?.bills) ? bRes.data.bills : Array.isArray(bRes.data) ? bRes.data : []);
    if (prRes.success) setProcedures(Array.isArray(prRes.data?.data) ? prRes.data.data : []);

    setDetailsLoading(false);
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
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>{totalCount} registered patients</p>
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
                          style={{ padding: "6px 12px", background: "#E6F4F4", color: "#0E898F", border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          style={{ padding: "6px 10px", background: "#fff5f5", color: "#ef4444", border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <Trash2 size={13} />
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
    </div>
  );
}

// ── Main Page ──
export default function PatientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/api/auth/me").then(d => { if (d.success) setUser(d.data); });
  }, []);

  const logout = async () => {
    await api("/api/auth/logout", "POST");
    router.push("/hospitaladmin/login");
  };

  const navItems = [
    { id: "overview",      label: "Dashboard",    icon: <LayoutDashboard size={16} />, route: "/hospitaladmin/dashboard" },
    { id: "appointments",  label: "Appointments", icon: <CalendarDays size={16} />,    route: "/hospitaladmin/appointments" },
    { id: "staff",         label: "Staff",        icon: <Users size={16} />,            route: "/hospitaladmin/dashboard?tab=staff" },
    { id: "patients",      label: "Patients",     icon: <UserRound size={16} />,        route: "/hospitaladmin/patients" },
    { id: "inventory",     label: "Inventory",    icon: <ClipboardList size={16} />,    route: "/hospitaladmin/dashboard?tab=inventory" },
    { id: "billing",       label: "Billing",      icon: <CreditCard size={16} />,       route: "/hospitaladmin/billing" },
    { id: "finance",       label: "Finance",      icon: <IndianRupee size={16} />,      route: "/hospitaladmin/finance" },
    { id: "settings",      label: "Settings",     icon: <Settings size={16} />,         route: "/hospitaladmin/dashboard?tab=settings" },
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
        .hd-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#0E898F,#07595D);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
        .hd-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .hd-logo-sub{font-size:10px;color:#94a3b8}
        .hd-nav{flex:1;padding:12px 12px;overflow-y:auto}
        .hd-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
        .hd-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .hd-nb:hover{background:#f8fafc;color:#334155}
        .hd-nb.on{background:#E6F4F4;color:#0A6B70;font-weight:600}
        .hd-nb-dot{display:none;width:3px;border-radius:4px;height:22px;background:#0E898F;position:absolute;left:0}
        .hd-nb.on .hd-nb-dot{display:block}
        .hd-sb-foot{padding:14px 16px 18px;border-top:1px solid #f1f5f9}
        .hd-user-chip{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:10px}
        .hd-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#0E898F,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .hd-uname{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hd-urole{font-size:10px;font-weight:500;color:#0E898F}
        .hd-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .hd-logout:hover{background:#fee2e2}
        .hd-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .hd-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .hd-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
        .hd-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .hd-search::placeholder{color:#94a3b8}
        .hd-topbar-right{display:flex;align-items:center;gap:12px}
        .hd-notif{width:36px;height:36px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
        .hd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#ef4444;border:1.5px solid #fff}
        .hd-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer}
        .hd-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#0E898F,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
        .hd-profile-name{font-size:11px;font-weight:600;color:#1e293b}
        .hd-profile-role{font-size:9px;color:#64748b}
        .hd-center{padding:32px 24px;overflow-y:auto;flex:1}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="hd">
        <aside className="hd-sb">
          <div className="hd-sb-logo">
            <div className="hd-logo-ic"><Stethoscope size={18} color="white" /></div>
            <div><div className="hd-logo-tx">MediCare+</div><div className="hd-logo-sub">Hospital Admin</div></div>
          </div>
          <nav className="hd-nav">
            <div className="hd-nav-sec">General</div>
            {navItems.slice(0, 7).map(n => (
              <button key={n.id} className={`hd-nb${n.id === "patients" ? " on" : ""}`} onClick={() => router.push(n.route)} style={{ position: "relative" }}>
                {n.id === "patients" && <div className="hd-nb-dot" />}
                <span style={{ color: n.id === "patients" ? "#0A6B70" : "#94a3b8", display: "flex" }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div className="hd-nav-sec">System</div>
            {navItems.slice(7).map(n => (
              <button key={n.id} className="hd-nb" onClick={() => router.push(n.route)} style={{ position: "relative" }}>
                <span style={{ color: "#94a3b8", display: "flex" }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <button className="hd-nb" onClick={() => router.push("/hospitaladmin/configure")}>
              <span style={{ color: "#94a3b8", display: "flex" }}><Building2 size={16} /></span>
              Configure Hospital
            </button>
            <button className="hd-nb">
              <span style={{ color: "#94a3b8", display: "flex" }}><HelpCircle size={16} /></span>
              Support
            </button>
          </nav>
          <div className="hd-sb-foot">
            <div className="hd-user-chip">
              <div className="hd-av">{user?.name ? initials(user.name) : "HA"}</div>
              <div style={{ overflow: "hidden" }}>
                <div className="hd-uname">{user?.name || "Hospital Admin"}</div>
                <div className="hd-urole">Hospital Admin</div>
              </div>
            </div>
            <button className="hd-logout" onClick={logout}>
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </aside>

        <main className="hd-main">
          <header className="hd-topbar">
            <div className="hd-search-wrap">
              <Search size={14} color="#94a3b8" />
              <input className="hd-search" placeholder="What are you searching..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="hd-topbar-right">
              <div className="hd-notif"><Bell size={16} color="#64748b" /><span className="hd-notif-dot" /></div>
              <div className="hd-notif"><MessageSquare size={16} color="#64748b" /></div>
              <div className="hd-profile">
                <div className="hd-profile-av">{user?.name ? initials(user.name) : "HA"}</div>
                <div><div className="hd-profile-name">{user?.name?.split(" ")[0] || "Admin"}</div><div className="hd-profile-role">Hosp. Admin</div></div>
              </div>
            </div>
          </header>

          <div className="hd-center">
            <PatientsPanel />
          </div>
        </main>
      </div>
    </>
  );
}
