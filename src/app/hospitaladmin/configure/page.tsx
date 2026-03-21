"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Settings, Building2, Stethoscope, Users, BedDouble, CreditCard, Package,
  Plus, Pencil, Trash2, Search, X, ChevronRight, Check, AlertTriangle,
  LogOut, Bell, HelpCircle, FlaskConical, LayoutDashboard, Loader2, Layers
} from "lucide-react";
import DepartmentPanel from "@/components/DepartmentPanel";
import DoctorPanel from "@/components/DoctorPanel";
import LeaveModal from "@/components/LeaveModal";
import StaffPanel from "@/components/StaffPanel";
import WardBedPanel from "@/components/WardBedPanel";
import SubDepartmentPanel from "@/components/SubDepartmentPanel";

type Tab = "settings"|"departments"|"subdepts"|"clinical"|"doctors"|"staff"|"wards"|"billing"|"inventory";

const TABS:{id:Tab;label:string;icon:any}[] = [
  {id:"settings",label:"General Settings",icon:Settings},
  {id:"departments",label:"Departments",icon:Building2},
  {id:"subdepts",label:"Sub-Depts / Procedures",icon:Layers},
  {id:"clinical",label:"Clinical Units",icon:FlaskConical},
  {id:"doctors",label:"Doctors Setup",icon:Stethoscope},
  {id:"staff",label:"Staff Setup",icon:Users},
  {id:"wards",label:"Ward & Bed Setup",icon:BedDouble},
  {id:"billing",label:"Billing & Charges",icon:CreditCard},
  {id:"inventory",label:"Inventory Setup",icon:Package},
];

const api = async (url:string,method="GET",body?:any) => {
  const opts:any = {method,credentials:"include",headers:{"Content-Type":"application/json"}};
  if(body) opts.body = JSON.stringify(body);
  const r = await fetch(url,opts);
  return r.json();
};

/* ─── MODAL ─── */
function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}){
  if(!open) return null;
  return(<div className="cfg-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="cfg-modal">
      <div className="cfg-modal-head"><span className="cfg-modal-title">{title}</span><button onClick={onClose} className="cfg-icon-btn"><X size={16}/></button></div>
      {children}
    </div>
  </div>);
}

