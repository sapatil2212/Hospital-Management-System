"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, RefreshCw, Loader2, CreditCard, User, Calendar,
  IndianRupee, Stethoscope, Receipt, CheckCircle2, Clock,
  AlertCircle, Building2, Eye, X, Plus, Trash2, Edit3, Download, Printer, Phone, Mail, MapPin
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QueueItem {
  id: string;
  patient: { id: string; name: string; patientId: string; phone?: string; email?: string };
  doctor: { id: string; name: string; specialization?: string };
  department?: { id: string; name: string };
  subDepartment?: { id: string; name: string; type: string };
  appointmentDate: string;
  timeSlot: string;
  consultationFee: number;
  bill?: {
    id: string;
    billNo: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: string;
    isGst: boolean;
    cgst: number;
    sgst: number;
    igst: number;
    billItems: Array<{ id: string; name: string; quantity: number; unitPrice: number; amount: number; type: string }>;
  };
  billingNote?: string;
}

interface HospitalInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "#fff7ed", color: "#c2410c", label: "Pending" },
  PARTIALLY_PAID: { bg: "#fef3c7", color: "#b45309", label: "Partial" },
  PAID: { bg: "#f0fdf4", color: "#166534", label: "Paid" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
  DRAFT: { bg: "#f1f5f9", color: "#475569", label: "Draft" },
};

const fmtCur = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; } };
const fmtTime = (t: string) => {
  try {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    const ampm = hr >= 12 ? "PM" : "AM";
    const hr12 = hr % 12 || 12;
    return `${hr12}:${m} ${ampm}`;
  } catch { return t; }
};

