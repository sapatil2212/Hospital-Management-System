"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FpStep = "email" | "otp" | "password" | "done";

export default function LoginPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [success, setSuccess] = useState(false);

  // Forgot password modal state
  const [fpOpen, setFpOpen] = useState(false);
  const [fpStep, setFpStep] = useState<FpStep>("email");
  const [fpEmail, setFpEmail] = useState("");
  const [fpEmailError, setFpEmailError] = useState("");
  const [fpOtp, setFpOtp] = useState(["", "", "", "", "", ""]);
  const [fpOtpError, setFpOtpError] = useState("");
  const [fpNewPw, setFpNewPw] = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpPwError, setFpPwError] = useState("");
  const [fpConfirmError, setFpConfirmError] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpApiError, setFpApiError] = useState("");
  const [showFpPw, setShowFpPw] = useState(false);
  const [showFpConfirm, setShowFpConfirm] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Minimum 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        const role = data.data?.user?.role;
        setTimeout(() => {
          if (role === "SUPER_ADMIN") router.push("/superadmin/dashboard");
          else if (role === "DOCTOR") router.push("/doctor/dashboard");
          else if (role === "RECEPTIONIST" || role === "STAFF") router.push("/staff/dashboard");
          else if (role === "SUB_DEPT_HEAD") router.push("/subdept/dashboard");
          else router.push("/hospitaladmin/dashboard");
        }, 800);
      } else {
        setApiError(data.message || "Invalid email or password.");
      }
    } catch { setApiError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  };

  // ── Forgot Password Handlers ──
  const openFp = () => {
    setFpOpen(true); setFpStep("email"); setFpEmail(""); setFpEmailError("");
    setFpOtp(["","","","","",""]); setFpOtpError(""); setFpNewPw(""); setFpConfirmPw("");
    setFpPwError(""); setFpConfirmError(""); setFpApiError(""); setFpLoading(false);
  };
  const closeFp = () => setFpOpen(false);

  const handleFpSendOtp = async () => {
    if (!fpEmail) { setFpEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(fpEmail)) { setFpEmailError("Enter a valid email address"); return; }
    setFpEmailError(""); setFpLoading(true); setFpApiError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setFpStep("otp"); }
      else setFpApiError(data.message || "Failed to send OTP.");
    } catch { setFpApiError("Network error."); }
    finally { setFpLoading(false); }
  };

  const handleFpOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...fpOtp]; next[index] = value.replace(/\D/g, ""); setFpOtp(next);
    setFpOtpError(""); setFpApiError("");
    if (value && index < 5) document.getElementById(`fp-otp-${index + 1}`)?.focus();
  };
  const handleFpOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !fpOtp[index] && index > 0)
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
  };
  const handleFpOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setFpOtp(pasted.split("")); document.getElementById("fp-otp-5")?.focus(); }
    e.preventDefault();
  };

  const handleFpVerifyOtp = async () => {
    const otpStr = fpOtp.join("");
    if (otpStr.length !== 6) { setFpOtpError("Enter the complete 6-digit OTP"); return; }
    setFpLoading(true); setFpApiError("");
    try {
      // We verify on the reset-password step, so just advance
      setFpStep("password");
    } catch { setFpApiError("Network error."); }
    finally { setFpLoading(false); }
  };

  const handleFpResetPassword = async () => {
    let hasErr = false;
    if (!fpNewPw || fpNewPw.length < 6) { setFpPwError("Minimum 6 characters"); hasErr = true; } else setFpPwError("");
    if (fpNewPw !== fpConfirmPw) { setFpConfirmError("Passwords do not match"); hasErr = true; } else setFpConfirmError("");
    if (hasErr) return;
    setFpLoading(true); setFpApiError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp.join(""), newPassword: fpNewPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setFpStep("done"); }
      else setFpApiError(data.message || "Password reset failed.");
    } catch { setFpApiError("Network error."); }
    finally { setFpLoading(false); }
  };

  const t = dark ? "dark" : "light";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .lp.dark { --bg:#0f0f19; --brand-from:#0f172a; --brand-to:#065f46; --card-bg:#0f0f19; --input-bg:rgba(255,255,255,0.04); --input-border:rgba(255,255,255,0.1); --input-focus-border:rgba(16,185,129,0.55); --input-focus-shadow:rgba(16,185,129,0.12); --input-color:#fff; --placeholder:rgba(255,255,255,0.18); --label:#9ca3af; --heading:#fff; --sub:rgba(255,255,255,0.35); --err-bg:rgba(239,68,68,0.08); --err-border:rgba(239,68,68,0.22); --err-color:#fca5a5; --ferr:#f87171; --suc-bg:rgba(16,185,129,0.1); --suc-border:rgba(16,185,129,0.25); --suc-color:#6ee7b7; --toggle-bg:rgba(255,255,255,0.08); --toggle-color:rgba(255,255,255,0.5); --toggle-hover:rgba(255,255,255,0.14); --divider:rgba(255,255,255,0.08); --divider-text:rgba(255,255,255,0.2); --sa-bg:rgba(220,38,38,0.06); --sa-border:rgba(220,38,38,0.15); --sa-color:rgba(248,113,113,0.85); --sa-hover-bg:rgba(220,38,38,0.1); --sa-hover-border:rgba(220,38,38,0.3); --sa-hover-color:#f87171; --footer-color:rgba(255,255,255,0.3); --footer-link:#34d399; --eye-color:rgba(255,255,255,0.25); --eye-hover:rgba(255,255,255,0.55); --forgot:#34d399; --brand-grid:rgba(255,255,255,0.025); --stat-num:#34d399; --stat-label:rgba(255,255,255,0.4); --stat-div:rgba(255,255,255,0.12); --pill-bg:rgba(255,255,255,0.05); --pill-border:rgba(255,255,255,0.12); --pill-color:rgba(255,255,255,0.6); --brand-title:#fff; --brand-sub:rgba(255,255,255,0.5); --modal-bg:#1a1a2e; --modal-border:rgba(255,255,255,0.1); --modal-input-bg:rgba(255,255,255,0.05); --otp-bg:rgba(255,255,255,0.06); --otp-border:rgba(255,255,255,0.15); --otp-filled-border:rgba(99,102,241,0.6); }

        .lp.light { --bg:#f0fdf4; --brand-from:#dcfce7; --brand-to:#bbf7d0; --card-bg:#ffffff; --input-bg:#f9fafb; --input-border:#d1d5db; --input-focus-border:#10b981; --input-focus-shadow:rgba(16,185,129,0.15); --input-color:#111827; --placeholder:#9ca3af; --label:#6b7280; --heading:#111827; --sub:#6b7280; --err-bg:#fef2f2; --err-border:#fecaca; --err-color:#dc2626; --ferr:#dc2626; --suc-bg:#f0fdf4; --suc-border:#bbf7d0; --suc-color:#059669; --toggle-bg:rgba(0,0,0,0.07); --toggle-color:#374151; --toggle-hover:rgba(0,0,0,0.12); --divider:#e5e7eb; --divider-text:#9ca3af; --sa-bg:#fff1f2; --sa-border:#fecdd3; --sa-color:#e11d48; --sa-hover-bg:#ffe4e6; --sa-hover-border:#fda4af; --sa-hover-color:#be123c; --footer-color:#6b7280; --footer-link:#059669; --eye-color:#9ca3af; --eye-hover:#374151; --forgot:#059669; --brand-grid:rgba(16,185,129,0.06); --stat-num:#059669; --stat-label:#6b7280; --stat-div:#d1d5db; --pill-bg:rgba(16,185,129,0.06); --pill-border:rgba(16,185,129,0.18); --pill-color:#065f46; --brand-title:#14532d; --brand-sub:#374151; --modal-bg:#ffffff; --modal-border:#e5e7eb; --modal-input-bg:#f9fafb; --otp-bg:#f9fafb; --otp-border:#d1d5db; --otp-filled-border:#6366f1; }

        .lp { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; font-family:'Inter',sans-serif; overflow:hidden; transition:background 0.3s; background:var(--bg); }
        @media(max-width:768px){ .lp{ grid-template-columns:1fr; } .lp-brand{ display:none; } }

        .lp-toggle { position:fixed; top:20px; right:20px; z-index:200; width:40px; height:40px; border-radius:50%; border:none; cursor:pointer; background:var(--toggle-bg); color:var(--toggle-color); display:flex; align-items:center; justify-content:center; transition:background 0.2s, transform 0.2s; box-shadow:0 2px 12px rgba(0,0,0,0.12); backdrop-filter:blur(8px); }
        .lp-toggle:hover { background:var(--toggle-hover); transform:scale(1.1); }

        .lp-brand { background:linear-gradient(155deg, var(--brand-from) 0%, #98f5b0 50%, var(--brand-to) 100%); display:flex; align-items:center; justify-content:center; padding:48px; position:relative; overflow:hidden; transition:background 0.3s; }
        .lp-brand-grid { position:absolute; inset:0; background-image:linear-gradient(var(--brand-grid) 1px, transparent 1px), linear-gradient(90deg, var(--brand-grid) 1px, transparent 1px); background-size:40px 40px; }
        .lp-brand-glow { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at 10% 30%, rgba(16,185,129,0.2) 0%, transparent 55%), radial-gradient(ellipse at 85% 70%, rgba(5,150,105,0.15) 0%, transparent 55%); }
        .lp-brand-content { position:relative; z-index:2; max-width:420px; }
        .lp-logo { display:flex; align-items:center; gap:12px; margin-bottom:48px; text-decoration:none; }
        .lp-logo-icon { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg, #10b981, #059669); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(16,185,129,0.4); }
        .lp-logo-text { font-size:22px; font-weight:800; color:var(--brand-title); letter-spacing:-0.02em; }
        .lp-logo-accent { color:#059669; }
        .lp.light .lp-logo-accent { color:#047857; }
        .lp-brand-title { font-size:38px; font-weight:800; line-height:1.15; letter-spacing:-0.03em; margin-bottom:16px; color:var(--brand-title); }
        .lp-brand-title span { background:linear-gradient(135deg, #059669, #34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .lp-brand-sub { font-size:15px; color:var(--brand-sub); line-height:1.7; margin-bottom:40px; }
        .lp-stats { display:flex; gap:24px; margin-bottom:40px; }
        .lp-stat { text-align:center; }
        .lp-stat-num { font-size:28px; font-weight:800; color:var(--stat-num); display:block; letter-spacing:-0.02em; }
        .lp-stat-label { font-size:12px; color:var(--stat-label); font-weight:500; }
        .lp-stat-div { width:1px; background:var(--stat-div); }
        .lp-pills { display:flex; flex-wrap:wrap; gap:8px; }
        .lp-pill { padding:5px 12px; border-radius:100px; font-size:12px; font-weight:600; border:1px solid var(--pill-border); color:var(--pill-color); background:var(--pill-bg); }

        .lp-form-side { background:var(--card-bg); display:flex; align-items:center; justify-content:center; padding:32px; transition:background 0.3s; }
        .lp-form-box { width:100%; max-width:420px; }
        .lp-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:100px; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.22); margin-bottom:12px; }
        .lp-heading { font-size:28px; font-weight:800; color:var(--heading); letter-spacing:-0.02em; margin-bottom:6px; }
        .lp-sub { font-size:14px; color:var(--sub); line-height:1.6; margin-bottom:24px; }

        .lp-err { display:flex; align-items:flex-start; gap:10px; background:var(--err-bg); border:1px solid var(--err-border); border-radius:12px; padding:12px 14px; margin-bottom:18px; font-size:13px; color:var(--err-color); line-height:1.5; animation:lp-shake 0.3s ease; }
        @keyframes lp-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .lp-suc { display:flex; align-items:center; gap:10px; background:var(--suc-bg); border:1px solid var(--suc-border); border-radius:12px; padding:12px 14px; margin-bottom:18px; font-size:13px; color:var(--suc-color); font-weight:600; }

        .lp-field { margin-bottom:16px; }
        .lp-label-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; }
        .lp-label { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--label); }
        .lp-forgot { font-size:12px; font-weight:600; color:var(--forgot); text-decoration:none; background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif; transition:opacity 0.2s; }
        .lp-forgot:hover { opacity:0.75; }
        .lp-wrap { position:relative; }
        .lp-input { width:100%; background:var(--input-bg); border:1.5px solid var(--input-border); border-radius:11px; padding:13px 42px 13px 14px; font-size:14px; color:var(--input-color); font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .lp-input::placeholder { color:var(--placeholder); }
        .lp-input:focus { border-color:var(--input-focus-border); box-shadow:0 0 0 3px var(--input-focus-shadow); }
        .lp-input.err { border-color:#ef4444; }
        .lp-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--eye-color); display:flex; align-items:center; padding:0; transition:color 0.2s; }
        .lp-eye:hover { color:var(--eye-hover); }
        .lp-ferr { font-size:12px; color:var(--ferr); margin-top:5px; display:block; }

        .lp-btn { width:100%; padding:14px; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'Inter',sans-serif; cursor:pointer; position:relative; overflow:hidden; transition:transform 0.15s, box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg, #10b981, #059669); color:#fff; box-shadow:0 4px 18px rgba(16,185,129,0.3); }
        .lp-btn:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 8px 26px rgba(16,185,129,0.42); }
        .lp-btn:active:not(:disabled){ transform:translateY(0); }
        .lp-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .lp-btn-shine { position:absolute; inset:0; background:linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%); background-size:200% 100%; animation:lp-shine 3s infinite; }
        @keyframes lp-shine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .lp-spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:lp-spin 0.7s linear infinite; }
        @keyframes lp-spin { to{ transform:rotate(360deg); } }

        .lp-divider { display:flex; align-items:center; gap:12px; margin:18px 0 12px; }
        .lp-divider-line { flex:1; height:1px; background:var(--divider); }
        .lp-divider-text { font-size:11px; color:var(--divider-text); font-weight:500; white-space:nowrap; }
        .lp-sa { display:flex; align-items:center; justify-content:center; gap:8px; padding:11px; border-radius:11px; width:100%; background:var(--sa-bg); border:1px solid var(--sa-border); font-size:13px; font-weight:600; color:var(--sa-color); text-decoration:none; transition:all 0.2s; }
        .lp-sa:hover { background:var(--sa-hover-bg); color:var(--sa-hover-color); border-color:var(--sa-hover-border); }
        .lp-footer { text-align:center; margin-top:20px; font-size:13px; color:var(--footer-color); }
        .lp-footer a { color:var(--footer-link); text-decoration:none; font-weight:600; }
        .lp-footer a:hover { opacity:0.8; }

        /* ── FORGOT PASSWORD MODAL ── */
        .fp-overlay { position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px; animation:fp-fade-in 0.2s ease; }
        .fp-backdrop { position:absolute; inset:0; background:rgba(0,0,0,0.35); backdrop-filter:blur(4px); }
        @keyframes fp-fade-in { from{opacity:0} to{opacity:1} }

        .fp-modal { position:relative; z-index:1; background:#fff; border:1px solid #e5e7eb; border-radius:14px; width:100%; max-width:380px; box-shadow:0 8px 32px rgba(0,0,0,0.1); animation:fp-slide-up 0.25s cubic-bezier(0.175,0.885,0.32,1.275); }
        .lp.dark .fp-modal { background:#1e1e2e; border-color:rgba(255,255,255,0.1); }
        @keyframes fp-slide-up { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }

        /* modal top bar */
        .fp-topbar { display:flex; align-items:center; justify-content:space-between; padding:18px 20px 14px; border-bottom:1px solid #f3f4f6; }
        .lp.dark .fp-topbar { border-color:rgba(255,255,255,0.07); }
        .fp-topbar-title { font-size:15px; font-weight:700; color:var(--heading); }
        .fp-close { width:28px; height:28px; border-radius:8px; background:#f3f4f6; border:none; cursor:pointer; color:#6b7280; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
        .lp.dark .fp-close { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.5); }
        .fp-close:hover { background:#e5e7eb; }
        .lp.dark .fp-close:hover { background:rgba(255,255,255,0.14); }

        /* step dots */
        .fp-steps { display:flex; align-items:center; padding:12px 20px 0; gap:0; }
        .fp-step { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; }
        .fp-step-dot { width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; transition:all 0.25s; }
        .fp-step.active .fp-step-dot { background:#6366f1; color:#fff; }
        .fp-step.done .fp-step-dot { background:#d1fae5; color:#059669; }
        .fp-step.inactive .fp-step-dot { background:#f3f4f6; color:#9ca3af; }
        .lp.dark .fp-step.inactive .fp-step-dot { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.3); }
        .fp-step-label { color:#9ca3af; font-size:11px; }
        .fp-step.active .fp-step-label { color:#6366f1; }
        .fp-step.done .fp-step-label { color:#10b981; }
        .fp-step-line { flex:1; height:1px; background:#e5e7eb; margin:0 6px; }
        .lp.dark .fp-step-line { background:rgba(255,255,255,0.1); }
        .fp-step-line.done { background:#10b981; }

        .fp-body { padding:20px 20px 22px; }
        .fp-label { display:block; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#9ca3af; margin-bottom:6px; }
        .fp-input { width:100%; background:#f9fafb; border:1px solid #e5e7eb; border-radius:9px; padding:11px 12px; font-size:14px; color:var(--input-color); font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .lp.dark .fp-input { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.1); }
        .fp-input::placeholder { color:#d1d5db; }
        .fp-input:focus { border-color:#a5b4fc; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .fp-input.err { border-color:#fca5a5; }
        .fp-ferr { font-size:12px; color:#ef4444; margin-top:4px; display:block; }

        .fp-api-err { display:flex; align-items:flex-start; gap:8px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:9px 12px; margin-bottom:14px; font-size:12px; color:#dc2626; line-height:1.5; animation:lp-shake 0.3s ease; }
        .lp.dark .fp-api-err { background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.2); color:#fca5a5; }

        /* OTP grid in modal */
        .fp-otp-wrap { display:flex; justify-content:center; margin-bottom:6px; }
        .fp-otp-grid { display:flex; gap:7px; width:100%; max-width:290px; }
        .fp-otp-in { flex:1; min-width:0; text-align:center; font-size:18px; font-weight:700; padding:10px 0; border-radius:9px; background:#f9fafb; border:1px solid #e5e7eb; color:var(--input-color); font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s; caret-color:#6366f1; }
        .lp.dark .fp-otp-in { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.12); }
        .fp-otp-in:focus { border-color:#a5b4fc; box-shadow:0 0 0 2px rgba(99,102,241,0.1); }
        .fp-otp-in.filled { border-color:#c7d2fe; background:#eef2ff; }
        .lp.dark .fp-otp-in.filled { border-color:rgba(99,102,241,0.4); background:rgba(99,102,241,0.08); }
        .fp-otp-hint { font-size:11px; color:#9ca3af; text-align:center; margin-bottom:16px; }

        .fp-pw-wrap { position:relative; margin-bottom:4px; }
        .fp-pw-eye { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; display:flex; align-items:center; padding:0; transition:color 0.2s; }
        .fp-pw-eye:hover { color:#6b7280; }

        .fp-btn { width:100%; padding:11px; border:none; border-radius:9px; font-size:14px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; background:#4f46e5; color:#fff; transition:background 0.15s, transform 0.1s; margin-top:16px; }
        .fp-btn:hover:not(:disabled) { background:#4338ca; transform:translateY(-1px); }
        .fp-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .fp-resend { font-size:12px; color:#9ca3af; text-align:center; margin-top:12px; }
        .fp-resend-btn { background:none; border:none; color:#6366f1; cursor:pointer; font-size:12px; font-weight:600; font-family:'Inter',sans-serif; }
        .fp-resend-btn:hover { opacity:0.8; }

        /* success state */
        .fp-success { text-align:center; padding:4px 0 4px; }
        .fp-suc-icon { width:52px; height:52px; border-radius:50%; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; font-size:24px; animation:fp-pop 0.35s cubic-bezier(0.175,0.885,0.32,1.275); }
        @keyframes fp-pop { 0%{transform:scale(0)} 100%{transform:scale(1)} }
        .fp-suc-title { font-size:17px; font-weight:700; color:var(--heading); margin-bottom:6px; }
        .fp-suc-sub { font-size:13px; color:#9ca3af; line-height:1.6; margin-bottom:18px; }
        .fp-suc-btn { display:inline-flex; align-items:center; gap:6px; padding:10px 22px; border-radius:9px; background:#4f46e5; color:#fff; border:none; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; cursor:pointer; transition:background 0.15s; }
        .fp-suc-btn:hover { background:#4338ca; }
      `}</style>

      <button className="lp-toggle" onClick={() => setDark(!dark)} title={dark ? "Light Mode" : "Dark Mode"}>
        {dark
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        }
      </button>

      <div className={`lp ${t}`}>
        {/* ── BRAND ── */}
        <div className="lp-brand">
          <div className="lp-brand-grid"/>
          <div className="lp-brand-glow"/>
          <div className="lp-brand-content">
            <Link href="/" className="lp-logo">
              <div className="lp-logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span className="lp-logo-text">Medi<span className="lp-logo-accent">Care+</span></span>
            </Link>
            <h1 className="lp-brand-title">Welcome<br /><span>Back</span></h1>
            <p className="lp-brand-sub">Access your hospital management dashboard. Manage staff, patients, appointments, and billing — all in one secure platform.</p>
            <div className="lp-stats">
              <div className="lp-stat"><span className="lp-stat-num">100+</span><span className="lp-stat-label">Hospitals</span></div>
              <div className="lp-stat-div"/>
              <div className="lp-stat"><span className="lp-stat-num">500+</span><span className="lp-stat-label">Doctors</span></div>
              <div className="lp-stat-div"/>
              <div className="lp-stat"><span className="lp-stat-num">99.9%</span><span className="lp-stat-label">Uptime</span></div>
            </div>
            <div className="lp-pills">
              {["Hospital Admin","Doctor","Receptionist","Staff"].map(r=><span key={r} className="lp-pill">{r}</span>)}
            </div>
          </div>
        </div>

        {/* ── FORM SIDE ── */}
        <div className="lp-form-side">
          <div className="lp-form-box">
            <div className="lp-badge">
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981"}}/>
              Secure Access
            </div>
            <h2 className="lp-heading">Sign In</h2>
            <p className="lp-sub">Enter your hospital admin credentials to access your dashboard.</p>

            {apiError && (
              <div className="lp-err">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {apiError}
              </div>
            )}
            {success && (
              <div className="lp-suc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Login successful! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-label" htmlFor="login-email">Email Address</label>
                <div className="lp-wrap">
                  <input id="login-email" type="email" className={`lp-input${fieldErrors.email?" err":""}`} placeholder="admin@hospital.com" value={email} onChange={e=>{setEmail(e.target.value); setFieldErrors(f=>({...f,email:undefined})); setApiError("");}} autoComplete="email" autoFocus/>
                  <button type="button" className="lp-eye" tabIndex={-1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </button>
                </div>
                {fieldErrors.email && <span className="lp-ferr">{fieldErrors.email}</span>}
              </div>

              <div className="lp-field">
                <div className="lp-label-row">
                  <label className="lp-label" htmlFor="login-pw">Password</label>
                  <button type="button" className="lp-forgot" onClick={openFp}>Forgot password?</button>
                </div>
                <div className="lp-wrap">
                  <input id="login-pw" type={showPw?"text":"password"} className={`lp-input${fieldErrors.password?" err":""}`} placeholder="Enter your password" value={password} onChange={e=>{setPassword(e.target.value); setFieldErrors(f=>({...f,password:undefined})); setApiError("");}} autoComplete="current-password"/>
                  <button type="button" className="lp-eye" onClick={()=>setShowPw(!showPw)}>
                    {showPw
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
                {fieldErrors.password && <span className="lp-ferr">{fieldErrors.password}</span>}
              </div>

              <button type="submit" className="lp-btn" disabled={loading||success}>
                <span className="lp-btn-shine"/>
                {loading ? <span className="lp-spinner"/> : success ? "Redirecting..." : <>Sign In <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
              </button>
            </form>

            <div className="lp-divider">
              <div className="lp-divider-line"/>
              <span className="lp-divider-text">Super Admin?</span>
              <div className="lp-divider-line"/>
            </div>

            <Link href="/superadmin/login" className="lp-sa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Access Super Admin Portal
            </Link>

            <p className="lp-footer">
              New hospital? <Link href="/signup">Register Here</Link> · <Link href="/">Back to Home</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {fpOpen && (
        <div className="fp-overlay">
          <div className="fp-backdrop" onClick={closeFp}/>
          <div className={`fp-modal lp ${t}`} style={{minHeight:"auto",display:"block",gridTemplateColumns:"auto"}}>
            {/* Top bar */}
            <div className="fp-topbar">
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:7,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <span className="fp-topbar-title">Reset Password</span>
              </div>
              <button className="fp-close" onClick={closeFp}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Step Indicator */}
            {fpStep !== "done" && (
              <div className="fp-steps" style={{paddingBottom:4}}>
                {[{label:"Email",n:1,key:"email"},{label:"OTP",n:2,key:"otp"},{label:"Password",n:3,key:"password"}].map((s,idx,arr) => {
                  const stepOrder: FpStep[] = ["email","otp","password","done"];
                  const curIdx = stepOrder.indexOf(fpStep);
                  const myIdx = stepOrder.indexOf(s.key as FpStep);
                  const cls = myIdx < curIdx ? "done" : myIdx === curIdx ? "active" : "inactive";
                  return (
                    <div key={s.key} style={{display:"flex",alignItems:"center",flex: idx < arr.length-1 ? 1 : 0}}>
                      <div className={`fp-step ${cls}`}>
                        <div className="fp-step-dot">{cls==="done"?"✓":s.n}</div>
                        <span className="fp-step-label">{s.label}</span>
                      </div>
                      {idx < arr.length-1 && <div className={`fp-step-line${cls==="done"?" done":""}`}/>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="fp-body">
              {/* API Error */}
              {fpApiError && (
                <div className="fp-api-err">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {fpApiError}
                </div>
              )}

              {/* STEP 1: Email */}
              {fpStep === "email" && (
                <>
                  <p style={{fontSize:13,color:"#9ca3af",marginBottom:14,lineHeight:1.6}}>
                    Enter the email address linked to your account.
                  </p>
                  <label className="fp-label">Email Address</label>
                  <input
                    id="fp-email"
                    type="email"
                    className={`fp-input${fpEmailError?" err":""}`}
                    placeholder="admin@hospital.com"
                    value={fpEmail}
                    onChange={e=>{setFpEmail(e.target.value); setFpEmailError(""); setFpApiError("");}}
                    autoFocus
                    onKeyDown={e=>{ if(e.key==="Enter") handleFpSendOtp(); }}
                  />
                  {fpEmailError && <span className="fp-ferr">{fpEmailError}</span>}
                  <button className="fp-btn" onClick={handleFpSendOtp} disabled={fpLoading}>
                    {fpLoading ? <span className="lp-spinner"/> : <>Send OTP <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                </>
              )}

              {/* STEP 2: OTP */}
              {fpStep === "otp" && (
                <>
                  <p style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.6}}>
                    A 6-digit code was sent to <strong style={{color:"var(--heading)"}}>{fpEmail}</strong>.
                  </p>
                  <label className="fp-label">Enter 6-digit OTP</label>
                  <div className="fp-otp-wrap">
                    <div className="fp-otp-grid" onPaste={handleFpOtpPaste}>
                      {fpOtp.map((digit,i)=>(
                        <input
                          key={i}
                          id={`fp-otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`fp-otp-in${digit?" filled":""}`}
                          value={digit}
                          onChange={e=>handleFpOtpChange(i,e.target.value)}
                          onKeyDown={e=>handleFpOtpKeyDown(i,e)}
                          autoFocus={i===0}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                  </div>
                  {fpOtpError && <span className="fp-ferr" style={{textAlign:"center",display:"block"}}>{fpOtpError}</span>}
                  <p className="fp-otp-hint">Code is valid for 10 minutes</p>
                  <button className="fp-btn" onClick={handleFpVerifyOtp} disabled={fpLoading || fpOtp.join("").length!==6}>
                    {fpLoading ? <span className="lp-spinner"/> : <>Verify OTP <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                  <p className="fp-resend">
                    Didn't receive it?{" "}
                    <button className="fp-resend-btn" onClick={()=>{ setFpOtp(["","","","","",""]); handleFpSendOtp(); }} disabled={fpLoading}>Resend OTP</button>
                  </p>
                </>
              )}

              {/* STEP 3: New Password */}
              {fpStep === "password" && (
                <>
                  <p style={{fontSize:13,color:"#9ca3af",marginBottom:16,lineHeight:1.6}}>
                    OTP verified ✓ &mdash; choose a new password.
                  </p>
                  <div style={{marginBottom:14}}>
                    <label className="fp-label">New Password</label>
                    <div className="fp-pw-wrap">
                      <input
                        type={showFpPw?"text":"password"}
                        className={`fp-input${fpPwError?" err":""}`}
                        placeholder="Minimum 6 characters"
                        value={fpNewPw}
                        onChange={e=>{setFpNewPw(e.target.value); setFpPwError(""); setFpApiError("");}}
                        autoFocus
                        style={{paddingRight:42}}
                      />
                      <button type="button" className="fp-pw-eye" onClick={()=>setShowFpPw(!showFpPw)}>
                        {showFpPw
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                    {fpPwError && <span className="fp-ferr">{fpPwError}</span>}
                  </div>
                  <div>
                    <label className="fp-label">Confirm New Password</label>
                    <div className="fp-pw-wrap">
                      <input
                        type={showFpConfirm?"text":"password"}
                        className={`fp-input${fpConfirmError?" err":""}`}
                        placeholder="Re-enter new password"
                        value={fpConfirmPw}
                        onChange={e=>{setFpConfirmPw(e.target.value); setFpConfirmError(""); setFpApiError("");}}
                        style={{paddingRight:42}}
                        onKeyDown={e=>{ if(e.key==="Enter") handleFpResetPassword(); }}
                      />
                      <button type="button" className="fp-pw-eye" onClick={()=>setShowFpConfirm(!showFpConfirm)}>
                        {showFpConfirm
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                    {fpConfirmError && <span className="fp-ferr">{fpConfirmError}</span>}
                  </div>
                  <button className="fp-btn" onClick={handleFpResetPassword} disabled={fpLoading}>
                    {fpLoading ? <span className="lp-spinner"/> : <>Reset Password <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                </>
              )}

              {/* STEP 4: Done */}
              {fpStep === "done" && (
                <div className="fp-success">
                  <div className="fp-suc-icon">🎉</div>
                  <div className="fp-suc-title">Password Reset!</div>
                  <p className="fp-suc-sub">Your password has been successfully updated. You can now sign in with your new password.</p>
                  <button className="fp-suc-btn" onClick={closeFp}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    Go to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
