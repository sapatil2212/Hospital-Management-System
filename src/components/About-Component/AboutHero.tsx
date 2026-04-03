"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Award,
  Heart,
} from "lucide-react";
import Image from "next/image";
import styles from "./AboutHero.module.css";

const features = [
  {
    icon: <ShieldCheck size={20} />,
    text: "Enhanced patient safety",
    variant: "safety",
  },
  {
    icon: <Award size={20} />,
    text: "Highly qualified nurses",
    variant: "qualified",
  },
  {
    icon: <Heart size={20} />,
    text: "Personal care",
    variant: "personal",
  },
];

export default function AboutHero() {
  return (
    <section className={styles.heroSection}>
      {/* Background Image */}
      <Image
        src="/about/about-hero.webp"
        alt="about-hero-image"
        fill
        className={styles.heroBackground}
        priority
      />

      {/* Overlay */}
      <div className={styles.heroOverlay} />

      {/* Content Container for Padding/Layout */}
      <div className={styles.heroInner}>
        {/* Content */}
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
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
            At Nursing Care, we understand the importance of compassionate care that goes 
            beyond just medical assistance
          </motion.p>
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
      </div>
    </section>
  );
}
