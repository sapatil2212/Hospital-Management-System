"use client";

import { useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CalendarDays, Stethoscope, LogOut, Search,
  Bell, HelpCircle, UserRound, FileText,
  ChevronDown, Settings, User, Activity, ClipboardCheck, Clock
} from "lucide-react";
import { DoctorDashboardProvider, useDoctorDashboard } from "./DoctorDashboardContext";
import NotificationBell from "@/components/NotificationBell";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { doctor, loading, logout, accent, doctorName, deptName, initials } = useDoctorDashboard();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isProfilePage = pathname === "/doctor/dashboard/profile";
  const currentTab = searchParams.get("tab") || "schedule";

  const navItems = [
    { id: "schedule", path: "/doctor/dashboard", label: "Today's Schedule", icon: <CalendarDays size={16} /> },
    { id: "patients", path: "/doctor/dashboard?tab=patients", label: "My Patients", icon: <UserRound size={16} /> },
    { id: "prescription-settings", path: "/doctor/dashboard?tab=prescription-settings", label: "Prescription Setting", icon: <FileText size={16} /> },
    { id: "treatment-plans", path: "/doctor/dashboard?tab=treatment-plans", label: "Treatment Plans", icon: <Activity size={16} /> },
    { id: "attendance", path: "/doctor/dashboard?tab=attendance", label: "My Attendance", icon: <ClipboardCheck size={16} /> },
    { id: "schedule-mgmt", path: "/doctor/dashboard?tab=schedule-mgmt", label: "Schedule Setup", icon: <Clock size={16} /> },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", fontSize: 14, gap: 14 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #bbf7d0", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "sp .8s linear infinite" }} />
        <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>Loading Doctor Portal...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f0fdf4}::-webkit-scrollbar-thumb{background:#a7f3d0;border-radius:4px}
        input,select,button,textarea{font-family:'Inter',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .doc{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0fdf9}
        .doc-sb{width:220px;background:#fff;border-right:1px solid #d1fae5;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(16,185,129,0.06)}
        .doc-logo{padding:20px 20px 16px;border-bottom:1px solid #ecfdf5;display:flex;align-items:center;gap:10px}
        .doc-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.3)}
        .doc-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .doc-logo-sub{font-size:10px;color:#94a3b8;margin-top:0px}
        .doc-nav{flex:1;padding:12px 12px;overflow-y:auto}
        .doc-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:12px 0 6px}
        .doc-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .doc-nb:hover{background:#f0fdf4;color:#047857}
        .doc-nb.on{background:var(--dept-bg,#d1fae5);color:var(--dept-accent,#059669);font-weight:600}
        .doc-nb-dot{display:none;width:3px;height:20px;background:#10b981;border-radius:4px;position:absolute;left:0}
        .doc-nb.on .doc-nb-dot{display:block}
        .doc-nb svg{color:#94a3b8;flex-shrink:0}
        .doc-nb.on svg{color:var(--dept-accent,#059669)}
        .doc-sb-foot{padding:14px 16px 18px;border-top:1px solid #ecfdf5}
        .doc-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;margin-bottom:10px}
        .doc-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#10b981,#0E898F);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .doc-uname{font-size:12px;font-weight:600;color:#1e293b}
        .doc-urole{font-size:10px;font-weight:500;color:#059669}
        .doc-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .doc-logout:hover{background:#fee2e2}
        .doc-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .doc-topbar{height:64px;background:#fff;border-bottom:1px solid #d1fae5;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(16,185,129,0.06)}
        .doc-search-wrap{display:flex;align-items:center;gap:8px;background:#f0fdf4;border:1px solid #d1fae5;border-radius:10px;padding:8px 14px;width:280px}
        .doc-search-wrap:focus-within{border-color:#6ee7b7}
        .doc-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .doc-search::placeholder{color:#94a3b8}
        .doc-tb-right{display:flex;align-items:center;gap:12px}
        .doc-notif{width:36px;height:36px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
        .doc-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#10b981;border:1.5px solid #fff}
        .doc-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;cursor:pointer}
        .doc-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#10b981,#0E898F);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
        .doc-profile-name{font-size:12px;font-weight:600;color:#1e293b}
        .doc-profile-role{font-size:10px;color:#059669}
        .doc-body{display:grid;grid-template-columns:1fr;flex:1}
        .doc-center{padding:22px 20px;overflow-y:auto}
        .doc-pg-title{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
      `}</style>

      <div className="doc" style={{ '--dept-accent': accent, '--dept-bg': accent + '22' } as any}>
        {/* Sidebar */}
        <aside className="doc-sb">
          <div className="doc-logo">
            <div className="doc-logo-ic"><Stethoscope size={17} color="white" /></div>
            <div><div className="doc-logo-tx">MediCare+</div><div className="doc-logo-sub">Doctor Portal</div></div>
          </div>
          <nav className="doc-nav">
            <div className="doc-nav-sec">My Work</div>
            {navItems.map(n => {
              const isActive = !isProfilePage && currentTab === n.id;
              return (
                <button
                  key={n.id}
                  className={`doc-nb${isActive ? " on" : ""}`}
                  onClick={() => router.push(n.path)}
                >
                  <div className="doc-nb-dot" />
                  <span style={{ color: isActive ? "#059669" : "#94a3b8", display: "flex" }}>{n.icon}</span>
                  {n.label}
                </button>
              );
            })}
            <div className="doc-nav-sec">Settings</div>
            <button
              className={`doc-nb${isProfilePage ? " on" : ""}`}
              onClick={() => router.push("/doctor/dashboard/profile")}
            >
              <div className="doc-nb-dot" />
              <span style={{ color: isProfilePage ? "#059669" : "#94a3b8", display: "flex" }}><User size={16} /></span>
              My Profile
            </button>
            <button className="doc-nb"><span style={{ color: "#94a3b8", display: "flex" }}><HelpCircle size={16} /></span>Support</button>
          </nav>
          <div className="doc-sb-foot">
            <div className="doc-user">
              {doctor?.profileImage
                ? <img src={doctor.profileImage} alt={doctorName} style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover" }} />
                : <div className="doc-av" style={{ background: `linear-gradient(135deg,${accent},#0E898F)` }}>{initials(doctorName)}</div>
              }
              <div><div className="doc-uname">{doctorName}</div><div className="doc-urole" style={{ color: accent }}>Doctor · {deptName}</div></div>
            </div>
            <button className="doc-logout" onClick={logout}>
              <LogOut size={13} />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="doc-main">
          <header className="doc-topbar">
            <div className="doc-search-wrap"><Search size={14} color="#94a3b8" /><input className="doc-search" placeholder="Search patients, prescriptions..." /></div>
            <div className="doc-tb-right">
              <NotificationBell accentColor={accent} bgColor="#f0fdf4" borderColor="#d1fae5" />
              <div className="doc-profile" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} style={{ position: "relative", cursor: "pointer" }}>
                {doctor?.profileImage
                  ? <img src={doctor.profileImage} alt={doctorName} style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />
                  : <div className="doc-profile-av" style={{ background: `linear-gradient(135deg,${accent},#0E898F)` }}>{initials(doctorName)}</div>
                }
                <div><div className="doc-profile-name">{doctorName.split(" ")[0]}</div><div className="doc-profile-role" style={{ color: accent }}>{deptName}</div></div>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: 6 }} />

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
                      border: "1px solid #d1fae5",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      zIndex: 70,
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: 16, borderBottom: "1px solid #f0fdf4" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Dr. {doctorName}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{doctor?.email || doctor?.user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button
                          onClick={() => { setProfileDropdownOpen(false); router.push("/doctor/dashboard/profile"); }}
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
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
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

          <div className="doc-body">
            <div className="doc-center">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DoctorDashboardProvider>
      <Suspense fallback={
        <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", fontSize: 14, gap: 14 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #bbf7d0", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "sp .8s linear infinite" }} />
          <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>Loading...
        </div>
      }>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
    </DoctorDashboardProvider>
  );
}
