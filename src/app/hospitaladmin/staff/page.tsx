"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, BarChart2, LayoutDashboard, Settings,
  LogOut, Bell, ArrowLeft, Loader2, UserCheck, UserX,
  Stethoscope, Activity, CheckCircle2, User,
  Shield, Send, ChevronRight,
} from "lucide-react";
import StaffPanel from "@/components/StaffPanel";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

type Tab = "staff" | "overview";

const STAFF_ROLES = [
  { value: "NURSE",          label: "Nurse",          color: "#07595D",  bg: "#E6F4F4",  border: "#B3E0E0" },
  { value: "TECHNICIAN",     label: "Technician",     color: "#6d28d9",  bg: "#faf5ff",  border: "#ede9fe" },
  { value: "PHARMACIST",     label: "Pharmacist",     color: "#15803d",  bg: "#f0fdf4",  border: "#bbf7d0" },
  { value: "RECEPTIONIST",   label: "Receptionist",   color: "#be185d",  bg: "#fdf2f8",  border: "#fbcfe8" },
  { value: "LAB_TECHNICIAN", label: "Lab Technician", color: "#92400e",  bg: "#fffbeb",  border: "#fde68a" },
  { value: "ACCOUNTANT",     label: "Accountant",     color: "#3730a3",  bg: "#eef2ff",  border: "#c7d2fe" },
  { value: "ADMIN",          label: "Admin",          color: "#b91c1c",  bg: "#fff5f5",  border: "#fecaca" },
  { value: "SUPPORT",        label: "Support",        color: "#475569",  bg: "#f8fafc",  border: "#e2e8f0" },
  { value: "OTHER",          label: "Other",          color: "#475569",  bg: "#f8fafc",  border: "#e2e8f0" },
];

const AVATAR_GRAD: Record<string, string> = {
  NURSE: "linear-gradient(135deg,#B3E0E0,#7fcfcf)",
  TECHNICIAN: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
  PHARMACIST: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
  RECEPTIONIST: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
  LAB_TECHNICIAN: "linear-gradient(135deg,#fef9c3,#fde68a)",
  ACCOUNTANT: "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
  ADMIN: "linear-gradient(135deg,#fee2e2,#fecaca)",
  SUPPORT: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
  OTHER: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
};

const AVATAR_COLOR: Record<string, string> = {
  NURSE: "#07595D", TECHNICIAN: "#6d28d9", PHARMACIST: "#15803d",
  RECEPTIONIST: "#be185d", LAB_TECHNICIAN: "#92400e", ACCOUNTANT: "#3730a3",
  ADMIN: "#b91c1c", SUPPORT: "#475569", OTHER: "#475569",
};

