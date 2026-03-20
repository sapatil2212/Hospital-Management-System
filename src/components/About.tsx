"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  HeartHandshake,
  Stethoscope,
  Clock,
  ArrowRight,
  CheckCircle2,
  Video,
} from "lucide-react";
import Image from "next/image";
import styles from "./About.module.css";

const features = [
  {
    icon: <HeartHandshake size={24} />,
    title: "Patient-Centered Care",
    description:
      "Putting you at the heart of everything we do. Our patient-centered approach ensures personalized treatment.",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  {
    icon: <Stethoscope size={24} />,
    title: "Specialist Doctors",
    description:
      "Access to over 500+ board-certified specialists across every medical discipline.",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
  {
    icon: <Clock size={24} />,
    title: "24 Hours Service",
    description:
      "Round-the-clock emergency and consultation services. We're here when you need us most.",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
];

const hours = [
  { day: "Mon To Fri", time: "09:30 – 07:30", active: true },
  { day: "Saturday", time: "10:30 – 5:00", active: true },
  { day: "Sunday", time: "Closed", active: false },
];

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className={styles.about} ref={ref}>
      <div className={`container ${styles.aboutInner}`}>
        {/* Left Content */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">
            <HeartHandshake size={16} />
            About Us
          </span>

          <h2 className="section-title">
            Professionals dedicated <br />
            to your <span className={styles.titleAccent}>health</span>
          </h2>

          <p className={styles.description}>
            Our team of skilled professionals is committed to providing
            personalized, compassionate care. With a focus on innovation and
            excellence, we deliver healthcare solutions that make a difference.
          </p>

          {/* Features */}
          <div className={styles.features}>
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className={styles.featureItem}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              >
                <div
                  className={styles.featureIcon}
                  style={{ background: feature.bgColor, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <div className={styles.featureText}>
                  <h4 className={styles.featureTitle}>{feature.title}</h4>
                  <p className={styles.featureDesc}>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.a
            href="#services"
            className={`btn btn-primary ${styles.aboutCta}`}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
          >
            View More About Us
            <ArrowRight size={18} />
          </motion.a>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.imageGrid}>
            <div className={styles.mainImage}>
              <Image
                src="/images/about-team.png"
                alt="Medical team providing care"
                width={480}
                height={540}
                className={styles.aboutImage}
              />
              {/* Video Call Badge */}
              <div className={styles.videoBadge}>
                <Video size={16} />
                <span>Video Call Support</span>
              </div>
            </div>
          </div>

          {/* Opening Hours Card */}
          <motion.div
            className={styles.hoursCard}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={styles.hoursHeader}>
              <Clock size={20} />
              <h4>Opening Hours</h4>
            </div>
            <div className={styles.hoursList}>
              {hours.map((h) => (
                <div key={h.day} className={styles.hoursRow}>
                  <span className={styles.hoursDay}>{h.day}</span>
                  <span
                    className={`${styles.hoursTime} ${
                      !h.active ? styles.closed : ""
                    }`}
                  >
                    {h.time}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
