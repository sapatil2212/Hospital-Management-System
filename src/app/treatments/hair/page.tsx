import type { Metadata } from "next";
import { Ribbon, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "../treatments.module.css";

export const metadata: Metadata = {
  title: "Hair Loss Treatment in India | AI Hair Restoration Clinic",
  description:
    "Best hair loss treatment with AI scalp analysis, PRP therapy, and hair regrowth solutions at Celeb Aesthecia. Effective and long-lasting results.",
  keywords: [
    "hair loss treatment India",
    "hair restoration clinic",
    "PRP hair treatment",
    "hair regrowth treatment",
    "scalp analysis",
    "hair clinic India",
  ],
};

const hairTreatments = [
  {
    title: "PRP Therapy",
    description: "Platelet-rich plasma therapy to stimulate natural hair growth and strengthen follicles.",
  },
  {
    title: "Hair Regrowth Treatment",
    description: "Advanced solutions to promote hair regrowth and prevent further hair loss.",
  },
  {
    title: "Scalp Analysis",
    description: "AI-powered scalp diagnostics to identify root causes of hair problems.",
  },
  {
    title: "Dandruff Treatment",
    description: "Effective treatments to eliminate dandruff and maintain scalp health.",
  },
  {
    title: "Hair Transplant Guidance",
    description: "Expert consultation and guidance for hair transplant procedures.",
  },
];

const whyChooseUs = [
  "AI-driven diagnosis",
  "Personalized treatment plans",
  "Advanced technology",
  "Proven results",
];

export default function HairTreatmentsPage() {
  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Ribbon size={18} />
              <span>AI Hair Restoration</span>
            </div>
            <h1 className={styles.heroTitle}>
              AI-Based <span className={styles.accent}>Hair Loss</span> & Hair Restoration Treatments
            </h1>
            <p className={styles.heroDescription}>
              Celeb Aesthecia provides advanced hair loss treatments in India using AI-powered scalp 
              analysis and modern regenerative therapies. Our solutions are designed to treat hair 
              thinning, baldness, and scalp conditions effectively.
            </p>
            <p className={styles.heroSubtext}>
              We focus on long-term hair restoration with safe and clinically proven methods.
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
          <h2 className={styles.sectionTitle}>Our Hair Treatments</h2>
          <div className={styles.treatmentsGrid}>
            {hairTreatments.map((treatment, index) => (
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
          <h2 className={styles.sectionTitle}>Why Choose Us for Hair Care</h2>
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
