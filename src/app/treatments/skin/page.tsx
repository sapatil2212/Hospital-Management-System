import type { Metadata } from "next";
import { Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "../treatments.module.css";

export const metadata: Metadata = {
  title: "AI Skin Treatment in India | Advanced Dermatology Clinic | Celeb Aesthecia",
  description:
    "Get advanced AI-based skin treatments for acne, pigmentation, anti-aging, and laser therapy at Celeb Aesthecia. Safe, personalized, and result-driven care.",
  keywords: [
    "AI skin treatment India",
    "skin clinic",
    "acne treatment",
    "pigmentation treatment",
    "laser skin treatment",
    "anti aging treatment",
    "dermatology clinic India",
  ],
};

const skinTreatments = [
  {
    title: "Acne & Acne Scar Treatment",
    description: "Advanced solutions for active acne and scar reduction using AI-powered skin analysis.",
  },
  {
    title: "Pigmentation & Melasma Treatment",
    description: "Targeted therapies for uneven skin tone and dark spots with personalized protocols.",
  },
  {
    title: "Anti-Aging Solutions",
    description: "Comprehensive treatments to reduce fine lines, wrinkles, and restore youthful skin.",
  },
  {
    title: "Laser Skin Therapy",
    description: "State-of-the-art laser treatments for various skin concerns with precision care.",
  },
  {
    title: "Skin Rejuvenation",
    description: "Advanced procedures to revitalize and refresh your skin's natural glow.",
  },
];

const whyChooseUs = [
  "AI-powered skin diagnosis",
  "Customized treatment plans",
  "Advanced laser technologies",
  "Trusted dermatology experts",
];

export default function SkinTreatmentsPage() {
  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles size={18} />
              <span>AI-Powered Skin Care</span>
            </div>
            <h1 className={styles.heroTitle}>
              Advanced AI <span className={styles.accent}>Skin Treatments</span> in India
            </h1>
            <p className={styles.heroDescription}>
              Celeb Aesthecia offers AI-based skin treatments in India, combining advanced dermatology 
              with intelligent diagnostics to deliver personalized skincare solutions. Our treatments 
              target acne, pigmentation, aging, and other skin concerns using FDA-approved technologies.
            </p>
            <p className={styles.heroSubtext}>
              With expert dermatologists and modern equipment, we ensure safe, effective, and 
              long-lasting skin results tailored to your skin type.
            </p>
            <Link href="/contact" className={styles.ctaButton}>
              Book Consultation <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section className={styles.treatmentsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Our Skin Treatments</h2>
          <div className={styles.treatmentsGrid}>
            {skinTreatments.map((treatment, index) => (
              <div key={index} className={styles.treatmentCard}>
                <h3 className={styles.treatmentTitle}>{treatment.title}</h3>
                <p className={styles.treatmentDescription}>{treatment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className={styles.whyChooseSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Why Choose Celeb Aesthecia for Skin Care</h2>
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
