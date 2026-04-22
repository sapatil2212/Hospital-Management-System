"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Users, RefreshCw, Package, X,
  AlertTriangle, CheckCircle2, Search, IndianRupee,
  Loader2, ShoppingCart,
  ChevronDown, ChevronUp, ChevronsUpDown, Download,
  FileText, FileSpreadsheet, FileType,
  CreditCard, Clock, BanknoteIcon, Receipt, Eye, TrendingUp,
  BarChart3, ArrowUpRight, Activity, Bell, Trash2, Info
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
      <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}><Download size={13}/>Export</button>
      {show&&(<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.1)",zIndex:50,minWidth:170,padding:6}}>
        <button onClick={onPDF} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#fff5f5",color:"#ef4444"}}><FileText size={12}/></span>Export as PDF</button>
        <button onClick={onExcel} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={12}/></span>Export as Excel</button>
        <button onClick={onWord} style={expBtnStyle} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="none")}><span style={{...expIconStyle,background:"#eff6ff",color:"#2563eb"}}><FileType size={12}/></span>Export as Word</button>
      </div>)}
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

const CATEGORIES = ["Medicine","Consumables","Surgical Items","Equipment","Lab Items"];
const CHART_COLORS = ["#0E898F","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#ec4899","#14b8a6"];

type Tab = "overview" | "stock" | "suppliers" | "purchases";

