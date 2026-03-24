import type { Metadata } from "next";
import { Sparkles, CheckCircle, ArrowRight, Calendar, Shield, Award, Users, Microscope, Clock, Phone } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    icon: <Sparkles size={28} />,
    title: "Acne & Acne Scar Treatment",
    description: "Advanced solutions for active acne and scar reduction using AI-powered skin analysis and targeted therapies.",
  },
  {
    icon: <Microscope size={28} />,
    title: "Pigmentation & Melasma Treatment",
    description: "Targeted therapies for uneven skin tone and dark spots with personalized protocols and laser technology.",
  },
  {
    icon: <Clock size={28} />,
    title: "Anti-Aging Solutions",
    description: "Comprehensive treatments to reduce fine lines, wrinkles, and restore youthful, radiant skin.",
  },
  {
    icon: <Shield size={28} />,
    title: "Laser Skin Therapy",
    description: "State-of-the-art laser treatments for various skin concerns with precision care and minimal downtime.",
  },
  {
    icon: <Award size={28} />,
    title: "Skin Rejuvenation",
    description: "Advanced procedures to revitalize and refresh your skin's natural glow and texture.",
  },
];

const whyChooseUs = [
  { icon: <Microscope size={24} />, text: "AI-powered skin diagnosis" },
  { icon: <Users size={24} />, text: "Customized treatment plans" },
  { icon: <Shield size={24} />, text: "Advanced laser technologies" },
  { icon: <Award size={24} />, text: "Trusted dermatology experts" },
];

const stats = [
  { number: "10K+", label: "Skin Treatments" },
  { number: "98%", label: "Success Rate" },
  { number: "15+", label: "Expert Doctors" },
  { number: "5★", label: "Google Rating" },
];

const processSteps = [
  { step: 1, title: "AI Analysis", description: "Advanced skin scanning and diagnosis" },
  { step: 2, title: "Custom Plan", description: "Personalized treatment protocol" },
  { step: 3, title: "Treatment", description: "Expert procedure execution" },
  { step: 4, title: "Follow-up", description: "Ongoing care and monitoring" },
];

export default function SkinTreatmentsPage() {
  return (
    <>
      <Navbar />
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

        {/* Treatments Section */}
        <section className={styles.treatmentsSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Our Skin Treatments</h2>
            <div className={styles.treatmentsGrid}>
              {skinTreatments.map((treatment, index) => (
                <div key={index} className={styles.treatmentCard}>
                  <div className={styles.treatmentIcon}>{treatment.icon}</div>
                  <h3 className={styles.treatmentTitle}>{treatment.title}</h3>
                  <p className={styles.treatmentDescription}>{treatment.description}</p>
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
            <h2 className={styles.sectionTitle}>Why Choose Celeb Aesthecia for Skin Care</h2>
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
              <h2 className={styles.ctaTitle}>Ready to Transform Your Skin?</h2>
              <p className={styles.ctaDescription}>
                Book a consultation with our expert dermatologists and start your journey to healthier, glowing skin.
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
