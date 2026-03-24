import type { Metadata } from "next";
import { SmilePlus, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "../treatments.module.css";

export const metadata: Metadata = {
  title: "Best Dental Clinic in India | Advanced Dental Care & Surgery",
  description:
    "Get advanced dental treatments including implants, RCT, and cosmetic dentistry at Celeb Aesthecia. Safe procedures with modern technology and modular OT.",
  keywords: [
    "dental clinic India",
    "dental implants",
    "root canal treatment",
    "cosmetic dentistry",
    "teeth whitening",
    "dental surgery India",
  ],
};

const dentalServices = [
  {
    title: "Dental Implants",
    description: "Permanent tooth replacement solutions with advanced implant technology.",
  },
  {
    title: "Root Canal Treatment",
    description: "Pain-free RCT procedures to save infected teeth and restore oral health.",
  },
  {
    title: "Cosmetic Dentistry",
    description: "Smile makeover solutions including veneers, bonding, and aesthetic corrections.",
  },
  {
    title: "Teeth Whitening",
    description: "Professional whitening treatments for a brighter, confident smile.",
  },
  {
    title: "Orthodontics",
    description: "Braces and aligner treatments for perfectly aligned teeth.",
  },
];

const whyChooseUs = [
  "Advanced CBCT & OPG imaging",
  "Modular OT for surgeries",
  "High sterilization standards",
  "Experienced dental specialists",
];

export default function DentalTreatmentsPage() {
  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <SmilePlus size={18} />
              <span>Advanced Dental Care</span>
            </div>
            <h1 className={styles.heroTitle}>
              Advanced <span className={styles.accent}>Dental Care</span> & Surgery in India
            </h1>
            <p className={styles.heroDescription}>
              Celeb Aesthecia is a leading dental clinic in India, offering advanced dental treatments 
              with modern imaging systems and a modular operation theatre. We provide precise, safe, 
              and high-quality dental care.
            </p>
            <p className={styles.heroSubtext}>
              Our expert dental team ensures pain-free procedures and long-lasting oral health solutions.
            </p>
            <Link href="/contact" className={styles.ctaButton}>
              Book Consultation <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={styles.treatmentsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Our Dental Services</h2>
          <div className={styles.treatmentsGrid}>
            {dentalServices.map((service, index) => (
              <div key={index} className={styles.treatmentCard}>
                <h3 className={styles.treatmentTitle}>{service.title}</h3>
                <p className={styles.treatmentDescription}>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className={styles.whyChooseSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Why Choose Our Dental Clinic</h2>
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
