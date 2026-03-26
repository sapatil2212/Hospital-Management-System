"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, X, Loader2, Package, DollarSign, Calendar, Clock, Pill, FlaskConical } from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

interface Service {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category: string;
  sessionCount: number;
  price: number;
  pricePerSession: number;
  duration?: number;
  validityDays?: number;
  requiresPharmacy: boolean;
  requiresLab: boolean;
  isActive: boolean;
  department?: { id: string; name: string };
  subDepartment?: { id: string; name: string };
  _count?: { treatmentPlans: number };
}

export default function ServicePanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState<any>({
    name: "",
    code: "",
    description: "",
    category: "PACKAGE",
    departmentId: "",
    subDepartmentId: "",
    sessionCount: 1,
    price: 0,
    pricePerSession: 0,
    duration: 30,
    validityDays: 180,
    requiresPharmacy: false,
    requiresLab: false,
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [servicesRes, deptsRes] = await Promise.all([
      api(`/api/config/services${search ? `?search=${search}` : ""}`),
      api("/api/config/departments?simple=true"),
    ]);
    if (servicesRes.success) setServices(servicesRes.data.services || []);
    if (deptsRes.success) setDepartments(deptsRes.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (form.departmentId) {
      api(`/api/config/subdepartments?departmentId=${form.departmentId}&limit=100`).then((d) => {
        if (d.success) setSubDepartments(d.data?.data || d.data || []);
      });
    } else {
      setSubDepartments([]);
    }
  }, [form.departmentId]);

  useEffect(() => {
    if (form.price && form.sessionCount) {
      setForm((p: any) => ({ ...p, pricePerSession: p.price / p.sessionCount }));
    }
  }, [form.price, form.sessionCount]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      name: "",
      code: "",
      description: "",
      category: "PACKAGE",
      departmentId: "",
      subDepartmentId: "",
      sessionCount: 1,
      price: 0,
      pricePerSession: 0,
      duration: 30,
      validityDays: 180,
      requiresPharmacy: false,
      requiresLab: false,
      isActive: true,
    });
    setMsg("");
    setModal(true);
  };

  const openEdit = (item: Service) => {
    setEditItem(item);
    setForm({
      name: item.name,
      code: item.code || "",
      description: item.description || "",
      category: item.category,
      departmentId: item.department?.id || "",
      subDepartmentId: item.subDepartment?.id || "",
      sessionCount: item.sessionCount,
      price: item.price,
      pricePerSession: item.pricePerSession,
      duration: item.duration || 30,
      validityDays: item.validityDays || 180,
      requiresPharmacy: item.requiresPharmacy,
      requiresLab: item.requiresLab,
      isActive: item.isActive,
    });
    setMsg("");
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    const method = editItem ? "PUT" : "POST";
    const url = editItem ? `/api/config/services/${editItem.id}` : "/api/config/services";
    const d = await api(url, method, form);

    if (d.success) {
      setModal(false);
      load();
    } else {
      setMsg(d.message || "Error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service/package?")) return;
    await api(`/api/config/services/${id}`, "DELETE");
    load();
  };

  return (
    <div>
      <style>{`
        .sp-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
        .sp-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
        .sp-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .sp-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(14,137,143,.25);transition:all .15s}
        .sp-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .sp-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .sp-tbl{width:100%;border-collapse:collapse}
        .sp-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .sp-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .sp-tbl tr:last-child td{border-bottom:none}
        .sp-tbl tbody tr:hover td{background:#fafbfc}
        .sp-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .sp-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .sp-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .sp-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .sp-badge.purple{background:#faf5ff;color:#9333ea;border:1px solid #e9d5ff}
        .sp-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .sp-edit{background:#E6F4F4;color:#0E898F}.sp-edit:hover{background:#B3E0E0}
        .sp-del{background:#fff5f5;color:#ef4444}.sp-del:hover{background:#fee2e2}
        .sp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .sp-modal{background:#fff;border-radius:18px;padding:24px;width:100%;max-width:600px;box-shadow:0 20px 60px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto}
        .sp-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .sp-modal-title{font-size:17px;font-weight:800;color:#1e293b}
        .sp-modal-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .sp-field{display:flex;flex-direction:column;gap:5px}
        .sp-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
        .sp-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
        .sp-input:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,.25)}
        .sp-checkbox{display:flex;align-items:center;gap:8px;padding:10px;background:#f8fafc;border-radius:9px;cursor:pointer}
        .sp-checkbox input{width:18px;height:18px;cursor:pointer}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sp-spin{animation:spin .7s linear infinite}
        .sp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .sp-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .sp-stat-row{display:flex;gap:8px;align-items:center;font-size:12px;color:#64748b}
        .sp-stat-row svg{width:14px;height:14px}
      `}</style>

      <div className="sp-toolbar">
        <div className="sp-search-wrap">
          <Search size={14} color="#94a3b8" />
          <input className="sp-search-input" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="sp-btn-primary" onClick={openAdd}>
          <Plus size={14} />
          Add Service/Package
        </button>
      </div>

      {loading ? (
        <div className="sp-loading">
          <Loader2 size={20} className="sp-spin" />
          Loading...
        </div>
      ) : services.length === 0 ? (
        <div className="sp-empty">No services found. Click "+ Add Service/Package" to create one.</div>
      ) : (
        <div className="sp-tbl-wrap">
          <table className="sp-tbl">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Sessions</th>
                <th>Price</th>
                <th>Per Session</th>
                <th>Department</th>
                <th>Requirements</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{item.name}</div>
                    {item.code && <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.code}</div>}
                  </td>
                  <td>
                    <span className="sp-badge purple">{item.category}</span>
                  </td>
                  <td>{item.sessionCount}</td>
                  <td style={{ fontWeight: 600 }}>₹{item.price.toLocaleString()}</td>
                  <td>₹{item.pricePerSession.toLocaleString()}</td>
                  <td>
                    <div style={{ fontSize: 12 }}>{item.department?.name || "—"}</div>
                    {item.subDepartment && <div style={{ fontSize: 10, color: "#94a3b8" }}>{item.subDepartment.name}</div>}
                  </td>
                  <td>
                    <div className="sp-stat-row">
                      {item.requiresPharmacy && <span title="Requires Pharmacy"><Pill size={14} color="#10b981" /></span>}
                      {item.requiresLab && <span title="Requires Lab"><FlaskConical size={14} color="#3b82f6" /></span>}
                      {!item.requiresPharmacy && !item.requiresLab && "—"}
                    </div>
                  </td>
                  <td>
                    <span className={`sp-badge ${item.isActive ? "green" : "red"}`}>{item.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="sp-icon-btn sp-edit" onClick={() => openEdit(item)}>
                        <Pencil size={13} />
                      </button>
                      <button className="sp-icon-btn sp-del" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="sp-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="sp-modal">
            <div className="sp-modal-head">
              <span className="sp-modal-title">{editItem ? "Edit" : "Add"} Service/Package</span>
              <button onClick={() => setModal(false)} className="sp-icon-btn">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="sp-modal-form">
              <div className="sp-field" style={{ gridColumn: "1/-1" }}>
                <label className="sp-lbl">Service/Package Name *</label>
                <input className="sp-input" placeholder="e.g., PRP Hair Treatment (6 Sessions)" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} required />
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Service Code</label>
                <input className="sp-input" placeholder="e.g., PRP-HAIR-6" value={form.code} onChange={(e) => setForm((p: any) => ({ ...p, code: e.target.value }))} />
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Category</label>
                <select className="sp-input" value={form.category} onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))}>
                  <option value="PACKAGE">Package</option>
                  <option value="COURSE">Course</option>
                  <option value="BUNDLE">Bundle</option>
                  <option value="SINGLE">Single Service</option>
                </select>
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Department</label>
                <select className="sp-input" value={form.departmentId} onChange={(e) => setForm((p: any) => ({ ...p, departmentId: e.target.value, subDepartmentId: "" }))}>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Sub-Department</label>
                <select className="sp-input" value={form.subDepartmentId} onChange={(e) => setForm((p: any) => ({ ...p, subDepartmentId: e.target.value }))} disabled={!form.departmentId}>
                  <option value="">Select Sub-Department</option>
                  {subDepartments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Number of Sessions *</label>
                <input className="sp-input" type="number" min="1" value={form.sessionCount} onChange={(e) => setForm((p: any) => ({ ...p, sessionCount: parseInt(e.target.value) }))} required />
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Total Package Price (₹) *</label>
                <input className="sp-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p: any) => ({ ...p, price: parseFloat(e.target.value) }))} required />
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Price Per Session (₹)</label>
                <input className="sp-input" type="number" value={form.pricePerSession.toFixed(2)} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Duration (minutes)</label>
                <input className="sp-input" type="number" min="0" value={form.duration} onChange={(e) => setForm((p: any) => ({ ...p, duration: parseInt(e.target.value) }))} />
              </div>

              <div className="sp-field">
                <label className="sp-lbl">Validity (days)</label>
                <input className="sp-input" type="number" min="0" value={form.validityDays} onChange={(e) => setForm((p: any) => ({ ...p, validityDays: parseInt(e.target.value) }))} />
              </div>

              <div className="sp-field" style={{ gridColumn: "1/-1" }}>
                <label className="sp-lbl">Description</label>
                <textarea className="sp-input" rows={3} placeholder="Service description..." value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="sp-field">
                <label className="sp-checkbox">
                  <input type="checkbox" checked={form.requiresPharmacy} onChange={(e) => setForm((p: any) => ({ ...p, requiresPharmacy: e.target.checked }))} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Requires Pharmacy</span>
                </label>
              </div>

              <div className="sp-field">
                <label className="sp-checkbox">
                  <input type="checkbox" checked={form.requiresLab} onChange={(e) => setForm((p: any) => ({ ...p, requiresLab: e.target.checked }))} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Requires Lab Tests</span>
                </label>
              </div>

              <div className="sp-field">
                <label className="sp-checkbox">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Active</span>
                </label>
              </div>

              {msg && (
                <div style={{ gridColumn: "1/-1", fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{msg}</div>
              )}

              <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="sp-btn-ghost" onClick={() => setModal(false)} style={{ padding: "10px 20px", borderRadius: "9px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className="sp-btn-primary" disabled={saving}>
                  {saving && <Loader2 size={14} className="sp-spin" />}
                  {editItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
