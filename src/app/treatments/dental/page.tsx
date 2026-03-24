import type { Metadata } from "next";
import { SmilePlus, CheckCircle, ArrowRight, Calendar, Shield, Award, Users, Microscope, Clock, Phone, Scissors } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    icon: <SmilePlus size={28} />,
    title: "Dental Implants",
    description: "Permanent tooth replacement solutions with advanced implant technology and expert surgical care.",
  },
  {
    icon: <Shield size={28} />,
    title: "Root Canal Treatment",
    description: "Pain-free RCT procedures to save infected teeth and restore oral health with modern techniques.",
  },
  {
    icon: <Award size={28} />,
    title: "Cosmetic Dentistry",
    description: "Smile makeover solutions including veneers, bonding, and aesthetic corrections for a perfect smile.",
  },
  {
    icon: <Microscope size={28} />,
    title: "Teeth Whitening",
    description: "Professional whitening treatments for a brighter, more confident smile with lasting results.",
  },
  {
    icon: <Scissors size={28} />,
    title: "Orthodontics",
    description: "Braces and aligner treatments for perfectly aligned teeth and improved bite function.",
  },
];

const whyChooseUs = [
  { icon: <Microscope size={24} />, text: "Advanced CBCT & OPG imaging" },
  { icon: <Shield size={24} />, text: "Modular OT for surgeries" },
  { icon: <Award size={24} />, text: "High sterilization standards" },
  { icon: <Users size={24} />, text: "Experienced dental specialists" },
];

const stats = [
  { number: "12K+", label: "Dental Procedures" },
  { number: "99%", label: "Success Rate" },
  { number: "10+", label: "Dental Experts" },
  { number: "5★", label: "Google Rating" },
];

const processSteps = [
  { step: 1, title: "Digital Scan", description: "Advanced 3D dental imaging" },
  { step: 2, title: "Treatment Plan", description: "Customized dental solution" },
  { step: 3, title: "Procedure", description: "Expert dental treatment" },
  { step: 4, title: "After Care", description: "Follow-up and maintenance" },
];

export default function DentalTreatmentsPage() {
  return (
    <>
      <Navbar />
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

        {/* Services Section */}
        <section className={styles.treatmentsSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Our Dental Services</h2>
            <div className={styles.treatmentsGrid}>
              {dentalServices.map((service, index) => (
                <div key={index} className={styles.treatmentCard}>
                  <div className={styles.treatmentIcon}>{service.icon}</div>
                  <h3 className={styles.treatmentTitle}>{service.title}</h3>
                  <p className={styles.treatmentDescription}>{service.description}</p>
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
            <h2 className={styles.sectionTitle}>Why Choose Our Dental Clinic</h2>
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
              <h2 className={styles.ctaTitle}>Ready for a Perfect Smile?</h2>
              <p className={styles.ctaDescription}>
                Book a consultation with our expert dentists and start your journey to a healthier, brighter smile.
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
