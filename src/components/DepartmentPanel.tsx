"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, X, Loader2, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Building2, DollarSign, MapPin, User,
  Settings2, ToggleLeft, ToggleRight, Filter
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  type: "OPD" | "IPD" | "DIAGNOSTIC" | "SUPPORT";
  isActive: boolean;
  consultationFee?: number | null;
  allowAppointments: boolean;
  isIPD: boolean;
  hodDoctorId?: string | null;
  hodDoctor?: { id: string; name: string; specialization?: string } | null;
  location?: string | null;
  billingCode?: string | null;
  _count?: { doctors: number; staff: number; subDepartments: number };
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  type: "OPD" | "IPD" | "DIAGNOSTIC" | "SUPPORT";
  consultationFee: string;
  allowAppointments: boolean;
  isIPD: boolean;
  hodDoctorId: string;
  location: string;
  billingCode: string;
  isActive: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const DEPT_TYPES = [
  { value: "OPD", label: "OPD", desc: "Outpatient Department" },
  { value: "IPD", label: "IPD", desc: "Inpatient Department" },
  { value: "DIAGNOSTIC", label: "Diagnostic", desc: "Diagnostic Services" },
  { value: "SUPPORT", label: "Support", desc: "Support Services" },
];

const TYPE_COLORS: Record<string, string> = {
  OPD: "blue",
  IPD: "purple",
  DIAGNOSTIC: "orange",
  SUPPORT: "gray",
};

