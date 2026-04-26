"use client";
import React, { useEffect, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ViewRecordModal, EditRecordModal, TransferPatientModal, ViewPrescriptionModal } from "./modals";
import NotificationBell from "@/components/NotificationBell";
import Preloader from "@/components/Preloader";
import {
  ResponsiveContainer as RechartsResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell,
  ComposedChart as RechartsComposedChart,
  Bar as RechartsBar,
  Line as RechartsLine,
} from "recharts";

import {
  LogOut, Loader2, Bell, User, Phone, Mail, Activity, LayoutDashboard,
  Layers, ArrowRight, CheckCircle, Clock, Stethoscope, Settings,
  Users, ClipboardList, Building2, Search, RefreshCw, X, ChevronRight,
  Smile, Sparkles, Scissors, Heart, Microscope, Pill, Receipt, Scan,
  TestTube2, HelpCircle, PlayCircle, CheckCircle2, AlertCircle,
  CalendarDays, FileText, TrendingUp, FlaskConical,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, DollarSign, IndianRupee,
  Save, Ban, ChevronDown, ChevronUp, MessageSquare, UserCheck, Eye, Download,
  ShieldCheck, BarChart2, Package, UserPlus, ArrowUpDown, FileSpreadsheet,
  FileType, AlertTriangle, Bed, CreditCard
} from "lucide-react";