/* ─── SETTINGS PANEL ─── */
function SettingsPanel({hospitalId}:{hospitalId:string}){
  const [f,setF]=useState({hospitalName:"",address:"",phone:"",email:"",website:"",timezone:"Asia/Kolkata",currency:"INR",gstNumber:"",registrationNo:""});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState("");
  const [progress,setProgress]=useState<any>(null);

  useEffect(()=>{
    api("/api/config/settings").then(d=>{
      if(d.data?.settings){const s=d.data.settings;setF({hospitalName:s.hospitalName||"",address:s.address||"",phone:s.phone||"",email:s.email||"",website:s.website||"",timezone:s.timezone||"Asia/Kolkata",currency:s.currency||"INR",gstNumber:s.gstNumber||"",registrationNo:s.registrationNo||""});}
      if(d.data?.progress) setProgress(d.data.progress);
    });
  },[]);

  const save=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setMsg("");
    const d=await api("/api/config/settings","POST",f);
    setMsg(d.success?"✓ Settings saved!":d.message||"Error");setSaving(false);
    if(d.success){const r=await api("/api/config/settings");if(r.data?.progress)setProgress(r.data.progress);}
  };

  return(<div>
    {progress&&!progress.isComplete&&(
      <div className="cfg-onboard">
        <div className="cfg-onboard-head"><AlertTriangle size={18} color="#f59e0b"/><div><div style={{fontWeight:700,color:"#1e293b"}}>Complete Your Hospital Setup</div><div style={{fontSize:12,color:"#64748b"}}>Configure all modules to unlock all features</div></div></div>
        <div className="cfg-progress-bar"><div className="cfg-progress-fill" style={{width:`${progress.percentage}%`}}/></div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>{progress.percentage}% complete — {progress.completed}/{progress.total} steps</div>
        <div className="cfg-steps">{progress.steps.map((s:any,i:number)=>(<div key={i} className={`cfg-step${s.done?" done":""}`}>{s.done?<Check size={13}/>:<span className="cfg-step-num">{i+1}</span>}{s.name}</div>))}</div>
      </div>
    )}
    <form onSubmit={save} className="cfg-form">
      {[{k:"hospitalName",l:"Hospital Name *",ph:"City General Hospital"},{k:"email",l:"Email",ph:"info@hospital.com"},{k:"phone",l:"Phone",ph:"+91 98765 43210"},{k:"address",l:"Address",ph:"123 Medical Lane"},{k:"website",l:"Website",ph:"https://hospital.com"},{k:"gstNumber",l:"GST Number",ph:"22AAAAA0000A1Z5"},{k:"registrationNo",l:"Registration No",ph:"HOSP/2026/001"},{k:"timezone",l:"Timezone",ph:"Asia/Kolkata"},{k:"currency",l:"Currency",ph:"INR"}].map(x=>(
        <div key={x.k} className="cfg-field"><label className="cfg-lbl">{x.l}</label><input className="cfg-input" placeholder={x.ph} value={(f as any)[x.k]} onChange={e=>setF(p=>({...p,[x.k]:e.target.value}))} required={x.k==="hospitalName"}/></div>
      ))}
      <div className="cfg-field" style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:12}}>
        <button type="submit" className="cfg-btn-primary" disabled={saving}>{saving?<Loader2 size={14} className="cfg-spin"/>:null}Save Settings</button>
        {msg&&<span style={{fontSize:13,color:msg.startsWith("✓")?"#10b981":"#ef4444",fontWeight:600}}>{msg}</span>}
      </div>
    </form>
  </div>);
}

