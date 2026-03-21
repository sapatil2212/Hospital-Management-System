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
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./about.module.css";

const values = [
  {
    icon: <HeartHandshake size={28} />,
    title: "Compassion",
    description: "We treat every patient with empathy, dignity, and respect.",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  {
    icon: <Shield size={28} />,
    title: "Integrity",
    description: "Transparent, honest communication in every interaction.",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
  {
    icon: <Target size={28} />,
    title: "Excellence",
    description: "Striving for the highest standards in medical care.",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
  {
    icon: <TrendingUp size={28} />,
    title: "Innovation",
    description: "Embracing cutting-edge technology for better outcomes.",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
  },
];

const milestones = [
  { year: "2010", event: "Founded with a vision for accessible healthcare" },
  { year: "2014", event: "Expanded to 5 locations across the country" },
  { year: "2017", event: "Launched telemedicine platform for remote care" },
  { year: "2020", event: "Reached 10M+ patients milestone" },
  { year: "2023", event: "Introduced AI-powered diagnostics" },
  { year: "2026", event: "Serving 30M+ patients with 500+ specialists" },
];



export default function AboutPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const ref2 = useRef(null);
  const isInView2 = useInView(ref2, { once: true, margin: "-100px" });
  const ref3 = useRef(null);
  const isInView3 = useInView(ref3, { once: true, margin: "-100px" });

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className={styles.pageHero}>
          <div className="container">
            <motion.div
              className={styles.heroContent}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label">
                <HeartHandshake size={16} />
                About MediCare+
              </span>
              <h1 className={styles.heroTitle}>
                Professionals Dedicated to Your{" "}
                <span className={styles.accent}>Health</span>
              </h1>
              <p className={styles.heroSubtext}>
                Since 2010, we've been committed to transforming healthcare with
                compassion, innovation, and excellence. Our team of 500+
                specialists serves over 30 million patients worldwide.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className={styles.section} ref={ref}>
          <div className={`container ${styles.missionGrid}`}>
            <motion.div
              className={styles.missionImage}
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Image
                src="/images/about-team.png"
                alt="Medical team at MediCare+"
                width={560}
                height={420}
                className={styles.image}
              />
            </motion.div>
            <motion.div
              className={styles.missionContent}
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="section-title">
                Our <span className={styles.accent}>Mission</span>
              </h2>
              <p className={styles.missionText}>
                To make world-class healthcare accessible, affordable, and
                personalized for everyone. We believe every person deserves the
                best medical care, regardless of background or location.
              </p>
              <div className={styles.checkList}>
                {[
                  "Patient-centered approach to every treatment",
                  "Cutting-edge technology and equipment",
                  "24/7 emergency and telehealth services",
                  "Affordable care without compromising quality",
                ].map((item) => (
                  <div key={item} className={styles.checkItem}>
                    <CheckCircle2 size={18} className={styles.checkIcon} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className={styles.valuesSection} ref={ref2}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView2 ? { opacity: 1, y: 0 } : {}}
            >
              <h2 className="section-title">
                Our Core <span className={styles.accent}>Values</span>
              </h2>
              <p className="section-subtitle" style={{ textAlign: "center", margin: "0 auto" }}>
                The principles that guide everything we do.
              </p>
            </motion.div>
            <div className={styles.valuesGrid}>
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  className={styles.valueCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView2 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <div
                    className={styles.valueIcon}
                    style={{ background: v.bgColor, color: v.color }}
                  >
                    {v.icon}
                  </div>
                  <h3 className={styles.valueTitle}>{v.title}</h3>
                  <p className={styles.valueDesc}>{v.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className={styles.section} ref={ref3}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView3 ? { opacity: 1, y: 0 } : {}}
            >
              <h2 className="section-title">
                Our <span className={styles.accent}>Journey</span>
              </h2>
            </motion.div>
            <div className={styles.timeline}>
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  className={styles.timelineItem}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  animate={isInView3 ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={styles.timelineYear}>{m.year}</div>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineEvent}>{m.event}</div>
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
