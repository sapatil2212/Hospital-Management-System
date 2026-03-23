"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Activity,
  Stethoscope, User, Mail, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Key, ChevronDown, Bed, ClipboardList, Camera,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  hospitalId: string;
  hospital?: { name: string };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} />, route: "/hospitaladmin/dashboard" },
    { id: "appointments", label: "Appointments", icon: <CalendarDays size={16} />, route: "/hospitaladmin/appointments" },
    { id: "staff", label: "Staff", icon: <Users size={16} />, route: "/hospitaladmin/dashboard?tab=staff" },
    { id: "patients", label: "Patients", icon: <UserRound size={16} />, route: "/hospitaladmin/dashboard?tab=patients" },
    { id: "inventory", label: "Inventory", icon: <ClipboardList size={16} />, route: "/hospitaladmin/dashboard?tab=inventory" },
    { id: "departments", label: "Departments", icon: <Building2 size={16} />, route: "/hospitaladmin/dashboard?tab=departments" },
    { id: "beds", label: "Beds & Wards", icon: <Bed size={16} />, route: "/hospitaladmin/dashboard?tab=beds" },
    { id: "settings", label: "Settings", icon: <Settings size={16} />, route: "/hospitaladmin/dashboard?tab=settings" },
    { id: "analytics", label: "Analytics", icon: <Activity size={16} /> },
  ];

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { router.push("/login"); return; }
        if (d.data.role !== "HOSPITAL_ADMIN") { router.push("/login"); return; }
        setUser(d.data);
        setFormData({ name: d.data.name || "", email: d.data.email || "", phone: "" });
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: formData.name, email: formData.email, profilePhoto }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setUser((prev) => prev ? { ...prev, name: formData.name, email: formData.email } : null);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const initials = (name: string) => name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <style suppressHydrationWarning>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style suppressHydrationWarning>{`
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
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="hd">
        {/* Sidebar */}
        <aside className="hd-sb">
          <div className="hd-sb-logo">
            <div className="hd-logo-ic"><Stethoscope size={18} color="white"/></div>
            <div><div className="hd-logo-tx">MediCare+</div><div className="hd-logo-sub">Hospital Admin</div></div>
          </div>
          <nav className="hd-nav">
            <div className="hd-nav-sec">General</div>
            {navItems.slice(0,7).map(n=>(
              <button key={n.id} className="hd-nb" onClick={()=>router.push(n.route || "/hospitaladmin/dashboard")}>
                <span style={{color:"#94a3b8",display:"flex"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <div className="hd-nav-sec">System</div>
            {navItems.slice(7).map(n=>(
              <button key={n.id} className="hd-nb" onClick={()=>router.push(n.route || "/hospitaladmin/dashboard")}>
                <span style={{color:"#94a3b8",display:"flex"}}>{n.icon}</span>
                {n.label}
              </button>
            ))}
            <button className="hd-nb" onClick={()=>router.push("/hospitaladmin/configure")}>
              <span style={{color:"#94a3b8",display:"flex"}}><Building2 size={16}/></span>
              Configure Hospital
            </button>
            <button className="hd-nb">
              <span style={{color:"#94a3b8",display:"flex"}}><HelpCircle size={16}/></span>
              Support
            </button>
          </nav>
          <div className="hd-sb-foot">
            <div className="hd-user-chip">
              <div className="hd-av">{user?.name ? initials(user.name) : "HA"}</div>
              <div style={{overflow:"hidden"}}>
                <div className="hd-uname">{user?.name || "Hospital Admin"}</div>
                <div className="hd-urole">Hospital Admin</div>
              </div>
            </div>
            <button className="hd-logout" onClick={logout}>
              <LogOut size={14}/>Log Out
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <div className="hd-main">
          {/* Top Bar */}
          <header className="hd-topbar">
            <div className="hd-search-wrap">
              <Search size={14} color="#94a3b8"/>
              <input className="hd-search" placeholder="What are you searching..."/>
            </div>
            <div className="hd-topbar-right">
              <div className="hd-notif"><Bell size={16} color="#64748b"/><span className="hd-notif-dot"/></div>
              <div className="hd-notif"><MessageSquare size={16} color="#64748b"/></div>
              <div className="hd-profile" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} style={{ position: "relative" }}>
                <div className="hd-profile-av">{user?.name ? initials(user.name) : "HA"}</div>
                <div><div className="hd-profile-name">{user?.name?.split(" ")[0] || "Admin"}</div><div className="hd-profile-role">Hosp. Admin</div></div>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: 6 }} />
                {profileDropdownOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setProfileDropdownOpen(false)} />
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", zIndex: 70, overflow: "hidden" }}>
                      <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{user?.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button onClick={() => setProfileDropdownOpen(false)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#eff6ff", color: "#3b82f6", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                          <User size={16} color="#3b82f6" />
                          Account Settings
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); logout(); }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
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

          {/* Content */}
          <main className="hd-center">
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {/* Page Header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>My Profile</h1>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Manage your account settings and personal information</p>
              </div>

              {/* User Info Card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div 
                    onClick={handlePhotoClick}
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: 16, 
                      background: profilePhoto ? `url(${profilePhoto}) center/cover` : "linear-gradient(135deg, #3b82f6, #8b5cf6)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: 28, 
                      fontWeight: 700, 
                      color: "#fff",
                      cursor: "pointer",
                      position: "relative",
                      boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                    }}
                  >
                    {!profilePhoto && initials(user?.name || "")}
                    <div style={{ 
                      position: "absolute", 
                      bottom: -4, 
                      right: -4, 
                      width: 28, 
                      height: 28, 
                      borderRadius: "50%", 
                      background: "#3b82f6", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      border: "3px solid #fff",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    }}>
                      <Camera size={12} color="#fff" />
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{user?.name}</h2>
                    <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{user?.email}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Click on avatar to upload photo</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#eff6ff", color: "#3b82f6", fontSize: 11, fontWeight: 600 }}>
                        <Shield size={12} />{user?.role?.replace("_", " ")}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#f0fdf4", color: "#10b981", fontSize: 11, fontWeight: 600 }}>
                        <Building2 size={12} />{user?.hospital?.name || "Hospital"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} color="#3b82f6" />Account Settings
                </h3>

                {message && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: message.type === "success" ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 500 }}>
                    {message.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Full Name</label>
                      <div style={{ position: "relative" }}>
                        <User size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none" }} placeholder="Enter your full name" required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email Address</label>
                      <div style={{ position: "relative" }}>
                        <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none" }} placeholder="Enter your email address" required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Phone Number</label>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none" }} placeholder="Enter your phone number" />
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(59,130,246,0.25)" }}>
                      {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</> : <><Save size={16} />Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Section */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28, marginTop: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Key size={16} color="#f59e0b" />Security
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Manage your password and account security settings.</p>
                <button onClick={() => router.push("/hospitaladmin/change-password")} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Change Password
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