/* ─── GENERIC CRUD PANEL ─── */
function CrudPanel({endpoint,columns,formFields,entityName,searchable=true}:{
  endpoint:string;columns:{key:string;label:string;render?:(v:any,row:any)=>React.ReactNode}[];
  formFields:{key:string;label:string;type?:string;options?:{v:string;l:string}[];required?:boolean}[];
  entityName:string;searchable?:boolean;
}){
  const [data,setData]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [editItem,setEditItem]=useState<any>(null);
  const [form,setForm]=useState<any>({});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    const d=await api(`${endpoint}${search?`?search=${search}`:""}`);
    if(d.success) setData(d.data||[]);
    setLoading(false);
  },[endpoint,search]);

  useEffect(()=>{load();},[load]);

  const openAdd=()=>{setEditItem(null);setForm({});setMsg("");setModal(true);};
  const openEdit=(item:any)=>{setEditItem(item);setForm({...item});setMsg("");setModal(true);};

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true);setMsg("");
    const method=editItem?"PUT":"POST";
    const body=editItem?{id:editItem.id,...form}:form;
    const d=await api(endpoint,method,body);
    if(d.success){setModal(false);load();}else setMsg(d.message||"Error");
    setSaving(false);
  };

  const handleDelete=async(id:string)=>{
    if(!confirm(`Delete this ${entityName}?`))return;
    await api(`${endpoint}?id=${id}`,"DELETE");
    load();
  };

  return(<div>
    <div className="cfg-toolbar">
      {searchable&&<div className="cfg-search-wrap"><Search size={14} color="#94a3b8"/><input className="cfg-search-input" placeholder={`Search ${entityName}s...`} value={search} onChange={e=>setSearch(e.target.value)}/></div>}
      <button className="cfg-btn-primary" onClick={openAdd}><Plus size={14}/>Add {entityName}</button>
    </div>

    {loading?<div className="cfg-loading"><Loader2 size={20} className="cfg-spin"/>Loading...</div>:
    data.length===0?<div className="cfg-empty">No {entityName.toLowerCase()}s found. Click "+ Add {entityName}" to create one.</div>:
    <div className="cfg-tbl-wrap"><table className="cfg-tbl">
      <thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}<th>Actions</th></tr></thead>
      <tbody>{data.map((row,i)=><tr key={row.id||i}>
        {columns.map(c=><td key={c.key}>{c.render?c.render((row as any)[c.key],row):(row as any)[c.key]??"-"}</td>)}
        <td><div style={{display:"flex",gap:6}}>
          <button className="cfg-icon-btn cfg-edit" onClick={()=>openEdit(row)}><Pencil size={13}/></button>
          <button className="cfg-icon-btn cfg-del" onClick={()=>handleDelete(row.id)}><Trash2 size={13}/></button>
        </div></td>
      </tr>)}</tbody>
    </table></div>}

    <Modal open={modal} onClose={()=>setModal(false)} title={`${editItem?"Edit":"Add"} ${entityName}`}>
      <form onSubmit={handleSubmit} className="cfg-modal-form">
        {formFields.map(f=>(
          <div key={f.key} className="cfg-field">
            <label className="cfg-lbl">{f.label}</label>
            {f.options?<select className="cfg-input" value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))}><option value="">Select...</option>{f.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
            :<input className="cfg-input" type={f.type||"text"} placeholder={f.label} value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:f.type==="number"?Number(e.target.value):e.target.value}))} required={f.required}/>}
          </div>
        ))}
        {msg&&<div style={{gridColumn:"1/-1",fontSize:13,color:"#ef4444",fontWeight:600}}>{msg}</div>}
        <div style={{gridColumn:"1/-1",display:"flex",gap:10,marginTop:4}}>
          <button type="button" className="cfg-btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
          <button type="submit" className="cfg-btn-primary" disabled={saving}>{saving?<Loader2 size={14} className="cfg-spin"/>:null}{editItem?"Update":"Create"}</button>
        </div>
      </form>
    </Modal>
  </div>);
}

