"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Loader2, Bell, User, Phone, Mail, Activity,
  Layers, ArrowRight, CheckCircle, Clock, Stethoscope, Settings
} from "lucide-react";

const SUB_DEPT_META: Record<string, { icon: string; gradient: string; lightBg: string }> = {
  DENTAL:       { icon: "🦷", gradient: "linear-gradient(135deg,#06b6d4,#0891b2)", lightBg: "#ecfeff" },
  DERMATOLOGY:  { icon: "🧴", gradient: "linear-gradient(135deg,#ec4899,#be185d)", lightBg: "#fdf2f8" },
  HAIR:         { icon: "💆", gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)", lightBg: "#f5f3ff" },
  ONCOLOGY:     { icon: "🎗️", gradient: "linear-gradient(135deg,#f97316,#c2410c)", lightBg: "#fff7ed" },
  CARDIOLOGY:   { icon: "❤️", gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", lightBg: "#fff5f5" },
  PATHOLOGY:    { icon: "🔬", gradient: "linear-gradient(135deg,#10b981,#047857)", lightBg: "#f0fdf4" },
  PHARMACY:     { icon: "💊", gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)", lightBg: "#eff6ff" },
  BILLING:      { icon: "🧾", gradient: "linear-gradient(135deg,#f59e0b,#b45309)", lightBg: "#fffbeb" },
  RADIOLOGY:    { icon: "🩻", gradient: "linear-gradient(135deg,#6366f1,#4338ca)", lightBg: "#eef2ff" },
  LABORATORY:   { icon: "🧪", gradient: "linear-gradient(135deg,#14b8a6,#0f766e)", lightBg: "#f0fdfa" },
  PROCEDURE:    { icon: "🏥", gradient: "linear-gradient(135deg,#84cc16,#4d7c0f)", lightBg: "#f7fee7" },
  OTHER:        { icon: "📋", gradient: "linear-gradient(135deg,#64748b,#334155)", lightBg: "#f8fafc" },
};

const PROC_TYPE_COLOR: Record<string, string> = {
  DIAGNOSTIC: "#3b82f6", TREATMENT: "#10b981", CONSULTATION: "#8b5cf6",
  SURGERY: "#ef4444", THERAPY: "#f97316", MEDICATION: "#06b6d4", OTHER: "#94a3b8",
};

export default function SubDeptDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        const meData = await meRes.json();
        if (!meData.success || meData.data?.role !== "SUB_DEPT_HEAD") {
          router.push("/subdept/login");
          return;
        }
        setUser(meData.data);

        const profileRes = await fetch("/api/subdept/me", { credentials: "include" });
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.data);
        }
      } catch {
        router.push("/subdept/login");
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/subdept/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", gap: 10 }}>
        <Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} />Loading...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const meta = SUB_DEPT_META[profile?.type || "OTHER"] || SUB_DEPT_META.OTHER;
  const procedures: any[] = profile?.procedures || [];
  const activeProcedures = procedures.filter((p: any) => p.isActive);
  const initials = (name: string) => name?.split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase() || "SD";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        body{font-family:'Inter',sans-serif;background:#f0f4f8}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sdash-spin{animation:spin .7s linear infinite}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .sdash-fade{animation:fadeUp .4s ease}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Inter',sans-serif" }}>
        {/* Header */}
        <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {meta.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{profile?.name || "Sub-Department"}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{profile?.type?.replace(/_/g, " ")} Portal</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Bell size={15} color="#64748b" />
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
              {initials(user?.name || profile?.hodName || "SD")}
            </div>
            <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "1px solid #fee2e2", background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <LogOut size={13} />Logout
            </button>
          </div>
        </header>

        <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }} className="sdash-fade">

          {/* Hero Banner */}
          <div style={{ background: meta.gradient, borderRadius: 20, padding: "28px 32px", marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <div style={{ position: "absolute", right: 60, bottom: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>{meta.icon}</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{profile?.name || "Sub-Department"}</h1>
              {profile?.description && <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 10, maxWidth: 500 }}>{profile.description}</p>}
              {profile?.flow && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500 }}>
                  <ArrowRight size={12} />
                  {profile.flow}
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total Procedures", value: procedures.length, icon: Layers, color: "#3b82f6", bg: "#eff6ff" },
              { label: "Active Procedures", value: activeProcedures.length, icon: CheckCircle, color: "#10b981", bg: "#f0fdf4" },
              { label: "Department Status", value: profile?.isActive ? "Active" : "Inactive", icon: Activity, color: profile?.isActive ? "#10b981" : "#ef4444", bg: profile?.isActive ? "#f0fdf4" : "#fff5f5" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={stat.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

            {/* Procedures List */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={16} color="#3b82f6" />Procedures
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{activeProcedures.length} active</span>
              </div>
              {procedures.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No procedures configured yet</div>
              ) : (
                <div style={{ padding: "14px 16px" }}>
                  {procedures.map((p: any, i: number) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", background: i % 2 === 0 ? "#fafbfc" : "#fff", borderRadius: 10, marginBottom: 4 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: (PROC_TYPE_COLOR[p.type] || "#94a3b8") + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>
                          {p.type === "DIAGNOSTIC" ? "🔍" : p.type === "TREATMENT" ? "💉" : p.type === "SURGERY" ? "🔪" : p.type === "THERAPY" ? "💆" : p.type === "MEDICATION" ? "💊" : p.type === "CONSULTATION" ? "🩺" : "📋"}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: p.isActive ? "#1e293b" : "#94a3b8" }}>{p.name}</div>
                        {p.description && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.description}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: (PROC_TYPE_COLOR[p.type] || "#94a3b8") + "18", color: PROC_TYPE_COLOR[p.type] || "#94a3b8" }}>{p.type}</span>
                        {p.fee != null && <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>₹{p.fee}</span>}
                        {p.duration && <span style={{ fontSize: 10, color: "#94a3b8" }}>{p.duration}m</span>}
                        {!p.isActive && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 100, background: "#fff5f5", color: "#ef4444", border: "1px solid #fecaca", fontWeight: 700 }}>OFF</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column: HOD + Dept Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* HOD Card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 7 }}>
                  <User size={14} color="#3b82f6" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Head of Department</span>
                </div>
                <div style={{ padding: "16px" }}>
                  {profile?.hodName ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                          {initials(profile.hodName)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{profile.hodName}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>Head of Department</div>
                        </div>
                      </div>
                      {profile.hodEmail && (
                        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b" }}>
                          <Mail size={12} />{profile.hodEmail}
                        </div>
                      )}
                      {profile.hodPhone && (
                        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b" }}>
                          <Phone size={12} />{profile.hodPhone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>No HOD assigned</div>
                  )}
                </div>
              </div>

              {/* Department Info */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 7 }}>
                  <Settings size={14} color="#3b82f6" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Department Info</span>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748b" }}>Type</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{profile?.type?.replace(/_/g, " ")}</span>
                  </div>
                  {profile?.code && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Code</span>
                      <span style={{ fontWeight: 700, fontFamily: "monospace", background: "#f1f5f9", padding: "2px 7px", borderRadius: 5, color: "#64748b" }}>{profile.code}</span>
                    </div>
                  )}
                  {profile?.department && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Parent Dept</span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{profile.department.name}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#64748b" }}>Status</span>
                    <span style={{ fontWeight: 700, color: profile?.isActive ? "#16a34a" : "#ef4444" }}>{profile?.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>

              {/* Login Info */}
              <div style={{ background: meta.lightBg, borderRadius: 14, border: `1px solid ${profile?.color || "#e2e8f0"}30`, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Portal Login</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{profile?.loginEmail || user?.email}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Managed by Hospital Admin</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
