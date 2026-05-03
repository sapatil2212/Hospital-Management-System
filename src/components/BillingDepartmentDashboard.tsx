"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FileText, IndianRupee, Clock, CheckCircle2, TrendingUp,
  CreditCard, Loader2, RefreshCw, AlertCircle, ArrowUpRight,
  Wallet, BarChart2, Activity
} from "lucide-react";

const BillingQueue = dynamic(() => import("@/components/BillingQueue"), { ssr: false, loading: () => <LoadingPlaceholder label="Billing Queue" /> });
const FinancePanel = dynamic(() => import("@/app/hospitaladmin/finance/page"), { ssr: false, loading: () => <LoadingPlaceholder label="Finance" /> });
const AdminInventoryPanel = dynamic(() => import("@/components/AdminInventoryPanel"), { ssr: false, loading: () => <LoadingPlaceholder label="Inventory" /> });

function LoadingPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Loader2 size={22} color="#0E898F" style={{ animation: "spin .7s linear infinite" }} />
      <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading {label}...</span>
    </div>
  );
}

interface BillingDeptProps {
  profile: any;
  user: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  meta: { gradient: string; accent: string; lightBg: string; borderColor: string };
}

type BillingTab = "overview" | "billing-queue" | "finance" | "inventory" | "reports" | "dept";

const fmtCur = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

const apiFetch = async (url: string, opts?: RequestInit) => {
  const r = await fetch(url, { credentials: "include", ...opts });
  return r.json();
};

