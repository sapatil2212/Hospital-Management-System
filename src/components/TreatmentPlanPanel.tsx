"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2, CheckCircle2, RefreshCw, IndianRupee, Activity, Calendar, Download } from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

interface TreatmentPlan {
  id: string;
  planName: string;
  totalSessions: number;
  completedSessions: number;
  status: string;
  totalCost: number;
  paidAmount: number;
  billingStatus: string;
  patient: { id: string; patientId: string; name: string; phone: string };
  service?: { id: string; name: string };
  doctor?: { id: string; name: string };
  department?: { id: string; name: string };
  sessions?: any[];
  createdAt: string;
}

export default function TreatmentPlanPanel() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [sessionUpdating, setSessionUpdating] = useState<string | null>(null);
  const [planUpdating, setPlanUpdating] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMsg, setPaymentMsg] = useState("");
  const [schedulingSession, setSchedulingSession] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);
    
    const d = await api(`/api/treatment-plans?${params.toString()}`);
    if (d.success) setPlans(d.data.plans || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const viewDetails = async (plan: TreatmentPlan) => {
    const d = await api(`/api/treatment-plans/${plan.id}`);
    if (d.success) { setSelectedPlan(d.data); setDetailModal(true); setPaymentMsg(""); setPaymentAmount(""); }
  };

  const refreshPlan = async () => {
    if (!selectedPlan) return;
    const d = await api(`/api/treatment-plans/${selectedPlan.id}`);
    if (d.success) setSelectedPlan(d.data);
    load();
  };

  const markSession = async (sessionId: string, status: "COMPLETED" | "MISSED") => {
    setSessionUpdating(sessionId);
    const d = await api(`/api/treatment-plans/${selectedPlan!.id}/sessions/${sessionId}`, "PUT", { status, completedDate: status === "COMPLETED" ? new Date().toISOString() : undefined });
    if (d.success) await refreshPlan();
    setSessionUpdating(null);
  };

  const scheduleSession = async (sessionId: string, date: string) => {
    if (!date) return;
    setSessionUpdating(sessionId);
    const d = await api(`/api/treatment-plans/${selectedPlan!.id}/sessions/${sessionId}`, "PUT", { scheduledDate: date });
    if (d.success) { await refreshPlan(); setSchedulingSession(null); setScheduleDate(""); }
    setSessionUpdating(null);
  };

  const updatePlanStatus = async (status: string) => {
    if (!selectedPlan) return;
    setPlanUpdating(true);
    const d = await api(`/api/treatment-plans/${selectedPlan.id}`, "PUT", { status });
    if (d.success) await refreshPlan();
    setPlanUpdating(false);
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !paymentAmount) return;
    setPlanUpdating(true);
    setPaymentMsg("");
    const newPaid = (selectedPlan.paidAmount || 0) + Number(paymentAmount);
    const billingStatus = newPaid >= selectedPlan.totalCost ? "PAID" : "PARTIAL";
    const d = await api(`/api/treatment-plans/${selectedPlan.id}`, "PUT", { paidAmount: newPaid, billingStatus });
    if (d.success) { await refreshPlan(); setPaymentAmount(""); setPaymentMsg("Payment recorded"); }
    else setPaymentMsg(d.message || "Failed");
    setPlanUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "blue";
      case "COMPLETED": return "green";
      case "CANCELLED": return "red";
      case "ON_HOLD": return "yellow";
      default: return "gray";
    }
  };

  const getBillingColor = (status: string) => {
    switch (status) {
      case "PAID": return "green";
      case "PARTIAL": return "yellow";
      case "PENDING": return "red";
      default: return "gray";
    }
  };

  const progress = (plan: TreatmentPlan) => {
    return plan.totalSessions > 0 ? (plan.completedSessions / plan.totalSessions) * 100 : 0;
  };

  return (
    <div>
      <style>{`
        .tpp-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
        .tpp-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;flex:1;max-width:400px}
        .tpp-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .tpp-filter{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;color:#1e293b;outline:none;cursor:pointer}
        .tpp-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .tpp-tbl{width:100%;border-collapse:collapse}
        .tpp-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .tpp-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .tpp-tbl tr:last-child td{border-bottom:none}
        .tpp-tbl tbody tr:hover td{background:#fafbfc;cursor:pointer}
        .tpp-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .tpp-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .tpp-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .tpp-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .tpp-badge.yellow{background:#fefce8;color:#ca8a04;border:1px solid #fef08a}
        .tpp-badge.gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .tpp-progress{width:100%;height:6px;background:#f1f5f9;border-radius:100px;overflow:hidden}
        .tpp-progress-fill{height:100%;background:linear-gradient(90deg,#0E898F,#10b981);border-radius:100px;transition:width .3s}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tpp-spin{animation:spin .7s linear infinite}
        .tpp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .tpp-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .tpp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .tpp-modal{background:#fff;border-radius:18px;padding:24px;width:100%;max-width:800px;box-shadow:0 20px 60px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto}
        .tpp-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .tpp-modal-title{font-size:17px;font-weight:800;color:#1e293b}
        .tpp-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .tpp-stat-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px}
        .tpp-stat-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .tpp-stat-label{font-size:12px;color:#64748b;font-weight:600}
        .tpp-stat-value{font-size:16px;color:#1e293b;font-weight:700}
        .tpp-session-list{margin-top:16px}
        .tpp-session-item{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
        .tpp-session-num{width:32px;height:32px;border-radius:50%;background:#E6F4F4;color:#0E898F;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
        .tpp-action-btn{padding:5px 12px;border-radius:7px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s}
        .tpp-section-title{font-size:13px;font-weight:700;color:#1e293b;margin:16px 0 10px}
        .tpp-pay-form{display:flex;gap:8px;align-items:center;margin-top:8px}
        .tpp-pay-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;color:#1e293b;outline:none;flex:1}
        .tpp-pay-btn{padding:8px 16px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:12px;font-weight:700;cursor:pointer}
        .tpp-status-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
      `}</style>

      <div className="tpp-toolbar">
        <div className="tpp-search-wrap">
          <Search size={14} color="#94a3b8" />
          <input className="tpp-search-input" placeholder="Search by patient name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);
            if (search) params.append("search", search);
            window.open(`/api/treatment-plans/export?${params.toString()}`, "_blank");
          }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1.5px solid #B3E0E0", background: "#E6F4F4", color: "#0E898F", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          <Download size={13} /> Export CSV
        </button>
        <select className="tpp-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="tpp-loading">
          <Loader2 size={20} className="tpp-spin" />
          Loading treatment plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="tpp-empty">No treatment plans found.</div>
      ) : (
        <div className="tpp-tbl-wrap">
          <table className="tpp-tbl">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Plan Name</th>
                <th>Progress</th>
                <th>Cost</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Doctor</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} onClick={() => viewDetails(plan)}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{plan.patient.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{plan.patient.patientId}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{plan.planName}</div>
                    {plan.service && <div style={{ fontSize: 11, color: "#94a3b8" }}>{plan.service.name}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                      {plan.completedSessions}/{plan.totalSessions} sessions
                    </div>
                    <div className="tpp-progress">
                      <div className="tpp-progress-fill" style={{ width: `${progress(plan)}%` }} />
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>₹{plan.totalCost.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#10b981" }}>Paid: ₹{plan.paidAmount.toLocaleString()}</div>
                  </td>
                  <td>
                    <span className={`tpp-badge ${getBillingColor(plan.billingStatus)}`}>{plan.billingStatus}</span>
                  </td>
                  <td>
                    <span className={`tpp-badge ${getStatusColor(plan.status)}`}>{plan.status}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{plan.doctor?.name || "—"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailModal && selectedPlan && (
        <div className="tpp-overlay" onClick={(e) => e.target === e.currentTarget && setDetailModal(false)}>
          <div className="tpp-modal">
            <div className="tpp-modal-head">
              <span className="tpp-modal-title">{selectedPlan.planName}</span>
              <button onClick={() => setDetailModal(false)} className="tpp-icon-btn">
                <X size={16} />
              </button>
            </div>

            <div className="tpp-stat-card">
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Patient</span>
                <span className="tpp-stat-value">{selectedPlan.patient.name}</span>
              </div>
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Patient ID</span>
                <span className="tpp-stat-value">{selectedPlan.patient.patientId}</span>
              </div>
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Phone</span>
                <span className="tpp-stat-value">{selectedPlan.patient.phone}</span>
              </div>
            </div>

            <div className="tpp-stat-card">
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Total Sessions</span>
                <span className="tpp-stat-value">{selectedPlan.totalSessions}</span>
              </div>
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Completed</span>
                <span className="tpp-stat-value" style={{ color: "#10b981" }}>{selectedPlan.completedSessions}</span>
              </div>
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Remaining</span>
                <span className="tpp-stat-value" style={{ color: "#f59e0b" }}>{selectedPlan.totalSessions - selectedPlan.completedSessions}</span>
              </div>
            </div>

            <div className="tpp-stat-card">
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Total Cost</span>
                <span className="tpp-stat-value">₹{selectedPlan.totalCost.toLocaleString()}</span>
              </div>
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Paid Amount</span>
                <span className="tpp-stat-value" style={{ color: "#10b981" }}>₹{selectedPlan.paidAmount.toLocaleString()}</span>
              </div>
              <div className="tpp-stat-row">
                <span className="tpp-stat-label">Balance</span>
                <span className="tpp-stat-value" style={{ color: "#ef4444" }}>₹{(selectedPlan.totalCost - selectedPlan.paidAmount).toLocaleString()}</span>
              </div>
            </div>

            {/* Plan Status Controls */}
            <div className="tpp-section-title">Plan Status</div>
            <div className="tpp-status-bar">
              {["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"].map(s => (
                <button key={s} disabled={planUpdating || selectedPlan.status === s}
                  onClick={() => updatePlanStatus(s)}
                  className="tpp-action-btn"
                  style={{ background: selectedPlan.status === s ? "#0E898F" : "#f8fafc", color: selectedPlan.status === s ? "#fff" : "#64748b", border: `1.5px solid ${selectedPlan.status === s ? "#0E898F" : "#e2e8f0"}` }}>
                  {planUpdating && selectedPlan.status !== s ? <Loader2 size={10} style={{ animation: "spin .7s linear infinite" }} /> : s}
                </button>
              ))}
            </div>

            {/* Payment Recording */}
            <div className="tpp-section-title"><IndianRupee size={13} style={{ display: "inline", marginRight: 4 }} />Record Payment</div>
            <form onSubmit={recordPayment} className="tpp-pay-form">
              <input type="number" className="tpp-pay-input" placeholder="Amount (₹)" min="1" max={selectedPlan.totalCost - selectedPlan.paidAmount} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              <button type="submit" className="tpp-pay-btn" disabled={planUpdating || !paymentAmount}>
                {planUpdating ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : "Record"}
              </button>
            </form>
            {paymentMsg && <div style={{ fontSize: 11, color: paymentMsg === "Payment recorded" ? "#16a34a" : "#ef4444", marginTop: 6, fontWeight: 600 }}>{paymentMsg}</div>}

            {/* Sessions */}
            {selectedPlan.sessions && selectedPlan.sessions.length > 0 && (
              <div className="tpp-session-list">
                <div className="tpp-section-title">Sessions</div>
                {selectedPlan.sessions.map((session: any) => (
                  <div key={session.id} className="tpp-session-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div className="tpp-session-num">{session.sessionNumber}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Session {session.sessionNumber}</div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                          {session.scheduledDate && <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10}/>{new Date(session.scheduledDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</span>}
                          {session.completedDate && <span style={{ fontSize: 11, color: "#10b981" }}>✓ {new Date(session.completedDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</span>}
                          {session.performedBy && <span style={{ fontSize: 11, color: "#6366f1" }}>By: {session.performedBy}</span>}
                          {session.notes && <span style={{ fontSize: 11, color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.notes}</span>}
                        </div>
                        {schedulingSession === session.id && (
                          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                              style={{ padding: "4px 8px", borderRadius: 7, border: "1.5px solid #bfdbfe", fontSize: 12, background: "#eff6ff", outline: "none", color: "#1d4ed8" }}/>
                            <button onClick={() => scheduleSession(session.id, scheduleDate)} disabled={!scheduleDate || sessionUpdating === session.id}
                              style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "#0E898F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Set</button>
                            <button onClick={() => setSchedulingSession(null)} style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#64748b" }}>✕</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span className={`tpp-badge ${getStatusColor(session.status)}`}>{session.status}</span>
                      {session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button title="Mark Completed" disabled={sessionUpdating === session.id}
                            onClick={() => markSession(session.id, "COMPLETED")}
                            className="tpp-action-btn" style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0" }}>
                            {sessionUpdating === session.id ? <Loader2 size={10} className="tpp-spin" /> : <CheckCircle2 size={11} />}
                          </button>
                          <button title="Schedule Date" disabled={sessionUpdating === session.id}
                            onClick={() => { setSchedulingSession(session.id); setScheduleDate(session.scheduledDate ? session.scheduledDate.split("T")[0] : ""); }}
                            className="tpp-action-btn" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1.5px solid #bfdbfe" }}>
                            <Calendar size={11} />
                          </button>
                          <button title="Mark Missed" disabled={sessionUpdating === session.id}
                            onClick={() => markSession(session.id, "MISSED")}
                            className="tpp-action-btn" style={{ background: "#fff7ed", color: "#c2410c", border: "1.5px solid #fed7aa" }}>
                            {sessionUpdating === session.id ? <Loader2 size={10} className="tpp-spin" /> : <RefreshCw size={11} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
