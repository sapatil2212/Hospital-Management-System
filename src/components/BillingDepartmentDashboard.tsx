"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  LayoutDashboard, Receipt, FileText, Package, BarChart2, Building2,
  IndianRupee, Clock, CheckCircle2, TrendingUp, Plus, CreditCard,
  Loader2, RefreshCw, Calendar, Users, ArrowUpRight, AlertCircle
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

const fmtCur = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const apiFetch = async (url: string, opts?: RequestInit) => {
  const r = await fetch(url, { credentials: "include", ...opts });
  return r.json();
};

export default function BillingDepartmentDashboard({ profile, user, activeTab, onTabChange, meta }: BillingDeptProps) {
  const tab = (activeTab || "overview") as BillingTab;
  const setTab = (t: BillingTab) => onTabChange(t);

  // Stats
  const [stats, setStats] = useState({ todayRevenue: 0, monthRevenue: 0, pendingCount: 0, totalBills: 0, paidCount: 0, totalCollected: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

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
          totalCollected: s.monthRevenue || 0,
        });
      }
      if (queueRes.success) {
        const pending = (queueRes.data || []).filter((item: any) => item.bill?.status !== "PAID");
        setQueueCount(pending.length);
      }
    } catch {}
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "overview") loadStats();
  }, [tab, loadStats]);

  // For non-billing tabs, signal parent to render generic content
  const isHandledLocally = ["overview", "billing-queue", "finance", "inventory"].includes(tab);

  if (!isHandledLocally) {
    // Return null - parent will render inventory/reports/dept
    return null;
  }

  return (
    <>
      {/* ═══ Overview ═══ */}
      {tab === "overview" && (
        <>
          {/* Hero Banner */}
          <div style={{
            background: meta.gradient, borderRadius: 18, padding: "28px 30px", marginBottom: 22,
            color: "#fff", position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", right: -20, top: -20, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
            <div style={{ position: "absolute", right: 70, bottom: -35, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Receipt size={28} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .75, marginBottom: 4 }}>Billing Department</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, lineHeight: 1.2 }}>{profile?.name || "Billing Department"}</h1>
                {profile?.description && <p style={{ fontSize: 13, opacity: .82, maxWidth: 520 }}>{profile.description}</p>}
              </div>
              <div style={{ flexShrink: 0, display: "flex", gap: 10 }}>
                <button onClick={() => setTab("billing-queue")} style={{
                  background: "rgba(255,255,255,.2)", padding: "10px 18px", borderRadius: 100,
                  fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,.3)",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  backdropFilter: "blur(4px)"
                }}>
                  <CreditCard size={16} /> Collect Payment
                </button>
                <button onClick={() => setTab("billing-queue")} style={{
                  background: meta.accent, padding: "10px 18px", borderRadius: 100,
                  fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,.3)",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}>
                  <Plus size={16} /> New Bill
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Today's Revenue", value: fmtCur(stats.todayRevenue), Icon: IndianRupee, color: "#10b981", bg: "#f0fdf4", click: () => setTab("billing-queue") },
              { label: "Monthly Revenue", value: fmtCur(stats.monthRevenue), Icon: TrendingUp, color: "#0E898F", bg: "#E6F4F4", click: () => setTab("billing-queue") },
              { label: "Pending Queue", value: queueCount, Icon: Clock, color: "#0E898F", bg: "#E6F4F4", click: () => setTab("billing-queue") },
              { label: "Pending Bills", value: stats.pendingCount, Icon: AlertCircle, color: "#ef4444", bg: "#fef2f2", click: () => setTab("billing-queue") },
              { label: "Total Bills", value: stats.totalBills, Icon: FileText, color: "#6366f1", bg: "#eef2ff", click: () => setTab("billing-queue") },
            ].map((s, i) => {
              const SI = s.Icon;
              return (
                <div key={i} onClick={s.click} className="sd2-sc" style={{ cursor: "pointer", padding: 16, gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SI size={20} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
                      {statsLoading ? <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> : s.value}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Billing Queue Preview */}
            <div className="sd2-card">
              <div className="sd2-card-hd">
                <span className="sd2-card-title"><CreditCard size={15} color={meta.accent} /> Payment Queue</span>
                <button onClick={() => setTab("billing-queue")} style={{
                  fontSize: 12, fontWeight: 600, color: meta.accent, background: meta.lightBg,
                  border: `1px solid ${meta.borderColor}`, borderRadius: 8, padding: "5px 12px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}>
                  View All <ArrowUpRight size={12} />
                </button>
              </div>
              <div style={{ padding: "20px 18px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Clock size={24} color="#0E898F" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                  {statsLoading ? <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} /> : queueCount}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Pending payments in queue</div>
                <button onClick={() => setTab("billing-queue")} style={{
                  background: meta.gradient, color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8
                }}>
                  <CreditCard size={15} /> Start Collecting
                </button>
              </div>
            </div>

            {/* Total Bills Preview */}
            <div className="sd2-card">
              <div className="sd2-card-hd">
                <span className="sd2-card-title"><FileText size={15} color={meta.accent} /> Total Bills</span>
                <button onClick={() => setTab("billing-queue")} style={{
                  fontSize: 12, fontWeight: 600, color: meta.accent, background: meta.lightBg,
                  border: `1px solid ${meta.borderColor}`, borderRadius: 8, padding: "5px 12px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}>
                  View All <ArrowUpRight size={12} />
                </button>
              </div>
              <div style={{ padding: "20px 18px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <FileText size={24} color="#6366f1" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                  {statsLoading ? <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} /> : stats.totalBills}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Total bills generated</div>
                <button onClick={() => setTab("billing-queue")} style={{
                  background: meta.gradient, color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8
                }}>
                  <CreditCard size={15} /> View Billing Queue
                </button>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <button onClick={loadStats} disabled={statsLoading} style={{
              display: "flex", alignItems: "center", gap: 6, background: "#f8fafc",
              border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 16px",
              fontSize: 12, fontWeight: 600, color: "#64748b", cursor: statsLoading ? "not-allowed" : "pointer"
            }}>
              <RefreshCw size={13} style={statsLoading ? { animation: "spin .7s linear infinite" } : {}} />
              {statsLoading ? "Loading..." : "Refresh Stats"}
            </button>
          </div>
        </>
      )}

      {/* ═══ Billing Queue - Identical to Hospital Admin billing tab ═══ */}
      {tab === "billing-queue" && <BillingQueue />}

      {/* ═══ Finance - Identical to Hospital Admin finance page ═══ */}
      {tab === "finance" && (
        <div style={{ margin: "-24px", padding: "24px" }}>
          <FinancePanel />
        </div>
      )}

      {/* ═══ Inventory - Identical to Hospital Admin inventory tab ═══ */}
      {tab === "inventory" && (
        <div style={{ margin: "-24px", padding: "24px" }}>
          <AdminInventoryPanel />
        </div>
      )}
    </>
  );
}
