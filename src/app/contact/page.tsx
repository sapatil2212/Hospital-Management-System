"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./contact.module.css";

const contactInfo = [
  { icon: <MapPin size={22} />, title: "Visit Us", detail: "Rajashree Hospital, Near Canada Corner, Gangapur Road, Nashik, Maharastra 411052", color: "#3B82F6", bgColor: "#EFF6FF" },
  { icon: <Phone size={22} />, title: "Call Us", detail: "+91 90590 53938", color: "#10B981", bgColor: "#D1FAE5" },
  { icon: <Mail size={22} />, title: "Email Us", detail: "rajashreehospital2026@gmail.com", color: "#8B5CF6", bgColor: "#EDE9FE" },
  { icon: <Clock size={22} />, title: "Working Hours", detail: "Mon – Fri: 8:00 AM – 7:00 PM", color: "#F59E0B", bgColor: "#FEF3C7" },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormState({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <>
      <Navbar />
      <main>
        <section className={styles.pageHero}>
          <div className="container">
            <motion.div className={styles.heroContent} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <span className="section-label"><MessageSquare size={16} />Contact Us</span>
              <h1 className={styles.heroTitle}>Get in <span className={styles.accent}>Touch</span></h1>
              <p className={styles.heroSubtext}>Have a question or want to schedule an appointment? We'd love to hear from you.</p>
            </motion.div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className={styles.cardsSection}>
          <div className="container">
            <div className={styles.cardsGrid}>
              {contactInfo.map((info, i) => (
                <motion.div key={info.title} className={styles.infoCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}>
                  <div className={styles.infoIcon} style={{ background: info.bgColor, color: info.color }}>{info.icon}</div>
                  <h3 className={styles.infoTitle}>{info.title}</h3>
                  <p className={styles.infoDetail}>{info.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className={styles.formSection}>
          <div className={`container ${styles.formGrid}`}>
            <motion.div className={styles.formLeft} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="section-title">Send Us a <span className={styles.accent}>Message</span></h2>
              <p className={styles.formSubtext}>Fill out the form and our team will get back to you within 24 hours.</p>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={`${styles.inputGroup} ${focusedField === "name" ? styles.focused : ""}`}>
                    <label className={styles.label}>Full Name</label>
                    <input type="text" className={styles.input} value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)} required />
                  </div>
                  <div className={`${styles.inputGroup} ${focusedField === "email" ? styles.focused : ""}`}>
                    <label className={styles.label}>Email Address</label>
                    <input type="email" className={styles.input} value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} required />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={`${styles.inputGroup} ${focusedField === "phone" ? styles.focused : ""}`}>
                    <label className={styles.label}>Phone</label>
                    <input type="tel" className={styles.input} value={formState.phone} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div className={`${styles.inputGroup} ${focusedField === "subject" ? styles.focused : ""}`}>
                    <label className={styles.label}>Subject</label>
                    <input type="text" className={styles.input} value={formState.subject} onChange={(e) => setFormState({ ...formState, subject: e.target.value })} onFocus={() => setFocusedField("subject")} onBlur={() => setFocusedField(null)} required />
                  </div>
                </div>
                <div className={`${styles.inputGroup} ${focusedField === "message" ? styles.focused : ""}`}>
                  <label className={styles.label}>Message</label>
                  <textarea className={`${styles.input} ${styles.textarea}`} rows={5} value={formState.message} onChange={(e) => setFormState({ ...formState, message: e.target.value })} onFocus={() => setFocusedField("message")} onBlur={() => setFocusedField(null)} required />
                </div>
                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`}>
                  {submitted ? <><CheckCircle2 size={18} /> Sent Successfully!</> : <><Send size={18} /> Send Message</>}
                </button>
              </form>
            </motion.div>

            {/* Map placeholder */}
            <motion.div className={styles.mapWrapper} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className={styles.mapPlaceholder}>
                <MapPin size={48} />
                <h3>Our Location</h3>
                <p>Rajashree Hospital, Near Canada Corner,<br />Gangapur Road, Nashik, Maharastra 411052</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
