import type { Metadata } from "next";
import { HeartPulse, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
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
    title: "Oral Cancer",
    description: "Comprehensive diagnosis and treatment for oral cavity cancers with precision care.",
  },
  {
    title: "Throat Cancer",
    description: "Advanced therapies for pharyngeal and laryngeal cancers with multidisciplinary approach.",
  },
  {
    title: "Neck Tumors",
    description: "Expert management of benign and malignant neck tumors with surgical precision.",
  },
  {
    title: "Salivary Gland Disorders",
    description: "Specialized care for salivary gland tumors and related conditions.",
  },
];

const whyChooseUs = [
  "Expert oncology specialists",
  "Advanced diagnostic systems",
  "Comprehensive treatment planning",
  "Ethical and patient-focused care",
];

export default function OncologyPage() {
  return (
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
            <Link href="/contact" className={styles.ctaButton}>
              Book Consultation <ArrowRight size={18} />
            </Link>
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
                <h3 className={styles.treatmentTitle}>{condition.title}</h3>
                <p className={styles.treatmentDescription}>{condition.description}</p>
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
                <CheckCircle size={24} className={styles.featureIcon} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
