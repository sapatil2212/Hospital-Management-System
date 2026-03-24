"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "form" | "otp" | "success";

interface FormData {
  hospitalName: string;
  adminName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export default function HospitalSignupPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormData & { otp: string }>>({});

  const [form, setForm] = useState<FormData>({
    hospitalName: "", adminName: "", email: "", mobile: "", password: "", confirmPassword: "",
  });

  const passwordStrength = useMemo(() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [form.password]);

  const strengthMeta = [
    { label: "", color: "#9ca3af" },
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f59e0b" },
    { label: "Good", color: "#0E898F" },
    { label: "Strong", color: "#10b981" },
    { label: "Excellent", color: "#059669" },
  ][passwordStrength] || { label: "", color: "#9ca3af" };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    setApiError("");
  };

  const validateForm = () => {
    const errs: Partial<FormData> = {};
    if (!form.hospitalName.trim() || form.hospitalName.trim().length < 2) errs.hospitalName = "Minimum 2 characters";
    if (!form.adminName.trim() || form.adminName.trim().length < 2) errs.adminName = "Minimum 2 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.mobile || form.mobile.replace(/\D/g, "").length < 10) errs.mobile = "Valid mobile required";
    if (!form.password || form.password.length < 6) errs.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) setStep("otp");
      else setApiError(data.message || "Failed to send OTP.");
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp]; next[index] = value.replace(/\D/g, ""); setOtp(next);
    setApiError("");
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); document.getElementById("otp-5")?.focus(); }
    e.preventDefault();
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) { setApiError("Enter the complete 6-digit OTP"); return; }
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalName: form.hospitalName, adminName: form.adminName, email: form.email, mobile: form.mobile, password: form.password, otp: otpString }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setStep("success"); setTimeout(() => router.push("/login"), 3000); }
      else setApiError(data.message || "OTP verification failed.");
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setLoading(true); setApiError("");
    try {
      await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email }) });
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  const t = dark ? "dark" : "light";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

        /* ── THEME VARS ── */
        .sp.dark { --bg: #0f0f19; --brand-bg-from: #0f172a; --brand-bg-via: #1e1b4b; --brand-bg-to: #312e81; --card-bg: #0f0f19; --input-bg: rgba(255,255,255,0.04); --input-border: rgba(255,255,255,0.1); --input-border-focus: rgba(99,102,241,0.5); --input-shadow-focus: rgba(99,102,241,0.1); --input-color: #fff; --input-placeholder: rgba(255,255,255,0.18); --label-color: rgba(255,255,255,0.35); --heading-color: #fff; --sub-color: rgba(255,255,255,0.35); --sub-strong: rgba(255,255,255,0.65); --error-bg: rgba(239,68,68,0.08); --error-border: rgba(239,68,68,0.25); --error-color: #fca5a5; --field-error: #f87171; --progress-bg: rgba(255,255,255,0.08); --divider-bg: rgba(255,255,255,0.06); --toggle-bg: rgba(255,255,255,0.08); --toggle-icon: rgba(255,255,255,0.5); --toggle-hover: rgba(255,255,255,0.15); --otp-bg: rgba(255,255,255,0.04); --otp-border: rgba(255,255,255,0.1); --otp-filled-border: rgba(52,211,153,0.4); --hint-color: rgba(255,255,255,0.25); --resend-color: rgba(255,255,255,0.3); --resend-link: #818cf8; --footer-color: rgba(255,255,255,0.3); --footer-link: #818cf8; --step-active-bg: rgba(255,255,255,0.15); --step-done-bg: rgba(52,211,153,0.2); --step-inactive-bg: rgba(255,255,255,0.05); --invis-btn: rgba(255,255,255,0.25); --invis-hover: rgba(255,255,255,0.5); --back-color: rgba(255,255,255,0.4); --back-hover: rgba(255,255,255,0.75); --success-icon-bg: rgba(52,211,153,0.12); --success-icon-border: rgba(52,211,153,0.3); --strength-empty: rgba(255,255,255,0.08); }

        .sp.light { --bg: #f8fafc; --brand-bg-from: #eef2ff; --brand-bg-via: #e0e7ff; --brand-bg-to: #c7d2fe; --card-bg: #ffffff; --input-bg: #f8fafc; --input-border: #d1d5db; --input-border-focus: #6366f1; --input-shadow-focus: rgba(99,102,241,0.12); --input-color: #111827; --input-placeholder: #9ca3af; --label-color: #6b7280; --heading-color: #111827; --sub-color: #6b7280; --sub-strong: #1f2937; --error-bg: #fef2f2; --error-border: #fecaca; --error-color: #dc2626; --field-error: #dc2626; --progress-bg: #e5e7eb; --divider-bg: #e5e7eb; --toggle-bg: rgba(0,0,0,0.06); --toggle-icon: #6b7280; --toggle-hover: rgba(0,0,0,0.1); --otp-bg: #f9fafb; --otp-border: #d1d5db; --otp-filled-border: #10b981; --hint-color: #9ca3af; --resend-color: #6b7280; --resend-link: #6366f1; --footer-color: #6b7280; --footer-link: #6366f1; --step-active-bg: rgba(99,102,241,0.12); --step-done-bg: rgba(16,185,129,0.1); --step-inactive-bg: rgba(0,0,0,0.04); --invis-btn: #9ca3af; --invis-hover: #4b5563; --back-color: #6b7280; --back-hover: #111827; --success-icon-bg: rgba(16,185,129,0.1); --success-icon-border: rgba(16,185,129,0.3); --strength-empty: #e5e7eb; }

        .sp { font-family: 'Inter', sans-serif; min-height:100vh; display:grid; grid-template-columns:1fr 1fr; overflow:hidden; background: var(--bg); transition: background 0.3s; }

        @media (max-width:768px) { .sp { grid-template-columns:1fr; } .sp-brand { display:none; } }

        /* ── THEME TOGGLE ── */
        .sp-toggle {
          position:fixed; top:20px; right:20px; z-index:100;
          width:40px; height:40px; border-radius:50%; border:none; cursor:pointer;
          background: var(--toggle-bg); color: var(--toggle-icon);
          display:flex; align-items:center; justify-content:center;
          transition: background 0.2s, transform 0.2s;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .sp-toggle:hover { background: var(--toggle-hover); transform: scale(1.1); }

        /* ── BRAND ── */
        .sp-brand {
          background: linear-gradient(145deg, var(--brand-bg-from), var(--brand-bg-via), var(--brand-bg-to));
          display:flex; align-items:center; justify-content:center; padding:48px; position:relative; overflow:hidden;
          transition: background 0.3s;
        }

        .sp-brand-grid { position:absolute; inset:0; background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px); background-size:40px 40px; }

        .sp-brand-glow { position:absolute; inset:0; background: radial-gradient(ellipse at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(16,185,129,0.1) 0%, transparent 55%); pointer-events:none; }

        .sp-brand-content { position:relative; z-index:2; max-width:420px; }

        .sp-logo { display:flex; align-items:center; gap:12px; margin-bottom:48px; text-decoration:none; }
        .sp-logo-icon { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg, #6366f1, #8b5cf6); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(99,102,241,0.35); }
        .sp-logo-text { font-size:22px; font-weight:800; color:#1f2937; letter-spacing:-0.02em; }
        .sp.dark .sp-logo-text { color:#fff; }
        .sp-logo-accent { color:#8b5cf6; }

        .sp-brand-title { font-size:36px; font-weight:800; line-height:1.15; letter-spacing:-0.03em; margin-bottom:16px; color:#1f2937; }
        .sp.dark .sp-brand-title { color:#fff; }
        .sp-brand-title span { background:linear-gradient(135deg, #8b5cf6, #34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        .sp-brand-sub { font-size:15px; line-height:1.7; margin-bottom:40px; color:#4b5563; }
        .sp.dark .sp-brand-sub { color:rgba(255,255,255,0.5); }

        .sp-features { display:flex; flex-direction:column; gap:14px; }
        .sp-feature { display:flex; align-items:center; gap:12px; font-size:14px; font-weight:500; color:#374151; }
        .sp.dark .sp-feature { color:rgba(255,255,255,0.75); }
        .sp-feature-dot { width:28px; height:28px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:14px; }

        .sp-step-dots { position:absolute; bottom:40px; left:0; right:0; display:flex; align-items:center; justify-content:center; gap:8px; }
        .sp-step-dot { display:flex; align-items:center; gap:6px; padding:6px 14px; border-radius:100px; font-size:12px; font-weight:600; transition:all 0.3s; }
        .sp-step-dot.active { background:var(--step-active-bg); color:#6366f1; }
        .sp.dark .sp-step-dot.active { color:#fff; }
        .sp-step-dot.done { background:var(--step-done-bg); color:#059669; }
        .sp-step-dot.inactive { background:var(--step-inactive-bg); color:#9ca3af; }
        .sp.dark .sp-step-dot.inactive { color:rgba(255,255,255,0.3); }
        .sp-step-dot-num { width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; }

        /* ── FORM SIDE ── */
        .sp-form-side { background:var(--card-bg); display:flex; align-items:center; justify-content:center; padding:32px; transition:background 0.3s; }
        .sp-form-box { width:100%; max-width:460px; }

        .sp-step-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:100px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:12px; }
        .sp-step-badge.s1 { background:rgba(99,102,241,0.1); color:#6366f1; border:1px solid rgba(99,102,241,0.22); }
        .sp-step-badge.s2 { background:rgba(245,158,11,0.1); color:#d97706; border:1px solid rgba(245,158,11,0.22); }
        .sp-step-badge.s3 { background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.22); }

        .sp-heading { font-size:26px; font-weight:800; letter-spacing:-0.02em; margin-bottom:6px; color:var(--heading-color); }
        .sp-sub { font-size:14px; color:var(--sub-color); line-height:1.6; margin-bottom:0; }
        .sp-sub strong { color:var(--sub-strong); }

        /* progress */
        .sp-progress { height:3px; background:var(--progress-bg); border-radius:10px; margin:20px 0 24px; overflow:hidden; }
        .sp-progress-fill { height:100%; border-radius:10px; background:linear-gradient(90deg, #6366f1, #8b5cf6); transition:width 0.4s ease; }

        /* error */
        .sp-err { display:flex; align-items:flex-start; gap:10px; background:var(--error-bg); border:1px solid var(--error-border); border-radius:12px; padding:12px 14px; margin-bottom:18px; font-size:13px; color:var(--error-color); line-height:1.5; animation:sp-shake 0.3s ease; }
        @keyframes sp-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

        /* grid */
        .sp-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(max-width:500px){ .sp-grid2{ grid-template-columns:1fr; } }

        /* field */
        .sp-field { margin-bottom:15px; }
        .sp-label { display:block; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--label-color); margin-bottom:7px; }
        .sp-wrap { position:relative; }
        .sp-input { width:100%; background:var(--input-bg); border:1.5px solid var(--input-border); border-radius:11px; padding:12px 40px 12px 14px; font-size:14px; color:var(--input-color); font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .sp-input::placeholder { color:var(--input-placeholder); }
        .sp-input:focus { border-color:var(--input-border-focus); box-shadow:0 0 0 3px var(--input-shadow-focus); }
        .sp-input.err { border-color:#ef4444; }
        .sp-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--invis-btn); display:flex; align-items:center; padding:0; transition:color 0.2s; }
        .sp-eye:hover { color:var(--invis-hover); }
        .sp-ferr { font-size:12px; color:var(--field-error); margin-top:5px; display:block; }

        /* strength */
        .sp-str { margin-top:7px; }
        .sp-str-track { display:flex; gap:4px; margin-bottom:4px; }
        .sp-str-seg { height:3px; flex:1; border-radius:4px; transition:background 0.3s; }
        .sp-str-label { font-size:11px; font-weight:600; }

        /* otp */
        .sp-otp-wrap { display:flex; justify-content:center; }
        .sp-otp-grid { display:flex; gap:8px; margin-bottom:6px; width:100%; max-width:360px; }
        .sp-otp-in { flex:1; min-width:0; text-align:center; font-size:20px; font-weight:800; padding:12px 0; border-radius:12px; background:var(--otp-bg); border:1.5px solid var(--otp-border); color:var(--input-color); font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s; caret-color:#6366f1; }
        .sp-otp-in:focus { border-color:var(--input-border-focus); box-shadow:0 0 0 3px var(--input-shadow-focus); }
        .sp-otp-in.filled { border-color:var(--otp-filled-border); }
        @media(max-width:400px){ .sp-otp-in { font-size:16px; padding:10px 0; border-radius:9px; } .sp-otp-grid { gap:5px; } }
        .sp-otp-hint { font-size:12px; color:var(--hint-color); text-align:center; margin-bottom:20px; }

        .sp-resend { font-size:13px; color:var(--resend-color); text-align:center; margin-top:16px; }
        .sp-resend-btn { background:none; border:none; color:var(--resend-link); cursor:pointer; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; transition:opacity 0.2s; }
        .sp-resend-btn:hover { opacity:0.8; }
        .sp-resend-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* back */
        .sp-back { display:flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; color:var(--back-color); font-size:13px; font-family:'Inter',sans-serif; font-weight:500; margin-bottom:22px; padding:0; transition:color 0.2s; }
        .sp-back:hover { color:var(--back-hover); }

        /* btn */
        .sp-btn { width:100%; padding:14px; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'Inter',sans-serif; cursor:pointer; position:relative; overflow:hidden; transition:transform 0.15s, box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:#fff; box-shadow:0 4px 18px rgba(99,102,241,0.3); }
        .sp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 26px rgba(99,102,241,0.42); }
        .sp-btn:active:not(:disabled) { transform:translateY(0); }
        .sp-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .sp-btn-shine { position:absolute; inset:0; background:linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%); background-size:200% 100%; animation:sp-shine 3s infinite; }
        @keyframes sp-shine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .sp-spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:sp-spin 0.7s linear infinite; }
        @keyframes sp-spin { to{ transform:rotate(360deg); } }

        /* success */
        .sp-success { text-align:center; padding:24px 0; }
        .sp-suc-icon { width:72px; height:72px; border-radius:50%; background:var(--success-icon-bg); border:2px solid var(--success-icon-border); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:32px; animation:popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
        @keyframes popIn { 0%{transform:scale(0) rotate(-15deg)} 100%{transform:scale(1) rotate(0)} }
        .sp-suc-title { font-size:24px; font-weight:800; color:var(--heading-color); margin-bottom:8px; }
        .sp-suc-sub { font-size:14px; color:var(--sub-color); line-height:1.6; margin-bottom:24px; }
        .sp-redir-bar { height:3px; background:var(--progress-bg); border-radius:10px; overflow:hidden; }
        .sp-redir-fill { height:100%; background:linear-gradient(90deg, #34d399, #059669); animation:fillBar 3s linear forwards; }
        @keyframes fillBar { 0%{width:0%} 100%{width:100%} }

        /* footer */
        .sp-footer { text-align:center; margin-top:22px; font-size:13px; color:var(--footer-color); }
        .sp-footer a { color:var(--footer-link); text-decoration:none; font-weight:600; }
        .sp-footer a:hover { opacity:0.8; }
      `}</style>

      {/* ─── THEME TOGGLE ─── */}
      <button className="sp-toggle" onClick={() => setDark(!dark)} title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
        {dark ? (
          /* Sun icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          /* Moon icon */
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      <div className={`sp ${t}`}>
        {/* ── BRAND ── */}
        <div className="sp-brand">
          <div className="sp-brand-grid" />
          <div className="sp-brand-glow" />
          <div className="sp-brand-content">
            <Link href="/" className="sp-logo">
              <div className="sp-logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <span className="sp-logo-text">Medi<span className="sp-logo-accent">Care+</span></span>
            </Link>
            <h1 className="sp-brand-title">Onboard Your<br /><span>Hospital Today</span></h1>
            <p className="sp-brand-sub">Join our secure multi-tenant hospital management platform. Set up your hospital profile and start managing patients, staff, and appointments in minutes.</p>
            <div className="sp-features">
              {[{ icon:"🔐", text:"Secure OTP-verified onboarding" },{ icon:"🏥", text:"Full hospital admin control panel" },{ icon:"👥", text:"Manage doctors, staff & patients" },{ icon:"🔒", text:"Strict data isolation per hospital" },{ icon:"📊", text:"Real-time analytics & reporting" }].map(f => (
                <div className="sp-feature" key={f.text}><div className="sp-feature-dot">{f.icon}</div>{f.text}</div>
              ))}
            </div>
          </div>
          {/* Step Progress */}
          <div className="sp-step-dots">
            {[{ label:"Details", n:1, key:"form" },{ label:"Verify OTP", n:2, key:"otp" },{ label:"Done", n:3, key:"success" }].map(s => {
              const idx = { form:0, otp:1, success:2 }[step]; const my = s.n - 1;
              const cls = my < idx ? "done" : my === idx ? "active" : "inactive";
              return (
                <div key={s.key} className={`sp-step-dot ${cls}`}>
                  <div className="sp-step-dot-num">{cls === "done" ? "✓" : s.n}</div>
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FORM SIDE ── */}
        <div className="sp-form-side">
          <div className="sp-form-box">

            {/* ── STEP 1 ── */}
            {step === "form" && (
              <>
                <div className="sp-step-badge s1">Step 1 of 2 · Hospital Details</div>
                <h2 className="sp-heading">Register Your Hospital</h2>
                <p className="sp-sub">Fill in your hospital and admin details. We'll send a verification OTP to your email.</p>
                <div className="sp-progress"><div className="sp-progress-fill" style={{ width:"50%" }} /></div>

                {apiError && <div className="sp-err"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{apiError}</div>}

                <form onSubmit={handleRequestOTP}>
                  <div className="sp-grid2">
                    <div className="sp-field">
                      <label className="sp-label">Hospital Name</label>
                      <div className="sp-wrap">
                        <input id="hospitalName" type="text" className={`sp-input${fieldErrors.hospitalName?" err":""}`} placeholder="e.g. Rajashree Hospital" value={form.hospitalName} onChange={e=>updateField("hospitalName",e.target.value)} autoComplete="organization"/>
                      </div>
                      {fieldErrors.hospitalName && <span className="sp-ferr">{fieldErrors.hospitalName}</span>}
                    </div>
                    <div className="sp-field">
                      <label className="sp-label">Admin Full Name</label>
                      <div className="sp-wrap">
                        <input id="adminName" type="text" className={`sp-input${fieldErrors.adminName?" err":""}`} placeholder="e.g. Dr. Swapnil" value={form.adminName} onChange={e=>updateField("adminName",e.target.value)} autoComplete="name"/>
                      </div>
                      {fieldErrors.adminName && <span className="sp-ferr">{fieldErrors.adminName}</span>}
                    </div>
                  </div>

                  <div className="sp-grid2">
                    <div className="sp-field">
                      <label className="sp-label">Email Address</label>
                      <div className="sp-wrap">
                        <input id="email" type="email" className={`sp-input${fieldErrors.email?" err":""}`} placeholder="admin@hospital.com" value={form.email} onChange={e=>updateField("email",e.target.value)} autoComplete="email"/>
                        <button type="button" className="sp-eye" tabIndex={-1}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </button>
                      </div>
                      {fieldErrors.email && <span className="sp-ferr">{fieldErrors.email}</span>}
                    </div>
                    <div className="sp-field">
                      <label className="sp-label">Mobile Number</label>
                      <div className="sp-wrap">
                        <input id="mobile" type="tel" className={`sp-input${fieldErrors.mobile?" err":""}`} placeholder="+91 98765 43210" value={form.mobile} onChange={e=>updateField("mobile",e.target.value)} autoComplete="tel"/>
                        <button type="button" className="sp-eye" tabIndex={-1}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                        </button>
                      </div>
                      {fieldErrors.mobile && <span className="sp-ferr">{fieldErrors.mobile}</span>}
                    </div>
                  </div>

                  <div className="sp-field">
                    <label className="sp-label">Password</label>
                    <div className="sp-wrap">
                      <input id="password" type={showPw?"text":"password"} className={`sp-input${fieldErrors.password?" err":""}`} placeholder="Minimum 6 characters" value={form.password} onChange={e=>updateField("password",e.target.value)} autoComplete="new-password"/>
                      <button type="button" className="sp-eye" onClick={()=>setShowPw(!showPw)}>
                        {showPw ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                    {fieldErrors.password && <span className="sp-ferr">{fieldErrors.password}</span>}
                    {form.password && (
                      <div className="sp-str">
                        <div className="sp-str-track">
                          {[1,2,3,4,5].map(i=><div key={i} className="sp-str-seg" style={{background: i<=passwordStrength ? strengthMeta.color : "var(--strength-empty)"}}/>)}
                        </div>
                        <span className="sp-str-label" style={{color:strengthMeta.color}}>{strengthMeta.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="sp-field">
                    <label className="sp-label">Confirm Password</label>
                    <div className="sp-wrap">
                      <input id="confirmPassword" type={showConfirm?"text":"password"} className={`sp-input${fieldErrors.confirmPassword?" err":""}`} placeholder="Re-enter password" value={form.confirmPassword} onChange={e=>updateField("confirmPassword",e.target.value)} autoComplete="new-password"/>
                      <button type="button" className="sp-eye" onClick={()=>setShowConfirm(!showConfirm)}>
                        {showConfirm ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <span className="sp-ferr">{fieldErrors.confirmPassword}</span>}
                  </div>

                  <button type="submit" className="sp-btn" disabled={loading}>
                    <span className="sp-btn-shine"/>
                    {loading ? <span className="sp-spinner"/> : <>Send Verification OTP <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                </form>
                <p className="sp-footer">Already registered? <Link href="/login">Sign In</Link></p>
              </>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === "otp" && (
              <>
                <button className="sp-back" onClick={()=>setStep("form")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Back
                </button>
                <div className="sp-step-badge s2">Step 2 of 2 · OTP Verification</div>
                <h2 className="sp-heading">Check Your Email</h2>
                <p className="sp-sub">We sent a 6-digit OTP to <strong>{form.email}</strong>. Enter it below.</p>
                <div className="sp-progress"><div className="sp-progress-fill" style={{width:"100%"}}/></div>

                {apiError && <div className="sp-err"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{apiError}</div>}

                <form onSubmit={handleVerifyAndCreate}>
                  <div className="sp-field">
                    <label className="sp-label">Enter 6-digit OTP</label>
                    <div className="sp-otp-wrap">
                      <div className="sp-otp-grid" onPaste={handleOtpPaste}>
                        {otp.map((digit,i)=>(
                          <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} className={`sp-otp-in${digit?" filled":""}`} value={digit} onChange={e=>handleOtpChange(i,e.target.value)} onKeyDown={e=>handleOtpKeyDown(i,e)} autoFocus={i===0} autoComplete="one-time-code"/>
                        ))}
                      </div>
                    </div>
                    <p className="sp-otp-hint">OTP is valid for 10 minutes</p>
                  </div>
                  <button type="submit" className="sp-btn" disabled={loading||otp.join("").length!==6}>
                    <span className="sp-btn-shine"/>
                    {loading ? <span className="sp-spinner"/> : <>Verify & Create Account <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                </form>
                <p className="sp-resend">Didn't receive the code?{" "}
                  <button className="sp-resend-btn" onClick={handleResendOTP} disabled={loading}>Resend OTP</button>
                </p>
              </>
            )}

            {/* ── STEP 3: SUCCESS ── */}
            {step === "success" && (
              <div className="sp-success">
                <div className="sp-suc-icon">🎉</div>
                <h2 className="sp-suc-title">Hospital Registered!</h2>
                <p className="sp-suc-sub"><strong style={{color:"var(--sub-strong)"}}>{form.hospitalName}</strong> has been successfully onboarded. Your admin account is ready. Redirecting to login...</p>
                <div className="sp-redir-bar"><div className="sp-redir-fill"/></div>
                <p className="sp-footer" style={{marginTop:20}}>Not redirecting? <Link href="/login">Click here</Link></p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