const initials = (n: string) => n.split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase();

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>("staff");

  const TABS = [
    { id: "staff" as Tab,    label: "Staff Members", icon: Users },
    { id: "overview" as Tab, label: "Overview",      icon: BarChart2 },
  ];

  return (
    <div className="hd-center">
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${active ? "#0E898F" : "#e2e8f0"}`, background: active ? "#E6F4F4" : "#fff", color: active ? "#0A6B70" : "#64748b", fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer" }}>
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
        {tab === "staff"    && "Manage all hospital staff — add, edit, assign roles, and control portal access"}
        {tab === "overview" && "Summary of staff distribution, role breakdown, and recent activity"}
      </div>
      {tab === "staff"    && <StaffPanel />}
      {tab === "overview" && <StaffOverviewPanel onManageStaff={() => setTab("staff")} />}
    </div>
  );
}

// ─── Staff Overview Panel ─────────────────────────────────────────────────────
function StaffOverviewPanel({ onManageStaff }: { onManageStaff: () => void }) {
  const router = useRouter();
  const [stats, setStats]       = useState<any>(null);
  const [recent, setRecent]     = useState<any[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, listRes] = await Promise.all([
          api("/api/config/staff?stats=true&limit=1"),
          api("/api/config/staff?limit=100&sortBy=joinDate&sortDir=desc"),
        ]);

        if (statsRes.success) {
          setStats(statsRes.data?.stats || statsRes.data?.pagination || null);
        }

        if (listRes.success) {
          const members: any[] = listRes.data?.data || [];
          setRecent(members.slice(0, 8));

          const counts: Record<string, number> = {};
          members.forEach((m: any) => {
            counts[m.role] = (counts[m.role] || 0) + 1;
          });
          setRoleCounts(counts);

          if (!statsRes.success || !statsRes.data?.stats) {
            const total    = listRes.data?.pagination?.total ?? members.length;
            const active   = members.filter((m: any) => m.isActive).length;
            const inactive = members.filter((m: any) => !m.isActive).length;
            const credSent = members.filter((m: any) => m.credentialsSent).length;
            setStats({ total, active, inactive, credentialsSent: credSent });
          }
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", color: "#94a3b8" }}>
      <Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} />Loading overview...
    </div>
  );

  const total    = stats?.total    ?? 0;
  const active   = stats?.active   ?? 0;
  const inactive = stats?.inactive ?? (total - active);
  const credSent = stats?.credentialsSent ?? 0;

  const summaryCards = [
    { label: "Total Staff",         val: total,    icon: <Users size={20} color="#fff" />,        iconBg: "#0E898F", bg: "#E6F4F4" },
    { label: "Active",              val: active,   icon: <UserCheck size={20} color="#fff" />,    iconBg: "#10b981", bg: "#f0fdf4" },
    { label: "Inactive",            val: inactive, icon: <UserX size={20} color="#fff" />,        iconBg: "#f59e0b", bg: "#fffbeb" },
    { label: "Portal Access Sent",  val: credSent, icon: <Send size={20} color="#fff" />,         iconBg: "#8b5cf6", bg: "#faf5ff" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Gradient Header Banner */}
      <div style={{ background: "linear-gradient(135deg,#0E898F,#07595D)", borderRadius: 16, padding: "24px 28px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={22} /> Staff & Team Overview
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)" }}>
            {total} total staff members · {active} active · {inactive} inactive
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onManageStaff}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.2)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} /> Manage Staff
          </button>
          <button onClick={() => router.push("/hospitaladmin/configure?tab=doctors")}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Stethoscope size={14} /> Manage Doctors
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${c.iconBg}44` }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Role Distribution */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Staff by Role</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Distribution across all roles</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={15} color="#0E898F" />
            </div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {STAFF_ROLES.filter(r => roleCounts[r.value] > 0).length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>
                No staff data available
              </div>
            ) : (
              STAFF_ROLES.filter(r => roleCounts[r.value] > 0).map(role => {
                const count = roleCounts[role.value] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={role.value}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                          {role.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{count}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: role.color, borderRadius: 100, transition: "width .5s ease" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Staff */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Recently Added</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Latest staff members onboarded</div>
            </div>
            <button onClick={onManageStaff}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#0E898F", background: "#E6F4F4", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {recent.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>
                <User size={26} style={{ margin: "0 auto 8px", display: "block", opacity: .3 }} />
                No staff members yet
              </div>
            ) : (
              recent.map((m: any) => {
                const role = STAFF_ROLES.find(r => r.value === m.role);
                return (
                  <div key={m.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f8fafc", cursor: "default" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: AVATAR_GRAD[m.role] || AVATAR_GRAD.OTHER, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: AVATAR_COLOR[m.role] || "#475569", flexShrink: 0 }}>
                      {initials(m.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{m.email}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: role?.bg || "#f8fafc", color: role?.color || "#475569", border: `1px solid ${role?.border || "#e2e8f0"}` }}>
                        {role?.label || m.role}
                      </span>
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 100, background: m.isActive ? "#f0fdf4" : "#f8fafc", color: m.isActive ? "#16a34a" : "#94a3b8", fontWeight: 600, border: `1px solid ${m.isActive ? "#bbf7d0" : "#e2e8f0"}` }}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Credential Status Row */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Portal Access Status</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Staff members who can log into the portal</div>
          </div>
          <button onClick={onManageStaff}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1.5px solid #0E898F", background: "none", color: "#0E898F", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Send size={13} /> Send Credentials
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Credentials Sent",    val: credSent,           color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle2 size={18} /> },
            { label: "Pending Send",        val: Math.max(0, active - credSent), color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: <Activity size={18} /> },
            { label: "Inactive (No Login)", val: inactive,            color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", icon: <UserX size={18} /> },
          ].map((c, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: c.color }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          {
            title: "Add New Staff",
            desc: "Onboard a new staff member to your hospital team",
            icon: <Users size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#0E898F,#07595D)",
            action: onManageStaff,
            label: "Add Staff",
          },
          {
            title: "Configure Roles",
            desc: "Manage staff roles, permissions, and access levels",
            icon: <Shield size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#6d28d9,#7c3aed)",
            action: () => router.push("/hospitaladmin/configure?tab=staff"),
            label: "Configure",
          },
          {
            title: "Manage Doctors",
            desc: "View and manage all registered doctors and their credentials",
            icon: <Stethoscope size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#10b981,#059669)",
            action: () => router.push("/hospitaladmin/configure?tab=doctors"),
            label: "Go to Doctors",
          },
        ].map((card, i) => (
          <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ background: card.bg, padding: "20px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {card.icon}
              </div>
              <div style={{ color: "#fff" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{card.title}</div>
                <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>{card.desc}</div>
              </div>
            </div>
            <div style={{ padding: "14px 22px" }}>
              <button onClick={card.action}
                style={{ width: "100%", padding: "9px 0", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {card.label} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
