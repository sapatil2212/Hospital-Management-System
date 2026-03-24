import type { Metadata } from "next";
import { HeartPulse, CheckCircle, ArrowRight, Calendar, Shield, Award, Users, Microscope, Clock, Phone, Activity } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../treatments.module.css";

export const metadata: Metadata = {
  title: "Head & Neck Cancer Treatment in India | Oncology Care",
  description:
    "Expert head & neck oncology treatment with advanced diagnostics and personalized care at Celeb Aesthecia. Early detection and better outcomes.",
  keywords: [
    "head and neck cancer treatment India",
    "oncology hospital India",
    "oral cancer treatment",
    "throat cancer treatment",
    "cancer care India",
  ],
};

const conditionsWeTreat = [
  {
    icon: <HeartPulse size={28} />,
    title: "Oral Cancer",
    description: "Comprehensive diagnosis and treatment for oral cavity cancers with precision care and multidisciplinary approach.",
  },
  {
    icon: <Activity size={28} />,
    title: "Throat Cancer",
    description: "Advanced therapies for pharyngeal and laryngeal cancers with state-of-the-art treatment protocols.",
  },
  {
    icon: <Microscope size={28} />,
    title: "Neck Tumors",
    description: "Expert management of benign and malignant neck tumors with surgical precision and care.",
  },
  {
    icon: <Shield size={28} />,
    title: "Salivary Gland Disorders",
    description: "Specialized care for salivary gland tumors and related conditions with advanced diagnostics.",
  },
];

const whyChooseUs = [
  { icon: <Users size={24} />, text: "Expert oncology specialists" },
  { icon: <Microscope size={24} />, text: "Advanced diagnostic systems" },
  { icon: <Award size={24} />, text: "Comprehensive treatment planning" },
  { icon: <HeartPulse size={24} />, text: "Ethical and patient-focused care" },
];

const stats = [
  { number: "5K+", label: "Cancer Treatments" },
  { number: "92%", label: "Success Rate" },
  { number: "8+", label: "Oncology Experts" },
  { number: "5★", label: "Google Rating" },
];

const processSteps = [
  { step: 1, title: "Diagnosis", description: "Advanced cancer detection" },
  { step: 2, title: "Staging", description: "Precise cancer staging" },
  { step: 3, title: "Treatment", description: "Multidisciplinary care" },
  { step: 4, title: "Recovery", description: "Post-treatment support" },
];

export default function OncologyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <HeartPulse size={18} />
                <span>Oncology Excellence</span>
              </div>
              <h1 className={styles.heroTitle}>
                Advanced Head & Neck <span className={styles.accent}>Oncology</span> Treatment in India
              </h1>
              <p className={styles.heroDescription}>
                Celeb Aesthecia offers specialized head and neck cancer treatment in India, focusing on 
                early diagnosis, precision care, and better clinical outcomes. Our oncology team uses 
                advanced technology and multidisciplinary approaches.
              </p>
              <p className={styles.heroSubtext}>
                We provide comprehensive cancer care with a patient-first approach, ensuring safety and 
                effectiveness at every stage.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/contact" className={styles.ctaButton}>
                  <Calendar size={18} /> Book Consultation
                </Link>
                <Link href="tel:+919876543210" className={styles.ctaButton} style={{ background: "var(--white)", color: "#0E898F", border: "2px solid #0E898F" }}>
                  <Phone size={18} /> Call Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className="container">
            <div className={styles.statsGrid}>
              {stats.map((stat, index) => (
                <div key={index} className={styles.statCard}>
                  <div className={styles.statNumber}>{stat.number}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conditions Section */}
        <section className={styles.treatmentsSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Conditions We Treat</h2>
            <div className={styles.treatmentsGrid}>
              {conditionsWeTreat.map((condition, index) => (
                <div key={index} className={styles.treatmentCard}>
                  <div className={styles.treatmentIcon}>{condition.icon}</div>
                  <h3 className={styles.treatmentTitle}>{condition.title}</h3>
                  <p className={styles.treatmentDescription}>{condition.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className={styles.processSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Our Treatment Process</h2>
            <div className={styles.processGrid}>
              {processSteps.map((step, index) => (
                <div key={index} className={styles.processCard}>
                  <div className={styles.processNumber}>{step.step}</div>
                  <h3 className={styles.processTitle}>{step.title}</h3>
                  <p className={styles.processDescription}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className={styles.whyChooseSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Why Choose Us for Oncology Care</h2>
            <div className={styles.featuresGrid}>
              {whyChooseUs.map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Need Expert Cancer Care?</h2>
              <p className={styles.ctaDescription}>
                Book a consultation with our oncology specialists and get the care you deserve.
              </p>
              <Link href="/contact" className={styles.ctaButtonWhite}>
                <Calendar size={18} /> Schedule Your Appointment
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
