"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Clock, User, Mail, Phone, FileText,
  CheckCircle2, Loader2, ChevronDown, ChevronLeft, ChevronRight,
  Stethoscope, SmilePlus, Sparkles, Ribbon, HeartPulse, Check,
  ClipboardList, UserCircle, ArrowRight, ArrowLeft, Edit3,
} from "lucide-react";
import styles from "./AppointmentModal.module.css";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Static Data ─── */
const consultationTypes = [
  { label: "First Consultation", desc: "New patient visit" },
  { label: "Follow-up Consultation", desc: "Returning patient" },
];

const departments = [
  { label: "General OPD", icon: <Stethoscope size={16} /> },
  { label: "Dental", icon: <SmilePlus size={16} /> },
  { label: "Dermatology", icon: <Sparkles size={16} /> },
  { label: "Cancer (Oncology)", icon: <Ribbon size={16} /> },
  { label: "Cardiology", icon: <HeartPulse size={16} /> },
];

const presetTimes = [
  { label: "09:00 AM", period: "Morning" },
  { label: "09:30 AM", period: "Morning" },
  { label: "10:00 AM", period: "Morning" },
  { label: "10:30 AM", period: "Morning" },
  { label: "11:00 AM", period: "Morning" },
  { label: "11:30 AM", period: "Morning" },
  { label: "02:00 PM", period: "Afternoon" },
  { label: "02:30 PM", period: "Afternoon" },
  { label: "03:00 PM", period: "Afternoon" },
  { label: "03:30 PM", period: "Afternoon" },
  { label: "04:00 PM", period: "Afternoon" },
  { label: "04:30 PM", period: "Afternoon" },
];

