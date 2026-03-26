"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Award,
  Heart,
  Cpu,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./AboutHero.module.css";

const features = [
  {
    icon: <ShieldCheck size={18} />,
    text: "AI-Powered Diagnostics",
    variant: "safety",
  },
  {
    icon: <Award size={18} />,
    text: "Board-Certified Experts",
    variant: "qualified",
  },
  {
    icon: <Heart size={18} />,
    text: "Patient-First Approach",
    variant: "personal",
  },
  {
    icon: <Cpu size={18} />,
    text: "Robotic Precision",
    variant: "technology",
  },
];

export default function AboutHero() {
  return (
    <section className={styles.heroSection}>
      {/* Background Image */}
      <Image
        src="/about/home-about.png"
        alt="Healthcare professionals providing compassionate care"
        fill
        className={styles.heroBackground}
        priority
      />

      {/* Overlay */}
      <div className={styles.heroOverlay} />

      {/* Content */}
      <motion.div
        className={styles.heroContent}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.span
          className={styles.heroBadge}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          India's First AI-Based Robotic Hospital
        </motion.span>

        <motion.h1
          className={styles.heroHeading}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Bringing heartfelt care to your doorstep
        </motion.h1>

        <motion.p
          className={styles.heroDescription}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          At Celeb Aesthecia, we understand the importance of compassionate care that goes 
          beyond just medical assistance. Our AI-powered approach ensures precision and personalized treatment.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link href="/treatments" className={styles.heroButton}>
            Learn more
          </Link>
        </motion.div>
      </motion.div>

      {/* Features Bar */}
      <motion.div
        className={styles.featuresBar}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {features.map((feature, index) => (
          <div key={index} className={styles.featureItem}>
            <div className={`${styles.featureIcon} ${styles[feature.variant]}`}>
              {feature.icon}
            </div>
            <span className={styles.featureText}>{feature.text}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
