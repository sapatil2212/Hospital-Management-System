"use client";
import { useEffect, useState, useRef } from "react";
import { 
  FileText, Upload, Save, CheckCircle2, AlertCircle, Loader2, 
  Type, Layout, AlignLeft, Image as ImageIcon, Trash2, 
  Settings, Eye, Monitor, Info
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const DEFAULT_SETTINGS = {
  header: {
    showHospitalName: true,
    showHospitalAddress: true,
    showHospitalPhone: true,
    fontSize: "14px",
    alignment: "left" as "left" | "center" | "right",
  },
  footer: {
    text: "This is a computer-generated prescription and does not require a physical signature.",
    showPageNumber: true,
  },
  layout: {
    paperSize: "A4" as "A4" | "A5",
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
  },
  display: {
    showVitals: true,
    showDiagnosis: true,
    showIcdCodes: true,
    showReferrals: true,
  }
};

export default function PrescriptionSettingsPanel() {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ t: "", c: "" });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [signature, setSignature] = useState<string | null>(null);
  const [hospitalStamp, setHospitalStamp] = useState<string | null>(null);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const d = await api("/api/doctor/me");
      if (d.success) {
        setDoctor(d.data);
        setSignature(d.data.signature || null);
        setHospitalStamp(d.data.hospitalStamp || null);
        if (d.data.prescriptionSettings) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(d.data.prescriptionSettings) });
          } catch (e) {
            console.error("Error parsing prescription settings", e);
          }
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "signature" | "hospitalStamp") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type === "signature" ? "signature" : "stamp");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const d = await res.json();
      if (d.success) {
        if (type === "signature") setSignature(d.data.url);
        else setHospitalStamp(d.data.url);
        setMsg({ t: "Uploaded successfully. Don't forget to save!", c: "s" });
      } else {
        setMsg({ t: d.message || "Upload failed", c: "e" });
      }
    } catch (err) {
      setMsg({ t: "Upload error", c: "e" });
    }
    setSaving(false);
    if (e.target) e.target.value = "";
  };

  const saveSettings = async () => {
    setSaving(true);
    setMsg({ t: "", c: "" });
    const d = await api("/api/doctor/me", "PUT", {
      signature,
      hospitalStamp,
      prescriptionSettings: JSON.stringify(settings)
    });
    if (d.success) {
      setMsg({ t: "Settings saved successfully", c: "s" });
    } else {
      setMsg({ t: d.message || "Failed to save settings", c: "e" });
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <Loader2 size={24} style={{ animation: "spin .7s linear infinite", marginBottom: 10 }} />
      <div>Loading settings...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40, animation: "fadeIn .4s ease-out" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", letterSpacing: "-.02em" }}>Prescription Format Settings</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Customize how your printed prescriptions look</p>
        </div>
        <button 
          onClick={saveSettings} 
          disabled={saving}
          style={{ 
            display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", 
            borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", 
            color: "#fff", border: "none", fontSize: 14, fontWeight: 700, 
            cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
            opacity: saving ? 0.7 : 1, transition: "transform .2s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          {saving ? <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={16} />}
          Save Changes
        </button>
      </div>

      {msg.t && (
        <div style={{ 
          padding: "12px 16px", borderRadius: 12, marginBottom: 24, 
          display: "flex", alignItems: "center", gap: 12,
          background: msg.c === "s" ? "#f0fdf4" : "#fff5f5",
          border: `1px solid ${msg.c === "s" ? "#bbf7d0" : "#fecaca"}`,
          color: msg.c === "s" ? "#166534" : "#991b1b",
          fontSize: 14, fontWeight: 500, animation: "fadeIn .3s ease-out"
        }}>
          {msg.c === "s" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.t}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Visual Assets */}
          <Section title="Hospital Branding & Signature" icon={<ImageIcon size={18} />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1.5px dashed #e2e8f0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Hospital Stamp / Logo</div>
                {hospitalStamp ? (
                  <div style={{ position: "relative", width: "100%", height: 120, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img src={hospitalStamp} alt="Stamp" style={{ maxHeight: "90%", maxWidth: "90%", objectFit: "contain" }} />
                    <button onClick={() => setHospitalStamp(null)} style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: 4, cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => stampInputRef.current?.click()} style={{ width: "100%", height: 120, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8", cursor: "pointer" }}>
                    <Upload size={24} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Hospital Stamp</span>
                  </button>
                )}
                <input type="file" ref={stampInputRef} hidden onChange={e => handleFileUpload(e, "hospitalStamp")} accept="image/*" />
              </div>

              <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1.5px dashed #e2e8f0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Doctor's Digital Signature</div>
                {signature ? (
                  <div style={{ position: "relative", width: "100%", height: 120, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img src={signature} alt="Signature" style={{ maxHeight: "90%", maxWidth: "90%", objectFit: "contain" }} />
                    <button onClick={() => setSignature(null)} style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: 4, cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => sigInputRef.current?.click()} style={{ width: "100%", height: 120, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8", cursor: "pointer" }}>
                    <Upload size={24} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Upload Signature</span>
                  </button>
                )}
                <input type="file" ref={sigInputRef} hidden onChange={e => handleFileUpload(e, "signature")} accept="image/*" />
              </div>
            </div>
          </Section>

          {/* Header Settings */}
          <Section title="Header Layout" icon={<Layout size={18} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <Toggle label="Show Hospital Name" checked={settings.header.showHospitalName} onChange={v => setSettings(s => ({...s, header: {...s.header, showHospitalName: v}}))} />
              <Toggle label="Show Hospital Address" checked={settings.header.showHospitalAddress} onChange={v => setSettings(s => ({...s, header: {...s.header, showHospitalAddress: v}}))} />
              <Toggle label="Show Contact Number" checked={settings.header.showHospitalPhone} onChange={v => setSettings(s => ({...s, header: {...s.header, showHospitalPhone: v}}))} />
              
              <div style={{ marginTop: 5 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Text Alignment</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["left", "center", "right"].map(align => (
                    <button 
                      key={align}
                      onClick={() => setSettings(s => ({...s, header: {...s.header, alignment: align as any}}))}
                      style={{ 
                        flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #e2e8f0", 
                        background: settings.header.alignment === align ? "#f0fdf4" : "#fff",
                        borderColor: settings.header.alignment === align ? "#10b981" : "#e2e8f0",
                        color: settings.header.alignment === align ? "#059669" : "#64748b",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize"
                      }}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Display Content */}
          <Section title="Prescription Content" icon={<AlignLeft size={18} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <Toggle label="Display Patient Vitals" checked={settings.display.showVitals} onChange={v => setSettings(s => ({...s, display: {...s.display, showVitals: v}}))} />
              <Toggle label="Show Primary Diagnosis" checked={settings.display.showDiagnosis} onChange={v => setSettings(s => ({...s, display: {...s.display, showDiagnosis: v}}))} />
              <Toggle label="Include ICD-10 Codes" checked={settings.display.showIcdCodes} onChange={v => setSettings(s => ({...s, display: {...s.display, showIcdCodes: v}}))} />
              <Toggle label="Show Referred Departments" checked={settings.display.showReferrals} onChange={v => setSettings(s => ({...s, display: {...s.display, showReferrals: v}}))} />
            </div>
          </Section>

          {/* Footer & Page Settings */}
          <Section title="Footer & Page" icon={<Settings size={18} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Footer Disclaimer Text</label>
                <textarea 
                  value={settings.footer.text}
                  onChange={e => setSettings(s => ({...s, footer: {...s.footer, text: e.target.value}}))}
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155", outline: "none", resize: "none" }}
                />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Paper Size</label>
                  <select 
                    value={settings.layout.paperSize}
                    onChange={e => setSettings(s => ({...s, layout: {...s.layout, paperSize: e.target.value as any}}))}
                    style={{ width: "100%", padding: "9px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155", outline: "none" }}
                  >
                    <option value="A4">A4 (Standard)</option>
                    <option value="A5">A5 (Half-page)</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <Toggle label="Page Numbers" checked={settings.footer.showPageNumber} onChange={v => setSettings(s => ({...s, footer: {...s.footer, showPageNumber: v}}))} />
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Live Preview Column */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={18} color="#0E898F" /> 
            Live Preview
          </div>
          
          <PrescriptionPreview 
            settings={settings} 
            doctor={doctor} 
            signature={signature} 
            hospitalStamp={hospitalStamp} 
          />

          <div style={{ marginTop: 20, background: "#E6F4F4", borderRadius: 16, padding: 16, border: "1px solid #B3E0E0", display: "flex", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#0E898F", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
              <Monitor size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 2 }}>Instant Preview</div>
              <p style={{ fontSize: 11, color: "#0E898F", lineHeight: 1.5 }}>Changes appear instantly. Remember to save to apply them to your actual prescriptions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrescriptionPreview({ settings, doctor, signature, hospitalStamp }: any) {
  const s = settings;
  const h = s.header;
  
  return (
    <div style={{ 
      background: "#fff", 
      borderRadius: 8, 
      boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)", 
      width: "100%", 
      aspectRatio: s.layout.paperSize === "A4" ? "1 / 1.414" : "1.414 / 1",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      fontSize: "8px",
      color: "#000",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Paper texture/background subtle effect */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none", background: "url('https://www.transparenttextures.com/patterns/paper.png')" }} />

      {/* Header */}
      <div style={{ 
        display: "flex", 
        flexDirection: h.alignment === "center" ? "column" : "row",
        alignItems: h.alignment === "center" ? "center" : "flex-start",
        justifyContent: h.alignment === "right" ? "flex-end" : "space-between", 
        borderBottom: "1.5px solid #000", 
        paddingBottom: 10, 
        marginBottom: 12,
        textAlign: h.alignment,
        gap: 10
      }}>
        {hospitalStamp && <img src={hospitalStamp} style={{ height: 36, objectFit: "contain" }} alt="Stamp" />}
        <div>
          {h.showHospitalName && <div style={{ fontWeight: 800, fontSize: "11px", marginBottom: 2 }}>{doctor?.hospital?.name || "MediCare General Hospital"}</div>}
          {h.showHospitalAddress && <div style={{ opacity: 0.8, fontSize: "7px" }}>{doctor?.hospital?.address || "123 Healthcare Ave, Medical City, MC 56789"}</div>}
          {h.showHospitalPhone && <div style={{ opacity: 0.8, fontSize: "7px" }}>Ph: {doctor?.hospital?.phone || "+91 98765 43210"}</div>}
        </div>
      </div>

      {/* Patient & Doctor Basic Info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "0.5px solid #e2e8f0", paddingBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "9px" }}>Dr. {doctor?.name || "Johnathan Doe"}</div>
          <div style={{ fontSize: "6px", opacity: 0.7 }}>{doctor?.specialization || "General Physician"} · {doctor?.qualification || "MBBS, MD"}</div>
          <div style={{ fontSize: "6px", opacity: 0.7 }}>Reg No: {doctor?.registrationNo || "REG-987654"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: "8px" }}>Patient: Jane Smith</div>
          <div style={{ fontSize: "6px", opacity: 0.7 }}>ID: P-1023 | 28Y | Female</div>
          <div style={{ fontSize: "6px", opacity: 0.7 }}>Date: {new Date().toLocaleDateString("en-IN")}</div>
        </div>
      </div>

      {/* Content Placeholders */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, marginBottom: 6, fontSize: "12px", color: "#0E898F" }}>Rx</div>
        
        {s.display.showDiagnosis && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: "7px", marginBottom: 2 }}>Diagnosis:</div>
            <div style={{ fontSize: "7px" }}>Acute Respiratory Infection {s.display.showIcdCodes && "(ICD-10: J06.9)"}</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { n: "Amoxicillin 500mg", f: "1-0-1", d: "5 Days" },
            { n: "Paracetamol 650mg", f: "1-0-1 (SOS)", d: "3 Days" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #f1f5f9", paddingBottom: 3 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "8px" }}>{m.n}</div>
                <div style={{ fontSize: "5px", color: "#64748b" }}>After food · Oral</div>
              </div>
              <div style={{ textAlign: "right", fontSize: "7px" }}>
                <div>{m.f}</div>
                <div style={{ fontSize: "5px", color: "#64748b" }}>{m.d}</div>
              </div>
            </div>
          ))}
        </div>
        
        {s.display.showVitals && (
          <div style={{ marginTop: 12, background: "#f8fafc", padding: 6, borderRadius: 4, border: "0.5px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, fontSize: "6px", marginBottom: 3, color: "#64748b", textTransform: "uppercase" }}>Vitals</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: "6px" }}>
              <span>BP: 120/80</span>
              <span>Pulse: 72</span>
              <span>Temp: 98.6</span>
            </div>
          </div>
        )}

        {s.display.showReferrals && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 700, fontSize: "7px", marginBottom: 2 }}>Referrals:</div>
            <div style={{ fontSize: "6px", color: "#475569" }}>• Radiology (Chest X-Ray)</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 15 }}>
          <div style={{ textAlign: "center", minWidth: 80 }}>
            {signature && <img src={signature} style={{ height: 24, marginBottom: 4, mixBlendMode: "multiply" }} alt="Sig" />}
            <div style={{ borderTop: "1.5px solid #000", paddingTop: 4, fontWeight: 800, fontSize: "9px" }}>Dr. {doctor?.name?.split(" ").pop() || "Doe"}</div>
            <div style={{ fontSize: "6px", opacity: 0.6 }}>Digital Signature</div>
          </div>
        </div>
        <div style={{ borderTop: "0.5px solid #000", paddingTop: 6, textAlign: "center", fontSize: "6px", color: "#666", lineHeight: 1.4 }}>
          {s.footer.text}
          {s.footer.showPageNumber && <div style={{ marginTop: 4, fontWeight: 600 }}>Page 1 of 1</div>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ color: "#0E898F" }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{title}</div>
      </div>
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        style={{ 
          width: 38, height: 20, borderRadius: 100, background: checked ? "#10b981" : "#e2e8f0", 
          border: "none", position: "relative", cursor: "pointer", transition: "background .2s"
        }}
      >
        <div style={{ 
          position: "absolute", top: 3, left: checked ? 21 : 3, width: 14, height: 14, 
          borderRadius: "50%", background: "#fff", transition: "left .2s cubic-bezier(.4,0,.2,1)" 
        }} />
      </button>
    </div>
  );
}