/* ─── MAIN PAGE ─── */
export default function ConfigurePage(){
  const router=useRouter();
  const searchParams=useSearchParams();
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const initialTab=(searchParams.get("tab") as Tab)||"settings";
  const [tab,setTabState]=useState<Tab>(TABS.some(t=>t.id===initialTab)?initialTab:"settings");
  const setTab=(t:Tab)=>{setTabState(t);router.replace(`?tab=${t}`,{scroll:false});};

  // Doctor modals state (must be before any conditional returns)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  useEffect(()=>{
    api("/api/auth/me").then(d=>{
      if(!d.success){router.push("/login");return;}
      if(d.data.role==="DOCTOR"){router.push("/doctor/dashboard");return;}
      if(d.data.role==="STAFF"||d.data.role==="RECEPTIONIST"){router.push("/staff/dashboard");return;}
      if(d.data.role==="SUB_DEPT_HEAD"){router.push("/subdept/dashboard");return;}
      if(d.data.role!=="HOSPITAL_ADMIN"){router.push("/login");return;}
      setUser(d.data);setLoading(false);
    }).catch(()=>router.push("/login"));
  },[router]);

  const logout=async()=>{await api("/api/auth/logout","POST");router.push("/login");};
  const initials=(n:string)=>n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();

  const openLeaveModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setLeaveModalOpen(true);
  };

  if(loading) return <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",gap:12,color:"#64748b"}}><Loader2 size={24} className="cfg-spin"/>Loading...</div>;

  const clinicalColumns=[{key:"name",label:"Name"},{key:"type",label:"Type",render:(v:string)=><span className="cfg-badge blue">{v}</span>},{key:"department",label:"Department",render:(v:any)=>v?.name||"—"},{key:"isActive",label:"Status",render:(v:boolean)=><span className={`cfg-badge ${v?"green":"red"}`}>{v?"Active":"Inactive"}</span>}];
  const clinicalFields=[{key:"name",label:"Unit Name",required:true},{key:"type",label:"Type",options:[{v:"PHARMACY",l:"Pharmacy"},{v:"PATHOLOGY",l:"Pathology"},{v:"RADIOLOGY",l:"Radiology"},{v:"PROCEDURE",l:"Procedure"},{v:"LABORATORY",l:"Laboratory"},{v:"OTHER",l:"Other"}],required:true}];

  const staffColumns=[{key:"name",label:"Name"},{key:"role",label:"Role",render:(v:string)=><span className="cfg-badge blue">{v?.replace("_"," ")}</span>},{key:"department",label:"Dept",render:(v:any)=>v?.name||"—"},{key:"salary",label:"Salary",render:(v:number)=>`₹${v||0}`},{key:"isActive",label:"Status",render:(v:boolean)=><span className={`cfg-badge ${v?"green":"red"}`}>{v?"Active":"Inactive"}</span>}];
  const staffFields=[{key:"name",label:"Staff Name",required:true},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"role",label:"Role",options:[{v:"NURSE",l:"Nurse"},{v:"TECHNICIAN",l:"Technician"},{v:"PHARMACIST",l:"Pharmacist"},{v:"RECEPTIONIST",l:"Receptionist"},{v:"LAB_TECHNICIAN",l:"Lab Technician"},{v:"ACCOUNTANT",l:"Accountant"},{v:"SUPPORT",l:"Support"},{v:"OTHER",l:"Other"}],required:true},{key:"salary",label:"Salary",type:"number"}];

  const wardColumns=[{key:"name",label:"Ward Name"},{key:"type",label:"Type",render:(v:string)=><span className="cfg-badge blue">{v?.replace("_"," ")}</span>},{key:"floor",label:"Floor",render:(v:string)=>v||"—"},{key:"capacity",label:"Capacity"},{key:"_count",label:"Beds",render:(v:any)=>v?.beds??0}];
  const wardFields=[{key:"name",label:"Ward Name",required:true},{key:"type",label:"Type",options:[{v:"GENERAL",l:"General"},{v:"PRIVATE",l:"Private"},{v:"SEMI_PRIVATE",l:"Semi-Private"},{v:"ICU",l:"ICU"},{v:"NICU",l:"NICU"},{v:"EMERGENCY",l:"Emergency"},{v:"MATERNITY",l:"Maternity"},{v:"ISOLATION",l:"Isolation"}],required:true},{key:"floor",label:"Floor"},{key:"capacity",label:"Capacity",type:"number"}];

  const billingColumns=[{key:"name",label:"Charge Name"},{key:"type",label:"Type",render:(v:string)=><span className="cfg-badge blue">{v?.replace("_"," ")}</span>},{key:"amount",label:"Amount",render:(v:number)=>`₹${v}`},{key:"department",label:"Dept",render:(v:any)=>v?.name||"All"},{key:"isActive",label:"Status",render:(v:boolean)=><span className={`cfg-badge ${v?"green":"red"}`}>{v?"Active":"Inactive"}</span>}];
  const billingFields=[{key:"name",label:"Charge Name",required:true},{key:"type",label:"Type",options:[{v:"CONSULTATION",l:"Consultation"},{v:"PROCEDURE",l:"Procedure"},{v:"LAB_TEST",l:"Lab Test"},{v:"RADIOLOGY",l:"Radiology"},{v:"PHARMACY",l:"Pharmacy"},{v:"ROOM_CHARGE",l:"Room Charge"},{v:"SURGERY",l:"Surgery"},{v:"OTHER",l:"Other"}],required:true},{key:"amount",label:"Amount (₹)",type:"number",required:true},{key:"description",label:"Description"}];

  const invColumns=[{key:"name",label:"Item Name"},{key:"category",label:"Category"},{key:"stock",label:"Stock",render:(v:number,row:any)=><span style={{color:v<=row.minStock?"#ef4444":"#10b981",fontWeight:700}}>{v}</span>},{key:"minStock",label:"Min Stock"},{key:"unit",label:"Unit"},{key:"pricePerUnit",label:"Price",render:(v:number)=>`₹${v}`},{key:"supplier",label:"Supplier",render:(v:string)=>v||"—"}];
  const invFields=[{key:"name",label:"Item Name",required:true},{key:"category",label:"Category",required:true},{key:"stock",label:"Current Stock",type:"number"},{key:"minStock",label:"Min Stock Alert",type:"number"},{key:"unit",label:"Unit (pcs/ml/kg)"},{key:"pricePerUnit",label:"Price Per Unit",type:"number"},{key:"supplier",label:"Supplier"}];

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
      input,select,button,textarea{font-family:'Inter',sans-serif}
      @keyframes spin{to{transform:rotate(360deg)}}
      .cfg-spin{animation:spin .7s linear infinite}
      .cfg-wrap{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0f4f8}
      .cfg-sb{width:240px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,.04)}
      .cfg-sb-logo{padding:20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px}
      .cfg-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 12px rgba(59,130,246,.3)}
      .cfg-sb-nav{flex:1;padding:12px;overflow-y:auto}
      .cfg-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
      .cfg-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;text-align:left;position:relative;margin-bottom:2px}
      .cfg-nb:hover{background:#f8fafc;color:#334155}
      .cfg-nb.on{background:#eff6ff;color:#2563eb;font-weight:600}
      .cfg-nb.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:#3b82f6;border-radius:4px}
      .cfg-sb-foot{padding:14px 16px 18px;border-top:1px solid #f1f5f9}
      .cfg-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
      .cfg-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:10px}
      .cfg-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
      .cfg-main{margin-left:240px;flex:1;min-height:100vh}
      .cfg-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,.04)}
      .cfg-topbar-title{font-size:18px;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:10px}
      .cfg-topbar-right{display:flex;align-items:center;gap:12px}
      .cfg-body{padding:24px}
      .cfg-onboard{background:#fff;border:1px solid #fde68a;border-radius:16px;padding:22px;margin-bottom:22px;box-shadow:0 1px 4px rgba(234,179,8,.1)}
      .cfg-onboard-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}
      .cfg-progress-bar{height:8px;background:#f1f5f9;border-radius:100px;overflow:hidden;margin-bottom:8px}
      .cfg-progress-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#10b981);border-radius:100px;transition:width .5s}
      .cfg-steps{display:flex;flex-wrap:wrap;gap:8px}
      .cfg-step{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b}
      .cfg-step.done{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}
      .cfg-step-num{width:18px;height:18px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#94a3b8}
      .cfg-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .cfg-field{display:flex;flex-direction:column;gap:5px}
      .cfg-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
      .cfg-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
      .cfg-input:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.25)}
      .cfg-input::placeholder{color:#94a3b8}
      .cfg-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.25);transition:all .15s;white-space:nowrap}
      .cfg-btn-primary:hover{background:#2563eb;transform:translateY(-1px)}
      .cfg-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
      .cfg-btn-ghost{padding:10px 20px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer}
      .cfg-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
      .cfg-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
      .cfg-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
      .cfg-search-input::placeholder{color:#94a3b8}
      .cfg-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
      .cfg-tbl{width:100%;border-collapse:collapse}
      .cfg-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
      .cfg-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
      .cfg-tbl tr:last-child td{border-bottom:none}
      .cfg-tbl tbody tr:hover td{background:#fafbfc}
      .cfg-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
      .cfg-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
      .cfg-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
      .cfg-badge.blue{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
      .cfg-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
      .cfg-edit{background:#eff6ff;color:#3b82f6}.cfg-edit:hover{background:#dbeafe}
      .cfg-del{background:#fff5f5;color:#ef4444}.cfg-del:hover{background:#fee2e2}
      .cfg-overlay{position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
      .cfg-modal{background:#fff;border-radius:18px;padding:24px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto}
      .cfg-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
      .cfg-modal-title{font-size:17px;font-weight:800;color:#1e293b}
      .cfg-modal-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .cfg-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
      .cfg-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
    `}</style>

    <div className="cfg-wrap">
      <aside className="cfg-sb">
        <div className="cfg-sb-logo">
          <div className="cfg-logo-ic"><Stethoscope size={18}/></div>
          <div><div style={{fontSize:15,fontWeight:800,color:"#1e293b"}}>MediCare+</div><div style={{fontSize:10,color:"#94a3b8"}}>Hospital Setup</div></div>
        </div>
        <nav className="cfg-sb-nav">
          <div className="cfg-nav-sec">Configuration</div>
          {TABS.map(t=>{const Icon=t.icon;return(
            <button key={t.id} className={`cfg-nb${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
              <Icon size={15} style={{flexShrink:0}}/>{t.label}
            </button>
          );})}
          <div className="cfg-nav-sec">Navigation</div>
          <button className="cfg-nb" onClick={()=>router.push("/hospitaladmin/dashboard")}><LayoutDashboard size={15}/>Back to Dashboard</button>
          <button className="cfg-nb"><HelpCircle size={15}/>Support</button>
        </nav>
        <div className="cfg-sb-foot">
          <div className="cfg-user">
            <div className="cfg-av">{user?.name?initials(user.name):"HA"}</div>
            <div style={{overflow:"hidden"}}><div style={{fontSize:12,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name||"Admin"}</div><div style={{fontSize:10,color:"#3b82f6",fontWeight:500}}>Hospital Admin</div></div>
          </div>
          <button className="cfg-logout" onClick={logout}><LogOut size={13}/>Log Out</button>
        </div>
      </aside>

      <main className="cfg-main">
        <header className="cfg-topbar">
          <div className="cfg-topbar-title"><Settings size={20} color="#3b82f6"/>Configure Hospital</div>
          <div className="cfg-topbar-right">
            <div style={{width:36,height:36,borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}><Bell size={16} color="#64748b"/><span style={{position:"absolute",top:7,right:7,width:7,height:7,borderRadius:"50%",background:"#ef4444",border:"1.5px solid #fff"}}/></div>
            <div className="cfg-av">{user?.name?initials(user.name):"HA"}</div>
          </div>
        </header>

        <div className="cfg-body">
          <div style={{fontSize:22,fontWeight:800,color:"#1e293b",marginBottom:4}}>{TABS.find(t=>t.id===tab)?.label}</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Manage your hospital {tab} configuration</div>

          {tab==="settings"&&<SettingsPanel hospitalId={user?.hospitalId||""}/>}
          {tab==="departments"&&<DepartmentPanel/>}
          {tab==="subdepts"&&<SubDepartmentPanel/>}
          {tab==="clinical"&&<CrudPanel endpoint="/api/config/departments?sub=true" columns={clinicalColumns} formFields={clinicalFields} entityName="Clinical Unit"/>}
          {tab==="doctors"&&<DoctorPanel onOpenLeave={openLeaveModal}/>}
          
          {/* Doctor Modals */}
          <LeaveModal
            open={leaveModalOpen}
            onClose={() => setLeaveModalOpen(false)}
            doctor={selectedDoctor}
          />
          {tab==="staff"&&<StaffPanel/>}
          {tab==="wards"&&<WardBedPanel/>}
          {tab==="billing"&&<CrudPanel endpoint="/api/config/pricing" columns={billingColumns} formFields={billingFields} entityName="Charge"/>}
          {tab==="inventory"&&<CrudPanel endpoint="/api/config/inventory" columns={invColumns} formFields={invFields} entityName="Inventory Item"/>}
        </div>
      </main>
    </div>
  </>);
}
