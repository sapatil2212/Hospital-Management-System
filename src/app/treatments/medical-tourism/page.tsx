import type { Metadata } from "next";
import { 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  Zap, 
  Target,
  Users,
  Activity,
  Sparkles,
  Shield,
  Microscope,
  Stethoscope,
  Plane,
  Globe,
  Briefcase,
  Hotel,
  Video
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../treatments.module.css";
import MedicalTourismHero from "./MedicalTourismHero";

export const metadata: Metadata = {
  title: "Medical & Dental Tourism Center | Celeb Aesthetica",
  description:
    "World-class medical and dental tourism in India at Celeb Aesthetica. End-to-end support for international patients, including travel, stay, and advanced treatments.",
  keywords: [
    "medical tourism India",
    "dental tourism India",
    "international patient care",
    "visa assistance medical",
    "affordable healthcare India",
    "smile design abroad",
  ],
};

export default function MedicalTourismPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <MedicalTourismHero />

        {/* 1. International Patient Services */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Globe size={16} />
                  <span>International Patient Services</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  End-to-End Support for <span className={styles.titleAccent}>Global Patients</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our dedicated international care team ensures that every aspect of your medical journey is well-coordinated and stress-free.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Personalized assistance from inquiry to recovery",
                    "Appointment scheduling and treatment planning",
                    "Dedicated communication support",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Your comfort and convenience are our priority.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/medical-tourism/care.png" 
                    alt="International Patient Services" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 2. Treatment Packages */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Briefcase size={16} />
                  <span>Treatment Packages</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Customized, <span className={styles.titleAccent}>All-Inclusive Healthcare Solutions</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer tailored treatment packages designed to meet individual patient needs and budgets across dental, aesthetic, and surgical care.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Dental treatments (implants, smile design)",
                    "Aesthetic and cosmetic procedures",
                    "Hair restoration and transplant treatments",
                    "Minor and major surgical procedures",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Comprehensive care with transparent, value-driven packages.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/medical-tourism/package.png" 
                    alt="Treatment Packages" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 3. Visa Assistance & Travel Coordination */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Plane size={16} />
                  <span>Visa Assistance & Travel Coordination</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Hassle-Free <span className={styles.titleAccent}>Medical Travel to India</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We assist with all travel-related processes, including medical visa guidance, to ensure a smooth and easy journey.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Medical visa guidance and documentation",
                    "Travel planning and coordination",
                    "Airport pickup and local transport",
                  ].map((support, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{support}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Focus on your treatment while we manage the logistics.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/medical-tourism/visa.png" 
                    alt="Travel Coordination" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 4. Luxury Stay & Hospitality Services */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Hotel size={16} />
                  <span>Luxury Stay & Hospitality Services</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Comfort <span className={styles.titleAccent}>Meets Care</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide premium accommodation and hospitality arrangements for a comfortable stay during your entire treatment period.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Luxury hotel or serviced apartment options",
                    "Customized stay packages",
                    "Assistance for family members and companions",
                  ].map((feature, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Experience healthcare with comfort and care.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/medical-tourism/luxury.png" 
                    alt="Hospitality Services" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 5. Dedicated Patient Care Managers */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Users size={16} />
                  <span>Dedicated Patient Care Managers</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Personalized <span className={styles.titleAccent}>Assistance at Every Step</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Each international patient is assigned a dedicated care manager to coordinate appointments and provide continuous support.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Coordinating appointments and treatments",
                    "Assisting with documentation and communication",
                    "Providing continuous support throughout your journey",
                  ].map((role, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{role}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>A single point of contact for a seamless experience.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/medical-tourism/care.png" 
                    alt="Patient Care Managers" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 6. Pre & Post Treatment Virtual Consultations */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Video size={16} />
                  <span>Pre & Post Treatment Virtual Consultations</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Connect with <span className={styles.titleAccent}>Experts from Anywhere</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer virtual consultations before and after your visit to ensure continuity of care and ongoing guidance.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Initial evaluation before travel",
                    "Follow-up consultations after treatment",
                    "Ongoing guidance and support",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Stay connected with your doctor, anytime, anywhere.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/medical-tourism/virtual.png" 
                    alt="Virtual Consultations" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 7. Cost-Effective World-Class Treatments */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>Cost-Effective World-Class Treatments</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Premium Care at <span className={styles.titleAccent}>Affordable Costs</span>
                </h2>
                <p className={styles.aboutDescription}>
                  India is a global destination for high-quality healthcare, and we ensure the best value with international medical protocols.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Significant cost savings compared to international markets",
                    "Advanced FDA-approved & CE-certified technologies",
                    "International-standard medical protocols",
                  ].map((advantage, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{advantage}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Get world-class treatment without financial burden.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/medical-tourism/cost.png" 
                    alt="Cost-Effective Treatments" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Why Choose Section */}
        <section className={styles.whyChooseSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Why Choose Celeb Aesthetica for Medical Tourism?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Globe size={24} />, text: "Complete end-to-end international patient support" },
                { icon: <Microscope size={24} />, text: "AI-powered diagnosis and advanced technologies" },
                { icon: <Users size={24} />, text: "Expert multidisciplinary medical team" },
                { icon: <Hotel size={24} />, text: "Premium hospitality and comfortable stay arrangements" },
                { icon: <Shield size={24} />, text: "Transparent pricing and cost-effective packages" },
                { icon: <Activity size={24} />, text: "Seamless experience from arrival to recovery" },
              ].map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section — Newsletter Style */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>
                Plan Your Treatment Journey Today
              </h2>
              <p className={styles.ctaDescription}>
                Travel to India with confidence and experience advanced, affordable, and personalized healthcare at Celeb Aesthetica.
              </p>
              <div className={styles.ctaBtnRow}>
                <Link href="/contact" className={styles.ctaButtonWhite}>
                  <Calendar size={18} /> Schedule Your Consultation
                </Link>
              </div>
            </div>
            <div className={styles.ctaImageWrapper}>
              <Image
                src="/images/medical-tourism/hero.png"
                alt="Plan Your Journey"
                width={500}
                height={600}
                className={styles.ctaImage}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
