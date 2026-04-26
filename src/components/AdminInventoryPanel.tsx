"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Users, RefreshCw, Package, Trash2, Pencil, X,
  AlertTriangle, CheckCircle2, Search, IndianRupee,
  Warehouse, Loader2, Check, Boxes, Truck, ShoppingCart,
  ChevronDown, ChevronUp, ChevronsUpDown, Download,
  FileText, FileSpreadsheet, FileType,
  Building2, CreditCard,
  Phone, Mail, MapPin, Shield, Clock, Printer, Bell,
  CalendarClock, BanknoteIcon, Receipt, Eye, TrendingUp,
  BarChart3, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow as DocxRow, TableCell as DocxCell, WidthType, TextRun, HeadingLevel } from "docx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(url, opts)).json();
};

const fmtCur = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const sortData = (data: any[], sort: {col:string;dir:"asc"|"desc"}) =>
  [...data].sort((a,b) => { const av=a[sort.col]??"",bv=b[sort.col]??""; const c=String(av).localeCompare(String(bv),undefined,{numeric:true}); return sort.dir==="asc"?c:-c; });

const mkTh = (label:string, col:string, sort:{col:string;dir:"asc"|"desc"}, onSort:(c:string)=>void, style?:any) => (
  <th key={col} style={{cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",...style}} onClick={()=>onSort(col)}>
    <div style={{display:"flex",alignItems:"center",gap:4}}>{label}
      {sort.col===col?(sort.dir==="asc"?<ChevronUp size={11}/>:<ChevronDown size={11}/>):<ChevronsUpDown size={11} color="#cbd5e1"/>}
    </div>
  </th>
);

const expBtnStyle:any={display:"flex",alignItems:"center",gap:8,padding:"8px 13px",borderRadius:7,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500};
const expIconStyle:any={width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0};

function ExportMenu({show,onToggle,onPDF,onExcel,onWord}:{show:boolean;onToggle:()=>void;onPDF:()=>void;onExcel:()=>void;onWord:()=>void}) {
  return (
    <div style={{position:"relative"}}>
      <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>
        <Download size={13}/>Export
      </button>
      {show&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.1)",zIndex:50,minWidth:170,padding:6}}>
          <button onClick={onPDF} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#fff5f5",color:"#ef4444"}}><FileText size={12}/></span>Export as PDF</button>
          <button onClick={onExcel} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={12}/></span>Export as Excel</button>
          <button onClick={onWord} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#eff6ff",color:"#2563eb"}}><FileType size={12}/></span>Export as Word</button>
        </div>
      )}
    </div>
  );
}