const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const steps = [
  { num: 1, label: "Consultation & Personal Details", icon: <UserCircle size={18} /> },
  { num: 2, label: "Medical Information",             icon: <ClipboardList size={18} /> },
  { num: 3, label: "Confirm Appointment",             icon: <CheckCircle2 size={18} /> },
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
  const [form, setForm] = useState({
    consultationType: "", department: "", date: "", time: "", customTime: "",
    name: "", email: "", phone: "", age: "", gender: "",
    complaint: "", previousTreatments: "", currentMedications: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [useCustomTime, setUseCustomTime] = useState(false);

  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Also check portal content (appended to body)
      const portalPanels = document.querySelectorAll(`.${styles.dropdownPanel}`);
      const inPortal = Array.from(portalPanels).some((el) => el.contains(target));
      const anyContains = Object.values(dropdownRefs.current).some((ref) => ref?.contains(target));
      if (!anyContains && !inPortal) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setForm({
          consultationType: "", department: "", date: "", time: "", customTime: "",
          name: "", email: "", phone: "", age: "", gender: "",
          complaint: "", previousTreatments: "", currentMedications: "", notes: "",
        });
        setErrors({});
        setOpenDropdown(null);
        setUseCustomTime(false);
        setIsSuccess(false);
      }, 300);
    }
  }, [isOpen]);

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
      if (!form.consultationType) errs.consultationType = "Required";
      if (!form.department) errs.department = "Required";
      if (!form.date) errs.date = "Required";
      if (!form.time && !form.customTime) errs.time = "Required";
      if (!form.name.trim()) errs.name = "Required";
      if (!form.email.trim()) errs.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
      if (!form.phone.trim()) errs.phone = "Required";
    }
    if (s === 2) {
      if (!form.complaint.trim()) errs.complaint = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 3)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => { onClose(); }, 2800);
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
  const isSelected = (d: Date) => {
    if (!form.date) return false;
    const s = new Date(form.date);
    return stripTime(d).getTime() === stripTime(s).getTime();
  };
  const selectDate = (d: Date) => {
    if (isPast(d)) return;
    updateField("date", `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
    setOpenDropdown(null);
  };
  const fmtDate = (v: string) => {
    if (!v) return "";
    const d = new Date(v);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear-1); } else setCalMonth(calMonth-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear+1); } else setCalMonth(calMonth+1); };

  const displayTime = useCustomTime ? form.customTime : form.time;

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
                    <h3 className={styles.stepTitle}>Consultation & Personal Details</h3>

                    <div className={styles.formRow}>
                      {/* Consultation Type */}
                      {renderDropdown("consultationType", "Consultation Type *", <ClipboardList size={16} />, form.consultationType, "Select type",
                        consultationTypes.map((ct) => (
                          <button key={ct.label} type="button"
                            className={`${styles.dropdownOption} ${form.consultationType === ct.label ? styles.dropdownOptionSelected : ""}`}
                            onClick={() => { updateField("consultationType", ct.label); setOpenDropdown(null); }}
                          >
                            <div>
                              <span className={styles.optionLabel}>{ct.label}</span>
                              <span className={styles.optionDesc}>{ct.desc}</span>
                            </div>
                            {form.consultationType === ct.label && <Check size={14} className={styles.optionCheck} />}
                          </button>
                        ))
                      )}

                      {/* Department */}
                      {renderDropdown("department", "Department *", <Stethoscope size={16} />, form.department, "Select department",
                        departments.map((d) => (
                          <button key={d.label} type="button"
                            className={`${styles.dropdownOption} ${form.department === d.label ? styles.dropdownOptionSelected : ""}`}
                            onClick={() => { updateField("department", d.label); setOpenDropdown(null); }}
                          >
                            <span className={styles.optionIcon}>{d.icon}</span>
                            <span className={styles.optionLabel}>{d.label}</span>
                            {form.department === d.label && <Check size={14} className={styles.optionCheck} />}
                          </button>
                        ))
                      )}
                    </div>

                    <div className={styles.formRow}>
                      {/* Date */}
                      {renderDropdown("date", "Preferred Date *", <Calendar size={16} />, form.date ? fmtDate(form.date) : "", "Select date",
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
                                className={`${styles.calDay} ${!cell.current ? styles.calDayOther : ""} ${isPast(cell.date) ? styles.calDayDisabled : ""} ${isToday(cell.date) ? styles.calDayToday : ""} ${isSelected(cell.date) ? styles.calDaySelected : ""}`}
                                onClick={() => selectDate(cell.date)}
                              >{cell.day}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Time */}
                      {renderDropdown("time", "Preferred Time *", <Clock size={16} />, displayTime, "Select time",
                        <div className={styles.timeInner}>
                          {/* Preset pills */}
                          <div className={styles.timeGroup}>
                            <span className={styles.timeGroupLabel}>Morning</span>
                            <div className={styles.timeGrid}>
                              {presetTimes.filter(t => t.period === "Morning").map((slot) => (
                                <button key={slot.label} type="button"
                                  className={`${styles.timeChip} ${form.time === slot.label && !useCustomTime ? styles.timeChipSelected : ""}`}
                                  onClick={() => { updateField("time", slot.label); setUseCustomTime(false); setOpenDropdown(null); }}
                                >{slot.label}</button>
                              ))}
                            </div>
                          </div>
                          <div className={styles.timeGroup}>
                            <span className={styles.timeGroupLabel}>Afternoon</span>
                            <div className={styles.timeGrid}>
                              {presetTimes.filter(t => t.period === "Afternoon").map((slot) => (
                                <button key={slot.label} type="button"
                                  className={`${styles.timeChip} ${form.time === slot.label && !useCustomTime ? styles.timeChipSelected : ""}`}
                                  onClick={() => { updateField("time", slot.label); setUseCustomTime(false); setOpenDropdown(null); }}
                                >{slot.label}</button>
                              ))}
                            </div>
                          </div>
                          {/* Custom time */}
                          <div className={styles.customTimeSection}>
                            <span className={styles.timeGroupLabel}>Or enter custom time</span>
                            <div className={styles.customTimeRow}>
                              <input
                                type="time"
                                value={form.customTime}
                                onChange={(e) => { updateField("customTime", e.target.value); setUseCustomTime(true); updateField("time", ""); }}
                                className={styles.customTimeInput}
                              />
                              {form.customTime && (
                                <button type="button" className={styles.customTimeConfirm}
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <Check size={14} /> Confirm
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.formRow}>
                      {renderInput("name", "Full Name", <User size={16} />, "text", "e.g. Swapnil Patil")}
                      {renderInput("email", "Email", <Mail size={16} />, "email", "name@example.com")}
                    </div>
                    <div className={styles.formRow}>
                      {renderInput("phone", "Phone Number", <Phone size={16} />, "tel", "+91 88305 53868")}
                      {renderInput("age", "Age", <User size={16} />, "number", "e.g. 28", false)}
                    </div>
                    <div className={styles.formRow}>
                      {renderDropdown("gender", "Gender", <UserCircle size={16} />, form.gender, "Select gender",
                        genderOptions.map((g) => (
                          <button key={g} type="button"
                            className={`${styles.dropdownOption} ${form.gender === g ? styles.dropdownOptionSelected : ""}`}
                            onClick={() => { updateField("gender", g); setOpenDropdown(null); }}
                          >
                            <span className={styles.optionLabel}>{g}</span>
                            {form.gender === g && <Check size={14} className={styles.optionCheck} />}
                          </button>
                        ))
                      )}
                      <div className={styles.field} /> {/* spacer */}
                    </div>
                  </motion.div>
                )}

                {/* ─── STEP 2 ─── */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <h3 className={styles.stepTitle}>Medical Information</h3>
                    {renderTextarea("complaint", "Chief Complaint / Main Health Concern *", "Describe your primary health concern or symptoms...", true, 3)}
                    {renderTextarea("previousTreatments", "Previous Treatments (if any)", "Any prior treatments, surgeries, or therapies related to this concern...", false, 2)}
                    {renderTextarea("currentMedications", "Current Medications", "List any medications you are currently taking...", false, 2)}
                    {renderTextarea("notes", "Additional Notes", "Anything else you'd like us to know...", false, 2)}
                  </motion.div>
                )}

                {/* ─── STEP 3 ─── */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                    <h3 className={styles.stepTitle}>Confirm Your Appointment</h3>
                    <p className={styles.confirmSubtext}>Please review the details below before confirming.</p>

                    <div className={styles.summaryCard}>
                      {/* Section: Consultation */}
                      <div className={styles.summarySection}>
                        <div className={styles.summarySectionHeader}>
                          <Calendar size={16} /> <span>Consultation Details</span>
                          <button type="button" className={styles.editBtn} onClick={() => setStep(1)}><Edit3 size={12} /> Edit</button>
                        </div>
                        <div className={styles.summaryGrid}>
                          <SummaryItem label="Type" value={form.consultationType} />
                          <SummaryItem label="Department" value={form.department} />
                          <SummaryItem label="Date" value={fmtDate(form.date)} />
                          <SummaryItem label="Time" value={displayTime} />
                        </div>
                      </div>

                      {/* Section: Personal */}
                      <div className={styles.summarySection}>
                        <div className={styles.summarySectionHeader}>
                          <User size={16} /> <span>Personal Details</span>
                          <button type="button" className={styles.editBtn} onClick={() => setStep(1)}><Edit3 size={12} /> Edit</button>
                        </div>
                        <div className={styles.summaryGrid}>
                          <SummaryItem label="Name" value={form.name} />
                          <SummaryItem label="Email" value={form.email} />
                          <SummaryItem label="Phone" value={form.phone} />
                          <SummaryItem label="Age" value={form.age || "—"} />
                          <SummaryItem label="Gender" value={form.gender || "—"} />
                        </div>
                      </div>

                      {/* Section: Medical */}
                      <div className={styles.summarySection}>
                        <div className={styles.summarySectionHeader}>
                          <ClipboardList size={16} /> <span>Medical Information</span>
                          <button type="button" className={styles.editBtn} onClick={() => setStep(2)}><Edit3 size={12} /> Edit</button>
                        </div>
                        <div className={styles.summaryGrid}>
                          <SummaryItem label="Chief Complaint" value={form.complaint} full />
                          {form.previousTreatments && <SummaryItem label="Previous Treatments" value={form.previousTreatments} full />}
                          {form.currentMedications && <SummaryItem label="Current Medications" value={form.currentMedications} full />}
                          {form.notes && <SummaryItem label="Notes" value={form.notes} full />}
                        </div>
                      </div>
                    </div>
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