export default function BillingDepartmentDashboard({ profile, user, activeTab, onTabChange, meta }: BillingDeptProps) {
  const tab = (activeTab || "overview") as BillingTab;
  const setTab = (t: BillingTab) => onTabChange(t);

  const ACCENT    = meta.accent;
  const LIGHT_BG  = meta.lightBg;
  const BORDER    = meta.borderColor;

  const [stats, setStats]               = useState({ todayRevenue: 0, monthRevenue: 0, pendingCount: 0, totalBills: 0, paidCount: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [queueCount, setQueueCount]     = useState(0);
  const [recentQueue, setRecentQueue]   = useState<any[]>([]);
  const [lastRefresh, setLastRefresh]   = useState<Date>(new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [billRes, queueRes] = await Promise.all([
        apiFetch("/api/billing?page=1&limit=1"),
        apiFetch("/api/billing/queue"),
      ]);
      if (billRes.success) {
        const s = billRes.data?.stats || {};
        const p = billRes.data?.pagination || {};
        setStats({
          todayRevenue: s.todayRevenue || 0,
          monthRevenue: s.monthRevenue || 0,
          pendingCount: s.pendingCount || 0,
          totalBills: p.total || 0,
          paidCount: (p.total || 0) - (s.pendingCount || 0),
        });
      }
      if (queueRes.success) {
        const all   = queueRes.data || [];
        const pend  = all.filter((item: any) => item.bill?.status !== "PAID");
        setQueueCount(pend.length);
        setRecentQueue(pend.slice(0, 5));
      }
    } catch {}
    setStatsLoading(false);
    setLastRefresh(new Date());
  }, []);

  // Auto-refresh every 30 s on overview
  useEffect(() => {
    if (tab !== "overview") return;
    const tick = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) { loadStats(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [tab, loadStats]);

  useEffect(() => {
    if (tab === "overview") loadStats();
  }, [tab, loadStats]);

  const collectionRate = stats.totalBills > 0 ? Math.round((stats.paidCount / stats.totalBills) * 100) : 0;

  // ── Passthrough tabs ──
  if (tab === "billing-queue") return <BillingQueue />;
  if (tab === "finance")    return <div style={{ padding: 24 }}><FinancePanel /></div>;
  if (tab === "inventory")  return <div style={{ padding: "32px 20px", overflowY: "auto" }}><AdminInventoryPanel /></div>;

  // ── Overview ──
  return (
    <div style={{ background: "#f8fafc", padding: 24, minHeight: "100%" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>
            {profile?.name || "Billing Department"} Dashboard
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7", flexShrink: 0 }} />
            Live &middot; Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0", fontSize: 11, color: "#64748b" }}>
            <svg width="18" height="18" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
              <circle cx="9" cy="9" r="7" fill="none" stroke="#e2e8f0" strokeWidth="2" />
              <circle cx="9" cy="9" r="7" fill="none" stroke={ACCENT} strokeWidth="2"
                strokeDasharray={`${(refreshCountdown / 30) * 44} 44`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray .5s linear" }} />
            </svg>
            Refresh in {refreshCountdown}s
          </div>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
            onClick={() => { loadStats(); setRefreshCountdown(30); }}
          >
            <RefreshCw size={13} style={statsLoading ? { animation: "spin 1s linear infinite" } : {}} /> Refresh
          </button>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, border: "none", background: meta.gradient, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            onClick={() => setTab("billing-queue")}
          >
            <CreditCard size={13} /> Billing Queue
          </button>
        </div>
      </div>

      {/* ── Row 1: 4 KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>

        {/* Today's Revenue */}
        <div
          style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(22,163,74,.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
          onClick={() => setTab("billing-queue")}
        >
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IndianRupee size={20} color="#16a34a" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                {statsLoading ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : fmtCur(stats.todayRevenue)}
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", borderRadius: 10, border: "1px solid #bbf7d0" }}>TODAY</span>
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Today&apos;s Revenue</div>
          </div>
        </div>

        {/* Pending Queue */}
        <div
          style={{ background: queueCount > 0 ? "#fff7ed" : "#fff", borderRadius: 12, padding: 12, border: `1px solid ${queueCount > 0 ? "#fed7aa" : "#e2e8f0"}`, cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(234,88,12,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
          onClick={() => setTab("billing-queue")}
        >
          <div style={{ width: 44, height: 44, borderRadius: 11, background: queueCount > 0 ? "#fff3e6" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={20} color={queueCount > 0 ? "#ea580c" : "#94a3b8"} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: queueCount > 0 ? "#ea580c" : "#0f172a", lineHeight: 1 }}>
                {statsLoading ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : queueCount}
              </div>
              {queueCount > 0 ? (
                <span style={{ fontSize: 8, fontWeight: 700, color: "#ea580c", background: "#fff3e6", padding: "2px 6px", borderRadius: 10, border: "1px solid #fed7aa", display: "flex", alignItems: "center", gap: 2 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#ea580c", display: "inline-block" }} /> PENDING
                </span>
              ) : (
                <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", borderRadius: 10, border: "1px solid #bbf7d0" }}>CLEAR</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Pending Queue</div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div
          style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${ACCENT}1a`; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
          onClick={() => setTab("finance")}
        >
          <div style={{ width: 44, height: 44, borderRadius: 11, background: LIGHT_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={20} color={ACCENT} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 2 }}>
              {statsLoading ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : fmtCur(stats.monthRevenue)}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Monthly Revenue</div>
          </div>
        </div>

        {/* Total Bills */}
        <div
          style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
          onClick={() => setTab("billing-queue")}
        >
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} color="#2563eb" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 2 }}>
              {statsLoading ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : stats.totalBills}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>Total Bills</div>
          </div>
        </div>
      </div>

      {/* ── Row 2: 4 Secondary Stat Chips ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { icon: <CheckCircle2 size={16} color="#16a34a" />, value: stats.paidCount, label: "Paid Bills", bg: "#f0fdf4", urgent: false },
          { icon: <AlertCircle size={16} color={stats.pendingCount > 0 ? "#ea580c" : "#94a3b8"} />, value: stats.pendingCount, label: "Pending Bills", bg: stats.pendingCount > 0 ? "#fff7ed" : "#f8fafc", urgent: stats.pendingCount > 0 },
          { icon: <Activity size={16} color="#9333ea" />, value: `${collectionRate}%`, label: "Collection Rate", bg: "#faf5ff", urgent: false },
          { icon: <Wallet size={16} color={ACCENT} />, value: fmtCur(stats.monthRevenue), label: "Month Collection", bg: LIGHT_BG, urgent: false },
        ].map((chip, i) => (
          <div key={i}
            style={{ background: chip.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${chip.urgent ? "#fed7aa" : "#e2e8f0"}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            onClick={() => setTab("billing-queue")}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>{chip.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                {statsLoading ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : chip.value}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{chip.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 3: Recent Queue (3fr) + Quick Actions (2fr) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>

        {/* Recent Pending Queue */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={15} color={ACCENT} /> Pending Queue
            </div>
            <button onClick={() => setTab("billing-queue")} style={{ fontSize: 12, fontWeight: 600, color: ACCENT, background: LIGHT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              View All <ArrowUpRight size={12} />
            </button>
          </div>

          {statsLoading ? (
            <div style={{ padding: "36px 18px", textAlign: "center" }}>
              <Loader2 size={20} color={ACCENT} style={{ animation: "spin .7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : recentQueue.length === 0 ? (
            <div style={{ padding: "36px 18px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <CheckCircle2 size={22} color="#16a34a" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>All Clear!</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>No pending payments in queue</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Patient", "Doctor", "Amount", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: "#94a3b8", padding: "10px 14px", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentQueue.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={e => (e.currentTarget.style.background = LIGHT_BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#1e293b", fontWeight: 600 }}>
                      {item.patient?.name || "—"}
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>{item.patient?.patientId || ""}</div>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#475569" }}>{item.doctor?.name || "Walk-in"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{fmtCur(item.bill?.total || item.consultationFee || 0)}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}>Pending</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Action Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Collect Payment */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 18, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: LIGHT_BG, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <CreditCard size={24} color={ACCENT} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Collect Payment</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: queueCount > 0 ? "#ea580c" : "#16a34a", display: "block", lineHeight: 1.2 }}>{queueCount}</span>
              payments waiting
            </div>
            <button onClick={() => setTab("billing-queue")} style={{ background: meta.gradient, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center" }}>
              <CreditCard size={14} /> Open Queue
            </button>
          </div>

          {/* Finance Overview */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 18, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: LIGHT_BG, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <BarChart2 size={24} color={ACCENT} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Finance Overview</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "block" }}>{fmtCur(stats.monthRevenue)}</span>
              collected this month
            </div>
            <button onClick={() => setTab("finance")} style={{ background: meta.gradient, color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center" }}>
              <BarChart2 size={14} /> View Finance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