async function buildWordDoc(title:string,headers:string[],rows:string[][]):Promise<void> {
  const headerRow=new DocxRow({children:headers.map(h=>new DocxCell({children:[new Paragraph({children:[new TextRun({text:h,bold:true,size:18,font:"Calibri"})]})],width:{size:Math.floor(100/headers.length),type:WidthType.PERCENTAGE},shading:{fill:"0E898F"}}))});
  const dataRows=rows.map(r=>new DocxRow({children:r.map(c=>new DocxCell({children:[new Paragraph({children:[new TextRun({text:c,size:18,font:"Calibri"})]})]}))}));
  const doc=new DocxDocument({sections:[{children:[
    new Paragraph({text:title,heading:HeadingLevel.HEADING_1}),
    new Paragraph({children:[new TextRun({text:`Generated: ${new Date().toLocaleDateString("en-IN")}`,size:18,color:"888888"})]}),
    new Paragraph({text:""}),
    new DocxTable({rows:[headerRow,...dataRows],width:{size:100,type:WidthType.PERCENTAGE}}),
  ]}]});
  const blob=await Packer.toBlob(doc);
  saveAs(blob,`${title.toLowerCase().replace(/\s+/g,"-")}-${new Date().toISOString().slice(0,10)}.docx`);
}
const CATEGORIES = ["Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items"];
const UNITS = ["pcs", "strip", "box", "bottle", "vial", "ampoule", "tube", "kg", "gm", "ml", "ltr", "pair", "set"];
const PAYMENT_TERMS = ["Immediate", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Net 90", "Advance"];
const PAYMENT_MODES = ["Bank Transfer", "Cheque", "Cash", "UPI", "Online"];
const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE"];

type Tab = "overview" | "stock" | "suppliers" | "transfers" | "purchases";
const CHART_COLORS = ["#0E898F", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

export default function AdminInventoryPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [deptStock, setDeptStock] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);

  const [showAddItem, setShowAddItem] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showQuickTransfer, setShowQuickTransfer] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [viewSupplier, setViewSupplier] = useState<any>(null);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState<any>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [viewTransfer, setViewTransfer] = useState<any>(null);
  const [editTransfer, setEditTransfer] = useState<any>(null);
  const [editTransferQtys, setEditTransferQtys] = useState<Record<string, number>>({});
  const [savingTransferEdit, setSavingTransferEdit] = useState(false);
  const [itemModal, setItemModal] = useState<{ mode: "add" | "edit" | "view"; item: any } | null>(null);

  // ─── Sort states ───
  const [stockSort, setStockSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"name",dir:"asc"});
  const [suppSort, setSuppSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"name",dir:"asc"});
  const [purchSort, setPurchSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"createdAt",dir:"desc"});
  const [transSort, setTransSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"createdAt",dir:"desc"});

  // ─── Multi-select states ───
  const [stockSel, setStockSel] = useState<Set<string>>(new Set());
  const [suppSel, setSuppSel] = useState<Set<string>>(new Set());
  const [purchSel, setPurchSel] = useState<Set<string>>(new Set());
  const [transSel, setTransSel] = useState<Set<string>>(new Set());

  // ─── Export dropdown states ───
  const [showStockExp, setShowStockExp] = useState(false);
  const [showSuppExp, setShowSuppExp] = useState(false);
  const [showPurchExp, setShowPurchExp] = useState(false);
  const [showTransExp, setShowTransExp] = useState(false);

  // ─── Bulk delete confirm ───
  const [bulkDelConf, setBulkDelConf] = useState<{table:string;ids:Set<string>}|null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Payment reminder state
  const [dueReminders, setDueReminders] = useState<any[]>([]);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const reminderChecked = useRef(false);

  // ─── Loaders ───
  const loadSuppliers = useCallback(async () => {
    const d = await api("/api/inventory/supplier");
    if (d.success) setSuppliers(d.data || []);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const d = await api("/api/config/inventory?limit=200");
    if (d.success) setItems(d.data?.data || []);
    setLoading(false);
  }, []);

  const loadDeptStock = useCallback(async () => {
    setLoading(true);
    const [d, th] = await Promise.all([
      api("/api/inventory/dept-stock"),
      api("/api/inventory/transfers?limit=50"),
    ]);
    if (d.success) setDeptStock(d.data || []);
    if (th.success) setTransferHistory(th.data?.data || []);
    setLoading(false);
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api("/api/inventory/purchase");
      if (d.success) setPurchases(d.data || []);
      else console.error("Failed to load purchases:", d.message);
    } catch (e) { console.error("Error loading purchases:", e); }
    setLoading(false);
  }, []);

  const checkReminders = useCallback(async () => {
    const d = await api("/api/inventory/purchase?dueReminders=true");
    if (d.success && d.data?.length > 0) {
      setDueReminders(d.data);
      setShowReminderPopup(true);
    }
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  // Check payment reminders on mount (once)
  useEffect(() => {
    if (!reminderChecked.current) {
      reminderChecked.current = true;
      checkReminders();
    }
  }, [checkReminders]);

  useEffect(() => {
    if (tab === "overview") {
      setLoading(true);
      Promise.all([
        api("/api/config/inventory?limit=200").then(d => { if (d.success) setItems(d.data?.data || []); }),
        api("/api/inventory/purchase").then(d => { if (d.success) setPurchases(d.data || []); }),
        api("/api/inventory/dept-stock").then(d => { if (d.success) setDeptStock(d.data || []); }),
      ]).then(() => setLoading(false));
    } else if (tab === "stock") loadItems();
    else if (tab === "suppliers") { setLoading(false); loadSuppliers(); }
    else if (tab === "transfers") loadDeptStock();
    else if (tab === "purchases") loadPurchases();
  }, [tab, loadItems, loadSuppliers, loadDeptStock, loadPurchases]);

  const deleteItem = async (id: string) => { if (!confirm("Delete this item?")) return; const d = await api(`/api/config/inventory?id=${id}`, "DELETE"); if (d.success) loadItems(); else alert(d.message || "Failed"); };
  const deleteSupplier = async (id: string) => { if (!confirm("Delete this supplier?")) return; const d = await api(`/api/inventory/supplier?id=${id}`, "DELETE"); if (d.success) loadSuppliers(); else alert(d.message || "Failed"); };

  const handleBulkDelete = async () => {
    if (!bulkDelConf) return;
    setBulkDeleting(true);
    const { table, ids } = bulkDelConf;
    for (const id of Array.from(ids)) {
      if (table === "stock") await api(`/api/config/inventory?id=${id}`, "DELETE");
      else if (table === "suppliers") await api(`/api/inventory/supplier?id=${id}`, "DELETE");
    }
    setBulkDeleting(false);
    setBulkDelConf(null);
    if (table === "stock") { setStockSel(new Set()); loadItems(); }
    else if (table === "suppliers") { setSuppSel(new Set()); loadSuppliers(); }
  };

  const filtered = search ? items.filter((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())) : items;
  const lowStockItems = items.filter((i: any) => (i.totalStock ?? 0) <= (i.minStock ?? 0) && i.isActive);
  const totalValue = items.reduce((s: number, i: any) => s + ((i.totalStock ?? 0) * (i.purchasePrice ?? 0)), 0);
  const filteredSuppliers = search ? suppliers.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()) || s.contactPerson?.toLowerCase().includes(search.toLowerCase())) : suppliers;
  const pendingPayments = purchases.filter((p: any) => p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL");

  // ─── Chart Data ───
  const categoryData = CATEGORIES.map(c => ({ name: c, count: items.filter(i => i.category === c).length, value: items.filter(i => i.category === c).reduce((s: number, i: any) => s + ((i.totalStock ?? 0) * (i.purchasePrice ?? 0)), 0) })).filter(c => c.count > 0);
  const stockStatusData = [{ name: "Healthy", value: items.filter(i => (i.totalStock ?? 0) > (i.minStock ?? 0) && i.isActive).length, color: "#10b981" }, { name: "Low Stock", value: lowStockItems.length, color: "#ef4444" }, { name: "Out of Stock", value: items.filter(i => (i.totalStock ?? 0) === 0 && i.isActive).length, color: "#94a3b8" }, { name: "Inactive", value: items.filter(i => !i.isActive).length, color: "#e2e8f0" }].filter(d => d.value > 0);
  const purchasesByMonth = (() => { const months: any = {}; purchases.forEach((p: any) => { const d = new Date(p.createdAt); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); if (!months[key]) months[key] = { key, name: label, amount: 0, count: 0 }; months[key].amount += (p.grandTotal || p.totalAmount || 0); months[key].count += 1; }); return Object.values(months).sort((a: any, b: any) => a.key.localeCompare(b.key)).slice(-6); })();
  const deptStockSummary = deptStock.map((d: any) => ({ name: d.name?.length > 12 ? d.name.slice(0,12) + ".." : d.name, items: d.items?.length || 0, value: d.totalValue || 0, qty: d.totalQty || 0 }));
  const totalPurchaseValue = purchases.reduce((s: number, p: any) => s + (p.grandTotal || p.totalAmount || 0), 0);
  const totalDeptItems = deptStock.reduce((s: number, d: any) => s + (d.items?.length || 0), 0);

  const TABS: { id: Tab; label: string; icon: any; count?: number; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={15} /> },
    { id: "stock", label: "Items & Stock", icon: <Package size={15} />, count: items.length },
    { id: "suppliers", label: "Suppliers", icon: <Users size={15} />, count: suppliers.length },
    { id: "purchases", label: "Purchases", icon: <Receipt size={15} />, badge: pendingPayments.length },
    { id: "transfers", label: "Dept Transfers", icon: <Truck size={15} /> },
  ];

  return (
    <div style={{ margin: "-32px -20px 0", height: "calc(100vh - 64px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Payment Reminder Popup */}
      {showReminderPopup && dueReminders.length > 0 && (
        <PaymentReminderPopup reminders={dueReminders} onClose={() => setShowReminderPopup(false)} onPay={(p: any) => { setShowReminderPopup(false); setShowPayModal(p); }} />
      )}

      {/* Sticky Tab Bar — pill-style like configure page */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 0, padding: "6px 8px", flexShrink: 0 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }} style={{
              padding: "7px 13px", borderRadius: 8, border: "none",
              background: active ? "#E6F4F4" : "none",
              color: active ? "#0A6B70" : "#64748b", fontSize: 11.5, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
              transition: "all .15s", whiteSpace: "nowrap", position: "relative", flexShrink: 0,
            }}>
              {t.icon} {t.label}
              {t.count !== undefined && (
                <span style={{ background: active ? "#B3E0E0" : "#f1f5f9", color: active ? "#065f64" : "#94a3b8", padding: "1px 6px", borderRadius: 20, fontSize: 10, fontWeight: 700, marginLeft: 1 }}>{t.count}</span>
              )}
              {(t.badge ?? 0) > 0 && (
                <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 800, width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content area with padding */}
      <div style={{ padding: "20px 20px 20px", flex: 1 }}>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} className="hd-spin" color="#0E898F" /></div>}

      {/* ═══════════ TAB 0: OVERVIEW ═══════════ */}
      {!loading && tab === "overview" && (<>
        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Items", val: items.length, sub: `${items.filter(i => i.isActive).length} active` },
            { label: "Stock Value", val: fmtCur(totalValue), sub: `${items.filter(i => (i.totalStock ?? 0) > 0).length} in stock` },
            { label: "Low Stock", val: lowStockItems.length, sub: lowStockItems.length > 0 ? "Needs attention" : "All healthy", warn: lowStockItems.length > 0 },
            { label: "Purchases", val: purchases.length, sub: fmtCur(totalPurchaseValue) },
            { label: "Dept Stock", val: deptStock.length + " depts", sub: `${totalDeptItems} items distributed` },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: `1px solid ${(c as any).warn ? "#fecaca" : "#e2e8f0"}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: (c as any).warn ? "#ef4444" : "#1e293b", lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: 11, color: (c as any).warn ? "#ef4444" : "#94a3b8", marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Category Distribution Bar Chart */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Stock Value by Category</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Distribution of inventory value across categories</div></div>
              <BarChart3 size={18} color="#94a3b8" />
            </div>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                  <Tooltip formatter={(v: any) => fmtCur(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No items yet</div>}
          </div>

          {/* Stock Status Pie Chart */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Stock Health</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Item status distribution</div>
            {stockStatusData.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <RePieChart>
                    <Pie data={stockStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                      {stockStatusData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [`${v} items`, n]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  </RePieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  {stockStatusData.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />{d.name}: <strong>{d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No data</div>}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Purchase Trends */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Purchase Trends</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Monthly spend on purchases</div></div>
              <TrendingUp size={18} color="#94a3b8" />
            </div>
            {(purchasesByMonth as any[]).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={purchasesByMonth as any[]}>
                  <defs><linearGradient id="purchGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                  <Tooltip formatter={(v: any) => fmtCur(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#purchGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No purchase data yet</div>}
          </div>

          {/* Department Stock Distribution */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Dept Stock Distribution</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Items distributed to departments</div></div>
              <Boxes size={18} color="#94a3b8" />
            </div>
            {deptStockSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptStockSummary} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="qty" name="Quantity" radius={[6, 6, 0, 0]} fill="#0E898F" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No departments have stock yet</div>}
          </div>
        </div>

        {/* Bottom Row: Low Stock Alerts + Quick Actions + Payment Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Low Stock Alerts */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} color={lowStockItems.length > 0 ? "#ef4444" : "#10b981"} /> Low Stock Alerts
            </div>
            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#10b981" }}>
                <CheckCircle2 size={28} style={{ margin: "0 auto 8px", display: "block" }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>All items healthy!</div>
              </div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {lowStockItems.slice(0, 8).map((item: any) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: "#fff5f5", border: "1px solid #fee2e2" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{item.category}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>{item.totalStock ?? 0}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8" }}>min: {item.minStock ?? 0}</div>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 8 && <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 6 }}>+{lowStockItems.length - 8} more</div>}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Add New Item", icon: <Plus size={16} />, color: "#0E898F", bg: "#E6F4F4", action: () => setItemModal({ mode: "add", item: null }) },
                { label: "Restock / Purchase", icon: <ShoppingCart size={16} />, color: "#10b981", bg: "#f0fdf4", action: () => setShowRestock(true) },
                { label: "Transfer to Dept", icon: <Truck size={16} />, color: "#0E898F", bg: "#E6F4F4", action: () => setShowQuickTransfer(true) },
                { label: "View All Purchases", icon: <Receipt size={16} />, color: "#8b5cf6", bg: "#f5f3ff", action: () => setTab("purchases") },
                { label: "Manage Suppliers", icon: <Users size={16} />, color: "#3b82f6", bg: "#eff6ff", action: () => setTab("suppliers") },
              ].map((a, i) => (
                <button key={i} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", textAlign: "left", width: "100%", boxShadow: "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{a.label}</div>
                  <ArrowUpRight size={14} color="#94a3b8" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><CreditCard size={16} /> Payment Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Total Purchased", val: fmtCur(totalPurchaseValue), color: "#1e293b" },
                { label: "Amount Paid", val: fmtCur(purchases.reduce((s: number, p: any) => s + (p.amountPaid || 0), 0)), color: "#10b981" },
                { label: "Pending Amount", val: fmtCur(purchases.reduce((s: number, p: any) => s + ((p.grandTotal || p.totalAmount || 0) - (p.amountPaid || 0)), 0)), color: pendingPayments.length > 0 ? "#ef4444" : "#10b981" },
                { label: "Paid Orders", val: `${purchases.filter((p: any) => p.paymentStatus === "PAID").length} / ${purchases.length}`, color: "#64748b" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
            {pendingPayments.length > 0 && (
              <button onClick={() => setTab("purchases")} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, border: "1.5px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "none" }}>
                <Bell size={14} /> {pendingPayments.length} Pending Payment{pendingPayments.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </>)}

      {/* ═══════════ TAB 1: ITEMS & STOCK ═══════════ */}
      {!loading && tab === "stock" && (() => {
        const sortedItems = sortData(filtered, stockSort);
        const toggleStock = (id: string) => { const s = new Set(stockSel); s.has(id) ? s.delete(id) : s.add(id); setStockSel(s); };
        const toggleAllStock = () => { if (stockSel.size === sortedItems.length) setStockSel(new Set()); else setStockSel(new Set(sortedItems.map((i:any) => i.id))); };
        const onStockSort = (col: string) => setStockSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));

        const stockExportData = () => (stockSel.size > 0 ? sortedItems.filter((i:any) => stockSel.has(i.id)) : sortedItems).map((i:any) => ({
          Name: i.name, Generic: i.genericName || "", Brand: i.brandName || "", Category: i.category || "",
          Unit: i.unit || "", Stock: i.totalStock ?? 0, "Min Stock": i.minStock ?? 0,
          "Purchase Price": i.purchasePrice || 0, MRP: i.mrp || 0, "Selling Price": i.sellingPrice || 0,
          Supplier: i.supplierName || "", Status: i.isActive ? "Active" : "Inactive",
        }));
        const stockPDF = () => {
          const doc = new jsPDF(); doc.setFontSize(16); doc.text("Items & Stock Report", 14, 16);
          doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
          autoTable(doc, { startY: 28, head: [["Name","Category","Unit","Stock","Min","Purchase Price","MRP","Status"]], body: stockExportData().map(r => [r.Name, r.Category, r.Unit, r.Stock, r["Min Stock"], `₹${r["Purchase Price"]}`, `₹${r.MRP}`, r.Status]), styles: { fontSize: 8 }, headStyles: { fillColor: [14, 137, 143] } });
          doc.save(`stock-report-${new Date().toISOString().slice(0,10)}.pdf`); setShowStockExp(false);
        };
        const stockExcel = () => { const ws = XLSX.utils.json_to_sheet(stockExportData()); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Stock"); XLSX.writeFile(wb, `stock-${new Date().toISOString().slice(0,10)}.xlsx`); setShowStockExp(false); };
        const stockWord = async () => { const d = stockExportData(); await buildWordDoc("Items and Stock Report", ["Name","Category","Unit","Stock","Min Stock","Purchase Price","MRP","Status"], d.map(r => [r.Name, r.Category, r.Unit, String(r.Stock), String(r["Min Stock"]), `₹${r["Purchase Price"]}`, `₹${r.MRP}`, r.Status])); setShowStockExp(false); };

        return (<>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Total Items", val: items.length, sub: `${items.filter((i:any) => i.isActive).length} active` },
              { label: "Stock Value", val: fmtCur(totalValue), sub: `${items.filter((i:any) => (i.totalStock??0) > 0).length} in stock` },
              { label: "Low Stock", val: lowStockItems.length, sub: "Needs reorder", warn: lowStockItems.length > 0 },
              { label: "Suppliers", val: suppliers.length, sub: "Active suppliers" },
            ].map((c, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: `1px solid ${(c as any).warn && Number(c.val) > 0 ? "#fecaca" : "#e2e8f0"}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: (c as any).warn && Number(c.val) > 0 ? "#ef4444" : "#1e293b", lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "8px 13px", flex: 1, minWidth: 200 }}>
              <Search size={13} color="#94a3b8" />
              <input style={{ border: "none", background: "none", outline: "none", fontSize: 13, width: "100%", color: "#1e293b" }} placeholder="Search items, categories..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>{sortedItems.length} items</div>
            {stockSel.size > 0 && (
              <button onClick={() => setBulkDelConf({ table: "stock", ids: stockSel })} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 9, border: "1px solid #fecaca", background: "#fff5f5", fontSize: 12, color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>
                <Trash2 size={12} />Delete ({stockSel.size})
              </button>
            )}
            <button onClick={() => setShowRestock(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><ShoppingCart size={13} /> Restock</button>
            <ExportMenu show={showStockExp} onToggle={() => setShowStockExp(p => !p)} onPDF={stockPDF} onExcel={stockExcel} onWord={stockWord} />
            <button onClick={() => setItemModal({ mode: "add", item: null })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> Add Item</button>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "11px 10px 11px 14px", borderBottom: "1px solid #e2e8f0", width: 36 }}>
                    <input type="checkbox" checked={sortedItems.length > 0 && stockSel.size === sortedItems.length} onChange={toggleAllStock} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} />
                  </th>
                  {[["name","Item"],["category","Category"],["totalStock","Stock"],["purchasePrice","Price"],["minStock","Min"],["supplierName","Supplier"],["isActive","Status"]].map(([col, label]) => mkTh(label, col, stockSort, onStockSort, { textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0" }))}
                  <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0", width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>No items found</td></tr>}
                {sortedItems.map((item: any) => {
                  const low = (item.totalStock ?? 0) <= (item.minStock ?? 0);
                  const sel = stockSel.has(item.id);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", background: sel ? "#f0fdfa" : "transparent" }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#fafbfc"; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: "11px 10px 11px 14px" }}><input type="checkbox" checked={sel} onChange={() => toggleStock(item.id)} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} /></td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{item.name}</div>
                        {item.genericName && <div style={{ fontSize: 10, color: "#94a3b8" }}>{item.genericName}</div>}
                      </td>
                      <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>{item.category}</span></td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: low ? "#ef4444" : "#10b981" }}>
                        {item.totalStock ?? 0} <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>{item.unit}</span>
                        {low && <AlertTriangle size={11} color="#ef4444" style={{ marginLeft: 4, verticalAlign: "middle" }} />}
                      </td>
                      <td style={{ padding: "11px 14px", fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{fmtCur(item.mrp || item.purchasePrice || 0)}</td>
                      <td style={{ padding: "11px 14px", color: "#94a3b8", fontSize: 13 }}>{item.minStock ?? 0}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{item.supplierName || "—"}</td>
                      <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 700, background: item.isActive ? "#dcfce7" : "#fee2e2", color: item.isActive ? "#166534" : "#991b1b" }}>{item.isActive ? "Active" : "Inactive"}</span></td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button title="View" onClick={() => setItemModal({ mode: "view", item })} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0E898F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={12} /></button>
                          <button title="Edit" onClick={() => setItemModal({ mode: "edit", item })} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #dbeafe", background: "#eff6ff", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Pencil size={12} /></button>
                          <button title="Delete" onClick={() => deleteItem(item.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>);
      })()}

      {/* ═══════════ TAB 2: SUPPLIERS ═══════════ */}
      {!loading && tab === "suppliers" && (() => {
        const sortedSupp = sortData(filteredSuppliers, suppSort);
        const toggleSupp = (id: string) => { const s = new Set(suppSel); s.has(id) ? s.delete(id) : s.add(id); setSuppSel(s); };
        const toggleAllSupp = () => { if (suppSel.size === sortedSupp.length) setSuppSel(new Set()); else setSuppSel(new Set(sortedSupp.map((s:any) => s.id))); };
        const onSuppSort = (col: string) => setSuppSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));
        const suppExportData = () => (suppSel.size > 0 ? sortedSupp.filter((s:any) => suppSel.has(s.id)) : sortedSupp).map((s:any) => ({
          Name: s.name, Code: s.code || "", Contact: s.contactPerson || "", Phone: s.phone || "",
          Email: s.email || "", City: s.city || "", State: s.state || "", GST: s.gstNumber || "",
          "Payment Terms": s.paymentTerms || "", "Credit Limit": s.creditLimit || 0,
        }));
        const suppPDF = () => {
          const doc = new jsPDF(); doc.setFontSize(16); doc.text("Suppliers Report", 14, 16);
          doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
          autoTable(doc, { startY: 28, head: [["Name","Code","Contact","Phone","Email","City","GST"]], body: suppExportData().map(r => [r.Name, r.Code, r.Contact, r.Phone, r.Email, r.City, r.GST]), styles: { fontSize: 8 }, headStyles: { fillColor: [14, 137, 143] } });
          doc.save(`suppliers-${new Date().toISOString().slice(0,10)}.pdf`); setShowSuppExp(false);
        };
        const suppExcel = () => { const ws = XLSX.utils.json_to_sheet(suppExportData()); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Suppliers"); XLSX.writeFile(wb, `suppliers-${new Date().toISOString().slice(0,10)}.xlsx`); setShowSuppExp(false); };
        const suppWord = async () => { const d = suppExportData(); await buildWordDoc("Suppliers Report", ["Name","Code","Contact","Phone","Email","City","GST","Payment Terms"], d.map(r => [r.Name, r.Code, r.Contact, r.Phone, r.Email, r.City, r.GST, r["Payment Terms"]])); setShowSuppExp(false); };

        return (<>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "8px 13px", flex: 1, minWidth: 200 }}>
              <Search size={13} color="#94a3b8" />
              <input style={{ border: "none", background: "none", outline: "none", fontSize: 13, width: "100%", color: "#1e293b" }} placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>{sortedSupp.length} suppliers</div>
            {suppSel.size > 0 && (
              <button onClick={() => setBulkDelConf({ table: "suppliers", ids: suppSel })} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 9, border: "1px solid #fecaca", background: "#fff5f5", fontSize: 12, color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>
                <Trash2 size={12} />Delete ({suppSel.size})
              </button>
            )}
            <ExportMenu show={showSuppExp} onToggle={() => setShowSuppExp(p => !p)} onPDF={suppPDF} onExcel={suppExcel} onWord={suppWord} />
            <button onClick={() => { setEditSupplier(null); setShowAddSupplier(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> Add Supplier</button>
          </div>

          {/* Table */}
          {sortedSupp.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", textAlign: "center", padding: "50px 20px" }}>
              <Users size={36} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>No suppliers yet</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Add suppliers to start managing purchases</div>
              <button onClick={() => { setEditSupplier(null); setShowAddSupplier(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Plus size={14} /> Add Supplier</button>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "11px 10px 11px 14px", borderBottom: "1px solid #e2e8f0", width: 36 }}>
                      <input type="checkbox" checked={sortedSupp.length > 0 && suppSel.size === sortedSupp.length} onChange={toggleAllSupp} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} />
                    </th>
                    {[["name","Supplier"],["code","Code"],["contactPerson","Contact"],["phone","Phone"],["email","Email"],["city","City"],["gstNumber","GST No."],["paymentTerms","Payment Terms"]].map(([col, label]) => mkTh(label, col, suppSort, onSuppSort, { textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0" }))}
                    <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0", width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSupp.map((s: any) => {
                    const sel = suppSel.has(s.id);
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: sel ? "#f0fdfa" : "transparent" }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#fafbfc"; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding: "11px 10px 11px 14px" }}><input type="checkbox" checked={sel} onChange={() => toggleSupp(s.id)} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} /></td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#0E898F", flexShrink: 0 }}>{s.name?.charAt(0)?.toUpperCase()}</div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{s.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{s.code || "—"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: "#475569" }}>{s.contactPerson || "—"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{s.phone || "—"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{s.email || "—"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{s.city ? `${s.city}${s.state ? `, ${s.state}` : ""}` : "—"}</td>
                        <td style={{ padding: "11px 14px" }}>{s.gstNumber ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "#f0fdf4", color: "#166534", fontWeight: 600 }}>{s.gstNumber}</span> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{s.paymentTerms || "Immediate"}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button title="View Details" onClick={() => setViewSupplier(s)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0E898F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={12} /></button>
                            <button title="Edit" onClick={() => { setEditSupplier(s); setShowAddSupplier(true); }} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #dbeafe", background: "#eff6ff", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Pencil size={12} /></button>
                            <button title="Delete" onClick={() => deleteSupplier(s.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>);
      })()}

      {/* ═══════════ TAB 3: PURCHASES ═══════════ */}
      {!loading && tab === "purchases" && (() => {
        const sortedPurch = sortData(purchases, purchSort);
        const togglePurch = (id: string) => { const s = new Set(purchSel); s.has(id) ? s.delete(id) : s.add(id); setPurchSel(s); };
        const toggleAllPurch = () => { if (purchSel.size === sortedPurch.length) setPurchSel(new Set()); else setPurchSel(new Set(sortedPurch.map((p:any) => p.id))); };
        const onPurchSort = (col: string) => setPurchSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));
        const purchExportData = () => (purchSel.size > 0 ? sortedPurch.filter((p:any) => purchSel.has(p.id)) : sortedPurch).map((p:any) => {
          const isOverdue = p.paymentStatus !== "PAID" && p.dueDate && new Date(p.dueDate) < new Date();
          return { "PO No": p.purchaseNo, "Invoice No": p.invoiceNumber || "", Supplier: p.supplier?.name || "", Date: fmtDate(p.createdAt), Items: p._count?.items || 0, Amount: p.grandTotal || p.totalAmount || 0, "Amount Paid": p.amountPaid || 0, Status: p.paymentStatus === "PAID" ? "Paid" : isOverdue ? "Overdue" : p.paymentStatus === "PARTIAL" ? "Partial" : "Pending", "Due Date": p.dueDate ? fmtDate(p.dueDate) : "" };
        });
        const purchPDF = () => {
          const doc = new jsPDF(); doc.setFontSize(16); doc.text("Purchases Report", 14, 16);
          doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
          autoTable(doc, { startY: 28, head: [["PO No","Invoice","Supplier","Date","Items","Amount","Status","Due Date"]], body: purchExportData().map(r => [r["PO No"], r["Invoice No"], r.Supplier, r.Date, r.Items, `₹${r.Amount}`, r.Status, r["Due Date"]]), styles: { fontSize: 8 }, headStyles: { fillColor: [14, 137, 143] } });
          doc.save(`purchases-${new Date().toISOString().slice(0,10)}.pdf`); setShowPurchExp(false);
        };
        const purchExcel = () => { const ws = XLSX.utils.json_to_sheet(purchExportData()); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Purchases"); XLSX.writeFile(wb, `purchases-${new Date().toISOString().slice(0,10)}.xlsx`); setShowPurchExp(false); };
        const purchWord = async () => { const d = purchExportData(); await buildWordDoc("Purchases Report", ["PO No","Invoice","Supplier","Date","Items","Amount","Status","Due Date"], d.map(r => [r["PO No"], r["Invoice No"], r.Supplier, r.Date, String(r.Items), `₹${r.Amount}`, r.Status, r["Due Date"]])); setShowPurchExp(false); };

        return (<>
          {/* Stat Cards */}
          {(() => {
            const pharmPurch = purchases.filter((p:any) => p.subDepartmentId || p.subDepartment);
            const adminPurch = purchases.filter((p:any) => !p.subDepartmentId && !p.subDepartment);
            const pharmTotal = pharmPurch.reduce((s:number,p:any)=>s+(p.grandTotal||p.totalAmount||0),0);
            const adminTotal = adminPurch.reduce((s:number,p:any)=>s+(p.grandTotal||p.totalAmount||0),0);
            if (pharmPurch.length > 0) return (
              <div style={{ background: "#E6F4F4", borderRadius: 10, padding: "10px 16px", border: "1px solid #b2d8da", marginBottom: 12, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0b7075" }}>📊 Purchase Breakdown:</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>Admin: <strong style={{ color: "#1e293b" }}>{adminPurch.length} orders</strong> · {fmtCur(adminTotal)}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>Sub-Departments: <strong style={{ color: "#0b7075" }}>{pharmPurch.length} orders</strong> · {fmtCur(pharmTotal)}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#0E898F", marginLeft: "auto" }}>Grand Total: {fmtCur(pharmTotal + adminTotal)}</span>
              </div>
            ); return null;
          })()}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Total Purchases", val: purchases.length, sub: fmtCur(purchases.reduce((s:number,p:any)=>s+(p.grandTotal||p.totalAmount||0),0)) },
              { label: "Amount Paid", val: fmtCur(purchases.reduce((s:number,p:any)=>s+(p.amountPaid||0),0)), sub: `${purchases.filter((p:any)=>p.paymentStatus==="PAID").length} fully paid` },
              { label: "Pending Payment", val: pendingPayments.length, sub: fmtCur(purchases.reduce((s:number,p:any)=>s+((p.grandTotal||p.totalAmount||0)-(p.amountPaid||0)),0)), warn: pendingPayments.length > 0 },
              { label: "Overdue", val: purchases.filter((p:any)=>p.paymentStatus!=="PAID"&&p.dueDate&&new Date(p.dueDate)<new Date()).length, sub: "Past due date", warn: true },
            ].map((c,i)=>(
              <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: `1px solid ${(c as any).warn && (typeof c.val==="number" ? c.val>0 : false) ? "#fecaca" : "#e2e8f0"}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: (c as any).warn && (typeof c.val==="number" ? c.val>0 : false) ? "#ef4444" : "#1e293b", lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{sortedPurch.length} purchases</div>
            {purchSel.size > 0 && <div style={{ fontSize: 12, color: "#0E898F", fontWeight: 700 }}>{purchSel.size} selected</div>}
            <div style={{ flex: 1 }} />
            <button onClick={loadPurchases} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={13} /> Refresh</button>
            <ExportMenu show={showPurchExp} onToggle={() => setShowPurchExp(p => !p)} onPDF={purchPDF} onExcel={purchExcel} onWord={purchWord} />
            <button onClick={() => setShowRestock(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Plus size={13} /> New Purchase</button>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "11px 10px 11px 14px", borderBottom: "1px solid #e2e8f0", width: 36 }}>
                    <input type="checkbox" checked={sortedPurch.length > 0 && purchSel.size === sortedPurch.length} onChange={toggleAllPurch} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} />
                  </th>
                  {[["purchaseNo","PO / Invoice"],["supplier","Supplier"],["createdAt","Date"],["_count","Items"],["grandTotal","Amount"],["paymentStatus","Payment"],["dueDate","Due Date"]].map(([col,label]) => mkTh(label, col, purchSort, onPurchSort, { textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0" }))}
                  <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0", width: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPurch.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No purchases yet. Click "New Purchase" to get started.</td></tr>}
                {sortedPurch.map((p: any) => {
                  const isOverdue = p.paymentStatus !== "PAID" && p.dueDate && new Date(p.dueDate) < new Date();
                  const sel = purchSel.has(p.id);
                  const statusLabel = p.paymentStatus === "PAID" ? "Paid" : isOverdue ? "Overdue" : p.paymentStatus === "PARTIAL" ? "Partial" : "Pending";
                  const statusStyle = p.paymentStatus === "PAID" ? { bg: "#dcfce7", color: "#166534" } : isOverdue ? { bg: "#fee2e2", color: "#991b1b" } : { bg: "#fef3c7", color: "#92400e" };
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", background: sel ? "#f0fdfa" : "transparent" }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#fafbfc"; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: "11px 10px 11px 14px" }}><input type="checkbox" checked={sel} onChange={() => togglePurch(p.id)} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} /></td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#0E898F" }}>{p.purchaseNo}</div>
                        {p.invoiceNumber && <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.invoiceNumber}</div>}
                        {p.subDepartment && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#fef3c7", color: "#92400e", fontWeight: 700, marginTop: 2, display: "inline-block" }}>📦 {p.subDepartment.name}</span>}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#475569" }}>{p.supplier?.name || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{fmtDate(p.createdAt)}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 600, fontSize: 13 }}>{p._count?.items || 0}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{fmtCur(p.grandTotal || p.totalAmount)}</div>
                        {p.paymentStatus !== "PAID" && p.amountPaid > 0 && <div style={{ fontSize: 10, color: "#10b981" }}>Paid: {fmtCur(p.amountPaid)}</div>}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>{statusLabel}</span>
                        {p.paymentType === "CREDIT" && p.paymentStatus !== "PAID" && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Credit</div>}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: isOverdue ? "#ef4444" : "#64748b", fontWeight: isOverdue ? 700 : 400 }}>{p.dueDate ? fmtDate(p.dueDate) : "—"}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={async () => { setLoadingInvoiceId(p.id); try { const d = await api(`/api/inventory/purchase?id=${p.id}`); if (d.success && d.data) setViewInvoice(d.data); else alert(d.message || "Failed"); } catch { alert("Error loading invoice"); } setLoadingInvoiceId(null); }} disabled={loadingInvoiceId === p.id} title="View Invoice" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0E898F", fontSize: 11, fontWeight: 600, cursor: loadingInvoiceId === p.id ? "wait" : "pointer", opacity: loadingInvoiceId === p.id ? 0.6 : 1 }}>{loadingInvoiceId === p.id ? <Loader2 size={11} className="hd-spin" /> : <FileText size={11} />} Invoice</button>
                          {p.paymentStatus !== "PAID" && <button onClick={() => setShowPayModal(p)} title="Record Payment" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><BanknoteIcon size={11} /> Pay</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>);
      })()}

      {/* ═══════════ TAB 4: DEPT TRANSFERS ═══════════ */}
      {!loading && tab === "transfers" && (() => {
        const sortedTrans = sortData(transferHistory, transSort);
        const toggleTrans = (id: string) => { const s = new Set(transSel); s.has(id) ? s.delete(id) : s.add(id); setTransSel(s); };
        const toggleAllTrans = () => { if (transSel.size === sortedTrans.length) setTransSel(new Set()); else setTransSel(new Set(sortedTrans.map((t:any) => t.id))); };
        const onTransSort = (col: string) => setTransSort(p => ({ col, dir: p.col === col && p.dir === "asc" ? "desc" : "asc" }));
        const transExportData = () => (transSel.size > 0 ? sortedTrans.filter((t:any) => transSel.has(t.id)) : sortedTrans).map((t:any) => ({
          "Transfer No": t.transferNo, From: t.fromLocation?.name || "Central Store", To: t.toLocation?.name || "",
          Items: t.items?.length || 0, "Total Qty": t.items?.reduce((s:number,ti:any)=>s+(ti.receivedQty||ti.quantity||0),0)||0,
          Status: t.status, Date: fmtDate(t.transferredAt || t.createdAt),
        }));
        const transPDF = () => {
          const doc = new jsPDF(); doc.setFontSize(16); doc.text("Transfer History Report", 14, 16);
          doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
          autoTable(doc, { startY: 28, head: [["Transfer No","From","To","Items","Total Qty","Status","Date"]], body: transExportData().map(r => [r["Transfer No"], r.From, r.To, r.Items, r["Total Qty"], r.Status, r.Date]), styles: { fontSize: 8 }, headStyles: { fillColor: [14, 137, 143] } });
          doc.save(`transfers-${new Date().toISOString().slice(0,10)}.pdf`); setShowTransExp(false);
        };
        const transExcel = () => { const ws = XLSX.utils.json_to_sheet(transExportData()); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Transfers"); XLSX.writeFile(wb, `transfers-${new Date().toISOString().slice(0,10)}.xlsx`); setShowTransExp(false); };
        const transWord = async () => { const d = transExportData(); await buildWordDoc("Transfer History Report", ["Transfer No","From","To","Items","Total Qty","Status","Date"], d.map(r => [r["Transfer No"], r.From, r.To, String(r.Items), String(r["Total Qty"]), r.Status, r.Date])); setShowTransExp(false); };

        return (<>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Departments", val: deptStock.length, sub: "with stock" },
              { label: "Items Distributed", val: totalDeptItems, sub: "unique items" },
              { label: "Total Qty", val: deptStock.reduce((s:number,d:any)=>s+(d.totalQty||0),0), sub: "units transferred" },
              { label: "Stock Value", val: fmtCur(deptStock.reduce((s:number,d:any)=>s+(d.totalValue||0),0)), sub: "at cost" },
            ].map((c,i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Dept Distribution Header + Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Department Stock Distribution</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={loadDeptStock} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={13} /> Refresh</button>
              <button onClick={() => setShowQuickTransfer(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Truck size={13} /> Transfer Stock</button>
            </div>
          </div>

          {/* Dept Cards */}
          {deptStock.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 10, padding: "50px 20px", textAlign: "center", border: "1px solid #e2e8f0", marginBottom: 20 }}>
              <Truck size={28} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>No department stock yet</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Transfer items from central inventory to departments</div>
              <button onClick={() => setShowQuickTransfer(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Truck size={14} /> Transfer Now</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {deptStock.map((dept: any, dIdx: number) => (
                <div key={dept.locationId || dept.name} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedDept(expandedDept === dept.locationId ? null : dept.locationId)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Building2 size={16} color={CHART_COLORS[dIdx % CHART_COLORS.length]} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{dept.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 14, marginTop: 1 }}>
                          <span>{dept.items?.length || 0} items</span>
                          <span>Qty: {dept.totalQty || 0}</span>
                          <span style={{ color: "#0E898F", fontWeight: 600 }}>{fmtCur(dept.totalValue || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={(e) => { e.stopPropagation(); setShowQuickTransfer(true); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#0E898F", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Truck size={11} /> Transfer</button>
                      <span style={{ color: "#94a3b8" }}><ChevronDown size={15} style={{ transform: expandedDept === dept.locationId ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></span>
                    </div>
                  </div>
                  {expandedDept === dept.locationId && dept.items?.length > 0 && (
                    <div style={{ borderTop: "1px solid #e2e8f0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr style={{ background: "#f8fafc" }}>
                          {["Item","Category","Quantity","Value"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "9px 16px", borderBottom: "1px solid #e2e8f0" }}>{h}</th>)}
                        </tr></thead>
                        <tbody>{dept.items.map((it: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "9px 16px", fontWeight: 600, fontSize: 12, color: "#1e293b" }}>{it.itemName}</td>
                            <td style={{ padding: "9px 16px" }}><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 100, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>{it.category}</span></td>
                            <td style={{ padding: "9px 16px", fontWeight: 600, fontSize: 12 }}>{it.quantity} <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>{it.unit}</span></td>
                            <td style={{ padding: "9px 16px", fontWeight: 600, fontSize: 12, color: "#0E898F" }}>{fmtCur(it.value || 0)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Transfer History */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} color="#0E898F" /> Transfer History</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{sortedTrans.length} records</div>
            {transSel.size > 0 && <div style={{ fontSize: 12, color: "#0E898F", fontWeight: 700 }}>{transSel.size} selected</div>}
            <div style={{ flex: 1 }} />
            <ExportMenu show={showTransExp} onToggle={() => setShowTransExp(p => !p)} onPDF={transPDF} onExcel={transExcel} onWord={transWord} />
          </div>

          {transferHistory.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 10, padding: "30px 20px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>No transfers recorded yet</div>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "11px 10px 11px 14px", borderBottom: "1px solid #e2e8f0", width: 36 }}>
                      <input type="checkbox" checked={sortedTrans.length > 0 && transSel.size === sortedTrans.length} onChange={toggleAllTrans} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} />
                    </th>
                    {[["transferNo","Transfer No"],["fromLocation","From"],["toLocation","To"],["status","Status"],["transferredAt","Date"]].map(([col,label]) => mkTh(label, col, transSort, onTransSort, { textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0" }))}
                    <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0" }}>Items</th>
                    <th style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "11px 14px", borderBottom: "1px solid #e2e8f0", width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTrans.map((t: any) => {
                    const tQty = t.items?.reduce((s: number, ti: any) => s + (ti.receivedQty || ti.quantity || 0), 0) || 0;
                    const sc = t.status === "COMPLETED" ? { bg: "#dcfce7", color: "#166534" } : t.status === "PENDING" ? { bg: "#fef3c7", color: "#92400e" } : t.status === "CANCELLED" ? { bg: "#f1f5f9", color: "#64748b" } : { bg: "#fee2e2", color: "#991b1b" };
                    const canCancel = t.status === "COMPLETED" || t.status === "PENDING";
                    const canEdit = t.status === "COMPLETED";
                    const sel = transSel.has(t.id);
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: t.status === "CANCELLED" ? 0.6 : 1, background: sel ? "#f0fdfa" : "transparent" }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#fafbfc"; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding: "11px 10px 11px 14px" }}><input type="checkbox" checked={sel} onChange={() => toggleTrans(t.id)} style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0E898F" }} /></td>
                        <td style={{ padding: "11px 14px" }}><div style={{ fontWeight: 700, fontSize: 12, color: "#0E898F" }}>{t.transferNo}</div></td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "#475569" }}>{t.fromLocation?.name || "Central Store"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{t.toLocation?.name || "—"}</td>
                        <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 700, background: sc.bg, color: sc.color }}>{t.status}</span></td>
                        <td style={{ padding: "11px 14px", fontSize: 11, color: "#64748b" }}>{fmtDate(t.transferredAt || t.createdAt)}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {t.items?.slice(0,2).map((ti: any, idx: number) => <span key={idx} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>{ti.item?.name || "Item"} ×{ti.receivedQty||ti.quantity||0}</span>)}
                            {(t.items?.length || 0) > 2 && <span style={{ fontSize: 10, color: "#94a3b8" }}>+{t.items.length - 2}</span>}
                            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>({tQty} units)</span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button title="View" onClick={() => setViewTransfer(t)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0E898F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={12} /></button>
                            {canEdit && <button title="Edit" onClick={() => { const qMap: Record<string,number> = {}; t.items?.forEach((ti:any)=>{qMap[ti.id]=ti.receivedQty||ti.quantity||0;}); setEditTransferQtys(qMap); setEditTransfer(t); }} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #dbeafe", background: "#eff6ff", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Pencil size={12} /></button>}
                            {canCancel && <button title="Cancel" onClick={async () => { if (!confirm(`Cancel ${t.transferNo}?${t.status==="COMPLETED"?" Stock will be reversed.":""}`)) return; const d = await api("/api/inventory/transfers","PATCH",{id:t.id,action:"cancel"}); if(d.success){loadDeptStock();loadItems();}else alert(d.message||"Failed"); }} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>);
      })()}

      {/* ─── Modals ─── */}
      {/* Bulk Delete Confirm Modal */}
      {bulkDelConf && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !bulkDeleting) setBulkDelConf(null); }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 420, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f5", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertTriangle size={20} color="#ef4444" /></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Delete {bulkDelConf.ids.size} {bulkDelConf.table === "stock" ? "item" : "supplier"}{bulkDelConf.ids.size > 1 ? "s" : ""}?</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>This action cannot be undone.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setBulkDelConf(null)} disabled={bulkDeleting} style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? .5 : 1 }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? .7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {bulkDeleting && <Loader2 size={13} className="hd-spin" />}
                {bulkDeleting ? "Deleting..." : `Delete ${bulkDelConf.ids.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Supplier Detail Modal ─── */}
      {viewSupplier && (() => {
        const s = viewSupplier;
        const detailRows: [string, any][] = [
          ["Supplier Name", s.name],
          ["Supplier Code", s.code || "—"],
          ["Contact Person", s.contactPerson || "—"],
          ["Phone", s.phone || "—"],
          ["Email", s.email || "—"],
          ["Address", s.address || "—"],
          ["City", s.city || "—"],
          ["State", s.state || "—"],
          ["PIN Code", s.pincode || s.zipCode || "—"],
          ["Country", s.country || "India"],
          ["GST Number", s.gstNumber || "—"],
          ["PAN", s.pan || "—"],
          ["Bank Name", s.bankName || "—"],
          ["Account Number", s.accountNumber || "—"],
          ["IFSC Code", s.ifscCode || "—"],
          ["Payment Terms", s.paymentTerms || "Immediate"],
          ["Credit Limit", s.creditLimit ? fmtCur(s.creditLimit) : "—"],
          ["Credit Period", s.creditPeriod ? `${s.creditPeriod} days` : "—"],
          ["Notes", s.notes || "—"],
          ["Created", s.createdAt ? fmtDate(s.createdAt) : "—"],
        ];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setViewSupplier(null); }}>
            <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 540, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #e2e8f0" }}>
              {/* Header */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#0E898F", flexShrink: 0 }}>{s.name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{s.code ? `Code: ${s.code}` : "Supplier Details"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setViewSupplier(null); setEditSupplier(s); setShowAddSupplier(true); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#0E898F", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Pencil size={12} /> Edit</button>
                  <button onClick={() => setViewSupplier(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  {detailRows.map(([label, val], i) => (
                    <div key={label} style={{ padding: "10px 0", borderBottom: i < detailRows.length - 2 ? "1px solid #f1f5f9" : "none", gridColumn: label === "Address" || label === "Notes" ? "1 / -1" : undefined }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: val === "—" ? "#cbd5e1" : "#1e293b", wordBreak: "break-word" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {itemModal && <ItemModal mode={itemModal.mode} item={itemModal.item} suppliers={suppliers} onClose={() => setItemModal(null)} onSuccess={() => { setItemModal(null); loadItems(); }} />}
      {showRestock && <RestockModal items={items} suppliers={suppliers} onClose={() => setShowRestock(false)} onSuccess={(purchase: any) => { setShowRestock(false); loadItems(); loadPurchases(); if (purchase) setViewInvoice(purchase); }} />}
      {showAddSupplier && <AddSupplierModal existing={editSupplier} onClose={() => { setShowAddSupplier(false); setEditSupplier(null); }} onSuccess={() => { setShowAddSupplier(false); setEditSupplier(null); loadSuppliers(); }} />}
      {showQuickTransfer && <QuickTransferModal onClose={() => setShowQuickTransfer(false)} onSuccess={() => { setShowQuickTransfer(false); loadDeptStock(); }} />}
      {viewInvoice && <InvoiceModal purchase={viewInvoice} onClose={() => setViewInvoice(null)} />}
      {showPayModal && <RecordPaymentModal purchase={showPayModal} onClose={() => setShowPayModal(null)} onSuccess={() => { setShowPayModal(null); loadPurchases(); }} />}

      {/* ─── View Transfer Detail Modal ─── */}
      {viewTransfer && (() => {
        const vt = viewTransfer;
        const vtItems = vt.items || [];
        const vtTotalQty = vtItems.reduce((s: number, ti: any) => s + (ti.receivedQty || ti.quantity || 0), 0);
        const vtTotalValue = vtItems.reduce((s: number, ti: any) => s + ((ti.receivedQty || ti.quantity || 0) * (ti.item?.purchasePrice || 0)), 0);
        const sc = vt.status === "COMPLETED" ? { bg: "#dcfce7", color: "#166534", label: "Completed" }
          : vt.status === "PENDING" ? { bg: "#fef3c7", color: "#92400e", label: "Pending" }
          : vt.status === "CANCELLED" ? { bg: "#f1f5f9", color: "#64748b", label: "Cancelled" }
          : { bg: "#fee2e2", color: "#991b1b", label: vt.status };

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setViewTransfer(null)}>
            <div style={{ background: "#fff", borderRadius: 18, width: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.18)" }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <Truck size={18} color="#0E898F" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Transfer {vt.transferNo}</span>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(vt.transferredAt || vt.createdAt)}</div>
                </div>
                <button onClick={() => setViewTransfer(null)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><X size={14} /></button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 20px" }}>
                {/* From → To */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, marginBottom: 20, alignItems: "center" }}>
                  <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>From</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{vt.fromLocation?.name || "Central Store"}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{vt.fromLocation?.code || "CENTRAL"}</div>
                  </div>
                  <div style={{ color: "#0E898F", display: "flex", alignItems: "center" }}><ArrowUpRight size={20} /></div>
                  <div style={{ padding: "12px 16px", background: "#E6F4F4", borderRadius: 12, border: "1px solid #d1ecec" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#0E898F", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>To</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#065f64" }}>{vt.toLocation?.name || "-"}</div>
                    <div style={{ fontSize: 10, color: "#0E898F" }}>{vt.toLocation?.code || ""}</div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                  {[
                    { label: "Items", val: vtItems.length, color: "#0E898F" },
                    { label: "Total Qty", val: vtTotalQty, color: "#8b5cf6" },
                    { label: "Total Value", val: fmtCur(vtTotalValue), color: "#10b981" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9", textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Items Table */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Transfer Items</div>
                <table className="hd-tbl" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Unit Price</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vtItems.map((ti: any, idx: number) => {
                      const qty = ti.receivedQty || ti.quantity || 0;
                      const price = ti.item?.purchasePrice || 0;
                      return (
                        <tr key={ti.id || idx}>
                          <td style={{ fontSize: 11, color: "#94a3b8" }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{ti.item?.name || "—"}</div>
                            {ti.batch?.batchNumber && <div style={{ fontSize: 9, color: "#94a3b8" }}>Batch: {ti.batch.batchNumber} {ti.batch.expiryDate ? `· Exp: ${fmtDate(ti.batch.expiryDate)}` : ""}</div>}
                          </td>
                          <td><span className="hd-badge" style={{ background: "#f1f5f9", color: "#475569" }}>{ti.item?.category || "-"}</span></td>
                          <td style={{ fontWeight: 700 }}>{qty}</td>
                          <td style={{ fontSize: 11, color: "#64748b" }}>{ti.item?.unit || "pcs"}</td>
                          <td style={{ fontSize: 12 }}>{fmtCur(price)}</td>
                          <td style={{ fontWeight: 700, color: "#0E898F" }}>{fmtCur(qty * price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Notes */}
                {vt.notes && (
                  <div style={{ marginTop: 16, padding: "10px 14px", background: "#E6F4F4", borderRadius: 10, border: "1px solid #b2d8da" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#0b7075", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Notes</div>
                    <div style={{ fontSize: 12, color: "#0b7075" }}>{vt.notes}</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setViewTransfer(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Edit Transfer Modal ─── */}
      {editTransfer && (() => {
        const et = editTransfer;
        const etItems = et.items || [];
        const hasChanges = etItems.some((ti: any) => {
          const orig = ti.receivedQty || ti.quantity || 0;
          const curr = editTransferQtys[ti.id] ?? orig;
          return curr !== orig;
        });

        const handleSaveEdit = async () => {
          const updates = etItems
            .map((ti: any) => ({
              transferItemId: ti.id,
              newQty: editTransferQtys[ti.id] ?? (ti.receivedQty || ti.quantity || 0),
            }))
            .filter((u: any) => {
              const orig = etItems.find((ti: any) => ti.id === u.transferItemId);
              return u.newQty !== (orig?.receivedQty || orig?.quantity || 0);
            });

          if (updates.length === 0) { setEditTransfer(null); return; }

          // Validate no zero or negative
          const invalid = updates.find((u: any) => u.newQty <= 0);
          if (invalid) { alert("Quantity must be greater than 0"); return; }

          setSavingTransferEdit(true);
          const res = await api("/api/inventory/transfers", "PATCH", {
            id: et.id, action: "update_items", items: updates,
          });
          setSavingTransferEdit(false);

          if (res.success) {
            setEditTransfer(null);
            setEditTransferQtys({});
            loadDeptStock();
            loadItems();
          } else {
            alert(res.message || "Failed to update transfer");
          }
        };

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { if (!savingTransferEdit) setEditTransfer(null); }}>
            <div style={{ background: "#fff", borderRadius: 18, width: 600, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.18)" }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Pencil size={16} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Edit Transfer {et.transferNo}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{et.fromLocation?.name || "Central Store"} → {et.toLocation?.name || "-"}</div>
                  </div>
                </div>
                <button onClick={() => { if (!savingTransferEdit) setEditTransfer(null); }} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><X size={14} /></button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 20px" }}>
                <div style={{ padding: "10px 14px", background: "#eff6ff", borderRadius: 10, border: "1px solid #dbeafe", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={14} color="#3b82f6" />
                  <span style={{ fontSize: 11, color: "#1e40af" }}>Increasing qty deducts more from central stock. Decreasing qty restores stock to central batches.</span>
                </div>

                <table className="hd-tbl" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Current Qty</th>
                      <th style={{ width: 100 }}>New Qty</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etItems.map((ti: any) => {
                      const origQty = ti.receivedQty || ti.quantity || 0;
                      const newQty = editTransferQtys[ti.id] ?? origQty;
                      const diff = newQty - origQty;
                      return (
                        <tr key={ti.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{ti.item?.name || "—"}</div>
                            {ti.batch?.batchNumber && <div style={{ fontSize: 9, color: "#94a3b8" }}>Batch: {ti.batch.batchNumber}</div>}
                          </td>
                          <td><span className="hd-badge" style={{ background: "#f1f5f9", color: "#475569" }}>{ti.item?.category || "-"}</span></td>
                          <td style={{ fontWeight: 600, fontSize: 12, color: "#64748b" }}>{origQty} {ti.item?.unit || ""}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={newQty}
                              onChange={e => setEditTransferQtys(prev => ({ ...prev, [ti.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                              style={{ width: 80, padding: "6px 10px", borderRadius: 7, border: diff !== 0 ? "1.5px solid #3b82f6" : "1px solid #e2e8f0", fontSize: 13, fontWeight: 700, background: diff !== 0 ? "#eff6ff" : "#fff", outline: "none", textAlign: "center" }}
                            />
                          </td>
                          <td>
                            {diff !== 0 ? (
                              <span style={{ fontSize: 12, fontWeight: 700, color: diff > 0 ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 3 }}>
                                {diff > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {diff > 0 ? "+" : ""}{diff}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => { if (!savingTransferEdit) setEditTransfer(null); }} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!hasChanges || savingTransferEdit}
                  style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: hasChanges ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#e2e8f0", color: hasChanges ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 700, cursor: hasChanges ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {savingTransferEdit ? <Loader2 size={13} className="hd-spin" /> : <Check size={13} />}
                  {savingTransferEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>{/* end content padding wrapper */}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Unified Item Modal (Add / Edit / View) ───
// ═══════════════════════════════════════════════════
function ItemModal({ mode, item, suppliers, onClose, onSuccess }: { mode: "add" | "edit" | "view"; item: any; suppliers: any[]; onClose: () => void; onSuccess: () => void }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";
  
  const [form, setForm] = useState({
    name: item?.name || "", genericName: item?.genericName || "", brandName: item?.brandName || "",
    category: item?.category || "Medicine", subCategory: item?.subCategory || "", itemType: item?.itemType || "Consumable",
    unit: item?.unit || "pcs", purchasePrice: item?.purchasePrice || 0, mrp: item?.mrp || 0,
    sellingPrice: item?.sellingPrice || 0, gst: item?.gst || 0, minStock: item?.minStock ?? 5,
    openingStock: item?.openingStock || 0, isActive: item?.isActive ?? true, description: item?.description || "",
    hsnCode: item?.hsnCode || "", barcode: item?.barcode || "", supplierName: item?.supplierName || "",
  });
  const [saving, setSaving] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [restockForm, setRestockForm] = useState({
    quantity: 0, unitPrice: item?.purchasePrice || 0, batchNumber: "", expiryDate: "", supplierId: ""
  });
  const [restocking, setRestocking] = useState(false);
  const h = (e: any) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const handleRestock = async () => {
    if (!restockForm.quantity || restockForm.quantity <= 0) return alert("Quantity must be greater than 0");
    setRestocking(true);
    const d = await api("/api/inventory/purchase", "POST", {
      supplierId: restockForm.supplierId || null,
      purchaseNo: `QR-${Date.now().toString().slice(-6)}`,
      notes: `Quick restock for ${item.name}`,
      paymentType: "PAID",
      paymentMethod: "CASH",
      amountPaid: restockForm.quantity * restockForm.unitPrice,
      discount: 0,
      taxPercent: 0,
      items: [{
        itemId: item.id,
        quantity: parseInt(String(restockForm.quantity)),
        price: parseFloat(String(restockForm.unitPrice)) || 0,
        batchNumber: restockForm.batchNumber || undefined,
        expiryDate: restockForm.expiryDate || undefined,
      }],
    });
    setRestocking(false);
    if (d.success) {
      setShowRestock(false);
      setRestockForm({ quantity: 0, unitPrice: item?.purchasePrice || 0, batchNumber: "", expiryDate: "", supplierId: "" });
      onSuccess();
    } else {
      alert(d.message || "Failed to restock");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("Item name is required");
    setSaving(true);
    const payload = {
      ...(isEdit ? { id: item.id } : {}),
      name: form.name, genericName: form.genericName || undefined, brandName: form.brandName || undefined,
      category: form.category, subCategory: form.subCategory || undefined, itemType: form.itemType,
      unit: form.unit, purchasePrice: parseFloat(String(form.purchasePrice)) || 0,
      mrp: parseFloat(String(form.mrp)) || 0, sellingPrice: parseFloat(String(form.sellingPrice)) || 0,
      gst: parseFloat(String(form.gst)) || 0, minStock: parseInt(String(form.minStock)) || 0,
      openingStock: parseInt(String(form.openingStock)) || 0, isActive: form.isActive,
      description: form.description || undefined, hsnCode: form.hsnCode || undefined, barcode: form.barcode || undefined,
      supplierName: form.supplierName || undefined,
    };
    const d = await api("/api/config/inventory", isEdit ? "PUT" : "POST", payload);
    if (d.success) onSuccess(); else alert(d.message || "Failed to save item");
    setSaving(false);
  };

  const modalTitle = isView ? "Item Details" : isEdit ? "Edit Item" : "Add New Item";
  const modalIcon = isView ? <Eye size={18} color="#0E898F" /> : isEdit ? <Pencil size={18} color="#3b82f6" /> : <Plus size={18} color="#0E898F" />;

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: 640, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {modalIcon}
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{modalTitle}</span>
            {isView && item?.isActive !== undefined && (
              <span className="hd-badge" style={{ background: item.isActive ? "#dcfce7" : "#fee2e2", color: item.isActive ? "#166534" : "#991b1b", marginLeft: 4 }}>
                {item.isActive ? "Active" : "Inactive"}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 24, maxHeight: "75vh", overflowY: "auto" }}>
          <div className="hd-mf" style={{ marginBottom: 14 }}>
            <label className="hd-ml">Item Name *</label>
            <input className="hd-mi" name="name" value={form.name} onChange={h} required placeholder="e.g., Paracetamol 500mg" autoFocus={!isView} readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="hd-mf"><label className="hd-ml">Generic Name</label><input className="hd-mi" name="genericName" value={form.genericName} onChange={h} readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
            <div className="hd-mf"><label className="hd-ml">Brand Name</label><input className="hd-mi" name="brandName" value={form.brandName} onChange={h} readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="hd-mf"><label className="hd-ml">Category *</label><select className="hd-mi" name="category" value={form.category} onChange={h} disabled={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="hd-mf"><label className="hd-ml">Sub Category</label><input className="hd-mi" name="subCategory" value={form.subCategory} onChange={h} readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
            <div className="hd-mf"><label className="hd-ml">Unit *</label><select className="hd-mi" name="unit" value={form.unit} onChange={h} disabled={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div className="hd-mf" style={{ marginBottom: 14 }}>
            <label className="hd-ml">Preferred Supplier</label>
            <select className="hd-mi" name="supplierName" value={form.supplierName} onChange={h} disabled={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.name}>{s.name}{s.city ? ` (${s.city})` : ""}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="hd-mf"><label className="hd-ml">Purchase Price</label><input className="hd-mi" type="number" name="purchasePrice" value={form.purchasePrice} onChange={h} min="0" step="0.01" readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
            <div className="hd-mf"><label className="hd-ml">MRP</label><input className="hd-mi" type="number" name="mrp" value={form.mrp} onChange={h} min="0" step="0.01" readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
            <div className="hd-mf"><label className="hd-ml">Selling Price</label><input className="hd-mi" type="number" name="sellingPrice" value={form.sellingPrice} onChange={h} min="0" step="0.01" readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
            <div className="hd-mf"><label className="hd-ml">GST %</label><input className="hd-mi" type="number" name="gst" value={form.gst} onChange={h} min="0" readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isAdd ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {isAdd && <div className="hd-mf"><label className="hd-ml">Opening Stock</label><input className="hd-mi" type="number" name="openingStock" value={form.openingStock} onChange={h} min="0" /></div>}
            {isView && <div className="hd-mf"><label className="hd-ml">Current Stock</label><input className="hd-mi" type="number" value={item?.totalStock ?? 0} readOnly style={{ background: "#f8fafc", cursor: "default", fontWeight: 700, color: (item?.totalStock ?? 0) <= (item?.minStock ?? 0) ? "#ef4444" : "#10b981" }} /></div>}
            <div className="hd-mf"><label className="hd-ml">Min Stock Alert</label><input className="hd-mi" type="number" name="minStock" value={form.minStock} onChange={h} min="0" readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
            <div className="hd-mf"><label className="hd-ml">HSN Code</label><input className="hd-mi" name="hsnCode" value={form.hsnCode} onChange={h} readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
            <div className="hd-mf"><label className="hd-ml">Barcode</label><input className="hd-mi" name="barcode" value={form.barcode} onChange={h} readOnly={isView} style={isView ? { background: "#f8fafc", cursor: "default" } : {}} /></div>
          </div>
          <div className="hd-mf" style={{ marginBottom: 14 }}><label className="hd-ml">Description</label><textarea className="hd-mi" name="description" value={form.description} onChange={h} rows={2} style={isView ? { resize: "none", background: "#f8fafc", cursor: "default" } : { resize: "none" }} readOnly={isView} /></div>

          {/* Quick Restock Section (Edit Mode Only) */}
          {isEdit && (
            <div style={{ marginBottom: 14, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setShowRestock(!showRestock)}
                style={{ width: "100%", padding: "12px 16px", background: showRestock ? "#f0fdf4" : "#f8fafc", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: showRestock ? "1px solid #e2e8f0" : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShoppingCart size={16} color="#10b981" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Quick Restock</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Add stock to this item</span>
                </div>
                <ChevronDown size={16} color="#94a3b8" style={{ transform: showRestock ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              
              {showRestock && (
                <div style={{ padding: 16, background: "#fff" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div className="hd-mf">
                      <label className="hd-ml">Quantity *</label>
                      <input className="hd-mi" type="number" min="1" value={restockForm.quantity} onChange={e => setRestockForm({ ...restockForm, quantity: parseInt(e.target.value) || 0 })} placeholder="Enter quantity" />
                    </div>
                    <div className="hd-mf">
                      <label className="hd-ml">Unit Price *</label>
                      <input className="hd-mi" type="number" min="0" step="0.01" value={restockForm.unitPrice} onChange={e => setRestockForm({ ...restockForm, unitPrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div className="hd-mf">
                      <label className="hd-ml">Batch Number</label>
                      <input className="hd-mi" value={restockForm.batchNumber} onChange={e => setRestockForm({ ...restockForm, batchNumber: e.target.value })} placeholder="Optional" />
                    </div>
                    <div className="hd-mf">
                      <label className="hd-ml">Expiry Date</label>
                      <input className="hd-mi" type="date" value={restockForm.expiryDate} onChange={e => setRestockForm({ ...restockForm, expiryDate: e.target.value })} />
                    </div>
                    <div className="hd-mf">
                      <label className="hd-ml">Supplier</label>
                      <select className="hd-mi" value={restockForm.supplierId} onChange={e => setRestockForm({ ...restockForm, supplierId: e.target.value })}>
                        <option value="">None</option>
                        {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #dcfce7", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Total Amount:</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#166534" }}>{fmtCur(restockForm.quantity * restockForm.unitPrice)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestock}
                    disabled={restocking || !restockForm.quantity || restockForm.quantity <= 0}
                    style={{ width: "100%", padding: "10px 16px", borderRadius: 10, border: "none", background: restocking || !restockForm.quantity ? "#94a3b8" : "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: restocking || !restockForm.quantity ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    {restocking ? <Loader2 size={14} className="hd-spin" /> : <><Package size={14} /> Add Stock & Record Purchase</>}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", justifyContent: isView ? "flex-end" : "space-between", gap: 10 }}>
            {isView ? (
              <button type="button" onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "none" }}>Close</button>
            ) : (
              <>
                <button type="button" onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={saving || !form.name} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saving ? "#94a3b8" : "#0E898F", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "none" }}>
                  {saving ? <Loader2 size={14} className="hd-spin" /> : <>{isEdit ? <CheckCircle2 size={14} /> : <Plus size={14} />} {isEdit ? "Update" : "Add Item"}</>}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Restock / Purchase Order Modal (with Payment) ───
// ═══════════════════════════════════════════════════
function RestockModal({ items, suppliers, onClose, onSuccess }: { items: any[]; suppliers: any[]; onClose: () => void; onSuccess: (p?: any) => void }) {
  const genInv = () => { const d = new Date(); return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; };
  const [form, setForm] = useState({
    supplierId: "", purchaseNo: `PO-${Date.now().toString().slice(-6)}`, notes: "",
    invoiceNumber: genInv(), invoiceDate: new Date().toISOString().split("T")[0],
    paymentType: "CREDIT" as "CREDIT" | "PAID",
    paymentMethod: "BANK_TRANSFER", amountPaid: 0, transactionId: "", dueDate: "",
    discount: 0, taxPercent: 0,
  });
  const [pItems, setPItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [done, setDone] = useState<any>(null);
  const [dueDateError, setDueDateError] = useState("");

  const lowStockItems = items.filter((i: any) => (i.totalStock ?? 0) <= (i.minStock ?? 0) && i.isActive);
  const filtered = search.length > 1 ? items.filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase()) && !pItems.find((p: any) => p.itemId === i.id)) : [];

  const addItem = (item: any) => {
    setPItems(prev => [...prev, {
      itemId: item.id, name: item.name, unit: item.unit, category: item.category,
      currentStock: item.totalStock ?? 0, minStock: item.minStock ?? 0,
      quantity: Math.max(1, (item.minStock ?? 5) - (item.totalStock ?? 0)),
      unitPrice: item.purchasePrice || 0, batchNumber: "", expiryDate: "", mfgDate: "",
    }]);
    setSearch("");
  };

  const addAllLowStock = () => {
    const newItems = lowStockItems.filter(i => !pItems.find(p => p.itemId === i.id)).map(item => ({
      itemId: item.id, name: item.name, unit: item.unit, category: item.category,
      currentStock: item.totalStock ?? 0, minStock: item.minStock ?? 0,
      quantity: Math.max(1, (item.minStock ?? 5) * 2 - (item.totalStock ?? 0)),
      unitPrice: item.purchasePrice || 0, batchNumber: "", expiryDate: "", mfgDate: "",
    }));
    if (newItems.length === 0) return alert("All low stock items already added");
    setPItems(prev => [...prev, ...newItems]);
  };

  const update = (i: number, f: string, v: any) => { const n = [...pItems]; n[i][f] = v; setPItems(n); };
  const remove = (i: number) => setPItems(pItems.filter((_: any, idx: number) => idx !== i));

  const subtotal = pItems.reduce((s: number, p: any) => s + (p.quantity * p.unitPrice), 0);
  const discountAmt = form.discount || 0;
  const taxAmt = ((subtotal - discountAmt) * (form.taxPercent || 0)) / 100;
  const grandTotal = subtotal - discountAmt + taxAmt;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pItems.length === 0) return alert("Add at least one item");
    for (const p of pItems) { if (p.quantity <= 0) return alert(`Quantity for ${p.name} must be > 0`); }
    
    // Validate due date for CREDIT payment
    if (form.paymentType === "CREDIT" && !form.dueDate) {
      setDueDateError("Payment due date is required for credit purchases");
      return;
    }
    setDueDateError("");
    setSaving(true);
    const d = await api("/api/inventory/purchase", "POST", {
      supplierId: form.supplierId || null, purchaseNo: form.purchaseNo,
      notes: form.notes || undefined, invoiceNumber: form.invoiceNumber || undefined,
      invoiceDate: form.invoiceDate || undefined,
      paymentType: form.paymentType,
      paymentMethod: form.paymentType === "PAID" ? form.paymentMethod : undefined,
      amountPaid: form.paymentType === "PAID" ? grandTotal : 0,
      transactionId: form.paymentType === "PAID" ? (form.transactionId || undefined) : undefined,
      dueDate: form.paymentType === "CREDIT" ? form.dueDate : undefined,
      discount: discountAmt, taxPercent: form.taxPercent || 0,
      items: pItems.map(p => ({
        itemId: p.itemId, quantity: parseInt(String(p.quantity)),
        price: parseFloat(String(p.unitPrice)) || 0,
        batchNumber: p.batchNumber || undefined, expiryDate: p.expiryDate || undefined,
        mfgDate: p.mfgDate || undefined,
      })),
    });
    if (d.success) {
      // Fetch full purchase with items for invoice
      const full = await api(`/api/inventory/purchase?id=${d.data?.id || d.data}`);
      setDone(full.success ? full.data : d.data);
    } else alert(d.message || "Failed");
    setSaving(false);
  };

  const selectedSupplier = suppliers.find((s: any) => s.id === form.supplierId);

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: 860, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #10b98115, #f0fdf4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}><ShoppingCart size={18} /> Restock / Purchase Order</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Add multiple items from a supplier in one go</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>

        {done ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><CheckCircle2 size={28} color="#16a34a" /></div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#166534" }}>Purchase Recorded!</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{pItems.length} item(s) restocked - {fmtCur(grandTotal)} total</div>
            {form.paymentType === "CREDIT" && <div style={{ fontSize: 12, color: "#0E898F", marginTop: 6 }}>Payment due: {fmtDate(form.dueDate)} - Reminder will appear on due date</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => onSuccess(done)} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "none", display: "flex", alignItems: "center", gap: 6 }}><Eye size={14} /> View Invoice</button>
              <button onClick={() => onSuccess()} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "none" }}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: 24, maxHeight: "78vh", overflowY: "auto" }}>
            {/* Supplier + PO + Invoice Date */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf">
                <label className="hd-ml">Supplier</label>
                <select className="hd-mi" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} style={{ fontWeight: form.supplierId ? 600 : 400 }}>
                  <option value="">Select supplier</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` - ${s.city}` : ""}{s.gstNumber ? ` (${s.gstNumber})` : ""}</option>)}
                </select>
              </div>
              <div className="hd-mf"><label className="hd-ml">PO Number</label><input className="hd-mi" value={form.purchaseNo} onChange={e => setForm({ ...form, purchaseNo: e.target.value })} /></div>
              <div className="hd-mf"><label className="hd-ml">Invoice Date</label><input className="hd-mi" type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} /></div>
            </div>

            {selectedSupplier && (
              <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", gap: 20, fontSize: 11, color: "#475569", border: "1px solid #dcfce7" }}>
                <span><strong>Contact:</strong> {selectedSupplier.contactPerson || "-"}</span>
                <span><strong>Phone:</strong> {selectedSupplier.phone || "-"}</span>
                <span><strong>Terms:</strong> {selectedSupplier.paymentTerms || "Immediate"}</span>
                {selectedSupplier.gstNumber && <span><strong>GST:</strong> {selectedSupplier.gstNumber}</span>}
              </div>
            )}

            <div className="hd-mf" style={{ marginBottom: 14 }}><label className="hd-ml">Invoice No. (auto-generated)</label><input className="hd-mi" value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} /></div>

            {/* Search + Low Stock */}
            <div style={{ marginBottom: 12, marginTop: 4 }}>
              <label className="hd-ml" style={{ marginBottom: 6, display: "block" }}>Add Items to Purchase</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px" }}>
                    <Search size={14} color="#94a3b8" />
                    <input style={{ border: "none", background: "none", outline: "none", fontSize: 13, width: "100%", color: "#1e293b" }} placeholder="Type item name to search..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  {filtered.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, marginTop: 4, boxShadow: "0 10px 25px rgba(0,0,0,0.12)", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                      {filtered.slice(0, 15).map((it: any) => (
                        <div key={it.id} onClick={() => addItem(it)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between" }}
                          onMouseEnter={(e: any) => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
                          <div><div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{it.category} - {it.unit}</div></div>
                          <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 600, color: (it.totalStock ?? 0) <= (it.minStock ?? 0) ? "#ef4444" : "#10b981" }}>Stock: {it.totalStock ?? 0}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {lowStockItems.length > 0 && (
                  <button type="button" onClick={addAllLowStock} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#fff5f5", color: "#ef4444", border: "1.5px solid #fecaca", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, height: 38, boxShadow: "none" }}>
                    <AlertTriangle size={13} /> Add {lowStockItems.filter(i => !pItems.find(p => p.itemId === i.id)).length} Low Stock Items
                  </button>
                )}
              </div>
            </div>

            {/* Items Table */}
            {pItems.length > 0 ? (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
                <table className="hd-tbl" style={{ marginBottom: 0 }}>
                  <thead><tr><th>Item</th><th style={{ width: 60 }}>Stock</th><th style={{ width: 65 }}>Qty</th><th style={{ width: 80 }}>Rate</th><th style={{ width: 80 }}>Batch</th><th style={{ width: 80 }}>Expiry</th><th style={{ width: 75 }}>Amount</th><th style={{ width: 30 }}></th></tr></thead>
                  <tbody>
                    {pItems.map((p: any, i: number) => (
                      <tr key={i}>
                        <td><div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{p.category}</div></td>
                        <td style={{ fontWeight: 600, fontSize: 12, color: p.currentStock <= p.minStock ? "#ef4444" : "#64748b" }}>{p.currentStock}</td>
                        <td><input className="hd-mi" type="number" style={{ width: 55, padding: "5px 6px", fontSize: 12, textAlign: "center", fontWeight: 700 }} value={p.quantity} min={1} onChange={e => update(i, "quantity", parseInt(e.target.value) || 0)} /></td>
                        <td><input className="hd-mi" type="number" style={{ width: 70, padding: "5px 6px", fontSize: 12, textAlign: "center" }} value={p.unitPrice} min={0} step="0.01" onChange={e => update(i, "unitPrice", parseFloat(e.target.value) || 0)} /></td>
                        <td><input className="hd-mi" style={{ width: 70, padding: "5px 6px", fontSize: 11 }} value={p.batchNumber} onChange={e => update(i, "batchNumber", e.target.value)} placeholder="Batch" /></td>
                        <td><input className="hd-mi" type="date" style={{ width: 70, padding: "4px 4px", fontSize: 10 }} value={p.expiryDate} onChange={e => update(i, "expiryDate", e.target.value)} /></td>
                        <td style={{ fontWeight: 700, fontSize: 12, color: "#166534" }}>{fmtCur(p.quantity * p.unitPrice)}</td>
                        <td><button type="button" onClick={() => remove(i)} style={{ color: "#ef4444", background: "#fee2e2", border: "none", cursor: "pointer", width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={11} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 12, background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0", marginBottom: 14 }}>Search items above or click "Add Low Stock Items" to get started</div>
            )}

            {/* Billing Summary */}
            {pItems.length > 0 && (<>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div className="hd-mf"><label className="hd-ml">Discount (flat)</label><input className="hd-mi" type="number" value={form.discount} min={0} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} /></div>
                <div className="hd-mf"><label className="hd-ml">Tax %</label><input className="hd-mi" type="number" value={form.taxPercent} min={0} onChange={e => setForm({ ...form, taxPercent: parseFloat(e.target.value) || 0 })} /></div>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "8px 14px", border: "1px solid #dcfce7", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>GRAND TOTAL</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>{fmtCur(grandTotal)}</div>
                  {(discountAmt > 0 || taxAmt > 0) && <div style={{ fontSize: 10, color: "#94a3b8" }}>Sub: {fmtCur(subtotal)}{discountAmt > 0 ? ` - Disc: ${fmtCur(discountAmt)}` : ""}{taxAmt > 0 ? ` + Tax: ${fmtCur(taxAmt)}` : ""}</div>}
                </div>
              </div>

              {/* ─── Payment Section ─── */}
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><CreditCard size={15} /> Payment</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {(["CREDIT", "PAID"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, paymentType: t })} style={{
                      flex: 1, padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                      border: form.paymentType === t ? `2px solid ${t === "PAID" ? "#10b981" : "#0E898F"}` : "1.5px solid #e2e8f0",
                      background: form.paymentType === t ? (t === "PAID" ? "#f0fdf4" : "#E6F4F4") : "#fff",
                      boxShadow: "none",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: form.paymentType === t ? (t === "PAID" ? "#166534" : "#0b7075") : "#64748b" }}>
                        {t === "CREDIT" ? "Credit (Pay Later)" : "Pay Now"}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                        {t === "CREDIT" ? "Set due date - get reminder" : "Record payment immediately"}
                      </div>
                    </button>
                  ))}
                </div>

                {form.paymentType === "PAID" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="hd-mf">
                      <label className="hd-ml">Payment Method *</label>
                      <select className="hd-mi" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div className="hd-mf"><label className="hd-ml">Transaction / Ref ID</label><input className="hd-mi" value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })} placeholder="Optional reference" /></div>
                  </div>
                )}

                {form.paymentType === "CREDIT" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="hd-mf">
                      <label className="hd-ml">Payment Due Date *</label>
                      <input 
                        className="hd-mi" 
                        type="date" 
                        value={form.dueDate} 
                        onChange={e => { setForm({ ...form, dueDate: e.target.value }); setDueDateError(""); }} 
                        min={new Date().toISOString().split("T")[0]} 
                        style={dueDateError ? { borderColor: "#ef4444", background: "#fef2f2" } : {}}
                      />
                      {dueDateError && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{dueDateError}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#E6F4F4", borderRadius: 10, border: "1px solid #b2d8da" }}>
                      <Bell size={16} color="#0E898F" />
                      <div style={{ fontSize: 11, color: "#0b7075" }}><strong>Reminder</strong> will auto-appear on the due date at 12:00 PM noon as a popup notification</div>
                    </div>
                  </div>
                )}
              </div>
            </>)}

            <div className="hd-mf" style={{ marginBottom: 14 }}><label className="hd-ml">Remarks</label><input className="hd-mi" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Purchase notes..." /></div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "none" }}>Cancel</button>
              <button type="submit" disabled={saving || pItems.length === 0} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saving || pItems.length === 0 ? "#94a3b8" : "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving || pItems.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "none" }}>
                {saving ? <Loader2 size={14} className="hd-spin" /> : <><CheckCircle2 size={14} /> Record Purchase & Update Stock</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Add / Edit Supplier Modal ───
// ═══════════════════════════════════════════════════
function AddSupplierModal({ existing, onClose, onSuccess }: { existing: any; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!existing;
  const [section, setSection] = useState<"basic" | "address" | "compliance" | "banking" | "terms">("basic");
  const [form, setForm] = useState({
    name: existing?.name || "", code: existing?.code || `SUP-${Date.now().toString().slice(-4)}`,
    contactPerson: existing?.contactPerson || "", designation: existing?.designation || "",
    phone: existing?.phone || "", altPhone: existing?.altPhone || "",
    email: existing?.email || "",
    address1: existing?.address1 || "", address2: existing?.address2 || "",
    city: existing?.city || "", state: existing?.state || "",
    pincode: existing?.pincode || "", country: existing?.country || "India",
    gstNumber: existing?.gstNumber || "", panNumber: existing?.panNumber || "",
    drugLicense: existing?.drugLicense || "", fssaiLicense: existing?.fssaiLicense || "",
    bankName: existing?.bankName || "", accountNumber: existing?.accountNumber || "",
    ifscCode: existing?.ifscCode || "", upiId: existing?.upiId || "",
    paymentTerms: existing?.paymentTerms || "Immediate",
    creditLimit: existing?.creditLimit || 0, openingBalance: existing?.openingBalance || 0,
    preferredPaymentMode: existing?.preferredPaymentMode || "Bank Transfer",
    categoriesSupplied: existing?.categoriesSupplied || "", brandAssociations: existing?.brandAssociations || "",
    deliveryLeadTime: existing?.deliveryLeadTime || 0,
    notes: existing?.notes || "", specialInstructions: existing?.specialInstructions || "",
  });
  const [saving, setSaving] = useState(false);
  const h = (e: any) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const hNum = (e: any) => setForm(p => ({ ...p, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("Supplier name is required");
    setSaving(true);
    const payload: any = { ...(isEdit ? { id: existing.id } : {}) };
    for (const [k, v] of Object.entries(form)) {
      if (v !== "" && v !== 0 && v !== null && v !== undefined) payload[k] = v;
      else if (k === "name" || k === "code") payload[k] = v;
    }
    if (form.creditLimit) payload.creditLimit = parseFloat(String(form.creditLimit)) || 0;
    if (form.openingBalance) payload.openingBalance = parseFloat(String(form.openingBalance)) || 0;
    if (form.deliveryLeadTime) payload.deliveryLeadTime = parseInt(String(form.deliveryLeadTime)) || 0;
    const d = await api("/api/inventory/supplier", isEdit ? "PUT" : "POST", payload);
    if (d.success) onSuccess(); else alert(d.message || "Failed");
    setSaving(false);
  };

  const sections = [
    { id: "basic", label: "Basic Info", icon: <Users size={13} /> },
    { id: "address", label: "Address", icon: <MapPin size={13} /> },
    { id: "compliance", label: "Licenses", icon: <Shield size={13} /> },
    { id: "banking", label: "Banking", icon: <CreditCard size={13} /> },
    { id: "terms", label: "Terms", icon: <FileText size={13} /> },
  ];

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: 660, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{isEdit ? "Edit Supplier" : "Add Supplier"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: 2, padding: "10px 24px 0", borderBottom: "1px solid #f1f5f9" }}>
          {sections.map(s => (
            <button key={s.id} type="button" onClick={() => setSection(s.id as any)} style={{
              padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: "8px 8px 0 0",
              background: section === s.id ? "#fff" : "transparent", color: section === s.id ? "#0E898F" : "#94a3b8",
              border: section === s.id ? "1px solid #e2e8f0" : "1px solid transparent", borderBottom: section === s.id ? "1px solid #fff" : "1px solid transparent",
              marginBottom: -1, display: "flex", alignItems: "center", gap: 5, boxShadow: "none",
            }}>{s.icon} {s.label}</button>
          ))}
        </div>
        <form onSubmit={submit} style={{ padding: 24, maxHeight: "65vh", overflowY: "auto" }}>
          {section === "basic" && <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf"><label className="hd-ml">Supplier Name *</label><input className="hd-mi" name="name" value={form.name} onChange={h} required autoFocus /></div>
              <div className="hd-mf"><label className="hd-ml">Code</label><input className="hd-mi" name="code" value={form.code} onChange={h} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf"><label className="hd-ml">Contact Person</label><input className="hd-mi" name="contactPerson" value={form.contactPerson} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">Designation</label><input className="hd-mi" name="designation" value={form.designation} onChange={h} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf"><label className="hd-ml">Phone</label><input className="hd-mi" name="phone" value={form.phone} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">Alt Phone</label><input className="hd-mi" name="altPhone" value={form.altPhone} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">Email</label><input className="hd-mi" name="email" value={form.email} onChange={h} type="email" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="hd-mf"><label className="hd-ml">Categories Supplied</label><input className="hd-mi" name="categoriesSupplied" value={form.categoriesSupplied} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">Brand Associations</label><input className="hd-mi" name="brandAssociations" value={form.brandAssociations} onChange={h} /></div>
            </div>
          </>}
          {section === "address" && <>
            <div className="hd-mf" style={{ marginBottom: 14 }}><label className="hd-ml">Address Line 1</label><input className="hd-mi" name="address1" value={form.address1} onChange={h} /></div>
            <div className="hd-mf" style={{ marginBottom: 14 }}><label className="hd-ml">Address Line 2</label><input className="hd-mi" name="address2" value={form.address2} onChange={h} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div className="hd-mf"><label className="hd-ml">City</label><input className="hd-mi" name="city" value={form.city} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">State</label><input className="hd-mi" name="state" value={form.state} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">Pincode</label><input className="hd-mi" name="pincode" value={form.pincode} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">Country</label><input className="hd-mi" name="country" value={form.country} onChange={h} /></div>
            </div>
          </>}
          {section === "compliance" && <>
            <div style={{ background: "#E6F4F4", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 11, color: "#0b7075" }}><strong>Compliance</strong> - Store license and tax details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf"><label className="hd-ml">GST Number</label><input className="hd-mi" name="gstNumber" value={form.gstNumber} onChange={h} style={{ textTransform: "uppercase" }} /></div>
              <div className="hd-mf"><label className="hd-ml">PAN Number</label><input className="hd-mi" name="panNumber" value={form.panNumber} onChange={h} style={{ textTransform: "uppercase" }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="hd-mf"><label className="hd-ml">Drug License</label><input className="hd-mi" name="drugLicense" value={form.drugLicense} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">FSSAI License</label><input className="hd-mi" name="fssaiLicense" value={form.fssaiLicense} onChange={h} /></div>
            </div>
          </>}
          {section === "banking" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf"><label className="hd-ml">Bank Name</label><input className="hd-mi" name="bankName" value={form.bankName} onChange={h} /></div>
              <div className="hd-mf"><label className="hd-ml">Account Number</label><input className="hd-mi" name="accountNumber" value={form.accountNumber} onChange={h} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="hd-mf"><label className="hd-ml">IFSC Code</label><input className="hd-mi" name="ifscCode" value={form.ifscCode} onChange={h} style={{ textTransform: "uppercase" }} /></div>
              <div className="hd-mf"><label className="hd-ml">UPI ID</label><input className="hd-mi" name="upiId" value={form.upiId} onChange={h} /></div>
            </div>
          </>}
          {section === "terms" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf"><label className="hd-ml">Payment Terms</label><select className="hd-mi" name="paymentTerms" value={form.paymentTerms} onChange={h}>{PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="hd-mf"><label className="hd-ml">Payment Mode</label><select className="hd-mi" name="preferredPaymentMode" value={form.preferredPaymentMode} onChange={h}>{PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}</select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="hd-mf"><label className="hd-ml">Credit Limit</label><input className="hd-mi" type="number" name="creditLimit" value={form.creditLimit} onChange={hNum} min="0" /></div>
              <div className="hd-mf"><label className="hd-ml">Opening Balance</label><input className="hd-mi" type="number" name="openingBalance" value={form.openingBalance} onChange={hNum} /></div>
              <div className="hd-mf"><label className="hd-ml">Lead Time (days)</label><input className="hd-mi" type="number" name="deliveryLeadTime" value={form.deliveryLeadTime} onChange={hNum} min="0" /></div>
            </div>
            <div className="hd-mf" style={{ marginBottom: 14 }}><label className="hd-ml">Notes</label><textarea className="hd-mi" name="notes" value={form.notes} onChange={h} rows={2} style={{ resize: "none" }} /></div>
            <div className="hd-mf"><label className="hd-ml">Special Instructions</label><input className="hd-mi" name="specialInstructions" value={form.specialInstructions} onChange={h} /></div>
          </>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 14 }}>
            <div style={{ display: "flex", gap: 8 }}>{sections.map(s => <div key={s.id} style={{ width: 8, height: 8, borderRadius: "50%", background: section === s.id ? "#0E898F" : "#e2e8f0", cursor: "pointer" }} onClick={() => setSection(s.id as any)} />)}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "none" }}>Cancel</button>
              <button type="submit" disabled={saving || !form.name} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saving ? "#94a3b8" : "#0E898F", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "none" }}>
                {saving ? <Loader2 size={14} className="hd-spin" /> : <>{isEdit ? <CheckCircle2 size={14} /> : <Plus size={14} />} {isEdit ? "Update" : "Add Supplier"}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Quick Transfer Modal ───
// ═══════════════════════════════════════════════════
function QuickTransferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [tItems, setTItems] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT" | "LOW">("NORMAL");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [transferResult, setTransferResult] = useState<any>(null);

  // Dropdown open states
  const [deptOpen, setDeptOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);

  // Search states
  const [deptSearch, setDeptSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  useEffect(() => {
    Promise.all([api("/api/config/subdepartments?limit=200"), api("/api/config/inventory?limit=200")]).then(([sd, inv]) => {
      if (sd.success) setSubDepts(Array.isArray(sd.data) ? sd.data : sd.data?.data || []);
      if (inv.success) setAllItems(inv.data?.data || inv.data || []);
      setLoadingData(false);
    });
  }, []);

  const categories = [...new Set(allItems.map((i: any) => i.category).filter(Boolean))].sort();
  const categoryItems = selectedCategory
    ? allItems.filter((i: any) => i.category === selectedCategory && (i.totalStock ?? 0) > 0 && !tItems.find((t: any) => t.itemId === i.id))
    : [];

  // Filtered lists for search
  const filteredDepts = deptSearch ? subDepts.filter((d: any) => d.name?.toLowerCase().includes(deptSearch.toLowerCase()) || d.type?.toLowerCase().includes(deptSearch.toLowerCase())) : subDepts;
  const filteredCategories = categorySearch ? categories.filter((c: string) => c.toLowerCase().includes(categorySearch.toLowerCase())) : categories;
  const filteredItems = itemSearch ? categoryItems.filter((i: any) => i.name?.toLowerCase().includes(itemSearch.toLowerCase())) : categoryItems;

  const addItem = (item: any) => { setTItems([...tItems, { itemId: item.id, name: item.name, category: item.category || "-", unit: item.unit || "-", totalStock: item.totalStock ?? 0, quantity: 1 }]); setSelectedItemId(""); setItemOpen(false); setItemSearch(""); setError(""); };
  const addSelectedItem = () => { const it = categoryItems.find((i: any) => i.id === selectedItemId); if (it) addItem(it); };
  const updateQty = (idx: number, qty: number) => { const n = [...tItems]; n[idx].quantity = qty; setTItems(n); setError(""); };
  const removeItem = (idx: number) => setTItems(tItems.filter((_: any, i: number) => i !== idx));
  const totalQty = tItems.reduce((s: number, t: any) => s + (t.quantity || 0), 0);

  const submit = async () => {
    setError("");
    if (!selectedDept) { setError("Please select a destination department."); return; }
    if (tItems.length === 0) { setError("Please add at least one item to transfer."); return; }
    for (const ti of tItems) {
      if (!ti.quantity || ti.quantity <= 0) { setError(`Quantity for "${ti.name}" must be greater than 0.`); return; }
      if (ti.quantity > ti.totalStock) { setError(`Quantity for "${ti.name}" exceeds available stock (${ti.totalStock}).`); return; }
    }
    setSaving(true);
    try {
      const d = await api("/api/inventory/quick-transfer", "POST", {
        subDepartmentId: selectedDept.id, subDeptName: selectedDept.name,
        items: tItems.map((ti: any) => ({ itemId: ti.itemId, quantity: parseInt(String(ti.quantity), 10) })),
        notes: [priority !== "NORMAL" ? `[${priority}] ` : "", notes].join("").trim() || undefined,
      });
      if (d.success) { setTransferResult(d.data); setDone(true); setTimeout(() => onSuccess(), 1800); } else setError(d.message || "Transfer failed. Please try again.");
    } catch { setError("Network error. Please try again."); }
    setSaving(false);
  };

  const fieldLabel = (text: string, required?: boolean) => (
    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".04em" }}>{text}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
  );
  const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#fff", outline: "none" };

  // Custom Dropdown Component
  const CustomDropdown = ({ label, required, value, placeholder, options, onSelect, open, setOpen, search, setSearch, disabled, renderOption, renderValue }: any) => {
    const dropRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
      const handleClick = (e: any) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
      if (open) document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [open, setOpen]);

    useEffect(() => {
      if (open && setSearch && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }, [open, setSearch]);

    return (
      <div ref={dropRef} style={{ position: "relative" }}>
        {label && fieldLabel(label, required)}
        <div onClick={() => !disabled && setOpen(!open)} style={{
          width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: value ? "#1e293b" : "#94a3b8",
          background: disabled ? "#f8fafc" : "#fff", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
          opacity: disabled ? 0.6 : 1, transition: "all 0.15s",
        }}>
          <span>{value ? (renderValue ? renderValue(value) : value) : placeholder}</span>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "#94a3b8" }} />
        </div>
        {open && !disabled && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1.5px solid #e2e8f0",
            borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 240, overflowY: "auto",
          }}>
            {setSearch && (
              <div style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", borderRadius: 6, padding: "6px 10px", border: "1px solid #e2e8f0" }}>
                  <Search size={13} color="#94a3b8" />
                  <input 
                    ref={searchInputRef}
                    value={search} 
                    onChange={(e: any) => setSearch(e.target.value)} 
                    onKeyDown={(e: any) => e.stopPropagation()}
                    placeholder="Type to search..." 
                    style={{ border: "none", background: "none", outline: "none", fontSize: 12, width: "100%", color: "#1e293b" }} 
                    onClick={(e: any) => e.stopPropagation()} 
                    autoComplete="off"
                  />
                </div>
              </div>
            )}
            <div style={{ maxHeight: setSearch ? 180 : 240, overflowY: "auto" }}>
              {options.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                  {search ? `No results for "${search}"` : "No options available"}
                </div>
              ) : (
                options.map((opt: any, idx: number) => (
                  <div key={idx} onClick={() => { onSelect(opt); setOpen(false); if (setSearch) setSearch(""); }} style={{
                    padding: "9px 14px", fontSize: 13, cursor: "pointer", transition: "all 0.12s",
                    background: "#fff", borderBottom: idx < options.length - 1 ? "1px solid #f8fafc" : "none",
                  }} onMouseEnter={(e: any) => e.currentTarget.style.background = "#f0fdfa"}
                    onMouseLeave={(e: any) => e.currentTarget.style.background = "#fff"}>
                    {renderOption ? renderOption(opt) : opt}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: 640, padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #d1ecec", background: "linear-gradient(135deg, #E6F4F4, #d1ecec)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#0E898F", display: "flex", alignItems: "center", justifyContent: "center" }}><Truck size={17} color="#fff" /></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#065f64" }}>Transfer Stock to Department</div>
              <div style={{ fontSize: 11, color: "#0E898F" }}>Move items from Central Store to a sub-department</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}><X size={20} /></button>
        </div>

        {/* Success */}
        {done ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 0 0 8px #f0fdf4" }}><CheckCircle2 size={28} color="#16a34a" /></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#166534", marginBottom: 4 }}>Stock Transferred Successfully!</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
              {tItems.length} item{tItems.length !== 1 ? "s" : ""} ({totalQty} units) transferred to <strong>{selectedDept?.name}</strong>
            </div>
            {transferResult?.transfer?.transferNo && (
              <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 7, background: "#E6F4F4", border: "1px solid #b2dfdb", fontSize: 12, color: "#065f64" }}>
                Transfer No: <strong style={{ color: "#0E898F" }}>{transferResult.transfer.transferNo}</strong>
              </div>
            )}
          </div>
        ) : loadingData ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Loader2 size={26} className="hd-spin" color="#0E898F" />
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 10 }}>Loading departments and items...</div>
          </div>
        ) : (
          <div style={{ maxHeight: "74vh", overflowY: "auto", padding: "20px 22px 22px" }}>
            {/* Error Banner */}
            {error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Row 1: Department + Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 14, marginBottom: 16 }}>
              {subDepts.length === 0 ? (
                <div>
                  {fieldLabel("Destination Department", true)}
                  <div style={{ padding: 10, background: "#E6F4F4", borderRadius: 8, fontSize: 12, color: "#065f64", fontWeight: 600 }}>No sub-departments found. Create one in Settings first.</div>
                </div>
              ) : (
                <CustomDropdown
                  label="Destination Department"
                  required
                  value={selectedDept}
                  placeholder="— Select Department —"
                  options={filteredDepts}
                  onSelect={(sd: any) => { setSelectedDept(sd); setError(""); }}
                  open={deptOpen}
                  setOpen={setDeptOpen}
                  search={deptSearch}
                  setSearch={setDeptSearch}
                  renderValue={(d: any) => `${d.name}${d.type ? ` (${d.type.replace(/_/g, " ")})` : ""}`}
                  renderOption={(d: any) => (
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{d.name}</div>
                      {d.type && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{d.type.replace(/_/g, " ")}</div>}
                    </div>
                  )}
                />
              )}
              <CustomDropdown
                label="Priority"
                value={priority}
                placeholder="Select Priority"
                options={["LOW", "NORMAL", "URGENT"]}
                onSelect={(p: any) => setPriority(p)}
                open={priorityOpen}
                setOpen={setPriorityOpen}
                renderValue={(p: string) => p.charAt(0) + p.slice(1).toLowerCase()}
                renderOption={(p: string) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: p === "URGENT" ? "#ef4444" : p === "NORMAL" ? "#0E898F" : "#64748b" }} />
                    <span style={{ fontWeight: 600 }}>{p.charAt(0) + p.slice(1).toLowerCase()}</span>
                  </div>
                )}
              />
            </div>

            {/* Row 2: Category + Item + Add Button */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 16, alignItems: "end" }}>
              <CustomDropdown
                label="Category"
                value={selectedCategory}
                placeholder="— Select Category —"
                options={filteredCategories}
                onSelect={(c: string) => { setSelectedCategory(c); setSelectedItemId(""); }}
                open={categoryOpen}
                setOpen={setCategoryOpen}
                search={categorySearch}
                setSearch={setCategorySearch}
                disabled={!selectedDept}
                renderOption={(c: string) => {
                  const inStock = allItems.filter((i: any) => i.category === c && (i.totalStock ?? 0) > 0).length;
                  return (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>{c}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#E6F4F4", color: "#0E898F", fontWeight: 700 }}>{inStock} in stock</span>
                    </div>
                  );
                }}
              />
              <CustomDropdown
                label="Item"
                value={categoryItems.find((i: any) => i.id === selectedItemId)}
                placeholder={!selectedCategory ? "Select category first" : categoryItems.length === 0 ? "No items available" : `— Select Item (${categoryItems.length}) —`}
                options={filteredItems}
                onSelect={(it: any) => setSelectedItemId(it.id)}
                open={itemOpen}
                setOpen={setItemOpen}
                search={itemSearch}
                setSearch={setItemSearch}
                disabled={!selectedCategory || categoryItems.length === 0}
                renderValue={(it: any) => it.name}
                renderOption={(it: any) => {
                  const stockColor = (it.totalStock ?? 0) > (it.minStock ?? 10) ? "#10b981" : (it.totalStock ?? 0) > 5 ? "#0E898F" : "#ef4444";
                  return (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12 }}>{it.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{it.unit || "unit"}</div>
                      </div>
                      <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: stockColor }}>Stock: {it.totalStock ?? 0}</div>
                    </div>
                  );
                }}
              />
              <button type="button" disabled={!selectedItemId} onClick={addSelectedItem} style={{
                padding: "9px 16px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700, cursor: selectedItemId ? "pointer" : "not-allowed",
                background: selectedItemId ? "#0E898F" : "#e2e8f0", color: selectedItemId ? "#fff" : "#94a3b8",
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", height: 38,
              }}><Plus size={14} /> Add</button>
            </div>

            {/* Transfer Items Table */}
            {tItems.length > 0 ? (
              <div style={{ border: "1.5px solid #d1ecec", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                <table className="hd-tbl" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: "#E6F4F4" }}>
                      <th style={{ width: 28, textAlign: "center", padding: "8px 6px" }}>#</th>
                      <th style={{ padding: "8px 10px" }}>Item</th>
                      <th style={{ padding: "8px 10px", width: 80, textAlign: "center" }}>Stock</th>
                      <th style={{ padding: "8px 10px", width: 100, textAlign: "center" }}>Transfer Qty</th>
                      <th style={{ width: 36, padding: "8px 6px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tItems.map((ti: any, i: number) => {
                      const qtyError = ti.quantity > ti.totalStock || ti.quantity <= 0;
                      return (
                        <tr key={ti.itemId} style={{ background: qtyError ? "#fef2f2" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", fontWeight: 600, padding: "8px 6px" }}>{i + 1}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: "#1e293b" }}>{ti.name}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{ti.category} · {ti.unit}</div>
                          </td>
                          <td style={{ textAlign: "center", padding: "8px 10px" }}>
                            <span style={{ fontWeight: 700, fontSize: 12, color: ti.totalStock < 10 ? "#ef4444" : "#10b981" }}>{ti.totalStock}</span>
                          </td>
                          <td style={{ textAlign: "center", padding: "8px 10px" }}>
                            <input type="number" value={ti.quantity} min={1} max={ti.totalStock}
                              onChange={(e: any) => updateQty(i, parseInt(e.target.value) || 0)}
                              style={{ padding: "5px 4px", width: 68, fontSize: 13, fontWeight: 700, textAlign: "center", borderRadius: 7, border: qtyError ? "2px solid #ef4444" : "1.5px solid #e2e8f0", background: qtyError ? "#fef2f2" : "#fff", outline: "none" }} />
                            {qtyError && <div style={{ fontSize: 9, color: "#ef4444", marginTop: 2, fontWeight: 600 }}>{ti.quantity <= 0 ? "Min 1" : "Exceeds stock"}</div>}
                          </td>
                          <td style={{ padding: "8px 6px" }}>
                            <button type="button" onClick={() => removeItem(i)} style={{ color: "#ef4444", background: "#fee2e2", border: "none", cursor: "pointer", width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "24px 16px", textAlign: "center", background: "#f8fafc", borderRadius: 10, border: "1.5px dashed #e2e8f0", marginBottom: 16 }}>
                <Package size={20} color="#cbd5e1" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>No items added yet. Use the dropdowns above to select and add items.</div>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 18 }}>
              {fieldLabel("Transfer Notes (optional)")}
              <textarea value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="e.g. Requested by Dr. Kumar for OPD stock replenishment..." rows={2}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", background: "#f8fafc" }} />
            </div>

            {/* Summary + Actions */}
            {tItems.length > 0 && (
              <div style={{ background: "#f0fdfa", borderRadius: 10, padding: "12px 16px", border: "1px solid #b2dfdb", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, fontSize: 13 }}>
                <div><span style={{ color: "#64748b", fontWeight: 600 }}>Items:</span> <strong style={{ color: "#065f64" }}>{tItems.length}</strong></div>
                <div><span style={{ color: "#64748b", fontWeight: 600 }}>Total Units:</span> <strong style={{ color: "#065f64" }}>{totalQty}</strong></div>
                <div><span style={{ color: "#64748b", fontWeight: 600 }}>To:</span> <strong style={{ color: "#065f64" }}>{selectedDept?.name || "—"}</strong></div>
                {priority === "URGENT" && <span style={{ padding: "2px 10px", borderRadius: 5, background: "#fef2f2", color: "#ef4444", fontSize: 10, fontWeight: 700, border: "1px solid #fecaca", textTransform: "uppercase" }}>Urgent</span>}
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ padding: "9px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button type="button" disabled={saving || tItems.length === 0 || !selectedDept} onClick={submit} style={{
                padding: "9px 24px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700,
                cursor: saving || tItems.length === 0 || !selectedDept ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 7,
                background: saving || tItems.length === 0 || !selectedDept ? "#94a3b8" : "linear-gradient(135deg, #0E898F, #0a6e73)", color: "#fff",
                opacity: saving ? 0.7 : 1, transition: "all 0.15s",
              }}>
                {saving ? <Loader2 size={14} className="hd-spin" /> : <Truck size={14} />}
                {saving ? "Transferring..." : "Confirm & Transfer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Invoice Modal (View, Print & Download PDF) ───
// ═══════════════════════════════════════════════════
function InvoiceModal({ purchase, onClose }: { purchase: any; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const imgCache = useRef<Record<string, string | null>>({});
  const jsPdfCache = useRef<{ jsPDF: any; autoTable: any } | null>(null);
  const p = purchase;
  const items = p.items || [];
  const supplier = p.supplier;
  const hospital = p.hospital;
  const [hospitalInfo, setHospitalInfo] = useState<any>({ name: hospital?.name || "Hospital", address: "", phone: hospital?.mobile || hospital?.phone || "", email: hospital?.email || "", logo: "", gstNumber: "", registrationNo: "", letterhead: "", letterheadType: "IMAGE", letterheadSize: "A4" });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api("/api/config/settings");
        if (r.success && r.data?.settings) {
          const s = r.data.settings;
          setHospitalInfo({ name: s.hospitalName || hospital?.name || "Hospital", address: s.address || "", phone: s.phone || hospital?.phone || "", email: s.email || hospital?.email || "", logo: s.logo || "", gstNumber: s.gstNumber || "", registrationNo: s.registrationNo || "", letterhead: s.letterhead || "", letterheadType: s.letterheadType || "IMAGE", letterheadSize: s.letterheadSize || "A4" });
          return;
        }
      } catch {}
      try {
        const r2 = await api("/api/hospital/details");
        if (r2.success && r2.data) {
          const h = r2.data; const s = h.settings;
          setHospitalInfo({ name: s?.hospitalName || h.name || "Hospital", address: s?.address || "", phone: s?.phone || h.mobile || "", email: s?.email || h.email || "", logo: s?.logo || "", gstNumber: s?.gstNumber || "", registrationNo: s?.registrationNo || "", letterhead: s?.letterhead || "", letterheadType: s?.letterheadType || "IMAGE", letterheadSize: s?.letterheadSize || "A4" });
        }
      } catch {}
    })();
  }, [hospital]);

  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    if (!url) return Promise.resolve(null);
    if (imgCache.current[url] !== undefined) return Promise.resolve(imgCache.current[url]);
    return new Promise((resolve) => {
      let imgUrl = url;
      if (url.match(/\.pdf$/i) || url.includes('/raw/upload/')) { imgUrl = url.replace('/upload/', '/upload/f_png,pg_1/').replace(/\.pdf$/i, '.png'); }
      try {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => { try { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const ctx = c.getContext('2d'); if (ctx) { ctx.drawImage(img, 0, 0); const d = c.toDataURL('image/png'); imgCache.current[url] = d; resolve(d); return; } } catch {} imgCache.current[url] = null; resolve(null); };
        img.onerror = () => { imgCache.current[url] = null; resolve(null); }; img.src = imgUrl;
      } catch { imgCache.current[url] = null; resolve(null); }
    });
  };

  const getJsPdf = async () => {
    if (jsPdfCache.current) return jsPdfCache.current;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    jsPdfCache.current = { jsPDF, autoTable };
    return jsPdfCache.current;
  };

  const generatePDF = async (action: 'download' | 'print') => {
    setDownloading(true);
    try {
      const { jsPDF, autoTable } = await getJsPdf();
      const pageSize = (hospitalInfo.letterheadSize || 'A4').toLowerCase() as 'a4' | 'a5' | 'letter';
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const mx = 18;
      const cw = pw - mx * 2;
      const rs = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const letterheadDataUrl = await loadImageAsBase64(hospitalInfo.letterhead || '');
      const logoDataUrl = letterheadDataUrl ? null : await loadImageAsBase64(hospitalInfo.logo || '');
      const hasLetterhead = !!letterheadDataUrl;

      let y: number;
      if (hasLetterhead) {
        try { doc.addImage(letterheadDataUrl!, 'PNG', 0, 0, pw, ph); } catch {}
        y = 80;
        const rx = pw - mx;
        doc.setFillColor(14, 137, 143);
        doc.roundedRect(rx - 42, 50, 42, 7, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
        doc.text('PURCHASE INVOICE', rx - 21, 55, { align: 'center' });
        doc.setFontSize(11); doc.setTextColor(30, 41, 59);
        doc.text(p.invoiceNumber || p.purchaseNo || 'PO', rx, 66, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text('Date: ' + fmtDate(p.invoiceDate || p.createdAt), rx, 72, { align: 'right' });
        if (p.purchaseNo && p.invoiceNumber) { doc.text('PO: ' + p.purchaseNo, rx, 77, { align: 'right' }); }
      } else {
        y = 16;
        doc.setFillColor(248, 250, 252); doc.rect(0, 0, pw, 54, 'F');
        doc.setDrawColor(14, 137, 143); doc.setLineWidth(0.8); doc.line(0, 54, pw, 54);
        const infoX = logoDataUrl ? mx + 28 : mx;
        if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', mx, y, 22, 22); } catch {} }
        if (!logoDataUrl) {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(14, 137, 143);
          doc.text(hospitalInfo.name || 'Hospital', infoX, y + 6);
        }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        let hy = y + 12;
        if (hospitalInfo.address) { doc.text(hospitalInfo.address, infoX, hy); hy += 4; }
        if (hospitalInfo.phone) { doc.text('Phone: ' + hospitalInfo.phone, infoX, hy); hy += 4; }
        if (hospitalInfo.email) { doc.text('Email: ' + hospitalInfo.email, infoX, hy); hy += 4; }
        if (hospitalInfo.gstNumber) { doc.text('GSTIN: ' + hospitalInfo.gstNumber, infoX, hy); hy += 4; }
        if (hospitalInfo.registrationNo) { doc.text('Reg: ' + hospitalInfo.registrationNo, infoX, hy); }
        const rx = pw - mx;
        doc.setFillColor(14, 137, 143); doc.roundedRect(rx - 42, y, 42, 7, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
        doc.text('PURCHASE INVOICE', rx - 21, y + 5, { align: 'center' });
        doc.setFontSize(11); doc.setTextColor(30, 41, 59);
        doc.text(p.invoiceNumber || p.purchaseNo || 'PO', rx, y + 16, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text('Date: ' + fmtDate(p.invoiceDate || p.createdAt), rx, y + 22, { align: 'right' });
        if (p.purchaseNo && p.invoiceNumber) { doc.text('PO: ' + p.purchaseNo, rx, y + 27, { align: 'right' }); }
        y = 60;
      }

      // ── Supplier Info Box ──
      const suppH = 28;
      doc.setFillColor(248, 250, 252); doc.roundedRect(mx, y, cw / 2 - 4, suppH, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.roundedRect(mx, y, cw / 2 - 4, suppH, 2, 2, 'S');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text('SUPPLIER', mx + 4, y + 5);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
      doc.text(supplier?.name || 'N/A', mx + 4, y + 10.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
      let sy = y + 15;
      if (supplier?.contactPerson) { doc.text(supplier.contactPerson, mx + 4, sy); sy += 3.5; }
      if (supplier?.phone) { doc.text('Ph: ' + supplier.phone, mx + 4, sy); sy += 3.5; }
      if (supplier?.gstNumber) { doc.text('GSTIN: ' + supplier.gstNumber, mx + 4, sy); }

      // ── Payment Info Box ──
      const pxStart = mx + cw / 2 + 4;
      doc.setFillColor(248, 250, 252); doc.roundedRect(pxStart, y, cw / 2 - 4, suppH, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.roundedRect(pxStart, y, cw / 2 - 4, suppH, 2, 2, 'S');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text('PAYMENT DETAILS', pxStart + 4, y + 5);
      const payInfoItems = [
        { label: 'Type', value: p.paymentType === 'PAID' ? 'Paid' : 'Credit' },
        { label: 'Status', value: p.paymentStatus || 'PENDING' },
        ...(p.paymentMethod ? [{ label: 'Method', value: p.paymentMethod }] : []),
        ...(p.dueDate ? [{ label: 'Due Date', value: fmtDate(p.dueDate) }] : []),
        ...(p.transactionId ? [{ label: 'Txn ID', value: p.transactionId }] : []),
      ];
      let py = y + 10.5;
      payInfoItems.slice(0, 4).forEach(pi => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
        doc.text(pi.label + ': ', pxStart + 4, py);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
        doc.text(pi.value, pxStart + 4 + doc.getTextWidth(pi.label + ': '), py);
        py += 4;
      });
      y += suppH + 6;

      // ── Items Table ──
      const tableRows = items.map((it: any, i: number) => [
        String(i + 1),
        (it.item?.name || '-') + (it.item?.category ? '\n' + it.item.category : ''),
        it.item?.hsnCode || '-',
        String(it.quantity) + ' ' + (it.item?.unit || ''),
        rs(it.price),
        it.batchNumber || '-',
        rs(it.quantity * it.price),
      ]);
      autoTable(doc, {
        startY: y,
        head: [['#', 'Item Description', 'HSN', 'Qty', 'Rate', 'Batch', 'Amount']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [14, 137, 143], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold', halign: 'left', cellPadding: { top: 3, bottom: 3, left: 3, right: 3 } },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 24, halign: 'right' }, 5: { cellWidth: 22 }, 6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // ── Summary Box ──
      const sW = 82; const sX = pw - mx - sW;
      const summaryLines: Array<{ label: string; value: string; color?: number[]; bold?: boolean }> = [];
      summaryLines.push({ label: 'Subtotal', value: rs(p.totalAmount || 0) });
      if ((p.discount || 0) > 0) summaryLines.push({ label: 'Discount', value: '- ' + rs(p.discount), color: [239, 68, 68] });
      if ((p.taxAmount || 0) > 0) summaryLines.push({ label: 'Tax (' + (p.taxPercent || 0) + '%)', value: rs(p.taxAmount) });
      const lineH = 6;
      const totalLine = { label: 'Grand Total', value: rs(p.grandTotal || p.totalAmount || 0), bold: true };
      const payLines: Array<{ label: string; value: string; color?: number[] }> = [];
      if ((p.amountPaid || 0) > 0) payLines.push({ label: 'Amount Paid', value: rs(p.amountPaid), color: [16, 185, 129] });
      if (p.paymentStatus !== 'PAID') {
        const bal = (p.grandTotal || p.totalAmount || 0) - (p.amountPaid || 0);
        payLines.push({ label: 'Balance Due', value: rs(bal), color: [239, 68, 68] });
      }
      const boxH = (summaryLines.length * lineH) + lineH + (payLines.length * lineH) + 16;
      doc.setFillColor(248, 250, 252); doc.roundedRect(sX, y, sW, boxH, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.roundedRect(sX, y, sW, boxH, 2, 2, 'S');
      let sY = y + 6;
      summaryLines.forEach(row => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        doc.setTextColor(...(row.color || [71, 85, 105]) as [number, number, number]);
        doc.text(row.label, sX + 4, sY); doc.text(row.value, sX + sW - 4, sY, { align: 'right' }); sY += lineH;
      });
      doc.setDrawColor(14, 137, 143); doc.setLineWidth(0.4); doc.line(sX + 4, sY - 1, sX + sW - 4, sY - 1); sY += 4;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
      doc.text(totalLine.label, sX + 4, sY);
      doc.setTextColor(14, 137, 143); doc.setFontSize(11);
      doc.text(totalLine.value, sX + sW - 4, sY, { align: 'right' }); sY += lineH + 2;
      payLines.forEach(row => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
        doc.setTextColor(...(row.color || [71, 85, 105]) as [number, number, number]);
        doc.text(row.label, sX + 4, sY); doc.text(row.value, sX + sW - 4, sY, { align: 'right' }); sY += lineH;
      });
      y += boxH + 6;

      // ── Payment Status Badge ──
      const statusLabel = p.paymentStatus === 'PAID' ? 'PAID IN FULL' : p.paymentStatus === 'PARTIAL' ? 'PARTIALLY PAID' : 'PAYMENT PENDING';
      const statusBg: [number, number, number] = p.paymentStatus === 'PAID' ? [240, 253, 244] : p.paymentStatus === 'PARTIAL' ? [254, 243, 199] : [254, 242, 242];
      const statusBorder: [number, number, number] = p.paymentStatus === 'PAID' ? [187, 247, 208] : p.paymentStatus === 'PARTIAL' ? [253, 224, 71] : [254, 202, 202];
      const statusText: [number, number, number] = p.paymentStatus === 'PAID' ? [22, 101, 52] : p.paymentStatus === 'PARTIAL' ? [146, 64, 14] : [153, 27, 27];
      doc.setFillColor(...statusBg); doc.setDrawColor(...statusBorder); doc.setLineWidth(0.3);
      doc.roundedRect(mx, y, cw, 12, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...statusText);
      doc.text(statusLabel, mx + cw / 2, y + 7.5, { align: 'center' });
      if (p.paidAt && p.paymentStatus === 'PAID') {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
        doc.text('Paid on: ' + fmtDate(p.paidAt), mx + cw - 4, y + 7.5, { align: 'right' });
      }
      y += 18;

      // ── Notes ──
      if (p.notes) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139);
        doc.text('Notes: ' + p.notes, mx, y); y += 8;
      }

      // ── Signature ──
      const sigY = Math.max(y + 10, ph - (hasLetterhead ? 60 : 50));
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
      doc.line(mx, sigY, mx + 55, sigY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text('Received By', mx, sigY + 5);
      doc.line(pw - mx - 55, sigY, pw - mx, sigY);
      doc.text('Authorized Signatory', pw - mx - 55, sigY + 5);

      // ── Footer ──
      const footerY = sigY + 14;
      if (!hasLetterhead) {
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.15); doc.line(mx, footerY, pw - mx, footerY);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text('Thank you for your business — ' + (hospitalInfo.name || 'Hospital'), pw / 2, footerY + 5, { align: 'center' });
        doc.setFontSize(7); doc.setTextColor(148, 163, 184);
        doc.text('This is a computer-generated purchase invoice.', pw / 2, footerY + 9, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
        doc.text('This is a computer-generated purchase invoice.', pw / 2, footerY + 3, { align: 'center' });
      }

      if (action === 'download') {
        const fileName = `Purchase_Invoice_${(p.invoiceNumber || p.purchaseNo || 'PO').replace(/\s+/g, '-')}_${(supplier?.name || 'Supplier').replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
      } else {
        doc.autoPrint();
        const pdfBlob = doc.output('bloburl');
        window.open(pdfBlob as unknown as string, '_blank');
      }
    } catch (err) { console.error('PDF generation error:', err); alert('Failed to generate PDF. Please try again.'); }
    setDownloading(false);
  };

  const balance = (p.grandTotal || p.totalAmount || 0) - (p.amountPaid || 0);
  const isOverdue = p.paymentStatus !== 'PAID' && p.dueDate && new Date(p.dueDate) < new Date();

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: 780, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={18} color="#0E898F" />
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Purchase Invoice</div>
            <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: p.paymentStatus === "PAID" ? "#dcfce7" : p.paymentStatus === "PARTIAL" ? "#fef3c7" : isOverdue ? "#fee2e2" : "#fef3c7", color: p.paymentStatus === "PAID" ? "#166534" : p.paymentStatus === "PARTIAL" ? "#92400e" : isOverdue ? "#991b1b" : "#92400e" }}>{p.paymentStatus === "PAID" ? "Paid" : p.paymentStatus === "PARTIAL" ? "Partial" : isOverdue ? "Overdue" : "Pending"}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => generatePDF('download')} disabled={downloading} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: downloading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "none", opacity: downloading ? 0.6 : 1 }}>{downloading ? <Loader2 size={14} className="hd-spin" /> : <FileText size={14} />} Download PDF</button>
            <button onClick={() => generatePDF('print')} disabled={downloading} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "none" }}><Printer size={14} /> Print</button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ padding: 24, maxHeight: "80vh", overflowY: "auto" }}>
          <div ref={printRef}>
            {/* Invoice Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #0E898F" }}>
              <div>
                {hospitalInfo.logo && <img src={hospitalInfo.logo} alt="" style={{ maxHeight: 48, marginBottom: 6 }} />}
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0E898F" }}>{hospitalInfo.name || "Hospital"}</div>
                {hospitalInfo.address && <div style={{ fontSize: 11, color: "#64748b" }}>{hospitalInfo.address}</div>}
                {hospitalInfo.phone && <div style={{ fontSize: 11, color: "#64748b" }}>Phone: {hospitalInfo.phone}</div>}
                {hospitalInfo.email && <div style={{ fontSize: 11, color: "#64748b" }}>Email: {hospitalInfo.email}</div>}
                {hospitalInfo.gstNumber && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>GSTIN: {hospitalInfo.gstNumber}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 6, background: "#0E898F", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: ".04em", marginBottom: 6 }}>PURCHASE INVOICE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{p.invoiceNumber || p.purchaseNo}</div>
                {p.invoiceNumber && p.purchaseNo && <div style={{ fontSize: 11, color: "#94a3b8" }}>PO: {p.purchaseNo}</div>}
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Date: {fmtDate(p.invoiceDate || p.createdAt)}</div>
              </div>
            </div>

            {/* Supplier + Payment Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Supplier</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{supplier?.name || "-"}</div>
                {supplier?.contactPerson && <div style={{ fontSize: 11, color: "#64748b" }}>{supplier.contactPerson}</div>}
                {supplier?.phone && <div style={{ fontSize: 11, color: "#64748b" }}>{supplier.phone}</div>}
                {supplier?.email && <div style={{ fontSize: 11, color: "#64748b" }}>{supplier.email}</div>}
                {(supplier?.address1 || supplier?.city) && <div style={{ fontSize: 11, color: "#64748b" }}>{[supplier?.address1, supplier?.city, supplier?.state, supplier?.pincode].filter(Boolean).join(", ")}</div>}
                {supplier?.gstNumber && <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}><strong>GSTIN:</strong> {supplier.gstNumber}</div>}
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Payment Details</div>
                {p.subDepartment && (
                  <div style={{ marginBottom: 8, padding: "6px 10px", background: "#fefce8", borderRadius: 7, border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Dept:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}>{p.subDepartment.name}</span>
                    <span style={{ fontSize: 9, color: "#a16207", background: "#fef08a", padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>{p.subDepartment.type}</span>
                  </div>
                )}
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.8 }}>
                  <div><strong>Type:</strong> {p.paymentType === "PAID" ? "Paid" : "Credit"}</div>
                  <div><strong>Status:</strong> <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: p.paymentStatus === "PAID" ? "#dcfce7" : p.paymentStatus === "PARTIAL" ? "#fef3c7" : "#fee2e2", color: p.paymentStatus === "PAID" ? "#166534" : p.paymentStatus === "PARTIAL" ? "#92400e" : "#991b1b" }}>{p.paymentStatus || "PENDING"}</span></div>
                  {p.paymentMethod && <div><strong>Method:</strong> {p.paymentMethod}</div>}
                  {p.transactionId && <div><strong>Txn ID:</strong> {p.transactionId}</div>}
                  {p.dueDate && <div><strong>Due:</strong> <span style={{ color: isOverdue ? "#ef4444" : "#475569", fontWeight: isOverdue ? 700 : 400 }}>{fmtDate(p.dueDate)}{isOverdue ? " (OVERDUE)" : ""}</span></div>}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 12 }}>
              <thead><tr style={{ background: "#0E898F" }}>
                {["#", "Item Description", "HSN", "Qty", "Rate", "Batch", "Amount"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 10px", textAlign: i >= 3 && i !== 5 ? "right" : "left", fontSize: 11, fontWeight: 700, color: "#fff", borderBottom: "2px solid #0a7175" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {items.map((it: any, idx: number) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9" }}>{idx + 1}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 600 }}>{it.item?.name || "-"}<br /><span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>{it.item?.category}{it.item?.unit ? " · " + it.item.unit : ""}</span></td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 11, color: "#64748b" }}>{it.item?.hsnCode || "-"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>{it.quantity}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>{fmtCur(it.price)}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 11, color: "#64748b" }}>{it.batchNumber || "-"}</td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 600 }}>{fmtCur(it.quantity * it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <div style={{ width: 300, background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#475569" }}><span>Subtotal</span><span style={{ fontWeight: 600 }}>{fmtCur(p.totalAmount)}</span></div>
                {(p.discount || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#ef4444" }}><span>Discount</span><span>-{fmtCur(p.discount)}</span></div>}
                {(p.taxAmount || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#475569" }}><span>Tax ({p.taxPercent}%)</span><span>{fmtCur(p.taxAmount)}</span></div>}
                <div style={{ borderTop: "2px solid #0E898F", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#0E898F" }}><span>Grand Total</span><span>{fmtCur(p.grandTotal || p.totalAmount)}</span></div>
                {(p.amountPaid || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#10b981", fontWeight: 600 }}><span>Amount Paid</span><span>{fmtCur(p.amountPaid)}</span></div>}
                {p.paymentStatus !== "PAID" && balance > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 13, color: "#ef4444", fontWeight: 700 }}><span>Balance Due</span><span>{fmtCur(balance)}</span></div>}
              </div>
            </div>

            {/* Payment Status Bar */}
            <div style={{ padding: "10px 16px", borderRadius: 8, textAlign: "center", fontWeight: 700, fontSize: 13, background: p.paymentStatus === "PAID" ? "#dcfce7" : p.paymentStatus === "PARTIAL" ? "#fef3c7" : "#fee2e2", color: p.paymentStatus === "PAID" ? "#166534" : p.paymentStatus === "PARTIAL" ? "#92400e" : "#991b1b", border: `1px solid ${p.paymentStatus === "PAID" ? "#bbf7d0" : p.paymentStatus === "PARTIAL" ? "#fde047" : "#fecaca"}` }}>
              {p.paymentStatus === "PAID" ? "✓ PAID IN FULL" : p.paymentStatus === "PARTIAL" ? `PARTIALLY PAID — Balance: ${fmtCur(balance)}` : `PAYMENT PENDING — Amount Due: ${fmtCur(balance)}`}
              {p.paidAt && p.paymentStatus === "PAID" && <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 11 }}>on {fmtDate(p.paidAt)}</span>}
            </div>
            {p.notes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 12 }}><strong>Notes:</strong> {p.notes}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Record Payment Modal ───
// ═══════════════════════════════════════════════════
function RecordPaymentModal({ purchase, onClose, onSuccess }: { purchase: any; onClose: () => void; onSuccess: () => void }) {
  const balance = (purchase.grandTotal || purchase.totalAmount || 0) - (purchase.amountPaid || 0);
  const [form, setForm] = useState({
    amount: balance, method: "BANK_TRANSFER", transactionId: "", isFullPayment: true,
    paymentDate: new Date().toISOString().split("T")[0], notes: "", receivedBy: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) return alert("Amount must be > 0");
    if (form.amount > balance) return alert(`Amount cannot exceed balance of ${fmtCur(balance)}`);
    if (!form.paymentDate) return alert("Payment date is required");
    setSaving(true);
    const newPaid = (purchase.amountPaid || 0) + form.amount;
    const total = purchase.grandTotal || purchase.totalAmount || 0;
    const d = await api("/api/inventory/purchase", "PUT", {
      id: purchase.id,
      paymentStatus: newPaid >= total ? "PAID" : "PARTIAL",
      paymentMethod: form.method,
      amountPaid: newPaid,
      transactionId: form.transactionId || undefined,
      paidAt: new Date(form.paymentDate).toISOString(),
      notes: form.notes || undefined,
      receivedBy: form.receivedBy || undefined,
    });
    if (d.success) onSuccess(); else alert(d.message || "Failed");
    setSaving(false);
  };

  return (
    <div className="hd-modal-bg" onClick={onClose}>
      <div className="hd-modal" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: 500, padding: 0, overflow: "hidden" }}>
        {/* Header — teal */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", background: "linear-gradient(135deg, rgba(14,137,143,.08), #E6F4F4)" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#065f64", display: "flex", alignItems: "center", gap: 8 }}><BanknoteIcon size={18} color="#0E898F" /> Record Payment</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{purchase.purchaseNo} — {purchase.supplier?.name || "Unknown Supplier"}</div>
        </div>
        <form onSubmit={submit} style={{ padding: 24 }}>
          {/* Summary row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, padding: "14px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: ".04em" }}>TOTAL</div><div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{fmtCur(purchase.grandTotal || purchase.totalAmount)}</div></div>
            <div style={{ width: 1, background: "#e2e8f0" }} />
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: ".04em" }}>PAID</div><div style={{ fontSize: 17, fontWeight: 700, color: "#0E898F", marginTop: 2 }}>{fmtCur(purchase.amountPaid || 0)}</div></div>
            <div style={{ width: 1, background: "#e2e8f0" }} />
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: ".04em" }}>BALANCE</div><div style={{ fontSize: 17, fontWeight: 700, color: "#ef4444", marginTop: 2 }}>{fmtCur(balance)}</div></div>
          </div>

          {/* Full / Partial toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button type="button" onClick={() => setForm({ ...form, isFullPayment: true, amount: balance })} style={{
              flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
              border: form.isFullPayment ? "2px solid #0E898F" : "1.5px solid #e2e8f0",
              background: form.isFullPayment ? "#E6F4F4" : "#fff",
            }}><div style={{ fontSize: 12, fontWeight: 700, color: form.isFullPayment ? "#065f64" : "#64748b" }}>Full Payment</div><div style={{ fontSize: 11, color: "#0E898F", fontWeight: 600, marginTop: 2 }}>{fmtCur(balance)}</div></button>
            <button type="button" onClick={() => setForm({ ...form, isFullPayment: false, amount: 0 })} style={{
              flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", textAlign: "center",
              border: !form.isFullPayment ? "2px solid #0E898F" : "1.5px solid #e2e8f0",
              background: !form.isFullPayment ? "#E6F4F4" : "#fff",
            }}><div style={{ fontSize: 12, fontWeight: 700, color: !form.isFullPayment ? "#065f64" : "#64748b" }}>Partial Payment</div></button>
          </div>

          {!form.isFullPayment && (
            <div className="hd-mf" style={{ marginBottom: 14 }}><label className="hd-ml">Amount *</label><input className="hd-mi" type="number" value={form.amount} min={1} max={balance} step="0.01" onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} autoFocus /></div>
          )}

          {/* Payment Method + Date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="hd-mf"><label className="hd-ml">Payment Method *</label><select className="hd-mi" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}</select></div>
            <div className="hd-mf"><label className="hd-ml">Payment Date *</label><input className="hd-mi" type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} required /></div>
          </div>

          {/* Transaction ID + Received By row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="hd-mf"><label className="hd-ml">Transaction / Ref ID</label><input className="hd-mi" placeholder="e.g. TXN-12345" value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })} /></div>
            <div className="hd-mf"><label className="hd-ml">Received By</label><input className="hd-mi" placeholder="Name of person" value={form.receivedBy} onChange={e => setForm({ ...form, receivedBy: e.target.value })} /></div>
          </div>

          {/* Notes */}
          <div className="hd-mf" style={{ marginBottom: 16 }}>
            <label className="hd-ml">Payment Notes / Remarks</label>
            <textarea className="hd-mi" rows={2} placeholder="Any additional notes about this payment..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: "vertical", minHeight: 44 }} />
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving || form.amount <= 0} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saving || form.amount <= 0 ? "#94a3b8" : "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {saving ? <Loader2 size={14} className="hd-spin" /> : <><CheckCircle2 size={14} /> Record {fmtCur(form.amount)}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ─── Payment Reminder Popup ───
// ═══════════════════════════════════════════════════
function PaymentReminderPopup({ reminders, onClose, onPay }: { reminders: any[]; onClose: () => void; onPay: (p: any) => void }) {
  const overdueCount = reminders.filter((r: any) => new Date(r.dueDate) < new Date()).length;
  return (
    <div className="hd-modal-bg" style={{ zIndex: 9999 }} onClick={onClose}>
      <div className="hd-modal" onClick={(e: any) => e.stopPropagation()} style={{ maxWidth: 520, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #ef444415, #fee2e2)", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}><Bell size={22} color="#fff" /></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#991b1b" }}>Payment Reminder</div>
            <div style={{ fontSize: 12, color: "#b91c1c" }}>{reminders.length} payment{reminders.length > 1 ? "s" : ""} due {overdueCount > 0 ? `(${overdueCount} overdue!)` : "today"}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, maxHeight: "50vh", overflowY: "auto" }}>
          {reminders.map((r: any) => {
            const isOverdue = new Date(r.dueDate) < new Date();
            const balance = (r.grandTotal || r.totalAmount || 0) - (r.amountPaid || 0);
            return (
              <div key={r.id} style={{ padding: "14px 16px", borderRadius: 12, marginBottom: 10, border: `1.5px solid ${isOverdue ? "#fecaca" : "#b2d8da"}`, background: isOverdue ? "#fff5f5" : "#E6F4F4" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{r.purchaseNo}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{r.supplier?.name || "Unknown"} - {r._count?.items || 0} items</div>
                    <div style={{ fontSize: 11, color: isOverdue ? "#ef4444" : "#0E898F", fontWeight: 600, marginTop: 4 }}>
                      {isOverdue ? `Overdue since ${fmtDate(r.dueDate)}` : `Due: ${fmtDate(r.dueDate)}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{fmtCur(balance)}</div>
                    <button onClick={() => onPay(r)} style={{ marginTop: 6, padding: "6px 16px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "none" }}>Pay Now</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
          <button onClick={onClose} style={{ padding: "10px 32px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "none" }}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
