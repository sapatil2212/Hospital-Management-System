"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Search, X, Loader2, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Mail, Key, Eye, EyeOff, User, Phone,
  Activity, FlaskConical, Layers, Filter, Heart, Microscope,
  Stethoscope, Scissors, Receipt, Pill, Scan, TestTube2,
  Smile, Sparkles, Wind, Building2, Copy, RefreshCw, ExternalLink,
  Lock, ShieldCheck, UserPlus, ChevronDown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HODResult {
  id: string;
  kind: "DOCTOR" | "STAFF";
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

interface SubDept {
  id: string;
  name: string;
  code?: string | null;
  type: string;
  description?: string | null;
  color?: string | null;
  flow?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  hodName?: string | null;
  hodEmail?: string | null;
  hodPhone?: string | null;
  loginEmail?: string | null;
  credentialsSent: boolean;
  isActive: boolean;
  procedures?: Procedure[];
  _count?: { procedures: number };
}

interface Procedure {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  fee?: number | null;
  duration?: number | null;
  sequence: number;
  isActive: boolean;
}

interface Department { id: string; name: string; }
interface Toast { id: number; type: "success" | "error" | "info"; message: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const SUB_DEPT_TYPES = [
  { value: "DENTAL",      label: "Dental Clinic",    Icon: Smile,       color: "#06b6d4" },
  { value: "DERMATOLOGY", label: "Dermatology",       Icon: Sparkles,    color: "#ec4899" },
  { value: "HAIR",        label: "Hair / Trichology", Icon: Scissors,    color: "#8b5cf6" },
  { value: "ONCOLOGY",    label: "Cancer / Oncology", Icon: Activity,    color: "#f97316" },
  { value: "CARDIOLOGY",  label: "Cardiology",        Icon: Heart,       color: "#ef4444" },
  { value: "PATHOLOGY",   label: "Pathology Lab",     Icon: Microscope,  color: "#10b981" },
  { value: "PHARMACY",    label: "Pharmacy Store",    Icon: Pill,        color: "#3b82f6" },
  { value: "BILLING",     label: "Billing Dept",      Icon: Receipt,     color: "#f59e0b" },
  { value: "RADIOLOGY",   label: "Radiology",         Icon: Scan,        color: "#6366f1" },
  { value: "LABORATORY",  label: "Laboratory",        Icon: TestTube2,   color: "#14b8a6" },
  { value: "PROCEDURE",   label: "Procedure Room",    Icon: Stethoscope, color: "#84cc16" },
  { value: "OTHER",       label: "Other",             Icon: Layers,      color: "#94a3b8" },
];

const PROCEDURE_TYPES = [
  { value: "DIAGNOSTIC", label: "Diagnostic" },
  { value: "TREATMENT", label: "Treatment" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "SURGERY", label: "Surgery" },
  { value: "THERAPY", label: "Therapy" },
  { value: "MEDICATION", label: "Medication" },
  { value: "OTHER", label: "Other" },
];

const PROC_TYPE_COLORS: Record<string, string> = {
  DIAGNOSTIC: "blue", TREATMENT: "green", CONSULTATION: "purple",
  SURGERY: "red", THERAPY: "orange", MEDICATION: "teal", OTHER: "gray",
};

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const getTypeInfo = (type: string) => SUB_DEPT_TYPES.find(t => t.value === type) || { label: type, icon: "📋", color: "#94a3b8" };

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="sd-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`sd-toast sd-toast-${t.type}`}>
          {t.type === "success" && <Check size={15} />}
          {t.type === "error" && <AlertTriangle size={15} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="sd-icon-btn"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Procedure Row ────────────────────────────────────────────────────────────

function ProcedureRow({ proc, onEdit, onDelete }: { proc: Procedure; onEdit: (p: Procedure) => void; onDelete: (p: Procedure) => void }) {
  const color = PROC_TYPE_COLORS[proc.type] || "gray";
  return (
    <div className="sd-proc-row">
      <div className="sd-proc-info">
        <div className="sd-proc-name">{proc.name}</div>
        {proc.description && <div className="sd-proc-desc">{proc.description}</div>}
      </div>
      <div className="sd-proc-meta">
        <span className={`sd-badge ${color}`}>{proc.type}</span>
        {proc.fee != null && <span className="sd-proc-fee">₹{proc.fee}</span>}
        {proc.duration && <span className="sd-proc-dur">{proc.duration}m</span>}
        <span className={`sd-badge ${proc.isActive ? "green" : "red"}`}>{proc.isActive ? "Active" : "Off"}</span>
      </div>
      <div className="sd-proc-actions">
        <button className="sd-icon-btn sd-edit" onClick={() => onEdit(proc)}><Pencil size={12} /></button>
        <button className="sd-icon-btn sd-del" onClick={() => onDelete(proc)}><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function SubDepartmentPanel() {
  const [data, setData] = useState<SubDept[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Main modal
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<SubDept | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", code: "", type: "DENTAL", description: "", color: "", flow: "",
    departmentId: "", hodName: "", hodEmail: "", hodPhone: "", loginEmail: "", isActive: true,
  });

  // Procedures modal (view/manage procedures for a sub-dept)
  const [procModal, setProcModal] = useState(false);
  const [selectedSubDept, setSelectedSubDept] = useState<SubDept | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [procLoading, setProcLoading] = useState(false);
  const [procForm, setProcForm] = useState<any>({ name: "", type: "OTHER", description: "", fee: "", duration: "", sequence: 0, isActive: true });
  const [editProc, setEditProc] = useState<Procedure | null>(null);
  const [procFormOpen, setProcFormOpen] = useState(false);
  const [savingProc, setSavingProc] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SubDept | null>(null);
  const [deletingProc, setDeletingProc] = useState<Procedure | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Credentials
  const [sendingCreds, setSendingCreds] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  // Load
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filterType) params.append("type", filterType);
    if (filterStatus) params.append("isActive", filterStatus);
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    const res = await api(`/api/config/subdepartments?${params}`);
    if (res.success && res.data) {
      setData(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [search, filterType, filterStatus, pagination.page, pagination.limit]);

  const loadDepartments = async () => {
    const res = await api("/api/config/departments?limit=100");
    if (res.success) setDepartments(res.data?.data || []);
  };

  const loadProcedures = useCallback(async (subDeptId: string) => {
    setProcLoading(true);
    const res = await api(`/api/config/procedures?subDepartmentId=${subDeptId}`);
    if (res.success) setProcedures(res.data || []);
    setProcLoading(false);
  }, []);

  useEffect(() => { load(); loadDepartments(); }, [load]);

  // Open add/edit modal
  const openAdd = () => {
    setEditItem(null);
    const defaultType = "DENTAL";
    const typeInfo = getTypeInfo(defaultType);
    setForm({ name: "", code: "", type: defaultType, description: "", color: typeInfo.color, flow: "", departmentId: "", hodName: "", hodEmail: "", hodPhone: "", loginEmail: "", isActive: true });
    setModal(true);
  };

  const openEdit = (item: SubDept) => {
    setEditItem(item);
    setForm({
      name: item.name,
      code: item.code || "",
      type: item.type,
      description: item.description || "",
      color: item.color || "",
      flow: item.flow || "",
      departmentId: item.departmentId || "",
      hodName: item.hodName || "",
      hodEmail: item.hodEmail || "",
      hodPhone: item.hodPhone || "",
      loginEmail: item.loginEmail || "",
      isActive: item.isActive,
    });
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      consultationFee: undefined,
      color: form.color || undefined,
      flow: form.flow || undefined,
      departmentId: form.departmentId || null,
      hodName: form.hodName || null,
      hodEmail: form.hodEmail || null,
      hodPhone: form.hodPhone || null,
      loginEmail: form.loginEmail || null,
    };
    let res;
    if (editItem) res = await api(`/api/config/subdepartments/${editItem.id}`, "PUT", payload);
    else res = await api("/api/config/subdepartments", "POST", payload);
    setSaving(false);
    if (res.success) {
      addToast("success", editItem ? "Sub-department updated" : "Sub-department created (procedures auto-seeded)");
      setModal(false);
      load();
    } else addToast("error", res.message || "Operation failed");
  };

  const handleToggleStatus = async (item: SubDept) => {
    const res = await api(`/api/config/subdepartments/${item.id}`, "PATCH", { isActive: !item.isActive });
    if (res.success) { addToast("success", `Status updated`); load(); }
    else addToast("error", res.message || "Failed");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api(`/api/config/subdepartments/${deleteTarget.id}`, "DELETE");
    setDeleting(false);
    if (res.success) { addToast("success", "Deleted successfully"); setDeleteTarget(null); load(); }
    else addToast("error", res.message || "Failed to delete");
  };

  const sendCredentials = async (item: SubDept) => {
    if (!item.loginEmail) return addToast("error", "Set a login email first");
    const isResend = item.credentialsSent;
    setSendingCreds(item.id);
    const res = await api(`/api/config/subdepartments/${item.id}/send-credentials${isResend ? "?resend=true" : ""}`, "POST");
    setSendingCreds(null);
    if (res.success) { addToast("success", isResend ? "Credentials resent!" : "Credentials sent!"); load(); }
    else addToast("error", res.message || "Failed to send");
  };

  // Procedures management
  const openProcModal = (item: SubDept) => {
    setSelectedSubDept(item);
    loadProcedures(item.id);
    setProcFormOpen(false);
    setEditProc(null);
    setProcModal(true);
  };

  const openAddProc = () => {
    setEditProc(null);
    setProcForm({ name: "", type: "OTHER", description: "", fee: "", duration: "", sequence: procedures.length, isActive: true });
    setProcFormOpen(true);
  };

  const openEditProc = (p: Procedure) => {
    setEditProc(p);
    setProcForm({ name: p.name, type: p.type, description: p.description || "", fee: p.fee?.toString() || "", duration: p.duration?.toString() || "", sequence: p.sequence, isActive: p.isActive });
    setProcFormOpen(true);
  };

  const handleProcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubDept) return;
    setSavingProc(true);
    const payload = {
      ...procForm,
      subDepartmentId: selectedSubDept.id,
      fee: procForm.fee ? parseFloat(procForm.fee) : null,
      duration: procForm.duration ? parseInt(procForm.duration) : null,
      sequence: parseInt(procForm.sequence) || 0,
    };
    let res;
    if (editProc) res = await api(`/api/config/procedures/${editProc.id}`, "PUT", payload);
    else res = await api("/api/config/procedures", "POST", payload);
    setSavingProc(false);
    if (res.success) {
      addToast("success", editProc ? "Procedure updated" : "Procedure added");
      setProcFormOpen(false);
      setEditProc(null);
      loadProcedures(selectedSubDept.id);
      load();
    } else addToast("error", res.message || "Failed");
  };

  const handleDeleteProc = async (p: Procedure) => {
    if (!selectedSubDept) return;
    setDeleting(true);
    const res = await api(`/api/config/procedures/${p.id}`, "DELETE");
    setDeleting(false);
    if (res.success) { addToast("success", "Procedure removed"); setDeletingProc(null); loadProcedures(selectedSubDept.id); load(); }
    else addToast("error", res.message || "Failed");
  };

  return (
    <>
      <style>{`
        .sd-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
        .sd-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;min-width:260px}
        .sd-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .sd-search-input::placeholder{color:#94a3b8}
        .sd-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .sd-filter-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:500;cursor:pointer}
        .sd-filter-btn.active{background:#eff6ff;border-color:#3b82f6;color:#3b82f6}
        .sd-filters{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
        .sd-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:12px;color:#334155;background:#fff;cursor:pointer}
        .sd-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.25);transition:all .15s;white-space:nowrap}
        .sd-btn-primary:hover{background:#2563eb;transform:translateY(-1px)}
        .sd-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .sd-btn-ghost{padding:9px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer}
        .sd-btn-ghost:hover{background:#f8fafc}
        .sd-btn-danger{padding:9px 18px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
        .sd-btn-danger:hover{background:#dc2626}
        .sd-btn-sm{padding:6px 12px;border-radius:8px;border:none;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;white-space:nowrap}
        .sd-btn-creds{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}.sd-btn-creds:hover{background:#dcfce7}
        .sd-btn-resend{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}.sd-btn-resend:hover{background:#ffedd5}
        .sd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
        .sd-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;transition:box-shadow .2s}
        .sd-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
        .sd-card-head{padding:16px;display:flex;align-items:flex-start;gap:12px;border-bottom:1px solid #f1f5f9}
        .sd-card-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .sd-card-info{flex:1;min-width:0}
        .sd-card-name{font-size:15px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sd-card-type{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}
        .sd-card-body{padding:14px 16px;display:flex;flex-direction:column;gap:8px}
        .sd-card-row{display:flex;align-items:center;gap:8px;font-size:12px;color:#64748b}
        .sd-card-row svg{flex-shrink:0}
        .sd-card-flow{font-size:11px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;line-height:1.4;font-style:italic}
        .sd-card-foot{padding:12px 16px;border-top:1px solid #f8fafc;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
        .sd-card-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .sd-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .sd-edit{background:#eff6ff;color:#3b82f6}.sd-edit:hover{background:#dbeafe}
        .sd-del{background:#fff5f5;color:#ef4444}.sd-del:hover{background:#fee2e2}
        .sd-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700}
        .sd-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .sd-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .sd-badge.blue{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
        .sd-badge.purple{background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe}
        .sd-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
        .sd-badge.teal{background:#f0fdfa;color:#0d9488;border:1px solid #99f6e4}
        .sd-badge.gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .sd-proc-count{font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:4px;cursor:pointer}
        .sd-proc-count:hover{color:#3b82f6}
        .sd-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .sd-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .sd-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 0;margin-top:12px}
        .sd-pagination-info{font-size:12px;color:#64748b}
        .sd-pagination-btns{display:flex;gap:5px}
        .sd-page-btn{width:30px;height:30px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .sd-page-btn:hover:not(:disabled){background:#f8fafc}
        .sd-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .sd-page-btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff}
        .sd-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .sd-modal{background:#fff;border-radius:18px;width:100%;max-width:640px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:92vh;overflow:hidden;display:flex;flex-direction:column}
        .sd-modal-lg{max-width:720px}
        .sd-modal-sm{max-width:420px;padding:28px;text-align:center}
        .sd-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0}
        .sd-modal-title{font-size:16px;font-weight:800;color:#1e293b}
        .sd-modal-body{padding:22px 24px;overflow-y:auto;flex:1}
        .sd-modal-foot{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc;flex-shrink:0}
        .sd-section{margin-bottom:22px}
        .sd-section:last-child{margin-bottom:0}
        .sd-section-title{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:6px}
        .sd-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .sd-field{display:flex;flex-direction:column;gap:4px}
        .sd-field.full{grid-column:1/-1}
        .sd-lbl{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b}
        .sd-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:9px 12px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
        .sd-input:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.2)}
        .sd-input::placeholder{color:#94a3b8}
        .sd-textarea{min-height:72px;resize:vertical}
        .sd-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:9px 12px;font-size:13px;color:#1e293b;outline:none;width:100%;cursor:pointer}
        .sd-select:focus{border-color:#93c5fd}
        .sd-type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .sd-type-card{padding:10px 8px;border-radius:10px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;text-align:center;transition:all .15s;font-size:11px;font-weight:600;color:#64748b}
        .sd-type-card.selected{border-color:var(--type-color);background:var(--type-bg);color:var(--type-color)}
        .sd-type-card:hover:not(.selected){border-color:#cbd5e1;background:#f1f5f9}
        .sd-type-icon{font-size:18px;margin-bottom:4px}
        .sd-toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:10px 13px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
        .sd-toggle{width:40px;height:22px;border-radius:100px;background:#e2e8f0;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
        .sd-toggle.on{background:#3b82f6}
        .sd-toggle-thumb{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
        .sd-toggle.on .sd-toggle-thumb{transform:translateX(18px)}
        .sd-confirm-icon{margin-bottom:14px}
        .sd-confirm-title{font-size:17px;font-weight:700;color:#1e293b;margin-bottom:6px}
        .sd-confirm-msg{font-size:13px;color:#64748b;margin-bottom:18px;line-height:1.5}
        .sd-confirm-actions{display:flex;gap:10px;justify-content:center}
        .sd-toast-container{position:fixed;top:20px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px}
        .sd-toast{display:flex;align-items:center;gap:9px;padding:11px 15px;border-radius:10px;font-size:12px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:sdSlide .3s ease}
        @keyframes sdSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        .sd-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .sd-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .sd-toast-info{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sd-spin{animation:spin .7s linear infinite}
        .sd-proc-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:6px}
        .sd-proc-row:last-child{margin-bottom:0}
        .sd-proc-info{flex:1;min-width:0}
        .sd-proc-name{font-size:13px;font-weight:600;color:#1e293b}
        .sd-proc-desc{font-size:11px;color:#94a3b8;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sd-proc-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex-shrink:0}
        .sd-proc-fee{font-size:11px;font-weight:700;color:#16a34a}
        .sd-proc-dur{font-size:11px;color:#94a3b8}
        .sd-proc-actions{display:flex;gap:4px;flex-shrink:0}
        .sd-proc-form{background:#fff;border:1.5px solid #3b82f6;border-radius:12px;padding:16px;margin-bottom:12px}
        .sd-flow-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600}
        .sd-creds-sent{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
      `}</style>

      <ToastContainer toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Toolbar */}
      <div className="sd-toolbar">
        <div className="sd-search-wrap">
          <Search size={14} color="#94a3b8" />
          <input className="sd-search-input" placeholder="Search sub-departments..." value={search}
            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} />
          {search && <button className="sd-icon-btn" onClick={() => setSearch("")}><X size={13} /></button>}
        </div>
        <div className="sd-toolbar-right">
          <button className={`sd-filter-btn ${showFilters ? "active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={13} />Filters
          </button>
          <button className="sd-btn-primary" onClick={openAdd}><Plus size={14} />Add Sub-Department</button>
        </div>
      </div>

      {showFilters && (
        <div className="sd-filters">
          <select className="sd-filter-select" value={filterType} onChange={e => { setFilterType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Types</option>
            {SUB_DEPT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
          <select className="sd-filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(filterType || filterStatus) && (
            <button className="sd-btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => { setFilterType(""); setFilterStatus(""); }}>Clear</button>
          )}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="sd-loading"><Loader2 size={20} className="sd-spin" />Loading sub-departments...</div>
      ) : data.length === 0 ? (
        <div className="sd-empty">No sub-departments found. Click "+ Add Sub-Department" to create one.</div>
      ) : (
        <>
          <div className="sd-grid">
            {data.map(item => {
              const typeInfo = getTypeInfo(item.type);
              const hexColor = item.color || typeInfo.color;
              const alpha = hexColor + "20";
              return (
                <div key={item.id} className="sd-card">
                  <div className="sd-card-head">
                    <div className="sd-card-icon" style={{ background: alpha }}>
                      <span>{typeInfo.icon}</span>
                    </div>
                    <div className="sd-card-info">
                      <div className="sd-card-name" title={item.name}>{item.name}</div>
                      <div className="sd-card-type">{typeInfo.label}{item.department ? ` · ${item.department.name}` : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <span className={`sd-badge ${item.isActive ? "green" : "red"}`}>{item.isActive ? "Active" : "Off"}</span>
                      <button className="sd-icon-btn sd-edit" onClick={() => openEdit(item)}><Pencil size={12} /></button>
                      <button className="sd-icon-btn sd-del" onClick={() => setDeleteTarget(item)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="sd-card-body">
                    {item.description && <div style={{ fontSize: 12, color: "#64748b" }}>{item.description.slice(0, 80)}{item.description.length > 80 ? "..." : ""}</div>}
                    {item.hodName && (
                      <div className="sd-card-row"><User size={12} /><span><strong>HOD:</strong> {item.hodName}{item.hodPhone ? ` · ${item.hodPhone}` : ""}</span></div>
                    )}
                    {item.loginEmail && (
                      <div className="sd-card-row"><Mail size={12} /><span style={{ fontSize: 11 }}>{item.loginEmail}</span></div>
                    )}
                    {item.flow && <div className="sd-card-flow">→ {item.flow}</div>}
                  </div>
                  <div className="sd-card-foot">
                    <div className="sd-card-actions">
                      <button className="sd-proc-count" onClick={() => openProcModal(item)}>
                        <Layers size={12} />{item._count?.procedures || item.procedures?.length || 0} Procedures
                      </button>
                    </div>
                    <div className="sd-card-actions">
                      {item.credentialsSent && <span className="sd-creds-sent"><Check size={10} />Sent</span>}
                      {item.loginEmail && (
                        <button
                          className={`sd-btn-sm ${item.credentialsSent ? "sd-btn-resend" : "sd-btn-creds"}`}
                          onClick={() => sendCredentials(item)}
                          disabled={sendingCreds === item.id}
                        >
                          {sendingCreds === item.id ? <Loader2 size={11} className="sd-spin" /> : <Key size={11} />}
                          {item.credentialsSent ? "Resend" : "Send Creds"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="sd-pagination">
              <div className="sd-pagination-info">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</div>
              <div className="sd-pagination-btns">
                <button className="sd-page-btn" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}><ChevronLeft size={14} /></button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "#94a3b8" }}>...</span>}
                      <button className={`sd-page-btn ${pagination.page === p ? "active" : ""}`} onClick={() => setPagination(prev => ({ ...prev, page: p }))}>{p}</button>
                    </span>
                  ))}
                <button className="sd-page-btn" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="sd-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="sd-modal sd-modal-lg">
            <div className="sd-modal-head">
              <span className="sd-modal-title">{editItem ? "Edit Sub-Department" : "Add Sub-Department"}</span>
              <button className="sd-icon-btn" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minHeight: 0 }}>
              <div className="sd-modal-body">
                {/* Type Selection */}
                <div className="sd-section">
                  <div className="sd-section-title"><Layers size={14} />Department Type</div>
                  <div className="sd-type-grid">
                    {SUB_DEPT_TYPES.map(t => {
                      const sel = form.type === t.value;
                      const bg = t.color + "18";
                      return (
                        <div key={t.value} className={`sd-type-card ${sel ? "selected" : ""}`}
                          style={sel ? { "--type-color": t.color, "--type-bg": bg } as any : {}}
                          onClick={() => setForm((f: any) => ({ ...f, type: t.value, color: t.color }))}>
                          <div className="sd-type-icon">{t.icon}</div>
                          <div>{t.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="sd-section">
                  <div className="sd-section-title"><FlaskConical size={14} />Basic Info</div>
                  <div className="sd-form-grid">
                    <div className="sd-field">
                      <label className="sd-lbl">Name *</label>
                      <input className="sd-input" placeholder="e.g., Dental Clinic" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="sd-field">
                      <label className="sd-lbl">Short Code</label>
                      <input className="sd-input" placeholder="e.g., DEN" value={form.code} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={10} />
                    </div>
                    <div className="sd-field full">
                      <label className="sd-lbl">Description</label>
                      <textarea className="sd-input sd-textarea" placeholder="Brief description..." value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="sd-field">
                      <label className="sd-lbl">Parent Department</label>
                      <select className="sd-select" value={form.departmentId} onChange={e => setForm((f: any) => ({ ...f, departmentId: e.target.value }))}>
                        <option value="">None / Independent</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="sd-field">
                      <label className="sd-lbl">Accent Color</label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="color" value={form.color || "#3b82f6"} onChange={e => setForm((f: any) => ({ ...f, color: e.target.value }))} style={{ width: 38, height: 36, border: "1.5px solid #e2e8f0", borderRadius: 9, cursor: "pointer", padding: 2 }} />
                        <input className="sd-input" value={form.color} onChange={e => setForm((f: any) => ({ ...f, color: e.target.value }))} placeholder="#3b82f6" style={{ flex: 1 }} />
                      </div>
                    </div>
                    <div className="sd-field full">
                      <label className="sd-lbl">Patient Flow</label>
                      <input className="sd-input" placeholder="e.g., OPD → Procedure → Billing → Follow-up" value={form.flow} onChange={e => setForm((f: any) => ({ ...f, flow: e.target.value }))} />
                    </div>
                    <div className="sd-field full">
                      <div className="sd-toggle-wrap">
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Active</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Accept patients and appointments</div></div>
                        <button type="button" className={`sd-toggle ${form.isActive ? "on" : ""}`} onClick={() => setForm((f: any) => ({ ...f, isActive: !f.isActive }))}><span className="sd-toggle-thumb" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HOD */}
                <div className="sd-section">
                  <div className="sd-section-title"><User size={14} />Head of Department (HOD)</div>
                  <div className="sd-form-grid">
                    <div className="sd-field">
                      <label className="sd-lbl">HOD Name</label>
                      <input className="sd-input" placeholder="Full name" value={form.hodName} onChange={e => setForm((f: any) => ({ ...f, hodName: e.target.value }))} />
                    </div>
                    <div className="sd-field">
                      <label className="sd-lbl">HOD Phone</label>
                      <input className="sd-input" placeholder="+91 99999 99999" value={form.hodPhone} onChange={e => setForm((f: any) => ({ ...f, hodPhone: e.target.value }))} />
                    </div>
                    <div className="sd-field full">
                      <label className="sd-lbl">HOD Email</label>
                      <input className="sd-input" type="email" placeholder="hod@hospital.com" value={form.hodEmail} onChange={e => setForm((f: any) => ({ ...f, hodEmail: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Login Credentials */}
                <div className="sd-section">
                  <div className="sd-section-title"><Key size={14} />Dashboard Login</div>
                  <div className="sd-field">
                    <label className="sd-lbl">Portal Login Email</label>
                    <input className="sd-input" type="email" placeholder="dental.clinic@hospital.com" value={form.loginEmail} onChange={e => setForm((f: any) => ({ ...f, loginEmail: e.target.value }))} />
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Used to create a dedicated login account for this sub-department</div>
                  </div>
                </div>
              </div>
              <div className="sd-modal-foot">
                <button type="button" className="sd-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="sd-btn-primary" disabled={saving}>
                  {saving && <Loader2 size={14} className="sd-spin" />}{editItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Procedures Modal */}
      {procModal && selectedSubDept && (
        <div className="sd-overlay" onClick={e => e.target === e.currentTarget && setProcModal(false)}>
          <div className="sd-modal sd-modal-lg">
            <div className="sd-modal-head">
              <div>
                <div className="sd-modal-title">{getTypeInfo(selectedSubDept.type).icon} {selectedSubDept.name} — Procedures</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{selectedSubDept.flow || "Manage post-OPD procedures"}</div>
              </div>
              <button className="sd-icon-btn" onClick={() => setProcModal(false)}><X size={16} /></button>
            </div>
            <div className="sd-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{procedures.length} procedure{procedures.length !== 1 ? "s" : ""}</div>
                <button className="sd-btn-primary" onClick={openAddProc}><Plus size={13} />Add Procedure</button>
              </div>

              {procFormOpen && (
                <div className="sd-proc-form">
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 12 }}>{editProc ? "Edit Procedure" : "New Procedure"}</div>
                  <form onSubmit={handleProcSubmit}>
                    <div className="sd-form-grid">
                      <div className="sd-field full">
                        <label className="sd-lbl">Procedure Name *</label>
                        <input className="sd-input" placeholder="e.g., Root Canal Treatment" value={procForm.name} onChange={e => setProcForm((f: any) => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Type</label>
                        <select className="sd-select" value={procForm.type} onChange={e => setProcForm((f: any) => ({ ...f, type: e.target.value }))}>
                          {PROCEDURE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Fee (₹)</label>
                        <input className="sd-input" type="number" min="0" placeholder="0" value={procForm.fee} onChange={e => setProcForm((f: any) => ({ ...f, fee: e.target.value }))} />
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Duration (min)</label>
                        <input className="sd-input" type="number" min="1" placeholder="30" value={procForm.duration} onChange={e => setProcForm((f: any) => ({ ...f, duration: e.target.value }))} />
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Sequence</label>
                        <input className="sd-input" type="number" min="0" value={procForm.sequence} onChange={e => setProcForm((f: any) => ({ ...f, sequence: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div className="sd-field full">
                        <label className="sd-lbl">Description</label>
                        <input className="sd-input" placeholder="Brief description..." value={procForm.description} onChange={e => setProcForm((f: any) => ({ ...f, description: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                      <button type="button" className="sd-btn-ghost" onClick={() => { setProcFormOpen(false); setEditProc(null); }}>Cancel</button>
                      <button type="submit" className="sd-btn-primary" disabled={savingProc}>
                        {savingProc && <Loader2 size={13} className="sd-spin" />}{editProc ? "Update" : "Add"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {procLoading ? (
                <div className="sd-loading"><Loader2 size={18} className="sd-spin" />Loading...</div>
              ) : procedures.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 13 }}>No procedures yet. Click "+ Add Procedure" to add one.</div>
              ) : (
                <div>
                  {procedures.map(p => (
                    deletingProc?.id === p.id ? (
                      <div key={p.id} className="sd-proc-row" style={{ background: "#fff5f5", borderColor: "#fecaca" }}>
                        <div style={{ flex: 1, fontSize: 13, color: "#ef4444" }}>Delete "{p.name}"?</div>
                        <button className="sd-btn-sm sd-btn-danger" style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 10px", fontSize: 11 }} onClick={() => handleDeleteProc(p)} disabled={deleting}>
                          {deleting ? <Loader2 size={11} className="sd-spin" /> : null}Confirm
                        </button>
                        <button className="sd-btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setDeletingProc(null)}>Cancel</button>
                      </div>
                    ) : (
                      <ProcedureRow key={p.id} proc={p} onEdit={openEditProc} onDelete={proc => setDeletingProc(proc)} />
                    )
                  ))}
                </div>
              )}
            </div>
            <div className="sd-modal-foot">
              <button className="sd-btn-ghost" onClick={() => setProcModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="sd-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="sd-modal sd-modal-sm">
            <div className="sd-confirm-icon"><AlertTriangle size={32} color="#ef4444" /></div>
            <div className="sd-confirm-title">Delete Sub-Department?</div>
            <div className="sd-confirm-msg">This will permanently delete <strong>{deleteTarget.name}</strong> and all its procedures. This action cannot be undone.</div>
            <div className="sd-confirm-actions">
              <button className="sd-btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="sd-btn-danger" onClick={handleDelete} disabled={deleting}>{deleting && <Loader2 size={14} className="sd-spin" />}Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
