"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Stethoscope, ClipboardList,
  CreditCard, IndianRupee
} from "lucide-react";
import BillingModule from "@/components/BillingModule";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/api/auth/me").then(d => { if (d.success) setUser(d.data); });
  }, []);

  const logout = async () => {
    await api("/api/auth/logout", "POST");
    router.push("/hospitaladmin/login");
  };

  const navItems: { id: string; label: string; icon: React.ReactNode; route?: string }[] = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={16} />, route: "/hospitaladmin/dashboard" },
    { id: "appointments", label: "Appointments", icon: <CalendarDays size={16} />, route: "/hospitaladmin/appointments" },
    { id: "staff", label: "Staff", icon: <Users size={16} />, route: "/hospitaladmin/dashboard?tab=staff" },
    { id: "patients", label: "Patients", icon: <UserRound size={16} />, route: "/hospitaladmin/patients" },
    { id: "inventory", label: "Inventory", icon: <ClipboardList size={16} />, route: "/hospitaladmin/dashboard?tab=inventory" },
    { id: "billing", label: "Billing", icon: <CreditCard size={16} />, route: "/hospitaladmin/billing" },
    { id: "finance", label: "Finance", icon: <IndianRupee size={16} />, route: "/hospitaladmin/finance" },
    { id: "settings", label: "Settings", icon: <Settings size={16} />, route: "/hospitaladmin/dashboard?tab=settings" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        input,select,button{font-family:'Inter',sans-serif}
        .hd{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0f4f8}
        .hd-sb{width:220px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04)}
        .hd-sb-logo{padding:20px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px}
        .hd-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
        .hd-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .hd-logo-sub{font-size:10px;color:#94a3b8}
        .hd-nav{flex:1;padding:12px 12px;overflow-y:auto}
        .hd-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
        .hd-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .hd-nb:hover{background:#f8fafc;color:#334155}
        .hd-nb.on{background:#eff6ff;color:#2563eb;font-weight:600}
        .hd-nb-dot{display:none;width:3px;border-radius:4px;height:22px;background:#3b82f6;position:absolute;left:0}
        .hd-nb.on .hd-nb-dot{display:block}
        .hd-sb-foot{padding:14px 16px 18px;border-top:1px solid #f1f5f9}
        .hd-user-chip{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:10px}
        .hd-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .hd-uname{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hd-urole{font-size:10px;font-weight:500;color:#3b82f6}
        .hd-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .hd-logout:hover{background:#fee2e2}
        .hd-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .hd-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .hd-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px;transition:border-color .2s}
        .hd-search-wrap:focus-within{border-color:#93c5fd}
        .hd-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .hd-search::placeholder{color:#94a3b8}
        .hd-topbar-right{display:flex;align-items:center;gap:12px}
        .hd-notif{width:36px;height:36px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:background .15s}
        .hd-notif:hover{background:#eff6ff}
        .hd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#ef4444;border:1.5px solid #fff}
        .hd-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer}
        .hd-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
        .hd-profile-name{font-size:11px;font-weight:600;color:#1e293b}
        .hd-profile-role{font-size:9px;color:#64748b}
        .hd-center{padding:32px 24px;overflow-y:auto;flex:1}
      `}</style>

      <div className="hd">
        <aside className="hd-sb">
          <div className="hd-sb-logo">
            <div className="hd-logo-ic"><Stethoscope size={18} color="white" /></div>
            <div><div className="hd-logo-tx">MediCare+</div><div className="hd-logo-sub">Hospital Admin</div></div>
          </div>
          <nav className="hd-nav">
            <div className="hd-nav-sec">General</div>
            {navItems.slice(0, 7).map(n => (
              <button key={n.id} className={`hd-nb${n.id === "billing" ? " on" : ""}`} onClick={() => n.route && router.push(n.route)} style={{ position: "relative" }}>
                {n.id === "billing" && <div className="hd-nb-dot" />}
                <span style={{ color: n.id === "billing" ? "#2563eb" : "#94a3b8", display: "flex" }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div className="hd-nav-sec">System</div>
            {navItems.slice(7).map(n => (
              <button key={n.id} className="hd-nb" onClick={() => n.route && router.push(n.route)} style={{ position: "relative" }}>
                <span style={{ color: "#94a3b8", display: "flex" }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <button className="hd-nb" onClick={() => router.push("/hospitaladmin/configure")}>
              <span style={{ color: "#94a3b8", display: "flex" }}><Building2 size={16} /></span>
              Configure Hospital
            </button>
            <button className="hd-nb">
              <span style={{ color: "#94a3b8", display: "flex" }}><HelpCircle size={16} /></span>
              Support
            </button>
          </nav>
          <div className="hd-sb-foot">
            <div className="hd-user-chip">
              <div className="hd-av">{user?.name ? initials(user.name) : "HA"}</div>
              <div style={{ overflow: "hidden" }}>
                <div className="hd-uname">{user?.name || "Hospital Admin"}</div>
                <div className="hd-urole">Hospital Admin</div>
              </div>
            </div>
            <button className="hd-logout" onClick={logout}>
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </aside>

        <main className="hd-main">
          <header className="hd-topbar">
            <div className="hd-search-wrap">
              <Search size={14} color="#94a3b8" />
              <input className="hd-search" placeholder="What are you searching..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="hd-topbar-right">
              <div className="hd-notif"><Bell size={16} color="#64748b" /><span className="hd-notif-dot" /></div>
              <div className="hd-notif"><MessageSquare size={16} color="#64748b" /></div>
              <div className="hd-profile">
                <div className="hd-profile-av">{user?.name ? initials(user.name) : "HA"}</div>
                <div><div className="hd-profile-name">{user?.name?.split(" ")[0] || "Admin"}</div><div className="hd-profile-role">Hosp. Admin</div></div>
              </div>
            </div>
          </header>

          <div className="hd-center">
            <BillingModule />
          </div>
        </main>
      </div>
    </>
  );
}