export default function PharmacyInventoryPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const [viewSupplier, setViewSupplier] = useState<any>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState<any>(null);

  // Sort states
  const [stockSort, setStockSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"name",dir:"asc"});
  const [suppSort, setSuppSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"name",dir:"asc"});
  const [purchSort, setPurchSort] = useState<{col:string;dir:"asc"|"desc"}>({col:"createdAt",dir:"desc"});

  // Export dropdown states
  const [showStockExp, setShowStockExp] = useState(false);
  const [showSuppExp, setShowSuppExp] = useState(false);
  const [showPurchExp, setShowPurchExp] = useState(false);

  const genPONo = () => `PO-${Date.now().toString(36).toUpperCase()}`;
  const genInvNo = () => { const d = new Date(); return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; };

  // Purchase form
  const [purchaseForm, setPurchaseForm] = useState<any>({
    supplierId: "", purchaseNo: "", invoiceNumber: "", invoiceDate: new Date().toISOString().split("T")[0],
    notes: "", paymentType: "CREDIT", paymentMethod: "BANK_TRANSFER",
    amountPaid: 0, transactionId: "", dueDate: "", discount: 0, taxPercent: 0,
  });
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poSearch, setPoSearch] = useState("");
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [allInventoryItems, setAllInventoryItems] = useState<any[]>([]);

  // Loaders
  const loadItems = useCallback(async () => {
    setLoading(true);
    const d = await api("/api/pharmacy/dept-stock");
    if (d.success) setItems(d.data?.items || []);
    setLoading(false);
  }, []);

  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [purchaseFormError, setPurchaseFormError] = useState("");

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "",
    unit: "pcs", supplierName: "", purchasePrice: 0, mrp: 0, sellingPrice: 0,
    gst: 0, minStock: 5, openingStock: 0, isActive: true, description: "",
    hsnCode: "", barcode: "",
  });
  const [addItemSaving, setAddItemSaving] = useState(false);
  const [addItemError, setAddItemError] = useState("");

  const [addStockModal, setAddStockModal] = useState<{ item: any } | null>(null);
  const [addStockForm, setAddStockForm] = useState({ quantity: 1, price: 0, batchNumber: "", expiryDate: "" });
  const [addStockSaving, setAddStockSaving] = useState(false);

  const loadSuppliers = useCallback(async () => {
    const d = await api("/api/pharmacy/suppliers");
    if (d.success) setSuppliers(d.data || []);
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try { const d = await api("/api/pharmacy/purchases?limit=100"); if (d.success) setPurchases(d.data?.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);
  useEffect(() => {
    if (tab === "overview") {
      setLoading(true);
      Promise.all([
        api("/api/pharmacy/dept-stock").then(d => { if (d.success) setItems(d.data?.items || []); }),
        api("/api/pharmacy/purchases?limit=100").then(d => { if (d.success) setPurchases(d.data?.data || []); }),
      ]).then(() => setLoading(false));
    } else if (tab === "stock") loadItems();
    else if (tab === "suppliers") { setLoading(false); }
    else if (tab === "purchases") loadPurchases();
  }, [tab, loadItems, loadSuppliers, loadPurchases]);

  // Derived / computed
  const filtered = search ? items.filter((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase())) : items;
  const lowStockItems = items.filter((i: any) => (i.totalStock ?? 0) <= (i.minStock ?? 0) && i.isActive);
  const totalValue = items.reduce((s: number, i: any) => s + ((i.totalStock ?? 0) * (i.purchasePrice ?? 0)), 0);
  const filteredSuppliers = search ? suppliers.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()) || s.contactPerson?.toLowerCase().includes(search.toLowerCase())) : suppliers;
  const pendingPayments = purchases.filter((p: any) => p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL");
  const totalPurchaseValue = purchases.reduce((s: number, p: any) => s + (p.grandTotal || p.totalAmount || 0), 0);

  // Chart data
  const categoryData = CATEGORIES.map(c => ({ name: c, count: items.filter(i => i.category === c).length, value: items.filter(i => i.category === c).reduce((s: number, i: any) => s + ((i.totalStock ?? 0) * (i.purchasePrice ?? 0)), 0) })).filter(c => c.count > 0);
  const stockStatusData = [
    { name: "Healthy", value: items.filter(i => (i.totalStock ?? 0) > (i.minStock ?? 0) && i.isActive).length, color: "#10b981" },
    { name: "Low Stock", value: lowStockItems.length, color: "#ef4444" },
    { name: "Out of Stock", value: items.filter(i => (i.totalStock ?? 0) === 0 && i.isActive).length, color: "#94a3b8" },
    { name: "Inactive", value: items.filter(i => !i.isActive).length, color: "#e2e8f0" },
  ].filter(d => d.value > 0);
  const purchasesByMonth = (() => { const months: any = {}; purchases.forEach((p: any) => { const d = new Date(p.createdAt); const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); if (!months[key]) months[key] = { key, name: label, amount: 0, count: 0 }; months[key].amount += (p.grandTotal || p.totalAmount || 0); months[key].count += 1; }); return Object.values(months).sort((a: any, b: any) => a.key.localeCompare(b.key)).slice(-6); })();

  // PO computed
  const poSubtotal = poItems.reduce((s: number, p: any) => s + (Number(p.quantity) * Number(p.unitPrice)), 0);
  const poDiscountAmt = purchaseForm.discount || 0;
  const poTaxAmt = ((poSubtotal - poDiscountAmt) * (purchaseForm.taxPercent || 0)) / 100;
  const poGrandTotal = poSubtotal - poDiscountAmt + poTaxAmt;
  const poSearchFiltered = poSearch.length > 1
    ? allInventoryItems.filter((i: any) => i.name.toLowerCase().includes(poSearch.toLowerCase()) && !poItems.find((p: any) => p.itemId === i.id))
    : [];
  const poSelectedSupplier = suppliers.find((s: any) => s.id === purchaseForm.supplierId);

  // Purchase modal handlers
  const openPurchaseModal = async () => {
    setPurchaseForm({ supplierId: "", purchaseNo: genPONo(), invoiceNumber: genInvNo(),
      invoiceDate: new Date().toISOString().split("T")[0],
      notes: "", paymentType: "CREDIT", paymentMethod: "BANK_TRANSFER",
      amountPaid: 0, transactionId: "", dueDate: "", discount: 0, taxPercent: 0,
    });
    setPoItems([]); setPoSearch(""); setPurchaseFormError("");
    setShowPurchaseModal(true);
    if (allInventoryItems.length === 0) {
      const d = await api("/api/pharmacy/inventory");
      if (d.success) setAllInventoryItems(d.data || []);
    }
  };
  const addPoItem = (item: any) => {
    if (poItems.find((p: any) => p.itemId === item.id)) return;
    setPoItems((prev: any[]) => [...prev, {
      itemId: item.id, name: item.name, unit: item.unit || "pcs", category: item.category,
      quantity: 1, unitPrice: item.purchasePrice || 0, batchNumber: "", expiryDate: "",
    }]);
    setPoSearch("");
  };
  const removePoItem = (idx: number) => setPoItems((p: any[]) => p.filter((_: any, i: number) => i !== idx));
  const updatePoItem = (idx: number, field: string, val: any) => setPoItems((p: any[]) => p.map((item: any, i: number) => i === idx ? { ...item, [field]: val } : item));
  const addAllLowStockToPo = () => {
    const newItems = lowStockItems.filter((i: any) => !poItems.find((p: any) => p.itemId === i.id))
      .map((item: any) => ({
        itemId: item.id, name: item.name, unit: item.unit || "pcs", category: item.category,
        quantity: Math.max(1, (item.minStock ?? 5) - (item.totalStock ?? 0)),
        unitPrice: item.purchasePrice || 0, batchNumber: "", expiryDate: "",
      }));
    if (newItems.length > 0) setPoItems((prev: any[]) => [...prev, ...newItems]);
  };
  const savePurchase = async () => {
    if (poItems.length === 0) { setPurchaseFormError("items"); return; }
    if (purchaseForm.paymentType === "CREDIT" && !purchaseForm.dueDate) { setPurchaseFormError("dueDate"); return; }
    setPurchaseFormError(""); setPurchaseSaving(true);
    try {
      const res = await api("/api/pharmacy/purchases", "POST", {
        supplierId: purchaseForm.supplierId || undefined,
        purchaseNo: purchaseForm.purchaseNo,
        invoiceNumber: purchaseForm.invoiceNumber || undefined,
        invoiceDate: purchaseForm.invoiceDate || undefined,
        notes: purchaseForm.notes || undefined,
        paymentType: purchaseForm.paymentType,
        paymentMethod: purchaseForm.paymentType === "PAID" ? purchaseForm.paymentMethod : undefined,
        amountPaid: purchaseForm.paymentType === "PAID" ? poGrandTotal : 0,
        transactionId: purchaseForm.paymentType === "PAID" ? (purchaseForm.transactionId || undefined) : undefined,
        dueDate: purchaseForm.paymentType === "CREDIT" ? purchaseForm.dueDate : undefined,
        discount: poDiscountAmt, taxPercent: purchaseForm.taxPercent || 0, grandTotal: poGrandTotal,
        items: poItems.map((p: any) => ({
          itemId: p.itemId, quantity: parseInt(String(p.quantity)) || 1,
          price: parseFloat(String(p.unitPrice)) || 0,
          batchNumber: p.batchNumber || undefined, expiryDate: p.expiryDate || undefined,
        })),
      });
      if (res.success) { setShowPurchaseModal(false); loadPurchases(); loadItems(); }
      else setPurchaseFormError(res.message || "Failed to create purchase order");
    } catch (err: any) { setPurchaseFormError(err.message || "Failed"); }
    setPurchaseSaving(false);
  };

  const TABS: { id: Tab; label: string; icon: any; count?: number; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={15} /> },
    { id: "stock", label: "Items & Stock", icon: <Package size={15} />, count: items.length },
    { id: "suppliers", label: "Suppliers", icon: <Users size={15} />, count: suppliers.length },
    { id: "purchases", label: "Purchases", icon: <Receipt size={15} />, badge: pendingPayments.length },
  ];

  return (
    <div style={{ margin: "-24px -24px 0", height: "calc(100vh - 64px)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Sticky Tab Bar */}
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
              {t.count !== undefined && <span style={{ background: active ? "#B3E0E0" : "#f1f5f9", color: active ? "#065f64" : "#94a3b8", padding: "1px 6px", borderRadius: 20, fontSize: 10, fontWeight: 700, marginLeft: 1 }}>{t.count}</span>}
              {(t.badge ?? 0) > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 800, width: 15, height: 15, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px 20px 20px", flex: 1 }}>
      {loading && <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} className="hd-spin" color="#0E898F" /></div>}

      {/* ═══════════ TAB 0: OVERVIEW ═══════════ */}
      {!loading && tab === "overview" && (<>
        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Items", val: items.length, sub: `${items.filter(i => i.isActive).length} active` },
            { label: "Stock Value", val: fmtCur(totalValue), sub: `${items.filter(i => (i.totalStock ?? 0) > 0).length} in stock` },
            { label: "Low Stock", val: lowStockItems.length, sub: lowStockItems.length > 0 ? "Needs attention" : "All healthy", warn: lowStockItems.length > 0 },
            { label: "Purchases", val: purchases.length, sub: fmtCur(totalPurchaseValue) },
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
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Stock Value by Category</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Distribution of inventory value</div></div>
              <BarChart3 size={18} color="#94a3b8" />
            </div>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                  <Tooltip formatter={(v: any) => fmtCur(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>{categoryData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No items yet</div>}
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Stock Health</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Item status distribution</div>
            {stockStatusData.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <RePieChart><Pie data={stockStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>{stockStatusData.map((d, idx) => <Cell key={idx} fill={d.color} />)}</Pie><Tooltip formatter={(v: any, n: any) => [`${v} items`, n]} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} /></RePieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  {stockStatusData.map((d, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />{d.name}: <strong>{d.value}</strong></div>))}
                </div>
              </div>
            ) : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No data</div>}
          </div>
        </div>

        {/* Purchase Trends */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Purchase Trends</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Monthly spend</div></div>
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

        {/* Bottom Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Low Stock Alerts */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><AlertTriangle size={15} color="#ef4444" /><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Low Stock Alerts</span></div>
            {lowStockItems.length === 0 ? <div style={{ fontSize: 12, color: "#94a3b8", padding: "12px 0" }}>All items are well-stocked</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                {lowStockItems.slice(0, 5).map((it: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#fff5f5", borderRadius: 8, border: "1px solid #fecaca" }}>
                    <div><div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{it.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{it.category}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>{it.totalStock ?? 0}</div><div style={{ fontSize: 9, color: "#94a3b8" }}>min: {it.minStock}</div></div>
                  </div>
                ))}
                {lowStockItems.length > 5 && <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>+{lowStockItems.length - 5} more</div>}
              </div>
            )}
          </div>
          {/* Quick Actions */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "View Stock", icon: <Package size={14} />, color: "#0E898F", bg: "#E6F4F4", action: () => setTab("stock") },
                { label: "View Suppliers", icon: <Users size={14} />, color: "#3b82f6", bg: "#eff6ff", action: () => setTab("suppliers") },
                { label: "New Purchase", icon: <Plus size={14} />, color: "#10b981", bg: "#f0fdf4", action: () => { setTab("purchases"); setTimeout(openPurchaseModal, 100); } },
                { label: "View Purchases", icon: <Receipt size={14} />, color: "#8b5cf6", bg: "#f5f3ff", action: () => setTab("purchases") },
              ].map((a, i) => (
                <button key={i} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", width: "100%", textAlign: "left" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 }}>{a.icon}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Payment Summary */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "18px 22px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><IndianRupee size={15} color="#0E898F" /><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Payment Summary</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}><span style={{ fontSize: 12, color: "#64748b" }}>Total Purchases</span><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fmtCur(totalPurchaseValue)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}><span style={{ fontSize: 12, color: "#64748b" }}>Amount Paid</span><span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{fmtCur(purchases.reduce((s: number, p: any) => s + (p.amountPaid || 0), 0))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}><span style={{ fontSize: 12, color: "#64748b" }}>Pending</span><span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{fmtCur(purchases.reduce((s: number, p: any) => s + ((p.grandTotal || p.totalAmount || 0) - (p.amountPaid || 0)), 0))}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><span style={{ fontSize: 12, color: "#64748b" }}>Fully Paid</span><span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{purchases.filter((p: any) => p.paymentStatus === "PAID").length} / {purchases.length}</span></div>
            </div>
          </div>
        </div>
      </>)}

      {/* ═══════════ TAB 1: ITEMS & STOCK ═══════════ */}
      {!loading && tab === "stock" && (<>
        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Total Items", val: items.length, color: "#0E898F" },
            { label: "Active Items", val: items.filter(i => i.isActive).length, color: "#10b981" },
            { label: "Low Stock", val: lowStockItems.length, color: "#ef4444" },
            { label: "Inventory Value", val: fmtCur(totalValue), color: "#8b5cf6" },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.val}</div>
            </div>
          ))}
        </div>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 200 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items or category…" style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X size={13} /></button>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={loadItems} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={12} /> Refresh</button>
            <ExportMenu show={showStockExp} onToggle={() => setShowStockExp(!showStockExp)}
              onPDF={() => { setShowStockExp(false); const doc = new jsPDF(); doc.text("Inventory Items", 14, 16); autoTable(doc, { startY: 22, head: [["Name","Category","Stock","Min","MRP","Status"]], body: filtered.map((i: any) => [i.name, i.category, `${i.totalStock??0} ${i.unit||""}`, i.minStock, `₹${(i.mrp||0).toFixed(2)}`, (i.totalStock??0)<=i.minStock?"Low":"OK"]), styles: { fontSize: 8 } }); doc.save(`inventory-items-${new Date().toISOString().slice(0,10)}.pdf`); }}
              onExcel={() => { setShowStockExp(false); const ws = XLSX.utils.json_to_sheet(filtered.map((i: any) => ({ Name: i.name, Category: i.category, Stock: i.totalStock??0, Unit: i.unit, MinStock: i.minStock, MRP: i.mrp, PurchasePrice: i.purchasePrice, Status: (i.totalStock??0)<=i.minStock?"Low":"OK" }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Items"); XLSX.writeFile(wb, `inventory-items-${new Date().toISOString().slice(0,10)}.xlsx`); }}
              onWord={() => { setShowStockExp(false); buildWordDoc("Inventory Items", ["Name","Category","Stock","Min","MRP","Status"], filtered.map((i: any) => [i.name, i.category||"", `${i.totalStock??0} ${i.unit||""}`, String(i.minStock??0), `₹${(i.mrp||0).toFixed(2)}`, (i.totalStock??0)<=i.minStock?"Low":"OK"])); }}
            />
            <button onClick={() => { setAddItemForm({ name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "", unit: "pcs", supplierName: "", purchasePrice: 0, mrp: 0, sellingPrice: 0, gst: 0, minStock: 5, openingStock: 0, isActive: true, description: "", hsnCode: "", barcode: "" }); setAddItemError(""); setShowAddItemModal(true); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}><Plus size={12} /> Add Item</button>
          </div>
        </div>
        {/* Table */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {mkTh("Name","name",stockSort,c=>setStockSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Category","category",stockSort,c=>setStockSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Stock","totalStock",stockSort,c=>setStockSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"center"})}
              {mkTh("Min","minStock",stockSort,c=>setStockSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"center"})}
              {mkTh("MRP","mrp",stockSort,c=>setStockSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"right"})}
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "center" }}>Status</th>
              <th style={{ width: 36 }} />
            </tr></thead>
            <tbody>
              {sortData(filtered, stockSort).map((item: any, idx: number) => {
                const isLow = (item.totalStock ?? 0) <= (item.minStock ?? 0);
                return (<>
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "10px 14px" }}><div style={{ fontWeight: 600, color: "#1e293b" }}>{item.name}</div>{item.genericName && <div style={{ fontSize: 10, color: "#94a3b8" }}>{item.genericName}</div>}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ padding: "2px 8px", borderRadius: 5, background: "#E6F4F4", color: "#0E898F", fontSize: 10, fontWeight: 600 }}>{item.category}</span></td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ fontWeight: 700, color: isLow ? "#ef4444" : "#10b981" }}>{item.totalStock ?? 0} {item.unit || ""}</div>
                      {((item.transferredStock ?? 0) > 0 || (item.purchasedStock ?? 0) > 0) && (
                        <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 2, flexWrap: "wrap" }}>
                          {(item.transferredStock ?? 0) > 0 && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3, background: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }}>T:{item.transferredStock}</span>}
                          {(item.purchasedStock ?? 0) > 0 && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3, background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>P:{item.purchasedStock}</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#64748b" }}>{item.minStock}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600 }}>{fmtCur(item.mrp || 0)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: isLow ? "#fef2f2" : "#f0fdf4", color: isLow ? "#ef4444" : "#10b981" }}>{isLow ? "Low Stock" : "In Stock"}</span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <button onClick={() => { setAddStockForm({ quantity: 1, price: item.purchasePrice || 0, batchNumber: "", expiryDate: "" }); setAddStockModal({ item }); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 9px", borderRadius: 6, border: "none", background: "#E6F4F4", color: "#0E898F", fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }} title="Add stock batch">
                        <Plus size={11} /> Stock
                      </button>
                    </td>
                  </tr>
                  {item.batches?.length > 0 && (
                    <tr key={`${item.id}-b`} style={{ display: "none" }}><td colSpan={7} /></tr>
                  )}
                </>);
              })}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No items found</td></tr>}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ═══════════ TAB 2: SUPPLIERS (READ-ONLY) ═══════════ */}
      {!loading && tab === "suppliers" && (<>
        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Total Suppliers", val: suppliers.length, color: "#0E898F" },
            { label: "Active", val: suppliers.filter((s: any) => s.isActive !== false).length, color: "#10b981" },
            { label: "With GST", val: suppliers.filter((s: any) => s.gstNumber).length, color: "#8b5cf6" },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.val}</div>
            </div>
          ))}
        </div>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…" style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X size={13} /></button>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={loadSuppliers} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={12} /> Refresh</button>
            <ExportMenu show={showSuppExp} onToggle={() => setShowSuppExp(!showSuppExp)}
              onPDF={() => { setShowSuppExp(false); const doc = new jsPDF(); doc.text("Suppliers", 14, 16); autoTable(doc, { startY: 22, head: [["Name","Contact","Phone","Email","GST"]], body: filteredSuppliers.map((s: any) => [s.name, s.contactPerson||"", s.phone||"", s.email||"", s.gstNumber||""]), styles: { fontSize: 8 } }); doc.save(`suppliers-${new Date().toISOString().slice(0,10)}.pdf`); }}
              onExcel={() => { setShowSuppExp(false); const ws = XLSX.utils.json_to_sheet(filteredSuppliers.map((s: any) => ({ Name: s.name, Contact: s.contactPerson, Phone: s.phone, Email: s.email, GST: s.gstNumber, City: s.city, State: s.state }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Suppliers"); XLSX.writeFile(wb, `suppliers-${new Date().toISOString().slice(0,10)}.xlsx`); }}
              onWord={() => { setShowSuppExp(false); buildWordDoc("Suppliers", ["Name","Contact","Phone","Email","GST"], filteredSuppliers.map((s: any) => [s.name||"", s.contactPerson||"", s.phone||"", s.email||"", s.gstNumber||""])); }}
            />
          </div>
        </div>
        {/* Table */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {mkTh("Name","name",suppSort,c=>setSuppSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Contact","contactPerson",suppSort,c=>setSuppSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Phone","phone",suppSort,c=>setSuppSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Email","email",suppSort,c=>setSuppSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "left" }}>GST</th>
              <th style={{ width: 60, padding: "10px 14px" }} />
            </tr></thead>
            <tbody>
              {sortData(filteredSuppliers, suppSort).map((s: any, idx: number) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>{s.name}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{s.contactPerson || "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{s.phone || "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{s.email || "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{s.gstNumber || "—"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <button onClick={() => setViewSupplier(s)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#0E898F", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><Eye size={12} /> View</button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No suppliers found</td></tr>}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ═══════════ TAB 3: PURCHASES ═══════════ */}
      {!loading && tab === "purchases" && (<>
        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Total Orders", val: purchases.length, color: "#0E898F" },
            { label: "Total Value", val: fmtCur(totalPurchaseValue), color: "#8b5cf6" },
            { label: "Pending Payment", val: pendingPayments.length, color: "#f59e0b" },
            { label: "Amount Paid", val: fmtCur(purchases.reduce((s: number, p: any) => s + (p.amountPaid || 0), 0)), color: "#10b981" },
          ].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.val}</div>
            </div>
          ))}
        </div>
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 200 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search purchases…" style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X size={13} /></button>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={loadPurchases} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={12} /> Refresh</button>
            <button onClick={openPurchaseModal} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Plus size={12} /> New Purchase</button>
            <ExportMenu show={showPurchExp} onToggle={() => setShowPurchExp(!showPurchExp)}
              onPDF={() => { setShowPurchExp(false); const doc = new jsPDF(); doc.text("Purchase Orders", 14, 16); autoTable(doc, { startY: 22, head: [["PO#","Supplier","Items","Total","Payment","Status","Date"]], body: purchases.map((p: any) => [p.purchaseNo, p.supplier?.name||"", p.items?.length||0, fmtCur(p.grandTotal||p.totalAmount||0), p.paymentStatus, p.status, fmtDate(p.createdAt)]), styles: { fontSize: 8 } }); doc.save(`purchases-${new Date().toISOString().slice(0,10)}.pdf`); }}
              onExcel={() => { setShowPurchExp(false); const ws = XLSX.utils.json_to_sheet(purchases.map((p: any) => ({ PO: p.purchaseNo, Supplier: p.supplier?.name, Items: p.items?.length||0, Total: p.grandTotal||p.totalAmount||0, Paid: p.amountPaid||0, PaymentStatus: p.paymentStatus, Status: p.status, Date: fmtDate(p.createdAt) }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Purchases"); XLSX.writeFile(wb, `purchases-${new Date().toISOString().slice(0,10)}.xlsx`); }}
              onWord={() => { setShowPurchExp(false); buildWordDoc("Purchase Orders", ["PO#","Supplier","Total","Payment","Status","Date"], purchases.map((p: any) => [p.purchaseNo||"", p.supplier?.name||"", fmtCur(p.grandTotal||p.totalAmount||0), p.paymentStatus||"", p.status||"", fmtDate(p.createdAt)])); }}
            />
          </div>
        </div>
        {/* Table */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {mkTh("PO #","purchaseNo",purchSort,c=>setPurchSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              {mkTh("Supplier","supplier.name",purchSort,c=>setPurchSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "center" }}>Items</th>
              {mkTh("Total","grandTotal",purchSort,c=>setPurchSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"right"})}
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "center" }}>Payment</th>
              <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "center" }}>Status</th>
              {mkTh("Date","createdAt",purchSort,c=>setPurchSort(p=>({col:c,dir:p.col===c&&p.dir==="asc"?"desc":"asc"})),{padding:"10px 14px",textAlign:"left"})}
              <th style={{ width: 60, padding: "10px 14px" }} />
            </tr></thead>
            <tbody>
              {(() => { const searchedPurch = search ? purchases.filter((p: any) => p.purchaseNo?.toLowerCase().includes(search.toLowerCase()) || p.supplier?.name?.toLowerCase().includes(search.toLowerCase())) : purchases; return sortData(searchedPurch, purchSort).map((po: any, idx: number) => {
                const payColor = po.paymentStatus === "PAID" ? "#10b981" : po.paymentStatus === "PARTIAL" ? "#f59e0b" : "#ef4444";
                const stColor = po.status === "COMPLETED" ? "#10b981" : po.status === "CANCELLED" ? "#ef4444" : "#3b82f6";
                return (
                  <tr key={po.id} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>{po.purchaseNo}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{po.supplier?.name || "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{po.items?.length || po._count?.items || 0}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600 }}>{fmtCur(po.grandTotal || po.totalAmount || 0)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}><span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: `${payColor}15`, color: payColor }}>{po.paymentStatus || "PENDING"}</span></td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}><span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: `${stColor}15`, color: stColor }}>{po.status}</span></td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 11 }}>{fmtDate(po.createdAt)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center" }}>
                        <button onClick={() => setViewInvoice(po)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }} title="View Invoice">
                          <Eye size={14} />
                        </button>
                        {po.status !== "COMPLETED" && po.status !== "CANCELLED" && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Mark PO ${po.purchaseNo} as received? This will add stock to inventory.`)) return;
                              setReceivingId(po.id);
                              const res = await api("/api/pharmacy/purchases", "PATCH", { id: po.id, status: "COMPLETED" });
                              setReceivingId(null);
                              if (res.success) { loadPurchases(); loadItems(); }
                              else alert(res.message || "Failed to mark as received");
                            }}
                            disabled={receivingId === po.id}
                            style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 5, border: "none", background: receivingId === po.id ? "#e2e8f0" : "#f0fdf4", color: receivingId === po.id ? "#94a3b8" : "#16a34a", fontSize: 10, fontWeight: 600, cursor: receivingId === po.id ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                            title="Mark as Received — adds stock to inventory"
                          >
                            {receivingId === po.id ? <Loader2 size={11} className="hd-spin" /> : <CheckCircle2 size={11} />}
                            {receivingId === po.id ? "…" : "Receive"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }); })()}
              {purchases.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No purchase orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </>)}

      </div>{/* end padding wrapper */}

      {/* ═══════════ MODALS ═══════════ */}

      {/* Purchase Order Modal */}
      {showPurchaseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPurchaseModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "95%", maxWidth: 860, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#10b98115,#f0fdf4)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}><ShoppingCart size={18} /> Restock / Purchase Order</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Add multiple items from a supplier in one go</div>
              </div>
              <button onClick={() => setShowPurchaseModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {/* Supplier + PO + Invoice Date */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Supplier</label>
                  <select value={purchaseForm.supplierId} onChange={e => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none", fontWeight: purchaseForm.supplierId ? 600 : 400 }}>
                    <option value="">Select supplier (optional)</option>
                    {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` — ${s.city}` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>PO Number</label>
                  <input value={purchaseForm.purchaseNo} onChange={e => setPurchaseForm({ ...purchaseForm, purchaseNo: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Invoice Date</label>
                  <input type="date" value={purchaseForm.invoiceDate} onChange={e => setPurchaseForm({ ...purchaseForm, invoiceDate: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
              </div>

              {/* Supplier Info Card */}
              {poSelectedSupplier && (
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", gap: 20, fontSize: 11, color: "#475569", border: "1px solid #dcfce7", flexWrap: "wrap" }}>
                  <span><strong>Contact:</strong> {poSelectedSupplier.contactPerson || "-"}</span>
                  <span><strong>Phone:</strong> {poSelectedSupplier.phone || "-"}</span>
                  {poSelectedSupplier.gstNumber && <span><strong>GST:</strong> {poSelectedSupplier.gstNumber}</span>}
                </div>
              )}

              {/* Invoice Number */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Invoice No.</label>
                <input value={purchaseForm.invoiceNumber} onChange={e => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>

              {/* Item Search */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>Add Items to Purchase</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px" }}>
                      <Search size={14} color="#94a3b8" />
                      <input style={{ border: "none", background: "none", outline: "none", fontSize: 13, width: "100%", color: "#1e293b" }} placeholder="Type item name to search and add…" value={poSearch} onChange={e => setPoSearch(e.target.value)} />
                      {poSearch && <button onClick={() => setPoSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X size={13} /></button>}
                    </div>
                    {poSearchFiltered.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, marginTop: 4, boxShadow: "0 10px 25px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                        {poSearchFiltered.slice(0, 15).map((it: any) => (
                          <div key={it.id} onClick={() => addPoItem(it)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between" }}
                            onMouseEnter={(e: any) => e.currentTarget.style.background = "#f0fdf4"} onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
                            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{it.category} · {it.unit}</div></div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>₹{it.purchasePrice || 0}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {lowStockItems.length > 0 && (
                    <button type="button" onClick={addAllLowStockToPo} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#fff5f5", color: "#ef4444", border: "1.5px solid #fecaca", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertTriangle size={12} /> Add {lowStockItems.filter((i: any) => !poItems.find((p: any) => p.itemId === i.id)).length} Low Stock
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              {poItems.length > 0 ? (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#64748b" }}>Item</th>
                      <th style={{ width: 55, padding: "8px 6px", textAlign: "center", fontWeight: 700, fontSize: 11, color: "#64748b" }}>Qty</th>
                      <th style={{ width: 80, padding: "8px 6px", textAlign: "center", fontWeight: 700, fontSize: 11, color: "#64748b" }}>Rate (₹)</th>
                      <th style={{ width: 90, padding: "8px 6px", textAlign: "center", fontWeight: 700, fontSize: 11, color: "#64748b" }}>Batch</th>
                      <th style={{ width: 105, padding: "8px 6px", textAlign: "center", fontWeight: 700, fontSize: 11, color: "#64748b" }}>Expiry</th>
                      <th style={{ width: 75, padding: "8px 6px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#64748b" }}>Amount</th>
                      <th style={{ width: 30 }}></th>
                    </tr></thead>
                    <tbody>
                      {poItems.map((p: any, i: number) => (
                        <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px" }}><div style={{ fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{p.category}</div></td>
                          <td style={{ padding: "6px" }}><input type="number" value={p.quantity} min={1} onChange={e => updatePoItem(i, "quantity", parseInt(e.target.value) || 0)} style={{ width: 50, padding: "5px 6px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, textAlign: "center", fontWeight: 700, outline: "none" }} /></td>
                          <td style={{ padding: "6px" }}><input type="number" value={p.unitPrice} min={0} step="0.01" onChange={e => updatePoItem(i, "unitPrice", parseFloat(e.target.value) || 0)} style={{ width: 74, padding: "5px 6px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, textAlign: "center", outline: "none" }} /></td>
                          <td style={{ padding: "6px" }}><input value={p.batchNumber} onChange={e => updatePoItem(i, "batchNumber", e.target.value)} placeholder="Batch" style={{ width: 84, padding: "5px 6px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, outline: "none" }} /></td>
                          <td style={{ padding: "6px" }}><input type="date" value={p.expiryDate} onChange={e => updatePoItem(i, "expiryDate", e.target.value)} style={{ width: 99, padding: "4px 4px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, outline: "none" }} /></td>
                          <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700, color: "#166534" }}>{fmtCur(p.quantity * p.unitPrice)}</td>
                          <td style={{ padding: "6px" }}><button type="button" onClick={() => removePoItem(i)} style={{ color: "#ef4444", background: "#fee2e2", border: "none", cursor: "pointer", width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={11} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: 28, textAlign: "center", color: "#94a3b8", fontSize: 12, background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0", marginBottom: 14 }}>
                  Search items above to add them to this purchase order
                </div>
              )}
              {purchaseFormError === "items" && <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>⚠ Please add at least one item</div>}

              {/* Billing Summary */}
              {poItems.length > 0 && (<>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Discount (flat ₹)</label>
                    <input type="number" value={purchaseForm.discount} min={0} onChange={e => setPurchaseForm({ ...purchaseForm, discount: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Tax %</label>
                    <input type="number" value={purchaseForm.taxPercent} min={0} onChange={e => setPurchaseForm({ ...purchaseForm, taxPercent: parseFloat(e.target.value) || 0 })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                  </div>
                  <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "8px 14px", border: "1px solid #dcfce7", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>GRAND TOTAL</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>{fmtCur(poGrandTotal)}</div>
                    {(poDiscountAmt > 0 || poTaxAmt > 0) && <div style={{ fontSize: 10, color: "#94a3b8" }}>Sub: {fmtCur(poSubtotal)}{poDiscountAmt > 0 ? ` − Disc: ${fmtCur(poDiscountAmt)}` : ""}{poTaxAmt > 0 ? ` + Tax: ${fmtCur(poTaxAmt)}` : ""}</div>}
                  </div>
                </div>

                {/* Payment Section */}
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><CreditCard size={15} /> Payment</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {(["CREDIT", "PAID"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setPurchaseForm({ ...purchaseForm, paymentType: t })} style={{
                        flex: 1, padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                        border: purchaseForm.paymentType === t ? `2px solid ${t === "PAID" ? "#10b981" : "#f59e0b"}` : "1.5px solid #e2e8f0",
                        background: purchaseForm.paymentType === t ? (t === "PAID" ? "#f0fdf4" : "#fffbeb") : "#fff",
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: purchaseForm.paymentType === t ? (t === "PAID" ? "#166534" : "#92400e") : "#64748b" }}>
                          {t === "CREDIT" ? "Credit (Pay Later)" : "Pay Now"}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                          {t === "CREDIT" ? "Set due date — get reminder" : "Record payment immediately"}
                        </div>
                      </button>
                    ))}
                  </div>

                  {purchaseForm.paymentType === "PAID" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Payment Method *</label>
                        <select value={purchaseForm.paymentMethod} onChange={e => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}>
                          {["CASH","BANK_TRANSFER","UPI","CHEQUE","CARD"].map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Transaction / Ref ID</label>
                        <input value={purchaseForm.transactionId} onChange={e => setPurchaseForm({ ...purchaseForm, transactionId: e.target.value })} placeholder="Optional reference" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                      </div>
                    </div>
                  )}

                  {purchaseForm.paymentType === "CREDIT" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Payment Due Date *</label>
                        <input type="date" value={purchaseForm.dueDate} min={new Date().toISOString().split("T")[0]}
                          onChange={e => { setPurchaseForm({ ...purchaseForm, dueDate: e.target.value }); setPurchaseFormError(""); }}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${purchaseFormError === "dueDate" ? "#ef4444" : "#e2e8f0"}`, fontSize: 12, outline: "none", background: purchaseFormError === "dueDate" ? "#fef2f2" : undefined }} />
                        {purchaseFormError === "dueDate" && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>⚠ Payment due date is required</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fef3c7" }}>
                        <Bell size={14} color="#f59e0b" />
                        <div style={{ fontSize: 11, color: "#92400e" }}><strong>Reminder</strong> will appear on the due date as a notification</div>
                      </div>
                    </div>
                  )}
                </div>
              </>)}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Remarks</label>
                <input value={purchaseForm.notes} onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} placeholder="Purchase notes..." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>{poItems.length > 0 ? `${poItems.length} item(s) · Grand Total: ` : ""}{poItems.length > 0 ? <strong style={{ color: "#166534" }}>{fmtCur(poGrandTotal)}</strong> : ""}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowPurchaseModal(false)} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={savePurchase} disabled={purchaseSaving || poItems.length === 0} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: purchaseSaving || poItems.length === 0 ? "#94a3b8" : "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, cursor: purchaseSaving || poItems.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {purchaseSaving ? <><Loader2 size={14} className="hd-spin" /> Creating…</> : <><CheckCircle2 size={14} /> Record Purchase & Update Stock</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier View Modal */}
      {viewSupplier && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setViewSupplier(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "90%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Supplier Details</div>
              <button onClick={() => setViewSupplier(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22 }}>
              {[
                { label: "Name", value: viewSupplier.name },
                { label: "Email", value: viewSupplier.email },
                { label: "Phone", value: viewSupplier.phone },
                { label: "GST Number", value: viewSupplier.gstNumber },
                { label: "Contact Person", value: viewSupplier.contactPerson },
                { label: "Address", value: [viewSupplier.address1, viewSupplier.city, viewSupplier.state, viewSupplier.pincode].filter(Boolean).join(", ") },
              ].filter(f => f.value).map((field, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</div>
                  <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{field.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      {viewInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setViewInvoice(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "92%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Purchase Invoice</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{viewInvoice.purchaseNo}</div></div>
              <button onClick={() => setViewInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                {[
                  { label: "Supplier", value: viewInvoice.supplier?.name },
                  { label: "Date", value: fmtDate(viewInvoice.createdAt) },
                  { label: "Status", value: viewInvoice.status },
                  { label: "Payment", value: viewInvoice.paymentStatus },
                ].map((f, i) => (
                  <div key={i}><div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 }}>{f.label}</div><div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{f.value || "—"}</div></div>
                ))}
              </div>
              {viewInvoice.items?.length > 0 && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#64748b" }}>Item</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#64748b" }}>Qty</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#64748b" }}>Price</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#64748b" }}>Total</th>
                    </tr></thead>
                    <tbody>
                      {viewInvoice.items.map((it: any, i: number) => (
                        <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 500 }}>{it.item?.name || it.itemId}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>{it.quantity}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmtCur(it.price)}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{fmtCur(it.quantity * it.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Grand Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#0E898F" }}>{fmtCur(viewInvoice.grandTotal || viewInvoice.totalAmount || 0)}</span>
              </div>
              {viewInvoice.amountPaid > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Amount Paid</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{fmtCur(viewInvoice.amountPaid)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Add New Item Modal ─── */}
      {showAddItemModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !addItemSaving) setShowAddItemModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, border: "1px solid #e2e8f0", boxShadow: "0 20px 60px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Plus size={18} color="#0E898F" />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Add New Item</span>
              </div>
              <button onClick={() => setShowAddItemModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>

            {/* Form Body */}
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              {/* Item Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Item Name *</label>
                <input value={addItemForm.name} onChange={e => setAddItemForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Paracetamol 500mg" autoFocus
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${addItemError ? "#ef4444" : "#e2e8f0"}`, fontSize: 12, outline: "none" }} />
                {addItemError && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>⚠ {addItemError}</div>}
              </div>

              {/* Generic + Brand */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Generic Name</label>
                  <input value={addItemForm.genericName} onChange={e => setAddItemForm(p => ({ ...p, genericName: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Brand Name</label>
                  <input value={addItemForm.brandName} onChange={e => setAddItemForm(p => ({ ...p, brandName: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
              </div>

              {/* Category + Sub-Category + Unit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Category *</label>
                  <select value={addItemForm.category} onChange={e => setAddItemForm(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}>
                    {["Medicine","Consumables","Surgical Items","Equipment","Lab Items"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Sub Category</label>
                  <input value={addItemForm.subCategory} onChange={e => setAddItemForm(p => ({ ...p, subCategory: e.target.value }))} placeholder="Optional" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Unit *</label>
                  <select value={addItemForm.unit} onChange={e => setAddItemForm(p => ({ ...p, unit: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}>
                    {["pcs","strip","box","bottle","vial","ampoule","tube","kg","gm","ml","ltr","set","pair","roll"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Preferred Supplier */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Preferred Supplier</label>
                <select value={addItemForm.supplierName} onChange={e => setAddItemForm(p => ({ ...p, supplierName: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.name}>{s.name}{s.city ? ` (${s.city})` : ""}</option>)}
                </select>
              </div>

              {/* Pricing */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Purchase Price</label>
                  <input type="number" value={addItemForm.purchasePrice} onChange={e => setAddItemForm(p => ({ ...p, purchasePrice: Number(e.target.value) }))} min="0" step="0.01" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>MRP</label>
                  <input type="number" value={addItemForm.mrp} onChange={e => setAddItemForm(p => ({ ...p, mrp: Number(e.target.value) }))} min="0" step="0.01" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Selling Price</label>
                  <input type="number" value={addItemForm.sellingPrice} onChange={e => setAddItemForm(p => ({ ...p, sellingPrice: Number(e.target.value) }))} min="0" step="0.01" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>GST %</label>
                  <input type="number" value={addItemForm.gst} onChange={e => setAddItemForm(p => ({ ...p, gst: Number(e.target.value) }))} min="0" step="0.01" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
              </div>

              {/* Stock + Min + HSN + Barcode */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Opening Stock</label>
                  <input type="number" value={addItemForm.openingStock} onChange={e => setAddItemForm(p => ({ ...p, openingStock: Number(e.target.value) }))} min="0" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Min Stock Alert</label>
                  <input type="number" value={addItemForm.minStock} onChange={e => setAddItemForm(p => ({ ...p, minStock: Number(e.target.value) }))} min="0" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>HSN Code</label>
                  <input value={addItemForm.hsnCode} onChange={e => setAddItemForm(p => ({ ...p, hsnCode: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
              </div>

              {/* Barcode */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Barcode</label>
                <input value={addItemForm.barcode} onChange={e => setAddItemForm(p => ({ ...p, barcode: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Description</label>
                <textarea value={addItemForm.description} onChange={e => setAddItemForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                <input type="checkbox" checked={addItemForm.isActive} onChange={e => setAddItemForm(p => ({ ...p, isActive: e.target.checked }))} />
                Active
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAddItemModal(false)} disabled={addItemSaving} style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={async () => {
                  if (!addItemForm.name.trim()) { setAddItemError("Item name is required"); return; }
                  setAddItemError(""); setAddItemSaving(true);
                  const res = await api("/api/pharmacy/inventory", "POST", {
                    name: addItemForm.name, genericName: addItemForm.genericName || undefined,
                    brandName: addItemForm.brandName || undefined, category: addItemForm.category,
                    subCategory: addItemForm.subCategory || undefined, unit: addItemForm.unit,
                    supplierName: addItemForm.supplierName || undefined,
                    purchasePrice: addItemForm.purchasePrice, mrp: addItemForm.mrp,
                    sellingPrice: addItemForm.sellingPrice, gst: addItemForm.gst,
                    minStock: addItemForm.minStock, openingStock: addItemForm.openingStock,
                    isActive: addItemForm.isActive,
                    description: addItemForm.description || undefined,
                    hsnCode: addItemForm.hsnCode || undefined, barcode: addItemForm.barcode || undefined,
                  });
                  setAddItemSaving(false);
                  if (res.success) { setShowAddItemModal(false); loadItems(); setAllInventoryItems([]); }
                  else setAddItemError(res.message || "Failed to create item");
                }} disabled={addItemSaving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: addItemSaving ? "#94a3b8" : "#0E898F", color: "#fff", fontSize: 13, fontWeight: 600, cursor: addItemSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {addItemSaving ? <><Loader2 size={14} className="hd-spin" /> Saving…</> : <><Plus size={14} /> Add Item</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Stock Modal ─── */}
      {addStockModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !addStockSaving) setAddStockModal(null); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 420, border: "1px solid #e2e8f0", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Add Stock</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{addStockModal.item.name}</div>
              </div>
              <button onClick={() => setAddStockModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={16} /></button>
            </div>
            <div style={{ padding: "18px 22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Quantity *</label>
                  <input type="number" value={addStockForm.quantity} onChange={e => setAddStockForm(p => ({ ...p, quantity: Number(e.target.value) }))} min="1" style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Purchase Price (₹)</label>
                  <input type="number" value={addStockForm.price} onChange={e => setAddStockForm(p => ({ ...p, price: Number(e.target.value) }))} min="0" step="0.01" style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Batch No.</label>
                  <input value={addStockForm.batchNumber} onChange={e => setAddStockForm(p => ({ ...p, batchNumber: e.target.value }))} placeholder="Optional" style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Expiry Date</label>
                  <input type="date" value={addStockForm.expiryDate} onChange={e => setAddStockForm(p => ({ ...p, expiryDate: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 22px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setAddStockModal(null)} disabled={addStockSaving} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={async () => {
                if (!addStockForm.quantity || addStockForm.quantity <= 0) return alert("Quantity must be > 0");
                setAddStockSaving(true);
                const res = await api("/api/pharmacy/stock", "POST", { itemId: addStockModal.item.id, quantity: addStockForm.quantity, price: addStockForm.price, batchNumber: addStockForm.batchNumber || undefined, expiryDate: addStockForm.expiryDate || undefined });
                setAddStockSaving(false);
                if (res.success) { setAddStockModal(null); loadItems(); }
                else alert(res.message || "Failed to add stock");
              }} disabled={addStockSaving} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: addStockSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: addStockSaving ? 0.7 : 1 }}>
                {addStockSaving ? <Loader2 size={13} className="hd-spin" /> : <Plus size={13} />}
                {addStockSaving ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
