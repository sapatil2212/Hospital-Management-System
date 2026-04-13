"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar, Clock, Phone, Mail, User, Building2,
  CheckCircle2, Loader2, ChevronDown, MapPin, ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface Department { id: string; name: string; type: string; }
interface HospitalInfo {
  id: string; name: string; logo: string | null;
  phone: string | null; address: string | null;
}

const TIME_SLOTS = [
  "09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM",
  "04:00 PM","04:30 PM","05:00 PM",
];

function BookingForm() {
  const searchParams = useSearchParams();
  const hid = searchParams.get("hid") || "";

  const [hospital, setHospital] = useState<HospitalInfo | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    departmentId: "", departmentName: "",
    preferredDate: "", preferredTime: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!hid) { setNotFound(true); setLoadingInfo(false); return; }
    fetch(`/api/public/booking?hid=${hid}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setHospital(d.data.hospital);
          setDepartments(d.data.departments || []);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingInfo(false));
  }, [hid]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleDeptChange = (id: string) => {
    const dept = departments.find(d => d.id === id);
    setForm(p => ({ ...p, departmentId: id, departmentName: dept?.name || "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId: hid, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.data.patientId);
      } else {
        setError(data.message || "Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInfo) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f9ff" }}>
      <div style={{ textAlign: "center", color: "#64748b" }}>
        <Loader2 size={32} style={{ animation: "spin 0.8s linear infinite", color: "#0E898F", marginBottom: 12 }} />
        <p style={{ fontSize: 14 }}>Loading…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f9ff", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <Building2 size={48} style={{ color: "#cbd5e1", marginBottom: 16 }} />
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Hospital Not Found</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          This booking link is invalid or has expired. Please contact the hospital directly.
        </p>
        <Link href="/" style={{ color: "#0E898F", fontWeight: 600, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Go Home
        </Link>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 440, background: "#fff", borderRadius: 24, padding: "48px 40px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: "1px solid #bbf7d0" }}>
        <CheckCircle2 size={56} style={{ color: "#10b981", marginBottom: 20 }} />
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#1e293b", marginBottom: 10 }}>Booking Submitted!</h2>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          Your appointment request has been received. Our team will contact you shortly to confirm your slot.
        </p>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 20px", marginBottom: 28 }}>
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Patient ID</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{success}</div>
        </div>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>Please save your Patient ID for future reference.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)", fontFamily: "'Inter', sans-serif", padding: "24px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        .bk-input{width:100%;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 14px;font-size:14px;color:#1e293b;outline:none;transition:border-color 0.2s;font-family:'Inter',sans-serif}
        .bk-input:focus{border-color:#0E898F;box-shadow:0 0 0 3px rgba(14,137,143,0.12)}
        .bk-input::placeholder{color:#94a3b8}
        .bk-label{font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;margin-bottom:5px;display:block}
        .bk-slot{padding:8px 14px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;transition:all 0.15s;white-space:nowrap}
        .bk-slot:hover{border-color:#0E898F;color:#0E898F;background:#f0f9ff}
        .bk-slot.selected{border-color:#0E898F;background:#0E898F;color:#fff}
      `}</style>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Hospital Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {hospital?.logo ? (
            <img src={hospital.logo} alt={hospital.name} style={{ height: 52, objectFit: "contain", marginBottom: 12 }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #0E898F, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Building2 size={26} color="#fff" />
            </div>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>{hospital?.name}</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>Online Appointment Booking</p>
          {hospital?.address && (
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <MapPin size={12} />{hospital.address}
            </p>
          )}
        </div>

        {/* Form Card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginBottom: 24 }}>Fill in your details</h2>

          <form onSubmit={handleSubmit}>
            {/* Name + Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="bk-label"><User size={10} style={{ marginRight: 4 }} />Full Name *</label>
                <input className="bk-input" placeholder="John Doe" value={form.name} onChange={e => set("name", e.target.value)} required />
              </div>
              <div>
                <label className="bk-label"><Phone size={10} style={{ marginRight: 4 }} />Phone Number *</label>
                <input className="bk-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set("phone", e.target.value)} required />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label className="bk-label"><Mail size={10} style={{ marginRight: 4 }} />Email Address</label>
              <input className="bk-input" type="email" placeholder="john@example.com (optional)" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>

            {/* Department */}
            {departments.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label className="bk-label"><Building2 size={10} style={{ marginRight: 4 }} />Department / Speciality</label>
                <div style={{ position: "relative" }}>
                  <select className="bk-input" value={form.departmentId} onChange={e => handleDeptChange(e.target.value)}
                    style={{ appearance: "none", paddingRight: 36, cursor: "pointer" }}>
                    <option value="">Select department…</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                </div>
              </div>
            )}

            {/* Preferred Date */}
            <div style={{ marginBottom: 16 }}>
              <label className="bk-label"><Calendar size={10} style={{ marginRight: 4 }} />Preferred Date</label>
              <input className="bk-input" type="date" min={today} value={form.preferredDate} onChange={e => set("preferredDate", e.target.value)} />
            </div>

            {/* Time Slots */}
            <div style={{ marginBottom: 16 }}>
              <label className="bk-label"><Clock size={10} style={{ marginRight: 4 }} />Preferred Time Slot</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                {TIME_SLOTS.map(t => (
                  <button key={t} type="button"
                    className={`bk-slot${form.preferredTime === t ? " selected" : ""}`}
                    onClick={() => set("preferredTime", form.preferredTime === t ? "" : t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label className="bk-label">Additional Notes / Symptoms</label>
              <textarea className="bk-input" rows={3} placeholder="Describe your symptoms or any special requirements…"
                value={form.notes} onChange={e => set("notes", e.target.value)}
                style={{ resize: "vertical", minHeight: 80 }} />
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting}
              style={{ width: "100%", padding: "14px 24px", background: submitting ? "#94a3b8" : "linear-gradient(135deg, #0E898F, #0b7377)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
              {submitting ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />Submitting…</> : "Request Appointment"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 20 }}>
          {hospital?.phone && <>📞 {hospital.phone} &nbsp;·&nbsp; </>}
          Your information is secure and will only be used for appointment purposes.
        </p>
      </div>
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} style={{ animation: "spin 0.8s linear infinite", color: "#0E898F" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <BookingForm />
    </Suspense>
  );
}