const BillingQueueLazy = dynamic(() => import("@/components/BillingQueue"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Billing Queue...</span></div> });
const AppointmentPanelLazy = dynamic(() => import("@/components/AppointmentPanel"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Appointments...</span></div> });
const PatientsManagementPanelLazy = dynamic(() => import("./PatientsManagementPanel").then(mod => mod.PatientsManagementPanel), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Patient Management...</span></div> });
const PharmacyDashboardLazy = dynamic(() => import("@/components/PharmacyDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Pharmacy Dashboard...</span></div> });
const NursingDashboardLazy = dynamic(() => import("@/components/NursingDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Nursing Dashboard...</span></div> });
const HousekeepingDashboardLazy = dynamic(() => import("@/components/HousekeepingDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Housekeeping Dashboard...</span></div> });
const AmbulanceDashboardLazy = dynamic(() => import("@/components/AmbulanceDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Ambulance Dashboard...</span></div> });
const BiomedicalDashboardLazy = dynamic(() => import("@/components/BiomedicalDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Biomedical Dashboard...</span></div> });
const LabDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/LabDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Lab Dashboard...</span></div> });
const CriticalCareDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/CriticalCareDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Critical Care Dashboard...</span></div> });
const SpecialtyClinicDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/SpecialtyClinicDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Specialty Dashboard...</span></div> });
const OPDDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void; meta?: any }>(() => import("@/components/OPDDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading OPD Dashboard...</span></div> });
const PathologyDashboardLazy = dynamic<{ profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }>(() => import("@/components/PathologyDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Pathology Dashboard...</span></div> });
const BillingDepartmentDashboardLazy = dynamic<{ profile: any; user: any; activeTab: string; onTabChange: (t: string) => void; meta: any }>(() => import("@/components/BillingDepartmentDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Billing Dashboard...</span></div> });
const AccountSettingsPanelLazy = dynamic<{ user: any }>(() => import("@/components/AccountSettingsPanel"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading Account Settings...</span></div> });
const HRDepartmentDashboardLazy = dynamic<{ profile: any; user: any; activeTab: string; onTabChange: (t: string) => void; meta: any }>(() => import("@/components/HRDepartmentDashboard"), { ssr: false, loading: () => <div style={{padding:40,textAlign:"center"}}><span style={{fontSize:13,color:"#94a3b8"}}>Loading HR Dashboard...</span></div> });

// ─── Department metadata ──────────────────────────────────────────────────────
type DeptMeta = { Icon: any; gradient: string; accent: string; lightBg: string; borderColor: string };
const SUB_DEPT_META: Record<string, DeptMeta> = {
  DENTAL:      { Icon: Smile,       gradient: "linear-gradient(135deg,#06b6d4,#0891b2)", accent: "#0891b2", lightBg: "#ecfeff", borderColor: "#a5f3fc" },
  DERMATOLOGY: { Icon: Sparkles,    gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8", borderColor: "#fbcfe8" },
  HAIR:        { Icon: Scissors,    gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)", accent: "#6d28d9", lightBg: "#f5f3ff", borderColor: "#ddd6fe" },
  ONCOLOGY:    { Icon: Activity,    gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed", borderColor: "#fed7aa" },
  CARDIOLOGY:  { Icon: Heart,       gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", accent: "#b91c1c", lightBg: "#fff5f5", borderColor: "#fecaca" },
  PATHOLOGY:   { Icon: Microscope,  gradient: "linear-gradient(135deg,#10b981,#047857)", accent: "#047857", lightBg: "#f0fdf4", borderColor: "#a7f3d0" },
  PHARMACY:    { Icon: Pill,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#07595D", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  BILLING:     { Icon: Receipt,     gradient: "linear-gradient(135deg,#f59e0b,#b45309)", accent: "#b45309", lightBg: "#fffbeb", borderColor: "#fde68a" },
  RADIOLOGY:   { Icon: Scan,        gradient: "linear-gradient(135deg,#6366f1,#4338ca)", accent: "#4338ca", lightBg: "#eef2ff", borderColor: "#c7d2fe" },
  LABORATORY:  { Icon: TestTube2,   gradient: "linear-gradient(135deg,#14b8a6,#0f766e)", accent: "#0f766e", lightBg: "#f0fdfa", borderColor: "#99f6e4" },
  PROCEDURE:   { Icon: Stethoscope, gradient: "linear-gradient(135deg,#84cc16,#4d7c0f)", accent: "#4d7c0f", lightBg: "#f7fee7", borderColor: "#d9f99d" },
  RECEPTION:   { Icon: Users,       gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)", accent: "#1d4ed8", lightBg: "#eff6ff", borderColor: "#bfdbfe" },
  OPD:              { Icon: Building2,   gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0E898F", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  GENERAL_MEDICINE: { Icon: Stethoscope, gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#0E898F", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  NURSING:     { Icon: Heart,       gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8", borderColor: "#fbcfe8" },
  HOUSEKEEPING:{ Icon: ClipboardList,gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed", borderColor: "#fed7aa" },
  AMBULANCE:   { Icon: Activity,    gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", accent: "#b91c1c", lightBg: "#fff5f5", borderColor: "#fecaca" },
  BIOMEDICAL:  { Icon: FlaskConical,gradient: "linear-gradient(135deg,#6366f1,#4338ca)", accent: "#4338ca", lightBg: "#eef2ff", borderColor: "#c7d2fe" },
  OTHER:       { Icon: Layers,      gradient: "linear-gradient(135deg,#64748b,#334155)", accent: "#334155", lightBg: "#f8fafc", borderColor: "#e2e8f0" },
};

const PROC_TYPE_COLOR: Record<string, string> = {
  DIAGNOSTIC: "#0E898F", TREATMENT: "#10b981", CONSULTATION: "#8b5cf6",
  SURGERY: "#ef4444", THERAPY: "#f97316", MEDICATION: "#06b6d4", OTHER: "#94a3b8",
};

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  SCHEDULED:   { label: "Scheduled",   bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  CONFIRMED:   { label: "Confirmed",   bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  IN_PROGRESS: { label: "In Progress", bg: "#E6F4F4", color: "#0A6B70", border: "#B3E0E0" },
  COMPLETED:   { label: "Completed",   bg: "#f0fdf4", color: "#059669", border: "#a7f3d0" },
  CANCELLED:   { label: "Cancelled",   bg: "#fff5f5", color: "#ef4444", border: "#fecaca" },
  NO_SHOW:     { label: "No Show",     bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const initials = (n: string) => (n || "SD").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
const calcAge  = (dob: string) => dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null;

const BLANK_PROC = { name:"", description:"", type:"OTHER", fee:"", duration:"", sequence:"0", isActive:true };
const BLANK_REC  = { patientId:"", patientSearch:"", procedureId:"", appointmentId:"", amount:"", notes:"", performedBy:"", status:"COMPLETED" };

const toSlug = (name: string) => (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dept";

function SubDeptDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview"|"queue"|"procedures"|"records"|"billing"|"billing-queue"|"all-bills"|"finance"|"revenue"|"doctors"|"patients"|"inventory"|"reports"|"appointments"|"dept"|"account-settings"|"staff">("overview");

  // Sync tab from URL on mount
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t as any);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the slug-based path
  const slugPath = profile ? `/subdept/${toSlug(profile.name)}/dashboard` : null;

  // Redirect to slug-based URL once profile is loaded
  useEffect(() => {
    if (!profile) return;
    const slug = toSlug(profile.name);
    const expectedPrefix = `/subdept/${slug}/dashboard`;
    if (!pathname.startsWith(expectedPrefix)) {
      const params = new URLSearchParams(searchParams.toString());
      if (tab) params.set("tab", tab);
      router.replace(`${expectedPrefix}?${params.toString()}`, { scroll: false });
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tab to URL when it changes
  useEffect(() => {
    if (tab) {
      const base = slugPath || pathname;
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${base}?${params.toString()}`, { scroll: false });
    }
  }, [tab, slugPath, pathname, router, searchParams]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Department Stock (from Central Store transfers)
  const [deptStock, setDeptStock] = useState<any>(null);
  const [deptStockLoading, setDeptStockLoading] = useState(false);

  // Queue
  const [queue, setQueue] = useState<any[]>([]);
  const [queueMeta, setQueueMeta] = useState<any>({});
  const [queueLoading, setQueueLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [queueSearch, setQueueSearch] = useState("");
  const [recordingFor, setRecordingFor] = useState<any>(null);
  const [selectedQueue, setSelectedQueue] = useState<Set<string>>(new Set());
  const [queueExportOpen, setQueueExportOpen] = useState(false);
  const [completedQueue, setCompletedQueue] = useState<any[]>([]);
  const [completedQueueSearch, setCompletedQueueSearch] = useState("");
  const [viewCompletedItem, setViewCompletedItem] = useState<any>(null);
  const [editCompletedItem, setEditCompletedItem] = useState<any>(null);
  const [editCompletedForm, setEditCompletedForm] = useState<any>({});
  const [editCompletedSaving, setEditCompletedSaving] = useState(false);
  const [deleteCompletedTarget, setDeleteCompletedTarget] = useState<any>(null);
  const [deletingCompleted, setDeletingCompleted] = useState(false);

  // Procedures CRUD
  const [procs, setProcs]             = useState<any[]>([]);
  const [procsLoading, setProcsLoading] = useState(false);
  const [showProcForm, setShowProcForm] = useState(false);
  const [editingProc, setEditingProc]   = useState<any>(null);
  const [procForm, setProcForm]         = useState<any>(BLANK_PROC);
  const [procSaving, setProcSaving]     = useState(false);
  const [procMsg, setProcMsg]           = useState("");
  const [selectedProcs, setSelectedProcs] = useState<Set<string>>(new Set());
  const [procExportOpen, setProcExportOpen] = useState(false);
  const [deleteProcTarget, setDeleteProcTarget] = useState<any>(null);
  const [deletingProc, setDeletingProc] = useState(false);
  const [showBulkDeleteProcConfirm, setShowBulkDeleteProcConfirm] = useState(false);
  const [bulkDeletingProcs, setBulkDeletingProcs] = useState(false);
  const [procSearch, setProcSearch] = useState("");

  // Upcoming Sessions
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading]   = useState(false);

  // Records
  const [records, setRecords]           = useState<any[]>([]);
  const [recordsMeta, setRecordsMeta]   = useState<any>({});
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsSearch, setRecordsSearch]   = useState("");
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordForm, setRecordForm]         = useState<any>(BLANK_REC);
  const [recordSaving, setRecordSaving]     = useState(false);
  const [recordMsg, setRecordMsg]           = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [viewingRecord, setViewingRecord]   = useState<any>(null);
  const [editingRecord, setEditingRecord]   = useState<any>(null);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("performedAt");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [exportDropdown, setExportDropdown] = useState<"all"|"selected"|null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteRunning, setBulkDeleteRunning] = useState(false);
  const [deleteRecordTarget, setDeleteRecordTarget] = useState<any>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [viewPrescription, setViewPrescription] = useState<any>(null);
  const [subDepts, setSubDepts]             = useState<any[]>([]);
  const [transferForm, setTransferForm]     = useState({ subDeptId: "", notes: "" });
  const [transferring, setTransferring]     = useState(false);

  // Reports
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Revenue / Expense tab
  const [revExpData, setRevExpData] = useState<any>(null);
  const [revExpLoading, setRevExpLoading] = useState(false);
  const [revExpPeriod, setRevExpPeriod] = useState<"today"|"week"|"month"|"all">("month");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title:"", amount:"", category:"OTHER", date: new Date().toISOString().split("T")[0], description:"" });
  const [expenseSaving, setExpenseSaving] = useState(false);

  // Reception-specific: Doctors
  const [docList, setDocList] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docSearch, setDocSearch] = useState("");

  // Reception: Recent Appointments
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentAppointmentsLoading, setRecentAppointmentsLoading] = useState(false);
  const [billingQueue, setBillingQueue] = useState<any[]>([]);
  const [billingQueueLoading, setBillingQueueLoading] = useState(false);

  // ── Reception: Load Recent Appointments ──
  const loadRecentAppointments = useCallback(async () => {
    setRecentAppointmentsLoading(true);
    const res = await fetch("/api/appointments?limit=5", { credentials: "include" }).then(r => r.json());
    if (res.success) setRecentAppointments(res.data?.appointments || res.data?.data || []);
    setRecentAppointmentsLoading(false);
  }, []);

  // ── Reception: Load Billing Queue ──
  const loadBillingQueue = useCallback(async () => {
    setBillingQueueLoading(true);
    const res = await fetch("/api/billing/queue", { credentials: "include" }).then(r => r.json());
    if (res.success) setBillingQueue(res.data || []);
    setBillingQueueLoading(false);
  }, []);

  // ── Revenue / Expense ──
  const loadRevExp = useCallback(async (period = "month") => {
    setRevExpLoading(true);
    const res = await fetch(`/api/pharmacy/revenue-expense?period=${period}`, { credentials: "include" }).then(r => r.json());
    if (res.success) setRevExpData(res.data);
    setRevExpLoading(false);
  }, []);

  useEffect(() => { if (tab === "revenue") loadRevExp(revExpPeriod); }, [tab, revExpPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load upcoming sessions ──
  const loadSessions = useCallback(async (subDeptId: string) => {
    setSessionsLoading(true);
    const res = await fetch(`/api/treatment-plans?subDepartmentId=${subDeptId}&status=ACTIVE&limit=10`, { credentials: "include" }).then(r => r.json());
    if (res.success) setUpcomingSessions(res.data?.plans || []);
    setSessionsLoading(false);
  }, []);

  // ── Load profile ──
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" }).then(r => r.json());
        if (!me.success || me.data?.role !== "SUB_DEPT_HEAD") { router.push("/login"); return; }
        setUser(me.data);
        const prof = await fetch("/api/subdept/me", { credentials: "include" }).then(r => r.json());
        if (prof.success) { 
          setProfile(prof.data); 
          if (prof.data?.id && prof.data?.type !== "RECEPTION") loadSessions(prof.data.id); 
        }
      } catch { router.push("/login"); }
      setLoading(false);
    })();
  }, [router, loadSessions]);

  // ── Listen for profile updates from AccountSettingsPanel ──
  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include", cache: "no-store", headers: { "Cache-Control": "no-cache" } }).then(r => r.json());
        if (me.success) setUser(me.data);
      } catch {}
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  // ── Load queue ──
  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    const res = await fetch("/api/subdept/queue", { credentials: "include" }).then(r => r.json());
    if (res.success) { setQueue(res.data.queue || []); setCompletedQueue(res.data.completedList || []); setQueueMeta(res.data); }
    setQueueLoading(false);
  }, []);

  useEffect(() => { if (tab === "queue") loadQueue(); }, [tab, loadQueue]);

  // ── Queue selection & export helpers ──
  const toggleSelectQueue = (id: string) => {
    setSelectedQueue(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleSelectAllQueue = () => {
    if (selectedQueue.size === filteredQueue.length) setSelectedQueue(new Set());
    else setSelectedQueue(new Set(filteredQueue.map((q: any) => q.id)));
  };
  const getQueueExportData = () => {
    const src = selectedQueue.size > 0 ? filteredQueue.filter((q: any) => selectedQueue.has(q.id)) : filteredQueue;
    const headers = ["Token", "Patient", "Patient ID", "Referred On", "Time Slot", "Referred By", "Specialization", "Referral Note", "Type", "Fee (₹)"];
    const rows = src.map((q: any) => [
      q.tokenNumber || "—", q.patient?.name || "—", q.patient?.patientId || "—",
      q.appointmentDate ? new Date(q.appointmentDate).toLocaleDateString("en-IN") : "—",
      q.timeSlot || "—", q.doctor?.name || "—", q.doctor?.specialization || q.doctor?.department || "—",
      q.subDeptNote || q.doctorNotes || "—", q.type || "—", q.consultationFee || "—",
    ]);
    return { headers, rows, count: src.length };
  };
  const exportQueuePDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const { headers, rows, count } = getQueueExportData();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16); doc.text(`${deptName} — Doctor Referrals Queue`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} referral(s)`, 14, 26);
    autoTable(doc, { head: [headers], body: rows, startY: 32, styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] } });
    doc.save(`referrals-queue-${new Date().toISOString().slice(0, 10)}.pdf`);
    setQueueExportOpen(false);
  };
  const exportQueueExcel = async () => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const { headers, rows } = getQueueExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referrals");
    XLSX.writeFile(wb, `referrals-queue-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setQueueExportOpen(false);
  };
  const exportQueueWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const { headers, rows, count } = getQueueExportData();
    const thinBorder = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
    const headerRow = new TableRow({ children: headers.map(h => new TableCell({ borders: thinBorder, shading: { fill: "0E898F" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 16, font: "Calibri" })], alignment: AlignmentType.CENTER })], width: { size: 100 / headers.length, type: WidthType.PERCENTAGE } })) });
    const dataRows = rows.map((row: any[]) => new TableRow({ children: row.map((cell: any) => new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 16, font: "Calibri" })], alignment: AlignmentType.LEFT })] })) }));
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: `${deptName} — Doctor Referrals Queue`, bold: true, size: 32, font: "Calibri" })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: `Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} referral(s)`, size: 20, color: "64748B", font: "Calibri" })], spacing: { after: 300 } }),
      new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
    ] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `referrals-queue-${new Date().toISOString().slice(0, 10)}.docx`);
    setQueueExportOpen(false);
  };

  // ── Completed record CRUD helpers ──
  const openEditCompleted = (c: any) => {
    const pr = c.procedureRecords?.[0];
    if (!pr) return;
    setEditCompletedItem(c);
    setEditCompletedForm({ amount: pr.amount || "", notes: pr.notes || "", performedBy: pr.performedBy || "", status: pr.status || "COMPLETED" });
  };
  const saveEditCompleted = async () => {
    const pr = editCompletedItem?.procedureRecords?.[0];
    if (!pr) return;
    setEditCompletedSaving(true);
    await fetch(`/api/subdept/records/${pr.id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editCompletedForm.amount) || 0, notes: editCompletedForm.notes, performedBy: editCompletedForm.performedBy, status: editCompletedForm.status }),
    });
    setEditCompletedSaving(false);
    setEditCompletedItem(null);
    await loadQueue();
  };
  const handleDeleteCompleted = async () => {
    const pr = deleteCompletedTarget?.procedureRecords?.[0];
    if (!pr) return;
    setDeletingCompleted(true);
    await fetch(`/api/subdept/records/${pr.id}`, { method: "DELETE", credentials: "include" });
    setDeletingCompleted(false);
    setDeleteCompletedTarget(null);
    await loadQueue();
  };

  // ── Load procedures (HOD's own) ──
  const loadProcs = useCallback(async () => {
    setProcsLoading(true);
    const res = await fetch("/api/subdept/procedures", { credentials: "include" }).then(r => r.json());
    if (res.success) setProcs(res.data || []);
    setProcsLoading(false);
  }, []);

  useEffect(() => { if (tab === "procedures") loadProcs(); }, [tab, loadProcs]);

  // ── Load Department Stock (from Central Store transfers) ──
  const loadDeptStock = useCallback(async () => {
    setDeptStockLoading(true);
    const res = await fetch("/api/dept-inventory", { credentials: "include" }).then(r => r.json());
    if (res.success) setDeptStock(res.data);
    setDeptStockLoading(false);
  }, []);
  useEffect(() => { if (tab === "inventory") loadDeptStock(); }, [tab, loadDeptStock]);

  // ── Load reports ──
  const loadReports = useCallback(async () => {
    setReportLoading(true);
    const res = await fetch("/api/subdept/reports", { credentials: "include" }).then(r => r.json());
    if (res.success) setReportData(res.data);
    setReportLoading(false);
  }, []);

  useEffect(() => { if (tab === "reports") loadReports(); }, [tab, loadReports]);

  // ── Load records ──
  const loadRecords = useCallback(async (search = "") => {
    setRecordsLoading(true);
    const url = `/api/subdept/records?limit=30${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(url, { credentials: "include" }).then(r => r.json());
    if (res.success) { setRecords(res.data?.data || []); setRecordsMeta(res.data?.stats || {}); }
    setRecordsLoading(false);
  }, []);

  useEffect(() => { if (tab === "records") loadRecords(); }, [tab, loadRecords]);

  // Load subdepartments for transfer
  useEffect(() => {
    fetch("/api/config/subdepartments?limit=50", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setSubDepts(d.data?.data || d.data || []); })
      .catch(() => {});
  }, []);

  // ── Reception: Load Doctors ──
  const loadDoctors = useCallback(async (search = "") => {
    setDocLoading(true);
    let url = `/api/config/doctors?limit=50`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url, { credentials: "include" }).then(r => r.json());
    if (res.success) setDocList(res.data?.doctors || res.data?.data || res.data || []);
    setDocLoading(false);
  }, []);

  useEffect(() => { if (tab === "doctors") loadDoctors(docSearch); }, [tab, loadDoctors]);

  useEffect(() => {
    if (tab === "overview" && profile?.type === "RECEPTION") {
      loadRecentAppointments();
      loadBillingQueue();
    }
  }, [tab, profile, loadRecentAppointments, loadBillingQueue]);

  // ── Procedure CRUD ──
  const openAddProc  = () => { setEditingProc(null); setProcForm(BLANK_PROC); setProcMsg(""); setShowProcForm(true); };
  const openEditProc = (p: any) => { setEditingProc(p); setProcForm({ name:p.name, description:p.description||"" , type:p.type, fee:p.fee??"" , duration:p.duration??"" , sequence:p.sequence??0, isActive:p.isActive }); setProcMsg(""); setShowProcForm(true); };

  const saveProc = async () => {
    if (!procForm.name.trim()) { setProcMsg("Name is required"); return; }
    setProcSaving(true); setProcMsg("");
    const url = editingProc ? `/api/subdept/procedures/${editingProc.id}` : "/api/subdept/procedures";
    const method = editingProc ? "PUT" : "POST";
    const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(procForm) }).then(r => r.json());
    if (res.success) { setShowProcForm(false); await loadProcs(); }
    else setProcMsg(res.message || "Failed to save");
    setProcSaving(false);
  };

  const deleteProc = async (id: string) => {
    if (!confirm("Delete this procedure?")) return;
    await fetch(`/api/subdept/procedures/${id}`, { method: "DELETE", credentials: "include" });
    await loadProcs();
  };

  const toggleProcActive = async (p: any) => {
    await fetch(`/api/subdept/procedures/${p.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
    await loadProcs();
  };

  // ── Procedure selection & export helpers ──
  const toggleSelectProc = (id: string) => {
    setSelectedProcs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleSelectAllProcs = () => {
    if (selectedProcs.size === filteredProcs.length) setSelectedProcs(new Set());
    else setSelectedProcs(new Set(filteredProcs.map((p: any) => p.id)));
  };
  const handleDeleteSingleProc = async () => {
    if (!deleteProcTarget) return;
    setDeletingProc(true);
    await fetch(`/api/subdept/procedures/${deleteProcTarget.id}`, { method: "DELETE", credentials: "include" });
    selectedProcs.delete(deleteProcTarget.id);
    setSelectedProcs(new Set(selectedProcs));
    setDeleteProcTarget(null);
    setDeletingProc(false);
    await loadProcs();
  };
  const bulkDeleteProcs = async () => {
    setBulkDeletingProcs(true);
    for (const id of selectedProcs) {
      await fetch(`/api/subdept/procedures/${id}`, { method: "DELETE", credentials: "include" });
    }
    setSelectedProcs(new Set());
    setShowBulkDeleteProcConfirm(false);
    setBulkDeletingProcs(false);
    await loadProcs();
  };
  const getProcExportData = () => {
    const src = selectedProcs.size > 0 ? displayProcs.filter((p: any) => selectedProcs.has(p.id)) : filteredProcs;
    const headers = ["#", "Name", "Description", "Type", "Fee (₹)", "Duration (min)", "Status"];
    const rows = src.map((p: any, i: number) => [
      i + 1, p.name || "", p.description || "", p.type || "",
      p.fee != null ? p.fee : "—", p.duration || "—", p.isActive ? "Active" : "Inactive",
    ]);
    return { headers, rows, count: src.length };
  };
  const exportProcPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const { headers, rows, count } = getProcExportData();
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`${deptName} — Procedure Catalog`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} procedure(s)`, 14, 26);
    autoTable(doc, { head: [headers], body: rows, startY: 32, styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] } });
    doc.save(`procedures-${new Date().toISOString().slice(0, 10)}.pdf`);
    setProcExportOpen(false);
  };
  const exportProcExcel = async () => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const { headers, rows } = getProcExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Procedures");
    XLSX.writeFile(wb, `procedures-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setProcExportOpen(false);
  };
  const exportProcWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const { headers, rows, count } = getProcExportData();
    const thinBorder = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
    const headerRow = new TableRow({ children: headers.map(h => new TableCell({ borders: thinBorder, shading: { fill: "0E898F" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER })], width: { size: 100 / headers.length, type: WidthType.PERCENTAGE } })) });
    const dataRows = rows.map((row: any[]) => new TableRow({ children: row.map((cell: any) => new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18, font: "Calibri" })], alignment: AlignmentType.LEFT })] })) }));
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: `${deptName} — Procedure Catalog`, bold: true, size: 32, font: "Calibri" })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: `Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} procedure(s)`, size: 20, color: "64748B", font: "Calibri" })], spacing: { after: 300 } }),
      new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
    ] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `procedures-${new Date().toISOString().slice(0, 10)}.docx`);
    setProcExportOpen(false);
  };

  // ── Patient search for record form ──
  const searchPatients = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setPatientResults([]); return; }
    const res = await fetch(`/api/patients?search=${encodeURIComponent(q)}&limit=8`, { credentials: "include" }).then(r => r.json());
    if (res.success) setPatientResults(res.data?.patients || res.data || []);
  }, []);

  // ── Save record ──
  const saveRecord = async () => {
    if (!recordForm.patientId || !recordForm.procedureId || !recordForm.amount) { setRecordMsg("Patient, procedure and amount are required"); return; }
    setRecordSaving(true); setRecordMsg("");
    const res = await fetch("/api/subdept/records", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(recordForm) }).then(r => r.json());
    if (res.success) { setShowRecordForm(false); setRecordForm(BLANK_REC); setRecordingFor(null); await loadRecords(); }
    else setRecordMsg(res.message || "Failed to save");
    setRecordSaving(false);
  };

  // ── Edit record ──
  const handleEditRecord = async (recordId: string, updates: any) => {
    const res = await fetch(`/api/subdept/records/${recordId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    }).then(r => r.json());
    
    if (res.success) {
      setEditingRecord(null);
      await loadRecords();
    } else {
      alert(res.message || "Failed to update record");
    }
  };

  // ── Transfer patient ──
  const handleTransferPatient = async (record: any, transferData: any) => {
    if (!record.appointment?.id) {
      alert("Cannot transfer: No appointment linked to this record");
      return;
    }

    const res = await fetch(`/api/appointments/${record.appointment.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subDepartmentId: transferData.subDeptId,
        subDeptNote: transferData.notes || `Transferred from ${profile?.name || "previous department"}`
      })
    }).then(r => r.json());

    if (res.success) {
      setTransferTarget(null);
      setTransferForm({ subDeptId: "", notes: "" });
      alert(`Patient ${record.patient?.name} transferred successfully!`);
    } else {
      alert(res.message || "Failed to transfer patient");
    }
  };

  // ── Records: selection helpers ──
  const toggleSelectRecord = (id: string) => {
    setSelectedRecords(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleSelectAll = () => {
    if (selectedRecords.size === sortedRecords.length) setSelectedRecords(new Set());
    else setSelectedRecords(new Set(sortedRecords.map((r: any) => r.id)));
  };
  const bulkDeleteRecords = async () => {
    setBulkDeleteRunning(true);
    for (const id of selectedRecords) {
      await fetch(`/api/subdept/records/${id}`, { method: "DELETE", credentials: "include" });
    }
    setSelectedRecords(new Set());
    setShowBulkDeleteConfirm(false);
    setBulkDeleteRunning(false);
    await loadRecords(recordsSearch);
  };
  const handleDeleteSingleRecord = async () => {
    if (!deleteRecordTarget) return;
    setDeletingRecord(true);
    const res = await fetch(`/api/subdept/records/${deleteRecordTarget.id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    if (res.success) {
      selectedRecords.delete(deleteRecordTarget.id);
      setSelectedRecords(new Set(selectedRecords));
      setDeleteRecordTarget(null);
      await loadRecords(recordsSearch);
    } else { alert(res.message || "Failed to delete record"); }
    setDeletingRecord(false);
  };
  const getExportData = (mode: "all" | "selected") => {
    const src = mode === "selected" ? records.filter((r: any) => selectedRecords.has(r.id)) : sortedRecords;
    const headers = ["Date", "Patient", "Patient ID", "Procedure", "Type", "Amount (₹)", "Performed By", "Status", "Notes"];
    const rows = src.map((r: any) => [
      new Date(r.performedAt).toLocaleDateString("en-IN"),
      r.patient?.name || "", r.patient?.patientId || "",
      r.procedure?.name || "", r.procedure?.type || "",
      r.amount || 0, r.performedBy || "", r.status?.replace(/_/g, " ") || "", r.notes || "",
    ]);
    return { headers, rows, count: src.length };
  };

  const exportExcel = async (mode: "all" | "selected") => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const { headers, rows } = getExportData(mode);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    XLSX.writeFile(wb, `records-${mode}-${new Date().toISOString().slice(0,10)}.xlsx`);
    setExportDropdown(null);
  };

  const exportPDF = async (mode: "all" | "selected") => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const { headers, rows, count } = getExportData(mode);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(`${deptName} — Procedure Records`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} record(s)`, 14, 26);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 32,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`records-${mode}-${new Date().toISOString().slice(0,10)}.pdf`);
    setExportDropdown(null);
  };

  const exportWord = async (mode: "all" | "selected") => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const { headers, rows, count } = getExportData(mode);
    const thinBorder = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
    const headerRow = new TableRow({
      children: headers.map(h => new TableCell({
        borders: thinBorder,
        shading: { fill: "0E898F" },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER })],
        width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
      })),
    });
    const dataRows = rows.map((row: any[]) => new TableRow({
      children: row.map((cell: any) => new TableCell({
        borders: thinBorder,
        children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18, font: "Calibri" })], alignment: AlignmentType.LEFT })],
      })),
    }));
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: `${deptName} — Procedure Records`, bold: true, size: 32, font: "Calibri" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: `Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} record(s)`, size: 20, color: "64748B", font: "Calibri" })], spacing: { after: 300 } }),
          new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `records-${mode}-${new Date().toISOString().slice(0,10)}.docx`);
    setExportDropdown(null);
  };
  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const meta       = SUB_DEPT_META[profile?.type || "OTHER"] || SUB_DEPT_META.OTHER;
  const { Icon: DeptIcon } = meta;
  const profileProcs: any[] = profile?.procedures || [];
  const activeProcs   = procs.length > 0 ? procs.filter((p: any) => p.isActive) : profileProcs.filter((p: any) => p.isActive);
  const displayProcs  = procs.length > 0 ? procs : profileProcs;
  const filteredProcs = procSearch
    ? displayProcs.filter((p: any) => p.name?.toLowerCase().includes(procSearch.toLowerCase()) || p.type?.toLowerCase().includes(procSearch.toLowerCase()) || p.description?.toLowerCase().includes(procSearch.toLowerCase()))
    : displayProcs;
  const pendingBillingQueue = billingQueue.filter((item: any) => item.bill?.status !== "PAID");
  const hodName       = profile?.hodName || user?.name || "HOD";
  const deptName      = (profile?.type === "OTHER" && profile?.customName) ? profile.customName : (profile?.name || "Sub-Department");
  const today         = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  // Sorted records
  const sortedRecords = [...records].sort((a: any, b: any) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "performedAt") return dir * (new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());
    if (sortField === "patient") return dir * ((a.patient?.name || "").localeCompare(b.patient?.name || ""));
    if (sortField === "procedure") return dir * ((a.procedure?.name || "").localeCompare(b.procedure?.name || ""));
    if (sortField === "type") return dir * ((a.procedure?.type || "").localeCompare(b.procedure?.type || ""));
    if (sortField === "amount") return dir * ((a.amount || 0) - (b.amount || 0));
    if (sortField === "performedBy") return dir * ((a.performedBy || "").localeCompare(b.performedBy || ""));
    if (sortField === "status") return dir * ((a.status || "").localeCompare(b.status || ""));
    return 0;
  });

  // Type-based predefined tabs
  const deptType = profile?.type || "OTHER";
  const TYPE_TABS: Record<string, string[]> = {
    DENTAL:           ["overview","queue","procedures","records","inventory","reports","dept"],
    DERMATOLOGY:      ["overview","queue","procedures","records","inventory","reports","dept"],
    HAIR:             ["overview","queue","procedures","records","inventory","reports","dept"],
    ONCOLOGY:         ["overview","queue","procedures","records","inventory","reports","dept"],
    CARDIOLOGY:       ["overview","queue","procedures","records","inventory","reports","dept"],
    COSMETIC:         ["overview","queue","procedures","records","inventory","reports","dept"],
    PHYSIOTHERAPY:    ["overview","queue","procedures","records","inventory","reports","dept"],
    DIALYSIS:         ["overview","queue","procedures","records","inventory","reports","dept"],
    GYNECOLOGY:       ["overview","queue","procedures","records","inventory","reports","dept"],
    PEDIATRICS:       ["overview","queue","procedures","records","inventory","reports","dept"],
    RECEPTION:        ["overview","appointments","billing","patients","doctors","inventory","reports","dept"],
    PHARMACY:         ["overview","queue","inventory","billing","revenue","reports","dept"],
    NURSING:          ["overview","inventory","dept"],
    HOUSEKEEPING:     ["overview","inventory","dept"],
    AMBULANCE:        ["overview","inventory","dept"],
    BIOMEDICAL:       ["overview","inventory","dept"],
    BILLING:          ["overview","billing-queue","finance","inventory","reports","dept"],
    PATHOLOGY:        ["overview","orders","samples","results","reports","revenue","tests","panels","analytics"],
    RADIOLOGY:        ["overview","queue","records","reports","dept"],
    LABORATORY:       ["overview","queue","records","reports","dept"],
    BLOOD_BANK:       ["overview","queue","records","reports","dept"],
    ECG:              ["overview","queue","records","reports","dept"],
    ENDOSCOPY:        ["overview","queue","records","reports","dept"],
    ICU:              ["overview","queue","records","reports","dept"],
    EMERGENCY:        ["overview","queue","records","reports","dept"],
    IPD:              ["overview","queue","records","reports","dept"],
    OPD:              ["overview","appointments","queue","patients","consultations","records","reports","dept"],
    GENERAL_MEDICINE: ["overview","appointments","queue","patients","consultations","records","reports","dept"],
    OT:               ["overview","queue","procedures","records","reports","dept"],
    SURGERY:          ["overview","queue","procedures","records","reports","dept"],
    CLINICAL_PROCEDURE:["overview","queue","procedures","records","reports","dept"],
    HR:               ["overview","staff","doctors"],
    ACCOUNTS:         ["overview","queue","procedures","records","reports","dept"],
    PROCEDURE:        ["overview","queue","procedures","records","inventory","reports","dept"],
    OTHER:            ["overview","queue","procedures","records","inventory","reports","dept"],
    CUSTOM:           ["overview","queue","procedures","records","inventory","reports","dept"],
  };
  const enabledTabs = new Set(TYPE_TABS[deptType] || TYPE_TABS.OTHER);

  const allNavItems: {id:string;label:string;icon:any;badge?:any}[] = [
    { id: "overview",      label: "Overview",           icon: <LayoutDashboard size={16}/> },
    { id: "queue",         label: deptType === "PHARMACY" ? "Rx Queue" : ["OPD","GENERAL_MEDICINE"].includes(deptType) ? "Queue / Tokens" : "Referrals Today", icon: <UserCheck size={16}/>, badge: queue.length || null },
    { id: "consultations",  label: "Consultations",       icon: <Stethoscope size={16}/> },
    { id: "procedures",    label: "Procedures",         icon: <ClipboardList size={16}/> },
    { id: "records",       label: "Patient Records",    icon: <IndianRupee size={16}/>,    badge: recordsMeta.todayRecords || null },
    { id: "appointments",  label: "Appointments",       icon: <CalendarDays size={16}/> },
    { id: "billing",       label: "Billing",            icon: <Receipt size={16}/> },
    { id: "billing-queue",  label: "Billing Queue",      icon: <CreditCard size={16}/> },
    
    { id: "patients",      label: "Patient Management", icon: <Users size={16}/> },
    { id: "doctors",       label: "Doctors",            icon: <Stethoscope size={16}/> },
    { id: "inventory",     label: "Inventory",          icon: <Package size={16}/> },
        { id: "staff",          label: "Staff Management",   icon: <Users size={16}/> },
    { id: "purchases",    label: "Purchases",          icon: <Package size={16}/> },
    { id: "reports",       label: deptType==="PATHOLOGY" ? "Report & Deliver" : "Reports", icon: <BarChart2 size={16}/> },
    { id: "revenue",       label: "Revenue / Expense",  icon: <IndianRupee size={16}/> },
    { id: "finance",       label: "Finance",            icon: <TrendingUp size={16}/> },
    // Pathology LIS tabs
    { id: "orders",        label: "Lab Orders",        icon: <ClipboardList size={16}/> },
    { id: "samples",       label: "Sample Collections", icon: <FlaskConical size={16}/> },
    { id: "results",       label: "Result Entry",       icon: <Activity size={16}/> },
    { id: "tests",         label: "Test Master",        icon: <TestTube2 size={16}/> },
    { id: "panels",        label: "Test Panels",        icon: <Layers size={16}/> },
    { id: "analytics",     label: "Analytics",          icon: <TrendingUp size={16}/> },
    { id: "dept",          label: deptType==="PATHOLOGY" ? "Settings" : "Department", icon: <Building2 size={16}/> },
  ];
  const navItems = (TYPE_TABS[deptType] || TYPE_TABS.OTHER)
    .map(id => allNavItems.find(n => n.id === id))
    .filter(Boolean) as {id:string;label:string;icon:any;badge?:any}[];

  const filteredQueue = queue.filter(q => {
    return !queueSearch ||
      q.patient?.name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      q.patient?.patientId?.toLowerCase().includes(queueSearch.toLowerCase()) ||
      String(q.tokenNumber || "").includes(queueSearch);
  });

  const TAB_TITLES: Record<string,string> = {"billing-queue":"Billing Queue","all-bills":"All Bills",overview:"Overview",queue:"Patient Queue",procedures:"Procedures",records:"Patient Records",appointments:"Appointments",billing:"Billing",finance:"Finance",doctors:"Doctors",patients:"Patient Management",inventory:"Inventory",reports:"Reports",revenue:"Revenue",dept:"Department Info",staff:"Staff Management"};

  return (
    <>
      <Preloader loading={loading} />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        body{font-family:'Inter',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .sd2{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0f4f8}
        .sd2-sb{width:224px;background:#fff;border-right:1px solid var(--bc);display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04)}
        .sd2-logo{padding:18px 20px 14px;border-bottom:1px solid var(--bc);display:flex;flex-direction:column;align-items:center;gap:8px}
        .sd2-logo-ic{width:52px;height:52px;border-radius:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.08);flex-shrink:0;overflow:hidden;background:#fff;border:1px solid #e2e8f0}
        .sd2-logo-ic img{width:100%;height:100%;object-fit:contain}
        .sd2-logo-ic.no-logo{background:var(--grad);border:none;box-shadow:0 4px 12px rgba(0,0,0,.15)}
        .sd2-nav{flex:1;padding:12px;overflow-y:auto}
        .sd2-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:10px 0 5px}
        .sd2-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .sd2-nb:hover{background:var(--lbg);color:var(--acc)}
        .sd2-nb.on{background:var(--lbg);color:var(--acc);font-weight:600}
        .sd2-nb-dot{display:none;width:3px;height:20px;background:var(--acc);border-radius:4px;position:absolute;left:0}
        .sd2-nb.on .sd2-nb-dot{display:block}
        .sd2-nb svg{color:#94a3b8;flex-shrink:0;transition:color .15s}
        .sd2-nb.on svg,.sd2-nb:hover svg{color:var(--acc)}
        .sd2-foot{padding:14px 16px 18px;border-top:1px solid var(--bc)}
        .sd2-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:var(--lbg);border:1px solid var(--bc);margin-bottom:10px}
        .sd2-av{width:34px;height:34px;border-radius:9px;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .sd2-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .sd2-logout:hover{background:#fee2e2}
        .sd2-main{margin-left:224px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .sd2-topbar{height:64px;background:#fff;border-bottom:1px solid var(--bc);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .sd2-search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:260px}
        .sd2-search input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .sd2-search input::placeholder{color:#94a3b8}
        .sd2-body{padding:24px;overflow-y:auto;animation:fadeUp .35s ease}
        .sd2-card{background:#fff;border-radius:14px;border:1px solid var(--bc);box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;margin-bottom:18px}
        .sd2-card-hd{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .sd2-card-title{font-size:14px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px}
        .sd2-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid var(--bc);display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:transform .2s,box-shadow .2s}
        .sd2-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
        .sd2-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700}
        .sd2-tbl{width:100%;border-collapse:collapse}
        .sd2-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:10px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .sd2-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .sd2-tbl tbody tr:hover td{background:#fafbff}
        .sd2-tbl tbody tr:last-child td{border-bottom:none}
        .sd2-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:8px;border:none;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
        .sd2-q-row{border-bottom:1px solid #f1f5f9;transition:background .15s}
        .sd2-q-row:hover{background:#fafbff}
        .sd2-q-row:last-child{border-bottom:none}
        .sd2-expand{background:#f8fafc;border-top:1px solid #f1f5f9;padding:14px 18px;animation:fadeUp .2s ease}
        .sd2-flow-step{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:#475569}
        .sd2-flow-arrow{color:#94a3b8;font-size:11px}
        .sd2-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700}
        .hd-center{padding:0;overflow:visible}
        .hd-pg-title{font-size:18px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
        .hd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        .hd-stat{background:#fff;border-radius:14px;padding:18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .hd-stat-ico{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .hd-stat-num{font-size:22px;font-weight:800;color:#1e293b}
        .hd-stat-lbl{font-size:11px;color:#94a3b8;margin-top:2px}
        .hd-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:18px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .hd-card-hd{padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .hd-table{width:100%;border-collapse:collapse}
        .hd-table th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:10px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .hd-table td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .hd-table tbody tr:hover td{background:#fafbff}
      `}</style>

      <div className="sd2" style={{"--grad":meta.gradient,"--acc":meta.accent,"--lbg":meta.lightBg,"--bc":meta.borderColor} as any}>

        {/* ── Sidebar ── */}
        <aside className="sd2-sb">
          <div className="sd2-logo">
            {profile?.hospitalSettings?.logo ? (
              <img src={profile.hospitalSettings.logo} alt="Hospital Logo" style={{ width: "100%", maxHeight: 60, objectFit: "contain", display: "block" }} />
            ) : (
              <div className="sd2-logo-ic no-logo">
                <DeptIcon size={22} color="#fff"/>
              </div>
            )}
          </div>

          <nav className="sd2-nav">
            <div className="sd2-nav-sec">Navigation</div>
            {navItems.map(n => (
              <button key={n.id} className={`sd2-nb${tab===n.id?" on":""}`} onClick={()=>setTab(n.id as any)}>
                <div className="sd2-nb-dot"/>
                <span style={{display:"flex"}}>{n.icon}</span>
                {n.label}
                {n.badge ? <span style={{marginLeft:"auto",minWidth:18,height:18,borderRadius:9,background:meta.accent,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{n.badge}</span> : null}
              </button>
            ))}

          </nav>

          <div className="sd2-foot">
            <div className="sd2-user">
              <div className="sd2-av">{initials(hodName)}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hodName}</div>
                <div style={{fontSize:10,fontWeight:500,color:meta.accent}}>Sub-Dept Head</div>
              </div>
            </div>
            <button className="sd2-logout" onClick={logout}><LogOut size={13}/>Log Out</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="sd2-main">

          {/* Top Bar */}
          <header className="sd2-topbar">
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{TAB_TITLES[tab] || "Overview"}</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{today}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              
              <NotificationBell 
                accentColor={meta.accent} 
                bgColor={meta.lightBg} 
                borderColor={meta.borderColor} 
                types={profile?.type === "PHARMACY" 
                  ? ["NEW_PRESCRIPTION","PRESCRIPTION_COMPLETED","LOW_STOCK","EXPIRING_MEDICINE","BILLING_TRANSFER"] 
                  : ["PROCEDURE_COMPLETED","APPOINTMENT_UPDATED"]
                } 
              />
              <div 
                style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:10,background:meta.lightBg,border:`1px solid ${meta.borderColor}`,cursor:"pointer",position:"relative"}}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{initials(hodName)}</div>
                <div><div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{hodName.split(" ")[0]}</div><div style={{fontSize:10,color:meta.accent}}>HOD</div></div>
                <ChevronDown size={14} color="#64748b" />
                
                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <>
                    <div 
                      style={{ position: "fixed", inset: 0, zIndex: 60 }} 
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: 200,
                      background: "#fff",
                      borderRadius: 12,
                      border: `1px solid ${meta.borderColor}`,
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      zIndex: 70,
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: 16, borderBottom: `1px solid ${meta.borderColor}` }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{hodName}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); setTab("account-settings" as any); }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#475569",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = meta.lightBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <Settings size={16} color="#64748b" />
                          Account Settings
                        </button>
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); logout(); }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.15s",
                            marginTop: 4,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <LogOut size={16} color="#ef4444" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="sd2-body">

            {/* ═══════════════════ SUPPORT DEPARTMENT DASHBOARDS ═══════════════════ */}
            {deptType === "PATHOLOGY" && tab !== "dept" && tab !== "account-settings" ? (
              <PathologyDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} />
            ) : tab === "account-settings" ? (
              <AccountSettingsPanelLazy user={user} />
            ) : deptType === "PHARMACY" && tab !== "dept" ? (
              <PharmacyDashboardLazy profile={profile} user={user} activeTab={tab} />
            ) : deptType === "NURSING" ? (
              <NursingDashboardLazy profile={profile} user={user} />
            ) : deptType === "HOUSEKEEPING" ? (
              <HousekeepingDashboardLazy profile={profile} user={user} />
            ) : deptType === "AMBULANCE" ? (
              <AmbulanceDashboardLazy profile={profile} user={user} />
            ) : deptType === "BIOMEDICAL" ? (
              <BiomedicalDashboardLazy profile={profile} user={user} />
            ) : ["OPD","GENERAL_MEDICINE"].includes(deptType) ? (
              <OPDDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} meta={meta} />
            ) : deptType === "HR" && ["overview","staff","doctors"].includes(tab) ? (
              <HRDepartmentDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} meta={meta} />
            ) : deptType === "BILLING" && ["overview","billing-queue","finance","inventory"].includes(tab) ? (
              <BillingDepartmentDashboardLazy profile={profile} user={user} activeTab={tab} onTabChange={(t: string) => setTab(t as any)} meta={meta} />
            ) : (<>

            {/* ═══════════════════ OVERVIEW ═══════════════════ */}
            {tab==="overview" && (<>
              {/* Hero Banner */}
              <div style={{background:meta.gradient,borderRadius:18,padding:"26px 28px",marginBottom:20,color:"#fff",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:-20,top:-20,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
                <div style={{position:"absolute",right:70,bottom:-35,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
                <div style={{position:"relative",display:"flex",alignItems:"center",gap:20}}>
                  <div style={{width:60,height:60,borderRadius:16,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <DeptIcon size={28} color="#fff"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",opacity:.75,marginBottom:4}}>{profile?.type?.replace(/_/g," ")} Department</div>
                    <h1 style={{fontSize:24,fontWeight:800,marginBottom:4,lineHeight:1.2}}>{deptName}</h1>
                    {profile?.description && <p style={{fontSize:13,opacity:.82,maxWidth:520}}>{profile.description}</p>}
                  </div>
                  <div style={{flexShrink:0,textAlign:"right", display:"flex", gap:10}}>
                    <button 
                      onClick={() => setTab("billing")} 
                      style={{
                        background: "rgba(255,255,255,.2)", 
                        padding: "10px 18px", 
                        borderRadius: 100, 
                        fontSize: 13, 
                        fontWeight: 700, 
                        border: "1px solid rgba(255,255,255,.3)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        backdropFilter: "blur(4px)"
                      }}
                    >
                      <Receipt size={16} />
                      Collect Bill
                    </button>
                    <button 
                      onClick={() => setTab("appointments")} 
                      style={{
                        background: meta.accent, 
                        padding: "10px 18px", 
                        borderRadius: 100, 
                        fontSize: 13, 
                        fontWeight: 700, 
                        border: "1px solid rgba(255,255,255,.3)",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                      }}
                    >
                      <CalendarDays size={16} />
                      Book Appointment
                    </button>
                  </div>
                </div>
                {profile?.flow && (
                  <div style={{marginTop:16,display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
                    {profile.flow.split("→").map((step: string, i: number, arr: string[]) => (
                      <span key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{background:"rgba(255,255,255,.15)",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{step.trim()}</span>
                        {i < arr.length-1 && <ChevronRight size={12} color="rgba(255,255,255,.7)"/>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
                {(profile?.type === "RECEPTION" ? [
                  { label:"Today's Appts", value:recentAppointments.length, Icon:CalendarDays, color:meta.accent, bg:meta.lightBg,
                    onClick:()=>setTab("appointments") },
                  { label:"Pending Bills", value:pendingBillingQueue.length, Icon:Clock, color:"#f59e0b", bg:"#fffbeb",
                    onClick:()=>setTab("billing") },
                  { label:"New Patients Today", value:recordsMeta.todayRecords||0, Icon:UserPlus, color:"#10b981", bg:"#f0fdf4",
                    onClick:()=>setTab("patients") },
                  { label:"Billing Today",     value:`₹${(recordsMeta.todayRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#10b981", bg:"#f0fdf4",
                    onClick:()=>setTab("billing") },
                  { label:"Total Records",     value:recordsMeta.totalRecords||0, Icon:Layers, color:"#6366f1", bg:"#eef2ff",
                    onClick:()=>setTab("records") },
                  { label:"Total Revenue",     value:`₹${(recordsMeta.totalRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#059669", bg:"#f0fdf4",
                    onClick:()=>setTab("records") },
                ] : [
                  { label:"Active Procedures", value:activeProcs.length, Icon:ClipboardList, color:meta.accent, bg:meta.lightBg },
                  { label:"Total Procedures",  value:displayProcs.length, Icon:Layers,       color:"#6366f1",  bg:"#eef2ff" },
                  { label:"Referrals Today",   value:queue.length||"—",  Icon:UserCheck,     color:"#10b981",  bg:"#f0fdf4",
                    onClick:()=>{setTab("queue");loadQueue();} },
                  { label:"Records Today",     value:recordsMeta.todayRecords||0, Icon:ClipboardList, color:"#f59e0b", bg:"#fffbeb",
                    onClick:()=>{setTab("records");loadRecords();} },
                  { label:"Total Records",     value:recordsMeta.totalRecords||0, Icon:Layers, color:"#6366f1", bg:"#eef2ff",
                    onClick:()=>{setTab("records");loadRecords();} },
                  { label:"Today Revenue",     value:`₹${(recordsMeta.todayRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#10b981", bg:"#f0fdf4",
                    onClick:()=>{setTab("records");loadRecords();} },
                  { label:"Total Revenue",     value:`₹${(recordsMeta.totalRevenue||0).toLocaleString("en-IN")}`, Icon:IndianRupee, color:"#059669", bg:"#f0fdf4",
                    onClick:()=>{setTab("records");loadRecords();} },
                ]).map((s,i)=>{
                  const SI = s.Icon;
                  return (
                    <div key={i} className="sd2-sc" onClick={s.onClick} style={{cursor:s.onClick?"pointer":"default", padding: 14, gap: 12}}>
                      <div style={{width:38,height:38,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <SI size={18} color={s.color}/>
                      </div>
                      <div>
                        <div style={{fontSize:20,fontWeight:800,color:"#1e293b"}}>{s.value}</div>
                        <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom: Recent Activity for Reception */}
              {profile?.type === "RECEPTION" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18, marginTop: 18}}>
                  {/* Recent Appointments */}
                  <div className="sd2-card">
                    <div className="sd2-card-hd">
                      <span className="sd2-card-title"><CalendarDays size={15} color={meta.accent}/>Recent Appointments</span>
                      <span style={{fontSize:11,color:"#94a3b8"}}>{recentAppointments.length} most recent</span>
                    </div>
                    <div style={{padding:"10px 0"}}>
                      {recentAppointmentsLoading ? (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                          <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading...
                        </div>
                      ) : recentAppointments.length > 0 ? (
                        recentAppointments.map((a: any) => (
                          <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 18px",borderBottom:"1px solid #f8fafc"}}>
                            <div style={{width:32,height:32,borderRadius:8,background:meta.lightBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <User size={14} color={meta.accent}/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{a.patient?.name}</div>
                              <div style={{fontSize:11,color:"#64748b"}}>{a.doctor?.name} · {a.timeSlot}</div>
                            </div>
                            <span style={{
                              fontSize:10,padding:"2px 8px",borderRadius:100,
                              background:STATUS_CFG[a.status]?.bg || "#f1f5f9",
                              color:STATUS_CFG[a.status]?.color || "#475569",
                              fontWeight:700,border:`1px solid ${STATUS_CFG[a.status]?.border || "#e2e8f0"}`
                            }}>
                              {STATUS_CFG[a.status]?.label || a.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13}}>No recent appointments found</div>
                      )}
                      {recentAppointments.length > 0 && (
                        <div style={{padding:"10px 18px",fontSize:12,color:meta.accent,fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("appointments")}>View all appointments →</div>
                      )}
                    </div>
                  </div>

                  {/* Pending Billing Queue */}
                  <div className="sd2-card">
                    <div className="sd2-card-hd">
                      <span className="sd2-card-title"><Receipt size={15} color="#f59e0b"/>Pending Bills</span>
                      <span style={{fontSize:11,color:"#94a3b8"}}>{pendingBillingQueue.length} pending</span>
                    </div>
                    <div style={{padding:"10px 0"}}>
                      {billingQueueLoading ? (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                          <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading...
                        </div>
                      ) : pendingBillingQueue.length > 0 ? (
                        pendingBillingQueue.slice(0, 5).map((item: any) => (
                          <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 18px",borderBottom:"1px solid #f8fafc"}}>
                            <div style={{width:32,height:32,borderRadius:8,background:"#fffbeb",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <IndianRupee size={14} color="#f59e0b"/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{item.patient?.name}</div>
                              <div style={{fontSize:11,color:"#64748b"}}>{item.doctor?.name} · {item.timeSlot}</div>
                            </div>
                            <div style={{textAlign: "right"}}>
                              <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>₹{(item.bill?.total || item.consultationFee || 0).toLocaleString()}</div>
                              <div style={{
                                fontSize: 10, 
                                fontWeight: 700,
                                color: item.bill?.status === "PARTIALLY_PAID" ? "#b45309" : "#c2410c",
                                background: item.bill?.status === "PARTIALLY_PAID" ? "#fef3c7" : "#fff7ed",
                                padding: "2px 6px",
                                borderRadius: 4,
                                marginTop: 2,
                                display: "inline-block"
                              }}>
                                {item.bill?.status === "PARTIALLY_PAID" ? "Partial" : "Pending"}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13}}>No pending bills in queue</div>
                      )}
                      {pendingBillingQueue.length > 0 && (
                        <div style={{padding:"10px 18px",fontSize:12,color:meta.accent,fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("billing")}>Go to billing queue →</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom: Procedures preview + HOD (For Non-Reception) */}
              {profile?.type !== "RECEPTION" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:18}}>
                  <div className="sd2-card">
                    <div className="sd2-card-hd">
                      <span className="sd2-card-title"><ClipboardList size={15} color={meta.accent}/>Procedure Catalog</span>
                      <span style={{fontSize:11,color:"#94a3b8"}}>{activeProcs.length} active / {procs.length} total</span>
                    </div>
                    <div style={{padding:"10px 0"}}>
                      {displayProcs.slice(0,6).map((p:any)=>(
                        <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 18px",borderBottom:"1px solid #f8fafc"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:PROC_TYPE_COLOR[p.type]||"#94a3b8",flexShrink:0}}/>
                          <div style={{flex:1,fontSize:13,fontWeight:500,color:p.isActive?"#334155":"#94a3b8"}}>{p.name}</div>
                          <span style={{fontSize:10,padding:"2px 7px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontWeight:700}}>{p.type}</span>
                          {p.fee!=null && <span style={{fontSize:11,fontWeight:700,color:"#10b981",minWidth:40,textAlign:"right"}}>₹{p.fee}</span>}
                        </div>
                      ))}
                      {displayProcs.length>6 && <div style={{padding:"10px 18px",fontSize:12,color:meta.accent,fontWeight:600,cursor:"pointer"}} onClick={()=>setTab("procedures")}>View all {displayProcs.length} procedures →</div>}
                      {displayProcs.length===0 && <div style={{padding:"32px",textAlign:"center",color:"#94a3b8",fontSize:13}}>No procedures configured yet</div>}
                    </div>
                  </div>
                  
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {/* HOD */}
                    <div className="sd2-card">
                      <div className="sd2-card-hd"><span className="sd2-card-title"><User size={14} color={meta.accent}/>Head of Department</span></div>
                      <div style={{padding:"16px"}}>
                        {profile?.hodName ? (<>
                          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                            <div style={{width:46,height:46,borderRadius:12,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff"}}>{initials(profile.hodName)}</div>
                            <div>
                              <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{profile.hodName}</div>
                              <div style={{fontSize:11,color:"#94a3b8"}}>Head of Department</div>
                            </div>
                          </div>
                          {profile.hodEmail && <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#64748b",marginBottom:6}}><Mail size={11}/>{profile.hodEmail}</div>}
                          {profile.hodPhone && <div style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#64748b"}}><Phone size={11}/>{profile.hodPhone}</div>}
                        </>) : <div style={{padding:"20px 0",textAlign:"center",color:"#94a3b8",fontSize:13}}>No HOD assigned</div>}
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div style={{background:meta.lightBg,borderRadius:12,border:`1px solid ${meta.borderColor}`,padding:"14px 16px"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Department Details</div>
                      {[
                        ["Type",        profile?.type?.replace(/_/g," ")],
                        ["Code",        profile?.code || "—"],
                        ["Parent Dept", profile?.department?.name || "Independent"],
                      ].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:7}}>
                          <span style={{color:"#64748b"}}>{k}</span>
                          <span style={{fontWeight:600,color:"#1e293b"}}>{v}</span>
                        </div>
                      ))}
                      <div style={{borderTop:`1px solid ${meta.borderColor}`,paddingTop:8,marginTop:4,fontSize:11,color:"#94a3b8"}}>
                        Login: {profile?.loginEmail || user?.email || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Treatment Plans */}
              {profile?.type !== "RECEPTION" && (
                <div className="sd2-card" style={{marginTop:18}}>
                  <div className="sd2-card-hd">
                    <span className="sd2-card-title"><Activity size={15} color={meta.accent}/>Active Treatment Plans</span>
                    <span style={{fontSize:11,color:"#94a3b8"}}>{upcomingSessions.length} active plan{upcomingSessions.length!==1?"s":""}</span>
                  </div>
                  {sessionsLoading ? (
                    <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading sessions...
                    </div>
                  ) : upcomingSessions.length===0 ? (
                    <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:13}}>No active treatment plans for this department</div>
                  ) : (
                    <div style={{padding:"8px 0"}}>
                      {upcomingSessions.map((plan:any) => {
                        const pct = plan.totalSessions>0 ? (plan.completedSessions/plan.totalSessions)*100 : 0;
                        return (
                          <div key={plan.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 18px",borderBottom:"1px solid #f8fafc"}}>
                            <div style={{width:36,height:36,borderRadius:10,background:meta.lightBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <Activity size={16} color={meta.accent}/>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:13,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{plan.planName}</div>
                              <div style={{fontSize:11,color:"#64748b"}}>{plan.patient?.name} · {plan.patient?.patientId}</div>
                              <div style={{marginTop:5,height:4,background:"#f1f5f9",borderRadius:100,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${meta.accent},#10b981)`,borderRadius:100}}/>
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{plan.completedSessions}/{plan.totalSessions}</div>
                              <div style={{fontSize:10,color:"#94a3b8"}}>sessions</div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:12,fontWeight:700,color:"#10b981"}}>₹{(plan.paidAmount||0).toLocaleString()}</div>
                              <div style={{fontSize:10,color:"#94a3b8"}}>of ₹{(plan.totalCost||0).toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>)}

            {/* ═══════════════════ DOCTOR REFERRALS QUEUE ═══════════════════ */}
            {tab==="queue" && (<>
              {/* Info banner */}
              <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1.5px solid #bbf7d0",borderRadius:14,padding:"14px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
                <UserCheck size={20} color="#16a34a"/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#166534"}}>Doctor-Referred Patients Only</div>
                  <div style={{fontSize:12,color:"#16a34a",marginTop:2}}>Only patients whose consultation is <strong>completed</strong> and doctor has explicitly referred to <strong>{deptName}</strong> appear here.</div>
                </div>
                <div style={{marginLeft:"auto",textAlign:"right"}}>
                  <div style={{fontSize:24,fontWeight:800,color:"#16a34a"}}>{queue.length}</div>
                  <div style={{fontSize:11,color:"#16a34a"}}>Today&apos;s referrals</div>
                </div>
              </div>

              {/* Toolbar — matches hospitaladmin/appointments style */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:200}}>
                  <Search size={13} color="#94a3b8"/>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search by patient, token, doctor..." value={queueSearch} onChange={e=>setQueueSearch(e.target.value)}/>
                  {queueSearch && <button onClick={()=>setQueueSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {queueLoading && <Loader2 size={16} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>{filteredQueue.length} referrals</div>
                {/* Export Dropdown */}
                <div style={{position:"relative",marginLeft:"auto"}}>
                  <button onClick={()=>setQueueExportOpen(!queueExportOpen)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:500,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.background="#f8fafc";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#fff";}}>
                    <Download size={14}/>Export
                  </button>
                  {queueExportOpen && (<>
                    <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setQueueExportOpen(false)}/>
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:70,minWidth:180,padding:6}}>
                      <button onClick={exportQueuePDF} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff5f5",color:"#ef4444"}}><FileText size={13}/></span>Export as PDF
                      </button>
                      <button onClick={exportQueueExcel} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={13}/></span>Export as Excel
                      </button>
                      <button onClick={exportQueueWord} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#eff6ff",color:"#2563eb"}}><FileType size={13}/></span>Export as Word
                      </button>
                    </div>
                  </>)}
                </div>
                <button onClick={loadQueue}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  <RefreshCw size={15} style={queueLoading?{animation:"spin .7s linear infinite"}:{}}/>Refresh
                </button>
              </div>

              {/* Queue Table */}
              {queueLoading && queue.length===0 ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"60px 0",color:"#94a3b8"}}>
                  <Loader2 size={20} style={{animation:"spin .7s linear infinite"}}/>Loading referrals...
                </div>
              ) : filteredQueue.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8"}}>
                  <UserCheck size={32} style={{marginBottom:10,opacity:.4}}/>
                  <div style={{fontSize:14,fontWeight:600}}>No referrals for today</div>
                  <div style={{fontSize:12,color:"#cbd5e1",marginTop:4}}>Patients will appear here after a doctor completes their consultation and refers to <strong>{deptName}</strong></div>
                </div>
              ) : (
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          <th style={{padding:"12px 10px 12px 14px",borderBottom:"2px solid #f1f5f9",width:36}}>
                            <input type="checkbox" checked={filteredQueue.length>0 && selectedQueue.size===filteredQueue.length} onChange={toggleSelectAllQueue}
                              style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                          </th>
                          {["Token","Patient","Referred On","Referred By","Referral Note","Suggested Procedures","Actions"].map(h=>(
                            <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQueue.map((q:any)=>{
                          const exp = expandedRow===q.id;
                          const isSelected = selectedQueue.has(q.id);
                          return (
                            <React.Fragment key={q.id}>
                              <tr style={{borderBottom:"1px solid #f8fafc",background:isSelected?meta.lightBg:"transparent",cursor:"pointer"}}
                                onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="#fafbfc";}}
                                onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent";}}
                                onClick={()=>setExpandedRow(exp?null:q.id)}>
                                <td style={{padding:"12px 10px 12px 14px",width:36}} onClick={e=>e.stopPropagation()}>
                                  <input type="checkbox" checked={isSelected} onChange={()=>toggleSelectQueue(q.id)}
                                    style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{width:34,height:34,borderRadius:10,background:meta.lightBg,border:`1.5px solid ${meta.borderColor}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:meta.accent}}>
                                    {q.tokenNumber||"—"}
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                                    <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#0ea5e9,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff",flexShrink:0}}>
                                      {(q.patient?.name||"P").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{q.patient?.name||"Unknown"}</div>
                                      <div style={{fontSize:11,color:"#94a3b8"}}>{q.patient?.patientId||""}{q.patient?.age ? ` · ${q.patient.age}y` : ""}{q.patient?.gender ? ` · ${q.patient.gender.charAt(0)}` : ""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{q.appointmentDate ? new Date(q.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</div>
                                  <div style={{fontSize:11,color:"#94a3b8"}}>{q.timeSlot||"—"}</div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{q.doctor?.name||"—"}</div>
                                  <div style={{fontSize:11,color:"#94a3b8"}}>{q.doctor?.specialization||q.doctor?.department||""}</div>
                                </td>
                                <td style={{padding:"12px 14px",maxWidth:200}}>
                                  {q.subDeptNote
                                    ? <div style={{fontSize:12,color:"#166534",background:"#f0fdf4",borderRadius:7,padding:"5px 8px",border:"1px solid #bbf7d0",lineHeight:1.4}}><MessageSquare size={10} style={{marginRight:5,verticalAlign:"middle",color:"#16a34a"}}/>{q.subDeptNote}</div>
                                    : q.doctorNotes
                                      ? <div style={{fontSize:12,color:"#64748b",fontStyle:"italic"}}>{q.doctorNotes.slice(0,60)}{q.doctorNotes.length>60?"…":""}</div>
                                      : <span style={{fontSize:11,color:"#94a3b8"}}>—</span>
                                  }
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  {q.suggestedProcedures?.length>0
                                    ? q.suggestedProcedures.map((p:any,i:number)=>(
                                      <span key={i} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"2px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontSize:10,fontWeight:700}}>{p.name}</span>
                                    ))
                                    : <span style={{fontSize:11,color:"#94a3b8"}}>—</span>
                                  }
                                </td>
                                <td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
                                  <div style={{display:"flex",gap:6}}>
                                    <button onClick={()=>{ setRecordForm({...BLANK_REC, patientId:q.patient?.id||"" , patientSearch:q.patient?.name||"" , appointmentId:q.id, amount:q.suggestedProcedures?.[0]?.fee||"" , procedureId:q.suggestedProcedures?.[0]?.id||""}); setShowRecordForm(true); setTab("records"); }}
                                      style={{width:28,height:28,borderRadius:8,border:"none",background:"#f0fdf4",color:"#16a34a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Record Procedure"><Plus size={13}/></button>
                                    <button onClick={()=>setExpandedRow(exp?null:q.id)}
                                      style={{width:28,height:28,borderRadius:8,border:"none",background:"#f8fafc",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title={exp?"Hide Details":"View Details"}><Eye size={13}/></button>
                                  </div>
                                </td>
                              </tr>

                              {exp && (
                                <tr>
                                  <td colSpan={8} style={{padding:0}}>
                                    <div style={{background:"#fafbfc",padding:"18px 20px",borderBottom:"1px solid #f1f5f9"}}>
                                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                                        <div>
                                          <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><Stethoscope size={12} color={meta.accent}/>Doctor&apos;s Consultation Notes</div>
                                          <div style={{background:"#fff",borderRadius:10,border:`1px solid ${meta.borderColor}`,padding:"12px 14px",fontSize:13,color:"#334155",lineHeight:1.6,minHeight:56}}>
                                            {q.doctorNotes ? q.doctorNotes : <span style={{color:"#94a3b8",fontStyle:"italic"}}>No consultation notes</span>}
                                          </div>
                                          {q.subDeptNote && (
                                            <div style={{marginTop:10,background:"#f0fdf4",borderRadius:10,border:"1.5px solid #bbf7d0",padding:"12px 14px"}}>
                                              <div style={{fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:5,display:"flex",alignItems:"center",gap:5}}><MessageSquare size={11}/>Referral Instructions</div>
                                              <div style={{fontSize:13,color:"#166534",lineHeight:1.6}}>{q.subDeptNote}</div>
                                            </div>
                                          )}
                                          <div style={{marginTop:10,display:"flex",gap:10}}>
                                            {[["Type",q.type],["Fee",q.consultationFee?`₹${q.consultationFee}`:"—"],["Phone",q.patient?.phone||"—"]].map(([k,v])=>(
                                              <div key={k} style={{flex:1,background:"#fff",borderRadius:9,padding:"8px 10px",border:"1px solid #e2e8f0",textAlign:"center"}}>
                                                <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:2}}>{k}</div>
                                                <div style={{fontSize:12,fontWeight:700,color:"#334155"}}>{v}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><TrendingUp size={12} color={meta.accent}/>Patient Journey</div>
                                          {profile?.flow ? (
                                            <div style={{background:"#fff",borderRadius:10,border:`1px solid ${meta.borderColor}`,padding:"12px 14px"}}>
                                              {profile.flow.split("→").map((step:string,i:number,arr:string[])=>{
                                                const isHere = step.trim().toLowerCase().includes(deptName.split(" ")[0].toLowerCase());
                                                return (
                                                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:i<arr.length-1?8:0}}>
                                                    <div style={{width:22,height:22,borderRadius:"50%",background:isHere?meta.gradient:"#f1f5f9",border:`2px solid ${isHere?meta.accent:"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                                      <span style={{fontSize:9,fontWeight:800,color:isHere?"#fff":"#94a3b8"}}>{i+1}</span>
                                                    </div>
                                                    <span style={{fontSize:12,fontWeight:isHere?700:500,color:isHere?meta.accent:"#64748b"}}>{step.trim()}</span>
                                                    {isHere && <span style={{marginLeft:"auto",fontSize:9,padding:"1px 6px",borderRadius:100,background:meta.lightBg,color:meta.accent,fontWeight:700,border:`1px solid ${meta.borderColor}`}}>HERE</span>}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px",color:"#94a3b8",fontSize:12}}>
                                              OPD → <strong style={{color:meta.accent}}>{deptName}</strong> → Billing
                                            </div>
                                          )}
                                        </div>
                                      </div>
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
                  {/* Footer */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:12,color:"#94a3b8"}}>Showing {filteredQueue.length} of {queue.length} referrals</div>
                    {selectedQueue.size > 0 && <div style={{fontSize:11,color:meta.accent,fontWeight:600}}>{selectedQueue.size} selected</div>}
                  </div>
                </div>
              )}

              {/* ═══════════════════ COMPLETED REFERRALS ═══════════════════ */}
              {completedQueue.length > 0 && (<>
                <div style={{marginTop:28,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <CheckCircle size={16} color="#16a34a"/>
                  <span style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>Completed Procedures</span>
                  <span style={{fontSize:11,fontWeight:600,background:"#f0fdf4",padding:"2px 10px",borderRadius:100,border:"1px solid #bbf7d0",color:"#16a34a"}}>{completedQueue.length}</span>
                </div>
                {/* Search */}
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",marginBottom:12,maxWidth:350}}>
                  <Search size={13} color="#94a3b8"/>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search completed..." value={completedQueueSearch} onChange={e=>setCompletedQueueSearch(e.target.value)}/>
                  {completedQueueSearch && <button onClick={()=>setCompletedQueueSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {(()=>{
                  const filtered = completedQueueSearch
                    ? completedQueue.filter((c:any) => c.patient?.name?.toLowerCase().includes(completedQueueSearch.toLowerCase()) || c.patient?.patientId?.toLowerCase().includes(completedQueueSearch.toLowerCase()) || c.doctor?.name?.toLowerCase().includes(completedQueueSearch.toLowerCase()))
                    : completedQueue;
                  return filtered.length === 0 ? (
                    <div style={{textAlign:"center",padding:"30px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8",fontSize:13}}>No matches</div>
                  ) : (
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{background:"#f0fdf4"}}>
                              {["Token","Patient","Referred By","Procedure Done","Amount","Performed By","Date","Actions"].map(h=>(
                                <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#16a34a",padding:"12px 14px",borderBottom:"2px solid #bbf7d0",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((c:any)=>(
                              <tr key={c.id} style={{borderBottom:"1px solid #f8fafc"}}
                                onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{width:34,height:34,borderRadius:10,background:"#f0fdf4",border:"1.5px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"#16a34a"}}>
                                    {c.tokenNumber||"—"}
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                                    <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#fff",flexShrink:0}}>
                                      {(c.patient?.name||"P").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{c.patient?.name||"—"}</div>
                                      <div style={{fontSize:11,color:"#94a3b8"}}>{c.patient?.patientId||""}{c.patient?.phone?` · ${c.patient.phone}`:""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{c.doctor?.name||"—"}</div>
                                  <div style={{fontSize:11,color:"#94a3b8"}}>{c.doctor?.specialization||""}</div>
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  {c.procedureRecords?.length > 0
                                    ? c.procedureRecords.map((pr:any,i:number)=>(
                                      <span key={i} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"2px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8",fontSize:10,fontWeight:700}}>{pr.procedureName}</span>
                                    ))
                                    : <span style={{fontSize:11,color:"#94a3b8"}}>—</span>
                                  }
                                </td>
                                <td style={{padding:"12px 14px",fontWeight:700,color:"#0A6B70",fontSize:13}}>
                                  {c.procedureRecords?.length > 0 ? `₹${c.procedureRecords.reduce((s:number,pr:any)=>s+(pr.amount||0),0)}` : "—"}
                                </td>
                                <td style={{padding:"12px 14px",fontSize:13,color:"#64748b"}}>
                                  {c.procedureRecords?.[0]?.performedBy || "—"}
                                </td>
                                <td style={{padding:"12px 14px",fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>
                                  {c.procedureRecords?.[0]?.performedAt
                                    ? new Date(c.procedureRecords[0].performedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})
                                    : c.appointmentDate ? new Date(c.appointmentDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—"}
                                </td>
                                <td style={{padding:"12px 14px"}}>
                                  <div style={{display:"flex",gap:6}}>
                                    <button onClick={()=>setViewCompletedItem(c)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#f0fdf4",color:"#16a34a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="View"><Eye size={13}/></button>
                                    <button onClick={()=>openEditCompleted(c)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#E6F4F4",color:"#0E898F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Edit"><Edit2 size={13}/></button>
                                    <button onClick={()=>setDeleteCompletedTarget(c)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff5f5",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Delete"><Trash2 size={13}/></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",fontSize:12,color:"#94a3b8"}}>
                        {filtered.length} completed procedure{filtered.length!==1?"s":""}
                      </div>
                    </div>
                  );
                })()}
              </>)}

              {/* ── View Completed Modal ── */}
              {viewCompletedItem && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={()=>setViewCompletedItem(null)}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:540,border:"1px solid #e2e8f0",maxHeight:"90vh",overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div style={{fontSize:17,fontWeight:800,color:"#1e293b"}}>Completed Procedure Details</div>
                      <button onClick={()=>setViewCompletedItem(null)} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    {/* Patient Info */}
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0",marginBottom:16}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:"#fff"}}>
                        {(viewCompletedItem.patient?.name||"P").charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{viewCompletedItem.patient?.name||"—"}</div>
                        <div style={{fontSize:12,color:"#94a3b8"}}>{viewCompletedItem.patient?.patientId||""}{viewCompletedItem.patient?.phone?` · ${viewCompletedItem.patient.phone}`:""}{viewCompletedItem.patient?.gender?` · ${viewCompletedItem.patient.gender}`:""}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>TOKEN</div>
                        <div style={{fontSize:18,fontWeight:800,color:meta.accent}}>{viewCompletedItem.tokenNumber||"—"}</div>
                      </div>
                    </div>
                    {/* Info grid */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                      {[
                        ["Referred By", viewCompletedItem.doctor?.name || "—"],
                        ["Specialization", viewCompletedItem.doctor?.specialization || "—"],
                        ["Appointment Date", viewCompletedItem.appointmentDate ? new Date(viewCompletedItem.appointmentDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"],
                        ["Time Slot", viewCompletedItem.timeSlot || "—"],
                        ["Type", viewCompletedItem.type || "—"],
                        ["Consultation Fee", viewCompletedItem.consultationFee ? `₹${viewCompletedItem.consultationFee}` : "—"],
                      ].map(([k,v])=>(
                        <div key={k} style={{background:"#f8fafc",borderRadius:9,padding:"10px 12px",border:"1px solid #f1f5f9"}}>
                          <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>{k}</div>
                          <div style={{fontSize:13,fontWeight:600,color:"#334155",marginTop:2}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Referral Note */}
                    {viewCompletedItem.subDeptNote && (
                      <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:12,marginBottom:16}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:4,display:"flex",alignItems:"center",gap:5}}><MessageSquare size={11}/>Referral Note</div>
                        <div style={{fontSize:13,color:"#166534",lineHeight:1.5}}>{viewCompletedItem.subDeptNote}</div>
                      </div>
                    )}
                    {/* Procedure Records */}
                    <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em",marginBottom:8}}>Procedures Performed</div>
                    {viewCompletedItem.procedureRecords?.map((pr:any,i:number)=>(
                      <div key={i} style={{background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <span style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{pr.procedureName||"—"}</span>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[pr.procedureType]||"#94a3b8",fontWeight:700}}>{pr.procedureType}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          {[["Amount",`₹${pr.amount||0}`],["Status",pr.status||"—"],["Performed By",pr.performedBy||"—"]].map(([k,v])=>(
                            <div key={k}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{k}</div><div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{v}</div></div>
                          ))}
                        </div>
                        {pr.performedAt && <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Performed: {new Date(pr.performedAt).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>}
                        {pr.notes && <div style={{fontSize:12,color:"#64748b",marginTop:4,fontStyle:"italic"}}>{pr.notes}</div>}
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}>
                      <button onClick={()=>setViewCompletedItem(null)} style={{padding:"9px 20px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Edit Completed Modal ── */}
              {editCompletedItem && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={()=>{if(!editCompletedSaving)setEditCompletedItem(null);}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:480,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:17,fontWeight:800,color:"#1e293b"}}>Edit Procedure Record</div>
                        <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>For {editCompletedItem.patient?.name||"—"} — {editCompletedItem.procedureRecords?.[0]?.procedureName||""}</div>
                      </div>
                      <button onClick={()=>setEditCompletedItem(null)} disabled={editCompletedSaving} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gap:14}}>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Amount (₹)</label>
                        <input type="number" value={editCompletedForm.amount} onChange={e=>setEditCompletedForm((f:any)=>({...f,amount:e.target.value}))}
                          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Performed By</label>
                        <input value={editCompletedForm.performedBy} onChange={e=>setEditCompletedForm((f:any)=>({...f,performedBy:e.target.value}))}
                          placeholder="Doctor / technician name" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Status</label>
                        <select value={editCompletedForm.status} onChange={e=>setEditCompletedForm((f:any)=>({...f,status:e.target.value}))}
                          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"inherit"}}>
                          {["COMPLETED","PENDING","CANCELLED"].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Notes</label>
                        <textarea value={editCompletedForm.notes} onChange={e=>setEditCompletedForm((f:any)=>({...f,notes:e.target.value}))}
                          rows={3} placeholder="Optional notes" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveEditCompleted} disabled={editCompletedSaving}
                        style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:editCompletedSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,opacity:editCompletedSaving?.7:1}}>
                        {editCompletedSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        {editCompletedSaving?"Saving...":"Save Changes"}
                      </button>
                      <button onClick={()=>setEditCompletedItem(null)} disabled={editCompletedSaving}
                        style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Delete Completed Confirmation Modal ── */}
              {deleteCompletedTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !deletingCompleted) setDeleteCompletedTarget(null);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete Procedure Record?</div>
                        <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete the procedure record for <strong>{deleteCompletedTarget.patient?.name||"—"}</strong>?
                          {deleteCompletedTarget.procedureRecords?.[0]?.procedureName && <> ({deleteCompletedTarget.procedureRecords[0].procedureName})</>}
                        </div>
                      </div>
                    </div>
                    {deleteCompletedTarget.procedureRecords?.[0]?.amount > 0 && (
                      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:18}}>
                        <div style={{fontSize:12,color:"#92400e",fontWeight:600,marginBottom:4}}>⚠️ Warning</div>
                        <div style={{fontSize:11,color:"#a16207"}}>This will permanently remove the ₹{deleteCompletedTarget.procedureRecords[0].amount} procedure record and the patient will reappear in the pending queue.</div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setDeleteCompletedTarget(null)} disabled={deletingCompleted}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:600,cursor:deletingCompleted?"not-allowed":"pointer",opacity:deletingCompleted?.5:1}}>Cancel</button>
                      <button onClick={handleDeleteCompleted} disabled={deletingCompleted}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:deletingCompleted?"not-allowed":"pointer",opacity:deletingCompleted?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {deletingCompleted && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {deletingCompleted?"Deleting...":"Delete Record"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>)}

            {/* ═══════════════════ REPORTS ═══════════════════ */}
            {tab==="reports" && (<>
              {reportLoading || !reportData ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"80px 0",color:"#94a3b8"}}>
                  <Loader2 size={22} style={{animation:"spin .7s linear infinite"}}/>Loading reports...
                </div>
              ) : (()=>{
                const s = reportData.summary || {};
                const CHART_COLORS = [meta.accent,"#6366f1","#f59e0b","#ef4444","#10b981","#ec4899","#8b5cf6","#06b6d4"];
                const TYPE_COLORS: Record<string,string> = {DIAGNOSTIC:"#6366f1",THERAPEUTIC:"#10b981",SURGICAL:"#ef4444",COSMETIC:"#ec4899",PREVENTIVE:"#f59e0b",EMERGENCY:"#dc2626",REHABILITATIVE:"#06b6d4",OTHER:"#94a3b8"};

                return (<>
                  {/* Header + Refresh */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><BarChart2 size={20} color={meta.accent}/>{deptName} — Reports & Analytics</div>
                      <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Comprehensive overview of all procedures, revenue, and performance metrics</div>
                    </div>
                    <button onClick={loadReports} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      <RefreshCw size={14}/>Refresh
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                    {[
                      {label:"Total Procedures Done",value:s.totalRecords,icon:<ClipboardList size={18}/>,color:meta.accent,bg:meta.lightBg,border:meta.borderColor},
                      {label:"Total Revenue",value:`₹${(s.totalRevenue||0).toLocaleString("en-IN")}`,icon:<IndianRupee size={18}/>,color:"#10b981",bg:"#f0fdf4",border:"#bbf7d0"},
                      {label:"Today's Procedures",value:s.todayRecords,icon:<Activity size={18}/>,color:"#6366f1",bg:"#eef2ff",border:"#c7d2fe"},
                      {label:"Today's Revenue",value:`₹${(s.todayRevenue||0).toLocaleString("en-IN")}`,icon:<TrendingUp size={18}/>,color:"#f59e0b",bg:"#fffbeb",border:"#fde68a"},
                    ].map((c,i)=>(
                      <div key={i} style={{background:"#fff",borderRadius:14,padding:"18px 20px",border:`1px solid ${c.border}`,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                          <div style={{width:38,height:38,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",color:c.color}}>{c.icon}</div>
                        </div>
                        <div style={{fontSize:24,fontWeight:800,color:c.color}}>{c.value}</div>
                        <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginTop:2}}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Secondary Stats Row */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                    {[
                      {label:"Active Procedures",value:s.activeProcedures,color:meta.accent},
                      {label:"Total Catalog",value:s.totalProcedures,color:"#6366f1"},
                      {label:"Total Referrals",value:s.totalReferred,color:"#10b981"},
                      {label:"Avg Revenue / Record",value:`₹${(s.avgRevenuePerRecord||0).toLocaleString("en-IN")}`,color:"#f59e0b"},
                    ].map((c,i)=>(
                      <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:8,height:32,borderRadius:4,background:c.color,flexShrink:0}}/>
                        <div>
                          <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>{c.value}</div>
                          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{c.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Row 1: Daily Trend + Procedures by Type */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18,marginBottom:24}}>
                    {/* Daily Trend Line Chart */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:4}}>Daily Procedures & Revenue (Last 30 Days)</div>
                      <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>Hover for details</div>
                      <div style={{width:"100%",height:260}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsAreaChart data={reportData.dailyTrend||[]} margin={{top:5,right:10,left:-10,bottom:0}}>
                            <defs>
                              <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={meta.accent} stopOpacity={.3}/><stop offset="100%" stopColor={meta.accent} stopOpacity={0}/></linearGradient>
                              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={.25}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            </defs>
                            <RechartsXAxis dataKey="label" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}} interval={4}/>
                            <RechartsYAxis yAxisId="left" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsYAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsTooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12,boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}/>
                            <RechartsArea yAxisId="left" type="monotone" dataKey="count" stroke={meta.accent} fill="url(#gradCount)" strokeWidth={2} name="Procedures" dot={false}/>
                            <RechartsArea yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#gradRev)" strokeWidth={2} name="Revenue (₹)" dot={false}/>
                          </RechartsAreaChart>
                        </RechartsResponsiveContainer>
                      </div>
                    </div>

                    {/* Procedures by Type — Pie */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:14}}>By Procedure Type</div>
                      <div style={{width:"100%",height:180}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <RechartsPie data={(reportData.byType||[]).map((t:any,i:number)=>({...t,fill:TYPE_COLORS[t.type]||CHART_COLORS[i%CHART_COLORS.length]}))} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                              {(reportData.byType||[]).map((_:any,i:number)=>(
                                <RechartsCell key={i} fill={TYPE_COLORS[(reportData.byType||[])[i]?.type]||CHART_COLORS[i%CHART_COLORS.length]}/>
                              ))}
                            </RechartsPie>
                            <RechartsTooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:11}}/>
                          </RechartsPieChart>
                        </RechartsResponsiveContainer>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                        {(reportData.byType||[]).map((t:any,i:number)=>(
                          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,color:"#64748b"}}>
                            <span style={{width:8,height:8,borderRadius:2,background:TYPE_COLORS[t.type]||CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                            {t.type} ({t.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Charts Row 2: Monthly Revenue Bar + Status Distribution */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18,marginBottom:24}}>
                    {/* Monthly Revenue Bar Chart */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:4}}>Monthly Revenue & Procedures (Last 6 Months)</div>
                      <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>Bar = Revenue, Line = Count</div>
                      <div style={{width:"100%",height:240}}>
                        <RechartsResponsiveContainer width="100%" height="100%">
                          <RechartsComposedChart data={reportData.monthlyTrend||[]} margin={{top:5,right:10,left:-10,bottom:0}}>
                            <RechartsXAxis dataKey="label" tick={{fontSize:11,fill:"#64748b"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}}/>
                            <RechartsYAxis yAxisId="left" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsYAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>
                            <RechartsTooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:12,boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}/>
                            <RechartsBar yAxisId="left" dataKey="revenue" fill={meta.accent} radius={[6,6,0,0]} name="Revenue (₹)" opacity={0.85} barSize={32}/>
                            <RechartsLine yAxisId="right" type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2.5} dot={{r:4,fill:"#f59e0b"}} name="Procedures"/>
                          </RechartsComposedChart>
                        </RechartsResponsiveContainer>
                      </div>
                    </div>

                    {/* Status Distribution */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:14}}>Record Status</div>
                      {(reportData.byStatus||[]).map((st:any,i:number)=>{
                        const total = (reportData.byStatus||[]).reduce((s:number,x:any)=>s+x.count,0);
                        const pct = total ? Math.round((st.count/total)*100) : 0;
                        const statusColors: Record<string,string> = {COMPLETED:"#10b981",PENDING:"#f59e0b",CANCELLED:"#ef4444",IN_PROGRESS:"#6366f1"};
                        const clr = statusColors[st.status]||"#94a3b8";
                        return (
                          <div key={i} style={{marginBottom:14}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:12,fontWeight:600,color:"#334155"}}>{st.status}</span>
                              <span style={{fontSize:12,fontWeight:700,color:clr}}>{st.count} ({pct}%)</span>
                            </div>
                            <div style={{height:8,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:4,background:clr,width:`${pct}%`,transition:"width .5s ease"}}/>
                            </div>
                          </div>
                        );
                      })}
                      {(reportData.byStatus||[]).length===0 && <div style={{color:"#94a3b8",fontSize:12}}>No data</div>}
                    </div>
                  </div>

                  {/* Tables Row: Top Procedures + Performers */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:24}}>
                    {/* Top Procedures Table */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{padding:"16px 18px",borderBottom:"1px solid #f1f5f9",fontSize:14,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><ClipboardList size={15} color={meta.accent}/>Top Procedures</div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{background:"#f8fafc"}}>
                            {["#","Procedure","Type","Count","Revenue"].map(h=>(
                              <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"10px 14px",borderBottom:"2px solid #f1f5f9"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(reportData.topProcedures||[]).map((p:any,i:number)=>(
                            <tr key={i} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:meta.accent}}>{i+1}</td>
                              <td style={{padding:"10px 14px",fontSize:13,fontWeight:600,color:"#1e293b"}}>{p.name}</td>
                              <td style={{padding:"10px 14px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:100,fontWeight:700,background:(TYPE_COLORS[p.type]||"#94a3b8")+"18",color:TYPE_COLORS[p.type]||"#94a3b8"}}>{p.type}</span></td>
                              <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:"#334155"}}>{p.count}</td>
                              <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:"#10b981"}}>₹{(p.revenue||0).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                          {(reportData.topProcedures||[]).length===0 && <tr><td colSpan={5} style={{padding:20,textAlign:"center",color:"#94a3b8",fontSize:12}}>No data</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {/* Performers Leaderboard */}
                    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{padding:"16px 18px",borderBottom:"1px solid #f1f5f9",fontSize:14,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><Users size={15} color="#6366f1"/>Performers Leaderboard</div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{background:"#f8fafc"}}>
                            {["#","Name","Procedures","Revenue"].map(h=>(
                              <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"10px 14px",borderBottom:"2px solid #f1f5f9"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(reportData.performers||[]).map((p:any,i:number)=>(
                            <tr key={i} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{padding:"10px 14px"}}>
                                <div style={{width:26,height:26,borderRadius:7,background:i===0?"linear-gradient(135deg,#f59e0b,#eab308)":i===1?"linear-gradient(135deg,#94a3b8,#64748b)":i===2?"linear-gradient(135deg,#cd7f32,#b8860b)":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:i<3?"#fff":"#64748b"}}>{i+1}</div>
                              </td>
                              <td style={{padding:"10px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{(p.name||"?").charAt(0).toUpperCase()}</div>
                                  <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{p.name}</span>
                                </div>
                              </td>
                              <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:"#334155"}}>{p.count}</td>
                              <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:"#10b981"}}>₹{(p.revenue||0).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                          {(reportData.performers||[]).length===0 && <tr><td colSpan={4} style={{padding:20,textAlign:"center",color:"#94a3b8",fontSize:12}}>No data</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Records Table */}
                  <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                    <div style={{padding:"16px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><Clock size={15} color="#f59e0b"/>Recent Procedure Records</div>
                      <button onClick={()=>setTab("records")} style={{fontSize:12,fontWeight:600,color:meta.accent,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>View All <ArrowRight size={12}/></button>
                    </div>
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{background:"#f8fafc"}}>
                            {["Patient","Procedure","Type","Amount","Status","Performed By","Date"].map(h=>(
                              <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"10px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(reportData.recentRecords||[]).map((r:any,i:number)=>{
                            const stClr = r.status==="COMPLETED"?"#10b981":r.status==="PENDING"?"#f59e0b":"#ef4444";
                            return (
                              <tr key={i} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>e.currentTarget.style.background="#fafbfc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <td style={{padding:"10px 14px",fontSize:13,fontWeight:600,color:"#1e293b"}}>{r.patientName}</td>
                                <td style={{padding:"10px 14px",fontSize:13,color:"#334155"}}>{r.procedureName}</td>
                                <td style={{padding:"10px 14px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:100,fontWeight:700,background:(TYPE_COLORS[r.procedureType]||"#94a3b8")+"18",color:TYPE_COLORS[r.procedureType]||"#94a3b8"}}>{r.procedureType}</span></td>
                                <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:"#0A6B70"}}>₹{(r.amount||0).toLocaleString("en-IN")}</td>
                                <td style={{padding:"10px 14px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:100,fontWeight:700,background:stClr+"18",color:stClr}}>{r.status}</span></td>
                                <td style={{padding:"10px 14px",fontSize:13,color:"#64748b"}}>{r.performedBy}</td>
                                <td style={{padding:"10px 14px",fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>{r.performedAt ? new Date(r.performedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—"}</td>
                              </tr>
                            );
                          })}
                          {(reportData.recentRecords||[]).length===0 && <tr><td colSpan={7} style={{padding:30,textAlign:"center",color:"#94a3b8",fontSize:12}}>No records yet</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>);
              })()}
            </>)}

            {/* ═══════════════════ PROCEDURES CRUD ═══════════════════ */}
            {tab==="procedures" && (<>
              {/* Add/Edit Procedure Modal */}
              {showProcForm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowProcForm(false)}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:540,boxShadow:"0 24px 60px rgba(0,0,0,.18)",fontFamily:"'Inter',sans-serif",animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>{editingProc?"Edit Procedure":"Add New Procedure"}</div>
                        <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Fill in the procedure details below</div>
                      </div>
                      <button onClick={()=>setShowProcForm(false)} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Name *</label>
                        <input value={procForm.name} onChange={e=>setProcForm((f:any)=>({...f,name:e.target.value}))} placeholder="e.g. Dental Scaling" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Type</label>
                        <select value={procForm.type} onChange={e=>setProcForm((f:any)=>({...f,type:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          {["DIAGNOSTIC","TREATMENT","CONSULTATION","SURGERY","THERAPY","MEDICATION","OTHER"].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Fee (₹)</label>
                        <input type="number" value={procForm.fee} onChange={e=>setProcForm((f:any)=>({...f,fee:e.target.value}))} placeholder="0" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Duration (min)</label>
                        <input type="number" value={procForm.duration} onChange={e=>setProcForm((f:any)=>({...f,duration:e.target.value}))} placeholder="30" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Description</label>
                        <input value={procForm.description} onChange={e=>setProcForm((f:any)=>({...f,description:e.target.value}))} placeholder="Optional description" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                    </div>
                    {procMsg && <div style={{fontSize:12,color:"#ef4444",marginTop:12,fontWeight:600}}>{procMsg}</div>}
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveProc} disabled={procSaving} style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 14px ${meta.accent}33`}}>
                        {procSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        {editingProc?"Save Changes":"Add Procedure"}
                      </button>
                      <button onClick={()=>setShowProcForm(false)} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar — matches hospitaladmin/appointments style */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:200}}>
                  <Search size={13} color="#94a3b8"/>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search by name, type..." value={procSearch} onChange={e=>setProcSearch(e.target.value)}/>
                  {procSearch && <button onClick={()=>setProcSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {procsLoading && <Loader2 size={16} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>{filteredProcs.length} procedures</div>
                {selectedProcs.size > 0 && (
                  <button onClick={()=>setShowBulkDeleteProcConfirm(true)}
                    style={{padding:"8px 14px",borderRadius:10,border:"1px solid #fecaca",background:"#fff5f5",fontSize:12,color:"#ef4444",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                    <Trash2 size={12}/>Delete ({selectedProcs.size})
                  </button>
                )}
                {/* Export Dropdown */}
                <div style={{position:"relative",marginLeft:"auto"}}>
                  <button onClick={()=>setProcExportOpen(!procExportOpen)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:500,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.background="#f8fafc";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#fff";}}>
                    <Download size={14}/>Export
                  </button>
                  {procExportOpen && (<>
                    <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setProcExportOpen(false)}/>
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:70,minWidth:180,padding:6}}>
                      <button onClick={exportProcPDF} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff5f5",color:"#ef4444"}}><FileText size={13}/></span>Export as PDF
                      </button>
                      <button onClick={exportProcExcel} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={13}/></span>Export as Excel
                      </button>
                      <button onClick={exportProcWord} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#eff6ff",color:"#2563eb"}}><FileType size={13}/></span>Export as Word
                      </button>
                    </div>
                  </>)}
                </div>
                <button onClick={openAddProc}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  <Plus size={15}/>Add Procedure
                </button>
              </div>

              {/* Procedures Table */}
              {filteredProcs.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8"}}>
                  <FlaskConical size={32} style={{marginBottom:10,opacity:.4}}/>
                  <div style={{fontSize:14,fontWeight:600}}>{displayProcs.length===0?"No procedures yet":"No procedures match your search"}</div>
                </div>
              ) : (
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          <th style={{padding:"12px 10px 12px 14px",borderBottom:"2px solid #f1f5f9",width:36}}>
                            <input type="checkbox" checked={filteredProcs.length>0 && selectedProcs.size===filteredProcs.length} onChange={toggleSelectAllProcs}
                              style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                          </th>
                          {["#","Procedure Name","Type","Fee","Duration","Status","Actions"].map(h=>(
                            <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProcs.map((p:any,i:number)=>{
                          const isSelected = selectedProcs.has(p.id);
                          return (
                            <tr key={p.id} style={{borderBottom:"1px solid #f8fafc",background:isSelected?meta.lightBg:"transparent"}}
                              onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="#fafbfc";}}
                              onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent";}}>
                              <td style={{padding:"12px 10px 12px 14px",width:36}}>
                                <input type="checkbox" checked={isSelected} onChange={()=>toggleSelectProc(p.id)}
                                  style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                              </td>
                              <td style={{padding:"12px 14px",color:"#94a3b8",fontWeight:600,fontSize:12}}>{i+1}</td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <div style={{width:32,height:32,borderRadius:9,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                    <FlaskConical size={14} color={PROC_TYPE_COLOR[p.type]||"#94a3b8"}/>
                                  </div>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:600,color:p.isActive?"#1e293b":"#94a3b8"}}>{p.name}</div>
                                    {p.description && <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{p.description}</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{padding:"12px 14px"}}><span style={{fontSize:10,padding:"3px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[p.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[p.type]||"#94a3b8",fontWeight:600}}>{p.type}</span></td>
                              <td style={{padding:"12px 14px",fontWeight:700,color:p.fee!=null?"#0A6B70":"#94a3b8",fontSize:13}}>{p.fee!=null?`₹${p.fee}`:"—"}</td>
                              <td style={{padding:"12px 14px",fontSize:13,color:"#64748b"}}>{p.duration?`${p.duration} min`:"—"}</td>
                              <td style={{padding:"12px 14px"}}>
                                <button onClick={()=>toggleProcActive(p)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                                  {p.isActive
                                    ? <><ToggleRight size={18} color="#22c55e"/><span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>Active</span></>
                                    : <><ToggleLeft size={18} color="#94a3b8"/><span style={{fontSize:11,fontWeight:600,color:"#94a3b8"}}>Inactive</span></>}
                                </button>
                              </td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",gap:6}}>
                                  <button onClick={()=>openEditProc(p)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#E6F4F4",color:"#0E898F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Edit"><Edit2 size={13}/></button>
                                  <button onClick={()=>setDeleteProcTarget(p)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff5f5",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Delete"><Trash2 size={13}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:12,color:"#94a3b8"}}>Showing {filteredProcs.length} of {displayProcs.length} procedures</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{activeProcs.length} active · {displayProcs.length - activeProcs.length} inactive</div>
                  </div>
                </div>
              )}

              {/* Single Delete Confirmation Modal */}
              {deleteProcTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !deletingProc) setDeleteProcTarget(null);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete Procedure?</div>
                        <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete <strong>{deleteProcTarget.name}</strong> ({deleteProcTarget.type})? This cannot be undone.
                        </div>
                      </div>
                    </div>
                    {deleteProcTarget.fee!=null && (
                      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:18}}>
                        <div style={{fontSize:12,color:"#92400e",fontWeight:600,marginBottom:4}}>⚠️ Warning</div>
                        <div style={{fontSize:11,color:"#a16207"}}>This procedure with fee ₹{deleteProcTarget.fee} will be permanently removed from your catalog.</div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setDeleteProcTarget(null)} disabled={deletingProc}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:600,cursor:deletingProc?"not-allowed":"pointer",opacity:deletingProc?.5:1}}>Cancel</button>
                      <button onClick={handleDeleteSingleProc} disabled={deletingProc}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:deletingProc?"not-allowed":"pointer",opacity:deletingProc?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {deletingProc && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {deletingProc?"Deleting...":"Delete Procedure"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Delete Confirmation Modal */}
              {showBulkDeleteProcConfirm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !bulkDeletingProcs) setShowBulkDeleteProcConfirm(false);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete {selectedProcs.size} Procedures?</div>
                        <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete <strong>{selectedProcs.size}</strong> selected procedure(s)? This action cannot be undone.
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setShowBulkDeleteProcConfirm(false)} disabled={bulkDeletingProcs}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:600,cursor:bulkDeletingProcs?"not-allowed":"pointer",opacity:bulkDeletingProcs?.5:1}}>Cancel</button>
                      <button onClick={bulkDeleteProcs} disabled={bulkDeletingProcs}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:bulkDeletingProcs?"not-allowed":"pointer",opacity:bulkDeletingProcs?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {bulkDeletingProcs && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {bulkDeletingProcs?"Deleting...":`Delete ${selectedProcs.size} Procedures`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>)}

            {/* ═══════════════════ PATIENT RECORDS ═══════════════════ */}
            {tab==="records" && (<>
              {/* Procedure Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
                {[
                  {label:"Today's Procedures", value:recordsMeta.todayRecords||0,  color:"#6366f1", bg:"#eef2ff", border:"#c7d2fe"},
                  {label:"Total Procedures Done",value:recordsMeta.totalRecords||0, color:meta.accent, bg:meta.lightBg, border:meta.borderColor},
                ].map((s,i)=>(
                  <div key={i} style={{background:s.bg,borderRadius:12,padding:"16px",border:`1px solid ${s.border}`}}>
                    <div style={{fontSize:28,fontWeight:800,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{s.label}</div>
                    {i===0&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Billing managed by Finance Dept</div>}
                  </div>
                ))}
              </div>

              {/* Record Procedure Modal */}
              {showRecordForm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>{setShowRecordForm(false);setRecordForm(BLANK_REC);}}>
                  <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:580,border:"1px solid #e2e8f0",fontFamily:"'Inter',sans-serif",animation:"fadeUp .25s ease",maxHeight:"90vh",overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>Record Procedure Performed</div>
                        <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Log a procedure done on a patient</div>
                      </div>
                      <button onClick={()=>{setShowRecordForm(false);setRecordForm(BLANK_REC);}} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14} color="#94a3b8"/></button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      {/* Patient search */}
                      <div style={{gridColumn:"1/-1",position:"relative"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Patient *</label>
                        <input value={recordForm.patientSearch} onChange={e=>{ setRecordForm((f:any)=>({...f,patientSearch:e.target.value,patientId:""})); searchPatients(e.target.value); }}
                          placeholder="Search patient by name, ID or phone…" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                        {patientResults.length>0 && !recordForm.patientId && (
                          <div style={{position:"absolute",zIndex:50,top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",maxHeight:220,overflowY:"auto"}}>
                            {patientResults.map((pt:any)=>(
                              <div key={pt.id} onClick={()=>{ setRecordForm((f:any)=>({...f,patientId:pt.id,patientSearch:`${pt.name} (${pt.patientId})`})); setPatientResults([]); }}
                                style={{padding:"10px 14px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #f8fafc",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="#fff")}>
                                <div style={{width:28,height:28,borderRadius:8,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11,flexShrink:0}}>{pt.name?.charAt(0)}</div>
                                <div><div style={{fontWeight:600,color:"#1e293b"}}>{pt.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{pt.patientId} · {pt.phone}</div></div>
                              </div>
                            ))}
                          </div>
                        )}
                        {recordForm.patientId && <div style={{marginTop:4,fontSize:11,color:"#16a34a",fontWeight:600}}>✓ Patient selected</div>}
                      </div>
                      {/* Procedure */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Procedure *</label>
                        <select value={recordForm.procedureId} onChange={e=>{ const p = displayProcs.find((x:any)=>x.id===e.target.value); setRecordForm((f:any)=>({...f,procedureId:e.target.value,amount:p?.fee?.toString()||f.amount})); }}
                          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          <option value="">— Select Procedure —</option>
                          {displayProcs.filter((p:any)=>p.isActive).map((p:any)=>(
                            <option key={p.id} value={p.id}>{p.name}{p.fee!=null?` — ₹${p.fee}`:""}</option>
                          ))}
                        </select>
                      </div>
                      {/* Amount */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Amount Charged (₹) *</label>
                        <input type="number" value={recordForm.amount} onChange={e=>setRecordForm((f:any)=>({...f,amount:e.target.value}))} placeholder="0" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      {/* Performed by */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Performed By</label>
                        <input value={recordForm.performedBy} onChange={e=>setRecordForm((f:any)=>({...f,performedBy:e.target.value}))} placeholder={hodName} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                      {/* Status */}
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Status</label>
                        <select value={recordForm.status} onChange={e=>setRecordForm((f:any)=>({...f,status:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}>
                          {["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                        </select>
                      </div>
                      {/* Notes */}
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>Notes</label>
                        <input value={recordForm.notes} onChange={e=>setRecordForm((f:any)=>({...f,notes:e.target.value}))} placeholder="Optional procedure notes" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none",fontFamily:"'Inter',sans-serif"}}/>
                      </div>
                    </div>
                    {recordMsg && <div style={{fontSize:12,color:"#ef4444",marginTop:12,fontWeight:600}}>{recordMsg}</div>}
                    <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
                      <button onClick={saveRecord} disabled={recordSaving} style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                        {recordSaving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                        Save Record
                      </button>
                      <button onClick={()=>{setShowRecordForm(false);setRecordForm(BLANK_REC);}} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Ban size={13}/>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar — matches hospitaladmin/appointments style */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:200}}>
                  <Search size={13} color="#94a3b8"/>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#334155",width:"100%",fontFamily:"inherit"}}
                    placeholder="Search by patient, procedure, ID..." value={recordsSearch} onChange={e=>{setRecordsSearch(e.target.value);loadRecords(e.target.value);}}/>
                  {recordsSearch && <button onClick={()=>{setRecordsSearch("");loadRecords("");}} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
                </div>
                {recordsLoading && <Loader2 size={16} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>{sortedRecords.length} records</div>
                {selectedRecords.size > 0 && (
                  <button onClick={()=>setShowBulkDeleteConfirm(true)}
                    style={{padding:"8px 14px",borderRadius:10,border:"1px solid #fecaca",background:"#fff5f5",fontSize:12,color:"#ef4444",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                    <Trash2 size={12}/>Delete ({selectedRecords.size})
                  </button>
                )}
                {/* Export Dropdown */}
                <div style={{position:"relative",marginLeft:"auto"}}>
                  <button onClick={()=>setExportDropdown(exportDropdown==="all"?null:"all")}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:500,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#cbd5e1";e.currentTarget.style.background="#f8fafc";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#fff";}}>
                    <Download size={14}/>Export
                  </button>
                  {exportDropdown==="all" && (<>
                    <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setExportDropdown(null)}/>
                    <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:70,minWidth:180,padding:6}}>
                      <button onClick={()=>exportPDF(selectedRecords.size>0?"selected":"all")} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff5f5",color:"#ef4444"}}><FileText size={13}/></span>Export as PDF
                      </button>
                      <button onClick={()=>exportExcel(selectedRecords.size>0?"selected":"all")} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#f0fdf4",color:"#16a34a"}}><FileSpreadsheet size={13}/></span>Export as Excel
                      </button>
                      <button onClick={()=>exportWord(selectedRecords.size>0?"selected":"all")} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:"#eff6ff",color:"#2563eb"}}><FileType size={13}/></span>Export as Word
                      </button>
                    </div>
                  </>)}
                </div>
                <button onClick={()=>setShowRecordForm(true)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                  <Plus size={15}/>New Record
                </button>
              </div>

              {/* Records Table */}
              {records.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8"}}>
                  <IndianRupee size={32} style={{marginBottom:10,opacity:.4}}/>
                  <div style={{fontSize:14,fontWeight:600}}>No procedure records found</div>
                </div>
              ) : (
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          <th style={{padding:"12px 10px 12px 14px",borderBottom:"2px solid #f1f5f9",width:36}}>
                            <input type="checkbox" checked={sortedRecords.length>0 && selectedRecords.size===sortedRecords.length} onChange={toggleSelectAll}
                              style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                          </th>
                          {[
                            {key:"performedAt",label:"Date"},
                            {key:"patient",label:"Patient"},
                            {key:"procedure",label:"Procedure"},
                            {key:"type",label:"Type"},
                            {key:"amount",label:"Amount"},
                            {key:"performedBy",label:"Performed By"},
                            {key:"status",label:"Status"},
                          ].map(col=>(
                            <th key={col.key} onClick={()=>handleSort(col.key)}
                              style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"}}>
                              <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                                {col.label}
                                {sortField===col.key ? (sortDir==="asc" ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={10} style={{opacity:.35}}/>}
                              </span>
                            </th>
                          ))}
                          <th style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRecords.map((r:any)=>{
                          const isSelected = selectedRecords.has(r.id);
                          return (
                            <tr key={r.id} style={{borderBottom:"1px solid #f8fafc",background:isSelected?meta.lightBg:"transparent"}}
                              onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="#fafbfc";}}
                              onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent";}}>
                              <td style={{padding:"12px 10px 12px 14px",width:36}}>
                                <input type="checkbox" checked={isSelected} onChange={()=>toggleSelectRecord(r.id)}
                                  style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                              </td>
                              <td style={{padding:"12px 14px",fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>
                                {new Date(r.performedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}<br/>
                                <span style={{fontSize:10,color:"#94a3b8"}}>{new Date(r.performedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
                              </td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <div style={{width:32,height:32,borderRadius:9,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>
                                    {(r.patient?.name||"P").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{r.patient?.name||"—"}</div>
                                    <div style={{fontSize:11,color:"#94a3b8"}}>{r.patient?.patientId} · {r.patient?.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{padding:"12px 14px",fontSize:13,fontWeight:600,color:"#334155"}}>{r.procedure?.name||"—"}</td>
                              <td style={{padding:"12px 14px"}}><span style={{fontSize:10,padding:"3px 8px",borderRadius:100,background:(PROC_TYPE_COLOR[r.procedure?.type]||"#94a3b8")+"18",color:PROC_TYPE_COLOR[r.procedure?.type]||"#94a3b8",fontWeight:600}}>{r.procedure?.type||"—"}</span></td>
                              <td style={{padding:"12px 14px",fontWeight:700,color:"#0A6B70",fontSize:13}}>₹{r.amount}</td>
                              <td style={{padding:"12px 14px",fontSize:13,color:"#64748b"}}>{r.performedBy||"—"}</td>
                              <td style={{padding:"12px 14px"}}>
                                <span style={{fontSize:10,padding:"3px 8px",borderRadius:100,fontWeight:700,
                                  background:r.status==="COMPLETED"?"#f0fdf4":r.status==="CANCELLED"?"#fff5f5":"#fffbeb",
                                  color:r.status==="COMPLETED"?"#16a34a":r.status==="CANCELLED"?"#ef4444":"#b45309",
                                  border:`1px solid ${r.status==="COMPLETED"?"#bbf7d0":r.status==="CANCELLED"?"#fecaca":"#fde68a"}`
                                }}>{r.status.replace(/_/g," ")}</span>
                              </td>
                              <td style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",gap:6}}>
                                  <button onClick={()=>setViewingRecord(r)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#E6F4F4",color:"#0E898F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="View Details"><Eye size={13}/></button>
                                  <button onClick={()=>setEditingRecord(r)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fef3c7",color:"#d97706",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Edit"><Edit2 size={13}/></button>
                                  <button onClick={()=>{setTransferTarget(r);setTransferForm({subDeptId:"",notes:""});}} style={{width:28,height:28,borderRadius:8,border:"none",background:"#f0fdf4",color:"#10b981",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Transfer"><ArrowRight size={13}/></button>
                                  {r.appointment?.id && (
                                    <button onClick={()=>setViewPrescription(r.appointment)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fdf4ff",color:"#a855f7",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Prescription"><FileText size={13}/></button>
                                  )}
                                  <button onClick={()=>setDeleteRecordTarget(r)} style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff5f5",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Delete"><Trash2 size={13}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:12,color:"#94a3b8"}}>Showing {sortedRecords.length} of {recordsMeta.totalRecords||sortedRecords.length}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>Sorted by {sortField==="performedAt"?"Date":sortField.charAt(0).toUpperCase()+sortField.slice(1)} · {sortDir==="desc"?"Newest first":"Oldest first"}</div>
                  </div>
                </div>
              )}

              {/* Single Delete Confirmation Modal */}
              {deleteRecordTarget && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !deletingRecord) setDeleteRecordTarget(null);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete Record?</div>
                        <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete the procedure record for <strong>{deleteRecordTarget.patient?.name}</strong> — <strong>{deleteRecordTarget.procedure?.name}</strong>? This cannot be undone.
                        </div>
                      </div>
                    </div>
                    <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:18}}>
                      <div style={{fontSize:12,color:"#92400e",fontWeight:600,marginBottom:4}}>⚠️ Warning</div>
                      <div style={{fontSize:11,color:"#a16207"}}>This record with amount ₹{deleteRecordTarget.amount} will be permanently removed.</div>
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setDeleteRecordTarget(null)} disabled={deletingRecord}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:600,cursor:deletingRecord?"not-allowed":"pointer",opacity:deletingRecord?.5:1}}>Cancel</button>
                      <button onClick={handleDeleteSingleRecord} disabled={deletingRecord}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:deletingRecord?"not-allowed":"pointer",opacity:deletingRecord?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {deletingRecord && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {deletingRecord?"Deleting...":"Delete Record"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Delete Confirmation Modal */}
              {showBulkDeleteConfirm && (
                <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                  onClick={e=>{if(e.target===e.currentTarget && !bulkDeleteRunning) setShowBulkDeleteConfirm(false);}}>
                  <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <AlertTriangle size={20} color="#ef4444"/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete {selectedRecords.size} Records?</div>
                        <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>
                          Are you sure you want to delete <strong>{selectedRecords.size}</strong> selected record(s)? This action cannot be undone and will permanently remove the procedure data.
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                      <button onClick={()=>setShowBulkDeleteConfirm(false)} disabled={bulkDeleteRunning}
                        style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:600,cursor:bulkDeleteRunning?"not-allowed":"pointer",opacity:bulkDeleteRunning?.5:1}}>Cancel</button>
                      <button onClick={bulkDeleteRecords} disabled={bulkDeleteRunning}
                        style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:bulkDeleteRunning?"not-allowed":"pointer",opacity:bulkDeleteRunning?.7:1,display:"flex",alignItems:"center",gap:6}}>
                        {bulkDeleteRunning && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                        {bulkDeleteRunning?"Deleting...":`Delete ${selectedRecords.size} Records`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>)}

            {/* ═══════════════════ APPOINTMENTS (Reception) ═══════════════════ */}
            {tab==="appointments" && <AppointmentPanelLazy />}

            {/* ═══════════════════ BILLING (Reception) ═══════════════════ */}
            {tab==="billing" && <BillingQueueLazy />}

            {/* ═══════════════════ PATIENTS (Reception) ═══════════════════ */}
            {tab==="patients" && <PatientsManagementPanelLazy/>}

            {/* ═══════════════════ DOCTORS (Reception) ═══════════════════ */}
            {tab==="doctors" && (<>
              <div className="sd2-card">
                <div className="sd2-card-hd">
                  <span className="sd2-card-title"><Stethoscope size={15} color={meta.accent}/>Doctors Management</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div className="sd2-search" style={{width:220}}>
                      <Search size={13} color="#94a3b8"/>
                      <input placeholder="Search doctor…" value={docSearch} onChange={e=>{setDocSearch(e.target.value);loadDoctors(e.target.value);}}/>
                    </div>
                    <button onClick={()=>loadDoctors(docSearch)} style={{width:34,height:34,borderRadius:8,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                      <RefreshCw size={13} color={docLoading?"#94a3b8":meta.accent} style={docLoading?{animation:"spin .7s linear infinite"}:{}}/>
                    </button>
                  </div>
                </div>
                {docLoading ? (
                  <div style={{padding:40,textAlign:"center"}}><Loader2 size={22} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/></div>
                ) : docList.length===0 ? (
                  <div style={{padding:56,textAlign:"center",color:"#94a3b8",fontSize:13}}>No doctors found</div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,padding:18}}>
                    {docList.map((d:any)=>(
                      <div key={d.id} style={{background:"#fff",border:`1.5px solid ${meta.borderColor}`,borderRadius:14,padding:18,transition:"box-shadow .2s",cursor:"default"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                          <div style={{width:48,height:48,borderRadius:13,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff",flexShrink:0}}>{(d.name||"D")[0].toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
                            <div style={{fontSize:12,color:"#64748b"}}>{d.specialization||d.qualification||"Doctor"}</div>
                          </div>
                          <span className="sd2-badge" style={{background:d.isActive!==false?"#f0fdf4":"#fef2f2",color:d.isActive!==false?"#16a34a":"#ef4444",border:`1px solid ${d.isActive!==false?"#bbf7d0":"#fecaca"}`}}>{d.isActive!==false?"Active":"Inactive"}</span>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {d.department?.name && <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#475569"}}><Building2 size={12} color="#94a3b8"/>{d.department.name}</div>}
                          {d.phone && <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#475569"}}><Phone size={12} color="#94a3b8"/>{d.phone}</div>}
                          {d.email && <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#475569"}}><Mail size={12} color="#94a3b8"/>{d.email}</div>}
                          {d.consultationFee!=null && <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:"#10b981"}}><IndianRupee size={12}/>₹{d.consultationFee} / consultation</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>)}

            {/* ═══════════════════ INVENTORY (Department Stock) ═══════════════════ */}
            {tab==="inventory" && (
              <div>
                {deptStockLoading ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300,gap:8,color:"#94a3b8",fontSize:13}}><Loader2 size={18} className="spin"/> Loading department stock...</div>
                ) : !deptStock?.location ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:360}}>
                    <div style={{textAlign:"center",maxWidth:400}}>
                      <div style={{width:72,height:72,borderRadius:20,background:meta.lightBg,border:`2px solid ${meta.borderColor}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",color:meta.accent}}><Package size={28}/></div>
                      <div style={{fontSize:18,fontWeight:800,color:"#1e293b",marginBottom:8}}>No Stock Location Linked</div>
                      <div style={{fontSize:13,color:"#64748b",lineHeight:1.6,marginBottom:20}}>Ask your Hospital Admin to create a Stock Location linked to this department, then transfer stock from the Central Store.</div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Location Banner + Stats */}
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,padding:"14px 18px",background:`linear-gradient(135deg,${meta.accent}11,${meta.accent}06)`,borderRadius:14,border:`1px solid ${meta.accent}22`}}>
                      <div style={{width:42,height:42,borderRadius:12,background:meta.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}><Package size={20}/></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>{deptStock.location.name}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>Stock received from Central Store · {deptStock.location.subDepartment?.name || "Department"}</div>
                      </div>
                      <div style={{display:"flex",gap:16,flexShrink:0}}>
                        {[
                          {label:"Items",val:deptStock.stats.totalItems,color:meta.accent},
                          {label:"Total Qty",val:deptStock.stats.totalQty,color:"#10b981"},
                          {label:"Value",val:`₹${(deptStock.stats.totalValue||0).toLocaleString("en-IN")}`,color:"#f59e0b"},
                          {label:"Pending",val:deptStock.stats.pendingTransfers,color:"#3b82f6"},
                        ].map((s,i)=>(
                          <div key={i} style={{textAlign:"center"}}>
                            <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div>
                            <div style={{fontSize:16,fontWeight:800,color:s.color,marginTop:2}}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stock Items Table */}
                    {deptStock.items.length === 0 ? (
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:200,flexDirection:"column",gap:8,color:"#94a3b8"}}>
                        <Package size={28} color="#cbd5e1"/>
                        <div style={{fontSize:13}}>No stock received yet</div>
                        <div style={{fontSize:11,color:"#b0b8c4"}}>Stock will appear here after the admin approves transfers to this location</div>
                      </div>
                    ) : (
                      <div style={{overflowX:"auto",borderRadius:12,border:"1px solid #e2e8f0"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",minWidth:650}}>
                          <thead>
                            <tr style={{background:"#f8fafc"}}>
                              {["Item","Category","Received","Returned","Available","MRP","Value","Last Transfer"].map(h=>(
                                <th key={h} style={{textAlign:"left",padding:"10px 12px",fontSize:10,fontWeight:600,color:"#94a3b8",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {deptStock.items.map((item:any)=>{
                              const isLow = item.availableQty <= item.minStock;
                              return (
                                <tr key={item.itemId} style={{borderBottom:"1px solid #f8fafc"}}>
                                  <td style={{padding:"12px",fontSize:12}}>
                                    <div style={{fontWeight:700,color:"#1e293b"}}>{item.name}</div>
                                    {item.genericName && <div style={{fontSize:10,color:"#94a3b8"}}>{item.genericName}</div>}
                                  </td>
                                  <td style={{padding:"12px"}}><span style={{padding:"2px 8px",borderRadius:100,fontSize:9,fontWeight:700,background:"#eff6ff",color:"#3b82f6"}}>{item.category}</span></td>
                                  <td style={{padding:"12px",fontWeight:600,color:"#64748b",fontSize:12}}>{item.receivedQty} {item.unit}</td>
                                  <td style={{padding:"12px",color:item.returnedQty > 0 ? "#f59e0b" : "#cbd5e1",fontSize:12}}>{item.returnedQty}</td>
                                  <td style={{padding:"12px",fontWeight:700,color:isLow?"#ef4444":"#10b981",fontSize:13}}>{item.availableQty} {item.unit}</td>
                                  <td style={{padding:"12px",fontWeight:600,fontSize:12}}>₹{item.mrp}</td>
                                  <td style={{padding:"12px",fontWeight:600,color:meta.accent,fontSize:12}}>₹{(item.totalValue||0).toLocaleString("en-IN")}</td>
                                  <td style={{padding:"12px",fontSize:10,color:"#94a3b8"}}>{item.lastTransferDate ? new Date(item.lastTransferDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Recent Transfers */}
                    {deptStock.transfers?.length > 0 && (
                      <div style={{marginTop:20}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#1e293b",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                          <ArrowRight size={14} color={meta.accent}/> Recent Transfers Received
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {deptStock.transfers.slice(0,5).map((t:any)=>(
                            <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
                              <div style={{width:32,height:32,borderRadius:8,background:`${meta.accent}15`,display:"flex",alignItems:"center",justifyContent:"center",color:meta.accent,flexShrink:0}}>
                                <ArrowRight size={14}/>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{t.transferNo}</div>
                                <div style={{fontSize:10,color:"#94a3b8"}}>From: {t.fromLocation?.name} · {t.itemCount} items · {t.totalQty} units</div>
                              </div>
                              <div style={{fontSize:10,color:"#94a3b8",flexShrink:0}}>
                                {t.transferredAt ? new Date(t.transferredAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"}) : "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══════════════════ REVENUE / EXPENSE ═══════════════════ */}
            {tab === "revenue" && (
              <div style={{animation:"fadeUp .25s ease"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><IndianRupee size={18} color={meta.accent}/> Revenue &amp; Expenses</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Pharmacy financial overview — sales revenue vs. purchase expenses</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    {(["today","week","month","all"] as const).map(p=>(
                      <button key={p} onClick={()=>setRevExpPeriod(p)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${revExpPeriod===p?meta.accent:"#e2e8f0"}`,background:revExpPeriod===p?meta.lightBg:"#fff",color:revExpPeriod===p?meta.accent:"#64748b",fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{p==="all"?"All Time":p.charAt(0).toUpperCase()+p.slice(1)}</button>
                    ))}
                    <button onClick={()=>loadRevExp(revExpPeriod)} style={{padding:"6px 12px",borderRadius:20,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><RefreshCw size={12}/> Refresh</button>
                    <button onClick={()=>{setShowAddExpense(true);setExpenseForm({title:"",amount:"",category:"OTHER",date:new Date().toISOString().split("T")[0],description:""});}} style={{padding:"6px 14px",borderRadius:20,border:"none",background:meta.accent,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Plus size={12}/> Add Expense</button>
                  </div>
                </div>

                {revExpLoading ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",color:"#94a3b8",gap:10}}><Loader2 size={20} style={{animation:"spin .7s linear infinite"}}/> Loading financial data...</div>
                ) : !revExpData ? (
                  <div style={{textAlign:"center",padding:"60px 0",color:"#94a3b8",fontSize:14}}>No data yet. Make some sales or purchases to see your financial overview.</div>
                ) : (<>
                  {/* Summary Cards */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
                    {[
                      {label:"Total Revenue",val:revExpData.revenue?.total||0,color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0",icon:<TrendingUp size={18} color="#16a34a"/>},
                      {label:"Total Expenses",val:revExpData.expenses?.total||0,color:"#ef4444",bg:"#fff5f5",border:"#fecaca",icon:<AlertTriangle size={18} color="#ef4444"/>},
                      {label:"Net Profit",val:revExpData.net||0,color:(revExpData.net||0)>=0?"#16a34a":"#ef4444",bg:(revExpData.net||0)>=0?"#f0fdf4":"#fff5f5",border:(revExpData.net||0)>=0?"#bbf7d0":"#fecaca",icon:<IndianRupee size={18} color={(revExpData.net||0)>=0?"#16a34a":"#ef4444"}/>},
                    ].map((c,i)=>(
                      <div key={i} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:44,height:44,borderRadius:12,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.06)",flexShrink:0}}>{c.icon}</div>
                        <div>
                          <div style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em"}}>{c.label}</div>
                          <div style={{fontSize:22,fontWeight:800,color:c.color,marginTop:2}}>₹{(c.val).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Two column: Revenue table + Expense table */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    {/* Revenue — Bills */}
                    <div className="sd2-card">
                      <div className="sd2-card-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span className="sd2-card-title"><TrendingUp size={14} color="#16a34a"/> Sales Revenue ({revExpData.revenue?.items?.length||0})</span>
                      </div>
                      {(revExpData.revenue?.items||[]).length===0 ? (
                        <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No sales yet for this period</div>
                      ) : (
                        <div style={{maxHeight:400,overflowY:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                            <thead><tr style={{background:"#f8fafc"}}>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>Bill No</th>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>Patient</th>
                              <th style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:10}}>Amount</th>
                              <th style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#64748b",fontSize:10}}>Status</th>
                            </tr></thead>
                            <tbody>
                              {(revExpData.revenue?.items||[]).map((b:any,i:number)=>(
                                <tr key={i} style={{borderTop:"1px solid #f1f5f9"}}>
                                  <td style={{padding:"8px 12px",fontWeight:600,color:"#1e293b"}}>{b.billNo}</td>
                                  <td style={{padding:"8px 12px",color:"#475569"}}>{b.patient?.name||"—"}</td>
                                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#16a34a"}}>₹{(b.paidAmount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                                  <td style={{padding:"8px 12px",textAlign:"center"}}>
                                    <span style={{padding:"2px 8px",borderRadius:100,fontSize:9,fontWeight:700,background:b.status==="PAID"?"#dcfce7":b.status==="PENDING"?"#fff7ed":"#eff6ff",color:b.status==="PAID"?"#16a34a":b.status==="PENDING"?"#ea580c":"#2563eb"}}>{b.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Expenses — Purchases */}
                    <div className="sd2-card">
                      <div className="sd2-card-hd" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span className="sd2-card-title"><AlertTriangle size={14} color="#ef4444"/> Purchase Expenses ({revExpData.expenses?.items?.length||0})</span>
                        {revExpData.expenses?.pendingPayouts>0 && <span style={{fontSize:10,fontWeight:700,color:"#ea580c",background:"#fff7ed",padding:"2px 8px",borderRadius:100}}>₹{revExpData.expenses.pendingPayouts.toLocaleString("en-IN")} due</span>}
                      </div>
                      {(revExpData.expenses?.items||[]).length===0 ? (
                        <div style={{padding:"28px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No purchases yet for this period</div>
                      ) : (
                        <div style={{maxHeight:400,overflowY:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                            <thead><tr style={{background:"#f8fafc"}}>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>PO No</th>
                              <th style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:10}}>Supplier</th>
                              <th style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:10}}>Amount</th>
                              <th style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#64748b",fontSize:10}}>Payment</th>
                            </tr></thead>
                            <tbody>
                              {(revExpData.expenses?.items||[]).map((p:any,i:number)=>(
                                <tr key={i} style={{borderTop:"1px solid #f1f5f9"}}>
                                  <td style={{padding:"8px 12px",fontWeight:600,color:"#1e293b"}}>{p.purchaseNo}</td>
                                  <td style={{padding:"8px 12px",color:"#475569"}}>{p.supplier?.name||"—"}</td>
                                  <td style={{padding:"8px 12px",textAlign:"right",fontWeight:700,color:"#ef4444"}}>₹{(p.grandTotal||p.totalAmount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                                  <td style={{padding:"8px 12px",textAlign:"center"}}>
                                    <span style={{padding:"2px 8px",borderRadius:100,fontSize:9,fontWeight:700,background:p.paymentStatus==="PAID"?"#dcfce7":p.paymentStatus==="PENDING"?"#fff7ed":"#eff6ff",color:p.paymentStatus==="PAID"?"#16a34a":p.paymentStatus==="PENDING"?"#ea580c":"#2563eb"}}>{p.paymentStatus||"—"}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>)}
              </div>
            )}

            {/* Add Expense Modal */}
            {showAddExpense && (
              <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowAddExpense(false)}>
                <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:440,border:"1px solid #e2e8f0",boxShadow:"0 20px 60px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:15,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}><Plus size={16} color={meta.accent}/> Add Expense</span>
                    <button onClick={()=>setShowAddExpense(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={16}/></button>
                  </div>
                  <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:12}}>
                    <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Title *</label>
                      <input value={expenseForm.title} onChange={e=>setExpenseForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Medical supplies, Utility bill" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Amount (₹) *</label>
                        <input type="number" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f,amount:e.target.value}))} min="0" step="0.01" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
                      </div>
                      <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Date *</label>
                        <input type="date" value={expenseForm.date} onChange={e=>setExpenseForm(f=>({...f,date:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
                      </div>
                    </div>
                    <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Category</label>
                      <select value={expenseForm.category} onChange={e=>setExpenseForm(f=>({...f,category:e.target.value}))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}>
                        {["SALARIES","RENT","UTILITIES","SUPPLIES","MAINTENANCE","EQUIPMENT","TRANSPORT","MARKETING","OTHER"].map(c=><option key={c} value={c}>{c.charAt(0)+c.slice(1).toLowerCase()}</option>)}
                      </select>
                    </div>
                    <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>Description</label>
                      <input value={expenseForm.description} onChange={e=>setExpenseForm(f=>({...f,description:e.target.value}))} placeholder="Optional notes" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none"}}/>
                    </div>
                  </div>
                  <div style={{padding:"12px 20px",borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"flex-end",gap:8}}>
                    <button onClick={()=>setShowAddExpense(false)} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    <button disabled={expenseSaving||!expenseForm.title||!expenseForm.amount||!expenseForm.date} onClick={async()=>{
                      setExpenseSaving(true);
                      const res = await fetch("/api/pharmacy/revenue-expense",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(expenseForm)}).then(r=>r.json());
                      setExpenseSaving(false);
                      if(res.success){setShowAddExpense(false);loadRevExp(revExpPeriod);}
                    }} style={{padding:"8px 20px",borderRadius:8,border:"none",background:expenseSaving?"#94a3b8":meta.accent,color:"#fff",fontSize:12,fontWeight:700,cursor:expenseSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6}}>
                      {expenseSaving?<><Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>Saving…</>:<><Plus size={13}/>Add Expense</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ FINANCE (fallback placeholder) ═══════════════════ */}
            {["finance"].includes(tab) && (() => {
              const fm: Record<string,{icon:any;color:string;bg:string;title:string;desc:string}> = {
                finance: {icon:<TrendingUp size={28}/>,color:"#6366f1",bg:"#eef2ff",title:"Finance",desc:"Track revenue, expenses and financial reports."},
              };
              const f = fm[tab];
              return (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:360}}>
                  <div style={{textAlign:"center",maxWidth:360}}>
                    <div style={{width:72,height:72,borderRadius:20,background:f.bg,border:`2px solid ${f.color}22`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",color:f.color}}>{f.icon}</div>
                    <div style={{fontSize:22,fontWeight:800,color:"#1e293b",marginBottom:8}}>{f.title}</div>
                    <div style={{fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:20}}>{f.desc}</div>
                    <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 18px",borderRadius:100,background:f.bg,border:`1.5px solid ${f.color}44`,color:f.color,fontSize:12,fontWeight:700}}>
                      <Clock size={14}/> Coming Soon
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ═══════════════════ DEPARTMENT INFO ═══════════════════ */}
            {tab==="dept" && (
              <div style={{animation:"fadeUp .25s ease"}}>
                {/* Dept hero banner */}
                <div style={{background:meta.gradient,borderRadius:16,padding:"24px 28px",marginBottom:18,display:"flex",alignItems:"center",gap:20,color:"#fff",position:"relative",overflow:"hidden"}}>
                  <div style={{width:64,height:64,borderRadius:16,background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <DeptIcon size={30} color="#fff"/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:22,fontWeight:800,letterSpacing:"-.01em"}}>{deptName}</div>
                    <div style={{fontSize:13,opacity:.85,marginTop:2}}>{profile?.type?.replace(/_/g," ")} Department{profile?.code ? ` · ${profile.code}` : ""}</div>
                    {profile?.description && <div style={{fontSize:12,opacity:.75,marginTop:6,lineHeight:1.5}}>{profile.description}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:100,background:"rgba(255,255,255,.2)",fontSize:12,fontWeight:700}}>
                      {profile?.isActive ? <><CheckCircle size={13}/> Active</> : <><X size={13}/> Inactive</>}
                    </div>
                  </div>
                </div>

                {/* 3-col info grid */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
                  {/* HOD Card */}
                  <div className="sd2-card" style={{gridColumn:"1/2"}}>
                    <div className="sd2-card-hd"><span className="sd2-card-title"><User size={14} color={meta.accent}/>Head of Department</span></div>
                    <div style={{padding:"16px 20px"}}>
                      {profile?.hodName ? (
                        <>
                          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"12px 14px",background:meta.lightBg,borderRadius:10,border:`1px solid ${meta.borderColor}`}}>
                            <div style={{width:44,height:44,borderRadius:11,background:meta.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:"#fff",flexShrink:0}}>{initials(profile.hodName)}</div>
                            <div>
                              <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{profile.hodName}</div>
                              <div style={{fontSize:11,color:"#94a3b8"}}>Head of Department</div>
                            </div>
                          </div>
                          {profile.hodEmail && <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #f1f5f9",fontSize:12,color:"#475569"}}><Mail size={12} color={meta.accent}/>{profile.hodEmail}</div>}
                          {profile.hodPhone && <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",fontSize:12,color:"#475569"}}><Phone size={12} color={meta.accent}/>{profile.hodPhone}</div>}
                        </>
                      ) : <div style={{padding:"24px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No HOD assigned yet</div>}
                    </div>
                  </div>

                  {/* Dept Details Card */}
                  <div className="sd2-card" style={{gridColumn:"2/3"}}>
                    <div className="sd2-card-hd"><span className="sd2-card-title"><Building2 size={14} color={meta.accent}/>Department Details</span></div>
                    <div style={{padding:"16px 20px"}}>
                      {[
                        ["Name",        deptName],
                        ["Type",        profile?.type?.replace(/_/g," ") || "—"],
                        ["Short Code",  profile?.code || "—"],
                        ["Parent Dept", profile?.department?.name || "Independent"],
                        ["Login Email", profile?.loginEmail || user?.email || "—"],
                        ["Status",      profile?.isActive ? "Active" : "Inactive"],
                      ].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f8fafc"}}>
                          <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{k}</span>
                          <span style={{fontSize:12,fontWeight:600,color:k==="Status"?(profile?.isActive?"#16a34a":"#ef4444"):"#1e293b",maxWidth:160,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services / Procedures Card */}
                  <div className="sd2-card" style={{gridColumn:"3/4"}}>
                    <div className="sd2-card-hd"><span className="sd2-card-title"><ClipboardList size={14} color={meta.accent}/>Services Offered</span></div>
                    <div style={{padding:"16px 20px"}}>
                      {displayProcs.length === 0 ? (
                        <div style={{padding:"24px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No procedures configured yet</div>
                      ) : (
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {displayProcs.slice(0,8).map((p:any,i:number)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f8fafc"}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                                <span style={{width:6,height:6,borderRadius:"50%",background:p.isActive?meta.accent:"#cbd5e1",flexShrink:0,display:"inline-block"}}/>
                                <span style={{fontSize:12,fontWeight:500,color:p.isActive?"#1e293b":"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                              </div>
                              {p.fee>0 && <span style={{fontSize:11,fontWeight:700,color:meta.accent,flexShrink:0,marginLeft:8}}>₹{p.fee}</span>}
                            </div>
                          ))}
                          {displayProcs.length > 8 && <div style={{fontSize:11,color:"#94a3b8",marginTop:4,textAlign:"center"}}>+{displayProcs.length-8} more services</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats bar */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                  {[
                    {label:"Active Services",val:activeProcs.length,color:meta.accent,bg:meta.lightBg,border:meta.borderColor},
                    {label:"Today's Queue",val:queue.length,color:"#2563eb",bg:"#eff6ff",border:"#bfdbfe"},
                    {label:"Total Records",val:recordsMeta.total||0,color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0"},
                    {label:"Today's Revenue",val:`₹${((records.filter((r:any)=>new Date(r.performedAt).toDateString()===new Date().toDateString()).reduce((s:number,r:any)=>s+(r.amount||0),0))).toLocaleString("en-IN")}`,color:"#7c3aed",bg:"#faf5ff",border:"#e9d5ff"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
                      <div style={{fontSize:10,fontWeight:600,color:s.color,opacity:.8,marginTop:2,textTransform:"uppercase",letterSpacing:".05em"}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            </>)}
          </div>
        </main>
      </div>

      {/* Modals */}
      {viewingRecord && <ViewRecordModal record={viewingRecord} onClose={() => setViewingRecord(null)} meta={meta} />}
      {editingRecord && <EditRecordModal record={editingRecord} onClose={() => setEditingRecord(null)} onSave={handleEditRecord} meta={meta} />}
      {transferTarget && <TransferPatientModal record={transferTarget} subDepts={subDepts} onClose={() => setTransferTarget(null)} onTransfer={handleTransferPatient} meta={meta} />}
      {viewPrescription && <ViewPrescriptionModal appointment={viewPrescription} onClose={() => setViewPrescription(null)} meta={meta} />}
    </>
  );
}

export default function SubDeptDashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", fontSize: 14, gap: 14 }}>
        <Loader2 size={24} style={{ animation: "spin .7s linear infinite" }} />
        Loading dashboard...
      </div>
    }>
      <SubDeptDashboardContent />
    </Suspense>
  );
}
