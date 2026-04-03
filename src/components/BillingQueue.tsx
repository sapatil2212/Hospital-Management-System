"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search, RefreshCw, Loader2, CreditCard,
  Receipt, CheckCircle2, Clock, Building2, Eye, X, Plus, Trash2,
  Printer, Phone, Mail, MapPin, IndianRupee, ChevronRight,
  Stethoscope, CheckCircle, Tag, PercentIcon, Download,
  Banknote, Smartphone, ShieldCheck, Settings2
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
  gstNumber?: string;
  registrationNo?: string;
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
const EMPTY_COLLECT = {
  isGst: false, cgst: 9, sgst: 9, igst: 0, discount: 0, discountRemark: "",
  newChargeName: "", newChargeQty: 1, newChargeRate: 0,
  addedCharges: [] as Array<{name: string; quantity: number; unitPrice: number; amount: number}>,
  method: "CASH", amount: "", transactionId: "", notes: ""
};

export default function BillingQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "collect" | null>(null);
  const [collectStep, setCollectStep] = useState<"billing" | "receipt">("billing");
  const [collectForm, setCollectForm] = useState(EMPTY_COLLECT);
  const [paidBill, setPaidBill] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>({ name: "Hospital", address: "", phone: "", email: "", logo: "", gstNumber: "", registrationNo: "" });
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
    // Load hospital info from settings (has logo + all configured details)
    (async () => {
      try {
        const settingsRes = await api("/api/config/settings");
        if (settingsRes.success && settingsRes.data?.settings) {
          const s = settingsRes.data.settings;
          setHospitalInfo({
            name: s.hospitalName || "Hospital",
            address: s.address || "",
            phone: s.phone || "",
            email: s.email || "",
            logo: s.logo || "",
            gstNumber: s.gstNumber || "",
            registrationNo: s.registrationNo || "",
          });
          return;
        }
      } catch {}
      // Fallback to hospital details
      try {
        const detailsRes = await api("/api/hospital/details");
        if (detailsRes.success && detailsRes.data) {
          const h = detailsRes.data;
          const s = h.settings;
          setHospitalInfo({
            name: s?.hospitalName || h.name || "Hospital",
            address: s?.address || "",
            phone: s?.phone || h.mobile || "",
            email: s?.email || h.email || "",
            logo: s?.logo || "",
            gstNumber: s?.gstNumber || "",
            registrationNo: s?.registrationNo || "",
          });
        }
      } catch {}
    })();
  }, []);

  const handleView = (item: QueueItem) => {
    setSelectedItem(item);
    setViewMode("view");
  };

  const handleCollect = (item: QueueItem) => {
    setSelectedItem(item);
    setCollectForm({
      ...EMPTY_COLLECT,
      isGst: item.bill?.isGst || false,
      cgst: item.bill?.cgst || 9,
      sgst: item.bill?.sgst || 9,
      igst: item.bill?.igst || 0,
      discount: item.bill?.discount || 0,
    });
    setCollectStep("billing");
    setPaidBill(null);
    setViewMode("collect");
  };

  const handleDelete = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    setDeleting(billId);
    const d = await api(`/api/billing/${billId}`, { method: "DELETE" });
    if (d.success) loadQueue();
    else alert(d.message || "Failed to delete bill");
    setDeleting(null);
  };

  const handleAddCharge = () => {
    if (!collectForm.newChargeName.trim() || collectForm.newChargeRate <= 0) return;
    const qty = collectForm.newChargeQty || 1;
    const amount = qty * collectForm.newChargeRate;
    setCollectForm(f => ({
      ...f,
      addedCharges: [...f.addedCharges, { name: f.newChargeName.trim(), quantity: qty, unitPrice: f.newChargeRate, amount }],
      newChargeName: "", newChargeQty: 1, newChargeRate: 0
    }));
  };

  const handleRemoveCharge = (idx: number) => {
    setCollectForm(f => ({ ...f, addedCharges: f.addedCharges.filter((_, i) => i !== idx) }));
  };

  const liveTotals = useMemo(() => {
    const base = selectedItem?.bill?.subtotal || 0;
    const added = collectForm.addedCharges.reduce((s, c) => s + c.amount, 0);
    const gross = base + added;
    const gstTotal = collectForm.isGst ? (gross * (collectForm.cgst + collectForm.sgst + collectForm.igst)) / 100 : 0;
    const cgstAmt = collectForm.isGst ? (gross * collectForm.cgst) / 100 : 0;
    const sgstAmt = collectForm.isGst ? (gross * collectForm.sgst) / 100 : 0;
    const igstAmt = collectForm.isGst ? (gross * collectForm.igst) / 100 : 0;
    const total = Math.max(0, gross + gstTotal - (collectForm.discount || 0));
    return { base, added, gross, gstTotal, cgstAmt, sgstAmt, igstAmt, total };
  }, [selectedItem, collectForm]);

  const handleCollectAndGenerate = async () => {
    if (!selectedItem?.bill?.id) return;
    setProcessing(true);
    try {
      // Batch update: add all items + GST/discount in parallel
      const billId = selectedItem.bill!.id;
      const updatePromises = collectForm.addedCharges.map(charge =>
        api(`/api/billing/${billId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addItem: { name: charge.name, unitPrice: charge.unitPrice, quantity: charge.quantity, type: "OTHER" } })
        })
      );
      
      // Wait for all items to be added
      if (updatePromises.length > 0) await Promise.all(updatePromises);
      
      // Apply GST/discount
      await api(`/api/billing/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          discount: collectForm.discount || 0, 
          isGst: collectForm.isGst, 
          cgst: collectForm.cgst, 
          sgst: collectForm.sgst, 
          igst: collectForm.igst 
        })
      });
      
      // Fetch final total from server
      const updatedBill = await api(`/api/billing/${billId}`);
      const payableTotal = updatedBill?.data?.total ?? updatedBill?.total ?? liveTotals.total;
      
      // Record payment
      const payRes = await api(`/api/billing/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: collectForm.method,
          amount: payableTotal,
          transactionId: collectForm.transactionId || undefined,
          notes: collectForm.notes || undefined
        })
      });
      
      if (payRes.success) {
        const billRes = await api(`/api/billing/${billId}`);
        setPaidBill(billRes.data || billRes);
        setCollectStep("receipt");
        loadQueue();
      } else {
        alert(payRes.message || "Payment failed");
      }
    } catch (err) {
      console.error('Billing error:', err);
      alert("Something went wrong. Please try again.");
    }
    setProcessing(false);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const billNo = paidBill?.billNo || selectedItem?.bill?.billNo || "BILL";
    const w = window.open("", "", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Bill ${billNo}</title><style>
      *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1e293b;background:#fff}
      .bill-print{max-width:780px;margin:0 auto}.bill-ph{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #0ea5e9;margin-bottom:20px}
      .bill-ph-left h1{font-size:22px;font-weight:800;color:#0ea5e9;margin-bottom:6px}.bill-ph-left p{font-size:12px;color:#64748b;margin-top:3px}
      .bill-ph-right{text-align:right}.bill-ph-right h2{font-size:18px;font-weight:700;color:#1e293b}.bill-ph-right p{font-size:11px;color:#64748b;margin-top:3px}
      .bill-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:20px}
      .bill-meta-item label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:3px}
      .bill-meta-item span{font-size:13px;font-weight:600;color:#1e293b}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      thead{background:#f1f5f9}th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #e2e8f0}
      td{padding:10px 12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}.text-right{text-align:right}.text-center{text-align:center}
      .summary{max-width:320px;margin-left:auto;background:#f8fafc;padding:16px;border-radius:8px}.summary-row{display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:8px}
      .summary-total{display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1e293b;padding-top:12px;border-top:2px solid #0ea5e9;margin-top:8px}
      .badge{display:inline-block;padding:3px 10px;border-radius:100px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700}
      .payment-strip{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:13px;color:#166534;display:flex;gap:20px}
      .footer{text-align:center;margin-top:28px;padding-top:16px;border-top:1px dashed #e2e8f0;color:#94a3b8;font-size:11px}
      @media print{@page{margin:15mm}}
    </style></head><body><div class="bill-print">${printContent}</div></body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  const handleDownloadBillPDF = async (item: QueueItem) => {
    if (!item?.bill) return;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const mx = 18;
    const cw = pw - mx * 2;
    const rs = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    let y = 16;

    // Load logo
    let logoDataUrl: string | null = null;
    if (hospitalInfo.logo) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = hospitalInfo.logo;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) { ctx.drawImage(img, 0, 0); logoDataUrl = canvas.toDataURL('image/png'); }
            } catch {}
            resolve();
          };
          img.onerror = () => resolve();
        });
      } catch {}
    }

    // Header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pw, 52, 'F');
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.8);
    doc.line(0, 52, pw, 52);

    const infoX = logoDataUrl ? mx + 28 : mx;
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', mx, y, 22, 22); } catch {}
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text(hospitalInfo.name || 'Hospital', infoX, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    let hy = y + 12;
    if (hospitalInfo.address) { doc.text(hospitalInfo.address, infoX, hy); hy += 4; }
    if (hospitalInfo.phone) { doc.text('Phone: ' + hospitalInfo.phone, infoX, hy); hy += 4; }
    if (hospitalInfo.email) { doc.text('Email: ' + hospitalInfo.email, infoX, hy); hy += 4; }
    if (hospitalInfo.gstNumber) { doc.text('GSTIN: ' + hospitalInfo.gstNumber, infoX, hy); hy += 4; }
    if (hospitalInfo.registrationNo) { doc.text('Reg: ' + hospitalInfo.registrationNo, infoX, hy); }

    const rx = pw - mx;
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(rx - 32, y, 32, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', rx - 16, y + 5, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(item.bill.billNo || 'BILL', rx, y + 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Date: ' + fmtDate(item.appointmentDate), rx, y + 22, { align: 'right' });

    y = 58;

    // Patient info
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'S');

    const metaItems = [
      { label: 'Patient Name', value: item.patient.name },
      { label: 'Patient ID', value: item.patient.patientId },
      { label: 'Date & Time', value: fmtDate(item.appointmentDate) + ' | ' + fmtTime(item.timeSlot) },
      { label: 'Consultation By', value: 'Dr. ' + item.doctor.name + (item.doctor.specialization ? ' - ' + item.doctor.specialization : '') },
      { label: 'Department', value: item.department?.name || item.subDepartment?.name || '-' },
    ];
    const metaCols = 3;
    const mColW = cw / metaCols;
    metaItems.forEach((m, i) => {
      const col = i % metaCols;
      const row = Math.floor(i / metaCols);
      const mX = mx + 4 + col * mColW;
      const mY = y + 5 + row * 11;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(m.label.toUpperCase(), mX, mY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(m.value, mX, mY + 4.5);
    });

    y += 30;

    // Items table
    const items = (item.bill.billItems || []).map((it: any, i: number) => [
      String(i + 1),
      it.name,
      String(it.quantity),
      rs(it.unitPrice),
      rs(it.amount)
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']],
      body: items,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: mx, right: mx },
    });

    y = (doc as any).lastAutoTable.finalY + 6;

    // Summary
    const sW = 78;
    const sX = pw - mx - sW;
    const summaryLines: Array<{ label: string; value: string; color?: number[] }> = [];
    summaryLines.push({ label: 'Subtotal', value: rs(item.bill.subtotal || 0) });
    if (item.bill.isGst && item.bill.cgst > 0) summaryLines.push({ label: `CGST (${item.bill.cgst}%)`, value: rs((item.bill.subtotal * item.bill.cgst) / 100) });
    if (item.bill.isGst && item.bill.sgst > 0) summaryLines.push({ label: `SGST (${item.bill.sgst}%)`, value: rs((item.bill.subtotal * item.bill.sgst) / 100) });
    if (item.bill.isGst && item.bill.igst > 0) summaryLines.push({ label: `IGST (${item.bill.igst}%)`, value: rs((item.bill.subtotal * item.bill.igst) / 100) });
    if (item.bill.discount > 0) summaryLines.push({ label: 'Discount', value: '- ' + rs(item.bill.discount), color: [5, 150, 105] });

    const lineH = 6;
    const boxH = (summaryLines.length * lineH) + lineH + 14;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'S');

    let sY = y + 6;
    summaryLines.forEach(row => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...(row.color || [71, 85, 105]) as [number, number, number]);
      doc.text(row.label, sX + 4, sY);
      doc.text(row.value, sX + sW - 4, sY, { align: 'right' });
      sY += lineH;
    });

    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.4);
    doc.line(sX + 4, sY - 1, sX + sW - 4, sY - 1);
    sY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Total Amount', sX + 4, sY);
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(11);
    doc.text(rs(item.bill.total || 0), sX + sW - 4, sY, { align: 'right' });

    y += boxH + 8;

    // Payment info (if paid)
    if (item.bill.status === 'PAID') {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.setLineWidth(0.3);
      doc.roundedRect(mx, y, cw, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('STATUS', mx + 4, y + 5);
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52);
      doc.text('PAID', mx + 4, y + 10);

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('AMOUNT PAID', mx + 40, y + 5);
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52);
      doc.text(rs(item.bill.total || 0), mx + 40, y + 10);

      y += 20;
    }

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(mx, y, pw - mx, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for choosing ' + (hospitalInfo.name || 'our hospital'), pw / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated invoice. No signature required.', pw / 2, y, { align: 'center' });

    const fileName = `Invoice_${(item.bill.billNo || 'BILL').replace(/\s+/g, '-')}_${item.patient.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleDownloadPDF = async () => {
    if (!selectedItem) return;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();   // ~210
    const ph = doc.internal.pageSize.getHeight();   // ~297
    const mx = 18;                                  // left/right margin
    const cw = pw - mx * 2;                         // content width
    // PDF-safe currency formatter (no Unicode ₹)
    const rs = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    let y = 16;

    // ── Load logo as base64 via canvas (avoids CORS issues) ──
    let logoDataUrl: string | null = null;
    if (hospitalInfo.logo) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = hospitalInfo.logo;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) { ctx.drawImage(img, 0, 0); logoDataUrl = canvas.toDataURL('image/png'); }
            } catch {}
            resolve();
          };
          img.onerror = () => resolve();
        });
      } catch {}
    }

    // ── Header Background ──
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pw, 52, 'F');
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.8);
    doc.line(0, 52, pw, 52);

    // ── Hospital Logo + Info (left) ──
    const infoX = logoDataUrl ? mx + 28 : mx;
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', mx, y, 22, 22); } catch {}
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text(hospitalInfo.name || 'Hospital', infoX, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    let hy = y + 12;
    if (hospitalInfo.address) { doc.text(hospitalInfo.address, infoX, hy); hy += 4; }
    if (hospitalInfo.phone) { doc.text('Phone: ' + hospitalInfo.phone, infoX, hy); hy += 4; }
    if (hospitalInfo.email) { doc.text('Email: ' + hospitalInfo.email, infoX, hy); hy += 4; }
    if (hospitalInfo.gstNumber) { doc.text('GSTIN: ' + hospitalInfo.gstNumber, infoX, hy); hy += 4; }
    if (hospitalInfo.registrationNo) { doc.text('Reg: ' + hospitalInfo.registrationNo, infoX, hy); }

    // ── Invoice badge + Bill No (right) ──
    const rx = pw - mx;
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(rx - 32, y, 32, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', rx - 16, y + 5, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(paidBill?.billNo || selectedItem.bill?.billNo || 'BILL', rx, y + 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Date: ' + fmtDate(selectedItem.appointmentDate), rx, y + 22, { align: 'right' });

    y = 58;

    // ── Patient & Consultation Info Table ──
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'S');

    const metaItems = [
      { label: 'Patient Name', value: selectedItem.patient.name },
      { label: 'Patient ID', value: selectedItem.patient.patientId },
      { label: 'Date & Time', value: fmtDate(selectedItem.appointmentDate) + ' | ' + fmtTime(selectedItem.timeSlot) },
      { label: 'Consultation By', value: 'Dr. ' + selectedItem.doctor.name + (selectedItem.doctor.specialization ? ' - ' + selectedItem.doctor.specialization : '') },
      { label: 'Department', value: selectedItem.department?.name || selectedItem.subDepartment?.name || '-' },
    ];
    const metaCols = 3;
    const mColW = cw / metaCols;
    metaItems.forEach((m, i) => {
      const col = i % metaCols;
      const row = Math.floor(i / metaCols);
      const mX = mx + 4 + col * mColW;
      const mY = y + 5 + row * 11;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(m.label.toUpperCase(), mX, mY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(m.value, mX, mY + 4.5);
    });

    y += 30;

    // ── Itemised Table ──
    const items = (paidBill?.billItems || selectedItem.bill?.billItems || []).map((it: any, i: number) => [
      String(i + 1),
      it.name,
      String(it.quantity),
      rs(it.unitPrice),
      rs(it.amount)
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']],
      body: items,
      theme: 'striped',
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      },
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: mx, right: mx },
    });

    y = (doc as any).lastAutoTable.finalY + 6;

    // ── Summary Section (right-aligned) ──
    const sW = 78;
    const sX = pw - mx - sW;
    const summaryLines: Array<{ label: string; value: string; color?: number[]; bold?: boolean }> = [];
    summaryLines.push({ label: 'Subtotal', value: rs(paidBill?.subtotal ?? liveTotals.gross) });
    if (collectForm.isGst && liveTotals.cgstAmt > 0) summaryLines.push({ label: `CGST (${collectForm.cgst}%)`, value: rs(liveTotals.cgstAmt) });
    if (collectForm.isGst && liveTotals.sgstAmt > 0) summaryLines.push({ label: `SGST (${collectForm.sgst}%)`, value: rs(liveTotals.sgstAmt) });
    if (collectForm.isGst && liveTotals.igstAmt > 0) summaryLines.push({ label: `IGST (${collectForm.igst}%)`, value: rs(liveTotals.igstAmt) });
    if ((paidBill?.discount > 0 || (collectForm.discount || 0) > 0)) {
      summaryLines.push({ label: 'Discount', value: '- ' + rs(paidBill?.discount ?? collectForm.discount), color: [5, 150, 105] });
    }

    const lineH = 6;
    const boxH = (summaryLines.length * lineH) + lineH + 14; // rows + divider + total
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'S');

    let sY = y + 6;
    summaryLines.forEach(row => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...(row.color || [71, 85, 105]) as [number, number, number]);
      doc.text(row.label, sX + 4, sY);
      doc.text(row.value, sX + sW - 4, sY, { align: 'right' });
      sY += lineH;
    });

    // Divider
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.4);
    doc.line(sX + 4, sY - 1, sX + sW - 4, sY - 1);
    sY += 4;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Total Amount', sX + 4, sY);
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(11);
    doc.text(rs(paidBill?.total ?? liveTotals.total), sX + sW - 4, sY, { align: 'right' });

    y += boxH + 8;

    // ── Payment Info Strip ──
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.3);
    doc.roundedRect(mx, y, cw, 14, 2, 2, 'FD');

    const payItems = [
      { label: 'PAYMENT METHOD', value: collectForm.method },
      { label: 'AMOUNT PAID', value: rs(paidBill?.total ?? liveTotals.total) },
      { label: 'STATUS', value: 'PAID' },
    ];
    if (collectForm.transactionId) payItems.push({ label: 'TXN ID', value: collectForm.transactionId });
    const pColW = cw / payItems.length;
    payItems.forEach((p, i) => {
      const pX = mx + 4 + i * pColW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(p.label, pX, y + 5);
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52);
      doc.text(p.value, pX, y + 10);
    });

    y += 20;

    // ── Footer ──
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(mx, y, pw - mx, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for choosing ' + (hospitalInfo.name || 'our hospital'), pw / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated invoice. No signature required.', pw / 2, y, { align: 'center' });

    // Save
    const fileName = `Invoice_${(paidBill?.billNo || selectedItem.bill?.billNo || 'BILL').replace(/\s+/g, '-')}_${selectedItem.patient.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
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
                              <button className="bq-action-btn bq-action-download" onClick={() => handleDownloadBillPDF(item)} title="Download PDF">
                                <Download size={14} />
                              </button>
                              {item.bill.status !== "PAID" && (
                                <button className="bq-action-btn bq-action-collect" onClick={() => handleCollect(item)} title="Collect & Generate Bill">
                                  <CreditCard size={14} />
                                </button>
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
                <h3>Bill Details - {selectedItem.bill?.billNo}</h3>
                <div style={{display: "flex", gap: 8}}>
                  <button className="bq-btn-icon" onClick={() => handleDownloadBillPDF(selectedItem)} title="Download PDF">
                    <Download size={16} />
                  </button>
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
                      <div className="bill-value">{selectedItem.bill?.billNo}</div>
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
                      {selectedItem.bill?.billItems.map(item => (
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
                      <span>{fmtCur(selectedItem.bill?.subtotal)}</span>
                    </div>
                    {selectedItem.bill?.isGst && (
                      <>
                        {selectedItem.bill?.cgst > 0 && (
                          <div className="bill-summary-row">
                            <span>CGST ({selectedItem.bill?.cgst}%):</span>
                            <span>{fmtCur((selectedItem.bill?.subtotal * selectedItem.bill?.cgst) / 100)}</span>
                          </div>
                        )}
                        {selectedItem.bill?.sgst > 0 && (
                          <div className="bill-summary-row">
                            <span>SGST ({selectedItem.bill?.sgst}%):</span>
                            <span>{fmtCur((selectedItem.bill?.subtotal * selectedItem.bill?.sgst) / 100)}</span>
                          </div>
                        )}
                        {selectedItem.bill?.igst > 0 && (
                          <div className="bill-summary-row">
                            <span>IGST ({selectedItem.bill?.igst}%):</span>
                            <span>{fmtCur((selectedItem.bill?.subtotal * selectedItem.bill?.igst) / 100)}</span>
                          </div>
                        )}
                      </>
                    )}
                    {selectedItem.bill?.tax > 0 && !selectedItem.bill?.isGst && (
                      <div className="bill-summary-row">
                        <span>Tax:</span>
                        <span>{fmtCur(selectedItem.bill?.tax)}</span>
                      </div>
                    )}
                    {selectedItem.bill?.discount > 0 && (
                      <div className="bill-summary-row">
                        <span>Discount:</span>
                        <span className="text-success">-{fmtCur(selectedItem.bill?.discount)}</span>
                      </div>
                    )}
                    <div className="bill-summary-row bill-total">
                      <span>Total Amount:</span>
                      <strong>{fmtCur(selectedItem.bill?.total)}</strong>
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

        {/* ── Comprehensive Collect & Generate Bill Modal ─────────────────────── */}
        {viewMode === "collect" && selectedItem?.bill && (
          <div className="bq-modal-overlay" onClick={() => !processing && collectStep === "billing" && setViewMode(null)}>
            <div className="bq-modal bq-modal-xl" onClick={e => e.stopPropagation()}>

              {/* ── Header ── */}
              <div className="bq-modal-header">
                {collectStep === "billing" ? (
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="cm-header-icon"><CreditCard size={18} color="#0ea5e9" /></div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>Collect &amp; Generate Bill</div>
                        <div style={{fontSize:12,color:"#94a3b8"}}>{selectedItem.bill?.billNo}</div>
                      </div>
                    </div>
                    <button className="bq-btn-icon" onClick={() => setViewMode(null)} disabled={processing}><X size={18}/></button>
                  </>
                ) : (
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="cm-header-icon cm-header-paid"><CheckCircle size={18} color="#059669" /></div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:"#166534"}}>Payment Successful</div>
                        <div style={{fontSize:12,color:"#94a3b8"}}>{paidBill?.billNo || selectedItem.bill?.billNo} — Receipt Generated</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="bq-btn-secondary" style={{padding:"8px 14px",fontSize:12}} onClick={handleDownloadPDF}>
                        <Download size={14}/>Download PDF
                      </button>
                      <button className="bq-btn-secondary" style={{padding:"8px 14px",fontSize:12}} onClick={handlePrint}>
                        <Printer size={14}/>Print
                      </button>
                      <button className="bq-btn-icon" onClick={() => setViewMode(null)}><X size={18}/></button>
                    </div>
                  </>
                )}
              </div>

              {/* ── Body: Billing Step ── */}
              {collectStep === "billing" && (
                <div className="bq-modal-body">
                  {/* Patient strip */}
                  <div className="cm-patient-strip">
                    <div className="cm-patient-avatar">{(selectedItem.patient.name||"?")[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div className="cm-patient-name">{selectedItem.patient.name}</div>
                      <div className="cm-patient-meta">{selectedItem.patient.patientId}{selectedItem.patient.phone ? ` · ${selectedItem.patient.phone}` : ""}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div className="cm-patient-meta"><Stethoscope size={12} style={{display:"inline",marginRight:4}}/>Dr. {selectedItem.doctor.name}</div>
                      <div className="cm-patient-meta">{selectedItem.doctor.specialization || selectedItem.department?.name || ""}</div>
                    </div>
                  </div>

                  <div className="cm-layout">
                    {/* ── Left Column: Charges ── */}
                    <div className="cm-left">
                      <div className="cm-section-title"><Receipt size={14}/>Charges Summary</div>
                      <table className="cm-charges-table">
                        <thead>
                          <tr><th>#</th><th>Description</th><th className="text-center">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr>
                        </thead>
                        <tbody>
                          {(selectedItem.bill?.billItems || []).map((it, i) => (
                            <tr key={it.id}>
                              <td className="text-center" style={{color:"#94a3b8"}}>{i+1}</td>
                              <td>
                                <div style={{fontWeight:600,color:"#1e293b",fontSize:13}}>{it.name}</div>
                                <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase"}}>{it.type}</div>
                              </td>
                              <td className="text-center">{it.quantity}</td>
                              <td className="text-right">{fmtCur(it.unitPrice)}</td>
                              <td className="text-right" style={{fontWeight:700}}>{fmtCur(it.amount)}</td>
                            </tr>
                          ))}
                          {collectForm.addedCharges.map((ch, i) => (
                            <tr key={`added-${i}`} className="cm-added-row">
                              <td className="text-center" style={{color:"#94a3b8"}}>{Number(selectedItem.bill?.billItems?.length ?? 0) + i + 1}</td>
                              <td>
                                <div style={{fontWeight:600,color:"#0369a1",fontSize:13}}>{ch.name}</div>
                                <div style={{fontSize:10,color:"#94a3b8"}}>ADDED CHARGE</div>
                              </td>
                              <td className="text-center">{ch.quantity}</td>
                              <td className="text-right">{fmtCur(ch.unitPrice)}</td>
                              <td className="text-right" style={{fontWeight:700,color:"#0369a1"}}>{fmtCur(ch.amount)}</td>
                              <td>
                                <button className="cm-remove-btn" onClick={() => handleRemoveCharge(i)} title="Remove"><X size={12}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Add extra charge form */}
                      <div className="cm-add-charge">
                        <div className="cm-section-title" style={{marginBottom:10}}><Plus size={14}/>Add Extra Charge</div>
                        <div className="cm-add-charge-row">
                          <input
                            className="cm-input cm-input-md"
                            placeholder="Charge name (e.g. Dressing, X-Ray)"
                            value={collectForm.newChargeName}
                            onChange={e => setCollectForm(f => ({...f, newChargeName: e.target.value}))}
                            onKeyDown={e => e.key === "Enter" && handleAddCharge()}
                          />
                          <input
                            className="cm-input cm-input-sm"
                            type="number" min="1" placeholder="Qty"
                            value={collectForm.newChargeQty}
                            onChange={e => setCollectForm(f => ({...f, newChargeQty: parseInt(e.target.value)||1}))}
                          />
                          <div className="cm-rate-wrap">
                            <span className="cm-rate-prefix">₹</span>
                            <input
                              className="cm-input cm-input-rate"
                              type="number" step="0.01" placeholder="Rate"
                              value={collectForm.newChargeRate || ""}
                              onChange={e => setCollectForm(f => ({...f, newChargeRate: parseFloat(e.target.value)||0}))}
                              onKeyDown={e => e.key === "Enter" && handleAddCharge()}
                            />
                          </div>
                          <button className="cm-add-btn" onClick={handleAddCharge} disabled={!collectForm.newChargeName.trim() || collectForm.newChargeRate <= 0}>
                            <Plus size={14}/>Add
                          </button>
                        </div>
                      </div>

                      {/* GST */}
                      <div className="cm-section-title" style={{marginTop:16}}><PercentIcon size={14}/>Tax &amp; GST</div>
                      <div className="cm-gst-toggle">
                        <label className="cm-toggle-label">
                          <div className={`cm-toggle ${collectForm.isGst ? "cm-toggle-on" : ""}`} onClick={() => setCollectForm(f => ({...f, isGst: !f.isGst}))}>
                            <div className="cm-toggle-knob"/>
                          </div>
                          <span style={{fontWeight:600,color: collectForm.isGst ? "#0369a1" : "#64748b"}}>Apply GST</span>
                        </label>
                      </div>
                      {collectForm.isGst && (
                        <div className="cm-gst-fields">
                          <div className="cm-field-group">
                            <label>CGST (%)</label>
                            <input className="cm-input" type="number" step="0.01" value={collectForm.cgst}
                              onChange={e => setCollectForm(f => ({...f, cgst: parseFloat(e.target.value)||0}))} />
                          </div>
                          <div className="cm-field-group">
                            <label>SGST (%)</label>
                            <input className="cm-input" type="number" step="0.01" value={collectForm.sgst}
                              onChange={e => setCollectForm(f => ({...f, sgst: parseFloat(e.target.value)||0}))} />
                          </div>
                          <div className="cm-field-group">
                            <label>IGST (%)</label>
                            <input className="cm-input" type="number" step="0.01" value={collectForm.igst}
                              onChange={e => setCollectForm(f => ({...f, igst: parseFloat(e.target.value)||0}))} />
                          </div>
                        </div>
                      )}

                      {/* Discount */}
                      <div className="cm-field-group" style={{marginTop:16}}>
                        <div className="cm-section-title" style={{marginBottom:8}}><Tag size={14}/>Discount</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <div className="cm-rate-wrap">
                            <span className="cm-rate-prefix">₹</span>
                            <input className="cm-input" type="number" step="0.01" placeholder="0.00"
                              value={collectForm.discount || ""}
                              onChange={e => setCollectForm(f => ({...f, discount: parseFloat(e.target.value)||0}))} />
                          </div>
                          <input className="cm-input" type="text" placeholder="Remark (optional)"
                            value={collectForm.discountRemark}
                            onChange={e => setCollectForm(f => ({...f, discountRemark: e.target.value}))} />
                        </div>
                      </div>
                    </div>

                    {/* ── Right Column: Total + Payment ── */}
                    <div className="cm-right">
                      {/* Live Total Box */}
                      <div className="cm-total-box">
                        <div className="cm-total-row"><span>Base Charges</span><span>{fmtCur(liveTotals.base)}</span></div>
                        {liveTotals.added > 0 && <div className="cm-total-row"><span>Extra Charges</span><span style={{color:"#0369a1"}}>+{fmtCur(liveTotals.added)}</span></div>}
                        {collectForm.isGst && liveTotals.cgstAmt > 0 && <div className="cm-total-row"><span>CGST ({collectForm.cgst}%)</span><span>{fmtCur(liveTotals.cgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.sgstAmt > 0 && <div className="cm-total-row"><span>SGST ({collectForm.sgst}%)</span><span>{fmtCur(liveTotals.sgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.igstAmt > 0 && <div className="cm-total-row"><span>IGST ({collectForm.igst}%)</span><span>{fmtCur(liveTotals.igstAmt)}</span></div>}
                        {(collectForm.discount||0) > 0 && <div className="cm-total-row"><span>Discount</span><span style={{color:"#059669"}}>-{fmtCur(collectForm.discount)}</span></div>}
                        <div className="cm-total-final">
                          <span>Total Payable</span>
                          <strong>{fmtCur(liveTotals.total)}</strong>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="cm-section-title" style={{marginTop:16,marginBottom:10}}><IndianRupee size={14}/>Payment</div>
                      <div className="cm-pay-methods">
                        {["CASH","CARD","UPI","INSURANCE","OTHER"].map(m => (
                          <button key={m} className={`cm-pay-method ${collectForm.method === m ? "active" : ""}`}
                            onClick={() => setCollectForm(f => ({...f, method: m}))}>
                            {m === "CASH" ? <Banknote size={14} /> : m === "CARD" ? <CreditCard size={14} /> : m === "UPI" ? <Smartphone size={14} /> : m === "INSURANCE" ? <ShieldCheck size={14} /> : <Settings2 size={14} />} {m}
                          </button>
                        ))}
                      </div>
                      {collectForm.method !== "CASH" && (
                        <div className="cm-field-group" style={{marginTop:10}}>
                          <label>Transaction / Ref ID</label>
                          <input className="cm-input" type="text" placeholder="Optional reference number"
                            value={collectForm.transactionId}
                            onChange={e => setCollectForm(f => ({...f, transactionId: e.target.value}))} />
                        </div>
                      )}
                      <div className="cm-field-group" style={{marginTop:10}}>
                        <label>Notes (optional)</label>
                        <textarea className="cm-input cm-textarea" rows={2} placeholder="Any remarks..."
                          value={collectForm.notes}
                          onChange={e => setCollectForm(f => ({...f, notes: e.target.value}))} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Body: Receipt Step ── */}
              {collectStep === "receipt" && selectedItem && (
                <div className="bq-modal-body">
                  <div className="cm-success-banner">
                    <CheckCircle size={22} color="#059669"/>
                    <span>Payment of <strong>{fmtCur(liveTotals.total)}</strong> collected via {collectForm.method}</span>
                  </div>
                  {/* ── Professional Bill ── */}
                  <div ref={printRef} className="bill-print-wrap">
                    {/* Hospital Header */}
                    <div className="bill-ph">
                      <div className="bill-ph-left">
                        {hospitalInfo.logo
                          ? <img src={hospitalInfo.logo} alt={hospitalInfo.name} style={{maxHeight:56,maxWidth:120,objectFit:"contain",marginBottom:8}}/>
                          : <div className="bill-logo-sq"><Building2 size={28} color="#0ea5e9"/></div>}
                        <h1>{hospitalInfo.name}</h1>
                        {hospitalInfo.address && <p><MapPin size={11} style={{display:"inline",marginRight:3}}/>{hospitalInfo.address}</p>}
                      </div>
                      <div className="bill-ph-right">
                        <div className="bill-ph-badge">INVOICE</div>
                        <h2>{paidBill?.billNo || selectedItem.bill?.billNo}</h2>
                        <p><Phone size={11} style={{display:"inline",marginRight:3}}/>{hospitalInfo.phone || "—"}</p>
                        <p><Mail size={11} style={{display:"inline",marginRight:3}}/>{hospitalInfo.email || "—"}</p>
                      </div>
                    </div>

                    {/* Bill Meta */}
                    <div className="bill-meta-grid">
                      <div className="bill-meta-item">
                        <label>Patient Name</label>
                        <span>{selectedItem.patient.name}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Patient ID</label>
                        <span>{selectedItem.patient.patientId}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Date</label>
                        <span>{fmtDate(selectedItem.appointmentDate)}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Time</label>
                        <span>{fmtTime(selectedItem.timeSlot)}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Consultation By</label>
                        <span>Dr. {selectedItem.doctor.name}{selectedItem.doctor.specialization ? ` · ${selectedItem.doctor.specialization}` : ""}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Department</label>
                        <span>{selectedItem.department?.name || selectedItem.subDepartment?.name || "—"}</span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="bill-items-table">
                      <thead>
                        <tr>
                          <th style={{width:36}}>#</th>
                          <th>Description</th>
                          <th className="text-center">Qty</th>
                          <th className="text-right">Rate</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paidBill?.billItems || selectedItem.bill?.billItems).map((it: any, i: number) => (
                          <tr key={it.id || i}>
                            <td className="text-center" style={{color:"#94a3b8",fontSize:12}}>{i+1}</td>
                            <td>
                              <span style={{fontWeight:600}}>{it.name}</span>
                              {it.type && it.type !== "CONSULTATION" && <span style={{fontSize:10,color:"#94a3b8",marginLeft:6,textTransform:"uppercase"}}>{it.type}</span>}
                            </td>
                            <td className="text-center">{it.quantity}</td>
                            <td className="text-right">{fmtCur(it.unitPrice)}</td>
                            <td className="text-right" style={{fontWeight:700}}>{fmtCur(it.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div className="bill-summary-wrap">
                      <div className="bill-summary-inner">
                        <div className="bill-sum-row"><span>Subtotal</span><span>{fmtCur(paidBill?.subtotal ?? liveTotals.gross)}</span></div>
                        {collectForm.isGst && liveTotals.cgstAmt > 0 && <div className="bill-sum-row"><span>CGST ({collectForm.cgst}%)</span><span>{fmtCur(liveTotals.cgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.sgstAmt > 0 && <div className="bill-sum-row"><span>SGST ({collectForm.sgst}%)</span><span>{fmtCur(liveTotals.sgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.igstAmt > 0 && <div className="bill-sum-row"><span>IGST ({collectForm.igst}%)</span><span>{fmtCur(liveTotals.igstAmt)}</span></div>}
                        {(paidBill?.tax > 0 && !collectForm.isGst) && <div className="bill-sum-row"><span>Tax</span><span>{fmtCur(paidBill.tax)}</span></div>}
                        {(paidBill?.discount > 0 || (collectForm.discount||0) > 0) && (
                          <div className="bill-sum-row" style={{color:"#059669"}}>
                            <span>Discount</span><span>−{fmtCur(paidBill?.discount ?? collectForm.discount)}</span>
                          </div>
                        )}
                        <div className="bill-sum-total">
                          <span>Total Amount</span>
                          <strong>{fmtCur(paidBill?.total ?? liveTotals.total)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Payment strip */}
                    <div className="bill-pay-strip">
                      <div className="bill-pay-item"><span>Payment Method</span><strong>{collectForm.method}</strong></div>
                      <div className="bill-pay-item"><span>Amount Paid</span><strong>{fmtCur(paidBill?.total ?? liveTotals.total)}</strong></div>
                      <div className="bill-pay-item"><span>Status</span><span className="bill-paid-badge">PAID</span></div>
                      {collectForm.transactionId && <div className="bill-pay-item"><span>Txn ID</span><strong>{collectForm.transactionId}</strong></div>}
                    </div>

                    <div className="bill-footer-note">
                      <p>Thank you for choosing <strong>{hospitalInfo.name}</strong></p>
                      <p>This is a computer-generated invoice. No signature required.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Footer ── */}
              <div className="bq-modal-footer">
                {collectStep === "billing" ? (
                  <>
                    <button className="bq-btn-secondary" onClick={() => setViewMode(null)} disabled={processing}>Cancel</button>
                    <button className="bq-btn-collect-main" onClick={handleCollectAndGenerate} disabled={processing}>
                      {processing ? <><Loader2 size={15} style={{animation:"spin .7s linear infinite"}}/>Processing...</> : <><ChevronRight size={15}/>Collect &amp; Generate Bill</>}
                    </button>
                  </>
                ) : (
                  <button className="bq-btn-primary" onClick={() => setViewMode(null)}>Close</button>
                )}
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
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* ── Layout ── */
.bq-wrap{font-family:'Inter',system-ui,sans-serif;padding:20px;background:#f8fafc;min-height:100vh}
.bq-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:20px}
.bq-stat-card{padding:20px;border-radius:14px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.bq-stat-icon{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bq-stat-value{font-size:24px;font-weight:800;color:#fff;line-height:1}
.bq-stat-label{font-size:12px;color:rgba(255,255,255,.9);margin-top:4px;font-weight:600}

/* ── Filters ── */
.bq-filters{display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.bq-search{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;flex:1;min-width:220px}
.bq-search input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%;font-family:inherit}
.bq-date-input{padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:13px;color:#334155;outline:none;font-family:inherit}

/* ── Buttons ── */
.bq-btn-primary,.bq-btn-secondary{padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border:none;transition:all .2s}
.bq-btn-primary{background:#0ea5e9;color:#fff}.bq-btn-primary:hover{background:#0284c7}.bq-btn-primary:disabled{opacity:.6;cursor:not-allowed}
.bq-btn-secondary{background:#fff;color:#64748b;border:1px solid #e2e8f0}.bq-btn-secondary:hover{background:#f8fafc}.bq-btn-secondary:disabled{opacity:.6;cursor:not-allowed}
.bq-btn-icon{background:none;border:none;cursor:pointer;color:#64748b;padding:6px;border-radius:6px;transition:all .2s;display:flex;align-items:center;justify-content:center}
.bq-btn-icon:hover{background:#f1f5f9;color:#334155}
.bq-btn-collect-main{padding:11px 22px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;border:none;background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 4px 14px rgba(16,185,129,.35);transition:all .2s}
.bq-btn-collect-main:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(16,185,129,.45)}
.bq-btn-collect-main:disabled{opacity:.6;cursor:not-allowed;transform:none}

/* ── Table Card ── */
.bq-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.bq-loading{padding:60px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;color:#94a3b8;font-size:14px}
.bq-empty{padding:60px 20px;text-align:center;color:#94a3b8}
.bq-empty-title{font-size:15px;font-weight:600;margin-top:12px;color:#64748b}
.bq-empty-sub{font-size:13px;margin-top:4px}
.bq-table{width:100%;border-collapse:collapse}
.bq-table thead{background:#f8fafc}
.bq-table th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:14px 16px;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.05em}
.bq-table td{padding:12px 16px;border-bottom:1px solid #f8fafc;font-size:13px;color:#475569;vertical-align:middle}
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
.bq-action-view{background:#f0f9ff;color:#0369a1}.bq-action-view:hover:not(:disabled){background:#e0f2fe}
.bq-action-download{background:#fef3c7;color:#b45309}.bq-action-download:hover:not(:disabled){background:#fde68a}
.bq-action-collect{background:#dcfce7;color:#166534}.bq-action-collect:hover:not(:disabled){background:#bbf7d0}
.bq-action-delete{background:#fee2e2;color:#dc2626}.bq-action-delete:hover:not(:disabled){background:#fecaca}
.text-center{text-align:center}.text-right{text-align:right}

/* ── Modal Overlay & Shell ── */
.bq-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(3px);padding:16px}
.bq-modal{background:#fff;border-radius:18px;width:100%;max-width:520px;box-shadow:0 24px 80px rgba(0,0,0,.22);max-height:92vh;overflow:hidden;display:flex;flex-direction:column;animation:fadeSlideIn .2s ease}
.bq-modal-large{max-width:860px}
.bq-modal-xl{max-width:1080px}
.bq-modal-header{padding:18px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.bq-modal-header h3{font-size:16px;font-weight:700;color:#1e293b;margin:0}
.bq-modal-body{padding:24px;overflow-y:auto;flex:1}
.bq-modal-footer{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;background:#fafbfc}

/* ── Collect Modal — Patient Strip ── */
.cm-header-icon{width:36px;height:36px;border-radius:10px;background:#f0f9ff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cm-header-paid{background:#f0fdf4}
.cm-patient-strip{display:flex;align-items:center;gap:14px;padding:14px 18px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:12px;margin-bottom:20px;border:1px solid #bae6fd}
.cm-patient-avatar{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;flex-shrink:0}
.cm-patient-name{font-size:15px;font-weight:700;color:#1e293b}
.cm-patient-meta{font-size:12px;color:#64748b;margin-top:2px;display:flex;align-items:center;gap:4px}

/* ── Collect Modal — Layout ── */
.cm-layout{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start}
@media(max-width:780px){.cm-layout{grid-template-columns:1fr}}

/* ── Collect Modal — Left: Charges ── */
.cm-section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
.cm-charges-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0}
.cm-charges-table thead{background:#f8fafc}
.cm-charges-table th{padding:9px 10px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #f1f5f9;text-align:left}
.cm-charges-table td{padding:9px 10px;border-bottom:1px solid #f8fafc;color:#334155;vertical-align:middle}
.cm-charges-table tbody tr:hover{background:#fafbfc}
.cm-added-row td{background:#f0f9ff!important}
.cm-remove-btn{background:none;border:none;cursor:pointer;color:#94a3b8;padding:3px;border-radius:4px;display:flex;align-items:center;transition:all .15s}
.cm-remove-btn:hover{background:#fee2e2;color:#dc2626}

/* ── Collect Modal — Add Charge Form ── */
.cm-add-charge{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:16px;margin-top:12px}
.cm-add-charge-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cm-input{padding:9px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:13px;color:#334155;outline:none;font-family:inherit;transition:border-color .2s}
.cm-input:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.1)}
.cm-input-flex{flex:1;min-width:140px}
.cm-input-md{width:200px}
.cm-input-sm{width:72px}
.cm-input-rate{width:100px}
.cm-textarea{resize:none;width:100%}
.cm-rate-wrap{position:relative;display:flex;align-items:center}
.cm-rate-prefix{position:absolute;left:9px;font-size:13px;color:#94a3b8;pointer-events:none;z-index:1}
.cm-rate-wrap .cm-input{padding-left:22px}
.cm-add-btn{padding:9px 16px;border-radius:8px;background:#0ea5e9;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s;white-space:nowrap}
.cm-add-btn:hover:not(:disabled){background:#0284c7}
.cm-add-btn:disabled{opacity:.4;cursor:not-allowed}

/* ── Collect Modal — Right: GST + Total + Payment ── */
.cm-field-group label{display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.cm-gst-toggle{margin-bottom:12px}
.cm-toggle-label{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
.cm-toggle{width:40px;height:22px;border-radius:100px;background:#e2e8f0;position:relative;transition:background .2s;flex-shrink:0;cursor:pointer}
.cm-toggle-on{background:#0ea5e9}
.cm-toggle-knob{width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.cm-toggle-on .cm-toggle-knob{left:20px}
.cm-gst-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px}
.cm-total-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-top:14px}
.cm-total-row{display:flex;justify-content:space-between;font-size:13px;color:#64748b;margin-bottom:8px}
.cm-total-final{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #e2e8f0;margin-top:4px;font-size:14px;color:#1e293b}
.cm-total-final strong{font-size:22px;font-weight:800;color:#0ea5e9}
.cm-pay-methods{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px}
.cm-pay-method{padding:7px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .2s}
.cm-pay-method:hover{border-color:#0ea5e9;color:#0ea5e9}
.cm-pay-method.active{border-color:#0ea5e9;background:#f0f9ff;color:#0369a1;font-weight:700}

/* ── Success Banner ── */
.cm-success-banner{display:flex;align-items:center;gap:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px 18px;margin-bottom:24px;font-size:14px;color:#166534;animation:fadeSlideIn .3s ease}

/* ── Professional Bill Format ── */
.bill-print-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;animation:fadeSlideIn .3s ease}
.bill-ph{display:flex;justify-content:space-between;align-items:flex-start;padding:24px 28px;background:linear-gradient(135deg,#f8fafc,#f0f9ff);border-bottom:3px solid #0ea5e9}
.bill-ph-left h1{font-size:20px;font-weight:800;color:#0ea5e9;margin:8px 0 4px}
.bill-ph-left p{font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;margin-top:3px}
.bill-ph-right{text-align:right}
.bill-ph-badge{display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;font-size:10px;font-weight:800;letter-spacing:.12em;padding:4px 12px;border-radius:100px;margin-bottom:8px}
.bill-ph-right h2{font-size:18px;font-weight:700;color:#1e293b;margin:4px 0}
.bill-ph-right p{font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:3px}
.bill-logo-sq{width:64px;height:64px;border-radius:14px;background:#e0f2fe;display:flex;align-items:center;justify-content:center}
.bill-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #f1f5f9}
.bill-meta-item{padding:14px 20px;border-right:1px solid #f1f5f9}
.bill-meta-item:last-child{border-right:none}
.bill-meta-item label{display:block;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.bill-meta-item span{font-size:13px;font-weight:600;color:#1e293b}
.bill-items-table{width:100%;border-collapse:collapse;margin:0}
.bill-items-table thead{background:#f8fafc}
.bill-items-table th{padding:12px 20px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #f1f5f9;text-align:left}
.bill-items-table td{padding:12px 20px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc}
.bill-items-table tbody tr:last-child td{border-bottom:none}
.bill-summary-wrap{padding:20px;background:#f8fafc;border-top:1px solid #f1f5f9}
.bill-summary-inner{max-width:320px;margin-left:auto}
.bill-sum-row{display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:8px}
.bill-sum-total{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #0ea5e9;margin-top:8px;font-size:16px;color:#1e293b}
.bill-sum-total strong{font-size:20px;font-weight:800;color:#0ea5e9}
.bill-pay-strip{display:flex;align-items:center;flex-wrap:wrap;gap:0;background:#f0fdf4;border-top:1px solid #bbf7d0;padding:14px 20px}
.bill-pay-item{display:flex;flex-direction:column;margin-right:32px}
.bill-pay-item span:first-child{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.bill-pay-item strong{font-size:13px;font-weight:700;color:#166534}
.bill-paid-badge{display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:800;padding:3px 10px;border-radius:100px;border:1px solid #86efac}
.bill-footer-note{padding:16px 20px;text-align:center;border-top:1px dashed #e2e8f0}
.bill-footer-note p{font-size:12px;color:#94a3b8;margin:0;line-height:1.8}

/* ── View Modal — Bill block ── */
.bill-container{padding:20px;background:#fff}
.bill-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}
.bill-logo-placeholder{width:80px;height:80px;border-radius:12px;background:#f0f9ff;display:flex;align-items:center;justify-content:center}
.bill-hospital-info{text-align:right}
.bill-hospital-info h2{font-size:20px;font-weight:800;color:#1e293b;margin:0 0 8px}
.bill-info-row{display:flex;align-items:center;gap:6px;justify-content:flex-end;font-size:12px;color:#64748b;margin-top:4px}
.bill-divider{height:2px;background:linear-gradient(90deg,#0ea5e9,#0284c7);margin:20px 0}
.bill-info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
.bill-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.bill-value{font-size:14px;font-weight:600;color:#1e293b}
.bill-table{width:100%;border-collapse:collapse;margin:20px 0}
.bill-table thead{background:#f8fafc}
.bill-table th{padding:12px;text-align:left;font-size:12px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0}
.bill-table td{padding:12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
.bill-summary{background:#f8fafc;border-radius:10px;padding:16px;margin-top:24px}
.bill-summary-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#475569;margin-bottom:8px}
.bill-summary-row:last-child{margin-bottom:0}
.bill-total{padding-top:12px;border-top:2px solid #e2e8f0;margin-top:8px;font-size:16px;font-weight:700;color:#1e293b}
.text-success{color:#059669}
.bill-footer{margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center}
.bill-footer p{margin:0;font-size:13px;color:#64748b}
`;
