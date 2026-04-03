"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, User, Mail, Phone, FileText,
  CheckCircle2, Loader2, ChevronDown, ChevronLeft, ChevronRight,
  Stethoscope, Check,
  ClipboardList, UserCircle, ArrowRight, ArrowLeft, Edit3,
} from "lucide-react";
import styles from "./AppointmentModal.module.css";

interface Doctor { id: string; name: string; specialization?: string; departmentId?: string; department?: { name: string }; consultationFee?: number; }
interface Department { id: string; name: string; code: string; type?: string; }

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const fmt12 = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

/* ─── Static Data ─── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const APPOINTMENT_DEPARTMENT_TYPES = ["CLINICAL", "DIAGNOSTIC", "PROCEDURE", "SUPPORT"];

const steps = [
  { num: 1, label: "Your Info", icon: <UserCircle size={18} /> },
  { num: 2, label: "Appointment", icon: <ClipboardList size={18} /> },
  { num: 3, label: "Confirm", icon: <CheckCircle2 size={18} /> },
];

/* ─── Portal Dropdown ─── */
interface PortalDropdownProps {
  anchorEl: HTMLDivElement | null;
  isOpen: boolean;
  children: React.ReactNode;
}

function PortalDropdown({ anchorEl, isOpen, children }: PortalDropdownProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen && anchorEl) {
      setRect(anchorEl.getBoundingClientRect());
    }
  }, [isOpen, anchorEl]);

  if (!isOpen || !rect) return null;

  // Decide whether to open upward or downward based on available space
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUpward = spaceBelow < 300 && spaceAbove > spaceBelow;

  const style: React.CSSProperties = {
    position: "fixed",
    left: rect.left,
    width: rect.width,
    zIndex: 999999,
    ...(openUpward
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }),
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={style}
          className={styles.dropdownPanel}
          initial={{ opacity: 0, y: openUpward ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: openUpward ? 8 : -8 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ─── Component ─── */
export default function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [departmentsData, setDepartmentsData] = useState<Department[]>([]);
  const [doctorsData, setDoctorsData] = useState<Doctor[]>([]);
  const [slotsData, setSlotsData] = useState<string[]>([]);
  const [bookedSlotsData, setBookedSlotsData] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    // Step 1
    name: "",
    phone: "",
    email: "",
    // Step 2
    departmentId: "",
    doctorId: "",
    appointmentDate: "",
    timeSlot: "",
    notes: "",
    // Hidden
    consultationFee: "",
    type: "OPD",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setForm({
          name: "", phone: "", email: "",
          departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "",
          notes: "", consultationFee: "", type: "OPD",
        });
        setErrors({});
        setOpenDropdown(null);
        setIsSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  // Fetch Departments
  useEffect(() => {
    if (isOpen) {
      api("/api/config/departments?simple=true").then(d => {
        const rows: Department[] = d.data || [];
        setDepartmentsData(rows.filter(dep => dep.type && APPOINTMENT_DEPARTMENT_TYPES.includes(dep.type)));
      });
    }
  }, [isOpen]);

  // Fetch Doctors based on Department
  useEffect(() => {
    if (isOpen) {
      if (!form.departmentId) {
        setDoctorsData([]);
        return;
      }
      api(`/api/config/doctors?simple=true&departmentId=${form.departmentId}`).then(d => setDoctorsData(d.data || []));
    }
  }, [isOpen, form.departmentId]);

  // Fetch Slots based on Doctor and Date
  useEffect(() => {
    if (form.doctorId && form.appointmentDate) {
      setLoadingSlots(true);
      api(`/api/appointments/slots?doctorId=${form.doctorId}&date=${form.appointmentDate}`)
        .then(d => {
          setSlotsData(d.data?.slots || []);
          setBookedSlotsData(d.data?.bookedSlots || []);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setSlotsData([]);
      setBookedSlotsData([]);
    }
  }, [form.doctorId, form.appointmentDate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const portalPanels = document.querySelectorAll(`.${styles.dropdownPanel}`);
      const inPortal = Array.from(portalPanels).some((el) => el.contains(target));
      const anyContains = Object.values(dropdownRefs.current).some((ref) => ref?.contains(target));
      if (!anyContains && !inPortal) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const toggleDropdown = useCallback((name: string) => {
    setOpenDropdown((p) => (p === name ? null : name));
  }, []);

  /* ─── Validation ─── */
  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.name.trim()) errs.name = "Full Name is required";
      if (!form.phone.trim()) errs.phone = "Phone Number is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email address";
    }
    if (s === 2) {
      if (!form.departmentId) errs.departmentId = "Please select a department";
      if (!form.doctorId) errs.doctorId = "Please select a doctor";
      if (!form.appointmentDate) errs.appointmentDate = "Please select a date";
      if (!form.timeSlot) errs.timeSlot = "Please select a time slot";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 3)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const d = await api("/api/appointments", "POST", form);
    setIsSubmitting(false);

    if (d.success) {
      setIsSuccess(true);
      setTimeout(() => { onClose(); }, 2800);
    } else {
      setErrors({ submit: d.message || "An unknown error occurred." });
    }
  };

  /* ─── Calendar ─── */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();
    const cells: { day: number; current: boolean; date: Date }[] = [];
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: prevDays - i, current: false, date: new Date(calYear, calMonth - 1, prevDays - i) });
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ day: d, current: true, date: new Date(calYear, calMonth, d) });
    const rem = 42 - cells.length;
    for (let d = 1; d <= rem; d++)
      cells.push({ day: d, current: false, date: new Date(calYear, calMonth + 1, d) });
    return cells;
  }, [calMonth, calYear]);

  const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isPast = (d: Date) => stripTime(d) < stripTime(today);
  const isToday = (d: Date) => stripTime(d).getTime() === stripTime(today).getTime();
  const fmtDate = (v: string) => {
    if (!v) return "";
    const d = new Date(v);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear-1); } else setCalMonth(calMonth-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear+1); } else setCalMonth(calMonth+1); };

  const displayTime = form.timeSlot ? fmt12(form.timeSlot) : "";

  /* ─── Render Helpers ─── */
  const renderDropdown = (
    name: string,
    label: string,
    icon: React.ReactNode,
    value: string,
    placeholder: string,
    content: React.ReactNode,
  ) => (
    <div
      className={`${styles.field} ${openDropdown === name ? styles.fieldFocused : ""} ${errors[name] ? styles.fieldError : ""}`}
      ref={(el) => { dropdownRefs.current[name] = el; }}
    >
      <label className={styles.label}>{label}</label>
      <div className={`${styles.inputWrap} ${styles.customSelect}`} onClick={() => toggleDropdown(name)}>
        <span className={styles.fieldIconWrap}>{icon}</span>
        <span className={`${styles.selectValue} ${!value ? styles.placeholder : ""}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`${styles.selectChevron} ${openDropdown === name ? styles.selectChevronOpen : ""}`} />
      </div>

      {/* Portal-based dropdown — escapes overflow:hidden / overflow-y:auto containers */}
      <PortalDropdown
        anchorEl={dropdownRefs.current[name] ?? null}
        isOpen={openDropdown === name}
      >
        {content}
      </PortalDropdown>

      {errors[name] && <span className={styles.errorMsg}>{errors[name]}</span>}
    </div>
  );

  const renderInput = (
    name: string, label: string, icon: React.ReactNode,
    type = "text", placeholder = "", required = true,
  ) => (
    <div className={`${styles.field} ${errors[name] ? styles.fieldError : ""}`}>
      <label className={styles.label}>{label}{required && " *"}</label>
      <div className={styles.inputWrap}>
        <span className={styles.fieldIconWrap}>{icon}</span>
        <input
          type={type} placeholder={placeholder} value={(form as Record<string,string>)[name] || ""}
          onChange={(e) => updateField(name, e.target.value)}
          className={styles.input}
        />
      </div>
      {errors[name] && <span className={styles.errorMsg}>{errors[name]}</span>}
    </div>
  );

  const renderTextarea = (
    name: string, label: string, placeholder: string, required = false, rows = 3,
  ) => (
    <div className={`${styles.field} ${errors[name] ? styles.fieldError : ""}`}>
      <label className={styles.label}>{label}{required && " *"}</label>
      <div className={styles.inputWrap}>
        <span className={`${styles.fieldIconWrap} ${styles.textareaIcon}`}><FileText size={16} /></span>
        <textarea
          placeholder={placeholder} rows={rows}
          value={(form as Record<string,string>)[name] || ""}
          onChange={(e) => updateField(name, e.target.value)}
          className={`${styles.input} ${styles.textarea}`}
        />
      </div>
      {errors[name] && <span className={styles.errorMsg}>{errors[name]}</span>}
    </div>
  );

  /* ─── JSX ─── */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>

            {/* Success */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div className={styles.successOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                    <CheckCircle2 size={64} className={styles.successIcon} />
                  </motion.div>
                  <h3>Appointment Booked!</h3>
                  <p>We&apos;ll send a confirmation to your email shortly.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress */}
            <div className={styles.stepper}>
              {steps.map((s, i) => (
                <div key={s.num} className={`${styles.stepItem} ${step >= s.num ? styles.stepActive : ""} ${step === s.num ? styles.stepCurrent : ""}`}>
                  <div className={styles.stepCircle}>
                    {step > s.num ? <Check size={14} /> : s.icon}
                  </div>
                  <span className={styles.stepLabel}>{s.label}</span>
                  {i < steps.length - 1 && <div className={`${styles.stepLine} ${step > s.num ? styles.stepLineDone : ""}`} />}
                </div>
              ))}
            </div>

            {/* Steps */}
            <div className={styles.stepBody}>
              <AnimatePresence mode="wait">
                {/* ─── STEP 1 ─── */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <h3 className={styles.stepTitle}>Your Information</h3>
                    <p className={styles.stepSubtext}>Please provide your contact details.</p>
                    <div className={styles.formRow}>
                      {renderInput("name", "Full Name", <User size={16} />, "text", "e.g. John Doe")}
                      {renderInput("phone", "Phone Number", <Phone size={16} />, "tel", "e.g. 9876543210")}
                    </div>
                    <div className={styles.formRow}>
                      {renderInput("email", "Email Address", <Mail size={16} />, "email", "e.g. john.doe@example.com")}
                      <div className={styles.field} />
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 2 ─── */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <h3 className={styles.stepTitle}>Appointment Details</h3>

                    <div className={styles.formRow}>
                      {/* Department */}
                      {renderDropdown("departmentId", "Department *", <Stethoscope size={16} />,
                        departmentsData.find(d => d.id === form.departmentId)?.name || "", "Select Department",
                        departmentsData.map((d) => (
                          <button key={d.id} type="button"
                            className={`${styles.dropdownOption} ${form.departmentId === d.id ? styles.dropdownOptionSelected : ""}`}
                            onClick={() => { updateField("departmentId", d.id); updateField("doctorId", ""); updateField("timeSlot", ""); setOpenDropdown(null); }}
                          >
                            <span className={styles.optionLabel}>{d.name}</span>
                            {form.departmentId === d.id && <Check size={14} className={styles.optionCheck} />}
                          </button>
                        ))
                      )}

                      {/* Doctor */}
                      {renderDropdown("doctorId", "Doctor *", <User size={16} />,
                        doctorsData.find(d => d.id === form.doctorId)?.name || "", "Select Doctor",
                        doctorsData.map((d) => (
                          <button key={d.id} type="button"
                            className={`${styles.dropdownOption} ${form.doctorId === d.id ? styles.dropdownOptionSelected : ""}`}
                            onClick={() => {
                              updateField("doctorId", d.id);
                              updateField("timeSlot", "");
                              if (d.consultationFee) updateField("consultationFee", String(d.consultationFee));
                              if (d.departmentId && !form.departmentId) updateField("departmentId", d.departmentId);
                              setOpenDropdown(null);
                            }}
                          >
                            <div>
                              <span className={styles.optionLabel}>{d.name}</span>
                              <span className={styles.optionDesc}>{d.specialization || d.department?.name}</span>
                            </div>
                            {form.doctorId === d.id && <Check size={14} className={styles.optionCheck} />}
                          </button>
                        ))
                      )}
                    </div>

                    <div className={styles.formRow}>
                      {/* Date */}
                      {renderDropdown("appointmentDate", "Appointment Date *", <Calendar size={16} />,
                        form.appointmentDate ? fmtDate(form.appointmentDate) : "", "Select Date",
                        <div className={styles.calendarInner}>
                          <div className={styles.calNav}>
                            <button type="button" className={styles.calNavBtn} onClick={prevMonth}><ChevronLeft size={16} /></button>
                            <span className={styles.calNavTitle}>{MONTHS[calMonth]} {calYear}</span>
                            <button type="button" className={styles.calNavBtn} onClick={nextMonth}><ChevronRight size={16} /></button>
                          </div>
                          <div className={styles.calDayNames}>
                            {DAYS.map((d) => <span key={d} className={styles.calDayName}>{d}</span>)}
                          </div>
                          <div className={styles.calGrid}>
                            {calendarDays.map((cell, i) => (
                              <button key={i} type="button" disabled={isPast(cell.date)}
                                className={`${styles.calDay} ${!cell.current ? styles.calDayOther : ""} ${isPast(cell.date) ? styles.calDayDisabled : ""} ${isToday(cell.date) ? styles.calDayToday : ""} ${form.appointmentDate === cell.date.toISOString().split('T')[0] ? styles.calDaySelected : ""}`}
                                onClick={() => { updateField("appointmentDate", cell.date.toISOString().split('T')[0]); updateField("timeSlot", ""); setOpenDropdown(null); }}
                              >{cell.day}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Type */}
                      <div className={styles.field}>
                        <label className={styles.label}>Appointment Type</label>
                        <select className={styles.input} value={form.type} onChange={(e) => updateField("type", e.target.value)}>
                          <option value="OPD">OPD</option>
                          <option value="ONLINE">Online</option>
                          <option value="FOLLOW_UP">Follow-up</option>
                          <option value="EMERGENCY">Emergency</option>
                        </select>
                      </div>
                    </div>

                    {/* Time Slots */}
                    {form.doctorId && form.appointmentDate && (
                      <div className={styles.slotsSection}>
                        <label className={styles.label}>
                          Available Slots {loadingSlots && <Loader2 size={12} className={styles.spinner} />}
                        </label>
                        {slotsData.length === 0 && !loadingSlots ? (
                          <div className={styles.noSlots}>No slots available for this date.</div>
                        ) : (
                          <div className={styles.timeGrid}>
                            {slotsData.map((slot) => {
                              const isBooked = bookedSlotsData.includes(slot);
                              const isSelected = form.timeSlot === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={isBooked}
                                  className={`${styles.timeChip} ${isSelected ? styles.timeChipSelected : ""} ${isBooked ? styles.timeChipDisabled : ""}`}
                                  onClick={() => updateField("timeSlot", slot)}
                                >
                                  {fmt12(slot)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {renderTextarea("notes", "Reason for Visit / Notes", "Describe your symptoms or any special requests...", false, 3)}
                  </motion.div>
                )}

                {/* ─── STEP 3 ─── */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <h3 className={styles.stepTitle}>Confirm Your Appointment</h3>
                    <p className={styles.confirmSubtext}>Please review the details below before confirming.</p>

                    <div className={styles.summaryCard}>
                      {/* Section: Patient */}
                      <div className={styles.summarySection}>
                        <div className={styles.summarySectionHeader}>
                          <User size={16} /> <span>Your Details</span>
                          <button type="button" className={styles.editBtn} onClick={() => setStep(1)}><Edit3 size={12} /> Edit</button>
                        </div>
                        <div className={styles.summaryGrid}>
                          <SummaryItem label="Name" value={form.name} />
                          <SummaryItem label="Phone" value={form.phone} />
                          <SummaryItem label="Email" value={form.email} />
                        </div>
                      </div>

                      {/* Section: Appointment */}
                      <div className={styles.summarySection}>
                        <div className={styles.summarySectionHeader}>
                          <Calendar size={16} /> <span>Appointment Details</span>
                          <button type="button" className={styles.editBtn} onClick={() => setStep(2)}><Edit3 size={12} /> Edit</button>
                        </div>
                        <div className={styles.summaryGrid}>
                          <SummaryItem label="Doctor" value={doctorsData.find(d => d.id === form.doctorId)?.name || ""} />
                          <SummaryItem label="Department" value={departmentsData.find(d => d.id === form.departmentId)?.name || "—"} />
                          <SummaryItem label="Date" value={form.appointmentDate ? fmtDate(form.appointmentDate) : ""} />
                          <SummaryItem label="Time" value={displayTime} />
                          <SummaryItem label="Type" value={form.type} />
                          <SummaryItem label="Fee" value={form.consultationFee ? `₹${form.consultationFee}` : "—"} />
                        </div>
                      </div>

                      {form.notes && (
                        <div className={styles.summarySection}>
                          <div className={styles.summarySectionHeader}>
                            <FileText size={16} /> <span>Notes</span>
                          </div>
                          <div className={styles.summaryGrid}>
                            <SummaryItem label="Details" value={form.notes} full />
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              {step > 1 && (
                <button type="button" className={`btn btn-secondary ${styles.footerBtn}`} onClick={prevStep}>
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <div className={styles.footerSpacer} />
              {step < 3 ? (
                <button type="button" className={`btn btn-primary ${styles.footerBtn}`} onClick={nextStep}>
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <motion.button
                  type="button"
                  className={`btn btn-primary ${styles.footerBtn} ${styles.confirmBtn}`}
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className={styles.spinner} /> Booking...</>
                  ) : (
                    <><CheckCircle2 size={18} /> Confirm Booking</>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Summary Item ─── */
function SummaryItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`${styles.summaryItem} ${full ? styles.summaryItemFull : ""}`}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  );
}
