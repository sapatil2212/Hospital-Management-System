"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck, Users, RefreshCw, Loader2, ChevronRight, Trash2, AlertTriangle, Download,
} from "lucide-react";
import AppointmentPanel from "@/components/AppointmentPanel";
import FollowUpDashboard from "@/components/FollowUpDashboard";
import PatientProfilePanel from "@/components/PatientProfilePanel";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

type Tab = "appointments" | "followups" | "patients";

const TABS = [
  { id: "appointments" as Tab, label: "Appointments", icon: CalendarCheck },
  { id: "followups"    as Tab, label: "Follow-ups",   icon: RefreshCw },
  { id: "patients"     as Tab, label: "Patients",     icon: Users },
];

export default function AppointmentsPage() {
  const [tab, setTab] = useState<Tab>("appointments");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  return (
    <div style={{ padding: 24 }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "#fff", borderRadius: 12, padding: 6, border: "1px solid #e2e8f0", width: "fit-content", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedPatientId(null); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: "none", background: active ? "#0E898F" : "transparent", color: active ? "#fff" : "#64748b", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {selectedPatientId ? (
        <PatientProfilePanel patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
      ) : (
        <>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
            {tab === "appointments" && "Book, view, and manage all patient appointments"}
            {tab === "followups"    && "Track and manage patient follow-up schedules"}
            {tab === "patients"     && "Search and view all registered patients"}
          </div>

          {tab === "appointments" && <AppointmentPanel onViewPatient={setSelectedPatientId} />}
          {tab === "followups"    && <FollowUpDashboard onViewPatient={setSelectedPatientId} />}
          {tab === "patients"     && <PatientsListPanel onSelectPatient={setSelectedPatientId} />}
        </>
      )}
    </div>
  );
}

// ─── Inline Patients List Panel ───
function PatientsListPanel({ onSelectPatient }: { onSelectPatient: (id: string) => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    const d = await api(`/api/patients?${params}`);
    if (d.success) { setPatients(d.data?.data || []); setPagination(d.data?.pagination || { total: 0, totalPages: 1 }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const d = await api(`/api/patients/${deleteTarget.id}`, "DELETE");
    if (d.success) {
      setDeleteTarget(null);
      load();
    } else {
      alert(d.message || "Failed to delete patient");
    }
    setDeleting(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", flex: 1, maxWidth: 360 }}>
          <Users size={13} color="#94a3b8" />
          <input style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#334155", width: "100%" }}
            placeholder="Search by name, phone, patient ID..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{pagination.total} patients</div>
        <a href={`/api/export/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`}
          download style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #d1fae5", background: "#f0fdf4", fontSize: 12, color: "#059669", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, textDecoration: "none", marginLeft: "auto" }}>
          <Download size={12} />Export CSV
        </a>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "#94a3b8" }}>
          <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />Loading...
        </div>
      ) : patients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", color: "#94a3b8" }}>
          <Users size={32} style={{ marginBottom: 10, opacity: .4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No patients found</div>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Patient ID", "Name", "Phone", "Email", "Gender", "Visits", "Follow-ups", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6 }}>{p.patientId}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>{p.phone}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>{p.email || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {p.gender ? (
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>{p.gender}</span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#0A6B70" }}>{p._count?.appointments || 0}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#10b981" }}>{p._count?.followUps || 0}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); onSelectPatient(p.id); }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#E6F4F4", color: "#0E898F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="View Patient">
                        <ChevronRight size={13} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Delete Patient">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Showing {patients.length} of {pagination.total}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .5 : 1 }}>
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: page === pagination.totalPages ? "not-allowed" : "pointer", opacity: page === pagination.totalPages ? .5 : 1 }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Delete Patient?</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.patientId})? This action cannot be undone and will permanently remove all patient records, appointments, and history.
                </div>
              </div>
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600, marginBottom: 4 }}>⚠️ Warning</div>
              <div style={{ fontSize: 11, color: "#a16207" }}>
                This will delete {deleteTarget._count?.appointments || 0} appointment(s) and {deleteTarget._count?.followUps || 0} follow-up(s) associated with this patient.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? .5 : 1 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? .7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {deleting && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
                {deleting ? "Deleting..." : "Delete Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