const emptyForm: FormData = {
  name: "",
  code: "",
  description: "",
  type: "OPD",
  consultationFee: "",
  allowAppointments: true,
  isIPD: false,
  hodDoctorId: "",
  location: "",
  billingCode: "",
  isActive: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="dept-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`dept-toast dept-toast-${t.type}`}>
          {t.type === "success" && <Check size={16} />}
          {t.type === "error" && <AlertTriangle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="dept-toast-close">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  if (!open) return null;
  return (
    <div className="dept-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dept-modal dept-modal-${size}`}>
        <div className="dept-modal-head">
          <span className="dept-modal-title">{title}</span>
          <button onClick={onClose} className="dept-icon-btn">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="dept-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dept-modal dept-modal-sm">
        <div className="dept-confirm-icon">
          <AlertTriangle size={32} color="#ef4444" />
        </div>
        <h3 className="dept-confirm-title">{title}</h3>
        <p className="dept-confirm-msg">{message}</p>
        <div className="dept-confirm-actions">
          <button className="dept-btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="dept-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="dept-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`dept-toggle ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="dept-toggle-thumb" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DepartmentPanel() {
  // State
  const [data, setData] = useState<Department[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Doctors for HOD dropdown
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  // Load departments
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filterType) params.append("type", filterType);
    if (filterStatus) params.append("isActive", filterStatus);
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());

    const res = await api(`/api/config/departments?${params.toString()}`);
    if (res.success && res.data) {
      setData(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    }
    setLoading(false);
  }, [search, filterType, filterStatus, pagination.page, pagination.limit]);

  // Load doctors for dropdown
  const loadDoctors = async () => {
    const res = await api("/api/config/doctors?simple=true");
    if (res.success && res.data) {
      setDoctors(Array.isArray(res.data) ? res.data : res.data.data || []);
    }
  };

  useEffect(() => {
    load();
    loadDoctors();
  }, [load]);

  // Auto-generate code from name
  const generateCode = async (name: string) => {
    if (!name || name.length < 2) return;
    const res = await api(`/api/config/departments?action=generate-code&name=${encodeURIComponent(name)}`, "POST");
    if (res.success && res.data?.code) {
      setForm((f) => ({ ...f, code: res.data.code }));
    }
  };

  // Open add modal
  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setErrors({});
    setModal(true);
  };

  // Open edit modal
  const openEdit = (item: Department) => {
    setEditItem(item);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description || "",
      type: item.type,
      consultationFee: item.consultationFee?.toString() || "",
      allowAppointments: item.allowAppointments,
      isIPD: item.isIPD,
      hodDoctorId: item.hodDoctorId || "",
      location: item.location || "",
      billingCode: item.billingCode || "",
      isActive: item.isActive,
    });
    setErrors({});
    setModal(true);
  };

  // Validate form
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.code || form.code.length < 1) errs.code = "Code is required";
    if (form.code.length > 10) errs.code = "Code must be 10 characters or less";
    if (form.consultationFee && isNaN(parseFloat(form.consultationFee))) {
      errs.consultationFee = "Must be a valid number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload: any = {
      name: form.name,
      code: form.code.toUpperCase(),
      description: form.description || null,
      type: form.type,
      consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : null,
      allowAppointments: form.allowAppointments,
      isIPD: form.isIPD,
      hodDoctorId: form.hodDoctorId || null,
      location: form.location || null,
      billingCode: form.billingCode || null,
      isActive: form.isActive,
    };

    let res;
    if (editItem) {
      res = await api(`/api/config/departments/${editItem.id}`, "PUT", payload);
    } else {
      res = await api("/api/config/departments", "POST", payload);
    }

    setSaving(false);
    if (res.success) {
      addToast("success", editItem ? "Department updated successfully" : "Department created successfully");
      setModal(false);
      load();
    } else {
      addToast("error", res.message || "Operation failed");
      if (res.errors?.code === "DUPLICATE_CODE") {
        setErrors({ code: "This code already exists" });
      }
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (item: Department) => {
    const res = await api(`/api/config/departments/${item.id}`, "PATCH", { isActive: !item.isActive });
    if (res.success) {
      addToast("success", `Department ${!item.isActive ? "activated" : "deactivated"}`);
      load();
    } else {
      addToast("error", res.message || "Failed to update status");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    const res = await api(`/api/config/departments/${deleteItem.id}`, "DELETE");
    setDeleting(false);
    if (res.success) {
      addToast("success", "Department deleted successfully");
      setDeleteItem(null);
      load();
    } else {
      addToast("error", res.message || "Failed to delete department");
    }
  };

  // Page change
  const goToPage = (page: number) => {
    setPagination((p) => ({ ...p, page }));
  };

  return (
    <>
      <style>{`
        .dept-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
        .dept-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
        .dept-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .dept-search-input::placeholder{color:#94a3b8}
        .dept-toolbar-right{display:flex;align-items:center;gap:10px}
        .dept-filter-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:500;cursor:pointer}
        .dept-filter-btn:hover{border-color:#cbd5e1}
        .dept-filter-btn.active{background:#eff6ff;border-color:#3b82f6;color:#3b82f6}
        .dept-filters{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
        .dept-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;color:#334155;background:#fff;cursor:pointer}
        .dept-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.25);transition:all .15s;white-space:nowrap}
        .dept-btn-primary:hover{background:#2563eb;transform:translateY(-1px)}
        .dept-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .dept-btn-ghost{padding:10px 20px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer}
        .dept-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
        .dept-btn-danger{padding:10px 20px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
        .dept-btn-danger:hover{background:#dc2626}
        .dept-btn-danger:disabled{opacity:.55;cursor:not-allowed}
        .dept-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .dept-tbl{width:100%;border-collapse:collapse}
        .dept-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
        .dept-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .dept-tbl tr:last-child td{border-bottom:none}
        .dept-tbl tbody tr:hover td{background:#fafbfc}
        .dept-dept-name{font-weight:600;color:#1e293b}
        .dept-dept-code{font-family:monospace;font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#64748b}
        .dept-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .dept-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .dept-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .dept-badge.blue{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
        .dept-badge.purple{background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe}
        .dept-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
        .dept-badge.gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .dept-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .dept-edit{background:#eff6ff;color:#3b82f6}.dept-edit:hover{background:#dbeafe}
        .dept-del{background:#fff5f5;color:#ef4444}.dept-del:hover{background:#fee2e2}
        .dept-actions{display:flex;gap:6px;align-items:center}
        .dept-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .dept-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .dept-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-top:1px solid #f1f5f9}
        .dept-pagination-info{font-size:13px;color:#64748b}
        .dept-pagination-btns{display:flex;gap:6px}
        .dept-page-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .dept-page-btn:hover:not(:disabled){background:#f8fafc;border-color:#cbd5e1}
        .dept-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .dept-page-btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff}
        .dept-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .dept-modal{background:#fff;border-radius:18px;padding:0;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:90vh;overflow:hidden;display:flex;flex-direction:column}
        .dept-modal-lg{max-width:720px}
        .dept-modal-md{max-width:560px}
        .dept-modal-sm{max-width:400px;padding:24px;text-align:center}
        .dept-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc}
        .dept-modal-title{font-size:17px;font-weight:800;color:#1e293b}
        .dept-modal-body{padding:24px;overflow-y:auto;flex:1}
        .dept-modal-footer{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc}
        .dept-section{margin-bottom:24px}
        .dept-section:last-child{margin-bottom:0}
        .dept-section-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #f1f5f9}
        .dept-section-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center}
        .dept-section-icon.blue{background:#eff6ff;color:#3b82f6}
        .dept-section-icon.green{background:#f0fdf4;color:#16a34a}
        .dept-section-icon.purple{background:#f5f3ff;color:#7c3aed}
        .dept-section-icon.orange{background:#fff7ed;color:#ea580c}
        .dept-section-icon.gray{background:#f8fafc;color:#64748b}
        .dept-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .dept-form-grid.cols-3{grid-template-columns:1fr 1fr 1fr}
        .dept-field{display:flex;flex-direction:column;gap:5px}
        .dept-field.full{grid-column:1/-1}
        .dept-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
        .dept-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
        .dept-input:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.25)}
        .dept-input::placeholder{color:#94a3b8}
        .dept-input.error{border-color:#fca5a5}
        .dept-textarea{min-height:80px;resize:vertical}
        .dept-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;cursor:pointer}
        .dept-error{font-size:11px;color:#ef4444;margin-top:2px}
        .dept-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
        .dept-toggle-label{font-size:13px;color:#334155;font-weight:500}
        .dept-toggle-desc{font-size:11px;color:#94a3b8;margin-top:2px}
        .dept-toggle{width:44px;height:24px;border-radius:100px;background:#e2e8f0;border:none;cursor:pointer;position:relative;transition:background .2s}
        .dept-toggle.on{background:#3b82f6}
        .dept-toggle.disabled{opacity:.5;cursor:not-allowed}
        .dept-toggle-thumb{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
        .dept-toggle.on .dept-toggle-thumb{transform:translateX(20px)}
        .dept-confirm-icon{margin-bottom:16px}
        .dept-confirm-title{font-size:18px;font-weight:700;color:#1e293b;margin-bottom:8px}
        .dept-confirm-msg{font-size:14px;color:#64748b;margin-bottom:20px;line-height:1.5}
        .dept-confirm-actions{display:flex;gap:10px;justify-content:center}
        .dept-toast-container{position:fixed;top:20px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px}
        .dept-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:slideIn .3s ease}
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        .dept-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .dept-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .dept-toast-info{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
        .dept-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.7;padding:0}
        .dept-toast-close:hover{opacity:1}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dept-spin{animation:spin .7s linear infinite}
        .dept-fee{font-weight:600;color:#16a34a}
      `}</style>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Toolbar */}
      <div className="dept-toolbar">
        <div className="dept-search-wrap">
          <Search size={14} color="#94a3b8" />
          <input
            className="dept-search-input"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          />
          {search && (
            <button className="dept-icon-btn" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="dept-toolbar-right">
          <button
            className={`dept-filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            Filters
          </button>
          <button className="dept-btn-primary" onClick={openAdd}>
            <Plus size={14} />
            Add Department
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="dept-filters">
          <select
            className="dept-filter-select"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">All Types</option>
            {DEPT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="dept-filter-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(filterType || filterStatus) && (
            <button
              className="dept-btn-ghost"
              style={{ padding: "8px 12px" }}
              onClick={() => {
                setFilterType("");
                setFilterStatus("");
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="dept-loading">
          <Loader2 size={20} className="dept-spin" />
          Loading departments...
        </div>
      ) : data.length === 0 ? (
        <div className="dept-empty">
          No departments found. Click "+ Add Department" to create one.
        </div>
      ) : (
        <div className="dept-tbl-wrap">
          <table className="dept-tbl">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Type</th>
                <th>Status</th>
                <th>Consultation Fee</th>
                <th>Doctors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="dept-dept-name">{row.name}</div>
                    {row.description && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {row.description.slice(0, 50)}
                        {row.description.length > 50 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="dept-dept-code">{row.code}</span>
                  </td>
                  <td>
                    <span className={`dept-badge ${TYPE_COLORS[row.type]}`}>{row.type}</span>
                  </td>
                  <td>
                    <div className="dept-actions">
                      <span className={`dept-badge ${row.isActive ? "green" : "red"}`}>
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                      <Toggle checked={row.isActive} onChange={() => handleToggleStatus(row)} />
                    </div>
                  </td>
                  <td>
                    {row.consultationFee ? (
                      <span className="dept-fee">₹{row.consultationFee}</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>{row._count?.doctors || 0}</td>
                  <td>
                    <div className="dept-actions">
                      <button className="dept-icon-btn dept-edit" onClick={() => openEdit(row)}>
                        <Pencil size={13} />
                      </button>
                      <button className="dept-icon-btn dept-del" onClick={() => setDeleteItem(row)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="dept-pagination">
            <div className="dept-pagination-info">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="dept-pagination-btns">
              <button
                className="dept-page-btn"
                disabled={pagination.page === 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "0 4px" }}>...</span>}
                    <button
                      className={`dept-page-btn ${pagination.page === p ? "active" : ""}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                className="dept-page-btn"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSubmit}>
          <div className="dept-modal-body">
            {/* Section 1: Basic Info */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon blue">
                  <Building2 size={16} />
                </span>
                Basic Information
              </div>
              <div className="dept-form-grid">
                <div className="dept-field">
                  <label className="dept-lbl">Department Name *</label>
                  <input
                    className={`dept-input ${errors.name ? "error" : ""}`}
                    placeholder="e.g., General OPD"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    onBlur={() => !editItem && !form.code && generateCode(form.name)}
                  />
                  {errors.name && <span className="dept-error">{errors.name}</span>}
                </div>
                <div className="dept-field">
                  <label className="dept-lbl">Department Code *</label>
                  <input
                    className={`dept-input ${errors.code ? "error" : ""}`}
                    placeholder="e.g., GENOPD"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    maxLength={10}
                  />
                  {errors.code && <span className="dept-error">{errors.code}</span>}
                </div>
                <div className="dept-field full">
                  <label className="dept-lbl">Description</label>
                  <textarea
                    className="dept-input dept-textarea"
                    placeholder="Brief description of the department..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Type & Settings */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon purple">
                  <Settings2 size={16} />
                </span>
                Type & Settings
              </div>
              <div className="dept-form-grid">
                <div className="dept-field full">
                  <label className="dept-lbl">Department Type *</label>
                  <select
                    className="dept-select"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
                  >
                    {DEPT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} - {t.desc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dept-field full">
                  <div className="dept-toggle-row">
                    <div>
                      <div className="dept-toggle-label">Allow Appointments</div>
                      <div className="dept-toggle-desc">Enable patients to book appointments for this department</div>
                    </div>
                    <Toggle
                      checked={form.allowAppointments}
                      onChange={(v) => setForm((f) => ({ ...f, allowAppointments: v }))}
                    />
                  </div>
                </div>
                <div className="dept-field full">
                  <div className="dept-toggle-row">
                    <div>
                      <div className="dept-toggle-label">IPD Department</div>
                      <div className="dept-toggle-desc">This department handles inpatient admissions</div>
                    </div>
                    <Toggle checked={form.isIPD} onChange={(v) => setForm((f) => ({ ...f, isIPD: v }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Financial */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon green">
                  <DollarSign size={16} />
                </span>
                Financial Settings
              </div>
              <div className="dept-form-grid">
                <div className="dept-field">
                  <label className="dept-lbl">Default Consultation Fee (₹)</label>
                  <input
                    className={`dept-input ${errors.consultationFee ? "error" : ""}`}
                    type="number"
                    placeholder="e.g., 500"
                    value={form.consultationFee}
                    onChange={(e) => setForm((f) => ({ ...f, consultationFee: e.target.value }))}
                    min="0"
                    step="0.01"
                  />
                  {errors.consultationFee && <span className="dept-error">{errors.consultationFee}</span>}
                </div>
                <div className="dept-field">
                  <label className="dept-lbl">Billing Code</label>
                  <input
                    className="dept-input"
                    placeholder="e.g., DEPT-001"
                    value={form.billingCode}
                    onChange={(e) => setForm((f) => ({ ...f, billingCode: e.target.value }))}
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Management */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon orange">
                  <User size={16} />
                </span>
                Management
              </div>
              <div className="dept-form-grid">
                <div className="dept-field full">
                  <label className="dept-lbl">Head of Department (HOD)</label>
                  <select
                    className="dept-select"
                    value={form.hodDoctorId}
                    onChange={(e) => setForm((f) => ({ ...f, hodDoctorId: e.target.value }))}
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.specialization ? `(${d.specialization})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Advanced */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon gray">
                  <MapPin size={16} />
                </span>
                Advanced Settings
              </div>
              <div className="dept-form-grid">
                <div className="dept-field">
                  <label className="dept-lbl">Location</label>
                  <input
                    className="dept-input"
                    placeholder="e.g., Building A, Floor 2"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className="dept-field">
                  <div className="dept-toggle-row" style={{ height: "100%" }}>
                    <div>
                      <div className="dept-toggle-label">Active Status</div>
                      <div className="dept-toggle-desc">Department is visible and operational</div>
                    </div>
                    <Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dept-modal-footer">
            <button type="button" className="dept-btn-ghost" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button type="submit" className="dept-btn-primary" disabled={saving}>
              {saving && <Loader2 size={14} className="dept-spin" />}
              {editItem ? "Update Department" : "Create Department"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </>
  );
}
