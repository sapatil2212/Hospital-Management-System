"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  HeartHandshake,
  Stethoscope,
  Clock,
  Award,
  Users,
  Shield,
  Target,
  TrendingUp,
  CheckCircle2,
  Cpu,
  Zap,
  Microscope,
  FlaskConical,
  Activity,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MissionSection, AboutHero, WhoWeAre } from "@/components/About-Component";
import styles from "./about.module.css";

const doctors = [
  {
    name: "Dr. Rutuja",
    role: "Chief Executive Officer",
    specialty: "Dental & Aesthetic Expert",
    description: "A highly skilled dental and aesthetic expert with extensive experience in smile designing and cosmetic dentistry. She specializes in implantology, root canal treatments, and clear aligner therapy (Invisalign).",
    color: "#0E898F",
    bgColor: "#E6F4F4",
  },
  {
    name: "Dr. Sandiip Jaibhave",
    role: "Managing Director",
    specialty: "Oncology & Aesthetic Medicine",
    description: "A dynamic medical professional with versatile clinical experience across HNF oncology, cosmetic dermatology, trichology, aesthetic medicine, and Lasers.",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
];

const features = [
  {
    icon: <Cpu size={28} />,
    title: "AI-Based Diagnosis",
    description: "Latest AI-powered machines for skin, hair, and dental diagnosis.",
    color: "#0E898F",
    bgColor: "#E6F4F4",
  },
  {
    icon: <Zap size={28} />,
    title: "Modular OT",
    description: "India's first dental surgery in a fully equipped modular operation theatre.",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
  {
    icon: <Microscope size={28} />,
    title: "In-House Lab",
    description: "Advanced dental, pharmacy, and pathology labs for complete care.",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
  {
    icon: <Activity size={28} />,
    title: "Patient First",
    description: "Ethical and transparent practices with personalized recovery care.",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
  },
];

export default function AboutPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const ref2 = useRef(null);
  const isInView2 = useInView(ref2, { once: true, margin: "-100px" });
  const ref3 = useRef(null);
  const isInView3 = useInView(ref3, { once: true, margin: "-100px" });
  const ref4 = useRef(null);
  const isInView4 = useInView(ref4, { once: true, margin: "-100px" });

  return (
    <>
      <Navbar />
      <main>
        {/* About Hero Banner */}
        <div className="container">
          <AboutHero />
        </div>

        {/* Who We Are Section */}
        <WhoWeAre />

        {/* New Mission Section Component */}
        <MissionSection />

        {/* Mission Section */}
        <section className={styles.section} ref={ref}>
          <div className={`container ${styles.missionGrid}`}>
            <motion.div
              className={styles.missionImage}
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src="/images/about-team.png"
                  alt="Celeb Aesthecia Medical Team"
                  width={560}
                  height={420}
                  className={styles.image}
                />
              </div>
            </motion.div>
            <motion.div
              className={styles.missionContent}
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="section-title">
                Our <span className={styles.accent}>Philosophy</span>
              </h2>
              <p className={styles.missionText}>
                At Celeb Aesthecia, we believe in ethical and transparent medical practice. We prioritize a patient-first approach with personalized care, delivering natural, safe, and long-lasting results in a premium healing environment.
              </p>
              <div className={styles.checkList}>
                {[
                  "AI-based precision diagnosis & investigation",
                  "Modular OT for maximum infection control",
                  "FDA-approved & CE-certified technologies",
                  "Expert medical team for specialized domains",
                ].map((item) => (
                  <div key={item} className={styles.checkItem}>
                    <div className={styles.checkIconWrapper}>
                      <CheckCircle2 size={16} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Meet Our Doctors */}
        <section className={styles.doctorsSection} ref={ref4}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView4 ? { opacity: 1, y: 0 } : {}}
            >
              <h2 className="section-title">
                Meet Our <span className={styles.accent}>Experts</span>
              </h2>
              <p className="section-subtitle">
                The visionary leaders behind India's most advanced aesthetic hospital.
              </p>
            </motion.div>
            <div className={styles.doctorsGrid}>
              {doctors.map((doctor, i) => (
                <motion.div
                  key={doctor.name}
                  className={styles.doctorCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView4 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className={styles.doctorHeader} style={{ background: doctor.bgColor }}>
                    <Users size={40} color={doctor.color} />
                  </div>
                  <div className={styles.doctorContent}>
                    <h3 className={styles.doctorName}>{doctor.name}</h3>
                    <span className={styles.doctorRole} style={{ color: doctor.color }}>{doctor.role}</span>
                    <span className={styles.doctorSpecialty}>{doctor.specialty}</span>
                    <p className={styles.doctorDesc}>{doctor.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Stand Apart */}
        <section className={styles.valuesSection} ref={ref2}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView2 ? { opacity: 1, y: 0 } : {}}
            >
              <h2 className="section-title">
                Why <span className={styles.accent}>Celeb Aesthecia</span>
              </h2>
              <p className="section-subtitle">
                Pioneering the future of aesthetic healthcare in India.
              </p>
            </motion.div>
            <div className={styles.valuesGrid}>
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className={styles.valueCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView2 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <div
                    className={styles.valueIcon}
                    style={{ background: f.bgColor, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <h3 className={styles.valueTitle}>{f.title}</h3>
                  <p className={styles.valueDesc}>{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Infrastructure */}
        <section className={styles.infraSection} ref={ref3}>
          <div className="container">
            <div className={styles.infraHeader}>
              <h2 className="section-title">
                World-Class <span className={styles.accent}>Infrastructure</span>
              </h2>
              <p className={styles.infraSubtext}>
                Complete in-house care with surgical-grade hygiene and advanced diagnostics.
              </p>
            </div>
            <div className={styles.infraGrid}>
              {[
                "Dedicated CBCT & OPG X-ray Room",
                "Advanced Dental Laboratory",
                "In-House Pharmacy & Pathology",
                "3-Bedded Recovery Room",
                "Modular Operation Theatre",
                "B-Class Autoclave System",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  className={styles.infraItem}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CheckCircle2 size={20} className={styles.infraIcon} />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


      </main>
      <Footer />
    </>
  );
}
