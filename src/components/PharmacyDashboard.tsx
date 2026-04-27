"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Pill, Search, RefreshCw, Loader2, X, Check, AlertTriangle, Clock,
  Package, TrendingUp, ShoppingCart, FileText, BarChart2, Users,
  ChevronDown, ChevronUp, ChevronRight, Eye, Download, Filter,
  AlertCircle, CheckCircle2, DollarSign, IndianRupee, ArrowUpDown,
  Layers, Activity, Plus, Trash2, Edit2, Boxes, Truck, Bell,
  ClipboardList, Calendar, User, Phone, Stethoscope, Receipt,
  ArrowRight, Ban, PlayCircle, Archive, ShieldCheck, CreditCard,
  Banknote, Wallet, Hash, BadgeAlert, CircleDot, Zap, Info, History, Send,
  FileSpreadsheet, FileType, Table
} from "lucide-react";
import PharmacyInventoryPanel from "./PharmacyInventoryPanel";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  prescriptionNo: string;
  patient: { id: string; name: string; patientId: string; phone?: string; gender?: string; dateOfBirth?: string };
  doctor: { id: string; name: string; specialization?: string };
  appointment?: { id: string; appointmentDate: string; timeSlot: string; type: string; tokenNumber?: number };
  medications: any[];
  diagnosis?: string;
  chiefComplaint?: string;
  status: string;
  workflowStatus: string | null;
  workflowId: string | null;
  workflowNotes: string | null;
  workflowCharges: any[];
  dispensed: boolean;
  totalCharge: number;
  createdAt: string;
}

interface Stats {
  todayRxCount: number;
  todayDispensed: number;
  pendingCount: number;
  lowStockCount: number;
  expiringCount: number;
  totalItems: number;
  todayRevenue: number;
  totalRevenue: number;
  chartData: { date: string; label: string; count: number; revenue: number }[];
  topMedicines: { name: string; category: string; qty: number; revenue: number }[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  genericName?: string;
  brandName?: string;
  subCategory?: string;
  sku?: string;
  barcode?: string;
  mrp: number;
  sellingPrice: number;
  purchasePrice: number;
  gst: number;
  discount?: number;
  hsnCode?: string;
  unit: string;
  packSize?: string;
  minStock: number;
  maxStock?: number;
  reorderLevel?: number;
  reorderQty?: number;
  requiresRx: boolean;
  isActive: boolean;
  location?: string;
  rackNumber?: string;
  tempRequirement?: string;
  drugSchedule?: string;
  description?: string;
  totalStock?: number;
  batches?: { id: string; batchNumber?: string; remainingQty: number; expiryDate?: string; purchasePrice: number; sellingPrice?: number }[];
}

interface PharmacyBill {
  id: string;
  billNo: string;
  patient: { name: string; patientId: string };
  items: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: string;
  isGst: boolean;
  cgst: number;
  sgst: number;
  paymentMethod?: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "#0E898F";
const LIGHT_BG = "#E6F4F4";
const BORDER = "#B3E0E0";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const calcAge = (dob: string) => dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null;
const fmtCurrency = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

// ─── Export Helpers ──────────────────────────────────────────────────────────
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
    }).join(","))
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
};

