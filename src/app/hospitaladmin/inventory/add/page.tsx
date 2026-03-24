"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Save, X, Upload, Plus, Package, 
  Info, Barcode, AlertTriangle, IndianRupee, 
  Calendar, MapPin, ShieldCheck, Settings2, FileText,
  CheckCircle2, Building2, Stethoscope, Search, Bell, MessageSquare, ChevronRight, Loader2
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const SECTIONS = [
  { id: "basic", label: "Basic Information", icon: <Info size={16} /> },
  { id: "unit", label: "Unit & Packaging", icon: <Package size={16} /> },
  { id: "id", label: "Identification", icon: <Barcode size={16} /> },
  { id: "stock", label: "Stock & Alerts", icon: <AlertTriangle size={16} /> },
  { id: "purchase", label: "Purchase Details", icon: <Building2 size={16} /> },
  { id: "pricing", label: "Pricing & Billing", icon: <IndianRupee size={16} /> },
  { id: "batch", label: "Batch & Expiry", icon: <Calendar size={16} /> },
  { id: "storage", label: "Storage & Location", icon: <MapPin size={16} /> },
  { id: "compliance", label: "Compliance & Safety", icon: <ShieldCheck size={16} /> },
  { id: "status", label: "Status & Control", icon: <Settings2 size={16} /> },
  { id: "extra", label: "Additional Info", icon: <FileText size={16} /> },
];

