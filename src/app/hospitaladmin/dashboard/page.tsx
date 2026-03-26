"use client";
import { useEffect, useState, Suspense, Fragment, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Activity, ChevronRight,
  Plus, Pencil, Trash2, Filter, Bed, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, Stethoscope, ClipboardList, BarChart2, X, CalendarCheck, RefreshCw, Loader2,
  IndianRupee, Package, CreditCard, Info, MapPin, ShieldCheck, FileText, Upload,
  User, ChevronDown, Camera, Save, Mail, CheckCircle, AlertCircle, Key, Shield, Eye
} from "lucide-react";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import BillingModule from "@/components/BillingModule";
import IPDPanel from "@/components/IPDPanel";
import ReportsPanel from "@/components/ReportsPanel";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

/* ── Mock Data ── */
const mockStaff = [
  { id: "1", name: "Dr. Priya Sharma", role: "DOCTOR", dept: "Cardiology", status: "active", patients: 24 },
  { id: "2", name: "Dr. Rajan Mehta", role: "DOCTOR", dept: "Neurology", status: "active", patients: 18 },
  { id: "3", name: "Neha Patil", role: "RECEPTIONIST", dept: "Front Desk", status: "active", patients: 0 },
  { id: "4", name: "Amit Kumar", role: "STAFF", dept: "Radiology", status: "inactive", patients: 0 },
  { id: "5", name: "Dr. Sunita Rao", role: "DOCTOR", dept: "Pediatrics", status: "active", patients: 31 },
];
const mockPatients = [
  { id: "P001", name: "Rajesh Verma", age: 54, blood: "O+", dept: "Cardiology", date: "20/03/26", gender: "Male", status: "OPD" },
  { id: "P002", name: "Meena Joshi", age: 38, blood: "A+", dept: "Neurology", date: "20/03/26", gender: "Female", status: "IPD" },
  { id: "P003", name: "Suresh Das", age: 8, blood: "B-", dept: "Pediatrics", date: "20/03/26", gender: "Male", status: "OPD" },
  { id: "P004", name: "Kavita Singh", age: 45, blood: "AB+", dept: "Cardiology", date: "19/03/26", gender: "Female", status: "OPD" },
  { id: "P005", name: "Ankit Tiwari", age: 29, blood: "O-", dept: "Neurology", date: "18/03/26", gender: "Male", status: "Discharged" },
];
const mockAppointments = [
  { id: "A001", patient: "Rajesh Verma", doctor: "Dr. Priya Sharma", dept: "Cardiology", time: "09:00 AM", status: "confirmed" },
  { id: "A002", patient: "Meena Joshi", doctor: "Dr. Rajan Mehta", dept: "Neurology", time: "09:30 AM", status: "waiting" },
  { id: "A003", patient: "Suresh Das", doctor: "Dr. Sunita Rao", dept: "Pediatrics", time: "10:00 AM", status: "in-progress" },
  { id: "A004", patient: "Kavita Singh", doctor: "Dr. Priya Sharma", dept: "Cardiology", time: "11:00 AM", status: "confirmed" },
  { id: "A005", patient: "Ankit Tiwari", doctor: "Dr. Rajan Mehta", dept: "Neurology", time: "11:30 AM", status: "cancelled" },
];
const barData = [
  { month: "Jan", val: 220 }, { month: "Feb", val: 180 }, { month: "Mar", val: 340 }, { month: "Apr", val: 160 },
  { month: "May", val: 200 }, { month: "Jun", val: 290 }, { month: "Jul", val: 310 }, { month: "Aug", val: 270 }, { month: "Sep", val: 250 },
];
const reports = [
  { icon: <Stethoscope size={14} />, msg: "Ventilator unit requires inspection in ICU", time: "5 minutes ago", highlight: true },
  { icon: <Settings size={14} />, msg: "Breakdown in elevator on 2nd floor", time: "18 minutes ago", highlight: false },
  { icon: <AlertTriangle size={14} />, msg: "Damage reported at the main entrance door", time: "2 hours ago", highlight: false },
];
const doctorAppts = [
  { name: "Cardiology", doctor: "Dr. Priya Sharma", time: "09:00 – 12:00", active: false },
  { name: "Pediatrics", doctor: "Dr. Sunita Rao", time: "10:00 – 13:00", active: true },
  { name: "Neurology", doctor: "Dr. Rajan Mehta", time: "11:00 – 14:00", active: false },
  { name: "Radiology", doctor: "Amit Kumar", time: "02:00 – 05:00", active: false },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_H = ["M", "T", "W", "T", "F", "S", "S"];

function MiniCalendar() {
  const today = new Date();
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const firstDay = new Date(cur.y, cur.m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const isToday = (d: number | null) => d === today.getDate() && cur.m === today.getMonth() && cur.y === today.getFullYear();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{MONTHS[cur.m]} {cur.y}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {["‹", "›"].map((a, i) => (
            <button key={i} onClick={() => setCur(c => { const nm = c.m + (i ? 1 : -1); return nm < 0 ? { y: c.y - 1, m: 11 } : nm > 11 ? { y: c.y + 1, m: 0 } : { ...c, m: nm }; })}
              style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: i ? "#0E898F" : "#e2e8f0", color: i ? "#fff" : "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {DAYS_H.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 12, fontWeight: isToday(d) ? 700 : 400, padding: "5px 0", borderRadius: 8, cursor: d ? "pointer" : "default", background: isToday(d) ? "#0E898F" : "transparent", color: isToday(d) ? "#fff" : d ? "#334155" : "transparent", transition: "background .15s" }}>
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inventory Management Panel ───
function InventoryPanel() {
  const router = useRouter();
  const [view, setView] = useState<"dashboard" | "items" | "purchase" | "suppliers" | "movements">("dashboard");
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ lowStock: [], expiringSoon: [] });
  const [loading, setLoading] = useState(true);

  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);

  const [itemModalMode, setItemModalMode] = useState<null | "view" | "edit">(null);
  const [itemModalLoading, setItemModalLoading] = useState(false);
  const [itemModalData, setItemModalData] = useState<any>(null);
  const [itemEditForm, setItemEditForm] = useState<any>({
    name: "",
    category: "Medicine",
    unit: "pcs",
    minStock: 0,
    purchasePrice: 0,
    mrp: 0,
    gst: 0,
    isActive: true,
  });

  const [supplierModalMode, setSupplierModalMode] = useState<null | "view" | "edit">(null);
  const [supplierModalLoading, setSupplierModalLoading] = useState(false);
  const [supplierModalData, setSupplierModalData] = useState<any>(null);
  const [supplierEditForm, setSupplierEditForm] = useState<any>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
  });

  const [purchaseModalMode, setPurchaseModalMode] = useState<null | "view" | "edit">(null);
  const [purchaseModalLoading, setPurchaseModalLoading] = useState(false);
  const [purchaseModalData, setPurchaseModalData] = useState<any>(null);
  const [purchaseEditForm, setPurchaseEditForm] = useState<any>({ purchaseNo: "", notes: "" });

  const [movementModalData, setMovementModalData] = useState<any>(null);

  const [deleteTarget, setDeleteTarget] = useState<null | { kind: "item" | "supplier" | "purchase"; id: string; label: string }>(null);

  const loadDashboard = async () => {
    setLoading(true);
    const [a, i] = await Promise.all([
      api("/api/inventory/alerts"),
      api("/api/config/inventory?limit=5")
    ]);
    if (a.success) setAlerts(a.data);
    if (i.success) setItems(i.data.data);
    setLoading(false);
  };

  const loadItems = async () => {
    setLoading(true);
    const d = await api("/api/config/inventory?limit=50");
    if (d.success) setItems(d.data.data);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    setLoading(true);
    const d = await api("/api/inventory/supplier");
    if (d.success) setSuppliers(d.data);
    setLoading(false);
  };

  const loadPurchases = async () => {
    setLoading(true);
    const d = await api("/api/inventory/purchase");
    if (d.success) setPurchases(d.data);
    setLoading(false);
  };

  const loadMovements = async () => {
    setLoading(true);
    const d = await api("/api/inventory/movement");
    if (d.success) setMovements(d.data);
    setLoading(false);
  };

  const openItemModal = async (id: string, mode: "view" | "edit") => {
    setItemModalMode(mode);
    setItemModalLoading(true);
    setItemModalData(null);
    const d = await api(`/api/config/inventory?id=${id}`);
    if (d.success) {
      setItemModalData(d.data);
      setItemEditForm({
        name: d.data.name || "",
        category: d.data.category || "Medicine",
        unit: d.data.unit || "pcs",
        minStock: d.data.minStock ?? 0,
        purchasePrice: d.data.purchasePrice ?? 0,
        mrp: d.data.mrp ?? 0,
        gst: d.data.gst ?? 0,
        isActive: d.data.isActive ?? true,
      });
    } else {
      alert(d.message || "Failed to load item");
      setItemModalMode(null);
    }
    setItemModalLoading(false);
  };

  const saveItem = async () => {
    if (!itemModalData?.id) return;
    const payload = {
      id: itemModalData.id,
      name: itemEditForm.name,
      category: itemEditForm.category,
      unit: itemEditForm.unit,
      minStock: parseInt(String(itemEditForm.minStock || 0), 10) || 0,
      purchasePrice: parseFloat(String(itemEditForm.purchasePrice || 0)) || 0,
      mrp: parseFloat(String(itemEditForm.mrp || 0)) || 0,
      gst: parseFloat(String(itemEditForm.gst || 0)) || 0,
      isActive: !!itemEditForm.isActive,
    };
    const d = await api("/api/config/inventory", "PUT", payload);
    if (d.success) {
      setItemModalMode(null);
      await loadItems();
      if (view === "dashboard") await loadDashboard();
    } else {
      alert(d.message || "Failed to update item");
    }
  };

  const openSupplierModal = async (id: string, mode: "view" | "edit") => {
    setSupplierModalMode(mode);
    setSupplierModalLoading(true);
    setSupplierModalData(null);
    const d = await api(`/api/inventory/supplier?id=${id}`);
    if (d.success) {
      setSupplierModalData(d.data);
      setSupplierEditForm({
        name: d.data.name || "",
        contactPerson: d.data.contactPerson || "",
        phone: d.data.phone || "",
        email: d.data.email || "",
        address: d.data.address || d.data.address1 || "",
        gstNumber: d.data.gstNumber || "",
      });
    } else {
      alert(d.message || "Failed to load supplier");
      setSupplierModalMode(null);
    }
    setSupplierModalLoading(false);
  };

  const saveSupplier = async () => {
    if (!supplierModalData?.id) return;
    const payload = {
      id: supplierModalData.id,
      name: supplierEditForm.name,
      contactPerson: supplierEditForm.contactPerson || undefined,
      phone: supplierEditForm.phone || undefined,
      email: supplierEditForm.email || undefined,
      address: supplierEditForm.address || undefined,
      gstNumber: supplierEditForm.gstNumber || undefined,
    };
    const d = await api("/api/inventory/supplier", "PUT", payload);
    if (d.success) {
      setSupplierModalMode(null);
      await loadSuppliers();
    } else {
      alert(d.message || "Failed to update supplier");
    }
  };

  const openPurchaseModal = async (id: string, mode: "view" | "edit") => {
    setPurchaseModalMode(mode);
    setPurchaseModalLoading(true);
    setPurchaseModalData(null);
    const d = await api(`/api/inventory/purchase?id=${id}`);
    if (d.success) {
      setPurchaseModalData(d.data);
      setPurchaseEditForm({ purchaseNo: d.data.purchaseNo || "", notes: d.data.notes || "" });
    } else {
      alert(d.message || "Failed to load purchase");
      setPurchaseModalMode(null);
    }
    setPurchaseModalLoading(false);
  };

  const savePurchase = async () => {
    if (!purchaseModalData?.id) return;
    const payload = { id: purchaseModalData.id, purchaseNo: purchaseEditForm.purchaseNo, notes: purchaseEditForm.notes || undefined };
    const d = await api("/api/inventory/purchase", "PUT", payload);
    if (d.success) {
      setPurchaseModalMode(null);
      await loadPurchases();
    } else {
      alert(d.message || "Failed to update purchase");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, id } = deleteTarget;
    if (kind === "item") {
      const d = await api(`/api/config/inventory?id=${id}`, "DELETE");
      if (!d.success) alert(d.message || "Failed to delete item");
      await loadItems();
      if (view === "dashboard") await loadDashboard();
    }
    if (kind === "supplier") {
      const d = await api(`/api/inventory/supplier?id=${id}`, "DELETE");
      if (!d.success) alert(d.message || "Failed to delete supplier");
      await loadSuppliers();
    }
    if (kind === "purchase") {
      const d = await api(`/api/inventory/purchase?id=${id}`, "DELETE");
      if (!d.success) alert(d.message || "Failed to delete purchase");
      await loadPurchases();
    }
    setDeleteTarget(null);
  };

  useEffect(() => {
    if (view === "dashboard") loadDashboard();
    else if (view === "items") loadItems();
    else if (view === "suppliers") loadSuppliers();
    else if (view === "purchase") { loadPurchases(); loadSuppliers(); loadItems(); }
    else if (view === "movements") loadMovements();
  }, [view]);

  return (
    <div className="inventory-panel">
      <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto", paddingBottom: 5 }}>
        {[
          { id: "dashboard", label: "Overview", icon: <BarChart2 size={14} /> },
          { id: "items", label: "Stock Items", icon: <ClipboardList size={14} /> },
          { id: "purchase", label: "Purchases", icon: <Plus size={14} /> },
          { id: "suppliers", label: "Suppliers", icon: <Users size={14} /> },
          { id: "movements", label: "Movements", icon: <RefreshCw size={14} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id as any)}
            className={`hd-filter-btn ${view === t.id ? "on" : ""}`}
            style={{ background: view === t.id ? "#0E898F" : "#fff", color: view === t.id ? "#fff" : "#64748b", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: 10, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {view === "dashboard" && (
        <>
          <div className="hd-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="hd-sc" style={{ background: "#fff" }}>
              <div className="hd-sc-icon" style={{ background: "#fee2e2" }}><AlertTriangle size={20} color="#ef4444" /></div>
              <div>
                <div className="hd-sc-lbl">Low Stock Alerts</div>
                <div className="hd-sc-val" style={{ color: "#ef4444" }}>{alerts.lowStock.length}</div>
                <div className="hd-sc-sub">Items below minimum level</div>
              </div>
            </div>
            <div className="hd-sc" style={{ background: "#fff" }}>
              <div className="hd-sc-icon" style={{ background: "#fef3c7" }}><Clock size={20} color="#f59e0b" /></div>
              <div>
                <div className="hd-sc-lbl">Expiring Soon</div>
                <div className="hd-sc-val" style={{ color: "#f59e0b" }}>{alerts.expiringSoon.length}</div>
                <div className="hd-sc-sub">Batches expiring in 30 days</div>
              </div>
            </div>
            <div className="hd-sc" style={{ background: "#fff" }}>
              <div className="hd-sc-icon" style={{ background: "#dcfce7" }}><CheckCircle2 size={20} color="#10b981" /></div>
              <div>
                <div className="hd-sc-lbl">Total Items</div>
                <div className="hd-sc-val">{items.length}</div>
                <div className="hd-sc-sub">Unique SKU categories</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="hd-card">
              <div className="hd-card-head">
                <div className="hd-card-title">Critical Low Stock</div>
              </div>
              <div className="hd-card-body" style={{ padding: 0 }}>
                {alerts.lowStock.length === 0 ? (
                  <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>All stock levels are healthy</div>
                ) : (
                  <table className="hd-tbl">
                    <thead>
                      <tr><th>Item</th><th>Category</th><th>Stock</th><th>Min</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {alerts.lowStock.map((a: any) => (
                        <tr key={a.id}>
                          <td className="hd-td-name">{a.name}</td>
                          <td><span className="hd-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>{a.category}</span></td>
                          <td style={{ color: "#ef4444", fontWeight: 700 }}>{a.totalStock} {a.unit}</td>
                          <td>{a.minStock}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button type="button" className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => openItemModal(a.id, "view")} title="View">
                                <Eye size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="hd-card">
              <div className="hd-card-head">
                <div className="hd-card-title">Expiring Batches</div>
              </div>
              <div className="hd-card-body" style={{ padding: 0 }}>
                {alerts.expiringSoon.length === 0 ? (
                  <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No items expiring soon</div>
                ) : (
                  <table className="hd-tbl">
                    <thead>
                      <tr><th>Item</th><th>Batch</th><th>Qty</th><th>Expiry</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {alerts.expiringSoon.map((a: any) => (
                        <tr key={a.id}>
                          <td className="hd-td-name">{a.item.name}</td>
                          <td style={{ fontSize: 11, fontFamily: "monospace" }}>{a.batchNumber}</td>
                          <td>{a.remainingQty}</td>
                          <td style={{ color: "#f59e0b", fontWeight: 600 }}>{new Date(a.expiryDate).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button type="button" className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => openItemModal(a.itemId, "view")} title="View Item">
                                <Eye size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {view === "items" && (
        <div className="hd-card">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Inventory Items</div>
              <div className="hd-card-sub">Manage medicines, consumables and equipment</div>
            </div>
            <button className="hd-btn-primary" onClick={() => router.push("/hospitaladmin/inventory/add")}><Plus size={16} /> Add New Item</button>
          </div>
          <div className="hd-tbl-wrap">
            <table className="hd-tbl">
              <thead>
                <tr><th>SKU</th><th>Item Name</th><th>Category</th><th>Current Stock</th><th>Min Stock</th><th>Unit</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id}>
                    <td style={{ fontSize: 11, color: "#94a3b8" }}>{i.sku || "—"}</td>
                    <td className="hd-td-name">{i.name}</td>
                    <td><span className="hd-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>{i.category}</span></td>
                    <td style={{ fontWeight: 700, color: i.totalStock <= i.minStock ? "#ef4444" : "#1e293b" }}>{i.totalStock}</td>
                    <td>{i.minStock}</td>
                    <td style={{ fontSize: 12 }}>{i.unit}</td>
                    <td><span className={`hd-badge ${i.isActive ? "on" : ""}`} style={{ background: i.isActive ? "#dcfce7" : "#fee2e2", color: i.isActive ? "#166534" : "#991b1b" }}>{i.isActive ? "Active" : "Inactive"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button type="button" className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => openItemModal(i.id, "view")} title="View">
                          <Eye size={12} />
                        </button>
                        <button type="button" className="hd-card-icon-btn" onClick={() => openItemModal(i.id, "edit")} title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button type="button" className="hd-card-icon-btn" style={{ color: "#ef4444" }} onClick={() => setDeleteTarget({ kind: "item", id: i.id, label: i.name })} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "purchase" && (
        <div className="hd-card">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Purchase Orders</div>
              <div className="hd-card-sub">Stock inward history and purchase records</div>
            </div>
            <button
              className="hd-btn-primary"
              onClick={() => { if (suppliers.length === 0) loadSuppliers(); if (items.length === 0) loadItems(); setShowAddPurchase(true); }}
            >
              <Plus size={16} /> New Purchase Entry
            </button>
          </div>
          <div className="hd-tbl-wrap">
            <table className="hd-tbl">
              <thead>
                <tr><th>PO Number</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.purchaseNo}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="hd-td-name">{p.supplier.name}</td>
                    <td>{p._count.items} items</td>
                    <td style={{ fontWeight: 700 }}>₹{p.totalAmount.toLocaleString()}</td>
                    <td><span className="hd-badge on" style={{ background: "#dcfce7", color: "#166534" }}>{p.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button type="button" className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => openPurchaseModal(p.id, "view")} title="View">
                          <Eye size={12} />
                        </button>
                        <button type="button" className="hd-card-icon-btn" onClick={() => openPurchaseModal(p.id, "edit")} title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button type="button" className="hd-card-icon-btn" style={{ color: "#ef4444" }} onClick={() => setDeleteTarget({ kind: "purchase", id: p.id, label: p.purchaseNo })} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "suppliers" && (
        <div className="hd-card">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Suppliers</div>
              <div className="hd-card-sub">Manage inventory vendors and contact details</div>
            </div>
            <button className="hd-btn-primary" onClick={() => setShowAddSupplier(true)}><Plus size={16} /> Add Supplier</button>
          </div>
          <div className="hd-tbl-wrap">
            <table className="hd-tbl">
              <thead>
                <tr><th>Supplier Name</th><th>Contact Person</th><th>Phone</th><th>Email</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td className="hd-td-name">{s.name}</td>
                    <td>{s.contactPerson || "—"}</td>
                    <td>{s.phone || "—"}</td>
                    <td>{s.email || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button type="button" className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => openSupplierModal(s.id, "view")} title="View">
                          <Eye size={12} />
                        </button>
                        <button type="button" className="hd-card-icon-btn" onClick={() => openSupplierModal(s.id, "edit")} title="Edit">
                          <Pencil size={12} />
                        </button>
                        <button type="button" className="hd-card-icon-btn" style={{ color: "#ef4444" }} onClick={() => setDeleteTarget({ kind: "supplier", id: s.id, label: s.name })} title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "movements" && (
        <div className="hd-card">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Stock Movements</div>
              <div className="hd-card-sub">Real-time tracking of IN / OUT stock logs</div>
            </div>
          </div>
          <div className="hd-tbl-wrap">
            <table className="hd-tbl">
              <thead>
                <tr><th>Time</th><th>Item</th><th>Type</th><th>Qty</th><th>Source</th><th>Batch</th><th>User</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="hd-td-name">{m.item.name}</td>
                    <td><span className={`hd-badge ${m.type === "IN" ? "on" : ""}`} style={{ background: m.type === "IN" ? "#dcfce7" : "#fee2e2", color: m.type === "IN" ? "#166534" : "#991b1b" }}>{m.type}</span></td>
                    <td style={{ fontWeight: 700 }}>{m.type === "IN" ? "+" : "-"}{m.quantity}</td>
                    <td style={{ fontSize: 12 }}>{m.source}</td>
                    <td style={{ fontSize: 11, fontFamily: "monospace" }}>{m.batch?.batchNumber || "—"}</td>
                    <td style={{ fontSize: 12 }}>{m.performedBy || "System"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button type="button" className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => setMovementModalData(m)} title="View">
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddSupplier && <AddSupplierModal onClose={() => setShowAddSupplier(false)} onSuccess={() => { setShowAddSupplier(false); loadSuppliers(); }} />}
      {showAddPurchase && <AddPurchaseModal items={items} suppliers={suppliers} onClose={() => setShowAddPurchase(false)} onSuccess={() => { setShowAddPurchase(false); loadPurchases(); }} />}
    </div>
  );
}

function AddSupplierModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    name: "",
    code: `SUP-${Date.now().toString().slice(-4)}`,
    contactPerson: "",
    designation: "",
    phone: "",
    altPhone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    gstNumber: "",
    panNumber: "",
    drugLicense: "",
    fssaiLicense: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    paymentTerms: "Immediate",
    creditLimit: 0,
    openingBalance: 0,
    preferredPaymentMode: "Bank Transfer",
    categoriesSupplied: [] as string[],
    brandAssociations: "",
    deliveryLeadTime: 0,
    status: "Active",
    isPreferred: false,
    isBlacklisted: false,
    notes: "",
    specialInstructions: "",
    documents: {
      gstCert: "",
      drugLicenseCopy: "",
      agreement: ""
    } as any
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<any>({});

  const handleDocUpload = async (key: string, file: File) => {
    setUploading((prev: any) => ({ ...prev, [key]: true }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "supplier_doc");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({
          ...prev,
          documents: { ...prev.documents, [key]: data.data.url }
        }));
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setUploading((prev: any) => ({ ...prev, [key]: false }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const d = await api("/api/inventory/supplier", "POST", form);
    if (d.success) onSuccess();
    else alert(d.message || "Failed to save supplier");
    setSaving(false);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <Info size={14} /> },
    { id: "address", label: "Address", icon: <MapPin size={14} /> },
    { id: "tax", label: "Tax & Compliance", icon: <ShieldCheck size={14} /> },
    { id: "payment", label: "Payment Details", icon: <IndianRupee size={14} /> },
    { id: "supply", label: "Supply & Status", icon: <Package size={14} /> },
    { id: "docs", label: "Documents", icon: <FileText size={14} /> },
  ];

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div>
            <div className="hd-modal-title" style={{ fontSize: 18, color: "#0f172a" }}>Register New Supplier</div>
            <div className="hd-modal-sub" style={{ marginBottom: 0 }}>Onboard a new vendor to the hospital inventory system</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "0 12px" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "14px 16px",
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === t.id ? "#0E898F" : "#64748b",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: `2px solid ${activeTab === t.id ? "#0E898F" : "transparent"}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all .2s"
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
          {activeTab === "basic" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="hd-mf" style={{ gridColumn: "span 2" }}>
                <label className="hd-ml">Supplier / Company Name *</label>
                <input className="hd-mi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g., MediLife Solutions Pvt Ltd" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Supplier Code</label>
                <input className="hd-mi" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SUP-1023" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Contact Person *</label>
                <input className="hd-mi" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} required placeholder="Name of primary contact" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Designation</label>
                <input className="hd-mi" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="e.g., Sales Manager" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Phone Number *</label>
                <input className="hd-mi" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="Primary contact number" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Alternate Phone</label>
                <input className="hd-mi" value={form.altPhone} onChange={e => setForm({ ...form, altPhone: e.target.value })} placeholder="Secondary contact number" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Email Address</label>
                <input className="hd-mi" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="vendor@example.com" />
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="hd-mf" style={{ gridColumn: "span 2" }}>
                <label className="hd-ml">Address Line 1 *</label>
                <input className="hd-mi" value={form.address1} onChange={e => setForm({ ...form, address1: e.target.value })} required placeholder="Building, Street name" />
              </div>
              <div className="hd-mf" style={{ gridColumn: "span 2" }}>
                <label className="hd-ml">Address Line 2</label>
                <input className="hd-mi" value={form.address2} onChange={e => setForm({ ...form, address2: e.target.value })} placeholder="Area, Landmark" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">City *</label>
                <input className="hd-mi" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">State *</label>
                <input className="hd-mi" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} required />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Pincode *</label>
                <input className="hd-mi" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} required />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Country</label>
                <input className="hd-mi" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
          )}

          {activeTab === "tax" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="hd-mf">
                <label className="hd-ml">GST Number</label>
                <input className="hd-mi" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} placeholder="27AAAAA0000A1Z5" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">PAN Number</label>
                <input className="hd-mi" value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Drug License Number</label>
                <input className="hd-mi" value={form.drugLicense} onChange={e => setForm({ ...form, drugLicense: e.target.value })} placeholder="Required for medicines" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">FSSAI License</label>
                <input className="hd-mi" value={form.fssaiLicense} onChange={e => setForm({ ...form, fssaiLicense: e.target.value })} placeholder="For food/lab items" />
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase" }}>Banking Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div className="hd-mf">
                  <label className="hd-ml">Bank Name</label>
                  <input className="hd-mi" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
                </div>
                <div className="hd-mf">
                  <label className="hd-ml">Account Number</label>
                  <input className="hd-mi" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
                </div>
                <div className="hd-mf">
                  <label className="hd-ml">IFSC Code</label>
                  <input className="hd-mi" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
                </div>
                <div className="hd-mf">
                  <label className="hd-ml">UPI ID</label>
                  <input className="hd-mi" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })} placeholder="merchant@upi" />
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase" }}>Purchase Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="hd-mf">
                  <label className="hd-ml">Default Payment Terms</label>
                  <select className="hd-mi" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })}>
                    <option value="Immediate">Immediate</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                </div>
                <div className="hd-mf">
                  <label className="hd-ml">Preferred Payment Mode</label>
                  <select className="hd-mi" value={form.preferredPaymentMode} onChange={e => setForm({ ...form, preferredPaymentMode: e.target.value })}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="hd-mf">
                  <label className="hd-ml">Credit Limit (₹)</label>
                  <input type="number" className="hd-mi" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="hd-mf">
                  <label className="hd-ml">Opening Balance (₹)</label>
                  <input type="number" className="hd-mi" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </>
          )}

          {activeTab === "supply" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="hd-mf" style={{ gridColumn: "span 2" }}>
                <label className="hd-ml">Product Categories Supplied</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                  {["Medicines", "Surgical", "Consumables", "Equipment"].map(cat => (
                    <label key={cat} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", background: form.categoriesSupplied.includes(cat) ? "#E6F4F4" : "#f8fafc", padding: "6px 12px", borderRadius: 8, border: `1px solid ${form.categoriesSupplied.includes(cat) ? "#0E898F" : "#e2e8f0"}`, transition: "all .2s" }}>
                      <input
                        type="checkbox"
                        checked={form.categoriesSupplied.includes(cat)}
                        onChange={e => {
                          const n = e.target.checked ? [...form.categoriesSupplied, cat] : form.categoriesSupplied.filter(x => x !== cat);
                          setForm({ ...form, categoriesSupplied: n });
                        }}
                        style={{ display: "none" }}
                      />
                      {form.categoriesSupplied.includes(cat) && <CheckCircle2 size={12} color="#0E898F" />}
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
              <div className="hd-mf" style={{ gridColumn: "span 2" }}>
                <label className="hd-ml">Brand Associations</label>
                <input className="hd-mi" value={form.brandAssociations} onChange={e => setForm({ ...form, brandAssociations: e.target.value })} placeholder="e.g., Cipla, Sun Pharma, Dr. Reddy's" />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Delivery Lead Time (Days)</label>
                <input type="number" className="hd-mi" value={form.deliveryLeadTime} onChange={e => setForm({ ...form, deliveryLeadTime: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Supplier Status</label>
                <select className="hd-mi" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ gridColumn: "span 2", display: "flex", gap: 24, marginTop: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isPreferred} onChange={e => setForm({ ...form, isPreferred: e.target.checked })} />
                  Preferred Vendor
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", color: form.isBlacklisted ? "#ef4444" : "inherit" }}>
                  <input type="checkbox" checked={form.isBlacklisted} onChange={e => setForm({ ...form, isBlacklisted: e.target.checked })} />
                  Blacklist Supplier
                </label>
              </div>
              <div className="hd-mf" style={{ gridColumn: "span 2", marginTop: 10 }}>
                <label className="hd-ml">Internal Notes & Instructions</label>
                <textarea
                  className="hd-mi"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Special instructions or internal remarks..."
                  style={{ resize: "none" }}
                />
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { label: "GST Certificate", key: "gstCert" },
                { label: "Drug License Copy", key: "drugLicenseCopy" },
                { label: "Agreement / Contract", key: "agreement" }
              ].map(doc => (
                <div key={doc.key}>
                  <label className="hd-ml" style={{ marginBottom: 8, fontSize: '9px' }}>{doc.label}</label>
                  <div
                    className="hd-upload-box"
                    style={{
                      padding: "16px 12px",
                      height: "120px",
                      borderStyle: "dashed",
                      background: form.documents[doc.key] ? "#f0fdf4" : uploading[doc.key] ? "#f8fafc" : "#fff",
                      borderColor: form.documents[doc.key] ? "#22c55e" : uploading[doc.key] ? "#0E898F" : "#e2e8f0",
                      position: "relative",
                      transition: "all .2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onClick={() => !uploading[doc.key] && document.getElementById(`file-${doc.key}`)?.click()}
                  >
                    <input
                      type="file"
                      id={`file-${doc.key}`}
                      style={{ display: "none" }}
                      onChange={e => e.target.files?.[0] && handleDocUpload(doc.key, e.target.files[0])}
                      accept=".pdf,image/*"
                    />

                    {uploading[doc.key] ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span className="hd-spin" style={{ borderTopColor: "#0E898F", width: 16, height: 16 }} />
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#0E898F" }}>Uploading...</div>
                      </div>
                    ) : form.documents[doc.key] ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
                        <div style={{ width: 32, height: 32, background: "#dcfce7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>Uploaded</div>
                          <a
                            href={form.documents[doc.key]}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 9, fontWeight: 700, color: "#0E898F", textDecoration: "underline", display: "block", marginTop: 2 }}
                          >
                            View File
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div className="hd-upload-icon" style={{ width: 32, height: 32, margin: 0, background: "#f1f5f9" }}><Upload size={14} /></div>
                        <div style={{ textAlign: "center" }}>
                          <div className="hd-upload-text" style={{ fontSize: 11, fontWeight: 700 }}>Click to upload</div>
                          <div className="hd-upload-sub" style={{ fontSize: 9 }}>PDF, JPG, PNG</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="hd-ma" style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", marginTop: 0 }}>
          <button type="button" className="hd-mcancel" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            onClick={submit}
            className="hd-msubmit"
            disabled={saving || !form.name || !form.contactPerson || !form.phone}
            style={{ padding: "10px 32px" }}
          >
            {saving ? <span className="hd-spin" /> : "Register Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPurchaseModal({ items, suppliers, onClose, onSuccess }: { items: any[]; suppliers: any[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    supplierId: "",
    purchaseNo: `PO-${Date.now().toString().slice(-6)}`,
    supplierInvoiceNo: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentType: "Cash",
    dueDate: "",
    notes: "",
    paidAmount: 0,
    paymentMode: "Cash",
    transactionRef: ""
  });
  const [pItems, setPItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // Calculate Summary
  const subTotal = pItems.reduce((sum, pi) => sum + (pi.quantity * pi.price), 0);
  const totalDiscount = pItems.reduce((sum, pi) => {
    const lineSubtotal = pi.quantity * pi.price;
    return sum + (lineSubtotal * (pi.discount / 100));
  }, 0);
  const totalGST = pItems.reduce((sum, pi) => {
    const lineSubtotal = pi.quantity * pi.price;
    const taxableValue = lineSubtotal - (lineSubtotal * (pi.discount / 100));
    return sum + (taxableValue * (pi.gst / 100));
  }, 0);

  const grandTotal = Math.round(subTotal - totalDiscount + totalGST);
  const balanceAmount = grandTotal - form.paidAmount;

  const addItem = (item?: any) => {
    if (item) {
      setPItems([...pItems, {
        itemId: item.id,
        name: item.name,
        quantity: 1,
        freeQty: 0,
        price: item.purchasePrice || 0,
        mrp: item.mrp || 0,
        batchNumber: "",
        expiryDate: "",
        discount: 0,
        gst: item.gst || 0,
        category: item.category
      }]);
      setSearchTerm("");
      setFilteredItems([]);
    } else {
      setPItems([...pItems, {
        itemId: "",
        name: "",
        quantity: 1,
        freeQty: 0,
        price: 0,
        mrp: 0,
        batchNumber: "",
        expiryDate: "",
        discount: 0,
        gst: 0,
        category: ""
      }]);
    }
  };

  const removeItem = (index: number) => {
    setPItems(pItems.filter((_, i) => i !== index));
  };

  const updateItem = (i: number, f: string, v: any) => {
    const n = [...pItems];
    n[i][f] = v;
    setPItems(n);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId) return alert("Please select a supplier");
    if (!form.supplierInvoiceNo) return alert("Supplier invoice number is mandatory");
    if (pItems.length === 0) return alert("Add at least one item");

    // Validation for items
    for (const pi of pItems) {
      if (!pi.itemId) {
        return alert(`Please select a valid inventory item for: ${pi.name || "row"}`);
      }
      if (pi.price <= 0) {
        return alert(`Price must be greater than 0 for: ${pi.name || "row"}`);
      }
      if (pi.category === "Medicine" && (!pi.batchNumber || !pi.expiryDate)) {
        return alert(`Batch and Expiry are mandatory for medicine: ${pi.name}`);
      }
      if (!Number.isInteger(pi.quantity) || pi.quantity <= 0) return alert(`Quantity must be a positive integer for: ${pi.name || "row"}`);
      if (new Date(pi.expiryDate) <= new Date()) {
        return alert(`Expiry date must be in the future for: ${pi.name}`);
      }
    }

    setSaving(true);
    const payload = {
      supplierId: form.supplierId,
      purchaseNo: form.purchaseNo,
      notes: form.notes,
      items: pItems
        .filter(pi => pi.itemId)
        .map(pi => ({
          itemId: pi.itemId,
          quantity: parseInt(String(pi.quantity), 10),
          price: Number(pi.price),
          sellingPrice: pi.mrp ? Number(pi.mrp) : undefined,
          batchNumber: pi.batchNumber || undefined,
          expiryDate: pi.expiryDate || undefined,
        })),
      subTotal,
      totalDiscount,
      totalGST,
      grandTotal,
      balanceAmount,
      status: balanceAmount <= 0 ? "PAID" : "PARTIAL"
    };

    const d = await api("/api/inventory/purchase", "POST", payload);
    if (d.success) onSuccess();
    else alert(d.message || "Failed to record purchase");
    setSaving(false);
  };

  const handleItemSearch = (val: string) => {
    setSearchTerm(val);
    if (val.length > 1) {
      const matches = items.filter(it =>
        it.name.toLowerCase().includes(val.toLowerCase()) ||
        it.sku?.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredItems(matches);
    } else {
      setFilteredItems([]);
    }
  };

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 1000, padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
          <div>
            <div className="hd-modal-title" style={{ color: "#0f172a", fontSize: 20 }}>New Purchase Entry (GRN)</div>
            <div className="hd-modal-sub" style={{ marginBottom: 0 }}>Record stock inward and update inventory batches</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
        </div>

        <form onSubmit={submit} style={{ maxHeight: "85vh", overflowY: "auto", padding: "24px" }}>
          {/* Section 1: Supplier & Purchase Info */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0E898F", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={16} /> 1. Supplier & Purchase Info
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <div className="hd-mf">
                <label className="hd-ml">Supplier *</label>
                {suppliers.length === 0 ? (
                  <select className="hd-mi" disabled>
                    <option>Loading suppliers...</option>
                  </select>
                ) : (
                  <select className="hd-mi" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} required>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Supplier Invoice No *</label>
                <input className="hd-mi" value={form.supplierInvoiceNo} onChange={e => setForm({ ...form, supplierInvoiceNo: e.target.value })} placeholder="INV-45879" required />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">PO Number</label>
                <input className="hd-mi" value={form.purchaseNo} onChange={e => setForm({ ...form, purchaseNo: e.target.value })} />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Purchase Date *</label>
                <input type="date" className="hd-mi" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Invoice Date</label>
                <input type="date" className="hd-mi" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} />
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Payment Type</label>
                <select className="hd-mi" value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value })}>
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
              {form.paymentType === "Credit" && (
                <div className="hd-mf">
                  <label className="hd-ml">Due Date</label>
                  <input type="date" className="hd-mi" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              )}
              <div className="hd-mf" style={{ gridColumn: form.paymentType === "Credit" ? "span 1" : "span 2" }}>
                <label className="hd-ml">Notes</label>
                <input className="hd-mi" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional remarks" />
              </div>
            </div>
          </div>

          {/* Section 2: Purchase Items */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0E898F", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Package size={16} /> 2. Purchase Items</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ position: "relative", width: 250 }}>
                  <div className="hd-search-wrap" style={{ width: "100%", background: "#fff" }}>
                    <Search size={14} color="#94a3b8" />
                    <input
                      className="hd-search"
                      placeholder="Quick search inventory..."
                      value={searchTerm}
                      onChange={e => handleItemSearch(e.target.value)}
                    />
                  </div>
                  {items.length === 0 && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Loading items...</div>
                  )}
                  {filteredItems.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 4, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                      {filteredItems.map(it => (
                        <div
                          key={it.id}
                          onClick={() => addItem(it)}
                          style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ fontWeight: 600 }}>{it.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{it.category} | {it.sku || "No SKU"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addItem()}
                  style={{ padding: "8px 16px", borderRadius: 10, background: "#0E898F", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#0A6B70"}
                  onMouseLeave={e => e.currentTarget.style.background = "#0E898F"}
                >
                  <Plus size={16} /> Add Blank Row
                </button>
              </div>
            </div>

            <div className="hd-tbl-wrap" style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <table className="hd-tbl" style={{ tableLayout: "fixed" }}>
                {/* Per-field labels inside rows; removing common header */}
                <tbody style={{ fontSize: 11 }}>
                  {pItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                        No items added yet. Search or type to add items to the purchase.
                      </td>
                    </tr>
                  ) : pItems.map((pi, i) => {
                    const lineSubtotal = pi.quantity * pi.price;
                    const lineDiscount = lineSubtotal * (pi.discount / 100);
                    const taxableValue = lineSubtotal - lineDiscount;
                    const lineGST = taxableValue * (pi.gst / 100);
                    const lineTotal = taxableValue + lineGST;

                    return (
                      <Fragment key={i}>
                        <tr style={{ borderBottom: "none" }}>
                          {/* Main Row: Item, Batch, Expiry, Qty, Total */}
                          <td style={{ verticalAlign: "top", paddingBottom: 4 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Item Name</label>
                            <div style={{ position: "relative" }}>
                              <input
                                className="hd-mi"
                                style={{ padding: "6px 8px", fontSize: 12, fontWeight: 600 }}
                                value={pi.name}
                                placeholder="Type item name..."
                                list={`items-list-${i}`}
                                onChange={e => {
                                  const val = e.target.value;
                                  const matched = items.find(x => x.name.toLowerCase() === val.toLowerCase());
                                  if (matched) {
                                    updateItem(i, "itemId", matched.id);
                                    updateItem(i, "name", matched.name);
                                    updateItem(i, "category", matched.category);
                                    updateItem(i, "price", matched.purchasePrice || 0);
                                    updateItem(i, "mrp", matched.mrp || 0);
                                    updateItem(i, "gst", matched.gst || 0);
                                  } else {
                                    updateItem(i, "itemId", ""); // Custom item
                                    updateItem(i, "name", val);
                                  }
                                }}
                              />
                              <datalist id={`items-list-${i}`}>
                                {items.map(it => <option key={it.id} value={it.name}>{it.category}</option>)}
                              </datalist>
                              {!pi.itemId && pi.name && (
                                <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>
                                  No inventory item linked. Use Quick search above or pick a suggested name.
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ verticalAlign: "top", paddingBottom: 4 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Batch #</label>
                            <input className="hd-mi" style={{ padding: "6px 8px", fontSize: 12, marginBottom: 4 }} value={pi.batchNumber} onChange={e => updateItem(i, "batchNumber", e.target.value)} placeholder="Batch #" />
                          </td>
                          <td style={{ verticalAlign: "top", paddingBottom: 4 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Quantity</label>
                            <input type="number" step={1} className="hd-mi" style={{ padding: "6px 8px", fontSize: 12 }} value={pi.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value || "0", 10) || 0)} placeholder="Qty" />
                          </td>
                          <td style={{ verticalAlign: "top", paddingBottom: 4 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Price</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '10px' }}>₹</span>
                              <input type="number" className="hd-mi" style={{ padding: "6px 8px 6px 16px", fontSize: 12 }} value={pi.price} onChange={e => updateItem(i, "price", parseFloat(e.target.value) || 0)} placeholder="Price" />
                            </div>
                          </td>
                          <td style={{ verticalAlign: "top", paddingBottom: 4 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Discount %</label>
                            <div style={{ position: 'relative' }}>
                              <input type="number" className="hd-mi" style={{ padding: "6px 18px 6px 8px", fontSize: 12 }} value={pi.discount} onChange={e => updateItem(i, "discount", parseFloat(e.target.value) || 0)} placeholder="Disc" />
                              <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '10px' }}>%</span>
                            </div>
                          </td>
                          <td rowSpan={2} style={{ textAlign: "right", verticalAlign: "middle", fontWeight: 800, fontSize: 14, color: "#1e293b", background: "#f8fafc" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                              <span className="hd-ml" style={{ marginBottom: 4 }}>Total Amount</span>
                              ₹{lineTotal.toFixed(2)}
                            </div>
                          </td>
                          <td rowSpan={2} style={{ verticalAlign: "middle", textAlign: "center" }}>
                            <button type="button" onClick={() => removeItem(i)} style={{ color: "#ef4444", background: "#fee2e2", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                        <tr style={{ borderTop: "none" }}>
                          {/* Sub Row: Category, Free, Price, MRP, Disc, GST */}
                          <td style={{ paddingTop: 0, paddingBottom: 10 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Category</label>
                            <select
                              className="hd-mi"
                              style={{ padding: "4px 8px", fontSize: 11, background: "#fff" }}
                              value={pi.category}
                              onChange={e => updateItem(i, "category", e.target.value)}
                              disabled={!!pi.itemId}
                            >
                              <option value="">Select Category</option>
                              {["Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items"].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td style={{ paddingTop: 0, paddingBottom: 10 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Expiry Date</label>
                            <input type="date" className="hd-mi" style={{ padding: "4px 8px", fontSize: 11 }} value={pi.expiryDate} onChange={e => updateItem(i, "expiryDate", e.target.value)} />
                          </td>
                          <td style={{ paddingTop: 0, paddingBottom: 10 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>Free Qty</label>
                            <input type="number" className="hd-mi" style={{ padding: "4px 8px", fontSize: 11, color: "#10b981", fontWeight: 600 }} value={pi.freeQty} onChange={e => updateItem(i, "freeQty", parseFloat(e.target.value) || 0)} placeholder="Free" title="Free Quantity" />
                          </td>
                          <td style={{ paddingTop: 0, paddingBottom: 10 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>MRP</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '10px' }}>₹</span>
                              <input type="number" className="hd-mi" style={{ padding: "4px 8px 4px 16px", fontSize: 11 }} value={pi.mrp} onChange={e => updateItem(i, "mrp", parseFloat(e.target.value) || 0)} placeholder="MRP" title="Maximum Retail Price" />
                            </div>
                          </td>
                          <td style={{ paddingTop: 0, paddingBottom: 10 }}>
                            <label className="hd-ml" style={{ marginBottom: 4 }}>GST %</label>
                            <div style={{ position: 'relative' }}>
                              <input type="number" className="hd-mi" style={{ padding: "4px 18px 4px 8px", fontSize: 11 }} value={pi.gst} onChange={e => updateItem(i, "gst", parseFloat(e.target.value) || 0)} placeholder="GST" title="GST Percentage" />
                              <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '10px' }}>%</span>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4 & 5: Summary & Payment */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 32, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0E898F", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <IndianRupee size={16} /> 5. Payment Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="hd-mf">
                  <label className="hd-ml">Paid Amount</label>
                  <input type="number" className="hd-mi" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="hd-mf">
                  <label className="hd-ml">Payment Mode</label>
                  <select className="hd-mi" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="hd-mf" style={{ gridColumn: "span 2" }}>
                  <label className="hd-ml">Transaction Reference</label>
                  <input className="hd-mi" value={form.transactionRef} onChange={e => setForm({ ...form, transactionRef: e.target.value })} placeholder="UTR / Ref No" />
                </div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Purchase Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                  <span>Sub Total</span>
                  <span style={{ fontWeight: 600 }}>₹{subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#ef4444" }}>
                  <span>Total Discount</span>
                  <span style={{ fontWeight: 600 }}>- ₹{totalDiscount.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                  <span>Total GST</span>
                  <span style={{ fontWeight: 600 }}>+ ₹{totalGST.toFixed(2)}</span>
                </div>
                <div style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
                  <span>Grand Total</span>
                  <span style={{ color: "#0E898F" }}>₹{grandTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: balanceAmount > 0 ? "#f59e0b" : "#10b981", marginTop: 8 }}>
                  <span>Balance Amount</span>
                  <span>₹{balanceAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hd-ma" style={{ marginTop: 32, borderTop: "1px solid #f1f5f9", paddingTop: 24 }}>
            <button type="button" className="hd-mcancel" onClick={onClose} style={{ padding: "12px" }}>Discard Entry</button>
            <button type="submit" className="hd-msubmit" disabled={saving || pItems.length === 0} style={{ padding: "12px", fontSize: 14 }}>
              {saving ? <span className="hd-spin" /> : <><CheckCircle2 size={18} /> Save Purchase & Update Stock</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Comprehensive Patients Management Panel ───
function PatientsManagementPanel() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const itemsPerPage = 10;

  const loadPatients = async () => {
    setLoading(true);
    const response = await api(`/api/patients?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`);
    if (response.success) {
      setPatients(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
      setTotalCount(response.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { loadPatients(); }, [currentPage, searchTerm]);

  const handleDeletePatient = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const d = await api(`/api/patients/${deleteTarget.id}`, "DELETE");
    if (d.success) {
      setDeleteTarget(null);
      loadPatients();
    } else {
      alert(d.message || "Failed to delete patient");
    }
    setDeleting(false);
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return "—";
    return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  };

  return (
    <div className="hd-card mb16">
      <div className="hd-card-head" style={{ flexWrap: "wrap", gap: 15 }}>
        <div>
          <div className="hd-card-title">Patient Management</div>
          <div className="hd-card-sub">{totalCount} registered patients</div>
        </div>

        <div style={{ display: "flex", gap: 10, flex: 1, justifyContent: "flex-end", minWidth: 300 }}>
          <div className="hd-search-wrap" style={{ width: "100%", maxWidth: 300 }}>
            <Search size={14} color="#94a3b8" />
            <input className="hd-search" placeholder="Search name, phone, ID..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <button className="hd-btn-primary" onClick={() => router.push("/hospitaladmin/appointments")} style={{ whiteSpace: "nowrap" }}>
            <Plus size={14} /> Register Patient
          </button>
        </div>
      </div>

      <div className="hd-tbl-wrap">
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
            <Loader2 size={24} className="hd-spin" style={{ margin: "0 auto 10px", borderColor: "#0E898F" }} />
            <div style={{ fontSize: 13 }}>Loading patients...</div>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
            <Users size={32} style={{ opacity: .3, marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No patients found</div>
          </div>
        ) : (
          <>
            <table className="hd-tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Gender/Age</th>
                  <th>Blood Group</th>
                  <th>Activity</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "2px 6px", borderRadius: 5 }}>{p.patientId}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{p.name.charAt(0).toUpperCase()}</div>
                        <span className="hd-td-name">{p.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{p.phone}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.email || "No email"}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span className="hd-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>{p.gender || "—"}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{calculateAge(p.dateOfBirth)} yrs</span>
                      </div>
                    </td>
                    <td><span className="hd-badge" style={{ background: "#fef3c7", color: "#f59e0b" }}>{p.bloodGroup || "—"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div title="Appointments"><div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Visits</div><div style={{ fontSize: 12, fontWeight: 700, color: "#0A6B70" }}>{p._count?.appointments || 0}</div></div>
                        <div title="Follow-ups"><div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>F/Up</div><div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{p._count?.followUps || 0}</div></div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="hd-card-icon-btn" onClick={() => router.push(`/hospitaladmin/appointments?patientId=${p.id}`)} title="View Records"><ChevronRight size={14} /></button>
                        <button className="hd-card-icon-btn" style={{ color: "#ef4444" }} onClick={() => setDeleteTarget(p)} title="Delete Patient"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Showing {patients.length} of {totalCount} patients</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="hd-filter-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? .5 : 1 }}>Prev</button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button key={i} className={`hd-filter-btn${currentPage === pageNum ? " on" : ""}`} onClick={() => setCurrentPage(pageNum)}
                        style={{ minWidth: 32, justifyContent: "center", background: currentPage === pageNum ? "#0E898F" : "#f1f5f9", color: currentPage === pageNum ? "#fff" : "#64748b" }}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button className="hd-filter-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? .5 : 1 }}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <div className="hd-modal-bg" onClick={() => setDeleteTarget(null)}>
          <div className="hd-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertTriangle size={20} color="#ef4444" /></div>
              <div>
                <div className="hd-modal-title">Delete Patient?</div>
                <div className="hd-modal-sub">Are you sure you want to delete <b>{deleteTarget.name}</b>? This will permanently remove all medical history, appointments, and prescriptions.</div>
              </div>
            </div>
            <div className="hd-ma">
              <button className="hd-mcancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="hd-msubmit" style={{ background: "#ef4444" }} onClick={handleDeletePatient} disabled={deleting}>{deleting ? <span className="hd-spin" /> : "Delete Permanently"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Patient Edit Modal ───
function PatientEditModal({ patientId, onClose, onUpdate }: { patientId: string; onClose: () => void; onUpdate: () => void }) {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api(`/api/patients/${patientId}`).then(d => {
      if (d.success) setForm(d.data);
      setLoading(false);
    });
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const d = await api(`/api/patients/${patientId}`, "PUT", form);
    if (d.success) {
      onUpdate();
      onClose();
    } else {
      setMsg(d.message || "Failed to update");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="hd-modal-bg">
      <div className="hd-modal" style={{ textAlign: "center", padding: 40 }}>
        <Loader2 size={24} className="hd-spin" style={{ margin: "0 auto 10px", borderColor: "#0E898F" }} />
        <div style={{ fontSize: 13, color: "#64748b" }}>Loading patient profile...</div>
      </div>
    </div>
  );

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
          <div>
            <div className="hd-modal-title">Edit Patient Profile</div>
            <div className="hd-modal-sub">Update basic information for {form.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
            <div className="hd-mf" style={{ gridColumn: "span 2" }}>
              <label className="hd-ml">Full Name</label>
              <input className="hd-mi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="hd-mf">
              <label className="hd-ml">Phone Number</label>
              <input className="hd-mi" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="hd-mf">
              <label className="hd-ml">Email</label>
              <input className="hd-mi" type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="hd-mf">
              <label className="hd-ml">Gender</label>
              <select className="hd-mi" value={form.gender || ""} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="hd-mf">
              <label className="hd-ml">Blood Group</label>
              <select className="hd-mi" value={form.bloodGroup || ""} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="hd-mf" style={{ gridColumn: "span 2" }}>
              <label className="hd-ml">Address</label>
              <input className="hd-mi" value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          {msg && <div className="hd-msg-err">{msg}</div>}

          <div className="hd-ma">
            <button type="button" className="hd-mcancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="hd-msubmit" disabled={saving}>{saving ? <span className="hd-spin" /> : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

type NavTab = "overview" | "appointments" | "staff" | "doctors" | "patients" | "inventory" | "billing" | "ipd" | "reports" | "finance" | "settings" | "profile";

export default function HospitalAdminDashboard() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<NavTab>("overview");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "DOCTOR", password: "" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [search, setSearch] = useState("");
  const [apptStats, setApptStats] = useState<any>(null);
  const [patientStats, setPatientStats] = useState<any>(null);
  const [patientEditId, setPatientEditId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const fetchDashboard = async () => {
    setDashboardLoading(true);
    try {
      const d = await fetch("/api/dashboard/overview", { credentials: "include" }).then(r => r.json());
      if (d.success) setDashboardData(d.data);
    } catch {}
    setDashboardLoading(false);
  };
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // Profile states
  const [profileFormData, setProfileFormData] = useState({ name: "", email: "", phone: "" });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = searchParams.get("tab") as NavTab;
    if (t === "finance") { router.push("/hospitaladmin/finance"); return; }
    if (t && ["overview", "appointments", "staff", "doctors", "patients", "inventory", "billing", "ipd", "settings", "profile"].includes(t)) {
      setTab(t);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { router.push("/login"); return; }
        if (d.data.role === "DOCTOR") { router.push("/doctor/dashboard"); return; }
        if (d.data.role === "STAFF" || d.data.role === "RECEPTIONIST") { router.push("/staff/dashboard"); return; }
        if (d.data.role !== "HOSPITAL_ADMIN") { router.push("/login"); return; }
        setUser(d.data); setProfileFormData({ name: d.data.name || "", email: d.data.email || "", phone: "" }); if (d.data.profilePhoto) setProfilePhoto(d.data.profilePhoto); setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetch("/api/appointments?stats=true", { credentials: "include" }).then(r => r.json()).then(d => { if (d.success) setApptStats(d.data); });
      fetch("/api/patients?stats=true", { credentials: "include" }).then(r => r.json()).then(d => { if (d.success) setPatientStats(d.data); });
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 60000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); router.push("/login"); };

  // Profile handlers
  const handlePhotoClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: profileFormData.name, email: profileFormData.email, profilePhoto }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMessage({ type: "success", text: "Profile updated successfully!" });
        setUser((prev: any) => prev ? { ...prev, name: profileFormData.name, email: profileFormData.email } : null);
      } else {
        setProfileMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setCreateMsg("");
    try {
      const res = await fetch("/api/user/create", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(newStaff) });
      const d = await res.json();
      if (d.success) { setCreateMsg("✓ Staff added!"); setTimeout(() => setShowAddStaff(false), 1500); }
      else setCreateMsg(d.message || "Failed.");
    } catch { setCreateMsg("Network error."); }
    finally { setCreating(false); }
  };

  const initials = (n: string) => n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();


  const todayAppts = dashboardData?.appointments?.today ?? apptStats?.today ?? 0;
  const totalPatients = dashboardData?.patients?.total ?? patientStats?.total ?? 0;
  const newPatientsToday = dashboardData?.patients?.newToday ?? patientStats?.newToday ?? 0;
  const completedAppts = dashboardData?.appointments?.completed ?? apptStats?.completed ?? 0;
  const totalStaffCount = (dashboardData?.staff?.total ?? 0) + (dashboardData?.staff?.doctors ?? 0);
  const revenueToday = dashboardData?.finance?.revenueToday ?? 0;
  const revenueMonth = dashboardData?.finance?.revenueMonth ?? 0;

  const stats = [
    { label: "Staff & Doctors", val: dashboardData ? totalStaffCount : "—", sub: `${dashboardData?.staff?.activeDoctors ?? 0} active doctors`, icon: <Users size={20} color="#fff" />, bg: "#E6F4F4", iconBg: "#0E898F" },
    { label: "Total Patients", val: dashboardData ? totalPatients : "—", sub: newPatientsToday > 0 ? `+${newPatientsToday} new today` : `+${dashboardData?.patients?.newThisMonth ?? 0} this month`, icon: <UserRound size={20} color="#fff" />, bg: "#f0fdf4", iconBg: "#10b981" },
    { label: "Today Appointments", val: dashboardData ? todayAppts : "—", sub: `${completedAppts} completed`, icon: <CalendarDays size={20} color="#fff" />, bg: "#fdf4ff", iconBg: "#a855f7" },
    { label: "Revenue Today", val: dashboardData ? `₹${revenueToday >= 1000 ? (revenueToday / 1000).toFixed(1) + "K" : revenueToday}` : "—", sub: `₹${revenueMonth >= 1000 ? (revenueMonth / 1000).toFixed(1) + "K" : revenueMonth} this month`, icon: <IndianRupee size={20} color="#fff" />, bg: "#fff7ed", iconBg: "#f59e0b" },
  ];

  return (
    <>

      {showAddStaff && (
        <div className="hd-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowAddStaff(false) }}>
          <div className="hd-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div className="hd-modal-title">Add Staff Member</div>
              <button onClick={() => setShowAddStaff(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={18} /></button>
            </div>
            <div className="hd-modal-sub">Create a new user within your hospital.</div>
            <form onSubmit={handleAddStaff}>
              {[{ key: "name", lbl: "Full Name", ph: "Dr. John Doe" }, { key: "email", lbl: "Email", ph: "doctor@hospital.com" }, { key: "password", lbl: "Password", ph: "Min 6 characters" }].map(f => (
                <div key={f.key} className="hd-mf">
                  <label className="hd-ml">{f.lbl}</label>
                  <input type={f.key === "password" ? "password" : "text"} className="hd-mi" placeholder={f.ph} value={(newStaff as any)[f.key]} onChange={e => setNewStaff(n => ({ ...n, [f.key]: e.target.value }))} required />
                </div>
              ))}
              <div className="hd-mf">
                <label className="hd-ml">Role</label>
                <select className="hd-mi" style={{ cursor: "pointer" }} value={newStaff.role} onChange={e => setNewStaff(n => ({ ...n, role: e.target.value }))}>
                  <option value="DOCTOR">Doctor</option><option value="RECEPTIONIST">Receptionist</option><option value="STAFF">Staff</option>
                </select>
              </div>
              {createMsg && <div className={createMsg.startsWith("✓") ? "hd-msg-ok" : "hd-msg-err"}>{createMsg}</div>}
              <div className="hd-ma">
                <button type="button" className="hd-mcancel" onClick={() => setShowAddStaff(false)}>Cancel</button>
                <button type="submit" className="hd-msubmit" disabled={creating}>{creating ? <span className="hd-spin" /> : "Add Staff Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {patientEditId && <PatientEditModal patientId={patientEditId} onClose={() => setPatientEditId(null)} onUpdate={() => setTab("patients")} />}

      <div className="hd-body" style={(tab === "inventory" || tab === "billing" || tab === "ipd" || tab === "reports") ? { gridTemplateColumns: "1fr" } : undefined}>
    <div className="hd-center">
      {tab === "overview" && (<>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div className="hd-pg-title" style={{ marginBottom: 2 }}>Dashboard</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {dashboardData ? `Last updated ${new Date(dashboardData.generatedAt).toLocaleTimeString()}` : "Loading real-time data..."}
            </div>
          </div>
          <button className="hd-filter-btn" onClick={fetchDashboard} disabled={dashboardLoading}>
            <RefreshCw size={12} style={{ animation: dashboardLoading ? "sp 1s linear infinite" : "none" }} />
            {dashboardLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="hd-stats">
          {stats.map((s, i) => (
            <div key={i} className="hd-sc" style={{ background: s.bg }}>
              <div className="hd-sc-icon" style={{ background: s.iconBg }}>{s.icon}</div>
              <div>
                <div className="hd-sc-lbl">{s.label}</div>
                <div className="hd-sc-val">{s.val}</div>
                <div className="hd-sc-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's activity breakdown */}
        {dashboardData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Scheduled", val: dashboardData.appointments?.scheduled ?? 0, color: "#3b82f6", bg: "#eff6ff" },
              { label: "Confirmed", val: dashboardData.appointments?.pending ?? 0, color: "#8b5cf6", bg: "#f5f3ff" },
              { label: "Completed", val: dashboardData.appointments?.completed ?? 0, color: "#10b981", bg: "#f0fdf4" },
              { label: "Cancelled", val: dashboardData.appointments?.cancelled ?? 0, color: "#ef4444", bg: "#fff5f5" },
              { label: "Pending Bills", val: dashboardData.finance?.pendingBills ?? 0, color: "#f59e0b", bg: "#fffbeb" },
              { label: "Active Plans", val: dashboardData.treatmentPlans?.active ?? 0, color: "#0E898F", bg: "#E6F4F4" },
              { label: "Plans Done", val: dashboardData.treatmentPlans?.completed ?? 0, color: "#059669", bg: "#f0fdf4" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${item.color}22` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div className="hd-mid" style={{ marginBottom: 18 }}>
          {/* Monthly Trend Chart */}
          <div className="hd-card">
            <div className="hd-card-head">
              <div>
                <div className="hd-card-title">Monthly Activity Trends</div>
                <div className="hd-card-sub">Appointments & new patients — last 9 months</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: "#0E898F" }} />
                  <span style={{ fontSize: 10, color: "#64748b" }}>Appointments</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: "#10b981" }} />
                  <span style={{ fontSize: 10, color: "#64748b" }}>New Patients</span>
                </div>
              </div>
            </div>
            <div className="hd-card-body" style={{ paddingTop: 8 }}>
              {dashboardLoading && !dashboardData ? (
                <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>
                  <Loader2 size={18} className="hd-spin" style={{ marginRight: 8, borderColor: "#0E898F" }} /> Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={dashboardData?.monthlyTrends ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0E898F" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#0E898F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                      labelStyle={{ fontWeight: 700, color: "#1e293b" }}
                    />
                    <Area type="monotone" dataKey="appointments" stroke="#0E898F" strokeWidth={2} fill="url(#apptGrad)" name="Appointments" dot={{ r: 3, fill: "#0E898F", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2} fill="url(#patGrad)" name="New Patients" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Live Alerts / Inventory Status */}
          <div className="hd-card">
            <div className="hd-card-head">
              <div className="hd-card-title">Live Alerts</div>
              <div className="hd-card-icon-btn"><Activity size={14} /></div>
            </div>
            <div className="hd-card-body" style={{ padding: "12px 14px" }}>
              {dashboardLoading && !dashboardData ? (
                <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 12 }}>Loading...</div>
              ) : (
                <>
                  {(dashboardData?.inventory?.lowStockCount ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#fff", display: "flex", flexShrink: 0 }}><AlertTriangle size={14} /></span>
                        <div>
                          <div className="hd-ri-msg" style={{ color: "#fff" }}>{dashboardData.inventory.lowStockCount} inventory items below minimum stock level</div>
                          <div className="hd-ri-time" style={{ color: "rgba(255,255,255,0.7)" }}>Go to Inventory → Check stock</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(dashboardData?.inventory?.expiringSoonCount ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#fff", display: "flex", flexShrink: 0 }}><Clock size={14} /></span>
                        <div>
                          <div className="hd-ri-msg" style={{ color: "#fff" }}>{dashboardData.inventory.expiringSoonCount} batches expiring within 30 days</div>
                          <div className="hd-ri-time" style={{ color: "rgba(255,255,255,0.7)" }}>Review expiring inventory</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(dashboardData?.finance?.pendingBills ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#f59e0b", display: "flex", flexShrink: 0 }}><IndianRupee size={14} /></span>
                        <div>
                          <div className="hd-ri-msg">{dashboardData.finance.pendingBills} bills pending collection</div>
                          <div className="hd-ri-time" style={{ color: "#94a3b8" }}>Go to Billing → Pending queue</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(dashboardData?.followUps?.pending ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#8b5cf6", display: "flex", flexShrink: 0 }}><CalendarCheck size={14} /></span>
                        <div>
                          <div className="hd-ri-msg">{dashboardData.followUps.pending} follow-ups scheduled for today</div>
                          <div className="hd-ri-time" style={{ color: "#94a3b8" }}>Review patient follow-ups</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {dashboardData && (dashboardData.inventory.lowStockCount === 0) && (dashboardData.finance.pendingBills === 0) && (dashboardData.followUps.pending === 0) && (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                      <CheckCircle size={24} style={{ margin: "0 auto 8px", opacity: .4, display: "block" }} />
                      <div style={{ fontSize: 12 }}>All systems normal</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Patients Table */}
        <div className="hd-card mb16">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Recently Registered Patients</div>
              <div className="hd-card-sub">{dashboardData ? `${dashboardData.patients.total} total · ${dashboardData.patients.newToday} registered today` : "Loading..."}</div>
            </div>
            <button className="hd-card-icon-btn" onClick={() => router.push("/hospitaladmin/patients")} title="View all"><ChevronRight size={14} /></button>
          </div>
          <div className="hd-tbl-wrap">
            {dashboardLoading && !dashboardData ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                <Loader2 size={20} className="hd-spin" style={{ margin: "0 auto 8px", borderColor: "#0E898F" }} />
                <div style={{ fontSize: 12 }}>Loading patient data...</div>
              </div>
            ) : (dashboardData?.recentPatients?.length ?? 0) === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No patients registered yet</div>
            ) : (
              <table className="hd-tbl">
                <thead>
                  <tr><th>ID</th><th>Registered</th><th>Name</th><th>Contact</th><th>Blood</th><th>Gender</th><th>Visits</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {(dashboardData?.recentPatients ?? []).map((p: any, i: number) => {
                    const age = p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000) : null;
                    const regDate = new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                    return (
                      <tr key={p.id}>
                        <td><span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "2px 6px", borderRadius: 5 }}>{p.patientId}</span></td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{regDate}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{p.name.charAt(0).toUpperCase()}</div>
                            <span className="hd-td-name">{p.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: "#64748b" }}>{p.phone}</td>
                        <td><span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12 }}>{p.bloodGroup || "—"}</span></td>
                        <td><span className="hd-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>{p.gender ? p.gender.charAt(0) + p.gender.slice(1).toLowerCase() : "—"}{age !== null ? ` · ${age}y` : ""}</span></td>
                        <td><span style={{ fontSize: 12, fontWeight: 700, color: "#0A6B70" }}>{p._count?.appointments ?? 0}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => router.push(`/hospitaladmin/appointments?patientId=${p.id}`)}><ChevronRight size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Access — Configure & Treatment Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div className="hd-card" style={{ cursor: "pointer" }} onClick={() => router.push("/hospitaladmin/configure?tab=overview")}>
            <div className="hd-card-head">
              <div>
                <div className="hd-card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}><BarChart2 size={15} color="#0E898F" />Services & Treatment Dashboard</div>
                <div className="hd-card-sub">Service packages, treatment plan stats, session completion</div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
            <div style={{ display: "flex", gap: 10, padding: "0 16px 14px" }}>
              {[
                { label: "Service Packages", path: "services", color: "#0369a1", bg: "#e0f2fe" },
                { label: "Treatment Plans", path: "treatments", color: "#16a34a", bg: "#f0fdf4" },
                { label: "Permissions", path: "permissions", color: "#9333ea", bg: "#fdf4ff" },
              ].map(item => (
                <button key={item.label} onClick={e => { e.stopPropagation(); router.push(`/hospitaladmin/configure?tab=${item.path}`); }}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: item.bg, color: item.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="hd-card" style={{ cursor: "pointer" }} onClick={() => router.push("/hospitaladmin/configure?tab=departments")}>
            <div className="hd-card-head">
              <div>
                <div className="hd-card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}><Building2 size={15} color="#0E898F" />Departments & Sub-Depts</div>
                <div className="hd-card-sub">Manage departments, sub-departments and procedures</div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
            <div style={{ display: "flex", gap: 10, padding: "0 16px 14px" }}>
              {[
                { label: "Departments", path: "departments", color: "#0369a1", bg: "#e0f2fe" },
                { label: "Sub-Depts", path: "subdepts", color: "#0f766e", bg: "#f0fdfa" },
                { label: "Staff", path: "staff", color: "#475569", bg: "#f1f5f9" },
              ].map(item => (
                <button key={item.label} onClick={e => { e.stopPropagation(); router.push(`/hospitaladmin/configure?tab=${item.path}`); }}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: item.bg, color: item.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>)}

      {tab === "appointments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "linear-gradient(135deg,#0E898F,#07595D)", borderRadius: 16, padding: "28px 28px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}><CalendarCheck size={24} />Appointment Management</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", maxWidth: 440 }}>Book appointments, manage follow-ups, and view your full patient registry in the dedicated module.</div>
            </div>
            <button onClick={() => router.push("/hospitaladmin/appointments")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
              Open Module <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {[
              { label: "Book Appointment", desc: "Search patient + pick doctor + select slot", color: "#0E898F", bg: "#E6F4F4", path: "/hospitaladmin/appointments", icon: <CalendarCheck size={18} /> },
              { label: "Follow-up Dashboard", desc: "Track pending, overdue and completed follow-ups", color: "#10b981", bg: "#f0fdf4", path: "/hospitaladmin/appointments", icon: <RefreshCw size={18} /> },
              { label: "Patient Registry", desc: "View full patient history and profiles", color: "#7c3aed", bg: "#f5f3ff", path: "/hospitaladmin/appointments", icon: <Users size={18} /> },
            ].map((card) => (
              <button key={card.label} onClick={() => router.push(card.path)}
                style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", cursor: "pointer", textAlign: "left", transition: "all .15s", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{card.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#0E898F,#07595D)", borderRadius: 16, padding: "24px 28px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}><Users size={22} />Staff & Doctors</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)" }}>
                {dashboardData ? `${dashboardData.staff.total} staff · ${dashboardData.staff.doctors} doctors · ${dashboardData.staff.activeDoctors} active` : "Loading..."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => router.push("/hospitaladmin/configure?tab=staff")}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Manage Staff
              </button>
              <button onClick={() => router.push("/hospitaladmin/configure?tab=doctors")}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Manage Doctors
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Total Staff", val: dashboardData?.staff?.total ?? "—", icon: <Users size={18} />, color: "#0E898F", bg: "#E6F4F4" },
              { label: "Active Staff", val: dashboardData?.staff?.active ?? "—", icon: <CheckCircle2 size={18} />, color: "#10b981", bg: "#f0fdf4" },
              { label: "Total Doctors", val: dashboardData?.staff?.doctors ?? "—", icon: <Stethoscope size={18} />, color: "#8b5cf6", bg: "#f5f3ff" },
              { label: "Active Doctors", val: dashboardData?.staff?.activeDoctors ?? "—", icon: <Activity size={18} />, color: "#f59e0b", bg: "#fffbeb" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                <div style={{ color: item.color, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1, marginBottom: 4 }}>{item.val}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div className="hd-card mb16">
            <div className="hd-card-head">
              <div><div className="hd-card-title">Doctors on Duty Today</div><div className="hd-card-sub">{dashboardData?.doctorsOnDuty?.length ?? 0} doctors with appointments</div></div>
              <button className="hd-btn-primary" onClick={() => { setShowAddStaff(true); setCreateMsg(""); }}><Plus size={14} />Add User</button>
            </div>
            <div className="hd-tbl-wrap">
              {(dashboardData?.doctorsOnDuty?.length ?? 0) === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  <Stethoscope size={28} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }} />
                  No doctors have appointments scheduled today
                </div>
              ) : (
                <table className="hd-tbl">
                  <thead><tr><th>Doctor</th><th>Specialization / Dept</th><th>First Slot</th><th>Appointments</th></tr></thead>
                  <tbody>
                    {(dashboardData?.doctorsOnDuty ?? []).map((d: any) => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#0E898F,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(d.name)}</div>
                            <span className="hd-td-name">{d.name}</span>
                          </div>
                        </td>
                        <td><span className="hd-badge" style={{ background: "#E6F4F4", color: "#0A6B70", border: "1px solid #B3E0E0" }}>{d.department || d.specialization}</span></td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{d.firstSlot}{d.lastSlot !== d.firstSlot ? ` – ${d.lastSlot}` : ""}</td>
                        <td><span style={{ fontWeight: 700, color: "#0E898F" }}>{d.appointmentCount}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "patients" && (
        <PatientsManagementPanel />
      )}

      {tab === "inventory" && (
        <InventoryPanel />
      )}

      {tab === "billing" && (
        <BillingModule />
      )}

      {tab === "ipd" && (
        <IPDPanel />
      )}

      {tab === "reports" && (
        <div style={{ padding: "4px 0" }}><ReportsPanel /></div>
      )}

      {tab === "settings" && (
        <div className="hd-card mb16">
          <div className="hd-card-head"><div className="hd-card-title">System Settings</div></div>
          <div className="hd-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Hospital Name", user?.hospital?.name || "—"], ["Admin Email", user?.email || "—"], ["Timezone", "IST (UTC+5:30)"], ["Auth", "JWT + HTTP-only Cookies"], ["Session TTL", "7 Days"], ["DB", "MySQL — TiDB Cloud"]].map(([k, v]) => (
                <div key={k} style={{ padding: "14px 16px", borderRadius: 11, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

    {tab !== "inventory" && tab !== "billing" && tab !== "ipd" && tab !== "reports" && (
      <div className="hd-right">
        <div className="hd-right-sec">
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Date</div>
          <MiniCalendar />
        </div>
        <div className="hd-right-sec" style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="hd-right-title">Doctors on Duty Today</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0E898F", background: "#E6F4F4", padding: "2px 8px", borderRadius: 20 }}>
              {dashboardData?.doctorsOnDuty?.length ?? 0}
            </span>
          </div>
          {dashboardLoading && !dashboardData ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>
              <Loader2 size={16} className="hd-spin" style={{ margin: "0 auto 6px", borderColor: "#0E898F" }} />
              Loading...
            </div>
          ) : (dashboardData?.doctorsOnDuty?.length ?? 0) === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>
              <Stethoscope size={22} style={{ margin: "0 auto 6px", display: "block", opacity: .3 }} />
              No appointments today
            </div>
          ) : (
            (dashboardData?.doctorsOnDuty ?? []).map((d: any, i: number) => (
              <div key={d.id} className="hd-appt-item" style={{ marginBottom: 8 }}>
                <div className="hd-appt-ic">
                  <Stethoscope size={17} color="#0E898F" />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div className="hd-appt-name">{d.name}</div>
                  <div className="hd-appt-doc">{d.department || d.specialization}</div>
                  <div className="hd-appt-time">{d.appointmentCount} appt{d.appointmentCount !== 1 ? "s" : ""} · {d.firstSlot}{d.lastSlot !== d.firstSlot ? ` – ${d.lastSlot}` : ""}</div>
                </div>
                <ChevronRight size={14} color="#94a3b8" />
              </div>
            ))
          )}
        </div>

        {/* Quick stats for right panel */}
        {dashboardData && (
          <div className="hd-right-sec" style={{ marginTop: 22 }}>
            <div className="hd-right-title" style={{ marginBottom: 10 }}>Today's Summary</div>
            {[
              { label: "Follow-ups", val: dashboardData.followUps?.today ?? 0, color: "#8b5cf6" },
              { label: "New Patients", val: dashboardData.patients?.newToday ?? 0, color: "#10b981" },
              { label: "Revenue", val: `₹${(dashboardData.finance?.revenueToday ?? 0) >= 1000 ? ((dashboardData.finance.revenueToday) / 1000).toFixed(1) + "K" : dashboardData.finance?.revenueToday ?? 0}`, color: "#f59e0b" },
              { label: "Low Stock", val: dashboardData.inventory?.lowStockCount ?? 0, color: (dashboardData.inventory?.lowStockCount ?? 0) > 0 ? "#ef4444" : "#10b981" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 9, background: "#f8fafc", border: "1px solid #f1f5f9", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
    </>
  );
}
