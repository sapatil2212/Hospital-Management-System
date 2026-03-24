"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, Eye, Pencil, Trash2, X, User, Phone, Mail, Calendar,
  MapPin, Droplet, Activity, FileText, CreditCard, Stethoscope, Clock,
  ChevronLeft, ChevronRight, Filter, Download, Plus, AlertCircle, CheckCircle2,
  IndianRupee, CalendarDays, UserCircle, Loader2, RefreshCw
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

interface Patient {
  id: string;
  patientId: string;
  name: string;
  email?: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
    bills: number;
    prescriptions: number;
  };
}

interface Appointment {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  type: string;
  status: string;
  consultationFee?: number;
  tokenNumber?: number;
  notes?: string;
  doctor: {
    name: string;
    specialization?: string;
  };
  department?: {
    name: string;
  };
}

interface Bill {
  id: string;
  billNo: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  billItems?: any[];
  payments?: any[];
}

interface ProcedureRecord {
  id: string;
  performedAt: string;
  amount: number;
  status: string;
  notes?: string;
  performedBy?: string;
  procedure: {
    name: string;
    type: string;
  };
  subDepartment: {
    name: string;
  };
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "medical" | "billing">("overview");
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [procedures, setProcedures] = useState<ProcedureRecord[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const loadPatients = async () => {
    setLoading(true);
    const response = await api(`/api/patients?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`);
    if (response.success) {
      setPatients(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    }
    setLoading(false);
  };

  const loadPatientDetails = async (patientId: string) => {
    setDetailsLoading(true);
    setActiveTab("overview");
    
    const [patientRes, appointmentsRes, billsRes, proceduresRes] = await Promise.all([
      api(`/api/patients/${patientId}`),
      api(`/api/appointments?patientId=${patientId}`),
      api(`/api/billing?patientId=${patientId}`),
      api(`/api/subdept/records?patientId=${patientId}`)
    ]);

    if (patientRes.success) {
      setPatientDetails(patientRes.data);
    }
    
    if (appointmentsRes.success) {
      setAppointments(Array.isArray(appointmentsRes.data?.data) ? appointmentsRes.data.data : []);
    }
    
    if (billsRes.success) {
      setBills(Array.isArray(billsRes.data) ? billsRes.data : Array.isArray(billsRes.data?.data) ? billsRes.data.data : []);
    }
    
    if (proceduresRes.success) {
      setProcedures(Array.isArray(proceduresRes.data?.data) ? proceduresRes.data.data : []);
    }
    
    setDetailsLoading(false);
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    await loadPatientDetails(patient.id);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) return;
    
    const response = await api(`/api/patients/${patientId}`, "DELETE");
    if (response.success) {
      alert("Patient deleted successfully");
      loadPatients();
    } else {
      alert(response.message || "Failed to delete patient");
    }
  };

  useEffect(() => {
    loadPatients();
  }, [currentPage, searchTerm]);

  const calculateAge = (dob?: string) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      SCHEDULED: { bg: "#eff6ff", color: "#3b82f6" },
      CONFIRMED: { bg: "#f0f9ff", color: "#0ea5e9" },
      COMPLETED: { bg: "#dcfce7", color: "#16a34a" },
      CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
      NO_SHOW: { bg: "#fef3c7", color: "#f59e0b" },
      PENDING: { bg: "#fef3c7", color: "#f59e0b" },
      PAID: { bg: "#dcfce7", color: "#16a34a" },
      PARTIAL: { bg: "#fef3c7", color: "#f59e0b" },
    };
    return colors[status] || { bg: "#f1f5f9", color: "#64748b" };
  };

  const totalRevenue = Array.isArray(bills) ? bills.reduce((sum, bill) => sum + bill.paidAmount, 0) : 0;
  const pendingAmount = Array.isArray(bills) ? bills.reduce((sum, bill) => sum + (bill.total - bill.paidAmount), 0) : 0;

  if (selectedPatient && patientDetails) {
    return (
      <div style={{ padding: "24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: "100%" }}>
          {/* Header */}
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => { setSelectedPatient(null); setPatientDetails(null); }}
              style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#64748b" }}
            >
              <ChevronLeft size={16} /> Back to Patients
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>Patient Details</h1>
              <p style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0 0" }}>Complete medical and billing history</p>
            </div>
            <button
              onClick={() => loadPatientDetails(selectedPatient.id)}
              style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {detailsLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Loader2 size={32} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: 16, color: "#64748b" }}>Loading patient details...</p>
            </div>
          ) : (
            <>
              {/* Patient Info Card */}
              <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 16, padding: 32, marginBottom: 24, color: "#fff" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "start" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.3)" }}>
                    <UserCircle size={48} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{patientDetails.name}</h2>
                    <p style={{ fontSize: 16, opacity: 0.9, margin: "4px 0 16px 0" }}>Patient ID: {patientDetails.patientId}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Phone size={16} />
                        <span>{patientDetails.phone}</span>
                      </div>
                      {patientDetails.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Mail size={16} />
                          <span>{patientDetails.email}</span>
                        </div>
                      )}
                      {patientDetails.dateOfBirth && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Calendar size={16} />
                          <span>{calculateAge(patientDetails.dateOfBirth)} years</span>
                        </div>
                      )}
                      {patientDetails.bloodGroup && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Droplet size={16} />
                          <span>{patientDetails.bloodGroup}</span>
                        </div>
                      )}
                      {patientDetails.gender && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <User size={16} />
                          <span>{patientDetails.gender}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px 20px", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Total Visits</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{appointments.length}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px 20px" }}>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Total Paid</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>₹{totalRevenue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CalendarDays size={24} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Appointments</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{appointments.length}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Stethoscope size={24} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Procedures</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{procedures.length}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CreditCard size={24} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Pending Bills</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>₹{pendingAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IndianRupee size={24} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Total Revenue</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>₹{totalRevenue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  {[
                    { id: "overview", label: "Overview", icon: <Activity size={16} /> },
                    { id: "appointments", label: "Appointments", icon: <CalendarDays size={16} /> },
                    { id: "medical", label: "Medical History", icon: <Stethoscope size={16} /> },
                    { id: "billing", label: "Billing & Payments", icon: <CreditCard size={16} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        flex: 1,
                        padding: "16px 24px",
                        border: "none",
                        background: activeTab === tab.id ? "#fff" : "transparent",
                        borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                        color: activeTab === tab.id ? "#3b82f6" : "#64748b",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.2s"
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: 24 }}>
                  {activeTab === "overview" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Personal Information</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Full Name</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{patientDetails.name}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Patient ID</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{patientDetails.patientId}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Phone</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{patientDetails.phone}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Email</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{patientDetails.email || "N/A"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Gender</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{patientDetails.gender || "N/A"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Date of Birth</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
                              {patientDetails.dateOfBirth ? new Date(patientDetails.dateOfBirth).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Age</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{calculateAge(patientDetails.dateOfBirth)} years</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Blood Group</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{patientDetails.bloodGroup || "N/A"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                            <span style={{ color: "#64748b", fontSize: 14 }}>Address</span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", textAlign: "right", maxWidth: "60%" }}>{patientDetails.address || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Recent Activity</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {appointments.slice(0, 5).map((apt: Appointment) => (
                            <div key={apt.id} style={{ padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{apt.doctor.name}</span>
                                <span style={{ fontSize: 12, color: "#64748b" }}>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, color: "#64748b" }}>{apt.department?.name || "General"}</span>
                                <span style={{ ...getStatusColor(apt.status), padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "appointments" && (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Appointment History</h3>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Date & Time</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Doctor</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Department</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Type</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Fee</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map((apt: Appointment) => (
                              <tr key={apt.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b" }}>
                                  <div>{new Date(apt.appointmentDate).toLocaleDateString()}</div>
                                  <div style={{ fontSize: 12, color: "#64748b" }}>{apt.timeSlot}</div>
                                </td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b", fontWeight: 600 }}>
                                  <div>{apt.doctor.name}</div>
                                  <div style={{ fontSize: 12, color: "#64748b" }}>{apt.doctor.specialization || ""}</div>
                                </td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#64748b" }}>{apt.department?.name || "General"}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#64748b" }}>{apt.type}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b", fontWeight: 600 }}>₹{apt.consultationFee?.toLocaleString() || 0}</td>
                                <td style={{ padding: "16px" }}>
                                  <span style={{ ...getStatusColor(apt.status), padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                    {apt.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "medical" && (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Procedure Records</h3>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Procedure</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Department</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Type</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Performed By</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {procedures.map((proc: ProcedureRecord) => (
                              <tr key={proc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b" }}>{new Date(proc.performedAt).toLocaleDateString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b", fontWeight: 600 }}>{proc.procedure.name}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#64748b" }}>{proc.subDepartment.name}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#64748b" }}>{proc.procedure.type}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b", fontWeight: 600 }}>₹{proc.amount.toLocaleString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#64748b" }}>{proc.performedBy || "N/A"}</td>
                                <td style={{ padding: "16px" }}>
                                  <span style={{ ...getStatusColor(proc.status), padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                    {proc.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "billing" && (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Billing & Payment History</h3>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Bill No</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Date</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Subtotal</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Discount</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Tax</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Paid</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Balance</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bills.map((bill: Bill) => (
                              <tr key={bill.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b", fontWeight: 600 }}>{bill.billNo}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#64748b" }}>{new Date(bill.createdAt).toLocaleDateString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b" }}>₹{bill.subtotal.toLocaleString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#16a34a" }}>-₹{bill.discount.toLocaleString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#64748b" }}>₹{bill.tax.toLocaleString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#1e293b", fontWeight: 700 }}>₹{bill.total.toLocaleString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: "#16a34a", fontWeight: 600 }}>₹{bill.paidAmount.toLocaleString()}</td>
                                <td style={{ padding: "16px", fontSize: 14, color: bill.total - bill.paidAmount > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                                  ₹{(bill.total - bill.paidAmount).toLocaleString()}
                                </td>
                                <td style={{ padding: "16px" }}>
                                  <span style={{ ...getStatusColor(bill.status), padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                    {bill.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "calc(100vh - 80px)" }}>
      <div style={{ maxWidth: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Patient Management</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "8px 0 0 0" }}>Complete patient records and medical history</p>
        </div>

        {/* Search & Actions */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by name, phone, or patient ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: "100%", padding: "10px 12px 10px 40px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <button
            onClick={() => router.push("/hospitaladmin/appointments")}
            style={{ padding: "10px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Register New Patient
          </button>
        </div>

        {/* Patients Table */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>All Patients</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>Total: {patients.length} patients</p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Loader2 size={32} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: 16, color: "#64748b" }}>Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Users size={48} color="#cbd5e1" />
              <p style={{ marginTop: 16, color: "#64748b", fontSize: 14 }}>No patients found</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Patient ID</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Name</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Phone</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Email</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Gender</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Age</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Blood Group</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Visits</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Registered</th>
                      <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "18px 20px", fontSize: 13, color: "#3b82f6", fontWeight: 700, fontFamily: "monospace" }}>{patient.patientId}</td>
                        <td style={{ padding: "18px 20px", fontSize: 14, color: "#1e293b", fontWeight: 600 }}>{patient.name}</td>
                        <td style={{ padding: "18px 20px", fontSize: 14, color: "#64748b" }}>{patient.phone}</td>
                        <td style={{ padding: "18px 20px", fontSize: 14, color: "#64748b" }}>{patient.email || "—"}</td>
                        <td style={{ padding: "18px 20px", fontSize: 14, color: "#64748b" }}>{patient.gender || "—"}</td>
                        <td style={{ padding: "18px 20px", fontSize: 14, color: "#64748b" }}>{calculateAge(patient.dateOfBirth)}</td>
                        <td style={{ padding: "18px 20px", fontSize: 14, color: "#64748b" }}>{patient.bloodGroup || "—"}</td>
                        <td style={{ padding: "18px 20px", fontSize: 14, color: "#1e293b", fontWeight: 600 }}>{patient._count?.appointments || 0}</td>
                        <td style={{ padding: "18px 20px", fontSize: 13, color: "#64748b" }}>{new Date(patient.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "18px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <button
                              onClick={() => handleViewPatient(patient)}
                              style={{ padding: "6px 10px", background: "#eff6ff", color: "#3b82f6", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                              title="View Details"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              onClick={() => handleDeletePatient(patient.id)}
                              style={{ padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ padding: "6px 12px", background: currentPage === 1 ? "#f1f5f9" : "#fff", border: "1px solid #e2e8f0", borderRadius: 6, cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#cbd5e1" : "#64748b", fontWeight: 600, fontSize: 13 }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ padding: "6px 12px", background: currentPage === totalPages ? "#f1f5f9" : "#fff", border: "1px solid #e2e8f0", borderRadius: 6, cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: currentPage === totalPages ? "#cbd5e1" : "#64748b", fontWeight: 600, fontSize: 13 }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