const api = async (url: string, opts?: RequestInit) => {
  const r = await fetch(url, { credentials: "include", ...opts });
  return r.json();
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [viewMode, setViewMode] = useState<"payment" | "view" | "edit" | null>(null);
  const [paymentForm, setPaymentForm] = useState({ method: "CASH", amount: "", transactionId: "", notes: "" });
  const [editForm, setEditForm] = useState({ discount: 0, cgst: 0, sgst: 0, igst: 0, isGst: false, otherCharges: [] as Array<{name: string; amount: number}> });
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>({ name: "Hospital", address: "", phone: "", email: "", logo: "" });
  const printRef = useRef<HTMLDivElement>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateFilter) params.set("date", dateFilter);
    const d = await api(`/api/billing/queue?${params}`);
    if (d.success) setQueue(d.data || []);
    setLoading(false);
  }, [search, dateFilter]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  useEffect(() => {
    // Load hospital info
    api("/api/dashboard/overview").then(d => {
      if (d.success && d.data?.hospital) {
        setHospitalInfo({
          name: d.data.hospital.name || "Hospital",
          address: d.data.hospital.address || "",
          phone: d.data.hospital.phone || "",
          email: d.data.hospital.email || "",
          logo: d.data.hospital.logo || ""
        });
      }
    });
  }, []);

  const handleView = (item: QueueItem) => {
    setSelectedItem(item);
    setViewMode("view");
  };

  const handleEdit = (item: QueueItem) => {
    setSelectedItem(item);
    setEditForm({
      discount: item.bill?.discount || 0,
      cgst: item.bill?.cgst || 0,
      sgst: item.bill?.sgst || 0,
      igst: item.bill?.igst || 0,
      isGst: item.bill?.isGst || false,
      otherCharges: []
    });
    setViewMode("edit");
  };

  const handleCollect = (item: QueueItem) => {
    setSelectedItem(item);
    setPaymentForm({
      method: "CASH",
      amount: item.bill?.total ? String(item.bill.total) : "",
      transactionId: "",
      notes: ""
    });
    setViewMode("payment");
  };

  const handleDelete = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    setDeleting(billId);
    const d = await api(`/api/billing/${billId}`, { method: "DELETE" });
    if (d.success) {
      loadQueue();
    } else {
      alert(d.message || "Failed to delete bill");
    }
    setDeleting(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem?.bill?.id) return;
    setPaying(true);
    const d = await api(`/api/billing/${selectedItem.bill.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discount: editForm.discount,
        isGst: editForm.isGst,
        cgst: editForm.cgst,
        sgst: editForm.sgst,
        igst: editForm.igst
      })
    });
    if (d.success) {
      setViewMode(null);
      setSelectedItem(null);
      loadQueue();
    } else {
      alert(d.message || "Failed to update bill");
    }
    setPaying(false);
  };

  const handlePayment = async () => {
    if (!selectedItem?.bill?.id) return;
    setPaying(true);
    const d = await api(`/api/billing/${selectedItem.bill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: paymentForm.method,
        amount: parseFloat(paymentForm.amount),
        transactionId: paymentForm.transactionId || undefined,
        notes: paymentForm.notes || undefined
      })
    });
    if (d.success) {
      setViewMode(null);
      setSelectedItem(null);
      loadQueue();
    } else {
      alert(d.message || "Failed to record payment");
    }
    setPaying(false);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Bill - ${selectedItem?.bill?.billNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .bill-container { max-width: 800px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f8f9fa; font-weight: 600; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #333; }
            @media print { button { display: none; } }
          </style>
          </head><body>${printContent}</body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const calculateEditedTotal = () => {
    if (!selectedItem?.bill) return 0;
    let subtotal = selectedItem.bill.subtotal;
    let tax = 0;
    if (editForm.isGst) {
      tax = (subtotal * (editForm.cgst + editForm.sgst + editForm.igst)) / 100;
    }
    return subtotal + tax - editForm.discount;
  };

  const stats = {
    queueCount: queue.length,
    totalPending: queue.reduce((sum, q) => sum + (q.bill?.status === "PENDING" ? (q.bill?.total || 0) : 0), 0),
    totalCollected: queue.reduce((sum, q) => sum + (q.bill?.status === "PAID" ? (q.bill?.total || 0) : 0), 0),
  };

  return (
    <>
      <style>{BQ_CSS}</style>
      <div className="bq-wrap">
        {/* Stats Bar */}
        <div className="bq-stats">
          <div className="bq-stat-card" style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>
            <div className="bq-stat-icon"><Receipt size={20} color="#fff" /></div>
            <div>
              <div className="bq-stat-value">{stats.queueCount}</div>
              <div className="bq-stat-label">In Queue</div>
            </div>
          </div>
          <div className="bq-stat-card" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            <div className="bq-stat-icon"><Clock size={20} color="#fff" /></div>
            <div>
              <div className="bq-stat-value">{fmtCur(stats.totalPending)}</div>
              <div className="bq-stat-label">Pending Collection</div>
            </div>
          </div>
          <div className="bq-stat-card" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            <div className="bq-stat-icon"><CheckCircle2 size={20} color="#fff" /></div>
            <div>
              <div className="bq-stat-value">{fmtCur(stats.totalCollected)}</div>
              <div className="bq-stat-label">Collected Today</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bq-filters">
          <div className="bq-search">
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search patient, doctor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" className="bq-date-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          <button className="bq-btn-secondary" onClick={() => { setSearch(""); setDateFilter(""); }}>
            <X size={14} />Clear
          </button>
          <button className="bq-btn-primary" onClick={loadQueue}>
            <RefreshCw size={14} style={loading ? { animation: "spin .7s linear infinite" } : {}} />
            Refresh
          </button>
        </div>

        {/* Queue Table */}
        <div className="bq-card">
          {loading ? (
            <div className="bq-loading">
              <Loader2 size={24} style={{ animation: "spin .7s linear infinite" }} />
              <span>Loading billing queue...</span>
            </div>
          ) : queue.length === 0 ? (
            <div className="bq-empty">
              <Receipt size={40} color="#cbd5e1" />
              <div className="bq-empty-title">No bills in queue</div>
              <div className="bq-empty-sub">Transferred appointments will appear here</div>
            </div>
          ) : (
            <table className="bq-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Fee</th>
                  <th>Sub-Dept</th>
                  <th>Bill Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(item => {
                  const sc = item.bill ? STATUS_COLORS[item.bill.status] || STATUS_COLORS.PENDING : STATUS_COLORS.DRAFT;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="bq-patient">
                          <div className="bq-patient-avatar">{(item.patient.name || "?")[0].toUpperCase()}</div>
                          <div>
                            <div className="bq-patient-name">{item.patient.name}</div>
                            <div className="bq-patient-id">{item.patient.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="bq-doctor-name">{item.doctor.name}</div>
                        <div className="bq-doctor-spec">{item.doctor.specialization || item.department?.name || "—"}</div>
                      </td>
                      <td>
                        <div className="bq-date">{fmtDate(item.appointmentDate)}</div>
                        <div className="bq-time">{fmtTime(item.timeSlot)}</div>
                      </td>
                      <td className="bq-fee">{fmtCur(item.consultationFee)}</td>
                      <td>
                        {item.subDepartment ? (
                          <span className="bq-badge" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                            {item.subDepartment.name}
                          </span>
                        ) : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td>
                        <span className="bq-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="bq-total">{item.bill ? fmtCur(item.bill.total) : "—"}</td>
                      <td>
                        <div className="bq-actions">
                          {item.bill && (
                            <>
                              <button className="bq-action-btn bq-action-view" onClick={() => handleView(item)} title="View Bill">
                                <Eye size={14} />
                              </button>
                              {item.bill.status !== "PAID" && (
                                <>
                                  <button className="bq-action-btn bq-action-edit" onClick={() => handleEdit(item)} title="Edit Bill">
                                    <Edit3 size={14} />
                                  </button>
                                  <button className="bq-action-btn bq-action-collect" onClick={() => handleCollect(item)} title="Collect Payment">
                                    <CreditCard size={14} />
                                  </button>
                                </>
                              )}
                              <button 
                                className="bq-action-btn bq-action-delete" 
                                onClick={() => handleDelete(item.bill!.id)} 
                                disabled={deleting === item.bill.id}
                                title="Delete Bill"
                              >
                                {deleting === item.bill.id ? <Loader2 size={14} style={{animation: "spin .7s linear infinite"}} /> : <Trash2 size={14} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* View Bill Modal */}
        {viewMode === "view" && selectedItem?.bill && (
          <div className="bq-modal-overlay" onClick={() => setViewMode(null)}>
            <div className="bq-modal bq-modal-large" onClick={e => e.stopPropagation()}>
              <div className="bq-modal-header">
                <h3>Bill Details - {selectedItem.bill.billNo}</h3>
                <div style={{display: "flex", gap: 8}}>
                  <button className="bq-btn-icon" onClick={handlePrint} title="Print">
                    <Printer size={16} />
                  </button>
                  <button className="bq-btn-icon" onClick={() => setViewMode(null)}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="bq-modal-body">
                <div ref={printRef} className="bill-container">
                  {/* Bill Header */}
                  <div className="bill-header">
                    <div className="bill-logo">
                      {hospitalInfo.logo ? (
                        <img src={hospitalInfo.logo} alt={hospitalInfo.name} style={{maxHeight: 60}} />
                      ) : (
                        <div className="bill-logo-placeholder">
                          <Building2 size={32} color="#0ea5e9" />
                        </div>
                      )}
                    </div>
                    <div className="bill-hospital-info">
                      <h2>{hospitalInfo.name}</h2>
                      {hospitalInfo.address && <div className="bill-info-row"><MapPin size={14} />{hospitalInfo.address}</div>}
                      {hospitalInfo.phone && <div className="bill-info-row"><Phone size={14} />{hospitalInfo.phone}</div>}
                      {hospitalInfo.email && <div className="bill-info-row"><Mail size={14} />{hospitalInfo.email}</div>}
                    </div>
                  </div>
                  <div className="bill-divider" />
                  
                  {/* Bill Info */}
                  <div className="bill-info-grid">
                    <div>
                      <div className="bill-label">Bill No:</div>
                      <div className="bill-value">{selectedItem.bill.billNo}</div>
                    </div>
                    <div>
                      <div className="bill-label">Date:</div>
                      <div className="bill-value">{fmtDate(selectedItem.appointmentDate)}</div>
                    </div>
                    <div>
                      <div className="bill-label">Patient:</div>
                      <div className="bill-value">{selectedItem.patient.name} ({selectedItem.patient.patientId})</div>
                    </div>
                    <div>
                      <div className="bill-label">Doctor:</div>
                      <div className="bill-value">Dr. {selectedItem.doctor.name}</div>
                    </div>
                  </div>

                  {/* Bill Items Table */}
                  <table className="bill-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.bill.billItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">{fmtCur(item.unitPrice)}</td>
                          <td className="text-right">{fmtCur(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Bill Summary */}
                  <div className="bill-summary">
                    <div className="bill-summary-row">
                      <span>Subtotal:</span>
                      <span>{fmtCur(selectedItem.bill.subtotal)}</span>
                    </div>
                    {selectedItem.bill.isGst && (
                      <>
                        {selectedItem.bill.cgst > 0 && (
                          <div className="bill-summary-row">
                            <span>CGST ({selectedItem.bill.cgst}%):</span>
                            <span>{fmtCur((selectedItem.bill.subtotal * selectedItem.bill.cgst) / 100)}</span>
                          </div>
                        )}
                        {selectedItem.bill.sgst > 0 && (
                          <div className="bill-summary-row">
                            <span>SGST ({selectedItem.bill.sgst}%):</span>
                            <span>{fmtCur((selectedItem.bill.subtotal * selectedItem.bill.sgst) / 100)}</span>
                          </div>
                        )}
                        {selectedItem.bill.igst > 0 && (
                          <div className="bill-summary-row">
                            <span>IGST ({selectedItem.bill.igst}%):</span>
                            <span>{fmtCur((selectedItem.bill.subtotal * selectedItem.bill.igst) / 100)}</span>
                          </div>
                        )}
                      </>
                    )}
                    {selectedItem.bill.tax > 0 && !selectedItem.bill.isGst && (
                      <div className="bill-summary-row">
                        <span>Tax:</span>
                        <span>{fmtCur(selectedItem.bill.tax)}</span>
                      </div>
                    )}
                    {selectedItem.bill.discount > 0 && (
                      <div className="bill-summary-row">
                        <span>Discount:</span>
                        <span className="text-success">-{fmtCur(selectedItem.bill.discount)}</span>
                      </div>
                    )}
                    <div className="bill-summary-row bill-total">
                      <span>Total Amount:</span>
                      <strong>{fmtCur(selectedItem.bill.total)}</strong>
                    </div>
                  </div>

                  <div className="bill-footer">
                    <p>Thank you for choosing {hospitalInfo.name}</p>
                    <p style={{fontSize: 11, color: "#94a3b8", marginTop: 8}}>This is a computer-generated bill</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bill Modal */}
        {viewMode === "edit" && selectedItem?.bill && (
          <div className="bq-modal-overlay" onClick={() => !paying && setViewMode(null)}>
            <div className="bq-modal" onClick={e => e.stopPropagation()}>
              <div className="bq-modal-header">
                <h3>Edit Bill - {selectedItem.bill.billNo}</h3>
                <button onClick={() => setViewMode(null)} disabled={paying}>
                  <X size={18} />
                </button>
              </div>
              <div className="bq-modal-body">
                <div className="bq-modal-patient">
                  <User size={16} color="#64748b" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{selectedItem.patient.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{selectedItem.patient.patientId}</div>
                  </div>
                </div>

                {/* Bill Items */}
                <div className="bq-bill-items">
                  <h4>Bill Items</h4>
                  <table className="bq-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.bill.billItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{fmtCur(item.unitPrice)}</td>
                          <td>{fmtCur(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bq-subtotal">Subtotal: {fmtCur(selectedItem.bill.subtotal)}</div>
                </div>

                {/* GST Toggle */}
                <div className="bq-form-group">
                  <label style={{display: "flex", alignItems: "center", gap: 8, cursor: "pointer"}}>
                    <input 
                      type="checkbox" 
                      checked={editForm.isGst} 
                      onChange={e => setEditForm(f => ({...f, isGst: e.target.checked, cgst: e.target.checked ? 9 : 0, sgst: e.target.checked ? 9 : 0, igst: 0}))}
                      style={{width: "auto"}}
                    />
                    <span>Apply GST</span>
                  </label>
                </div>

                {/* GST Fields */}
                {editForm.isGst && (
                  <div className="bq-gst-grid">
                    <div className="bq-form-group">
                      <label>CGST (%)</label>
                      <input type="number" step="0.01" value={editForm.cgst} onChange={e => setEditForm(f => ({...f, cgst: parseFloat(e.target.value) || 0}))} />
                    </div>
                    <div className="bq-form-group">
                      <label>SGST (%)</label>
                      <input type="number" step="0.01" value={editForm.sgst} onChange={e => setEditForm(f => ({...f, sgst: parseFloat(e.target.value) || 0}))} />
                    </div>
                    <div className="bq-form-group">
                      <label>IGST (%)</label>
                      <input type="number" step="0.01" value={editForm.igst} onChange={e => setEditForm(f => ({...f, igst: parseFloat(e.target.value) || 0}))} />
                    </div>
                  </div>
                )}

                {/* Discount */}
                <div className="bq-form-group">
                  <label>Discount (₹)</label>
                  <input type="number" step="0.01" value={editForm.discount} onChange={e => setEditForm(f => ({...f, discount: parseFloat(e.target.value) || 0}))} />
                </div>

                {/* Calculated Total */}
                <div className="bq-calculated-total">
                  <div className="bq-calc-row">
                    <span>Subtotal:</span>
                    <span>{fmtCur(selectedItem.bill.subtotal)}</span>
                  </div>
                  {editForm.isGst && (
                    <div className="bq-calc-row">
                      <span>GST ({editForm.cgst + editForm.sgst + editForm.igst}%):</span>
                      <span>{fmtCur((selectedItem.bill.subtotal * (editForm.cgst + editForm.sgst + editForm.igst)) / 100)}</span>
                    </div>
                  )}
                  {editForm.discount > 0 && (
                    <div className="bq-calc-row">
                      <span>Discount:</span>
                      <span className="text-success">-{fmtCur(editForm.discount)}</span>
                    </div>
                  )}
                  <div className="bq-calc-row bq-calc-total">
                    <span>New Total:</span>
                    <strong>{fmtCur(calculateEditedTotal())}</strong>
                  </div>
                </div>
              </div>
              <div className="bq-modal-footer">
                <button className="bq-btn-secondary" onClick={() => setViewMode(null)} disabled={paying}>
                  Cancel
                </button>
                <button className="bq-btn-primary" onClick={handleSaveEdit} disabled={paying}>
                  {paying && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}
                  {paying ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {viewMode === "payment" && selectedItem?.bill && (
          <div className="bq-modal-overlay" onClick={() => !paying && setViewMode(null)}>
            <div className="bq-modal" onClick={e => e.stopPropagation()}>
              <div className="bq-modal-header">
                <h3>Collect Payment</h3>
                <button onClick={() => setViewMode(null)} disabled={paying}>
                  <X size={18} />
                </button>
              </div>
              <div className="bq-modal-body">
                <div className="bq-modal-patient">
                  <User size={16} color="#64748b" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{selectedItem.patient.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{selectedItem.patient.patientId}</div>
                  </div>
                </div>

                <div className="bq-bill-summary">
                  <div className="bq-bill-row">
                    <span>Bill Number:</span>
                    <strong>{selectedItem.bill.billNo}</strong>
                  </div>
                  <div className="bq-bill-row">
                    <span>Subtotal:</span>
                    <span>{fmtCur(selectedItem.bill.subtotal)}</span>
                  </div>
                  {selectedItem.bill.tax > 0 && (
                    <div className="bq-bill-row">
                      <span>Tax:</span>
                      <span>{fmtCur(selectedItem.bill.tax)}</span>
                    </div>
                  )}
                  {selectedItem.bill.discount > 0 && (
                    <div className="bq-bill-row">
                      <span>Discount:</span>
                      <span style={{ color: "#059669" }}>-{fmtCur(selectedItem.bill.discount)}</span>
                    </div>
                  )}
                  <div className="bq-bill-row bq-bill-total">
                    <span>Total Amount:</span>
                    <strong>{fmtCur(selectedItem.bill.total)}</strong>
                  </div>
                </div>

                <div className="bq-form-group">
                  <label>Payment Method</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))}>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="NETBANKING">Net Banking</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="DD">DD</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="bq-form-group">
                  <label>Amount</label>
                  <input type="number" step="0.01" placeholder="0.00" value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
                </div>

                {paymentForm.method !== "CASH" && (
                  <div className="bq-form-group">
                    <label>Transaction ID</label>
                    <input type="text" placeholder="Optional" value={paymentForm.transactionId}
                      onChange={e => setPaymentForm(p => ({ ...p, transactionId: e.target.value }))} />
                  </div>
                )}

                <div className="bq-form-group">
                  <label>Notes</label>
                  <textarea rows={2} placeholder="Optional notes..." value={paymentForm.notes}
                    onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="bq-modal-footer">
                <button className="bq-btn-secondary" onClick={() => setViewMode(null)} disabled={paying}>
                  Cancel
                </button>
                <button className="bq-btn-primary" onClick={handlePayment} disabled={paying || !paymentForm.amount}>
                  {paying && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}
                  {paying ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const BQ_CSS = `
@keyframes spin{to{transform:rotate(360deg)}}
.bq-wrap{font-family:'Inter',sans-serif;padding:20px;background:#f8fafc;min-height:100vh}
.bq-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:20px}
.bq-stat-card{padding:20px;border-radius:14px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.bq-stat-icon{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bq-stat-value{font-size:24px;font-weight:800;color:#fff;line-height:1}
.bq-stat-label{font-size:12px;color:rgba(255,255,255,.9);margin-top:4px;font-weight:600}
.bq-filters{display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.bq-search{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;flex:1;min-width:220px}
.bq-search input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%;font-family:inherit}
.bq-date-input{padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:13px;color:#334155;outline:none;font-family:inherit}
.bq-btn-primary,.bq-btn-secondary{padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border:none;transition:all .2s}
.bq-btn-primary{background:#0ea5e9;color:#fff}
.bq-btn-primary:hover{background:#0284c7}
.bq-btn-primary:disabled{opacity:.6;cursor:not-allowed}
.bq-btn-secondary{background:#fff;color:#64748b;border:1px solid #e2e8f0}
.bq-btn-secondary:hover{background:#f8fafc}
.bq-btn-icon{background:none;border:none;cursor:pointer;color:#64748b;padding:6px;border-radius:6px;transition:all .2s;display:flex;align-items:center;justify-content:center}
.bq-btn-icon:hover{background:#f1f5f9;color:#334155}
.bq-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.bq-loading{padding:60px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;color:#94a3b8;font-size:14px}
.bq-empty{padding:60px 20px;text-align:center;color:#94a3b8}
.bq-empty-title{font-size:15px;font-weight:600;margin-top:12px;color:#64748b}
.bq-empty-sub{font-size:13px;margin-top:4px}
.bq-table{width:100%;border-collapse:collapse}
.bq-table thead{background:#f8fafc}
.bq-table th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:14px 16px;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.05em}
.bq-table td{padding:14px 16px;border-bottom:1px solid #f8fafc;font-size:13px;color:#475569}
.bq-table tbody tr:hover{background:#fafbfc}
.bq-patient{display:flex;align-items:center;gap:10px}
.bq-patient-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0}
.bq-patient-name{font-weight:700;color:#1e293b;font-size:13px}
.bq-patient-id{font-size:11px;color:#94a3b8;margin-top:2px}
.bq-doctor-name{font-weight:600;color:#334155;font-size:13px}
.bq-doctor-spec{font-size:11px;color:#94a3b8;margin-top:2px}
.bq-date{font-weight:600;color:#334155;font-size:13px}
.bq-time{font-size:11px;color:#94a3b8;margin-top:2px}
.bq-fee{font-weight:700;color:#1e293b}
.bq-total{font-weight:800;color:#0ea5e9;font-size:14px}
.bq-badge{font-size:11px;padding:4px 10px;border-radius:100px;font-weight:700;display:inline-block}
.bq-actions{display:flex;gap:6px;align-items:center}
.bq-action-btn{padding:6px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.bq-action-btn:disabled{opacity:.5;cursor:not-allowed}
.bq-action-view{background:#f0f9ff;color:#0369a1}
.bq-action-view:hover:not(:disabled){background:#e0f2fe;color:#075985}
.bq-action-edit{background:#fef3c7;color:#b45309}
.bq-action-edit:hover:not(:disabled){background:#fde68a;color:#92400e}
.bq-action-collect{background:#dcfce7;color:#166534}
.bq-action-collect:hover:not(:disabled){background:#bbf7d0;color:#14532d}
.bq-action-delete{background:#fee2e2;color:#dc2626}
.bq-action-delete:hover:not(:disabled){background:#fecaca;color:#b91c1c}
.bq-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(2px)}
.bq-modal{background:#fff;border-radius:16px;width:90%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:90vh;overflow:hidden;display:flex;flex-direction:column}
.bq-modal-large{max-width:900px}
.bq-modal-header{padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
.bq-modal-header h3{font-size:16px;font-weight:700;color:#1e293b;margin:0}
.bq-modal-header button{background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;border-radius:6px;transition:all .2s}
.bq-modal-header button:hover{background:#f1f5f9;color:#64748b}
.bq-modal-body{padding:24px;overflow-y:auto;flex:1}
.bq-modal-patient{display:flex;align-items:center;gap:10px;padding:14px;background:#f8fafc;border-radius:10px;margin-bottom:20px}
.bq-bill-summary{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin-bottom:20px}
.bq-bill-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#475569;margin-bottom:8px}
.bq-bill-row:last-child{margin-bottom:0}
.bq-bill-total{padding-top:12px;border-top:2px solid #bae6fd;margin-top:8px;font-size:15px;color:#1e293b}
.bq-form-group{margin-bottom:16px}
.bq-form-group:last-child{margin-bottom:0}
.bq-form-group label{display:block;font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
.bq-form-group input,.bq-form-group select,.bq-form-group textarea{width:100%;padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:13px;color:#334155;outline:none;font-family:inherit;transition:all .2s}
.bq-form-group input:focus,.bq-form-group select:focus,.bq-form-group textarea:focus{border-color:#0ea5e9;background:#fff}
.bq-modal-footer{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end}
.bill-container{padding:20px;background:#fff}
.bill-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}
.bill-logo{flex-shrink:0}
.bill-logo-placeholder{width:80px;height:80px;border-radius:12px;background:#f0f9ff;display:flex;align-items:center;justify-content:center}
.bill-hospital-info{text-align:right}
.bill-hospital-info h2{font-size:20px;font-weight:800;color:#1e293b;margin:0 0 8px 0}
.bill-info-row{display:flex;align-items:center;gap:6px;justify-content:flex-end;font-size:12px;color:#64748b;margin-top:4px}
.bill-divider{height:2px;background:linear-gradient(90deg,#0ea5e9,#0284c7);margin:20px 0}
.bill-info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
.bill-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.bill-value{font-size:14px;font-weight:600;color:#1e293b}
.bill-table{width:100%;border-collapse:collapse;margin:20px 0}
.bill-table thead{background:#f8fafc}
.bill-table th{padding:12px;text-align:left;font-size:12px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0}
.bill-table td{padding:12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
.bill-table .text-center{text-align:center}
.bill-table .text-right{text-align:right}
.bill-summary{background:#f8fafc;border-radius:10px;padding:16px;margin-top:24px}
.bill-summary-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#475569;margin-bottom:8px}
.bill-summary-row:last-child{margin-bottom:0}
.bill-total{padding-top:12px;border-top:2px solid #e2e8f0;margin-top:8px;font-size:16px;font-weight:700;color:#1e293b}
.text-success{color:#059669}
.bill-footer{margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center}
.bill-footer p{margin:0;font-size:13px;color:#64748b}
.bq-bill-items{margin-bottom:20px}
.bq-bill-items h4{font-size:14px;font-weight:700;color:#1e293b;margin:0 0 12px 0}
.bq-items-table{width:100%;border-collapse:collapse;font-size:12px}
.bq-items-table thead{background:#f8fafc}
.bq-items-table th{padding:8px;text-align:left;font-weight:600;color:#64748b;border-bottom:1px solid #e2e8f0}
.bq-items-table td{padding:8px;color:#334155;border-bottom:1px solid #f8fafc}
.bq-subtotal{text-align:right;font-size:13px;font-weight:700;color:#1e293b;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0}
.bq-gst-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.bq-calculated-total{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin-top:20px}
.bq-calc-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#475569;margin-bottom:8px}
.bq-calc-row:last-child{margin-bottom:0}
.bq-calc-total{padding-top:12px;border-top:2px solid #bae6fd;margin-top:8px;font-size:15px;font-weight:700;color:#1e293b}
`;