export default function AddInventoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "", itemType: "Consumable",
    unit: "pcs", packSize: "", conversion: "",
    sku: "", barcode: "", hsnCode: "",
    openingStock: 0, minStock: 5, maxStock: 0, reorderLevel: 0, reorderQty: 0,
    purchasePrice: 0, supplierName: "", preferredVendor: "", purchaseUnit: "",
    mrp: 0, sellingPrice: 0, discount: 0, gst: 0, billingType: "Tax Inclusive",
    batchNumber: "", mfgDate: "", expiryDate: "", expiryAlertDays: 60,
    location: "Pharmacy Store", rackNumber: "", tempRequirement: "Room Temp",
    drugSchedule: "OTC", requiresRx: "No",
    status: "Active", isReturnable: "Yes", isCritical: "No",
    description: "", image: "", documents: []
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "inventory");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setForm(prev => ({ ...prev, image: data.data.url }));
      } else {
        setError(data.message || "Failed to upload image");
      }
    } catch (err) {
      setError("An error occurred during image upload");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    // Format the form data to match the API's Zod schema requirements
    const formattedForm = {
      // Basic Info
      name: form.name,
      genericName: form.genericName || undefined,
      brandName: form.brandName || undefined,
      category: form.category,
      subCategory: form.subCategory || undefined,
      itemType: form.itemType,
      description: form.description || undefined,

      // Unit & Packaging
      unit: form.unit || "pcs",
      packSize: form.packSize || undefined,
      conversion: form.conversion || undefined,

      // Identification
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      hsnCode: form.hsnCode || undefined,

      // Stock & Alerts (Parsed as integers)
      minStock: parseInt(String(form.minStock)) || 0,
      maxStock: parseInt(String(form.maxStock)) || undefined,
      reorderLevel: parseInt(String(form.reorderLevel)) || undefined,
      reorderQty: parseInt(String(form.reorderQty)) || undefined,
      openingStock: parseInt(String(form.openingStock)) || 0,

      // Purchase Details
      purchasePrice: parseFloat(String(form.purchasePrice)) || 0,
      purchaseUnit: form.purchaseUnit || undefined,
      // Note: preferredVendorId expects UUID. Omitted for now as form provides string name.

      // Pricing & Billing
      mrp: parseFloat(String(form.mrp)) || 0,
      sellingPrice: parseFloat(String(form.sellingPrice)) || 0,
      discount: parseFloat(String(form.discount)) || 0,
      gst: parseFloat(String(form.gst)) || 0,
      billingType: form.billingType,

      // Storage & Location
      location: form.location,
      rackNumber: form.rackNumber || undefined,
      tempRequirement: form.tempRequirement,

      // Compliance & Safety
      drugSchedule: form.drugSchedule,
      requiresRx: form.requiresRx === "Yes",

      // Status & Control
      isActive: form.status === "Active",
      isReturnable: form.isReturnable === "Yes",
      isCritical: form.isCritical === "Yes",

      // Media
      image: form.image || undefined,
    };
    
    try {
      const res = await api("/api/config/inventory", "POST", formattedForm);
      if (res.success) {
        router.push("/hospitaladmin/dashboard?tab=inventory");
      } else {
        // If validation failed, display specific error messages if available
        const errorMsg = res.errors 
          ? res.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
          : res.message || "Validation failed. Please check your inputs.";
        setError(errorMsg);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        input,select,button,textarea{font-family:'Inter',sans-serif}
        .hd{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0f4f8}
        .hd-sb{width:240px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04)}
        .hd-sb-logo{padding:20px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;cursor:pointer}
        .hd-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#0E898F,#07595D);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
        .hd-logo-tx{font-size:14px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .hd-logo-sub{font-size:10px;color:#94a3b8}
        .hd-nav{flex:1;padding:12px 12px;overflow-y:auto}
        .hd-nav-sec{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
        .hd-nb{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .hd-nb:hover{background:#f8fafc;color:#334155}
        .hd-nb.on{background:#E6F4F4;color:#0A6B70;font-weight:600}
        .hd-nb-dot{display:none;width:3px;border-radius:4px;height:22px;background:#0E898F;position:absolute;right:8px}
        .hd-nb.on .hd-nb-dot{display:block}
        .hd-main{margin-left:240px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .hd-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .hd-topbar-left{display:flex;align-items:center;gap:12px}
        .hd-pg-title{font-size:16px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .hd-pg-sub{font-size:10px;color:#94a3b8;margin-top:1px}
        .hd-body{padding:40px 24px;max-width:1000px;margin:0 auto;width:100%}
        .hd-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);padding:32px 24px;margin-bottom:24px}
        .hd-sec-head{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #f1f5f9}
        .hd-sec-num{width:26px;height:26px;background:#E6F4F4;color:#0E898F;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
        .hd-sec-title{font-size:13px;font-weight:700;color:#1e293b}
        .hd-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
        @media(max-width:768px){.hd-grid{grid-template-columns:1fr}}
        .hd-mf{margin-bottom:4px}
        .hd-ml{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px}
        .hd-mi{width:100%;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:12px;color:#1e293b;outline:none;transition:all .2s}
        .hd-mi:focus{border-color:#0E898F;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,0.1)}
        .hd-mi::placeholder{color:#cbd5e1}
        .hd-radio-group{display:flex;gap:16px;margin-top:6px}
        .hd-radio-label{display:flex;align-items:center;gap:8px;font-size:11px;color:#475569;cursor:pointer}
        .hd-radio-label input{accent-color:#0E898F;width:15px;height:15px}
        .hd-btn-primary{padding:10px 24px;border-radius:10px;border:none;background:#0E898F;color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .15s;box-shadow:0 4px 12px rgba(59,130,246,0.25)}
        .hd-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .hd-btn-sec{padding:10px 20px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
        .hd-btn-sec:hover{background:#f8fafc;color:#1e293b}
        .hd-upload-box{border:2px dashed #e2e8f0;border-radius:14px;padding:32px;text-align:center;cursor:pointer;transition:all .2s}
        .hd-upload-box:hover{border-color:#0E898F;background:#E6F4F4}
        .hd-upload-icon{width:48px;height:48px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#64748b}
        .hd-upload-text{font-size:11px;font-weight:600;color:#475569}
        .hd-upload-sub{font-size:10px;color:#94a3b8;margin-top:4px}
        .hd-msg-err{padding:12px 16px;background:#fff5f5;border:1px solid #fee2e2;border-radius:12px;color:#ef4444;font-size:12px;font-weight:500;margin-bottom:20px;display:flex;align-items:center;gap:10px}
        .hd-spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite}
        @keyframes sp{to{transform:rotate(360deg)}}
      `}</style>

      <div className="hd">
        <aside className="hd-sb">
          <div className="hd-sb-logo" onClick={() => router.push("/hospitaladmin/dashboard")}>
            <div className="hd-logo-ic"><Stethoscope size={18} color="white"/></div>
            <div><div className="hd-logo-tx">MediCare+</div><div className="hd-logo-sub">Hospital Admin</div></div>
          </div>
          <nav className="hd-nav">
            <div className="hd-nav-sec">Form Sections</div>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`hd-nb${activeSection === section.id ? " on" : ""}`}
              >
                <span style={{color: activeSection === section.id ? "#0A6B70" : "#94a3b8", display: "flex"}}>{section.icon}</span>
                {section.label}
                {activeSection === section.id && <div className="hd-nb-dot" />}
              </button>
            ))}
          </nav>
        </aside>

        <main className="hd-main">
          <header className="hd-topbar">
            <div className="hd-topbar-left">
              <button onClick={() => router.back()} className="hd-btn-sec" style={{padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <ChevronLeft size={18} />
              </button>
              <div>
                <div className="hd-pg-title">Add Inventory Item</div>
                <div className="hd-pg-sub">Create a new product in the master database</div>
              </div>
            </div>
            <div style={{display: "flex", gap: "12px"}}>
              <button onClick={() => router.back()} className="hd-btn-sec">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="hd-btn-primary">
                {saving ? <span className="hd-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </header>

          <div className="hd-body">
            {error && <div className="hd-msg-err"><AlertTriangle size={18} /> {error}</div>}

            <form onSubmit={handleSubmit}>
              {/* 1. Basic Information */}
              <div className="hd-card" id="basic">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">1</div>
                  <div className="hd-sec-title">Basic Information</div>
                </div>
                <div className="hd-grid">
                  <div style={{gridColumn: "span 2"}}>
                    <label className="hd-ml">Item Name*</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="e.g., Paracetamol 500mg" className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Generic Name</label>
                    <input type="text" name="genericName" value={form.genericName} onChange={handleChange} placeholder="e.g., Paracetamol" className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Brand Name</label>
                    <input type="text" name="brandName" value={form.brandName} onChange={handleChange} placeholder="e.g., Crocin" className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Category*</label>
                    <select name="category" value={form.category} onChange={handleChange} required className="hd-mi">
                      {["Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="hd-ml">Sub Category</label>
                    <input type="text" name="subCategory" value={form.subCategory} onChange={handleChange} placeholder="e.g., Tablet / Injection / Syrup" className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Item Type</label>
                    <div className="hd-radio-group">
                      {["Consumable", "Non-Consumable"].map(type => (
                        <label key={type} className="hd-radio-label">
                          <input type="radio" name="itemType" value={type} checked={form.itemType === type} onChange={handleChange} />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Unit & Packaging */}
              <div className="hd-card" id="unit">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">2</div>
                  <div className="hd-sec-title">Unit & Packaging</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">Unit*</label>
                    <input type="text" name="unit" value={form.unit} onChange={handleChange} required placeholder="e.g., pcs, box, bottle" className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Pack Size</label>
                    <input type="text" name="packSize" value={form.packSize} onChange={handleChange} placeholder="e.g., 10 tablets per strip" className="hd-mi" />
                  </div>
                  <div style={{gridColumn: "span 2"}}>
                    <label className="hd-ml">Unit Conversion (Optional)</label>
                    <input type="text" name="conversion" value={form.conversion} onChange={handleChange} placeholder="1 Box = 10 strips" className="hd-mi" />
                  </div>
                </div>
              </div>

              {/* 3. Identification */}
              <div className="hd-card" id="id">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">3</div>
                  <div className="hd-sec-title">Identification</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">SKU Code (Optional)</label>
                    <input type="text" name="sku" value={form.sku} onChange={handleChange} placeholder="Auto / Manual" className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Barcode / QR Code</label>
                    <input type="text" name="barcode" value={form.barcode} onChange={handleChange} placeholder="Scan / Generate" className="hd-mi" />
                  </div>
                  <div style={{gridColumn: "span 2"}}>
                    <label className="hd-ml">HSN Code / GST Code</label>
                    <input type="text" name="hsnCode" value={form.hsnCode} onChange={handleChange} placeholder="For billing compliance" className="hd-mi" />
                  </div>
                </div>
              </div>

              {/* 4. Stock & Alerts */}
              <div className="hd-card" id="stock">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">4</div>
                  <div className="hd-sec-title">Stock & Alerts</div>
                </div>
                <div className="hd-grid" style={{gridTemplateColumns: "repeat(3, 1fr)"}}>
                  <div>
                    <label className="hd-ml">Opening Stock</label>
                    <input type="number" name="openingStock" value={form.openingStock} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Min Stock Alert*</label>
                    <input type="number" name="minStock" value={form.minStock} onChange={handleChange} required className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Max Stock Level</label>
                    <input type="number" name="maxStock" value={form.maxStock} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Reorder Level</label>
                    <input type="number" name="reorderLevel" value={form.reorderLevel} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Reorder Quantity</label>
                    <input type="number" name="reorderQty" value={form.reorderQty} onChange={handleChange} className="hd-mi" />
                  </div>
                </div>
              </div>

              {/* 5. Purchase Details */}
              <div className="hd-card" id="purchase">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">5</div>
                  <div className="hd-sec-title">Purchase Details</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">Purchase Price (CP)</label>
                    <div style={{position: 'relative'}}>
                      <span style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px'}}>₹</span>
                      <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} style={{paddingLeft: '28px'}} className="hd-mi" />
                    </div>
                  </div>
                  <div>
                    <label className="hd-ml">Supplier Name</label>
                    <input type="text" name="supplierName" value={form.supplierName} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Preferred Vendor</label>
                    <input type="text" name="preferredVendor" value={form.preferredVendor} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Purchase Unit</label>
                    <input type="text" name="purchaseUnit" value={form.purchaseUnit} onChange={handleChange} placeholder="if different from selling unit" className="hd-mi" />
                  </div>
                </div>
              </div>

              {/* 6. Pricing & Billing */}
              <div className="hd-card" id="pricing">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">6</div>
                  <div className="hd-sec-title">Pricing & Billing</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">MRP</label>
                    <div style={{position: 'relative'}}>
                      <span style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px'}}>₹</span>
                      <input type="number" name="mrp" value={form.mrp} onChange={handleChange} style={{paddingLeft: '28px'}} className="hd-mi" />
                    </div>
                  </div>
                  <div>
                    <label className="hd-ml">Selling Price</label>
                    <div style={{position: 'relative'}}>
                      <span style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px'}}>₹</span>
                      <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} style={{paddingLeft: '28px'}} className="hd-mi" />
                    </div>
                  </div>
                  <div>
                    <label className="hd-ml">Discount (%)</label>
                    <input type="number" name="discount" value={form.discount} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">GST (%)</label>
                    <input type="number" name="gst" value={form.gst} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div style={{gridColumn: "span 2"}}>
                    <label className="hd-ml">Billing Type</label>
                    <div className="hd-radio-group">
                      {["Tax Inclusive", "Tax Exclusive"].map(type => (
                        <label key={type} className="hd-radio-label">
                          <input type="radio" name="billingType" value={type} checked={form.billingType === type} onChange={handleChange} />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Batch & Expiry */}
              <div className="hd-card" id="batch">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">7</div>
                  <div className="hd-sec-title">Batch & Expiry</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">Batch Number</label>
                    <input type="text" name="batchNumber" value={form.batchNumber} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Manufacturing Date</label>
                    <input type="date" name="mfgDate" value={form.mfgDate} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Expiry Date</label>
                    <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div>
                    <label className="hd-ml">Expiry Alert (Days Before)</label>
                    <input type="number" name="expiryAlertDays" value={form.expiryAlertDays} onChange={handleChange} className="hd-mi" />
                  </div>
                </div>
              </div>

              {/* 8. Storage & Location */}
              <div className="hd-card" id="storage">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">8</div>
                  <div className="hd-sec-title">Storage & Location</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">Storage Location</label>
                    <select name="location" value={form.location} onChange={handleChange} className="hd-mi">
                      {["Pharmacy Store", "OT Store", "Ward Stock"].map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="hd-ml">Rack / Shelf Number</label>
                    <input type="text" name="rackNumber" value={form.rackNumber} onChange={handleChange} className="hd-mi" />
                  </div>
                  <div style={{gridColumn: "span 2"}}>
                    <label className="hd-ml">Temperature Requirement</label>
                    <div className="hd-radio-group">
                      {["Room Temp", "Refrigerated"].map(temp => (
                        <label key={temp} className="hd-radio-label">
                          <input type="radio" name="tempRequirement" value={temp} checked={form.tempRequirement === temp} onChange={handleChange} />
                          {temp}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. Compliance & Safety */}
              <div className="hd-card" id="compliance">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">9</div>
                  <div className="hd-sec-title">Compliance & Safety</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">Drug Schedule Type</label>
                    <select name="drugSchedule" value={form.drugSchedule} onChange={handleChange} className="hd-mi">
                      {["Schedule H", "Schedule X", "OTC"].map(sch => (
                        <option key={sch} value={sch}>{sch}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="hd-ml">Requires Prescription</label>
                    <div className="hd-radio-group">
                      {["Yes", "No"].map(opt => (
                        <label key={opt} className="hd-radio-label">
                          <input type="radio" name="requiresRx" value={opt} checked={form.requiresRx === opt} onChange={handleChange} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 10. Status & Control */}
              <div className="hd-card" id="status">
                <div className="hd-sec-head">
                  <div className="hd-sec-num">10</div>
                  <div className="hd-sec-title">Status & Control</div>
                </div>
                <div className="hd-grid">
                  <div>
                    <label className="hd-ml">Item Status</label>
                    <div className="hd-radio-group">
                      {["Active", "Inactive"].map(st => (
                        <label key={st} className="hd-radio-label">
                          <input type="radio" name="status" value={st} checked={form.status === st} onChange={handleChange} />
                          {st}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="hd-ml">Is Returnable</label>
                    <div className="hd-radio-group">
                      {["Yes", "No"].map(opt => (
                        <label key={opt} className="hd-radio-label">
                          <input type="radio" name="isReturnable" value={opt} checked={form.isReturnable === opt} onChange={handleChange} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="hd-ml">Is Critical Item</label>
                    <div className="hd-radio-group">
                      {["Yes", "No"].map(opt => (
                        <label key={opt} className="hd-radio-label">
                          <input type="radio" name="isCritical" value={opt} checked={form.isCritical === opt} onChange={handleChange} />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 11. Additional Info */}
              <div className="hd-card" id="extra" style={{marginBottom: '80px'}}>
                <div className="hd-sec-head">
                  <div className="hd-sec-num">11</div>
                  <div className="hd-sec-title">Additional Info</div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                  <div>
                    <label className="hd-ml">Description / Notes</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="hd-mi" style={{resize: 'none'}} />
                  </div>
                  <div>
                    <label className="hd-ml">Upload Image (Optional)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`hd-upload-box ${uploading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
                          <p className="text-sm font-semibold text-slate-700">Uploading...</p>
                        </div>
                      ) : form.image ? (
                        <div className="relative group">
                          <img 
                            src={form.image} 
                            alt="Preview" 
                            className="h-32 w-32 object-cover rounded-xl mx-auto border border-slate-200" 
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-xs font-bold">Change Image</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="hd-upload-icon"><Upload size={24} /></div>
                          <div className="hd-upload-text">Click to upload or drag and drop</div>
                          <div className="hd-upload-sub">PNG, JPG or WEBP (max. 5MB)</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="hd-ml">Document Attachments</label>
                    <button type="button" className="hd-btn-sec" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <Plus size={16} /> Add Documents
                    </button>
                  </div>
                </div>
              </div>

              <div style={{position: 'fixed', bottom: '0', left: '240px', right: '0', background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', zIndex: '30'}}>
                 <button type="button" onClick={() => router.back()} className="hd-btn-sec">Cancel</button>
                 <button type="submit" disabled={saving} className="hd-btn-primary" style={{padding: '10px 40px'}}>
                    {saving ? <span className="hd-spin" /> : "Save Item & Finish"}
                 </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