const exportToPDF = (title: string, headers: string[], rows: any[][], filename: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { color: #0E898F; margin-bottom: 10px; }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #0E898F; color: white; padding: 10px; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <div class="meta">Generated on: ${new Date().toLocaleString("en-IN")}</div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      <div class="footer">Pharmacy Management System</div>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

const exportToWord = (title: string, headers: string[], rows: any[][], filename: string) => {
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
    <head><meta charset='utf-8'><title>${title}</title></head>
    <body>
      <h2 style="color:#0E898F">${title}</h2>
      <p style="color:#64748b;font-size:12px">Generated on: ${new Date().toLocaleString("en-IN")}</p>
      <table border="1" style="border-collapse:collapse;width:100%;font-size:11px">
        <tr style="background:#0E898F;color:white">${headers.map(h => `<th style="padding:8px">${h}</th>`).join("")}</tr>
        ${rows.map(row => `<tr>${row.map(c => `<td style="padding:6px 8px">${c}</td>`).join("")}</tr>`).join("")}
      </table>
      <p style="font-size:10px;color:#94a3b8;margin-top:20px">Pharmacy Management System</p>
    </body>
    </html>
  `;
  const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.doc`;
  link.click();
};

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  EMERGENCY: { label: "Emergency", color: "#dc2626", bg: "#fef2f2" },
  ICU: { label: "ICU", color: "#9333ea", bg: "#faf5ff" },
  IPD: { label: "IPD", color: "#2563eb", bg: "#eff6ff" },
  URGENT: { label: "Urgent", color: "#ea580c", bg: "#fff7ed" },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PharmacyDashboard({ profile, user, activeTab }: { profile: any; user: any; activeTab?: string }) {
  const [tab, setTab] = useState<"overview" | "queue" | "inventory" | "billing" | "reports">("overview");
  // Internal sub-tab for inventory section
  const [inventoryTab, setInventoryTab] = useState<"medicines" | "purchases" | "suppliers" | "deptStock">("deptStock");

  // Sync external activeTab into internal state
  React.useEffect(() => {
    if (activeTab && ["overview","queue","inventory","billing","reports"].includes(activeTab)) {
      setTab(activeTab as any);
    }
  }, [activeTab]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState({ pending: 0, dispensed: 0, total: 0 });
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueSearch, setQueueSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState<"all" | "pending" | "dispensed" | "HOLD" | "SKIPPED">("pending");
  const [queueSourceFilter, setQueueSourceFilter] = useState<"all" | "OPD" | "IPD" | "EMERGENCY">("all");
  const [queueDate, setQueueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expandedRx, setExpandedRx] = useState<string | null>(null);
  // Queue Multi-select
  const [selectedQueue, setSelectedQueue] = useState<Set<string>>(new Set());
  const [queueBulkDeleting, setQueueBulkDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteRemark, setBulkDeleteRemark] = useState("");
  const [dispensingId, setDispensingId] = useState<string | null>(null);
  const [dispenseNotes, setDispenseNotes] = useState("");
  // Queue CRUD extras
  const [queueViewModal, setQueueViewModal] = useState<any>(null);
  const [rxActionTarget, setRxActionTarget] = useState<any>(null);
  const [rxActionType, setRxActionType] = useState<"skip" | "hold" | "resume">("skip");
  const [rxActionNotes, setRxActionNotes] = useState("");
  const [rxActioning, setRxActioning] = useState(false);
  const [rxDeleteRemark, setRxDeleteRemark] = useState("");
  // Bill view for queue items
  const [rxBillModal, setRxBillModal] = useState<{ rx: any; bill: any | null } | null>(null);
  const [rxBillLoading, setRxBillLoading] = useState<string | null>(null);
  // Manual Rx creation
  const [rxCreateModal, setRxCreateModal] = useState(false);
  const [rxCreateForm, setRxCreateForm] = useState({ patientId:"", patientName:"", doctorId:"", diagnosis:"", notes:"", paymentAction:"none" as "collect"|"send_to_billing"|"none", paymentMethod:"CASH", discount:"0", billingNote:"", transactionId:"", billingSubdeptId:"", medications:[{ name:"", dosage:"", frequency:"", duration:"", quantity:"1", price:"0", instructions:"" }] });
  const [rxCreateSaving, setRxCreateSaving] = useState(false);
  const [rxCreateError, setRxCreateError] = useState("");
  const [rxCreatePatientSearch, setRxCreatePatientSearch] = useState("");
  const [rxCreatePatients, setRxCreatePatients] = useState<any[]>([]);
  const [rxCreateDoctors, setRxCreateDoctors] = useState<any[]>([]);
  const [rxPatientSearching, setRxPatientSearching] = useState(false);
  const [rxCreateManualPatient, setRxCreateManualPatient] = useState(false);
  const [rxManualPatientForm, setRxManualPatientForm] = useState({ name:"", phone:"", gender:"MALE" });
  // Dispense modal
  const [dispenseModalItem, setDispenseModalItem] = useState<QueueItem | null>(null);
  // Counter Sale modal
  const [counterSaleModal, setCounterSaleModal] = useState(false);
  const [csItems, setCsItems] = useState<{ inventoryItemId: string; name: string; quantity: string; unitPrice: string; availableStock: number }[]>([{ inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", availableStock: 0 }]);
  const [csPatientId, setCsPatientId] = useState("");
  const [csPatientSearch, setCsPatientSearch] = useState("");
  const [csPatients, setCsPatients] = useState<any[]>([]);
  const [csPatientSearching, setCsPatientSearching] = useState(false);
  const [csSearchNoResults, setCsSearchNoResults] = useState(false);
  const [csPaymentMethod, setCsPaymentMethod] = useState("CASH");
  const [csDiscount, setCsDiscount] = useState("0");
  const [csRemarks, setCsRemarks] = useState("");
  const [csTransactionId, setCsTransactionId] = useState("");
  const [csSaving, setCsSaving] = useState(false);
  const [csError, setCsError] = useState("");
  const [csManualPatient, setCsManualPatient] = useState(false);
  const [csManualForm, setCsManualForm] = useState({ name: "", phone: "", gender: "MALE" });
  // Counter Sale History
  const [csHistoryModal, setCsHistoryModal] = useState(false);
  const [csHistory, setCsHistory] = useState<any[]>([]);
  const [csHistoryLoading, setCsHistoryLoading] = useState(false);
  // Counter Sale Purchase Request
  const [csPurchaseRequestModal, setCsPurchaseRequestModal] = useState(false);
  const [csPurchaseRequestItem, setCsPurchaseRequestItem] = useState<{ name: string; quantity: number } | null>(null);
  // Counter Sale Item Search
  const [csItemSearch, setCsItemSearch] = useState<Record<number, string>>({});
  const [csItemSearchFocused, setCsItemSearchFocused] = useState<Record<number, boolean>>({});
  // Success Modal (replaces alert())
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string; details: string[] }>({ open: false, title: "", message: "", details: [] });
  // Delete queue item
  const [rxDeleteTarget, setRxDeleteTarget] = useState<any>(null);
  const [rxDeleting, setRxDeleting] = useState(false);
  // Substitute modal
  const [substituteModal, setSubstituteModal] = useState<{ itemId: string; name: string; rxId: string; medIdx: number } | null>(null);
  const [substituteResults, setSubstituteResults] = useState<any[]>([]);
  const [substituteLoading, setSubstituteLoading] = useState(false);

  // Real-time Prescription Notifications
  const [newRxNotification, setNewRxNotification] = useState<any>(null);
  const [rxNotificationSound] = useState(() => typeof Audio !== "undefined" ? new Audio("/notification.mp3") : null);
  const notificationEsRef = useRef<EventSource | null>(null);

  // Department Stock (from Central Store transfers)
  const [deptStock, setDeptStock] = useState<any>(null);
  const [deptStockLoading, setDeptStockLoading] = useState(false);

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invSearch, setInvSearch] = useState("");
  const [invFilter, setInvFilter] = useState<"all" | "low" | "expiring">("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  // Inventory Multi-select
  const [selectedInventory, setSelectedInventory] = useState<Set<string>>(new Set());
  const [invBulkDeleting, setInvBulkDeleting] = useState(false);
  // Inventory CRUD
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [invEditing, setInvEditing] = useState<InventoryItem | null>(null);
  const [invForm, setInvForm] = useState<any>({
    name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "",
    unit: "pcs", packSize: "", sku: "", barcode: "", hsnCode: "",
    minStock: 5, maxStock: null, reorderLevel: null, reorderQty: null,
    purchasePrice: 0, mrp: 0, sellingPrice: 0, discount: 0, gst: 0,
    location: "Pharmacy Store", rackNumber: "", tempRequirement: "Room Temp",
    drugSchedule: "OTC", requiresRx: false, isActive: true, description: ""
  });
  const [invSaving, setInvSaving] = useState(false);
  const [invDeleteTarget, setInvDeleteTarget] = useState<InventoryItem | null>(null);
  const [invDeleting, setInvDeleting] = useState(false);

  // Purchases
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  // Purchase CRUD
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState<any>({
    supplierId: "",
    purchaseNo: "",
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: "",
    notes: "",
    discount: 0,
    taxPercent: 0,
    shippingCharges: 0,
    items: [{ itemId: "", quantity: 1, price: 0, sellingPrice: 0, mrp: 0, batchNumber: "", expiryDate: "" }]
  });
  const [purchaseSaving, setPurchaseSaving] = useState(false);

  // Suppliers CRUD
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierEditing, setSupplierEditing] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState<any>({
    name: "", contactPerson: "", phone: "", email: "", gstNumber: "",
    address1: "", city: "", state: "", pincode: "", notes: ""
  });
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [supplierDeleteTarget, setSupplierDeleteTarget] = useState<any>(null);
  const [supplierDeleting, setSupplierDeleting] = useState(false);

  // Appointments CRUD
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptSearch, setApptSearch] = useState("");
  const [apptStatusFilter, setApptStatusFilter] = useState<"all"|"SCHEDULED"|"CONFIRMED"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED">("all");
  const [apptDateFilter, setApptDateFilter] = useState("");
  const [apptPagination, setApptPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [apptPage, setApptPage] = useState(1);
  // Appt view/edit
  const [apptViewModal, setApptViewModal] = useState<any>(null);
  const [apptEditModal, setApptEditModal] = useState<any>(null);
  const [apptEditForm, setApptEditForm] = useState<any>({});
  const [apptEditSaving, setApptEditSaving] = useState(false);
  const [apptCancelTarget, setApptCancelTarget] = useState<any>(null);
  const [apptCancelling, setApptCancelling] = useState(false);
  // Appt booking
  const [apptBookModal, setApptBookModal] = useState(false);
  const [apptBookForm, setApptBookForm] = useState({ patientId:"", patientName:"", doctorId:"", appointmentDate:"", timeSlot:"", type:"OPD", consultationFee:"", notes:"" });
  const [apptBookSaving, setApptBookSaving] = useState(false);
  const [apptBookError, setApptBookError] = useState("");
  const [apptDoctors, setApptDoctors] = useState<any[]>([]);
  const [apptPatientSearch, setApptPatientSearch] = useState("");
  const [apptPatients, setApptPatients] = useState<any[]>([]);
  const [apptSlots, setApptSlots] = useState<string[]>([]);
  const [apptSlotsLoading, setApptSlotsLoading] = useState(false);

  // Billing
  const [bills, setBills] = useState<PharmacyBill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billSearch, setBillSearch] = useState("");
  const [billFilter, setBillFilter] = useState<"all" | "PENDING" | "PAID" | "PARTIALLY_PAID">("all");
  const [billSort, setBillSort] = useState<"newest"|"oldest"|"name_asc"|"name_desc"|"total_high"|"total_low"|"status_paid"|"status_pending">("newest");
  const [billSortOpen, setBillSortOpen] = useState(false);
  const billSortRef = useRef<HTMLDivElement>(null);
  const [paymentModal, setPaymentModal] = useState<PharmacyBill | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "CASH", transactionId: "", notes: "" });
  const [payingBill, setPayingBill] = useState(false);
  const [billViewModal, setBillViewModal] = useState<any>(null);
  const [billInvoiceModal, setBillInvoiceModal] = useState<any>(null);
  const billPrintRef = useRef<HTMLDivElement>(null);
  const [hospitalInfo, setHospitalInfo] = useState<{name:string;address?:string;phone?:string;email?:string;logo?:string;gstNumber?:string}>({ name: "Pharmacy" });

  // Dispense Form & Transfer
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [dispenseForm, setDispenseForm] = useState<any>({});
  const [transferTo, setTransferTo] = useState<string>("");

  useEffect(() => {
    api("/api/config/subdepartments?limit=50").then(d => {
      if (d.success) setSubDepts(d.data?.data || d.data || []);
    });
  }, []);

  // ── Load Stats ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const res = await api("/api/pharmacy/stats");
    if (res.success) setStats(res.data);
    setStatsLoading(false);
  }, []);

  // ── Load Queue ──
  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    const statusParam = queueFilter === "all" ? "all" : queueFilter === "dispensed" ? "COMPLETED" : queueFilter === "HOLD" ? "HOLD" : queueFilter === "SKIPPED" ? "SKIPPED" : "";
    const res = await api(`/api/pharmacy/queue?status=${statusParam}&search=${encodeURIComponent(queueSearch)}&date=${queueDate}`);
    if (res.success) {
      setQueue(res.data.queue || []);
      setQueueStats(res.data.stats || { pending: 0, dispensed: 0, total: 0 });
    }
    setQueueLoading(false);
  }, [queueFilter, queueSearch, queueDate]);

  // ── Skip / Hold / Resume Rx ──
  const handleRxAction = async () => {
    if (!rxActionTarget) return;
    setRxActioning(true);
    const res = await api("/api/pharmacy/queue", "PATCH", {
      prescriptionId: rxActionTarget.id,
      workflowId: rxActionTarget.workflowId,
      action: rxActionType,
      notes: rxActionNotes || undefined,
    });
    setRxActioning(false);
    if (res.success) {
      setRxActionTarget(null);
      setRxActionNotes("");
      loadQueue();
    }
  };

  // ── Create Manual Rx ──
  const handleCreateRx = async () => {
    setRxCreateError("");
    let patientId = rxCreateForm.patientId;

    // If manual patient mode, register the patient first
    if (rxCreateManualPatient) {
      if (!rxManualPatientForm.name.trim()) { setRxCreateError("Patient name is required"); return; }
      if (!rxManualPatientForm.phone.trim()) { setRxCreateError("Patient phone is required"); return; }
      setRxCreateSaving(true);
      const pRes = await api("/api/patients", "POST", {
        name: rxManualPatientForm.name.trim(),
        phone: rxManualPatientForm.phone.trim(),
        gender: rxManualPatientForm.gender || "MALE",
      });
      if (!pRes.success) {
        setRxCreateSaving(false);
        setRxCreateError(pRes.message || "Failed to register patient");
        return;
      }
      patientId = pRes.data?.patient?.id || pRes.data?.id;
      if (!patientId) { setRxCreateSaving(false); setRxCreateError("Patient registered but ID not returned"); return; }
    }

    if (!patientId) { setRxCreateError("Please select or enter a patient"); return; }
    const validMeds = rxCreateForm.medications.filter(m => m.name.trim());
    if (validMeds.length === 0) { setRxCreateError("Add at least one medication"); return; }
    if (!rxCreateManualPatient) setRxCreateSaving(true);
    const res = await api("/api/pharmacy/queue", "POST", {
      patientId,
      doctorId: rxCreateForm.doctorId || null,
      diagnosis: rxCreateForm.diagnosis || null,
      notes: rxCreateForm.notes || null,
      paymentAction: rxCreateForm.paymentAction,
      paymentMethod: rxCreateForm.paymentMethod,
      discount: rxCreateForm.discount,
      billingNote: rxCreateForm.billingNote,
      transactionId: rxCreateForm.transactionId,
      billingSubdeptId: rxCreateForm.billingSubdeptId || undefined,
      medications: validMeds.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration, quantity: parseInt(m.quantity) || 1, price: parseFloat(m.price) || 0, instructions: m.instructions })),
    });
    setRxCreateSaving(false);
    if (res.success) {
      setRxCreateModal(false);
      setRxCreateForm({ patientId:"", patientName:"", doctorId:"", diagnosis:"", notes:"", paymentAction:"none", paymentMethod:"CASH", discount:"0", billingNote:"", transactionId:"", billingSubdeptId:"", medications:[{ name:"", dosage:"", frequency:"", duration:"", quantity:"1", price:"0", instructions:"" }] });
      setRxCreatePatients([]);
      setRxCreatePatientSearch("");
      setRxCreateManualPatient(false);
      setRxManualPatientForm({ name:"", phone:"", gender:"MALE" });
      loadQueue();
      loadStats();
    } else {
      setRxCreateError(res.message || "Failed to create prescription");
    }
  };

  // ── Patient search for Walk-in Rx (useEffect-based) ──
  // Loads recent patients on modal open, then searches as user types
  useEffect(() => {
    if (!rxCreateModal || rxCreateManualPatient || rxCreateForm.patientId) return;
    const query = rxCreatePatientSearch.trim();
    // If search is empty → load recent patients; if < 2 chars → clear
    if (!query) {
      // Load recent patients when modal first opens
      setRxPatientSearching(true);
      const controller = new AbortController();
      fetch(`/api/patients?limit=15&sortBy=createdAt&sortOrder=desc`, { credentials: "include", signal: controller.signal })
        .then(r => r.json())
        .then(res => {
          const patients = res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : [];
          setRxCreatePatients(patients);
        })
        .catch(() => {})
        .finally(() => setRxPatientSearching(false));
      return () => controller.abort();
    }
    if (query.length < 2) { setRxCreatePatients([]); return; }

    // Debounced search
    setRxPatientSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        // Try autocomplete endpoint first
        const r = await fetch(`/api/patients?q=${encodeURIComponent(query)}`, { credentials: "include", signal: controller.signal });
        const res = await r.json();
        let patients = res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : [];
        // Fallback to paginated search
        if (patients.length === 0) {
          const r2 = await fetch(`/api/patients?search=${encodeURIComponent(query)}&limit=15`, { credentials: "include", signal: controller.signal });
          const res2 = await r2.json();
          patients = res2.success ? (Array.isArray(res2.data) ? res2.data : res2.data?.data || []) : [];
        }
        setRxCreatePatients(patients);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("[Rx patient search]", err);
      }
      setRxPatientSearching(false);
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [rxCreatePatientSearch, rxCreateModal, rxCreateManualPatient, rxCreateForm.patientId]);

  // ── Counter Sale: patient search (useEffect-based) ──
  useEffect(() => {
    if (!counterSaleModal || csManualPatient || csPatientId) return;
    const query = csPatientSearch.trim();
    setCsSearchNoResults(false);
    if (!query) {
      setCsPatientSearching(true);
      const controller = new AbortController();
      fetch(`/api/patients?limit=15&sortBy=createdAt&sortOrder=desc`, { credentials: "include", signal: controller.signal })
        .then(r => r.json())
        .then(res => { setCsPatients(res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : []); })
        .catch(() => {})
        .finally(() => setCsPatientSearching(false));
      return () => controller.abort();
    }
    if (query.length < 2) { setCsPatients([]); return; }
    setCsPatientSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/patients?search=${encodeURIComponent(query)}&limit=15`, { credentials: "include", signal: controller.signal });
        const res = await r.json();
        const patients = res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : [];
        setCsPatients(patients);
        if (patients.length === 0) setCsSearchNoResults(true);
      } catch (err: any) { if (err.name !== "AbortError") console.error("[CS patient search]", err); }
      setCsPatientSearching(false);
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [csPatientSearch, counterSaleModal, csManualPatient, csPatientId]);

  // ── Counter Sale: submit ──
  const handleCounterSale = async () => {
    setCsError("");
    let patientId = csPatientId;

    // If manual patient, register first
    if (csManualPatient) {
      if (!csManualForm.name.trim()) { setCsError("Patient name is required"); return; }
      if (!csManualForm.phone.trim()) { setCsError("Patient phone is required"); return; }
      setCsSaving(true);
      const pRes = await api("/api/patients", "POST", { name: csManualForm.name.trim(), phone: csManualForm.phone.trim(), gender: csManualForm.gender || "MALE" });
      if (!pRes.success) { setCsSaving(false); setCsError(pRes.message || "Failed to register patient"); return; }
      patientId = pRes.data?.patient?.id || pRes.data?.id;
      if (!patientId) { setCsSaving(false); setCsError("Patient registered but ID not returned"); return; }
    }

    if (!patientId) { setCsError("Please select or enter a patient"); return; }
    const validItems = csItems.filter(i => i.inventoryItemId && i.name.trim());
    if (validItems.length === 0) { setCsError("Add at least one item from inventory"); return; }

    // Validate stock availability — account for combined quantities of same item across rows
    const combinedQty: Record<string, number> = {};
    validItems.forEach(i => {
      combinedQty[i.inventoryItemId] = (combinedQty[i.inventoryItemId] || 0) + (parseInt(i.quantity) || 0);
    });
    const stockIssues = Object.entries(combinedQty).filter(([itemId, totalQty]) => {
      const item = validItems.find(i => i.inventoryItemId === itemId);
      return item && totalQty > item.availableStock;
    });
    if (stockIssues.length > 0) {
      const itemNames = stockIssues.map(([itemId]) => validItems.find(i => i.inventoryItemId === itemId)?.name || itemId).join(", ");
      setCsError(`Combined quantity exceeds available stock for: ${itemNames}. Please adjust.`);
      return;
    }

    if (!csManualPatient) setCsSaving(true);
    const res = await api("/api/pharmacy/counter-sale", "POST", {
      patientId,
      items: validItems.map(i => ({ 
        inventoryItemId: i.inventoryItemId,
        name: i.name, 
        quantity: parseInt(i.quantity) || 1, 
        unitPrice: parseFloat(i.unitPrice) || 0 
      })),
      paymentMethod: csPaymentMethod,
      transactionId: csTransactionId || null,
      discount: parseFloat(csDiscount) || 0,
      remarks: csRemarks || null,
      notifyAdmin: true,
      notifyReception: true,
    });
    setCsSaving(false);
    if (res.success) {
      setCounterSaleModal(false);
      setCsItems([{ inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", availableStock: 0 }]);
      setCsPatientId(""); setCsPatientSearch(""); setCsPatients([]); setCsSearchNoResults(false);
      setCsPaymentMethod("CASH"); setCsDiscount("0"); setCsRemarks(""); setCsTransactionId("");
      setCsManualPatient(false); setCsManualForm({ name: "", phone: "", gender: "MALE" });
      loadStats();
      loadBills();
      loadInventory();
      setSuccessModal({ open: true, title: "Counter Sale Completed!", message: `Bill: ${res.data?.billNo || ""} — ₹${res.data?.total || 0}`, details: ["Notification sent to Hospital Admin", "Notification sent to Reception Billing"] });
    } else {
      setCsError(res.message || "Failed to process counter sale");
    }
  };

  // ── Load Counter Sale History ──
  const loadCsHistory = useCallback(async () => {
    setCsHistoryLoading(true);
    const res = await api("/api/pharmacy/counter-sale/history?limit=50");
    if (res.success) setCsHistory(res.data || []);
    setCsHistoryLoading(false);
  }, []);

  // ── Create Purchase Request from Counter Sale ──
  const handleCreatePurchaseRequest = async (itemName: string, quantity: number, supplierId?: string) => {
    const res = await api("/api/subdept/inventory/purchase-request", "POST", {
      itemName,
      quantity,
      supplierId,
      source: "Counter Sale - Out of Stock",
      priority: "HIGH",
    });
    if (res.success) {
      setCsPurchaseRequestModal(false);
      setCsPurchaseRequestItem(null);
      setSuccessModal({ open: true, title: "Purchase Request Created!", message: `Request created for ${itemName}. You'll be notified when stock arrives.`, details: [] });
    } else {
      setSuccessModal({ open: true, title: "Purchase Request Failed", message: res.message || "Failed to create purchase request", details: [] });
    }
  };

  // ── Fetch Bill for a Queue Item ──
  const fetchRxBill = async (item: any) => {
    setRxBillLoading(item.id);
    const res = await api(`/api/billing?prescriptionId=${item.id}&limit=1`);
    setRxBillLoading(null);
    const bills = res.success ? (res.data?.bills || res.data?.data || []) : [];
    setRxBillModal({ rx: item, bill: bills[0] || null });
  };

  // ── Delete Rx from Queue ──
  const handleDeleteRx = async () => {
    if (!rxDeleteTarget) return;
    if (!rxDeleteRemark.trim()) {
      alert("Please enter a remark/reason for deletion");
      return;
    }
    setRxDeleting(true);
    const res = await api(`/api/pharmacy/queue?id=${rxDeleteTarget.id}&workflowId=${rxDeleteTarget.workflowId || ""}&remark=${encodeURIComponent(rxDeleteRemark)}`, "DELETE");
    setRxDeleting(false);
    if (res.success) {
      setRxDeleteTarget(null);
      setRxDeleteRemark("");
      loadQueue();
      loadStats();
    }
  };

  // ── Search Substitute Inventory ──
  const openSubstitute = useCallback(async (medName: string, rxId: string, medIdx: number) => {
    setSubstituteModal({ itemId: "", name: medName, rxId, medIdx });
    setSubstituteLoading(true);
    setSubstituteResults([]);
    const nameWords = medName.split(" ").filter(Boolean).slice(0, 2).join(" ");
    const res = await api(`/api/config/inventory?search=${encodeURIComponent(nameWords)}&limit=20`);
    if (res.success) setSubstituteResults(res.data?.data || res.data || []);
    setSubstituteLoading(false);
  }, []);

  // ── Load Department Stock (from Central Store transfers) ──
  const loadDeptStock = useCallback(async () => {
    setDeptStockLoading(true);
    const res = await api("/api/dept-inventory");
    if (res.success) setDeptStock(res.data);
    setDeptStockLoading(false);
  }, []);

  // ── Load Inventory ──
  const loadInventory = useCallback(async () => {
    setInvLoading(true);
    const res = await api(`/api/subdept/inventory?search=${encodeURIComponent(invSearch)}&limit=200`);
    if (res.success) {
      const items = res.data?.data || res.data || [];
      setInventory(items);
    }
    setInvLoading(false);
  }, [invSearch]);

  // ── Load Suppliers ──
  const loadSuppliers = useCallback(async () => {
    const res = await api("/api/subdept/inventory/supplier");
    if (res.success) setSuppliers(res.data || []);
  }, []);

  // ── Inventory CRUD ──
  const openInvModal = (item?: InventoryItem) => {
    if (item) {
      setInvEditing(item);
      setInvForm({
        name: item.name || "", genericName: item.genericName || "", brandName: item.brandName || "",
        category: item.category || "Medicine", subCategory: item.subCategory || "",
        unit: item.unit || "pcs", packSize: item.packSize || "", sku: item.sku || "",
        barcode: item.barcode || "", hsnCode: item.hsnCode || "",
        minStock: item.minStock ?? 5, maxStock: item.maxStock || null,
        reorderLevel: item.reorderLevel || null, reorderQty: item.reorderQty || null,
        purchasePrice: item.purchasePrice || 0, mrp: item.mrp || 0,
        sellingPrice: item.sellingPrice || 0, discount: item.discount || 0, gst: item.gst || 0,
        location: item.location || "Pharmacy Store", rackNumber: item.rackNumber || "",
        tempRequirement: item.tempRequirement || "Room Temp",
        drugSchedule: item.drugSchedule || "OTC", requiresRx: item.requiresRx || false,
        isActive: item.isActive !== false, description: item.description || ""
      });
    } else {
      setInvEditing(null);
      setInvForm({
        name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "",
        unit: "pcs", packSize: "", sku: "", barcode: "", hsnCode: "",
        minStock: 5, maxStock: null, reorderLevel: null, reorderQty: null,
        purchasePrice: 0, mrp: 0, sellingPrice: 0, discount: 0, gst: 0,
        location: "Pharmacy Store", rackNumber: "", tempRequirement: "Room Temp",
        drugSchedule: "OTC", requiresRx: false, isActive: true, description: ""
      });
    }
    setInvModalOpen(true);
  };

  const saveInventory = async () => {
    setInvSaving(true);
    const payload = { ...invForm };
    
    // Validation
    if (!payload.name || payload.name.trim().length < 2) {
      alert("Medicine name is required (min 2 characters)");
      setInvSaving(false);
      return;
    }
    
    // Clean up empty strings to null for optional fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === "") payload[key] = null;
    });
    
    // Ensure numeric fields are numbers
    payload.purchasePrice = Number(payload.purchasePrice) || 0;
    payload.mrp = Number(payload.mrp) || 0;
    payload.sellingPrice = Number(payload.sellingPrice) || 0;
    payload.gst = Number(payload.gst) || 0;
    payload.discount = Number(payload.discount) || 0;
    payload.minStock = Number(payload.minStock) || 0;
    payload.maxStock = payload.maxStock ? Number(payload.maxStock) : null;
    payload.reorderLevel = payload.reorderLevel ? Number(payload.reorderLevel) : null;
    payload.reorderQty = payload.reorderQty ? Number(payload.reorderQty) : null;
    
    const url = "/api/subdept/inventory";
    const method = invEditing ? "PUT" : "POST";
    const body = invEditing ? { id: invEditing.id, ...payload } : payload;
    
    try {
      const res = await api(url, method, body);
      setInvSaving(false);
      
      if (res.success) {
        setInvModalOpen(false);
        loadInventory();
      } else {
        alert(res.message || "Failed to save medicine");
      }
    } catch (e: any) {
      setInvSaving(false);
      alert("Error saving medicine: " + (e.message || "Unknown error"));
    }
  };

  const deleteInventory = async () => {
    if (!invDeleteTarget) return;
    setInvDeleting(true);
    const res = await api(`/api/subdept/inventory?id=${invDeleteTarget.id}`, "DELETE");
    setInvDeleting(false);
    if (res.success) {
      setInvDeleteTarget(null);
      loadInventory();
    }
  };

  // ── Purchase CRUD ──
  const openPurchaseModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setPurchaseForm({
      supplierId: "",
      purchaseNo: `PO-${Date.now().toString(36).toUpperCase()}`,
      orderDate: today,
      expectedDeliveryDate: "",
      notes: "",
      discount: 0,
      taxPercent: 0,
      shippingCharges: 0,
      items: [{ itemId: "", quantity: 1, price: 0, sellingPrice: 0, mrp: 0, batchNumber: "", expiryDate: "" }]
    });
    setPurchaseModalOpen(true);
    loadSuppliers();
  };

  const addPurchaseItem = () => {
    setPurchaseForm((prev: any) => ({
      ...prev,
      items: [...prev.items, { itemId: "", quantity: 1, price: 0, sellingPrice: 0, mrp: 0, batchNumber: "", expiryDate: "" }]
    }));
  };

  const removePurchaseItem = (idx: number) => {
    setPurchaseForm((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== idx)
    }));
  };

  const updatePurchaseItem = (idx: number, field: string, value: any) => {
    setPurchaseForm((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any, i: number) => i === idx ? { ...item, [field]: value } : item)
    }));
  };

  const savePurchase = async () => {
    setPurchaseSaving(true);
    
    // Build payload with proper calculations
    const payload = {
      supplierId: purchaseForm.supplierId,
      purchaseNo: purchaseForm.purchaseNo,
      notes: purchaseForm.notes || undefined,
      items: purchaseForm.items.map((item: any) => ({
        itemId: item.itemId,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        sellingPrice: Number(item.sellingPrice) || 0,
        batchNumber: item.batchNumber || undefined,
        expiryDate: item.expiryDate || undefined,
      })).filter((item: any) => item.itemId && item.quantity > 0),
    };
    
    // Validation
    if (!payload.supplierId) {
      alert("Please select a supplier");
      setPurchaseSaving(false);
      return;
    }
    if (payload.items.length === 0) {
      alert("Please add at least one item with valid quantity");
      setPurchaseSaving(false);
      return;
    }
    
    try {
      const res = await api("/api/subdept/inventory/purchase", "POST", payload);
      setPurchaseSaving(false);
      if (res.success) {
        setPurchaseModalOpen(false);
        loadPurchases();
        loadInventory();
      } else {
        alert(res.message || "Failed to create purchase");
      }
    } catch (e: any) {
      setPurchaseSaving(false);
      alert("Error creating purchase: " + (e.message || "Unknown error"));
    }
  };

  // ── Supplier CRUD ──
  const openSupplierModal = (supplier?: any) => {
    if (supplier) {
      setSupplierEditing(supplier);
      setSupplierForm({
        name: supplier.name || "", contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "", email: supplier.email || "", gstNumber: supplier.gstNumber || "",
        address1: supplier.address1 || "", city: supplier.city || "",
        state: supplier.state || "", pincode: supplier.pincode || "", notes: supplier.notes || ""
      });
    } else {
      setSupplierEditing(null);
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", gstNumber: "", address1: "", city: "", state: "", pincode: "", notes: "" });
    }
    setSupplierModalOpen(true);
  };

  const saveSupplier = async () => {
    setSupplierSaving(true);
    const url = "/api/subdept/inventory/supplier";
    const method = supplierEditing ? "PUT" : "POST";
    const body = supplierEditing ? { id: supplierEditing.id, ...supplierForm } : supplierForm;
    const res = await api(url, method, body);
    setSupplierSaving(false);
    if (res.success) {
      setSupplierModalOpen(false);
      loadSuppliers();
    } else {
      alert(res.message || "Failed to save supplier");
    }
  };

  const deleteSupplier = async () => {
    if (!supplierDeleteTarget) return;
    setSupplierDeleting(true);
    const res = await api(`/api/subdept/inventory/supplier?id=${supplierDeleteTarget.id}`, "DELETE");
    setSupplierDeleting(false);
    if (res.success) {
      setSupplierDeleteTarget(null);
      loadSuppliers();
    }
  };

  // ── Load Purchases ──
  const loadPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    const [pRes, sRes] = await Promise.all([
      api("/api/pharmacy/purchases"),
      api("/api/pharmacy/suppliers"),
    ]);
    if (pRes.success) setPurchases(pRes.data?.data || pRes.data || []);
    if (sRes.success) setSuppliers(sRes.data || []);
    setPurchasesLoading(false);
  }, []);

  // ── Load Appointments ──
  const loadAppointments = useCallback(async () => {
    setApptLoading(true);
    const params = new URLSearchParams({ limit: "50", page: String(apptPage), sortBy: "appointmentDate", sortOrder: "desc" });
    if (apptSearch) params.set("search", apptSearch);
    if (apptStatusFilter !== "all") params.set("status", apptStatusFilter);
    if (apptDateFilter) params.set("date", apptDateFilter);
    const res = await api(`/api/appointments?${params.toString()}`);
    if (res.success) {
      setAppointments(res.data?.data || []);
      setApptPagination({ total: res.data?.pagination?.total || 0, page: res.data?.pagination?.page || 1, totalPages: res.data?.pagination?.totalPages || 1 });
    }
    setApptLoading(false);
  }, [apptSearch, apptStatusFilter, apptDateFilter, apptPage]);

  // ── Load Doctors (for booking form) ──
  const loadApptDoctors = useCallback(async () => {
    const res = await api("/api/config/doctors?simple=true");
    if (res.success) setApptDoctors(Array.isArray(res.data) ? res.data : res.data?.data || []);
  }, []);

  // ── Search Patients (for booking form) ──
  const searchApptPatients = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setApptPatients([]); return; }
    const res = await api(`/api/patients?q=${encodeURIComponent(q)}`);
    if (res.success) setApptPatients(Array.isArray(res.data) ? res.data : res.data?.data || []);
  }, []);

  // ── Load Time Slots ──
  const loadApptSlots = useCallback(async (doctorId: string, date: string) => {
    if (!doctorId || !date) return;
    setApptSlotsLoading(true);
    const res = await api(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`);
    if (res.success) setApptSlots(res.data?.available || []);
    setApptSlotsLoading(false);
  }, []);

  // ── Book Appointment ──
  const handleBookAppointment = async () => {
    setApptBookError("");
    if (!apptBookForm.patientId) { setApptBookError("Please select a patient"); return; }
    if (!apptBookForm.doctorId) { setApptBookError("Please select a doctor"); return; }
    if (!apptBookForm.appointmentDate) { setApptBookError("Please select a date"); return; }
    if (!apptBookForm.timeSlot) { setApptBookError("Please select a time slot"); return; }
    setApptBookSaving(true);
    const res = await api("/api/appointments", "POST", {
      patientId: apptBookForm.patientId,
      doctorId: apptBookForm.doctorId,
      appointmentDate: apptBookForm.appointmentDate,
      timeSlot: apptBookForm.timeSlot,
      type: apptBookForm.type,
      consultationFee: apptBookForm.consultationFee ? parseFloat(apptBookForm.consultationFee) : null,
      notes: apptBookForm.notes || null,
    });
    setApptBookSaving(false);
    if (res.success) {
      setApptBookModal(false);
      setApptBookForm({ patientId:"", patientName:"", doctorId:"", appointmentDate:"", timeSlot:"", type:"OPD", consultationFee:"", notes:"" });
      setApptPatients([]);
      setApptPatientSearch("");
      setApptSlots([]);
      loadAppointments();
    } else {
      setApptBookError(res.message || "Failed to book appointment");
    }
  };

  // ── Update Appointment ──
  const handleUpdateAppointment = async () => {
    if (!apptEditModal) return;
    setApptEditSaving(true);
    const payload: any = {};
    if (apptEditForm.status) payload.status = apptEditForm.status;
    if (apptEditForm.appointmentDate) payload.appointmentDate = apptEditForm.appointmentDate;
    if (apptEditForm.timeSlot) payload.timeSlot = apptEditForm.timeSlot;
    if (apptEditForm.notes !== undefined) payload.notes = apptEditForm.notes;
    if (apptEditForm.consultationFee !== undefined) payload.consultationFee = apptEditForm.consultationFee ? parseFloat(apptEditForm.consultationFee) : null;
    const res = await api(`/api/appointments/${apptEditModal.id}`, "PUT", payload);
    setApptEditSaving(false);
    if (res.success) {
      setApptEditModal(null);
      loadAppointments();
    }
  };

  // ── Cancel Appointment ──
  const handleCancelAppointment = async () => {
    if (!apptCancelTarget) return;
    setApptCancelling(true);
    const res = await api(`/api/appointments/${apptCancelTarget.id}`, "DELETE");
    setApptCancelling(false);
    if (res.success) {
      setApptCancelTarget(null);
      loadAppointments();
    }
  };

  // ── Load Bills ──
  const loadBills = useCallback(async () => {
    setBillsLoading(true);
    const res = await api("/api/billing?limit=200&pharmacyOnly=true");
    if (res.success) {
      const allBills = Array.isArray(res.data?.bills) ? res.data.bills
        : Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
      setBills(allBills);
    }
    setBillsLoading(false);
  }, []);

  // ── Auto-load on tab change ──
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === "queue") { loadQueue(); if (inventory.length === 0) loadInventory(); } }, [tab, loadQueue]);
  useEffect(() => { if (tab === "inventory") { loadDeptStock(); loadInventory(); loadPurchases(); loadSuppliers(); } }, [tab, loadInventory, loadPurchases, loadSuppliers, loadDeptStock]);
  useEffect(() => { if (tab === "billing") loadBills(); }, [tab, loadBills]);
  useEffect(() => { if (tab === "reports" && inventory.length === 0) loadInventory(); }, [tab]);

  // ── Real-time Prescription Notifications (SSE) ──
  useEffect(() => {
    const connectSSE = () => {
      const es = new EventSource("/api/pharmacy/notifications/stream", { withCredentials: true });
      notificationEsRef.current = es;

      es.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "NEW_PRESCRIPTION" && data.prescription) {
            // Play notification sound
            if (rxNotificationSound) {
              rxNotificationSound.play().catch(() => {});
            }
            // Show notification popup
            setNewRxNotification(data.prescription);
            // Refresh queue to show new prescription
            loadQueue();
            loadStats();
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        // Retry connection after 10 seconds
        setTimeout(connectSSE, 10000);
      };
    };

    connectSSE();

    return () => {
      notificationEsRef.current?.close();
    };
  }, [loadQueue, loadStats, rxNotificationSound]);

  // ── Sync csItems availableStock when inventory data refreshes ──
  useEffect(() => {
    if (!counterSaleModal || inventory.length === 0) return;
    setCsItems(prev => prev.map(item => {
      if (!item.inventoryItemId) return item;
      const invItem = inventory.find((i: any) => i.id === item.inventoryItemId);
      if (!invItem) return { ...item, availableStock: 0 };
      const stock = invItem.totalStock || invItem.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
      return { ...item, availableStock: stock };
    }));
  }, [inventory, counterSaleModal]);

  // ── Dispense Handler (partial dispense supported) ──
  const handleDispense = async (item: QueueItem) => {
    setDispensingId(item.id);

    const formItems = dispenseForm[item.id] || item.medications?.map((m: any) => ({
        name: m.name || m.medicine,
        quantity: parseInt(m.quantity) || 1,
        inventoryItemId: m.inventoryItemId || null,
        price: parseFloat(m.price) || m.amount || 0
      })) || [];

    // Separate dispensable vs unavailable items
    const dispensableItems = formItems.filter((m: any) => {
      if (!m.inventoryItemId) return false;
      const inv = inventory.find((i: any) => i.id === m.inventoryItemId);
      if (!inv) return false;
      const available = inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
      return (m.quantity || 1) <= available;
    });

    const unavailableItems = formItems.filter((m: any) => {
      if (!m.inventoryItemId) return true;
      const inv = inventory.find((i: any) => i.id === m.inventoryItemId);
      if (!inv) return true;
      const available = inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
      return (m.quantity || 1) > available;
    });

    const unavailableNote = unavailableItems.length > 0
      ? ` | Not dispensed (stock unavailable): ${unavailableItems.map((m: any) => m.name || "item").join(", ")}`
      : "";

    const totalCharge = dispensableItems.reduce((sum: number, m: any) => sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)), 0);

    const res = await api("/api/pharmacy/queue", "PATCH", {
      prescriptionId: item.id,
      workflowId: item.workflowId,
      notes: (dispenseNotes || "Dispensed from pharmacy") + unavailableNote,
      dispensedItems: dispensableItems,
      totalCharge,
    });

    // Process transfer if selected
    if (res.success && transferTo && item.appointment?.id) {
      if (transferTo === "BILLING") {
        await api("/api/billing/transfer", "POST", {
            appointmentId: item.appointment.id,
            note: "Transferred from Pharmacy after dispensing. " + dispenseNotes
        });
      } else {
        await api(`/api/appointments/${item.appointment.id}`, "PUT", {
            subDepartmentId: transferTo,
            subDeptNote: "Transferred from Pharmacy after dispensing. " + dispenseNotes
        });
      }
    }

    setDispensingId(null);
    setDispenseNotes("");
    setTransferTo("");
    if (res.success) {
      setExpandedRx(null);
      loadQueue();
      loadStats();
      loadInventory();
      if (unavailableItems.length > 0) {
        setSuccessModal({
          open: true,
          title: unavailableItems.length === formItems.length ? "Items Not Available" : "Partially Dispensed",
          message: unavailableItems.length === formItems.length
            ? `All ${unavailableItems.length} item(s) are out of stock — marked as not dispensed yet.`
            : `${dispensableItems.length} item(s) dispensed. ${unavailableItems.length} item(s) unavailable — marked as not dispensed yet.`,
          details: unavailableItems.map((m: any) => `${m.name || "Unknown"}: not in stock`),
        });
      }
    }
  };

  // ── Hospital Info ──
  useEffect(() => {
    api("/api/hospital/details").then(r => {
      if (r.success && r.data) {
        setHospitalInfo({ name: r.data.name || "Pharmacy", address: r.data.address, phone: r.data.phone, email: r.data.email, logo: r.data.logo, gstNumber: r.data.gstNumber });
      }
    }).catch(() => {});
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (billSortRef.current && !billSortRef.current.contains(e.target as Node)) setBillSortOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Payment Handler ──
  const handlePayment = async () => {
    if (!paymentModal || !paymentForm.amount) return;
    setPayingBill(true);
    const res = await api(`/api/billing/${paymentModal.id}`, "PATCH", {
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      transactionId: paymentForm.transactionId || undefined,
      notes: paymentForm.notes || "Pharmacy payment",
    });
    setPayingBill(false);
    if (res.success) {
      const paidBill = { ...paymentModal, status: "PAID", paidAmount: parseFloat(paymentForm.amount), paymentMethod: paymentForm.method };
      setPaymentModal(null);
      setBillInvoiceModal({ bill: paidBill, method: paymentForm.method, transactionId: paymentForm.transactionId });
      setPaymentForm({ amount: "", method: "CASH", transactionId: "", notes: "" });
      loadBills();
      loadStats();
    }
  };

  // ── CSV Export ──
  const handleExportCSV = () => {
    const rows = [["Bill No","Patient","Patient ID","Items","Subtotal","Discount","Tax","Total","Paid","Status","Date"]];
    filteredBills.forEach((b: any) => {
      rows.push([
        b.billNo, b.patient?.name||"", b.patient?.patientId||"",
        String(b.billItems?.length||0),
        String(b.subtotal||0), String(b.discount||0), String(b.tax||0),
        String(b.total||0), String(b.paidAmount||0), b.status,
        b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `pharmacy-bills-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  // ── Print Invoice ──
  const handlePrintInvoice = () => {
    if (!billPrintRef.current) return;
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<html><head><title>Invoice</title><style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:0;padding:20px}
      table{width:100%;border-collapse:collapse;margin:12px 0}
      th{background:#f1f5f9;padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:#475569}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
      .right{text-align:right} .center{text-align:center}
    </style></head><body>${billPrintRef.current.innerHTML}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 400);
  };

  // ── Download PDF ──
  const handleDownloadInvoicePDF = async (bill: any) => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const fmtC = (v: number) => `Rs.${Number(v||0).toFixed(2)}`;
      doc.setFillColor(16, 185, 129); doc.rect(0, 0, pageW, 28, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text(hospitalInfo.name || "Pharmacy", 14, 12);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      if (hospitalInfo.address) doc.text(hospitalInfo.address, 14, 18);
      if (hospitalInfo.phone) doc.text(`Phone: ${hospitalInfo.phone}`, 14, 23);
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("PHARMACY INVOICE", pageW - 14, 12, { align: "right" });
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(bill.billNo, pageW - 14, 18, { align: "right" });
      doc.text(bill.createdAt ? new Date(bill.createdAt).toLocaleDateString("en-IN") : "", pageW - 14, 23, { align: "right" });
      doc.setTextColor(30, 41, 59);
      let y = 38;
      doc.setFillColor(248, 250, 252); doc.roundedRect(14, y, pageW - 28, 22, 2, 2, "F");
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("Patient Details", 18, y + 6);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`Name: ${bill.patient?.name || "—"}`, 18, y + 12);
      doc.text(`ID: ${bill.patient?.patientId || "—"}`, 18, y + 17);
      doc.text(`Phone: ${bill.patient?.phone || "—"}`, pageW / 2, y + 12);
      y += 28;
      const billItemRows = (bill.billItems || []).map((it: any, i: number) => [
        String(i + 1), it.name, String(it.quantity), fmtC(it.unitPrice), fmtC(it.amount),
      ]);
      autoTable(doc, {
        head: [["#", "Item / Medicine", "Qty", "Unit Price", "Amount"]],
        body: billItemRows.length > 0 ? billItemRows : [["—", "No items", "—", "—", "—"]],
        startY: y, margin: { left: 14, right: 14 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
      const summaryX = pageW - 80;
      doc.setFillColor(248, 250, 252); doc.roundedRect(summaryX, y, 66, 34, 2, 2, "F");
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", summaryX + 4, y + 7); doc.text(fmtC(bill.subtotal), summaryX + 62, y + 7, { align: "right" });
      if ((bill.discount || 0) > 0) { doc.text("Discount:", summaryX + 4, y + 13); doc.text(`-${fmtC(bill.discount)}`, summaryX + 62, y + 13, { align: "right" }); }
      if ((bill.tax || 0) > 0) { doc.text("Tax:", summaryX + 4, y + 19); doc.text(fmtC(bill.tax), summaryX + 62, y + 19, { align: "right" }); }
      doc.setFillColor(16, 185, 129); doc.roundedRect(summaryX, y + 26, 66, 8, 1, 1, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text("TOTAL:", summaryX + 4, y + 32); doc.text(fmtC(bill.total), summaryX + 62, y + 32, { align: "right" });
      doc.setTextColor(30, 41, 59);
      y += 42;
      if (bill.status === "PAID") { doc.setFillColor(220, 252, 231); } else { doc.setFillColor(255, 247, 237); }
      doc.roundedRect(14, y, pageW - 28, 12, 2, 2, "F");
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`Status: ${bill.status}`, 18, y + 8);
      doc.text(`Method: ${bill.paymentMethod || bill.payments?.[0]?.method || "—"}`, 70, y + 8);
      doc.text(`Paid: ${fmtC(bill.paidAmount || 0)}`, 130, y + 8);
      doc.setFontSize(8); doc.setTextColor(148, 163, 184);
      doc.text("Thank you for choosing " + (hospitalInfo.name || "Pharmacy") + " · Computer-generated invoice", pageW / 2, 285, { align: "center" });
      doc.save(`${bill.billNo || "invoice"}.pdf`);
    } catch (e) { console.error("PDF error", e); }
  };

  // ── Filter logic ──
  const filteredQueue = queue.filter(q => {
    if (queueFilter === "pending" && q.dispensed) return false;
    if (queueFilter === "dispensed" && !q.dispensed) return false;
    if (queueSourceFilter !== "all" && q.appointment?.type !== queueSourceFilter) return false;
    return true;
  });

  const filteredInventory = inventory.filter(i => {
    if (invFilter === "low" && (i.totalStock || 0) > i.minStock) return false;
    if (invFilter === "expiring") {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      const hasExpiring = i.batches?.some(b => b.expiryDate && new Date(b.expiryDate) <= thirtyDays);
      if (!hasExpiring) return false;
    }
    return true;
  });

  const filteredBills = (() => {
    let arr = (Array.isArray(bills) ? bills : []).filter((b: any) => {
      if (billFilter !== "all" && b.status !== billFilter) return false;
      if (billSearch) {
        const s = billSearch.toLowerCase();
        return b.billNo?.toLowerCase().includes(s) || b.patient?.name?.toLowerCase().includes(s) || b.patient?.patientId?.toLowerCase().includes(s);
      }
      return true;
    });
    const sorted = [...arr];
    switch (billSort) {
      case "newest":      sorted.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest":      sorted.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "name_asc":    sorted.sort((a: any, b: any) => (a.patient?.name||"").localeCompare(b.patient?.name||"")); break;
      case "name_desc":   sorted.sort((a: any, b: any) => (b.patient?.name||"").localeCompare(a.patient?.name||"")); break;
      case "total_high":  sorted.sort((a: any, b: any) => (b.total||0) - (a.total||0)); break;
      case "total_low":   sorted.sort((a: any, b: any) => (a.total||0) - (b.total||0)); break;
      case "status_paid":    sorted.sort((a: any, b: any) => (a.status === "PAID" ? -1 : 1) - (b.status === "PAID" ? -1 : 1)); break;
      case "status_pending": sorted.sort((a: any, b: any) => (a.status === "PENDING" ? -1 : 1) - (b.status === "PENDING" ? -1 : 1)); break;
    }
    return sorted;
  })();

  // ── Inventory helpers ──
  const getStockStatus = (item: InventoryItem) => {
    const total = item.totalStock || item.batches?.reduce((s, b) => s + b.remainingQty, 0) || 0;
    if (total === 0) return { label: "Out of Stock", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    if (total <= item.minStock) return { label: "Low Stock", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };
    return { label: "In Stock", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  };

  const deptName = profile?.name || "Pharmacy";

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{pharmacyStyles}</style>

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="ph-section">
          {statsLoading ? (
            <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading stats...</div>
          ) : stats ? (
            <>
              {/* 6 Stats Widgets - Compact Single Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 16 }}>
                <div className="ph-stat-card" style={{ padding: "14px 12px" }}>
                  <div className="ph-stat-icon" style={{ background: LIGHT_BG, width: 36, height: 36 }}><Package size={16} color={ACCENT} /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value" style={{ fontSize: 20 }}>{stats.totalItems}</div>
                    <div className="ph-stat-label" style={{ fontSize: 10 }}>Total Medicines</div>
                  </div>
                </div>
                <div className="ph-stat-card" style={{ padding: "14px 12px", borderColor: stats.lowStockCount > 0 ? "#fde68a" : undefined }}>
                  <div className="ph-stat-icon" style={{ background: "#fff5f5", width: 36, height: 36 }}><AlertTriangle size={16} color="#ef4444" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value" style={{ fontSize: 20, color: stats.lowStockCount > 0 ? "#ef4444" : undefined }}>{stats.lowStockCount}</div>
                    <div className="ph-stat-label" style={{ fontSize: 10 }}>Low Stock</div>
                  </div>
                </div>
                <div className="ph-stat-card" style={{ padding: "14px 12px", borderColor: stats.expiringCount > 0 ? "#fed7aa" : undefined }}>
                  <div className="ph-stat-icon" style={{ background: "#fff7ed", width: 36, height: 36 }}><Clock size={16} color="#ea580c" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value" style={{ fontSize: 20, color: stats.expiringCount > 0 ? "#ea580c" : undefined }}>{stats.expiringCount}</div>
                    <div className="ph-stat-label" style={{ fontSize: 10 }}>Expiring Soon</div>
                  </div>
                </div>
                <div className="ph-stat-card" style={{ padding: "14px 12px" }}>
                  <div className="ph-stat-icon" style={{ background: "#f0fdf4", width: 36, height: 36 }}><IndianRupee size={16} color="#16a34a" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value" style={{ fontSize: 18 }}>{fmtCurrency(stats.todayRevenue)}</div>
                    <div className="ph-stat-label" style={{ fontSize: 10 }}>Today&apos;s Sales</div>
                  </div>
                </div>
                <div className="ph-stat-card" style={{ padding: "14px 12px", borderColor: stats.pendingCount > 0 ? BORDER : undefined }}>
                  <div className="ph-stat-icon" style={{ background: "#eff6ff", width: 36, height: 36 }}><ClipboardList size={16} color="#2563eb" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value" style={{ fontSize: 20 }}>{stats.pendingCount}</div>
                    <div className="ph-stat-label" style={{ fontSize: 10 }}>Pending Rx</div>
                  </div>
                </div>
                <div className="ph-stat-card" style={{ padding: "14px 12px" }}>
                  <div className="ph-stat-icon" style={{ background: "#faf5ff", width: 36, height: 36 }}><TrendingUp size={16} color="#9333ea" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value" style={{ fontSize: 18 }}>{fmtCurrency(stats.totalRevenue)}</div>
                    <div className="ph-stat-label" style={{ fontSize: 10 }}>Total Revenue</div>
                  </div>
                </div>
              </div>

              {/* Alert Cards */}
              <div className="ph-alerts-row">
                {stats.lowStockCount > 0 && (
                  <div className="ph-alert-card warn">
                    <AlertTriangle size={16} />
                    <span><strong>{stats.lowStockCount}</strong> item{stats.lowStockCount !== 1 ? "s" : ""} below minimum stock level</span>
                    <button className="ph-alert-action" onClick={() => { setTab("inventory"); setInvFilter("low"); }}>View Items</button>
                  </div>
                )}
                {stats.expiringCount > 0 && (
                  <div className="ph-alert-card danger">
                    <AlertCircle size={16} />
                    <span><strong>{stats.expiringCount}</strong> item{stats.expiringCount !== 1 ? "s" : ""} expiring within 30 days</span>
                    <button className="ph-alert-action" onClick={() => { setTab("inventory"); setInvFilter("expiring"); }}>View Items</button>
                  </div>
                )}
                {stats.pendingCount > 0 && (
                  <div className="ph-alert-card info">
                    <Pill size={16} />
                    <span><strong>{stats.pendingCount}</strong> prescription{stats.pendingCount !== 1 ? "s" : ""} waiting to be dispensed</span>
                    <button className="ph-alert-action" onClick={() => setTab("queue")}>Go to Queue</button>
                  </div>
                )}
              </div>

              {/* Charts Row */}
              <div className="ph-charts-row">
                <div className="ph-chart-card">
                  <div className="ph-chart-header">
                    <div className="ph-chart-title">Weekly Dispensing</div>
                    <div className="ph-chart-subtitle">Last 7 days</div>
                  </div>
                  <div className="ph-bar-chart">
                    {stats.chartData.map((d, i) => {
                      const maxCount = Math.max(...stats.chartData.map(x => x.count), 1);
                      const pct = (d.count / maxCount) * 100;
                      return (
                        <div key={i} className="ph-bar-col">
                          <div className="ph-bar-value">{d.count}</div>
                          <div className="ph-bar-track">
                            <div className="ph-bar-fill" style={{ height: `${Math.max(pct, 4)}%` }} />
                          </div>
                          <div className="ph-bar-label">{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="ph-chart-card">
                  <div className="ph-chart-header">
                    <div className="ph-chart-title">Top Dispensed Medicines</div>
                    <div className="ph-chart-subtitle">Last 30 days</div>
                  </div>
                  <div className="ph-top-list">
                    {stats.topMedicines.length === 0 ? (
                      <div className="ph-empty-sm">No dispensing data yet</div>
                    ) : (
                      stats.topMedicines.slice(0, 6).map((m, i) => (
                        <div key={i} className="ph-top-item">
                          <div className="ph-top-rank">#{i + 1}</div>
                          <div className="ph-top-info">
                            <div className="ph-top-name">{m.name}</div>
                            <div className="ph-top-meta">{m.category} &middot; {m.qty} units</div>
                          </div>
                          <div className="ph-top-revenue">{fmtCurrency(m.revenue)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="ph-quick-actions">
                <div className="ph-quick-title">Quick Actions</div>
                <div className="ph-quick-grid">
                  <button className="ph-quick-btn" onClick={() => setTab("queue")}>
                    <ClipboardList size={20} color={ACCENT} />
                    <span>Prescription Queue</span>
                    {stats.pendingCount > 0 && <span className="ph-quick-badge">{stats.pendingCount}</span>}
                  </button>
                  <button className="ph-quick-btn" onClick={() => { setTab("inventory"); setInvFilter("low"); }}>
                    <AlertTriangle size={20} color="#ea580c" />
                    <span>Low Stock Items</span>
                    {stats.lowStockCount > 0 && <span className="ph-quick-badge warn">{stats.lowStockCount}</span>}
                  </button>
                  <button className="ph-quick-btn" onClick={() => setTab("billing")}>
                    <CreditCard size={20} color="#6366f1" />
                    <span>Pharmacy Billing</span>
                  </button>
                  <button className="ph-quick-btn" onClick={() => setTab("reports")}>
                    <BarChart2 size={20} color="#10b981" />
                    <span>View Reports</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="ph-empty">Failed to load stats. <button className="ph-link" onClick={loadStats}>Retry</button></div>
          )}
        </div>
      )}

      {/* ── Rx Queue Tab ── */}
      {tab === "queue" && (
        <div className="ph-section">
          {/* Queue Header — Row 1: Search/Date left, Action buttons right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="ph-search-wrap">
                <Search size={14} color="#94a3b8" />
                <input className="ph-search-input" placeholder="Search patient, Rx number..." value={queueSearch} onChange={e => setQueueSearch(e.target.value)} />
                {queueSearch && <button className="ph-icon-btn-sm" onClick={() => setQueueSearch("")}><X size={12} /></button>}
              </div>
              <input type="date" value={queueDate} onChange={e => setQueueDate(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 12, color: "#334155", background: "#fff", outline: "none" }} />
              {queueDate !== new Date().toISOString().slice(0, 10) && (
                <button className="ph-icon-btn-sm" onClick={() => setQueueDate(new Date().toISOString().slice(0, 10))} title="Back to today"><X size={13} /></button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ph-btn-ghost" onClick={loadQueue}><RefreshCw size={13} /> Refresh</button>
              <button className="ph-btn-primary" style={{ background: "#ea580c" }} onClick={() => { setCounterSaleModal(true); setCsError(""); }}>
                <ShoppingCart size={14} /> Counter Sale
              </button>
              <button className="ph-btn-primary" onClick={() => { setRxCreateModal(true); setRxCreateError(""); if (rxCreateDoctors.length === 0) api("/api/config/doctors?simple=true").then(r => { if (r.success) setRxCreateDoctors(Array.isArray(r.data) ? r.data : r.data?.data || []); }); }}>
                <Plus size={14} /> Add Walk-in Rx
              </button>
            </div>
          </div>

          {/* Row 2: Filter pills — status + source in one horizontal row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div className="ph-filter-pills">
              {(["pending", "dispensed", "HOLD", "SKIPPED", "all"] as const).map(f => (
                <button key={f} className={`ph-pill${queueFilter === f ? " on" : ""}`} onClick={() => setQueueFilter(f)}>
                  {f === "pending" && <Clock size={12} />}
                  {f === "dispensed" && <CheckCircle2 size={12} />}
                  {f === "HOLD" && <Archive size={12} />}
                  {f === "SKIPPED" && <Ban size={12} />}
                  {f === "all" && <Layers size={12} />}
                  {f === "pending" ? "Pending" : f === "dispensed" ? "Dispensed" : f === "HOLD" ? "On Hold" : f === "SKIPPED" ? "Skipped" : "All"}
                  {f === "pending" && queueStats.pending > 0 && <span className="ph-pill-count">{queueStats.pending}</span>}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 20, background: "#e2e8f0", flexShrink: 0 }} />
            <div className="ph-filter-pills">
              {(["all", "OPD", "IPD", "EMERGENCY"] as const).map(f => (
                <button key={f} className={`ph-pill${queueSourceFilter === f ? " on" : ""}`} onClick={() => setQueueSourceFilter(f)}>
                  {f === "all" ? "All Sources" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="ph-inv-stats" style={{ marginBottom: 14 }}>
            <div className="ph-inv-stat"><ClipboardList size={14} color={ACCENT} /><span><strong>{queueStats.total}</strong> Total Today</span></div>
            <div className="ph-inv-stat" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
              <Clock size={14} color="#ea580c" /><span style={{ color: "#ea580c" }}><strong>{queueStats.pending}</strong> Pending</span>
            </div>
            <div className="ph-inv-stat" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
              <CheckCircle2 size={14} color="#16a34a" /><span style={{ color: "#16a34a" }}><strong>{queueStats.dispensed}</strong> Dispensed</span>
            </div>
            <div className="ph-inv-stat" style={{ background: "#faf5ff", borderColor: "#e9d5ff" }}>
              <Archive size={14} color="#7c3aed" /><span style={{ color: "#7c3aed" }}><strong>{queue.filter(q => q.workflowStatus === "HOLD").length}</strong> On Hold</span>
            </div>
            <div className="ph-inv-stat" style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
              <Ban size={14} color="#94a3b8" /><span><strong>{queue.filter(q => q.workflowStatus === "SKIPPED").length}</strong> Skipped</span>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedQueue.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fffe", border: `1px solid ${ACCENT}40`, borderRadius: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{selectedQueue.size} selected</span>
              <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />
              <button 
                className="ph-btn-ghost" 
                style={{ fontSize: 11, padding: "5px 10px" }}
                onClick={() => {
                  const data = filteredQueue.filter(q => selectedQueue.has(q.id)).map(q => ({
                    "Rx Number": q.prescriptionNo,
                    "Patient": q.patient?.name || "",
                    "Patient ID": q.patient?.patientId || "",
                    "Doctor": q.doctor?.name || "",
                    "Status": q.workflowStatus || "PENDING",
                    "Medications": (q.medications || []).map((m: any) => m.name || m.medicine).join("; "),
                    "Created At": q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""
                  }));
                  exportToCSV(data, "pharmacy_queue");
                }}
              >
                <FileSpreadsheet size={12} /> Export Excel
              </button>
              <button 
                className="ph-btn-ghost" 
                style={{ fontSize: 11, padding: "5px 10px" }}
                onClick={() => {
                  const selected = filteredQueue.filter(q => selectedQueue.has(q.id));
                  exportToPDF(
                    "Pharmacy Queue Report",
                    ["Rx Number", "Patient", "Patient ID", "Doctor", "Status", "Medications", "Created At"],
                    selected.map(q => [
                      q.prescriptionNo,
                      q.patient?.name || "",
                      q.patient?.patientId || "",
                      q.doctor?.name || "",
                      q.workflowStatus || "PENDING",
                      (q.medications || []).map((m: any) => m.name || m.medicine).join("; "),
                      q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""
                    ]),
                    "pharmacy_queue"
                  );
                }}
              >
                <FileType size={12} /> Export PDF
              </button>
              <button 
                className="ph-btn-ghost" 
                style={{ fontSize: 11, padding: "5px 10px" }}
                onClick={() => {
                  const selected = filteredQueue.filter(q => selectedQueue.has(q.id));
                  exportToWord(
                    "Pharmacy Queue Report",
                    ["Rx Number", "Patient", "Patient ID", "Doctor", "Status", "Medications", "Created At"],
                    selected.map(q => [
                      q.prescriptionNo,
                      q.patient?.name || "",
                      q.patient?.patientId || "",
                      q.doctor?.name || "",
                      q.workflowStatus || "PENDING",
                      (q.medications || []).map((m: any) => m.name || m.medicine).join("; "),
                      q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""
                    ]),
                    "pharmacy_queue"
                  );
                }}
              >
                <FileText size={12} /> Export Word
              </button>
              <div style={{ flex: 1 }} />
              <button 
                className="ph-btn-ghost" 
                style={{ fontSize: 11, padding: "5px 10px", color: "#ef4444" }}
                onClick={() => { setBulkDeleteModalOpen(true); setBulkDeleteRemark(""); }}
              >
                <Trash2 size={12} /> Delete Selected
              </button>
              <button 
                className="ph-icon-btn-sm" 
                onClick={() => setSelectedQueue(new Set())}
                title="Clear selection"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Queue Table */}
          {queueLoading ? (
            <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading prescriptions...</div>
          ) : filteredQueue.length === 0 ? (
            <div className="ph-empty">
              <Pill size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No {queueFilter === "pending" ? "pending" : queueFilter === "dispensed" ? "dispensed" : ""} prescriptions found</div>
            </div>
          ) : (
            <div className="ph-tbl-wrap">
              <table className="ph-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input 
                        type="checkbox" 
                        checked={filteredQueue.length > 0 && filteredQueue.every(q => selectedQueue.has(q.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQueue(new Set(filteredQueue.map(q => q.id)));
                          } else {
                            setSelectedQueue(new Set());
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ width: 40 }}>#</th>
                    <th>Patient</th>
                    <th>Rx No.</th>
                    <th>Doctor</th>
                    <th>Source</th>
                    <th>Meds</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((item, idx) => {
                    const meds = item.medications || [];
                    const age = item.patient?.dateOfBirth ? calcAge(item.patient.dateOfBirth) : null;
                    const isExpanded = expandedRx === item.id;
                    const isHold = item.workflowStatus === "HOLD";
                    const isSkipped = item.workflowStatus === "SKIPPED";
          
                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`ph-queue-row${isExpanded ? " expanded" : ""}`}
                          style={{ cursor: "pointer", background: isExpanded ? "#f8fffe" : selectedQueue.has(item.id) ? "#f0f9ff" : undefined }}
                          onClick={() => setExpandedRx(isExpanded ? null : item.id)}
                        >
                          <td onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedQueue.has(item.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedQueue);
                                if (e.target.checked) {
                                  newSet.add(item.id);
                                } else {
                                  newSet.delete(item.id);
                                }
                                setSelectedQueue(newSet);
                              }}
                              style={{ cursor: "pointer" }}
                            />
                          </td>
                          <td>
                            {item.appointment?.tokenNumber ? (
                              <span className="ph-rank">T{item.appointment.tokenNumber}</span>
                            ) : (
                              <span style={{ color: "#cbd5e1", fontSize: 11 }}>{idx + 1}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{item.patient?.name || "Unknown"}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                              {item.patient?.patientId}{age ? ` \u00b7 ${age}y` : ""}{item.patient?.gender ? ` \u00b7 ${item.patient.gender}` : ""}
                            </div>
                          </td>
                          <td><span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#0A6B70" }}>{item.prescriptionNo}</span></td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Stethoscope size={11} /> Dr. {item.doctor?.name || "\u2014"}</div>
                          </td>
                          <td>
                            {item.appointment?.type ? (
                              <span className="ph-badge" style={{
                                background: PRIORITY_MAP[item.appointment.type]?.bg || LIGHT_BG,
                                color: PRIORITY_MAP[item.appointment.type]?.color || ACCENT,
                                border: `1px solid ${PRIORITY_MAP[item.appointment.type]?.color || ACCENT}30`,
                              }}>
                                {item.appointment.type}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: "#cbd5e1" }}>\u2014</span>
                            )}
                          </td>
                          <td><span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{meds.length}</span><span style={{ fontSize: 11, color: "#94a3b8" }}> med{meds.length !== 1 ? "s" : ""}</span></td>
                          <td>
                            {isHold ? (
                              <span className="ph-badge" style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}><Archive size={10} /> On Hold</span>
                            ) : isSkipped ? (
                              <span className="ph-badge" style={{ background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}><Ban size={10} /> Skipped</span>
                            ) : item.dispensed ? (
                              <span className="ph-badge green"><CheckCircle2 size={10} /> Dispensed</span>
                            ) : (
                              <span className="ph-badge orange"><Clock size={10} /> Pending</span>
                            )}
                          </td>
                          <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{fmtTime(item.createdAt)}</td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                              {!item.dispensed && !isSkipped && !isHold && (
                                <>
                                  <button className="ph-tbl-action" title="Dispense & Bill" onClick={e => { e.stopPropagation(); setDispenseModalItem(item); setDispensingId(null); setDispenseNotes(""); setTransferTo(""); }}>
                                    <Pill size={13} color="#16a34a" />
                                  </button>
                                  <button className="ph-tbl-action" title="View" onClick={e => { e.stopPropagation(); setQueueViewModal(item); }}>
                                    <Eye size={13} />
                                  </button>
                                  <button className="ph-tbl-action" title="Hold" style={{ color: "#7c3aed" }} onClick={e => { e.stopPropagation(); setRxActionTarget(item); setRxActionType("hold"); setRxActionNotes(""); }}>
                                    <Archive size={13} />
                                  </button>
                                  <button className="ph-tbl-action" title="Skip" style={{ color: "#ea580c" }} onClick={e => { e.stopPropagation(); setRxActionTarget(item); setRxActionType("skip"); setRxActionNotes(""); }}>
                                    <Ban size={13} />
                                  </button>
                                </>
                              )}
                              {(isHold || isSkipped) && (
                                <button className="ph-tbl-action" title="Resume" style={{ color: ACCENT }} onClick={e => { e.stopPropagation(); setRxActionTarget(item); setRxActionType("resume"); setRxActionNotes(""); }}>
                                  <PlayCircle size={13} />
                                </button>
                              )}
                              {item.dispensed && (
                                <button className="ph-tbl-action" title="View Rx" onClick={e => { e.stopPropagation(); setQueueViewModal(item); }}>
                                  <Eye size={13} />
                                </button>
                              )}
                              {!item.dispensed && (
                                <button className="ph-tbl-action" title="Remove" style={{ color: "#ef4444" }} onClick={e => { e.stopPropagation(); setRxDeleteTarget(item); setRxDeleteRemark(""); }}>
                                  <Trash2 size={13} />
                                </button>
                              )}
                              <button className="ph-tbl-action" title="Get Bill" onClick={e => { e.stopPropagation(); fetchRxBill(item); }}>
                                {rxBillLoading === item.id ? <Loader2 size={13} className="ph-spin" /> : <Receipt size={13} color="#0ea5e9" />}
                              </button>
                              <button className="ph-tbl-action" title={isExpanded ? "Collapse" : "Expand"} onClick={e => { e.stopPropagation(); setExpandedRx(isExpanded ? null : item.id); }}>
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} style={{ padding: 0, background: "#f8fffe" }}>
                              <div style={{ padding: "16px 20px", borderTop: `2px solid ${BORDER}` }}>
                                {item.diagnosis && (
                                  <div className="ph-rx-info">
                                    <span className="ph-rx-label">Diagnosis:</span>
                                    <span>{item.diagnosis}</span>
                                  </div>
                                )}
          
                                <div className="ph-meds-header">Prescribed Medications</div>
                                {meds.length === 0 ? (
                                  <div className="ph-empty-sm">No medications in this prescription</div>
                                ) : (
                                  <div className="ph-meds-table-wrap">
                                    <table className="ph-meds-table">
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Medicine</th>
                                          <th>Dosage</th>
                                          <th>Frequency</th>
                                          <th>Duration</th>
                                          <th>Qty</th>
                                          <th>Instructions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {meds.map((med: any, midx: number) => (
                                          <tr key={midx}>
                                            <td>{midx + 1}</td>
                                            <td>
                                              <div className="ph-med-name">{med.name || med.medicine || "\u2014"}</div>
                                              {med.genericName && <div className="ph-med-generic">{med.genericName}</div>}
                                            </td>
                                            <td>{med.dosage || med.dose || "\u2014"}</td>
                                            <td>{med.frequency || "\u2014"}</td>
                                            <td>{med.duration || "\u2014"}</td>
                                            <td><strong>{med.quantity || "\u2014"}</strong></td>
                                            <td>{med.instructions || med.notes || "\u2014"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
          
                                {/* Action buttons for expanded row */}
                                {!item.dispensed && !isSkipped && !isHold && (
                                  <div style={{ marginTop: 14 }}>
                                    <button className="ph-btn-primary" style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9 }}
                                      onClick={() => { setDispenseModalItem(item); setDispensingId(null); setDispenseNotes(""); setTransferTo(""); }}>
                                      <Pill size={14} /> Dispense & Bill
                                    </button>
                                  </div>
                                )}
          
                                {(isHold || isSkipped) && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                                    <div style={{ padding: "6px 12px", background: isHold ? "#faf5ff" : "#f8fafc", border: `1px solid ${isHold ? "#e9d5ff" : "#e2e8f0"}`, borderRadius: 8, fontSize: 12, color: isHold ? "#7c3aed" : "#94a3b8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                      {isHold ? <Archive size={13} /> : <Ban size={13} />}
                                      {isHold ? "On Hold" : "Skipped"}
                                      {item.workflowNotes && <span style={{ fontWeight: 400, color: "#64748b" }}>\u2014 {item.workflowNotes}</span>}
                                    </div>
                                    <button className="ph-btn-primary" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { setRxActionTarget(item); setRxActionType("resume"); setRxActionNotes(""); }}>
                                      <PlayCircle size={12} /> Resume
                                    </button>
                                  </div>
                                )}
          
                                {item.dispensed && (
                                  <div className="ph-dispensed-badge" style={{ justifyContent: "space-between", marginTop: 14 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} /> Dispensed successfully</div>
                                    <button className="ph-btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setQueueViewModal(item)}><Eye size={12} /> View Rx</button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Queue: Dispense & Bill Modal ── */}
      {dispenseModalItem && (() => {
        const dItem = dispenseModalItem;
        const dMeds: any[] = (() => { try { return typeof dItem.medications === "string" ? JSON.parse(dItem.medications) : dItem.medications || []; } catch { return []; } })();

        // Auto-match medications to inventory items by name/genericName
        const autoMatch = (med: any) => {
          if (med.inventoryItemId) {
            const inv = inventory.find((i: any) => i.id === med.inventoryItemId);
            return { inventoryItemId: med.inventoryItemId, price: med.price || inv?.sellingPrice || inv?.mrp || 0, name: inv?.name || med.name || med.medicine || "" };
          }
          const medName = (med.name || med.medicine || "").toLowerCase().trim();
          if (!medName) return { inventoryItemId: null, price: med.price || 0, name: med.name || med.medicine || "" };
          // Try exact match, then partial match
          const exact = inventory.find((i: any) => i.isActive && (i.name.toLowerCase() === medName || i.genericName?.toLowerCase() === medName));
          if (exact) return { inventoryItemId: exact.id, price: exact.sellingPrice || exact.mrp || med.price || 0, name: exact.name };
          const partial = inventory.find((i: any) => i.isActive && (i.name.toLowerCase().includes(medName) || medName.includes(i.name.toLowerCase()) || (i.genericName && (i.genericName.toLowerCase().includes(medName) || medName.includes(i.genericName.toLowerCase())))));
          if (partial) return { inventoryItemId: partial.id, price: partial.sellingPrice || partial.mrp || med.price || 0, name: partial.name };
          return { inventoryItemId: null, price: med.price || 0, name: med.name || med.medicine || "" };
        };

        const formMeds = dispenseForm[dItem.id] || dMeds.map((m: any) => {
          const match = autoMatch(m);
          return { ...m, quantity: parseInt(m.quantity) || 1, price: match.price, inventoryItemId: match.inventoryItemId, name: match.name };
        });
        const totalCharge = formMeds.reduce((s: number, m: any) => s + ((m.quantity || 1) * (m.price || 0)), 0);
        
        // Check stock availability for all items
        const stockIssues = formMeds.map((med: any, idx: number) => {
          const matchedInv = med.inventoryItemId ? inventory.find((inv: any) => inv.id === med.inventoryItemId) : null;
          const availableStock = matchedInv ? (matchedInv.totalStock || matchedInv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0) : 0;
          const isNotInInventory = !matchedInv;
          const isOutOfStock = matchedInv ? availableStock === 0 : true;
          const qtyExceedsStock = matchedInv ? (med.quantity || 1) > availableStock : false;
          return { idx, med, matchedInv, availableStock, isNotInInventory, isOutOfStock: isNotInInventory ? false : isOutOfStock, qtyExceedsStock };
        });
        
        const hasStockIssues = stockIssues.some((s: any) => s.isNotInInventory || s.isOutOfStock || s.qtyExceedsStock);
        const outOfStockCount = stockIssues.filter((s: any) => s.isOutOfStock || s.isNotInInventory).length;
        const exceedsStockCount = stockIssues.filter((s: any) => s.qtyExceedsStock && !s.isOutOfStock).length;
        
        return (
          <div className="ph-modal-overlay" onClick={() => setDispenseModalItem(null)}>
            <div className="ph-modal" style={{ width: 900, maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
              <div className="ph-modal-header" style={{ background: `linear-gradient(135deg, ${ACCENT}12, ${ACCENT}06)`, borderBottom: `1px solid ${ACCENT}25` }}>
                <div>
                  <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Pill size={18} color={ACCENT} /> Dispense & Bill
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {dItem.prescriptionNo} · {dItem.patient?.name} ({dItem.patient?.patientId})
                    {dItem.doctor ? ` · Dr. ${dItem.doctor.name}` : " · Walk-in"}
                  </div>
                </div>
                <button className="ph-icon-btn-sm" onClick={() => setDispenseModalItem(null)}><X size={16} /></button>
              </div>

              <div className="ph-modal-body" style={{ overflowY: "auto", flex: 1 }}>
                {/* Patient & Rx Info Strip */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: "Patient", value: dItem.patient?.name || "—", sub: dItem.patient?.patientId },
                    { label: "Doctor", value: dItem.doctor ? `Dr. ${dItem.doctor.name}` : "Walk-in", sub: dItem.doctor?.specialization || "" },
                    { label: "Diagnosis", value: dItem.diagnosis || "—", sub: dItem.appointment?.type || "" },
                  ].map((info, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{info.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{info.value}</div>
                      {info.sub && <div style={{ fontSize: 10, color: "#94a3b8" }}>{info.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Stock Status Alert — informational, not blocking */}
                {hasStockIssues && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 16 }}>
                    <AlertTriangle size={20} color="#d97706" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Partial Stock Available</div>
                      <div style={{ fontSize: 11, color: "#78350f" }}>
                        {outOfStockCount > 0 && `${outOfStockCount} item(s) not in inventory. `}
                        {exceedsStockCount > 0 && `${exceedsStockCount} item(s) exceed available stock. `}
                        Available items will be dispensed; unavailable items will be marked as “not dispensed yet”.
                      </div>
                    </div>
                  </div>
                )}

                {/* Medications Table */}
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={14} /> Medications <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(Select from inventory only)</span>
                </div>
                <div className="ph-tbl-wrap" style={{ marginBottom: 12 }}>
                  <table className="ph-tbl">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 220 }}>Inventory Item <span style={{ color: "#ef4444" }}>*</span></th>
                        <th style={{ width: 70 }}>Qty</th>
                        <th style={{ width: 100 }}>Unit Price (₹)</th>
                        <th style={{ width: 90 }}>Total (₹)</th>
                        <th style={{ width: 120 }}>Stock Status</th>
                        <th style={{ width: 80 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formMeds.map((med: any, idx: number) => {
                        const stockInfo = stockIssues.find((s: any) => s.idx === idx);
                        const matchedInv = stockInfo?.matchedInv;
                        const availableStock = stockInfo?.availableStock || 0;
                        const isNotInInventory = stockInfo?.isNotInInventory;
                        const isOutOfStock = stockInfo?.isOutOfStock;
                        const qtyExceedsStock = stockInfo?.qtyExceedsStock;
                        const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
                        const hasExpiring = matchedInv?.batches?.some((b: any) => b.expiryDate && new Date(b.expiryDate) <= thirtyDays);
                        
                        return (
                          <tr key={idx} style={{ background: isNotInInventory || isOutOfStock ? "#fff5f5" : qtyExceedsStock ? "#fffbeb" : "#fff" }}>
                            <td>
                              <select 
                                className="ph-input" 
                                value={med.inventoryItemId || ""}
                                onChange={e => {
                                  const selectedId = e.target.value;
                                  const selectedInv = inventory.find(inv => inv.id === selectedId);
                                  const newForm = [...formMeds]; 
                                  newForm[idx] = { 
                                    ...newForm[idx], 
                                    inventoryItemId: selectedId,
                                    name: selectedInv?.name || med.name || med.medicine || "",
                                    price: selectedInv?.sellingPrice || med.price || 0
                                  };
                                  setDispenseForm({ ...dispenseForm, [dItem.id]: newForm });
                                }} 
                                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${isNotInInventory || isOutOfStock ? "#fecaca" : "#cbd5e1"}`, fontSize: 12 }}
                              >
                                <option value="">-- Select from Inventory --</option>
                                {inventory.filter((inv: any) => inv.isActive).map((inv: any) => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.name} {inv.genericName ? `(${inv.genericName})` : ""} - Stock: {inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0} {inv.unit}
                                  </option>
                                ))}
                              </select>
                              {matchedInv && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>SKU: {matchedInv.sku || "N/A"} | {matchedInv.category}</div>}
                              {!matchedInv && med.inventoryItemId && <div style={{ fontSize: 9, color: "#dc2626", marginTop: 2 }}>⚠️ Not found in inventory</div>}
                            </td>
                            <td>
                              <input 
                                type="number" 
                                min="1" 
                                max={availableStock || undefined}
                                value={med.quantity || 1} 
                                onChange={e => {
                                  const newQty = parseInt(e.target.value) || 0;
                                  const newForm = [...formMeds]; 
                                  newForm[idx] = { ...newForm[idx], quantity: newQty };
                                  setDispenseForm({ ...dispenseForm, [dItem.id]: newForm });
                                }} 
                                className="ph-input" 
                                style={{ width: 60, padding: 6, borderRadius: 6, border: `1px solid ${qtyExceedsStock ? "#f59e0b" : "#cbd5e1"}` }} 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                min="0" 
                                value={med.price || 0} 
                                onChange={e => {
                                  const newForm = [...formMeds]; 
                                  newForm[idx] = { ...newForm[idx], price: parseFloat(e.target.value) || 0 };
                                  setDispenseForm({ ...dispenseForm, [dItem.id]: newForm });
                                }} 
                                className="ph-input" 
                                style={{ width: 80, padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} 
                              />
                            </td>
                            <td><strong style={{ color: "#1e293b" }}>{((med.quantity || 1) * (med.price || 0)).toFixed(2)}</strong></td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {matchedInv ? (
                                  <>
                                    <span style={{ fontWeight: 700, fontSize: 12, color: isOutOfStock ? "#dc2626" : qtyExceedsStock ? "#ea580c" : "#16a34a" }}>
                                      {availableStock} {matchedInv?.unit || "units"}
                                    </span>
                                    {isOutOfStock && <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 3 }}><Ban size={10} /> OUT OF STOCK</span>}
                                    {!isOutOfStock && qtyExceedsStock && <span style={{ fontSize: 9, fontWeight: 700, color: "#ea580c", display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={10} /> Only {availableStock} available</span>}
                                    {hasExpiring && <span style={{ fontSize: 9, fontWeight: 600, color: "#ea580c", display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} /> Near expiry</span>}
                                  </>
                                ) : (
                                  <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>⚠️ Select inventory item</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <button className="ph-btn-ghost" onClick={() => openSubstitute(med.name || med.medicine || "", dItem.id, idx)} style={{ padding: "4px 8px", fontSize: 11, color: "#0ea5e9" }}>Substitute</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bill Total */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                    Bill Total: <span style={{ color: ACCENT }}>{fmtCurrency(totalCharge)}</span>
                  </div>
                </div>

                {/* Transfer / Notes / Action */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>After Dispensing</label>
                      <select className="ph-select" value={transferTo} onChange={e => setTransferTo(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, outline: "none" }}>
                        <option value="">Finish & Close Visit</option>
                        <option value="BILLING" style={{ fontWeight: "bold", color: "#0ea5e9" }}>Transfer to Central Billing</option>
                        {subDepts.map(sd => <option key={sd.id} value={sd.id}>Transfer to {sd.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Dispensing Notes</label>
                      <input className="ph-input" placeholder="Add comments / dispensing notes..."
                        value={dispenseNotes} onChange={e => setDispenseNotes(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={12} /> Stock is deducted FIFO from batches. You can only dispense items available in inventory with sufficient stock.
                  </div>
                </div>
              </div>

              <div className="ph-modal-footer" style={{ borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button className="ph-btn-ghost" onClick={() => setDispenseModalItem(null)}>Cancel</button>
                <button 
                  className="ph-btn-primary" 
                  style={{ padding: "10px 24px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, ...(hasStockIssues ? { background: "#d97706", borderColor: "#d97706" } : {}) }}
                  disabled={dispensingId === dItem.id}
                  onClick={() => { handleDispense(dItem); setDispenseModalItem(null); }}
                >
                  {dispensingId === dItem.id ? <Loader2 size={14} className="ph-spin" /> : hasStockIssues ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  {hasStockIssues ? "Dispense Available Items" : transferTo ? "Dispense & Transfer" : "Complete Dispensing"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Bill View Modal ── */}
      {rxBillModal && (
        <div className="ph-modal-overlay" onClick={() => setRxBillModal(null)}>
          <div className="ph-modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header" style={{ background: `linear-gradient(135deg, #0ea5e920, #0ea5e908)`, borderBottom: "1px solid #0ea5e930" }}>
              <div>
                <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Receipt size={16} color="#0ea5e9" /> Bill — {rxBillModal.rx.prescriptionNo}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{rxBillModal.rx.patient?.name} ({rxBillModal.rx.patient?.patientId})</div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setRxBillModal(null)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body">
              {!rxBillModal.bill ? (
                <div style={{ padding: "32px 24px", textAlign: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Receipt size={24} color="#94a3b8" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 6 }}>No Bill Created Yet</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                    This prescription was added to queue only (no billing at entry).<br />
                    Payment will be collected when items are dispensed.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { l: "Bill No", v: rxBillModal.bill.billNo || "—" },
                      { l: "Status", v: rxBillModal.bill.status || "—", colored: true },
                      { l: "Date", v: rxBillModal.bill.createdAt ? new Date(rxBillModal.bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                    ].map((k, i) => (
                      <div key={i} style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{k.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: k.colored ? (rxBillModal.bill.status === "PAID" ? "#16a34a" : "#d97706") : "#1e293b" }}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  {(rxBillModal.bill.billItems || []).length > 0 && (
                    <div className="ph-tbl-wrap" style={{ marginBottom: 12 }}>
                      <table className="ph-tbl">
                        <thead><tr><th>#</th><th>Item</th><th style={{ textAlign: "right" }}>Qty</th><th style={{ textAlign: "right" }}>Unit Price</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
                        <tbody>
                          {(rxBillModal.bill.billItems || []).map((bi: any, i: number) => (
                            <tr key={bi.id || i}>
                              <td>{i + 1}</td>
                              <td><strong>{bi.name || "—"}</strong></td>
                              <td style={{ textAlign: "right" }}>{bi.quantity}</td>
                              <td style={{ textAlign: "right" }}>{fmtCurrency(bi.unitPrice || 0)}</td>
                              <td style={{ textAlign: "right", fontWeight: 700 }}>{fmtCurrency(bi.amount || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", marginBottom: 16 }}>
                    {(rxBillModal.bill.discount || 0) > 0 && (
                      <div style={{ fontSize: 12, color: "#64748b" }}>Discount: <strong style={{ color: "#16a34a" }}>-{fmtCurrency(rxBillModal.bill.discount || 0)}</strong></div>
                    )}
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Total: <span style={{ color: ACCENT }}>{fmtCurrency(rxBillModal.bill.total || 0)}</span></div>
                    {(rxBillModal.bill.paidAmount || 0) > 0 && (
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Paid: {fmtCurrency(rxBillModal.bill.paidAmount || 0)}</div>
                    )}
                    {rxBillModal.bill.status !== "PAID" && (rxBillModal.bill.total || 0) > (rxBillModal.bill.paidAmount || 0) && (
                      <div style={{ fontSize: 13, color: "#d97706", fontWeight: 700 }}>Due: {fmtCurrency((rxBillModal.bill.total || 0) - (rxBillModal.bill.paidAmount || 0))}</div>
                    )}
                  </div>
                  {rxBillModal.bill.status !== "PAID" && (
                    <div style={{ padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}><Clock size={13} /> Payment pending</div>
                      <button
                        className="ph-btn-primary"
                        style={{ fontSize: 11, padding: "6px 14px", background: "#16a34a", display: "flex", alignItems: "center", gap: 6 }}
                        onClick={() => { const b = rxBillModal.bill; setRxBillModal(null); setPaymentModal(b); setPaymentForm({ amount: String((b.total || 0) - (b.paidAmount || 0)), method: "CASH", transactionId: "", notes: "" }); }}
                      >
                        <Banknote size={12} /> Collect Payment
                      </button>
                    </div>
                  )}
                  {rxBillModal.bill.status === "PAID" && (
                    <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <ShieldCheck size={16} color="#16a34a" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Fully Paid</span>
                      {rxBillModal.bill.paymentMethod && <span style={{ fontSize: 11, color: "#64748b" }}>via {rxBillModal.bill.paymentMethod.replace(/_/g, " ")}</span>}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setRxBillModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Queue: View Rx Detail Modal ── */}
      {queueViewModal && (
        <div className="ph-modal-overlay" onClick={() => setQueueViewModal(null)}>
          <div className="ph-modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div>
                <div className="ph-modal-title">Prescription Detail — {queueViewModal.prescriptionNo}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{queueViewModal.patient?.name} · Dr. {queueViewModal.doctor?.name || "Walk-in"}</div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setQueueViewModal(null)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Patient", value: `${queueViewModal.patient?.name || "—"} (${queueViewModal.patient?.patientId || ""})` },
                  { label: "Phone", value: queueViewModal.patient?.phone || "—" },
                  { label: "Doctor", value: queueViewModal.doctor ? `Dr. ${queueViewModal.doctor.name}` : "Walk-in / Manual" },
                  { label: "Appointment Type", value: queueViewModal.appointment?.type || "—" },
                  { label: "Diagnosis", value: queueViewModal.diagnosis || "—" },
                  { label: "Chief Complaint", value: queueViewModal.chiefComplaint || "—" },
                  { label: "Status", value: queueViewModal.workflowStatus || queueViewModal.status || "—" },
                  { label: "Total Charge", value: queueViewModal.totalCharge ? fmtCurrency(queueViewModal.totalCharge) : "—" },
                ].map((row, i) => (
                  <div key={i} style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{row.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{row.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Prescribed Medications</div>
              {(queueViewModal.medications || []).length === 0 ? (
                <div className="ph-empty-sm">No medications recorded</div>
              ) : (
                <div className="ph-tbl-wrap">
                  <table className="ph-tbl">
                    <thead>
                      <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th><th>Instructions</th></tr>
                    </thead>
                    <tbody>
                      {(queueViewModal.medications || []).map((m: any, i: number) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td><strong>{m.name || m.medicine || "—"}</strong>{m.genericName && <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.genericName}</div>}</td>
                          <td>{m.dosage || m.dose || "—"}</td>
                          <td>{m.frequency || "—"}</td>
                          <td>{m.duration || "—"}</td>
                          <td><strong>{m.quantity || "—"}</strong></td>
                          <td>{m.instructions || m.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {queueViewModal.workflowNotes && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 12, color: "#92400e" }}>
                  <strong>Notes:</strong> {queueViewModal.workflowNotes}
                </div>
              )}
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setQueueViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Queue: Skip / Hold / Resume Confirm Modal ── */}
      {rxActionTarget && (
        <div className="ph-modal-overlay" onClick={() => setRxActionTarget(null)}>
          <div className="ph-modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title" style={{ color: rxActionType === "resume" ? ACCENT : rxActionType === "hold" ? "#7c3aed" : "#ef4444" }}>
                {rxActionType === "skip" ? "Skip Prescription" : rxActionType === "hold" ? "Put on Hold" : "Resume Prescription"}
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setRxActionTarget(null)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{rxActionTarget.patient?.name}</div>
                <div style={{ color: "#64748b" }}>Rx: {rxActionTarget.prescriptionNo} · Dr. {rxActionTarget.doctor?.name || "Walk-in"}</div>
                {rxActionTarget.diagnosis && <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Diagnosis: {rxActionTarget.diagnosis}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Reason / Notes (optional)</label>
                <textarea className="ph-modal-input" rows={3} placeholder={rxActionType === "skip" ? "Reason for skipping..." : rxActionType === "hold" ? "Reason for hold (e.g. waiting for stock)..." : "Notes for resuming..."} value={rxActionNotes} onChange={e => setRxActionNotes(e.target.value)} style={{ resize: "vertical" }} />
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setRxActionTarget(null)}>Cancel</button>
              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: rxActionType === "resume" ? ACCENT : rxActionType === "hold" ? "#7c3aed" : "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={handleRxAction} disabled={rxActioning}>
                {rxActioning ? <Loader2 size={13} className="ph-spin" /> : rxActionType === "resume" ? <PlayCircle size={13} /> : rxActionType === "hold" ? <Archive size={13} /> : <Ban size={13} />}
                {rxActionType === "skip" ? "Skip It" : rxActionType === "hold" ? "Put on Hold" : "Resume"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Counter Sale Modal ── */}
      {counterSaleModal && (
        <div className="ph-modal-overlay" onClick={() => setCounterSaleModal(false)}>
          <div className="ph-modal" style={{ width: 720, maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header" style={{ background: "linear-gradient(135deg, #ea580c12, #ea580c06)", borderBottom: "1px solid #ea580c25" }}>
              <div>
                <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShoppingCart size={18} color="#ea580c" /> Pharmacy Counter Sale
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Direct sale — bill is sent to Hospital Admin & Reception billing</div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setCounterSaleModal(false)}><X size={16} /></button>
            </div>

            <div className="ph-modal-body" style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              {csError && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, color: "#dc2626", fontWeight: 600 }}><AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />{csError}</div>}

              {/* Patient Section */}
              <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Patient</div>

                {/* ── Selected patient confirmed ── */}
                {csPatientId && !csManualPatient ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d", flex: 1 }}>{csPatientSearch}</span>
                    <button className="ph-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => { setCsPatientId(""); setCsPatientSearch(""); setCsSearchNoResults(false); }}>Change</button>
                  </div>

                ) : csManualPatient ? (
                  /* ── Manual new-patient form ── */
                  <div>
                    <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <Plus size={12} /> New patient — not found in records
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <input className="ph-input" placeholder="Full Name *" value={csManualForm.name} onChange={e => setCsManualForm({ ...csManualForm, name: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ea580c55", fontSize: 13 }} />
                      <input className="ph-input" placeholder="Phone * (min 7 digits)" value={csManualForm.phone} onChange={e => setCsManualForm({ ...csManualForm, phone: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ea580c55", fontSize: 13 }} />
                      <select className="ph-select" value={csManualForm.gender} onChange={e => setCsManualForm({ ...csManualForm, gender: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ea580c55", fontSize: 13 }}>
                        <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                      </select>
                    </div>
                    <button className="ph-btn-ghost" style={{ fontSize: 11, marginTop: 6 }} onClick={() => { setCsManualPatient(false); setCsManualForm({ name: "", phone: "", gender: "MALE" }); setCsSearchNoResults(false); }}>
                      <Search size={11} /> Back to search
                    </button>
                  </div>

                ) : (
                  /* ── Search mode ── */
                  <div style={{ position: "relative" }}>
                    <input
                      className="ph-input"
                      placeholder="Search by name, phone, or Patient ID..."
                      value={csPatientSearch}
                      onChange={e => { setCsPatientSearch(e.target.value); setCsSearchNoResults(false); }}
                      style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
                    />
                    {csPatientSearching
                      ? <Loader2 size={14} className="ph-spin" style={{ position: "absolute", right: 12, top: 10, color: "#94a3b8" }} />
                      : csPatientSearch.trim() && <Search size={13} style={{ position: "absolute", right: 12, top: 11, color: "#94a3b8" }} />
                    }

                    {/* Dropdown: results OR no-results create option */}
                    {(csPatients.length > 0 || csSearchNoResults) && csPatientSearch.trim() && (
                      <div style={{ position: "absolute", zIndex: 20, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.1)", marginTop: 4 }}>
                        {csPatients.length > 0 ? (
                          <>
                            <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>
                              Search Results
                            </div>
                            {csPatients.map((p: any) => (
                              <div key={p.id}
                                style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                                onMouseLeave={e => (e.currentTarget.style.background = "")}
                                onClick={() => { setCsPatientId(p.id); setCsPatientSearch(p.name); setCsPatients([]); setCsSearchNoResults(false); }}>
                                <span><strong>{p.name}</strong><span style={{ color: "#94a3b8", marginLeft: 6 }}>#{p.patientId}</span></span>
                                <span style={{ color: "#64748b", fontSize: 11 }}>{p.phone || ""}</span>
                              </div>
                            ))}
                            {/* Always offer create option at the bottom */}
                            <div
                              style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: "#ea580c", fontWeight: 600, borderTop: "1px solid #f1f5f9", background: "#fff7ed" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#ffedd5")}
                              onMouseLeave={e => (e.currentTarget.style.background = "#fff7ed")}
                              onClick={() => { setCsManualPatient(true); setCsManualForm({ name: csPatientSearch.trim(), phone: "", gender: "MALE" }); setCsPatients([]); }}>
                              <Plus size={13} /> Create new patient &quot;{csPatientSearch.trim()}&quot;
                            </div>
                          </>
                        ) : (
                          /* No results found */
                          <div>
                            <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 6 }}>
                              <AlertCircle size={13} /> No patient found for &quot;{csPatientSearch.trim()}&quot;
                            </div>
                            <div
                              style={{ padding: "11px 14px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "#ea580c", fontWeight: 700, background: "#fff7ed" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#ffedd5")}
                              onMouseLeave={e => (e.currentTarget.style.background = "#fff7ed")}
                              onClick={() => { setCsManualPatient(true); setCsManualForm({ name: csPatientSearch.trim(), phone: "", gender: "MALE" }); setCsPatients([]); }}>
                              <Plus size={14} /> Create new patient &quot;{csPatientSearch.trim()}&quot;
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recent patients (shown when input is empty) */}
                    {csPatients.length > 0 && !csPatientSearch.trim() && (
                      <div style={{ position: "absolute", zIndex: 20, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.1)", marginTop: 4 }}>
                        <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Recent Patients</div>
                        {csPatients.map((p: any) => (
                          <div key={p.id}
                            style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                            onMouseLeave={e => (e.currentTarget.style.background = "")}
                            onClick={() => { setCsPatientId(p.id); setCsPatientSearch(p.name); setCsPatients([]); }}>
                            <span><strong>{p.name}</strong><span style={{ color: "#94a3b8", marginLeft: 6 }}>#{p.patientId}</span></span>
                            <span style={{ color: "#64748b", fontSize: 11 }}>{p.phone || ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items Table with Inventory Selection */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={14} /> Items <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(Select from inventory)</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="ph-btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => { setCsHistoryModal(true); loadCsHistory(); }}>
                      <Clock size={11} /> History
                    </button>
                    <button className="ph-btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setCsItems([...csItems, { inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", availableStock: 0 }])}>
                      <Plus size={11} /> Add Item
                    </button>
                  </div>
                </div>
                
                {/* Stock Issues Alert — accounts for combined quantities of duplicate items */}
                {(() => {
                  const combined: Record<string, number> = {};
                  csItems.filter(i => i.inventoryItemId).forEach(item => {
                    combined[item.inventoryItemId] = (combined[item.inventoryItemId] || 0) + (parseInt(item.quantity) || 0);
                  });
                  const outOfStock = csItems.filter(item => item.inventoryItemId && item.availableStock === 0);
                  const issues = Object.entries(combined).filter(([itemId, totalQty]) => {
                    const item = csItems.find(i => i.inventoryItemId === itemId);
                    return item && totalQty > item.availableStock;
                  });
                  const duplicates = csItems.filter((item, i, arr) => item.inventoryItemId && arr.findIndex(x => x.inventoryItemId === item.inventoryItemId) !== i);
                  if (issues.length === 0 && outOfStock.length === 0 && duplicates.length === 0) return null;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 12 }}>
                      <AlertCircle size={18} color="#dc2626" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Stock Issues</div>
                        <div style={{ fontSize: 11, color: "#7f1d1d", lineHeight: 1.5 }}>
                          {outOfStock.length > 0 && <div>{outOfStock.length} item(s) out of stock.</div>}
                          {issues.length > 0 && <div>Combined quantity exceeds stock for: {issues.map(([itemId]) => csItems.find(i => i.inventoryItemId === itemId)?.name || itemId).join(", ")}.</div>}
                          {duplicates.length > 0 && <div style={{ color: "#b45309" }}>Same item added multiple times — quantities are combined for stock check.</div>}
                          Adjust quantities or request purchase.
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="ph-tbl-wrap" style={{ overflow: "visible" }}>
                  <table className="ph-tbl">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 220 }}>Inventory Item <span style={{ color: "#ef4444" }}>*</span></th>
                        <th style={{ width: 70 }}>Qty</th>
                        <th style={{ width: 90 }}>Unit Price (₹)</th>
                        <th style={{ width: 80 }}>Amount (₹)</th>
                        <th style={{ width: 100 }}>Stock Status</th>
                        <th style={{ width: 50 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {csItems.map((item, idx) => {
                        const amt = (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                        const qty = parseInt(item.quantity) || 0;
                        // Combined quantity: sum all rows for the same inventory item
                        const combinedQtyForItem = item.inventoryItemId
                          ? csItems.filter(i => i.inventoryItemId === item.inventoryItemId).reduce((sum, i) => sum + (parseInt(i.quantity) || 0), 0)
                          : qty;
                        const isDuplicate = item.inventoryItemId && csItems.filter(i => i.inventoryItemId === item.inventoryItemId).length > 1;
                        const exceedsStock = item.inventoryItemId && combinedQtyForItem > item.availableStock;
                        const isOutOfStock = item.inventoryItemId && item.availableStock === 0;
                        const selectedInv = inventory.find((i: any) => i.id === item.inventoryItemId);
                        
                        return (
                          <tr key={idx} style={{ background: isOutOfStock ? "#fff5f5" : exceedsStock ? "#fffbeb" : "#fff" }}>
                            <td>
                              <div style={{ position: "relative" }}>
                                {/* Show selected item chip or search input */}
                                {item.inventoryItemId ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, border: `1px solid ${isOutOfStock ? "#fecaca" : exceedsStock ? "#fde68a" : "#bbf7d0"}`, background: isOutOfStock ? "#fef2f2" : exceedsStock ? "#fffbeb" : "#f0fdf4", fontSize: 12 }}>
                                    <Package size={13} color={isOutOfStock ? "#dc2626" : exceedsStock ? "#ea580c" : "#16a34a"} style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                                      <div style={{ fontSize: 9, color: "#64748b" }}>{selectedInv?.genericName || ""} {selectedInv?.sku ? `· SKU: ${selectedInv.sku}` : ""}</div>
                                    </div>
                                    <button 
                                      className="ph-icon-btn-sm" 
                                      style={{ color: "#94a3b8", flexShrink: 0 }} 
                                      onClick={() => {
                                        const newItems = [...csItems]; 
                                        newItems[idx] = { ...newItems[idx], inventoryItemId: "", name: "", unitPrice: "0", availableStock: 0 }; 
                                        setCsItems(newItems); 
                                        setCsItemSearch({ ...csItemSearch, [idx]: "" });
                                      }}
                                    ><X size={12} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <input 
                                      className="ph-input" 
                                      placeholder="Search medicine / item..."
                                      value={csItemSearch[idx] || ""}
                                      onChange={e => setCsItemSearch({ ...csItemSearch, [idx]: e.target.value })}
                                      onFocus={() => setCsItemSearchFocused({ ...csItemSearchFocused, [idx]: true })}
                                      onBlur={() => setTimeout(() => setCsItemSearchFocused({ ...csItemSearchFocused, [idx]: false }), 200)}
                                      style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}
                                    />
                                    {/* Dropdown results */}
                                    {csItemSearchFocused[idx] && (csItemSearch[idx] || "").trim().length > 0 && (
                                      <div style={{ position: "absolute", zIndex: 9999, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 240, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.12)", marginTop: 2 }}>
                                        {(() => {
                                          const query = (csItemSearch[idx] || "").toLowerCase().trim();
                                          if (!query) return null;
                                          const matched = inventory
                                            .filter((inv: any) => inv.isActive && (
                                              inv.name.toLowerCase().includes(query) ||
                                              (inv.genericName || "").toLowerCase().includes(query) ||
                                              (inv.brandName || "").toLowerCase().includes(query) ||
                                              (inv.sku || "").toLowerCase().includes(query)
                                            ))
                                            .sort((a: any, b: any) => {
                                              // In-stock items first
                                              const stockA = a.totalStock || a.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
                                              const stockB = b.totalStock || b.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
                                              if (stockA > 0 && stockB === 0) return -1;
                                              if (stockA === 0 && stockB > 0) return 1;
                                              return 0;
                                            });

                                          if (matched.length === 0) {
                                            return (
                                              <div style={{ padding: 14, textAlign: "center" }}>
                                                <Search size={18} color="#cbd5e1" style={{ marginBottom: 4 }} />
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>No items found</div>
                                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>"{csItemSearch[idx]}" not in inventory</div>
                                                <button 
                                                  className="ph-btn-ghost" 
                                                  style={{ fontSize: 10, padding: "3px 10px", color: "#0ea5e9", marginTop: 8 }}
                                                  onClick={() => { setCsPurchaseRequestItem({ name: csItemSearch[idx] || "", quantity: 1 }); setCsPurchaseRequestModal(true); }}
                                                >
                                                  <ShoppingCart size={10} /> Request Purchase from Supplier
                                                </button>
                                              </div>
                                            );
                                          }

                                          return matched.map((inv: any) => {
                                            const stock = inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
                                            const isInStock = stock > 0;
                                            const isAlreadyAdded = csItems.some((ci, ciIdx) => ciIdx !== idx && ci.inventoryItemId === inv.id);
                                            return (
                                              <div 
                                                key={inv.id}
                                                style={{ 
                                                  padding: "8px 12px", 
                                                  cursor: isInStock ? "pointer" : "default", 
                                                  borderBottom: "1px solid #f8fafc",
                                                  display: "flex", 
                                                  alignItems: "center", 
                                                  gap: 8,
                                                  opacity: isInStock ? 1 : 0.6,
                                                  background: isAlreadyAdded ? "#f8fafc" : "#fff",
                                                }}
                                                onMouseEnter={e => { if (isInStock) (e.currentTarget as HTMLDivElement).style.background = "#f0f9ff"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isAlreadyAdded ? "#f8fafc" : "#fff"; }}
                                                onClick={() => {
                                                  if (!isInStock) return;
                                                  const newItems = [...csItems];
                                                  newItems[idx] = { 
                                                    ...newItems[idx], 
                                                    inventoryItemId: inv.id,
                                                    name: inv.name,
                                                    unitPrice: String(inv.sellingPrice || 0),
                                                    availableStock: stock
                                                  };
                                                  setCsItems(newItems);
                                                  setCsItemSearch({ ...csItemSearch, [idx]: "" });
                                                  setCsItemSearchFocused({ ...csItemSearchFocused, [idx]: false });
                                                }}
                                              >
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isInStock ? "#16a34a" : "#dc2626", flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                                                    {inv.name}
                                                    {isAlreadyAdded && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#fef3c7", color: "#92400e", fontWeight: 600 }}>Already added</span>}
                                                  </div>
                                                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                                                    {inv.genericName && <span>{inv.genericName}</span>}
                                                    {inv.brandName && <span> · {inv.brandName}</span>}
                                                    {inv.sku && <span> · SKU: {inv.sku}</span>}
                                                  </div>
                                                </div>
                                                <div style={{ flexShrink: 0, textAlign: "right" }}>
                                                  {isInStock ? (
                                                    <>
                                                      <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>{stock} {inv.unit}</div>
                                                      <div style={{ fontSize: 9, color: "#64748b" }}>₹{inv.sellingPrice || 0}</div>
                                                    </>
                                                  ) : (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", padding: "2px 6px", background: "#fef2f2", borderRadius: 4 }}>OUT OF STOCK</span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                            <td>
                              <input 
                                type="number" 
                                min="1" 
                                max={item.availableStock || undefined}
                                className="ph-input" 
                                value={item.quantity} 
                                onChange={e => { 
                                  const newItems = [...csItems]; 
                                  newItems[idx] = { ...newItems[idx], quantity: e.target.value }; 
                                  setCsItems(newItems); 
                                }}
                                style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: `1px solid ${exceedsStock ? "#f59e0b" : "#cbd5e1"}`, fontSize: 12, textAlign: "center" }} 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                min="0" 
                                className="ph-input" 
                                value={item.unitPrice} 
                                onChange={e => { 
                                  const newItems = [...csItems]; 
                                  newItems[idx] = { ...newItems[idx], unitPrice: e.target.value }; 
                                  setCsItems(newItems); 
                                }}
                                style={{ width: 80, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, textAlign: "right" }} 
                              />
                            </td>
                            <td><strong style={{ color: "#1e293b", fontSize: 12 }}>{amt.toFixed(2)}</strong></td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {item.inventoryItemId ? (
                                  <>
                                    <span style={{ fontWeight: 700, fontSize: 11, color: isOutOfStock ? "#dc2626" : exceedsStock ? "#ea580c" : "#16a34a" }}>
                                      {item.availableStock} {selectedInv?.unit || "units"}
                                    </span>
                                    {isOutOfStock && <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626" }}><Ban size={9} /> OUT</span>}
                                    {!isOutOfStock && exceedsStock && <span style={{ fontSize: 9, fontWeight: 700, color: "#ea580c" }}><AlertTriangle size={9} /> Need {combinedQtyForItem}, only {item.availableStock}</span>}
                                    {isDuplicate && !exceedsStock && <span style={{ fontSize: 9, color: "#b45309" }}><AlertTriangle size={9} /> Combined: {combinedQtyForItem}</span>}
                                  </>
                                ) : (
                                  <span style={{ fontSize: 10, color: "#94a3b8" }}>--</span>
                                )}
                              </div>
                            </td>
                            <td>
                              {csItems.length > 1 && (
                                <button className="ph-icon-btn-sm" style={{ color: "#ef4444" }} onClick={() => setCsItems(csItems.filter((_, i) => i !== idx))}><Trash2 size={13} /></button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Running Total */}
                {(() => {
                  const subtotal = csItems.reduce((s, i) => s + (parseInt(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);
                  const disc = parseFloat(csDiscount) || 0;
                  const total = Math.max(subtotal - disc, 0);
                  return (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 10, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                      <span>Subtotal: {fmtCurrency(subtotal)}</span>
                      {disc > 0 && <span style={{ color: "#ea580c" }}>Discount: -{fmtCurrency(disc)}</span>}
                      <span style={{ fontSize: 15, color: "#ea580c" }}>Total: {fmtCurrency(total)}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Payment Section */}
              <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Payment</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Payment Method</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["CASH", "UPI", "CARD", "ONLINE"] as const).map(m => (
                        <button key={m} onClick={() => setCsPaymentMethod(m)} style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1.5px solid",
                          cursor: "pointer", transition: "all .15s",
                          background: csPaymentMethod === m ? "#ea580c" : "#fff",
                          color: csPaymentMethod === m ? "#fff" : "#64748b",
                          borderColor: csPaymentMethod === m ? "#ea580c" : "#e2e8f0",
                        }}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Discount (₹)</label>
                    <input type="number" min="0" className="ph-input" value={csDiscount} onChange={e => setCsDiscount(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Transaction ID (optional)</label>
                    <input className="ph-input" placeholder="e.g. UPI ref / Card auth" value={csTransactionId} onChange={e => setCsTransactionId(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Remarks</label>
                    <input className="ph-input" placeholder="Any additional notes..." value={csRemarks} onChange={e => setCsRemarks(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="ph-modal-footer" style={{ borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="ph-btn-ghost" onClick={() => setCounterSaleModal(false)}>Cancel</button>
              <button className="ph-btn-primary" style={{ padding: "10px 24px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, background: "#ea580c" }}
                disabled={csSaving || (() => { const combined: Record<string, number> = {}; csItems.filter(i => i.inventoryItemId).forEach(i => { combined[i.inventoryItemId] = (combined[i.inventoryItemId] || 0) + (parseInt(i.quantity) || 0); }); return csItems.some(i => !i.inventoryItemId) || Object.entries(combined).some(([itemId, totalQty]) => { const item = csItems.find(i => i.inventoryItemId === itemId); return item && totalQty > item.availableStock; }); })()} onClick={handleCounterSale}>
                {csSaving ? <Loader2 size={14} className="ph-spin" /> : <Banknote size={14} />}
                Collect Payment & Generate Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Counter Sale History Modal ── */}
      {csHistoryModal && (
        <div className="ph-modal-overlay" onClick={() => setCsHistoryModal(false)}>
          <div className="ph-modal" style={{ width: 900, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header" style={{ background: "linear-gradient(135deg, #0ea5e912, #0ea5e906)", borderBottom: "1px solid #0ea5e925" }}>
              <div>
                <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <History size={18} color="#0ea5e9" /> Counter Sale History
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Recent direct sales with billing details</div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setCsHistoryModal(false)}><X size={16} /></button>
            </div>

            <div className="ph-modal-body" style={{ overflowY: "auto", flex: 1 }}>
              {csHistoryLoading ? (
                <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading history...</div>
              ) : csHistory.length === 0 ? (
                <div className="ph-empty" style={{ padding: 40 }}>
                  <Receipt size={36} color="#cbd5e1" />
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: "#64748b" }}>No counter sales yet</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Sales history will appear here after you complete transactions</div>
                </div>
              ) : (
                <div className="ph-tbl-wrap">
                  <table className="ph-tbl">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>Date</th>
                        <th>Patient</th>
                        <th>Items</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csHistory.map((sale: any) => (
                        <tr key={sale.id}>
                          <td><span className="ph-badge">{sale.billNo}</span></td>
                          <td style={{ fontSize: 11, color: "#64748b" }}>{new Date(sale.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{sale.patient?.name || "Walk-in"}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{sale.patient?.phone || ""}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 11 }}>
                              {sale.items?.slice(0, 2).map((it: any, i: number) => (
                                <div key={i} style={{ color: "#475569" }}>{it.name} × {it.quantity}</div>
                              ))}
                              {sale.items?.length > 2 && <div style={{ color: "#94a3b8" }}>+{sale.items.length - 2} more</div>}
                            </div>
                          </td>
                          <td>
                            <span className="ph-badge blue">{sale.paymentMethod}</span>
                            {sale.transactionId && <div style={{ fontSize: 9, color: "#94a3b8" }}>{sale.transactionId}</div>}
                          </td>
                          <td style={{ fontWeight: 700, color: ACCENT }}>₹{(sale.total || 0).toLocaleString("en-IN")}</td>
                          <td>
                            <span className={`ph-badge ${sale.status === "PAID" ? "green" : sale.status === "PENDING" ? "yellow" : "gray"}`}>
                              {sale.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ph-modal-footer" style={{ borderTop: "1px solid #e2e8f0" }}>
              <button className="ph-btn-ghost" onClick={() => setCsHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Counter Sale Purchase Request Modal ── */}
      {csPurchaseRequestModal && csPurchaseRequestItem && (
        <div className="ph-modal-overlay" onClick={() => setCsPurchaseRequestModal(false)}>
          <div className="ph-modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header" style={{ background: "linear-gradient(135deg, #0ea5e912, #0ea5e906)", borderBottom: "1px solid #0ea5e925" }}>
              <div>
                <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShoppingCart size={18} color="#0ea5e9" /> Request Purchase
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Create purchase request for out-of-stock item</div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setCsPurchaseRequestModal(false)}><X size={16} /></button>
            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: "14px 16px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Item Not Available</div>
                <div style={{ fontSize: 13, color: "#78350f" }}>
                  <strong>{csPurchaseRequestItem.name}</strong> is not in inventory or out of stock.
                  Create a purchase request to order from supplier.
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Item Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input className="ph-input" value={csPurchaseRequestItem.name} placeholder="Enter item name to order..." onChange={e => setCsPurchaseRequestItem({ ...csPurchaseRequestItem, name: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Quantity Needed</label>
                  <input type="number" min="1" className="ph-input" value={csPurchaseRequestItem.quantity} 
                    onChange={e => setCsPurchaseRequestItem({ ...csPurchaseRequestItem, quantity: parseInt(e.target.value) || 1 })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Priority</label>
                  <select className="ph-select" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}>
                    <option value="HIGH">High - Urgent</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Preferred Supplier (Optional)</label>
                <select className="ph-select" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.filter((s: any) => s.isActive).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Notes</label>
                <textarea className="ph-input" placeholder="Any specific requirements..." rows={3}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, resize: "vertical" }} />
              </div>
            </div>

            <div className="ph-modal-footer" style={{ borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="ph-btn-ghost" onClick={() => setCsPurchaseRequestModal(false)}>Cancel</button>
              <button className="ph-btn-primary" style={{ background: "#0ea5e9" }}
                disabled={!csPurchaseRequestItem.name.trim()}
                onClick={() => handleCreatePurchaseRequest(csPurchaseRequestItem.name, csPurchaseRequestItem.quantity)}>
                <Send size={14} /> Submit Purchase Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal (replaces alert()) ── */}
      {successModal.open && (
        <div className="ph-modal-overlay" onClick={() => setSuccessModal({ open: false, title: "", message: "", details: [] })} style={{ zIndex: 9999 }}>
          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "30px 24px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#16a34a" }}>
                <CheckCircle2 size={28} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>{successModal.title}</div>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: successModal.details.length ? 14 : 0 }}>{successModal.message}</div>
              {successModal.details.length > 0 && (
                <div style={{ textAlign: "left", padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", marginTop: 10 }}>
                  {successModal.details.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12, color: "#475569" }}>
                      <Check size={13} color="#16a34a" style={{ flexShrink: 0 }} />
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "center" }}>
              <button className="ph-btn-primary" style={{ padding: "10px 32px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}
                onClick={() => setSuccessModal({ open: false, title: "", message: "", details: [] })}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Queue: Create Manual (Walk-in) Rx Modal ── */}
      {rxCreateModal && (
        <div className="ph-modal-overlay" onClick={() => { setRxCreateModal(false); setRxCreateManualPatient(false); }}>
          <div className="ph-modal" style={{ width: 680 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div>
                <div className="ph-modal-title">Add Walk-in Prescription</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Manually add a prescription to the pharmacy queue</div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => { setRxCreateModal(false); setRxCreateManualPatient(false); }}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rxCreateError && (
                <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {rxCreateError}
                </div>
              )}
              {/* Patient — toggle between Search and Manual */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Patient <span style={{ color: "#ef4444" }}>*</span></label>
                  {!rxCreateForm.patientId && (
                    <button type="button" className="ph-btn-ghost" style={{ padding: "3px 10px", fontSize: 11 }}
                      onClick={() => { setRxCreateManualPatient(m => !m); setRxCreatePatients([]); setRxCreatePatientSearch(""); }}>
                      {rxCreateManualPatient ? <><Search size={11} /> Search Existing</> : <><Edit2 size={11} /> Enter Manually</>}
                    </button>
                  )}
                </div>

                {/* ── Patient selected ── */}
                {rxCreateForm.patientId ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{rxCreateForm.patientName}</div><div style={{ fontSize: 11, color: "#16a34a" }}>Patient selected</div></div>
                    <button className="ph-icon-btn-sm" onClick={() => setRxCreateForm(f => ({ ...f, patientId: "", patientName: "" }))}><X size={14} /></button>
                  </div>

                /* ── Manual entry mode ── */
                ) : rxCreateManualPatient ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 10, padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 3 }}>Name *</div>
                      <input className="ph-modal-input" placeholder="Patient full name" value={rxManualPatientForm.name} onChange={e => setRxManualPatientForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 3 }}>Phone *</div>
                      <input className="ph-modal-input" placeholder="10-digit phone" value={rxManualPatientForm.phone} onChange={e => setRxManualPatientForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 3 }}>Gender</div>
                      <select className="ph-modal-input" value={rxManualPatientForm.gender} onChange={e => setRxManualPatientForm(f => ({ ...f, gender: e.target.value }))}>
                        <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1/-1", fontSize: 11, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                      <User size={12} /> Patient will be auto-registered when you submit
                    </div>
                  </div>

                /* ── Search mode ── */
                ) : (
                  <div style={{ position: "relative" }}>
                    <div className="ph-search-wrap" style={{ width: "100%" }}>
                      <Search size={14} color="#94a3b8" />
                      <input className="ph-search-input" placeholder="Type patient name, phone or ID..." value={rxCreatePatientSearch} onChange={e => setRxCreatePatientSearch(e.target.value)} />
                      {rxPatientSearching && <Loader2 size={14} className="ph-spin" style={{ color: "#94a3b8" }} />}
                    </div>
                    {/* Patient results list (shown on modal open + on search) */}
                    {rxCreatePatients.length > 0 && (
                      <div style={{ marginTop: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,.12)", maxHeight: 240, overflowY: "auto" }}>
                        <div style={{ padding: "6px 14px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #f1f5f9" }}>
                          {rxCreatePatientSearch.trim().length >= 2 ? "Search Results" : "Recent Patients"} ({rxCreatePatients.length})
                        </div>
                        {rxCreatePatients.map((p: any) => (
                          <button key={p.id} style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f8fafc" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")} onMouseLeave={e => (e.currentTarget.style.background = "none")}
                            onClick={() => { setRxCreateForm(f => ({ ...f, patientId: p.id, patientName: p.name })); setRxCreatePatients([]); setRxCreatePatientSearch(""); }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: LIGHT_BG, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User size={13} color={ACCENT} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: "#1e293b" }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.patientId || ""} {p.phone ? `· ${p.phone}` : ""} {p.gender ? `· ${p.gender}` : ""}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* No results hint */}
                    {!rxPatientSearching && rxCreatePatientSearch.trim().length >= 2 && rxCreatePatients.length === 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                        <AlertCircle size={12} /> No patients found.
                        <button type="button" style={{ background: "none", border: "none", color: ACCENT, fontWeight: 700, cursor: "pointer", fontSize: 11, padding: 0 }}
                          onClick={() => { setRxCreateManualPatient(true); setRxManualPatientForm(f => ({ ...f, name: rxCreatePatientSearch })); setRxCreatePatientSearch(""); setRxCreatePatients([]); }}>
                          Enter manually instead
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Doctor + Diagnosis */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Doctor (optional)</label>
                  <select className="ph-modal-input" value={rxCreateForm.doctorId} onChange={e => setRxCreateForm(f => ({ ...f, doctorId: e.target.value }))}>
                    <option value="">— Walk-in / No Doctor —</option>
                    {rxCreateDoctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.name}{d.specialization ? ` (${d.specialization})` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Diagnosis</label>
                  <input className="ph-modal-input" placeholder="e.g. Hypertension, Diabetes..." value={rxCreateForm.diagnosis} onChange={e => setRxCreateForm((f: any) => ({ ...f, diagnosis: e.target.value }))} />
                </div>
              </div>
              {/* Medications with Price */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Medications <span style={{ color: "#ef4444" }}>*</span></label>
                  <button className="ph-btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setRxCreateForm(f => ({ ...f, medications: [...f.medications, { name: "", dosage: "", frequency: "", duration: "", quantity: "1", price: "0", instructions: "" }] }))}>
                    <Plus size={12} /> Add Row
                  </button>
                </div>
                <div className="ph-tbl-wrap">
                  <table className="ph-tbl">
                    <thead><tr><th>Medicine Name</th><th>Dosage</th><th>Freq</th><th>Qty</th><th>Price (₹)</th><th>Amount</th><th></th></tr></thead>
                    <tbody>
                      {rxCreateForm.medications.map((m, idx) => {
                        const amt = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
                        return (
                        <tr key={idx}>
                          <td><input className="ph-modal-input" style={{ width: "100%", padding: "5px 8px" }} placeholder="Medicine name" value={m.name} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], name: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>
                          <td><input className="ph-modal-input" style={{ width: 70, padding: "5px 8px" }} placeholder="500mg" value={m.dosage} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], dosage: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>
                          <td><input className="ph-modal-input" style={{ width: 70, padding: "5px 8px" }} placeholder="1-0-1" value={m.frequency} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], frequency: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>
                          <td><input type="number" min="1" className="ph-modal-input" style={{ width: 50, padding: "5px 8px" }} value={m.quantity} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], quantity: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>
                          <td><input type="number" min="0" step="0.01" className="ph-modal-input" style={{ width: 75, padding: "5px 8px" }} placeholder="0" value={m.price} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], price: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>
                          <td style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", textAlign: "right", whiteSpace: "nowrap" }}>₹{amt.toFixed(2)}</td>
                          <td><button className="ph-icon-btn-sm" style={{ color: "#ef4444" }} onClick={() => setRxCreateForm(f => ({ ...f, medications: f.medications.filter((_, i) => i !== idx) }))} disabled={rxCreateForm.medications.length === 1}><Trash2 size={13} /></button></td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Running total */}
                {(() => {
                  const sub = rxCreateForm.medications.reduce((s, m) => s + (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1), 0);
                  const disc = parseFloat(rxCreateForm.discount) || 0;
                  const grand = Math.max(0, sub - disc);
                  return (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 8, fontSize: 12, fontWeight: 600, color: "#475569" }}>
                      <span>Subtotal: <strong style={{ color: "#1e293b" }}>₹{sub.toFixed(2)}</strong></span>
                      {disc > 0 && <span>Discount: <strong style={{ color: "#ef4444" }}>-₹{disc.toFixed(2)}</strong></span>}
                      <span>Total: <strong style={{ color: ACCENT, fontSize: 14 }}>₹{grand.toFixed(2)}</strong></span>
                    </div>
                  );
                })()}
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Notes</label>
                <input className="ph-modal-input" placeholder="Pharmacist notes..." value={rxCreateForm.notes} onChange={e => setRxCreateForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {/* ── Payment / Billing Section ── */}
              <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Payment Action</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {([
                    { v: "none" as const, label: "Add to Queue Only", icon: <ClipboardList size={13} />, desc: "No billing now" },
                    { v: "collect" as const, label: "Collect Payment", icon: <Banknote size={13} />, desc: "Pay at pharmacy" },
                    { v: "send_to_billing" as const, label: "Send to Billing", icon: <CreditCard size={13} />, desc: "Bill later" },
                  ]).map(opt => (
                    <button key={opt.v} type="button" style={{
                      flex: 1, padding: "10px 10px", borderRadius: 10, border: rxCreateForm.paymentAction === opt.v ? `2px solid ${ACCENT}` : "1px solid #e2e8f0",
                      background: rxCreateForm.paymentAction === opt.v ? LIGHT_BG : "#fff", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 2,
                    }} onClick={() => setRxCreateForm(f => ({ ...f, paymentAction: opt.v }))}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: rxCreateForm.paymentAction === opt.v ? ACCENT : "#475569" }}>{opt.icon} {opt.label}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Collect payment fields */}
                {rxCreateForm.paymentAction === "collect" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Payment Method</div>
                      <select className="ph-modal-input" value={rxCreateForm.paymentMethod} onChange={e => setRxCreateForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                        <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="ONLINE">Online</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Discount (₹)</div>
                      <input type="number" min="0" className="ph-modal-input" placeholder="0" value={rxCreateForm.discount} onChange={e => setRxCreateForm(f => ({ ...f, discount: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Txn ID (optional)</div>
                      <input className="ph-modal-input" placeholder="Transaction ref" value={rxCreateForm.transactionId} onChange={e => setRxCreateForm(f => ({ ...f, transactionId: e.target.value }))} />
                    </div>
                  </div>
                )}

                {/* Send to billing fields */}
                {rxCreateForm.paymentAction === "send_to_billing" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Bill To Department</div>
                      <select className="ph-modal-input" value={rxCreateForm.billingSubdeptId} onChange={e => setRxCreateForm(f => ({ ...f, billingSubdeptId: e.target.value }))}>
                        <option value="">— Select sub-department —</option>
                        {subDepts.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name}{d.type ? ` (${d.type})` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Discount (₹)</div>
                      <input type="number" min="0" className="ph-modal-input" placeholder="0" value={rxCreateForm.discount} onChange={e => setRxCreateForm(f => ({ ...f, discount: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Billing Remark</div>
                      <input className="ph-modal-input" placeholder="Note for billing counter" value={rxCreateForm.billingNote} onChange={e => setRxCreateForm(f => ({ ...f, billingNote: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => { setRxCreateModal(false); setRxCreateManualPatient(false); }}>Cancel</button>
              <button className="ph-btn-primary" onClick={handleCreateRx} disabled={rxCreateSaving} style={{ background: rxCreateForm.paymentAction === "collect" ? "#16a34a" : undefined }}>
                {rxCreateSaving ? <Loader2 size={13} className="ph-spin" /> : rxCreateForm.paymentAction === "collect" ? <Banknote size={13} /> : rxCreateForm.paymentAction === "send_to_billing" ? <CreditCard size={13} /> : <Plus size={13} />}
                {rxCreateForm.paymentAction === "collect" ? " Collect & Add" : rxCreateForm.paymentAction === "send_to_billing" ? " Add & Send to Billing" : " Add to Queue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Queue: Substitute Medicine Modal ── */}
      {substituteModal && (
        <div className="ph-modal-overlay" onClick={() => setSubstituteModal(null)}>
          <div className="ph-modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div>
                <div className="ph-modal-title">Find Substitute</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Alternatives for: <strong>{substituteModal.name}</strong></div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setSubstituteModal(null)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body">
              {substituteLoading ? (
                <div className="ph-loading"><Loader2 size={18} className="ph-spin" /> Searching inventory...</div>
              ) : substituteResults.length === 0 ? (
                <div className="ph-empty">
                  <Package size={28} color="#cbd5e1" />
                  <div style={{ marginTop: 6 }}>No alternatives found in inventory</div>
                  <div className="ph-empty-sub">Try searching by generic name or category</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {substituteResults.map((item: any) => {
                    const stock = item.totalStock || item.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
                    const st = getStockStatus(item);
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {item.genericName && <span>{item.genericName} · </span>}
                            {item.category && <span>{item.category} · </span>}
                            {item.strength || ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{stock} {item.unit || "units"}</div>
                          <div style={{ fontSize: 10, padding: "2px 8px", background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 100, marginTop: 3 }}>{st.label}</div>
                        </div>
                        <button className="ph-btn-primary" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => {
                          setDispenseForm((prev: any) => {
                            const rxForms = { ...prev };
                            if (rxForms[substituteModal.rxId]) {
                              const meds = [...rxForms[substituteModal.rxId]];
                              meds[substituteModal.medIdx] = { ...meds[substituteModal.medIdx], name: item.name, inventoryItemId: item.id, price: item.sellingPrice || 0 };
                              rxForms[substituteModal.rxId] = meds;
                            }
                            return rxForms;
                          });
                          setSubstituteModal(null);
                        }}>
                          Use This
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setSubstituteModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Queue: Delete / Remove Confirm Modal ── */}
      {rxDeleteTarget && (
        <div className="ph-modal-overlay" onClick={() => { setRxDeleteTarget(null); setRxDeleteRemark(""); }}>
          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Remove from Queue</div>
              <button className="ph-icon-btn-sm" onClick={() => { setRxDeleteTarget(null); setRxDeleteRemark(""); }}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>
                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                    {rxDeleteTarget.prescriptionNo?.startsWith("RX-") ? "Delete Walk-in Prescription" : "Remove from Pharmacy Queue"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {rxDeleteTarget.prescriptionNo?.startsWith("RX-")
                      ? "This is a manually added prescription. It will be permanently deleted."
                      : "This will remove the prescription from pharmacy queue. Doctor can prescribe again if needed."}
                  </div>
                </div>
              </div>
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{rxDeleteTarget.patient?.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Rx: {rxDeleteTarget.prescriptionNo} · {rxDeleteTarget.medications?.length || 0} medication{rxDeleteTarget.medications?.length !== 1 ? "s" : ""}
                  {rxDeleteTarget.doctor?.name && ` · Dr. ${rxDeleteTarget.doctor.name}`}
                </div>
              </div>
              
              {/* Remark Input */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>
                  Remark / Reason <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={rxDeleteRemark}
                  onChange={e => setRxDeleteRemark(e.target.value)}
                  placeholder="Enter reason (e.g., Patient cancelled, Wrong prescription, etc.)"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => { setRxDeleteTarget(null); setRxDeleteRemark(""); }}>Cancel</button>
              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={handleDeleteRx} disabled={rxDeleting}>
                {rxDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}
                {rxDeleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Queue: Bulk Delete Confirm Modal ── */}
      {bulkDeleteModalOpen && (
        <div className="ph-modal-overlay" onClick={() => setBulkDeleteModalOpen(false)}>
          <div className="ph-modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Delete {selectedQueue.size} Prescriptions</div>
              <button className="ph-icon-btn-sm" onClick={() => setBulkDeleteModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>
                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                    Remove from Pharmacy Queue
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    These prescriptions will be removed from the pharmacy queue. 
                    Doctors can prescribe again for these patients if needed.
                  </div>
                </div>
              </div>
              
              {/* Remark Input */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>
                  Remark / Reason <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  value={bulkDeleteRemark}
                  onChange={e => setBulkDeleteRemark(e.target.value)}
                  placeholder="Enter reason for deletion (e.g., Patient cancelled, Wrong prescription, etc.)"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Selected Items Summary */}
              <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Selected Prescriptions:</div>
                {filteredQueue.filter(q => selectedQueue.has(q.id)).map(q => (
                  <div key={q.id} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{q.patient?.name}</span>
                    <span style={{ color: "#64748b" }}>{q.prescriptionNo}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setBulkDeleteModalOpen(false)}>Cancel</button>
              <button 
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} 
                onClick={async () => {
                  if (!bulkDeleteRemark.trim()) {
                    alert("Please enter a remark/reason for deletion");
                    return;
                  }
                  setQueueBulkDeleting(true);
                  try {
                    for (const id of selectedQueue) {
                      const item = filteredQueue.find(q => q.id === id);
                      await api(`/api/pharmacy/queue?id=${id}&workflowId=${item?.workflowId || ""}&remark=${encodeURIComponent(bulkDeleteRemark)}`, "DELETE");
                    }
                    setSelectedQueue(new Set());
                    setBulkDeleteModalOpen(false);
                    setBulkDeleteRemark("");
                    loadQueue();
                  } finally {
                    setQueueBulkDeleting(false);
                  }
                }} 
                disabled={queueBulkDeleting}
              >
                {queueBulkDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}
                {queueBulkDeleting ? "Deleting..." : "Yes, Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inventory Tab ── */}
      {tab === "inventory" && <PharmacyInventoryPanel />}

      {/* ── Billing Tab ── */}
      {tab === "billing" && (
        <div className="ph-section">
          {/* Billing Toolbar */}
          <div className="ph-toolbar" style={{flexWrap:"wrap",gap:8}}>
            <div className="ph-toolbar-left" style={{flexWrap:"wrap",gap:8}}>
              <div className="ph-search-wrap">
                <Search size={14} color="#94a3b8" />
                <input className="ph-search-input" placeholder="Search bill no, patient name..." value={billSearch} onChange={e => setBillSearch(e.target.value)} />
                {billSearch && <button className="ph-icon-btn-sm" onClick={() => setBillSearch("")}><X size={12} /></button>}
              </div>
              <div className="ph-filter-pills">
                {(["all","PENDING","PAID","PARTIALLY_PAID"] as const).map(f => (
                  <button key={f} className={`ph-pill${billFilter === f ? " on" : ""}`} onClick={() => setBillFilter(f)}>
                    {f === "all" && <Layers size={12} />}{f === "PENDING" && <Clock size={12} />}
                    {f === "PAID" && <CheckCircle2 size={12} />}{f === "PARTIALLY_PAID" && <DollarSign size={12} />}
                    {f === "all" ? "All" : f === "PARTIALLY_PAID" ? "Partial" : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {/* Sort Dropdown */}
              <div ref={billSortRef} style={{position:"relative"}}>
                <button onClick={() => setBillSortOpen(o => !o)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",fontSize:12,fontWeight:600,color:"#475569",cursor:"pointer"}}>
                  <ArrowUpDown size={13}/>{[
                    {v:"newest",l:"Newest First"},{v:"oldest",l:"Oldest First"},{v:"name_asc",l:"Name A-Z"},{v:"name_desc",l:"Name Z-A"},
                    {v:"total_high",l:"Amount ↓"},{v:"total_low",l:"Amount ↑"},{v:"status_paid",l:"Paid First"},{v:"status_pending",l:"Pending First"},
                  ].find(o => o.v === billSort)?.l || "Sort"}<ChevronDown size={12}/>
                </button>
                {billSortOpen && (
                  <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:100,minWidth:170,overflow:"hidden"}}>
                    {[
                      {v:"newest",l:"Newest First"},{v:"oldest",l:"Oldest First"},
                      {v:"name_asc",l:"Name A–Z"},{v:"name_desc",l:"Name Z–A"},
                      {v:"total_high",l:"Amount: High → Low"},{v:"total_low",l:"Amount: Low → High"},
                      {v:"status_paid",l:"Paid First"},{v:"status_pending",l:"Pending First"},
                    ].map(opt => (
                      <button key={opt.v} onClick={() => { setBillSort(opt.v as any); setBillSortOpen(false); }} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 14px",background:billSort===opt.v?"#f0fdf4":"transparent",border:"none",cursor:"pointer",fontSize:12,color:billSort===opt.v?ACCENT:"#475569",fontWeight:billSort===opt.v?700:400}}>
                        {opt.l}{billSort===opt.v && <CheckCircle2 size={13} color={ACCENT}/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button className="ph-btn-ghost" onClick={handleExportCSV} title="Export as CSV" style={{gap:5}}><FileSpreadsheet size={13}/> CSV</button>
              <button className="ph-btn-ghost" onClick={loadBills} title="Refresh" style={{gap:5}}><RefreshCw size={13}/> Refresh</button>
              {(billSearch || billFilter !== "all") && (
                <button className="ph-btn-ghost" onClick={() => { setBillSearch(""); setBillFilter("all"); setBillSort("newest"); }} style={{gap:5,color:"#ef4444",borderColor:"#fecaca"}}><X size={13}/> Clear</button>
              )}
            </div>
          </div>

          {/* Billing Stats Bar */}
          <div className="ph-inv-stats">
            <div className="ph-inv-stat">
              <Receipt size={14} color={ACCENT} />
              <span><strong>{bills.length}</strong> Total Bills</span>
            </div>
            <div className="ph-inv-stat" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
              <CheckCircle2 size={14} color="#16a34a" />
              <span><strong>{fmtCurrency(bills.filter(b => b.status === "PAID").reduce((s, b) => s + b.total, 0))}</strong> Collected</span>
            </div>
            <div className="ph-inv-stat warn">
              <Clock size={14} />
              <span><strong>{bills.filter(b => b.status === "PENDING").length}</strong> Pending</span>
            </div>
            <div className="ph-inv-stat" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
              <IndianRupee size={14} color="#2563eb" />
              <span><strong>{fmtCurrency(bills.reduce((s, b) => s + (b.total - b.paidAmount), 0))}</strong> Outstanding</span>
            </div>
          </div>

          {/* Bills Table */}
          {billsLoading ? (
            <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading bills...</div>
          ) : filteredBills.length === 0 ? (
            <div className="ph-empty">
              <Receipt size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No bills found</div>
              <div className="ph-empty-sub">Bills are created when prescriptions are dispensed</div>
            </div>
          ) : (
            <div className="ph-tbl-wrap">
              <table className="ph-tbl">
                <thead>
                  <tr>
                    <th>Bill No</th>
                    <th>Patient</th>
                    <th style={{textAlign:"center"}}>Items</th>
                    <th style={{textAlign:"right"}}>Subtotal</th>
                    <th style={{textAlign:"right"}}>Discount</th>
                    <th style={{textAlign:"right"}}>Total</th>
                    <th style={{textAlign:"right"}}>Paid</th>
                    <th style={{textAlign:"center"}}>Status</th>
                    <th>Date</th>
                    <th style={{textAlign:"center"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill: any) => {
                    const billItems = typeof bill.items === "string" ? (() => { try { return JSON.parse(bill.items); } catch { return []; } })() : (bill.items || []);
                    const due = bill.total - bill.paidAmount;
                    return (
                      <tr key={bill.id}>
                        <td><strong style={{color:ACCENT,fontSize:12}}>{bill.billNo}</strong></td>
                        <td>
                          <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{bill.patient?.name||"—"}</div>
                          <div style={{fontSize:10,color:"#94a3b8"}}>{bill.patient?.patientId||""}</div>
                        </td>
                        <td style={{textAlign:"center"}}><span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,fontWeight:600,color:"#475569"}}><Package size={11}/>{bill.billItems?.length||billItems.length||0}</span></td>
                        <td style={{textAlign:"right",fontSize:12}}>{fmtCurrency(bill.subtotal)}</td>
                        <td style={{textAlign:"right",color:bill.discount>0?"#ea580c":"#94a3b8",fontSize:12}}>{bill.discount>0?`-${fmtCurrency(bill.discount)}`:"—"}</td>
                        <td style={{textAlign:"right"}}><strong style={{fontSize:13}}>{fmtCurrency(bill.total)}</strong></td>
                        <td style={{textAlign:"right",color:bill.paidAmount>=bill.total?"#16a34a":"#ea580c",fontWeight:700,fontSize:12}}>{fmtCurrency(bill.paidAmount)}</td>
                        <td style={{textAlign:"center"}}>
                          <span className={`ph-badge ${bill.status==="PAID"?"green":bill.status==="PARTIALLY_PAID"?"blue":"orange"}`}>
                            {bill.status==="PARTIALLY_PAID"?"Partial":bill.status}
                          </span>
                        </td>
                        <td style={{fontSize:11,color:"#64748b"}}>{fmtDate(bill.createdAt)}</td>
                        <td>
                          <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                            <button title="View Bill" onClick={()=>setBillViewModal(bill)} style={{width:30,height:30,borderRadius:7,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#475569"}}><Eye size={13}/></button>
                            <button title="Download PDF Invoice" onClick={()=>handleDownloadInvoicePDF(bill)} style={{width:30,height:30,borderRadius:7,border:"1px solid #bfdbfe",background:"#eff6ff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#2563eb"}}><Download size={13}/></button>
                            {bill.status==="PAID" ? (
                              <button title="View Invoice/Receipt" onClick={()=>setBillInvoiceModal({bill,method:bill.payments?.[0]?.method||bill.paymentMethod||"CASH",transactionId:bill.payments?.[0]?.transactionId||""})} style={{width:30,height:30,borderRadius:7,border:"1px solid #bbf7d0",background:"#f0fdf4",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#16a34a"}}><Receipt size={13}/></button>
                            ) : bill.status!=="CANCELLED" ? (
                              <button title="Collect Payment" onClick={()=>{ setPaymentModal(bill); setPaymentForm({amount:String(due>0?due:bill.total),method:"CASH",transactionId:"",notes:""}); }} style={{width:30,height:30,borderRadius:7,border:`1px solid ${ACCENT}44`,background:LIGHT_BG,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:ACCENT}}><CreditCard size={13}/></button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Modes Legend */}
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { icon: <Banknote size={13} />, label: "Cash", color: "#16a34a" },
              { icon: <CreditCard size={13} />, label: "Card", color: "#2563eb" },
              { icon: <Wallet size={13} />, label: "UPI", color: "#9333ea" },
              { icon: <ShieldCheck size={13} />, label: "Insurance", color: "#ea580c" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                <span style={{ color: m.color }}>{m.icon}</span> {m.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {paymentModal && (
        <div className="ph-modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="ph-modal" onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div>
                <div className="ph-modal-title">Collect Payment</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{paymentModal.billNo} &middot; {paymentModal.patient?.name}</div>
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setPaymentModal(null)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body">
              {/* Bill Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><span style={{ fontSize: 11, color: "#94a3b8" }}>Total</span><div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{fmtCurrency(paymentModal.total)}</div></div>
                <div><span style={{ fontSize: 11, color: "#94a3b8" }}>Paid</span><div style={{ fontWeight: 700, fontSize: 16, color: "#16a34a" }}>{fmtCurrency(paymentModal.paidAmount)}</div></div>
                <div><span style={{ fontSize: 11, color: "#94a3b8" }}>Due</span><div style={{ fontWeight: 700, fontSize: 16, color: "#ef4444" }}>{fmtCurrency(paymentModal.total - paymentModal.paidAmount)}</div></div>
                <div><span style={{ fontSize: 11, color: "#94a3b8" }}>GST</span><div style={{ fontWeight: 600, fontSize: 13 }}>{paymentModal.isGst ? `CGST ${paymentModal.cgst}% + SGST ${paymentModal.sgst}%` : "Non-GST"}</div></div>
              </div>

              {/* Payment Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Amount (₹)</label>
                  <input type="number" className="ph-modal-input" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} min="0" step="0.01" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Payment Method</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {["CASH", "UPI", "CARD", "INSURANCE", "CHEQUE", "ONLINE"].map(m => (
                      <button key={m} className={`ph-method-btn${paymentForm.method === m ? " on" : ""}`} onClick={() => setPaymentForm(f => ({ ...f, method: m }))}>
                        {m === "CASH" && <Banknote size={14} />}
                        {m === "UPI" && <Wallet size={14} />}
                        {m === "CARD" && <CreditCard size={14} />}
                        {m === "INSURANCE" && <ShieldCheck size={14} />}
                        {m === "CHEQUE" && <FileText size={14} />}
                        {m === "ONLINE" && <Activity size={14} />}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {["CARD", "UPI", "ONLINE", "CHEQUE"].includes(paymentForm.method) && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Transaction / Reference ID</label>
                    <input className="ph-modal-input" placeholder="Enter transaction ID..." value={paymentForm.transactionId} onChange={e => setPaymentForm(f => ({ ...f, transactionId: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Notes</label>
                  <input className="ph-modal-input" placeholder="Optional notes..." value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setPaymentModal(null)}>Cancel</button>
              <button className="ph-btn-primary" onClick={handlePayment} disabled={payingBill || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}>
                {payingBill ? <Loader2 size={14} className="ph-spin" /> : <CheckCircle2 size={14} />}
                Record Payment — {fmtCurrency(parseFloat(paymentForm.amount) || 0)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Bill Modal ── */}
      {billViewModal && (
        <div className="ph-modal-overlay" onClick={()=>setBillViewModal(null)}>
          <div className="ph-modal" style={{maxWidth:620}} onClick={e=>e.stopPropagation()}>
            <div className="ph-modal-header">
              <div>
                <div className="ph-modal-title" style={{display:"flex",alignItems:"center",gap:8}}><Receipt size={16} color={ACCENT}/>{billViewModal.billNo}</div>
                <div style={{fontSize:12,color:"#64748b"}}>{billViewModal.patient?.name} · {fmtDate(billViewModal.createdAt)}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>handleDownloadInvoicePDF(billViewModal)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#2563eb",fontSize:11,fontWeight:600,cursor:"pointer"}}><Download size={12}/>PDF</button>
                <button className="ph-icon-btn-sm" onClick={()=>setBillViewModal(null)}><X size={16}/></button>
              </div>
            </div>
            <div className="ph-modal-body" style={{maxHeight:"70vh",overflowY:"auto"}}>
              {/* Patient strip */}
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:LIGHT_BG,borderRadius:10,border:`1px solid ${BORDER}`,marginBottom:14}}>
                <div style={{width:40,height:40,borderRadius:10,background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff",flexShrink:0}}>{(billViewModal.patient?.name||"?")[0].toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{billViewModal.patient?.name||"—"}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{billViewModal.patient?.patientId} {billViewModal.patient?.phone ? `· ${billViewModal.patient.phone}` : ""}</div>
                </div>
                <span className={`ph-badge ${billViewModal.status==="PAID"?"green":billViewModal.status==="PARTIALLY_PAID"?"blue":"orange"}`} style={{fontSize:11}}>{billViewModal.status}</span>
              </div>
              {/* Items table */}
              <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:6,display:"flex",alignItems:"center",gap:6}}><Package size={13} color={ACCENT}/>Medicine / Items</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:14}}>
                <thead><tr style={{background:"#f8fafc"}}>
                  <th style={{padding:"7px 10px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>#</th>
                  <th style={{padding:"7px 10px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>Item</th>
                  <th style={{padding:"7px 10px",textAlign:"center",fontWeight:700,color:"#64748b",fontSize:10}}>Qty</th>
                  <th style={{padding:"7px 10px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:10}}>Unit Price</th>
                  <th style={{padding:"7px 10px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:10}}>Amount</th>
                </tr></thead>
                <tbody>
                  {(billViewModal.billItems||[]).map((it:any,i:number)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                      <td style={{padding:"7px 10px",color:"#94a3b8"}}>{i+1}</td>
                      <td style={{padding:"7px 10px",fontWeight:600,color:"#1e293b"}}>{it.name}<span style={{display:"block",fontSize:10,color:"#94a3b8",fontWeight:400}}>{it.type}</span></td>
                      <td style={{padding:"7px 10px",textAlign:"center"}}>{it.quantity}</td>
                      <td style={{padding:"7px 10px",textAlign:"right"}}>{fmtCurrency(it.unitPrice)}</td>
                      <td style={{padding:"7px 10px",textAlign:"right",fontWeight:700}}>{fmtCurrency(it.amount)}</td>
                    </tr>
                  ))}
                  {(billViewModal.billItems||[]).length===0 && <tr><td colSpan={5} style={{padding:"16px",textAlign:"center",color:"#94a3b8"}}>No items</td></tr>}
                </tbody>
              </table>
              {/* Summary */}
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <div style={{width:220,background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0"}}>
                  {[["Subtotal",fmtCurrency(billViewModal.subtotal)],billViewModal.discount>0&&["Discount",`-${fmtCurrency(billViewModal.discount)}`],billViewModal.tax>0&&["Tax",fmtCurrency(billViewModal.tax)]].filter(Boolean).map((row:any,i:number)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:"#64748b"}}><span>{row[0]}</span><span>{row[1]}</span></div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0",borderTop:"1.5px solid #e2e8f0",marginTop:6,fontWeight:800,fontSize:14,color:"#1e293b"}}><span>Total</span><span style={{color:ACCENT}}>{fmtCurrency(billViewModal.total)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:billViewModal.paidAmount>=billViewModal.total?"#16a34a":"#ef4444",fontWeight:700}}><span>Paid</span><span>{fmtCurrency(billViewModal.paidAmount)}</span></div>
                  {(billViewModal.total-billViewModal.paidAmount)>0 && <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:"#ef4444",fontWeight:700}}><span>Due</span><span>{fmtCurrency(billViewModal.total-billViewModal.paidAmount)}</span></div>}
                </div>
              </div>
              {/* Payment history */}
              {billViewModal.payments?.length>0 && (
                <div style={{marginTop:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:6,display:"flex",alignItems:"center",gap:6}}><CreditCard size={13} color={ACCENT}/>Payment History</div>
                  {billViewModal.payments.map((p:any,i:number)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0",marginBottom:4}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#15803d"}}>{fmtCurrency(p.amount)}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{p.method} {p.transactionId?`· ${p.transactionId}`:""}</div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>{fmtDate(p.paidAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ph-modal-footer">
              {billViewModal.status!=="PAID" && billViewModal.status!=="CANCELLED" && (
                <button className="ph-btn-primary" onClick={()=>{ const due=billViewModal.total-billViewModal.paidAmount; setPaymentModal(billViewModal); setPaymentForm({amount:String(due>0?due:billViewModal.total),method:"CASH",transactionId:"",notes:""}); setBillViewModal(null); }}><CreditCard size={13}/>Collect Payment</button>
              )}
              <button className="ph-btn-ghost" onClick={()=>setBillViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice / Receipt Modal ── */}
      {billInvoiceModal && (
        <div className="ph-modal-overlay" onClick={()=>setBillInvoiceModal(null)}>
          <div className="ph-modal" style={{maxWidth:680,padding:0,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div className="ph-modal-header" style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderBottom:"1px solid #bbf7d0"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#16a34a",display:"flex",alignItems:"center",justifyContent:"center"}}><CheckCircle2 size={18} color="#fff"/></div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#166534"}}>Invoice — {billInvoiceModal.bill?.billNo}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>Payment received · {fmtCurrency(billInvoiceModal.bill?.paidAmount||billInvoiceModal.bill?.total||0)}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>handleDownloadInvoicePDF(billInvoiceModal.bill)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#2563eb",fontSize:11,fontWeight:600,cursor:"pointer"}}><Download size={12}/>PDF</button>
                <button onClick={handlePrintInvoice} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:7,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:11,fontWeight:600,cursor:"pointer"}}><FileText size={12}/>Print</button>
                <button className="ph-icon-btn-sm" onClick={()=>setBillInvoiceModal(null)}><X size={16}/></button>
              </div>
            </div>
            <div className="ph-modal-body" style={{maxHeight:"72vh",overflowY:"auto",padding:0}}>
              {/* Printable invoice area */}
              <div ref={billPrintRef} style={{padding:"24px 28px",fontFamily:"Arial,sans-serif",color:"#1e293b"}}>
                {/* Hospital header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:16,borderBottom:"2px solid #e2e8f0",marginBottom:16}}>
                  <div>
                    {hospitalInfo.logo && <img src={hospitalInfo.logo} alt="" style={{maxHeight:48,maxWidth:120,objectFit:"contain",marginBottom:6,display:"block"}}/>}
                    <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>{hospitalInfo.name||"Pharmacy"}</div>
                    {hospitalInfo.address && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{hospitalInfo.address}</div>}
                    {hospitalInfo.phone && <div style={{fontSize:11,color:"#64748b"}}>{hospitalInfo.phone}</div>}
                    {hospitalInfo.email && <div style={{fontSize:11,color:"#64748b"}}>{hospitalInfo.email}</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#10b981",letterSpacing:".1em",textTransform:"uppercase",background:"#f0fdf4",padding:"4px 12px",borderRadius:6,border:"1px solid #bbf7d0",display:"inline-block"}}>PHARMACY INVOICE</div>
                    <div style={{fontSize:18,fontWeight:800,color:"#1e293b",marginTop:6}}>{billInvoiceModal.bill?.billNo}</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{fmtDate(billInvoiceModal.bill?.createdAt||new Date().toISOString())}</div>
                  </div>
                </div>
                {/* Patient info */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,background:"#f8fafc",borderRadius:10,padding:"12px 14px",marginBottom:16,border:"1px solid #e2e8f0",fontSize:12}}>
                  <div><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Patient</span><div style={{fontWeight:700,color:"#1e293b",marginTop:2}}>{billInvoiceModal.bill?.patient?.name||"—"}</div></div>
                  <div><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Patient ID</span><div style={{fontWeight:600,color:"#1e293b",marginTop:2}}>{billInvoiceModal.bill?.patient?.patientId||"—"}</div></div>
                  <div><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Phone</span><div style={{fontWeight:600,color:"#1e293b",marginTop:2}}>{billInvoiceModal.bill?.patient?.phone||"—"}</div></div>
                  <div><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Date</span><div style={{fontWeight:600,color:"#1e293b",marginTop:2}}>{fmtDate(billInvoiceModal.bill?.createdAt||new Date().toISOString())}</div></div>
                </div>
                {/* Items */}
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:16}}>
                  <thead><tr style={{background:"#f1f5f9"}}>
                    <th style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:"#475569",fontSize:10}}>#</th>
                    <th style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:"#475569",fontSize:10}}>Medicine / Item</th>
                    <th style={{padding:"8px 10px",textAlign:"center",fontWeight:700,color:"#475569",fontSize:10}}>Qty</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:"#475569",fontSize:10}}>Unit Price</th>
                    <th style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:"#475569",fontSize:10}}>Amount</th>
                  </tr></thead>
                  <tbody>
                    {(billInvoiceModal.bill?.billItems||[]).map((it:any,i:number)=>(
                      <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"8px 10px",color:"#94a3b8"}}>{i+1}</td>
                        <td style={{padding:"8px 10px",fontWeight:600,color:"#1e293b"}}>{it.name}</td>
                        <td style={{padding:"8px 10px",textAlign:"center"}}>{it.quantity}</td>
                        <td style={{padding:"8px 10px",textAlign:"right"}}>{fmtCurrency(it.unitPrice)}</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700}}>{fmtCurrency(it.amount)}</td>
                      </tr>
                    ))}
                    {(billInvoiceModal.bill?.billItems||[]).length===0 && <tr><td colSpan={5} style={{padding:"12px",textAlign:"center",color:"#94a3b8",fontSize:11}}>No itemised details</td></tr>}
                  </tbody>
                </table>
                {/* Summary box */}
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
                  <div style={{width:230,border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
                    {[["Subtotal",fmtCurrency(billInvoiceModal.bill?.subtotal||0)],billInvoiceModal.bill?.discount>0&&["Discount",`-${fmtCurrency(billInvoiceModal.bill?.discount)}`],billInvoiceModal.bill?.tax>0&&["Tax",fmtCurrency(billInvoiceModal.bill?.tax)]].filter(Boolean).map((row:any,i:number)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",borderBottom:"1px solid #f1f5f9",fontSize:12,color:"#64748b"}}><span>{row[0]}</span><span>{row[1]}</span></div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:"#10b981",color:"#fff",fontWeight:800,fontSize:14}}><span>TOTAL</span><span>{fmtCurrency(billInvoiceModal.bill?.total||0)}</span></div>
                  </div>
                </div>
                {/* Payment strip */}
                <div style={{display:"flex",gap:8,padding:"10px 14px",background:"#f0fdf4",borderRadius:10,border:"1px solid #bbf7d0",fontSize:12,flexWrap:"wrap"}}>
                  <div style={{flex:1}}><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Payment Method</span><div style={{fontWeight:700,color:"#16a34a",marginTop:1}}>{billInvoiceModal.method||"CASH"}</div></div>
                  <div style={{flex:1}}><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Amount Paid</span><div style={{fontWeight:700,color:"#16a34a",marginTop:1}}>{fmtCurrency(billInvoiceModal.bill?.paidAmount||billInvoiceModal.bill?.total||0)}</div></div>
                  <div style={{flex:1}}><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Status</span><div style={{fontWeight:800,color:"#16a34a",marginTop:1}}>✓ PAID</div></div>
                  {billInvoiceModal.transactionId && <div style={{flex:1}}><span style={{color:"#94a3b8",fontSize:10,fontWeight:600,textTransform:"uppercase"}}>Txn ID</span><div style={{fontWeight:600,color:"#475569",marginTop:1}}>{billInvoiceModal.transactionId}</div></div>}
                </div>
                {/* Footer */}
                <div style={{textAlign:"center",marginTop:16,paddingTop:12,borderTop:"1px solid #f1f5f9",color:"#94a3b8",fontSize:10}}>
                  Thank you for choosing {hospitalInfo.name||"Pharmacy"} · This is a computer-generated invoice. No signature required.
                </div>
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={()=>setBillInvoiceModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="ph-section">
          <div className="ph-chart-header">
            <div className="ph-chart-title">Pharmacy Reports</div>
            <div className="ph-chart-subtitle">Dispensing analytics and inventory insights</div>
          </div>

          {statsLoading || !stats ? (
            <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading reports...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="ph-stats-grid" style={{ marginBottom: 20 }}>
                <div className="ph-stat-card">
                  <div className="ph-stat-icon" style={{ background: LIGHT_BG }}><IndianRupee size={18} color={ACCENT} /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value">{fmtCurrency(stats.totalRevenue)}</div>
                    <div className="ph-stat-label">Total Revenue</div>
                  </div>
                </div>
                <div className="ph-stat-card">
                  <div className="ph-stat-icon" style={{ background: "#f0fdf4" }}><Package size={18} color="#16a34a" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value">{stats.totalItems}</div>
                    <div className="ph-stat-label">Total Inventory Items</div>
                  </div>
                </div>
                <div className="ph-stat-card">
                  <div className="ph-stat-icon" style={{ background: "#fff5f5" }}><AlertTriangle size={18} color="#ef4444" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value">{stats.lowStockCount}</div>
                    <div className="ph-stat-label">Low Stock Alerts</div>
                  </div>
                </div>
                <div className="ph-stat-card">
                  <div className="ph-stat-icon" style={{ background: "#fff7ed" }}><Clock size={18} color="#ea580c" /></div>
                  <div className="ph-stat-info">
                    <div className="ph-stat-value">{stats.expiringCount}</div>
                    <div className="ph-stat-label">Expiring Soon</div>
                  </div>
                </div>
              </div>

              {/* Charts Row: Revenue + Dispensing */}
              <div className="ph-charts-row" style={{ marginBottom: 20 }}>
                <div className="ph-chart-card">
                  <div className="ph-chart-header">
                    <div className="ph-chart-title">Daily Revenue (Last 7 Days)</div>
                  </div>
                  <div className="ph-bar-chart">
                    {stats.chartData.map((d, i) => {
                      const maxRev = Math.max(...stats.chartData.map(x => x.revenue), 1);
                      const pct = (d.revenue / maxRev) * 100;
                      return (
                        <div key={i} className="ph-bar-col">
                          <div className="ph-bar-value">{fmtCurrency(d.revenue)}</div>
                          <div className="ph-bar-track">
                            <div className="ph-bar-fill revenue" style={{ height: `${Math.max(pct, 4)}%` }} />
                          </div>
                          <div className="ph-bar-label">{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="ph-chart-card">
                  <div className="ph-chart-header">
                    <div className="ph-chart-title">Dispensing Volume (Last 7 Days)</div>
                  </div>
                  <div className="ph-bar-chart">
                    {stats.chartData.map((d, i) => {
                      const maxCount = Math.max(...stats.chartData.map(x => x.count), 1);
                      const pct = (d.count / maxCount) * 100;
                      return (
                        <div key={i} className="ph-bar-col">
                          <div className="ph-bar-value">{d.count}</div>
                          <div className="ph-bar-track">
                            <div className="ph-bar-fill" style={{ height: `${Math.max(pct, 4)}%` }} />
                          </div>
                          <div className="ph-bar-label">{d.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Profit Margin & Inventory Health */}
              <div className="ph-charts-row" style={{ marginBottom: 20 }}>
                {/* Profit Margin */}
                <div className="ph-chart-card">
                  <div className="ph-chart-header">
                    <div className="ph-chart-title">Profit Margin Analysis</div>
                    <div className="ph-chart-subtitle">Based on inventory pricing</div>
                  </div>
                  {inventory.length === 0 ? (
                    <div className="ph-empty-sm">Load inventory data to see margin analysis</div>
                  ) : (
                    <div className="ph-top-list">
                      {inventory.filter(i => i.sellingPrice > 0 && i.purchasePrice > 0).slice(0, 8).map((item, idx) => {
                        const margin = ((item.sellingPrice - item.purchasePrice) / item.sellingPrice * 100);
                        const totalStock = item.totalStock || item.batches?.reduce((s, b) => s + b.remainingQty, 0) || 0;
                        return (
                          <div key={idx} className="ph-top-item">
                            <div className="ph-top-rank" style={{ background: margin >= 30 ? "#f0fdf4" : margin >= 15 ? "#fffbeb" : "#fff5f5", color: margin >= 30 ? "#16a34a" : margin >= 15 ? "#ea580c" : "#ef4444" }}>
                              {margin.toFixed(0)}%
                            </div>
                            <div className="ph-top-info">
                              <div className="ph-top-name">{item.name}</div>
                              <div className="ph-top-meta">Buy: {fmtCurrency(item.purchasePrice)} → Sell: {fmtCurrency(item.sellingPrice)} &middot; Stock: {totalStock}</div>
                            </div>
                            <div className="ph-top-revenue">{fmtCurrency((item.sellingPrice - item.purchasePrice) * totalStock)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Expiry Loss Risk */}
                <div className="ph-chart-card">
                  <div className="ph-chart-header">
                    <div className="ph-chart-title">Expiry Loss Risk</div>
                    <div className="ph-chart-subtitle">Items expiring within 30 days</div>
                  </div>
                  {(() => {
                    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
                    const expiringItems = inventory.flatMap(item =>
                      (item.batches || []).filter(b => b.expiryDate && new Date(b.expiryDate) <= thirtyDays && b.remainingQty > 0).map(b => ({
                        name: item.name, batch: b.batchNumber || "—", qty: b.remainingQty,
                        expiry: b.expiryDate!, lossValue: b.remainingQty * (b.purchasePrice || item.purchasePrice),
                        isExpired: new Date(b.expiryDate!) <= new Date(),
                      }))
                    ).sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
                    const totalLoss = expiringItems.reduce((s, e) => s + e.lossValue, 0);

                    return expiringItems.length === 0 ? (
                      <div className="ph-empty-sm" style={{ color: "#16a34a" }}>
                        <CheckCircle2 size={20} color="#16a34a" style={{ marginBottom: 4 }} />
                        No items at risk of expiry loss
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                          <div style={{ padding: "8px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
                            Potential Loss: {fmtCurrency(totalLoss)}
                          </div>
                          <div style={{ padding: "8px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#ea580c" }}>
                            {expiringItems.length} batch{expiringItems.length !== 1 ? "es" : ""} at risk
                          </div>
                        </div>
                        <div className="ph-top-list">
                          {expiringItems.slice(0, 6).map((e, idx) => (
                            <div key={idx} className="ph-top-item" style={{ borderColor: e.isExpired ? "#fecaca" : "#fed7aa" }}>
                              <div className="ph-top-rank" style={{ background: e.isExpired ? "#fff5f5" : "#fff7ed", color: e.isExpired ? "#dc2626" : "#ea580c", fontSize: 8, width: 28, height: 28 }}>
                                {e.isExpired ? "EXP" : "SOON"}
                              </div>
                              <div className="ph-top-info">
                                <div className="ph-top-name">{e.name}</div>
                                <div className="ph-top-meta">Batch: {e.batch} &middot; Qty: {e.qty} &middot; Exp: {fmtDate(e.expiry)}</div>
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>-{fmtCurrency(e.lossValue)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Inventory Health Summary */}
              <div className="ph-chart-card" style={{ marginBottom: 20 }}>
                <div className="ph-chart-header">
                  <div className="ph-chart-title">Inventory Health</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  {[
                    { label: "In Stock", count: inventory.filter(i => (i.totalStock || i.batches?.reduce((s, b) => s + b.remainingQty, 0) || 0) > i.minStock).length, color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Low Stock", count: inventory.filter(i => { const t = i.totalStock || i.batches?.reduce((s, b) => s + b.remainingQty, 0) || 0; return t > 0 && t <= i.minStock; }).length, color: "#ea580c", bg: "#fff7ed" },
                    { label: "Out of Stock", count: inventory.filter(i => (i.totalStock || i.batches?.reduce((s, b) => s + b.remainingQty, 0) || 0) === 0).length, color: "#dc2626", bg: "#fff5f5" },
                    { label: "Expiring Soon", count: stats.expiringCount, color: "#9333ea", bg: "#faf5ff" },
                    { label: "Active Items", count: inventory.filter(i => i.isActive).length, color: ACCENT, bg: LIGHT_BG },
                    { label: "Inactive", count: inventory.filter(i => !i.isActive).length, color: "#94a3b8", bg: "#f8fafc" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: s.bg, borderRadius: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.8, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Medicines Full List */}
              <div className="ph-chart-card">
                <div className="ph-chart-header">
                  <div className="ph-chart-title">Medicine Usage Report</div>
                  <div className="ph-chart-subtitle">Top dispensed medicines (last 30 days)</div>
                </div>
                {stats.topMedicines.length === 0 ? (
                  <div className="ph-empty-sm">No dispensing data available</div>
                ) : (
                  <div className="ph-tbl-wrap" style={{ border: "none", boxShadow: "none" }}>
                    <table className="ph-tbl">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Medicine</th>
                          <th>Category</th>
                          <th>Units Dispensed</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topMedicines.map((m, i) => (
                          <tr key={i}>
                            <td><span className="ph-rank">#{i + 1}</span></td>
                            <td><strong>{m.name}</strong></td>
                            <td><span className="ph-badge blue">{m.category}</span></td>
                            <td>{m.qty}</td>
                            <td><strong>{fmtCurrency(m.revenue)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════ INVENTORY MODALS ═══════════════════ */}

      {/* Add/Edit Medicine Modal */}
      {invModalOpen && (
        <div className="ph-modal-overlay" onClick={() => setInvModalOpen(false)}>
          <div className="ph-modal" style={{ width: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Pill size={20} /> {invEditing ? "Edit Medicine" : "Add New Medicine"}
              </div>
              <button className="ph-icon-btn-sm" onClick={() => setInvModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Basic Information Section */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={14} /> Basic Information
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Medicine Name <span style={{ color: "#ef4444" }}>*</span></label>
                    <input className="ph-modal-input" placeholder="e.g. Paracetamol 500mg Tablet" value={invForm.name} onChange={e => setInvForm((f: any) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Category <span style={{ color: "#ef4444" }}>*</span></label>
                    <select className="ph-modal-input" value={invForm.category} onChange={e => setInvForm((f: any) => ({ ...f, category: e.target.value }))}>
                      <option value="Medicine">Medicine</option>
                      <option value="Consumables">Consumables</option>
                      <option value="Surgical Items">Surgical Items</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Lab Items">Lab Items</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Generic Name</label>
                    <input className="ph-modal-input" placeholder="e.g. Paracetamol (Active ingredient)" value={invForm.genericName} onChange={e => setInvForm((f: any) => ({ ...f, genericName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Brand Name</label>
                    <input className="ph-modal-input" placeholder="e.g. Crocin, Dolo-650" value={invForm.brandName} onChange={e => setInvForm((f: any) => ({ ...f, brandName: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>SKU Code</label>
                    <input className="ph-modal-input" placeholder="e.g. MED-001" value={invForm.sku} onChange={e => setInvForm((f: any) => ({ ...f, sku: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Barcode</label>
                    <input className="ph-modal-input" placeholder="Scan or enter barcode" value={invForm.barcode} onChange={e => setInvForm((f: any) => ({ ...f, barcode: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Pack Size</label>
                    <input className="ph-modal-input" placeholder="e.g. 10 tablets/strip" value={invForm.packSize} onChange={e => setInvForm((f: any) => ({ ...f, packSize: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <IndianRupee size={14} /> Pricing Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Purchase Price (₹)</label>
                    <input className="ph-modal-input" type="number" step="0.01" placeholder="0.00" value={invForm.purchasePrice} onChange={e => setInvForm((f: any) => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Cost price from supplier</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>MRP (₹)</label>
                    <input className="ph-modal-input" type="number" step="0.01" placeholder="0.00" value={invForm.mrp} onChange={e => setInvForm((f: any) => ({ ...f, mrp: parseFloat(e.target.value) || 0 }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Maximum Retail Price</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Selling Price (₹)</label>
                    <input className="ph-modal-input" type="number" step="0.01" placeholder="0.00" value={invForm.sellingPrice} onChange={e => setInvForm((f: any) => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Your selling price</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Discount (%)</label>
                    <input className="ph-modal-input" type="number" min={0} max={100} placeholder="0" value={invForm.discount} onChange={e => setInvForm((f: any) => ({ ...f, discount: parseFloat(e.target.value) || 0 }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Default discount %</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>GST / Tax (%)</label>
                    <input className="ph-modal-input" type="number" min={0} max={100} placeholder="0" value={invForm.gst} onChange={e => setInvForm((f: any) => ({ ...f, gst: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>HSN Code</label>
                    <input className="ph-modal-input" placeholder="e.g. 3004 (for medicines)" value={invForm.hsnCode} onChange={e => setInvForm((f: any) => ({ ...f, hsnCode: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Unit of Measurement</label>
                    <input className="ph-modal-input" placeholder="e.g. Strip, Bottle, Vial" value={invForm.unit} onChange={e => setInvForm((f: any) => ({ ...f, unit: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Stock Management Section */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <Boxes size={14} /> Stock Management
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Min Stock Level</label>
                    <input className="ph-modal-input" type="number" min={0} placeholder="5" value={invForm.minStock} onChange={e => setInvForm((f: any) => ({ ...f, minStock: parseInt(e.target.value) || 0 }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Low stock alert threshold</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Max Stock Level</label>
                    <input className="ph-modal-input" type="number" min={0} placeholder="100" value={invForm.maxStock || ""} onChange={e => setInvForm((f: any) => ({ ...f, maxStock: parseInt(e.target.value) || null }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Maximum stock to maintain</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Reorder Level</label>
                    <input className="ph-modal-input" type="number" min={0} placeholder="10" value={invForm.reorderLevel || ""} onChange={e => setInvForm((f: any) => ({ ...f, reorderLevel: parseInt(e.target.value) || null }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Trigger purchase order at</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Reorder Quantity</label>
                    <input className="ph-modal-input" type="number" min={0} placeholder="50" value={invForm.reorderQty || ""} onChange={e => setInvForm((f: any) => ({ ...f, reorderQty: parseInt(e.target.value) || null }))} />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Quantity to reorder</div>
                  </div>
                </div>
              </div>

              {/* Storage & Location Section */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <Archive size={14} /> Storage & Location
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Storage Location</label>
                    <select className="ph-modal-input" value={invForm.location} onChange={e => setInvForm((f: any) => ({ ...f, location: e.target.value }))}>
                      <option value="Pharmacy Store">Pharmacy Store</option>
                      <option value="OT Store">OT Store</option>
                      <option value="Ward Stock">Ward Stock</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Rack / Shelf Number</label>
                    <input className="ph-modal-input" placeholder="e.g. A-12, B-05" value={invForm.rackNumber} onChange={e => setInvForm((f: any) => ({ ...f, rackNumber: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Temperature Requirement</label>
                    <select className="ph-modal-input" value={invForm.tempRequirement} onChange={e => setInvForm((f: any) => ({ ...f, tempRequirement: e.target.value }))}>
                      <option value="Room Temp">Room Temperature (15-25°C)</option>
                      <option value="Refrigerated">Refrigerated (2-8°C)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Regulatory & Compliance Section */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={14} /> Regulatory & Compliance
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Drug Schedule</label>
                    <select className="ph-modal-input" value={invForm.drugSchedule} onChange={e => setInvForm((f: any) => ({ ...f, drugSchedule: e.target.value }))}>
                      <option value="OTC">OTC (Over The Counter)</option>
                      <option value="Schedule H">Schedule H (Prescription Required)</option>
                      <option value="Schedule X">Schedule X (Narcotics)</option>
                    </select>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Regulatory classification</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Sub Category</label>
                    <input className="ph-modal-input" placeholder="e.g. Tablet, Injection, Syrup" value={invForm.subCategory} onChange={e => setInvForm((f: any) => ({ ...f, subCategory: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#475569" }}>
                    <input type="checkbox" checked={invForm.requiresRx} onChange={e => setInvForm((f: any) => ({ ...f, requiresRx: e.target.checked }))} style={{ width: 18, height: 18, accentColor: ACCENT }} />
                    <span>Requires Doctor's Prescription (Rx)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#475569" }}>
                    <input type="checkbox" checked={invForm.isActive} onChange={e => setInvForm((f: any) => ({ ...f, isActive: e.target.checked }))} style={{ width: 18, height: 18, accentColor: ACCENT }} />
                    <span>Active / Available for Sale</span>
                  </label>
                </div>
              </div>

              {/* Description Section */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={14} /> Additional Information
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Description / Notes</label>
                  <textarea 
                    className="ph-modal-input" 
                    rows={3}
                    placeholder="Enter additional details about the medicine, usage instructions, side effects, etc."
                    value={invForm.description} 
                    onChange={e => setInvForm((f: any) => ({ ...f, description: e.target.value }))}
                    style={{ resize: "vertical", minHeight: 60 }}
                  />
                </div>
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setInvModalOpen(false)}>Cancel</button>
              <button className="ph-btn-primary" onClick={saveInventory} disabled={invSaving || !invForm.name.trim()}>
                {invSaving ? <><Loader2 size={14} className="ph-spin" /> Saving...</> : <><Check size={14} /> {invEditing ? "Update" : "Save"} Medicine</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Medicine Confirmation */}
      {invDeleteTarget && (
        <div className="ph-modal-overlay" onClick={() => setInvDeleteTarget(null)}>
          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Delete Medicine</div>
              <button className="ph-icon-btn-sm" onClick={() => setInvDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>
                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Are you sure?</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>This will permanently delete <strong>{invDeleteTarget.name}</strong> from the inventory. This action cannot be undone.</div>
                </div>
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setInvDeleteTarget(null)}>Cancel</button>
              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={deleteInventory} disabled={invDeleting}>
                {invDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}
                {invDeleting ? "Deleting..." : "Delete Medicine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ PURCHASE MODALS ═══════════════════ */}

      {/* Create Purchase Order Modal */}
      {purchaseModalOpen && (
        <div className="ph-modal-overlay" onClick={() => setPurchaseModalOpen(false)}>
          <div className="ph-modal" style={{ width: 900, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title"><ShoppingCart size={18} style={{ marginRight: 8 }} /> Create Purchase Order</div>
              <button className="ph-icon-btn-sm" onClick={() => setPurchaseModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* PO Header Information */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Order Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>PO Number <span style={{ color: "#ef4444" }}>*</span></label>
                    <input className="ph-modal-input" placeholder="e.g. PO-001" value={purchaseForm.purchaseNo} onChange={e => setPurchaseForm((f: any) => ({ ...f, purchaseNo: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Supplier <span style={{ color: "#ef4444" }}>*</span></label>
                    <select className="ph-modal-input" value={purchaseForm.supplierId} onChange={e => setPurchaseForm((f: any) => ({ ...f, supplierId: e.target.value }))}>
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name} {s.gstNumber ? `(GST: ${s.gstNumber})` : ""}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Order Date</label>
                    <input className="ph-modal-input" type="date" value={purchaseForm.orderDate} onChange={e => setPurchaseForm((f: any) => ({ ...f, orderDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Expected Delivery</label>
                    <input className="ph-modal-input" type="date" value={purchaseForm.expectedDeliveryDate} onChange={e => setPurchaseForm((f: any) => ({ ...f, expectedDeliveryDate: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Order Notes / Terms</label>
                  <input className="ph-modal-input" placeholder="Enter any special instructions, payment terms, or delivery notes..." value={purchaseForm.notes} onChange={e => setPurchaseForm((f: any) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={16} /> Purchase Items
                  </div>
                  <button className="ph-btn-primary" onClick={addPurchaseItem} style={{ fontSize: 12, padding: "6px 12px" }}><Plus size={14} /> Add Item</button>
                </div>
                
                {/* Items Table Header */}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) 70px 90px 90px 100px 140px 36px", gap: 10, padding: "10px 12px", background: "#f1f5f9", borderRadius: "8px 8px 0 0", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", alignItems: "center" }}>
                  <div>Medicine / Product</div>
                  <div style={{ textAlign: "center" }}>Qty</div>
                  <div style={{ textAlign: "right" }}>Unit Price</div>
                  <div style={{ textAlign: "right" }}>MRP</div>
                  <div style={{ textAlign: "right" }}>Total</div>
                  <div style={{ textAlign: "center" }}>Batch & Expiry</div>
                  <div></div>
                </div>
                
                {/* Items Rows */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {purchaseForm.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) 70px 90px 90px 100px 140px 36px", gap: 10, padding: "10px 12px", background: "#fff", border: "1px solid #e2e8f0", borderTop: "none", alignItems: "center" }}>
                      <select className="ph-modal-input" style={{ fontSize: 12, width: "100%" }} value={item.itemId} onChange={e => updatePurchaseItem(idx, "itemId", e.target.value)}>
                        <option value="">-- Select Medicine --</option>
                        {inventory.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.name} {inv.genericName ? `(${inv.genericName})` : ""}</option>)}
                      </select>
                      <input className="ph-modal-input" style={{ fontSize: 12, textAlign: "center", width: "100%" }} type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updatePurchaseItem(idx, "quantity", parseInt(e.target.value) || 0)} />
                      <input className="ph-modal-input" style={{ fontSize: 12, textAlign: "right", width: "100%" }} type="number" step="0.01" placeholder="0.00" value={item.price} onChange={e => updatePurchaseItem(idx, "price", parseFloat(e.target.value) || 0)} />
                      <input className="ph-modal-input" style={{ fontSize: 12, textAlign: "right", width: "100%" }} type="number" step="0.01" placeholder="0.00" value={item.sellingPrice} onChange={e => updatePurchaseItem(idx, "sellingPrice", parseFloat(e.target.value) || 0)} />
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", textAlign: "right", paddingRight: 4 }}>
                        {fmtCurrency((item.price || 0) * (item.quantity || 0))}
                      </div>
                      <div style={{ display: "flex", gap: 4, width: "100%" }}>
                        <input className="ph-modal-input" style={{ fontSize: 11, width: "50%" }} placeholder="Batch#" value={item.batchNumber} onChange={e => updatePurchaseItem(idx, "batchNumber", e.target.value)} />
                        <input className="ph-modal-input" style={{ fontSize: 11, width: "50%" }} type="date" value={item.expiryDate} onChange={e => updatePurchaseItem(idx, "expiryDate", e.target.value)} />
                      </div>
                      <button className="ph-icon-btn-sm" onClick={() => removePurchaseItem(idx)} disabled={purchaseForm.items.length === 1} style={{ color: "#ef4444" }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Additional Charges */}
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Additional Charges</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Discount (%)</label>
                      <input className="ph-modal-input" type="number" min={0} max={100} placeholder="0" value={purchaseForm.discount} onChange={e => setPurchaseForm((f: any) => ({ ...f, discount: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Tax (%)</label>
                      <input className="ph-modal-input" type="number" min={0} placeholder="0" value={purchaseForm.taxPercent} onChange={e => setPurchaseForm((f: any) => ({ ...f, taxPercent: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Shipping (₹)</label>
                      <input className="ph-modal-input" type="number" min={0} placeholder="0" value={purchaseForm.shippingCharges} onChange={e => setPurchaseForm((f: any) => ({ ...f, shippingCharges: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                </div>
                
                {/* Total Summary */}
                <div style={{ background: "#0E898F", padding: 16, borderRadius: 12, color: "#fff" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.9 }}>Order Summary</div>
                  {(() => {
                    const subtotal = purchaseForm.items.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
                    const discountAmount = subtotal * (purchaseForm.discount || 0) / 100;
                    const afterDiscount = subtotal - discountAmount;
                    const taxAmount = afterDiscount * (purchaseForm.taxPercent || 0) / 100;
                    const shipping = purchaseForm.shippingCharges || 0;
                    const total = afterDiscount + taxAmount + shipping;
                    return (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                          <span>Subtotal:</span>
                          <span>{fmtCurrency(subtotal)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, opacity: purchaseForm.discount ? 1 : 0.7 }}>
                          <span>Discount ({purchaseForm.discount || 0}%):</span>
                          <span>-{fmtCurrency(discountAmount)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, opacity: purchaseForm.taxPercent ? 1 : 0.7 }}>
                          <span>Tax ({purchaseForm.taxPercent || 0}%):</span>
                          <span>+{fmtCurrency(taxAmount)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, opacity: shipping ? 1 : 0.7 }}>
                          <span>Shipping:</span>
                          <span>+{fmtCurrency(shipping)}</span>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>
                          <span>Grand Total:</span>
                          <span>{fmtCurrency(total)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setPurchaseModalOpen(false)}>Cancel</button>
              <button className="ph-btn-primary" onClick={savePurchase} disabled={purchaseSaving || !purchaseForm.supplierId || !purchaseForm.purchaseNo || purchaseForm.items.some((i: any) => !i.itemId || i.quantity <= 0)}>
                {purchaseSaving ? <><Loader2 size={14} className="ph-spin" /> Creating...</> : <><Check size={14} /> Create Purchase Order</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ SUPPLIER MODALS ═══════════════════ */}

      {/* Add/Edit Supplier Modal */}
      {supplierModalOpen && (
        <div className="ph-modal-overlay" onClick={() => setSupplierModalOpen(false)}>
          <div className="ph-modal" style={{ width: 560, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title">{supplierEditing ? "Edit Supplier" : "Add New Supplier"}</div>
              <button className="ph-icon-btn-sm" onClick={() => setSupplierModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Supplier Name *</label>
                  <input className="ph-modal-input" placeholder="e.g. ABC Pharma Ltd" value={supplierForm.name} onChange={e => setSupplierForm((f: any) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Contact Person</label>
                  <input className="ph-modal-input" placeholder="e.g. John Doe" value={supplierForm.contactPerson} onChange={e => setSupplierForm((f: any) => ({ ...f, contactPerson: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Phone</label>
                  <input className="ph-modal-input" placeholder="e.g. +91 98765 43210" value={supplierForm.phone} onChange={e => setSupplierForm((f: any) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Email</label>
                  <input className="ph-modal-input" placeholder="e.g. contact@abcpharma.com" value={supplierForm.email} onChange={e => setSupplierForm((f: any) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>GST Number</label>
                <input className="ph-modal-input" placeholder="e.g. 27AABCU9603R1ZX" value={supplierForm.gstNumber} onChange={e => setSupplierForm((f: any) => ({ ...f, gstNumber: e.target.value }))} />
              </div>
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Address</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input className="ph-modal-input" placeholder="Address Line 1" value={supplierForm.address1} onChange={e => setSupplierForm((f: any) => ({ ...f, address1: e.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <input className="ph-modal-input" placeholder="City" value={supplierForm.city} onChange={e => setSupplierForm((f: any) => ({ ...f, city: e.target.value }))} />
                    <input className="ph-modal-input" placeholder="State" value={supplierForm.state} onChange={e => setSupplierForm((f: any) => ({ ...f, state: e.target.value }))} />
                    <input className="ph-modal-input" placeholder="Pincode" value={supplierForm.pincode} onChange={e => setSupplierForm((f: any) => ({ ...f, pincode: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Notes</label>
                <textarea className="ph-modal-input" rows={3} placeholder="Additional notes..." value={supplierForm.notes} onChange={e => setSupplierForm((f: any) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setSupplierModalOpen(false)}>Cancel</button>
              <button className="ph-btn-primary" onClick={saveSupplier} disabled={supplierSaving || !supplierForm.name.trim()}>
                {supplierSaving ? <><Loader2 size={14} className="ph-spin" /> Saving...</> : <><Check size={14} /> {supplierEditing ? "Update" : "Save"} Supplier</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Supplier Confirmation */}
      {supplierDeleteTarget && (
        <div className="ph-modal-overlay" onClick={() => setSupplierDeleteTarget(null)}>
          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="ph-modal-header">
              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Delete Supplier</div>
              <button className="ph-icon-btn-sm" onClick={() => setSupplierDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>
                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Are you sure?</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>This will delete <strong>{supplierDeleteTarget.name}</strong> from the suppliers list.</div>
                </div>
              </div>
            </div>
            <div className="ph-modal-footer">
              <button className="ph-btn-ghost" onClick={() => setSupplierDeleteTarget(null)}>Cancel</button>
              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={deleteSupplier} disabled={supplierDeleting}>
                {supplierDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}
                {supplierDeleting ? "Deleting..." : "Delete Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Real-time New Prescription Notification Modal ── */}
      {newRxNotification && (
        <div className="ph-modal-overlay" style={{ zIndex: 10000 }} onClick={e => e.stopPropagation()}>
          <div className="ph-modal" style={{ width: 600, maxHeight: "90vh", animation: "phSlideIn .3s ease" }}>
            <div className="ph-modal-header" style={{ background: `linear-gradient(135deg, ${ACCENT}, #0A6B70)`, color: "#fff", borderBottom: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={22} color="#fff" />
                </div>
                <div>
                  <div className="ph-modal-title" style={{ color: "#fff", fontSize: 18 }}>New Prescription Received!</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", marginTop: 2 }}>
                    From Dr. {newRxNotification.doctor?.name} · {newRxNotification.prescriptionNo}
                  </div>
                </div>
              </div>
              <button 
                className="ph-icon-btn-sm" 
                style={{ color: "#fff", background: "rgba(255,255,255,.15)" }}
                onClick={() => setNewRxNotification(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="ph-modal-body" style={{ padding: "20px 24px" }}>
              {/* Patient Info */}
              <div style={{ display: "flex", gap: 14, padding: "14px 16px", background: LIGHT_BG, borderRadius: 12, border: `1px solid ${BORDER}`, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: ACCENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>
                  {(newRxNotification.patient?.name || "P")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{newRxNotification.patient?.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {newRxNotification.patient?.patientId} · {newRxNotification.patient?.phone || "No phone"}
                  </div>
                  {newRxNotification.appointment?.tokenNumber && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ padding: "3px 10px", background: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, color: ACCENT, border: `1px solid ${BORDER}` }}>
                        Token #{newRxNotification.appointment.tokenNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              {newRxNotification.diagnosis && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Diagnosis</div>
                  <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155" }}>
                    {newRxNotification.diagnosis}
                  </div>
                </div>
              )}

              {/* Medications */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    Medications ({newRxNotification.medicationCount})
                  </div>
                  <span className="ph-badge" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                    Ready to Dispense
                  </span>
                </div>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                  {newRxNotification.medications?.map((med: any, idx: number) => (
                    <div key={idx} style={{ padding: "10px 14px", borderBottom: idx < newRxNotification.medications.length - 1 ? "1px solid #f1f5f9" : "none", background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{med.name || med.medicine}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {med.dosage || med.dose} · {med.frequency} · {med.duration}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0A6B70" }}>
                            ₹{((parseFloat(med.price) || 0) * (parseInt(med.quantity) || 1)).toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>Qty: {med.quantity}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing Summary */}
              <div style={{ padding: "14px 16px", background: "#f8fffe", borderRadius: 12, border: `2px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Billing Summary</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Medicines Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>₹{newRxNotification.billing?.subtotal?.toLocaleString("en-IN") || "0"}</span>
                </div>
                {newRxNotification.billing?.charges?.length > 0 && newRxNotification.billing.charges.map((charge: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{charge.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>₹{(charge.amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Total Amount</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>₹{newRxNotification.billing?.total?.toLocaleString("en-IN") || "0"}</span>
                </div>
              </div>
            </div>
            <div className="ph-modal-footer" style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
              <button 
                className="ph-btn-ghost" 
                onClick={() => setNewRxNotification(null)}
                style={{ padding: "10px 20px" }}
              >
                Dismiss
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button 
                  className="ph-btn-primary"
                  style={{ background: "#16a34a", padding: "10px 20px" }}
                  onClick={() => {
                    setNewRxNotification(null);
                    setTab("queue");
                    setExpandedRx(newRxNotification.id);
                  }}
                >
                  <Eye size={14} /> View in Queue
                </button>
                <button 
                  className="ph-btn-primary"
                  style={{ padding: "10px 20px" }}
                  onClick={() => {
                    setNewRxNotification(null);
                    // Find the queue item and open dispense modal
                    const item = queue.find((q: any) => q.id === newRxNotification.id);
                    if (item) {
                      setDispenseModalItem(item);
                      setDispensingId(null);
                      setDispenseNotes("");
                      setTransferTo("");
                    } else {
                      // If not in queue yet, refresh and then open
                      loadQueue().then(() => {
                        setTimeout(() => {
                          const refreshedItem = queue.find((q: any) => q.id === newRxNotification.id);
                          if (refreshedItem) {
                            setDispenseModalItem(refreshedItem);
                            setDispensingId(null);
                            setDispenseNotes("");
                            setTransferTo("");
                          }
                        }, 500);
                      });
                    }
                  }}
                >
                  <Pill size={14} /> Dispense & Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const pharmacyStyles = `
  /* Navigation */
  .ph-nav{display:flex;gap:0;padding:6px 0;margin-bottom:20px;border-bottom:2px solid #f1f5f9;flex-wrap:wrap}
  .ph-nav-btn{padding:9px 16px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;white-space:nowrap}
  .ph-nav-btn:hover{color:#334155;background:#f8fafc}
  .ph-nav-btn.on{color:${ACCENT};border-bottom-color:${ACCENT};background:${LIGHT_BG}}

  /* Section */
  .ph-section{animation:phFadeIn .2s ease}
  @keyframes phFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}

  /* Stats Grid */
  .ph-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}
  .ph-stats-grid-6{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
  @media(max-width:1100px){.ph-stats-grid-6{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:600px){.ph-stats-grid-6{grid-template-columns:1fr}}
  .ph-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:all .15s}
  .ph-stat-card:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(14,137,143,.08)}
  .ph-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .ph-stat-info{min-width:0}
  .ph-stat-value{font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
  .ph-stat-label{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}

  /* Alerts */
  .ph-alerts-row{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
  .ph-alert-card{flex:1;min-width:240px;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:500}
  .ph-alert-card.warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
  .ph-alert-card.danger{background:#fff5f5;border:1px solid #fecaca;color:#991b1b}
  .ph-alert-card.info{background:${LIGHT_BG};border:1px solid ${BORDER};color:#0A6B70}
  .ph-alert-action{margin-left:auto;padding:5px 12px;border-radius:8px;border:1px solid currentColor;background:none;color:inherit;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}
  .ph-alert-action:hover{opacity:.8}

  /* Flow Card */
  .ph-flow-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:20px}
  .ph-flow-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:14px}
  .ph-flow-steps{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .ph-flow-step{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;transition:all .15s}
  .ph-flow-step.active{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}
  .ph-flow-step.highlight{background:${LIGHT_BG};border-color:${BORDER};color:${ACCENT};box-shadow:0 2px 8px rgba(14,137,143,.12)}
  .ph-flow-num{width:22px;height:22px;border-radius:50%;background:currentColor;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
  .ph-flow-step.active .ph-flow-num{background:#16a34a}
  .ph-flow-step.highlight .ph-flow-num{background:${ACCENT}}
  .ph-flow-text{white-space:nowrap}
  .ph-flow-arrow{color:#cbd5e1;display:flex;align-items:center}

  /* Charts Row */
  .ph-charts-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
  @media(max-width:900px){.ph-charts-row{grid-template-columns:1fr}}
  .ph-chart-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px}
  .ph-chart-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;gap:8px}
  .ph-chart-title{font-size:14px;font-weight:700;color:#1e293b}
  .ph-chart-subtitle{font-size:11px;color:#94a3b8}

  /* Bar Chart */
  .ph-bar-chart{display:flex;align-items:flex-end;gap:8px;height:160px;padding-top:10px}
  .ph-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%}
  .ph-bar-value{font-size:10px;font-weight:700;color:#475569;white-space:nowrap}
  .ph-bar-track{flex:1;width:100%;max-width:36px;background:#f1f5f9;border-radius:6px 6px 0 0;position:relative;overflow:hidden;display:flex;align-items:flex-end}
  .ph-bar-fill{width:100%;background:linear-gradient(to top,${ACCENT},#10b981);border-radius:6px 6px 0 0;transition:height .4s ease;min-height:2px}
  .ph-bar-fill.revenue{background:linear-gradient(to top,#f59e0b,#f97316)}
  .ph-bar-label{font-size:9px;color:#94a3b8;font-weight:600;white-space:nowrap}

  /* Notification Modal Animation */
  @keyframes phSlideIn{from{opacity:0;transform:translateY(-20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}

  /* Top List */
  .ph-top-list{display:flex;flex-direction:column;gap:8px}
  .ph-top-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:#fafbfc;border:1px solid #f1f5f9}
  .ph-top-rank{width:24px;height:24px;border-radius:50%;background:${LIGHT_BG};color:${ACCENT};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}
  .ph-top-info{flex:1;min-width:0}
  .ph-top-name{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ph-top-meta{font-size:10px;color:#94a3b8}
  .ph-top-revenue{font-size:12px;font-weight:700;color:${ACCENT};white-space:nowrap}

  /* Quick Actions */
  .ph-quick-actions{margin-bottom:20px}
  .ph-quick-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px}
  .ph-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .ph-quick-btn{display:flex;align-items:center;gap:10px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:13px;font-weight:600;color:#334155;transition:all .15s;position:relative}
  .ph-quick-btn:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(14,137,143,.08);transform:translateY(-1px)}
  .ph-quick-badge{position:absolute;top:8px;right:8px;min-width:20px;height:20px;border-radius:50%;background:#ef4444;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px}
  .ph-quick-badge.warn{background:#f59e0b}

  /* Toolbar */
  .ph-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .ph-toolbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .ph-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:260px}
  .ph-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
  .ph-search-input::placeholder{color:#94a3b8}
  .ph-icon-btn-sm{width:20px;height:20px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;border-radius:4px}
  .ph-icon-btn-sm:hover{background:#e2e8f0}

  /* Filter Pills */
  .ph-filter-pills{display:flex;gap:6px}
  .ph-pill{padding:6px 12px;border-radius:100px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s;white-space:nowrap}
  .ph-pill:hover{border-color:#cbd5e1}
  .ph-pill.on{background:${LIGHT_BG};border-color:${BORDER};color:${ACCENT}}
  .ph-pill-count{background:${ACCENT};color:#fff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:50px;min-width:16px;text-align:center}

  /* Buttons */
  .ph-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:${ACCENT};color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap}
  .ph-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
  .ph-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .ph-btn-ghost{padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}
  .ph-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}

  /* Badge */
  .ph-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap}
  .ph-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
  .ph-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
  .ph-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
  .ph-badge.blue{background:${LIGHT_BG};color:#0A6B70;border:1px solid ${BORDER}}

  /* Queue */
  .ph-queue-list{display:flex;flex-direction:column;gap:10px}
  .ph-queue-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;transition:all .15s}
  .ph-queue-card:hover{border-color:#cbd5e1}
  .ph-queue-card.dispensed{opacity:.75}
  .ph-queue-card.expanded{border-color:${BORDER};box-shadow:0 2px 16px rgba(14,137,143,.08)}
  .ph-queue-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;cursor:pointer;gap:12px}
  .ph-queue-left{display:flex;align-items:center;gap:12px;min-width:0}
  .ph-token{width:36px;height:36px;border-radius:10px;background:${LIGHT_BG};color:${ACCENT};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
  .ph-queue-patient{font-size:14px;font-weight:700;color:#1e293b}
  .ph-queue-meta{font-size:11px;color:#94a3b8;margin-top:2px}
  .ph-queue-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
  .ph-queue-doctor{font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;white-space:nowrap}
  .ph-queue-meds-count{font-size:11px;color:#94a3b8;font-weight:600;background:#f8fafc;padding:3px 8px;border-radius:6px;white-space:nowrap}

  /* Queue Body */
  .ph-queue-body{padding:0 18px 18px;border-top:1px solid #f1f5f9}
  .ph-rx-info{font-size:12px;color:#475569;padding:10px 0 6px;display:flex;gap:6px}
  .ph-rx-label{font-weight:700;color:#64748b;flex-shrink:0}
  .ph-meds-header{font-size:12px;font-weight:700;color:#1e293b;margin:10px 0 8px;text-transform:uppercase;letter-spacing:.05em}
  .ph-meds-table-wrap{overflow-x:auto;border:1px solid #f1f5f9;border-radius:10px}
  .ph-meds-table{width:100%;border-collapse:collapse;font-size:12px}
  .ph-meds-table th{text-align:left;padding:8px 12px;background:#fafbfc;color:#64748b;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #f1f5f9;white-space:nowrap}
  .ph-meds-table td{padding:8px 12px;color:#475569;border-bottom:1px solid #fafbfc}
  .ph-meds-table tr:last-child td{border-bottom:none}
  .ph-med-name{font-weight:600;color:#1e293b}
  .ph-med-generic{font-size:10px;color:#94a3b8;margin-top:1px}

  /* Dispense Bar */
  .ph-dispense-bar{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #f1f5f9}
  .ph-dispense-notes{flex:1;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:12px;outline:none;background:#f8fafc;color:#334155;font-family:inherit}
  .ph-dispense-notes:focus{border-color:${BORDER};box-shadow:0 0 0 3px rgba(14,137,143,.1)}
  .ph-dispensed-badge{display:flex;align-items:center;gap:6px;padding:10px 14px;margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#16a34a;font-size:12px;font-weight:700}

  /* Inventory Stats */
  .ph-inv-stats{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .ph-inv-stat{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:12px;color:#475569}
  .ph-inv-stat.warn{background:#fffbeb;border-color:#fde68a;color:#92400e}

  /* Table Action Buttons */
  .ph-tbl-action{width:30px;height:30px;border:1px solid transparent;background:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:#94a3b8;border-radius:7px;transition:all .12s;padding:0}
  .ph-tbl-action:hover{background:#f1f5f9;border-color:#e2e8f0;color:#475569}

  /* Queue Row */
  .ph-queue-row{transition:background .15s}
  .ph-queue-row:hover td{background:#fafbfc}
  .ph-queue-row.expanded td{background:#f8fffe}

  /* Table */
  .ph-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .ph-tbl{width:100%;border-collapse:collapse}
  .ph-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.05em}
  .ph-tbl td{padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #fafbfc}
  .ph-tbl tr:last-child td{border-bottom:none}
  .ph-tbl tbody tr:hover td{background:#fafbfc}
  .ph-row-warn{background:#fffbeb !important}
  .ph-row-warn td{background:#fffbeb !important}
  .ph-med-cell{min-width:0}
  .ph-rank{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${LIGHT_BG};color:${ACCENT};font-size:10px;font-weight:800}

  /* Supplier Grid */
  .ph-supplier-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:12px}
  .ph-supplier-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;transition:all .15s}
  .ph-supplier-card:hover{border-color:${BORDER}}
  .ph-supplier-name{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px}
  .ph-supplier-meta{font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;margin-top:3px}

  /* Loading / Empty */
  .ph-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:13px}
  .ph-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center}
  .ph-empty-sm{text-align:center;padding:20px;color:#94a3b8;font-size:12px}
  .ph-empty-sub{font-size:11px;color:#cbd5e1;margin-top:4px}
  .ph-link{color:${ACCENT};font-weight:700;background:none;border:none;cursor:pointer;text-decoration:underline}

  /* Modal */
  .ph-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;animation:phFadeIn .15s ease}
  .ph-modal{background:#fff;border-radius:18px;width:520px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
  .ph-modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #f1f5f9}
  .ph-modal-title{font-size:16px;font-weight:700;color:#1e293b}
  .ph-modal-body{padding:20px 22px}
  .ph-modal-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid #f1f5f9}
  .ph-modal-input{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;color:#334155;outline:none;font-family:inherit;background:#f8fafc}
  .ph-modal-input:focus{border-color:${BORDER};box-shadow:0 0 0 3px rgba(14,137,143,.1)}

  /* Payment Method Buttons */
  .ph-method-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}
  .ph-method-btn:hover{border-color:#cbd5e1;background:#f8fafc}
  .ph-method-btn.on{border-color:${BORDER};background:${LIGHT_BG};color:${ACCENT};font-weight:700}

  /* Appointment Slot Picker */
  .ph-appt-slots{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0}
  .ph-slot-btn{padding:6px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}
  .ph-slot-btn:hover{border-color:${BORDER};background:${LIGHT_BG};color:${ACCENT}}
  .ph-slot-btn.on{border-color:${ACCENT};background:${ACCENT};color:#fff}

  /* Spinner */
  @keyframes phSpin{to{transform:rotate(360deg)}}
  .ph-spin{animation:phSpin .7s linear infinite}
`;
