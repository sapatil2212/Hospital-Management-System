import type { Metadata } from "next";
import { Ribbon, CheckCircle, ArrowRight, Calendar, Shield, Award, Users, Microscope, Clock, Phone, Scissors } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    icon: <Shield size={28} />,
    title: "PRP Therapy",
    description: "Platelet-rich plasma therapy to stimulate natural hair growth and strengthen follicles with AI-guided precision.",
  },
  {
    icon: <Ribbon size={28} />,
    title: "Hair Regrowth Treatment",
    description: "Advanced solutions to promote hair regrowth and prevent further hair loss using cutting-edge technology.",
  },
  {
    icon: <Microscope size={28} />,
    title: "AI Scalp Analysis",
    description: "AI-powered scalp diagnostics to identify root causes of hair problems and customize treatments.",
  },
  {
    icon: <Award size={28} />,
    title: "Dandruff Treatment",
    description: "Effective treatments to eliminate dandruff and maintain optimal scalp health for hair growth.",
  },
  {
    icon: <Scissors size={28} />,
    title: "Hair Transplant Guidance",
    description: "Expert consultation and guidance for hair transplant procedures with pre and post-care support.",
  },
];

const whyChooseUs = [
  { icon: <Microscope size={24} />, text: "AI-driven diagnosis" },
  { icon: <Users size={24} />, text: "Personalized treatment plans" },
  { icon: <Shield size={24} />, text: "Advanced technology" },
  { icon: <Award size={24} />, text: "Proven results" },
];

const stats = [
  { number: "8K+", label: "Hair Treatments" },
  { number: "95%", label: "Success Rate" },
  { number: "12+", label: "Hair Experts" },
  { number: "5★", label: "Google Rating" },
];

const processSteps = [
  { step: 1, title: "Scalp Analysis", description: "AI-powered scalp diagnostics" },
  { step: 2, title: "Treatment Plan", description: "Customized hair restoration plan" },
  { step: 3, title: "Procedure", description: "Expert treatment execution" },
  { step: 4, title: "Maintenance", description: "Ongoing hair care support" },
];

export default function HairTreatmentsPage() {
  return (
    <>
      <Navbar />
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
            <h2 className={styles.sectionTitle}>Our Hair Treatments</h2>
            <div className={styles.treatmentsGrid}>
              {hairTreatments.map((treatment, index) => (
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
            <h2 className={styles.sectionTitle}>Why Choose Us for Hair Care</h2>
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
              <h2 className={styles.ctaTitle}>Ready to Restore Your Hair?</h2>
              <p className={styles.ctaDescription}>
                Book a consultation with our hair restoration experts and start your journey to fuller, healthier hair.
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
