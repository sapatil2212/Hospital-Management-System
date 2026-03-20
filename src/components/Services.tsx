"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  HeartPulse,
  Brain,
  Sparkles,
  Bone,
  Baby,
  Eye,
  ArrowRight,
} from "lucide-react";
import styles from "./Services.module.css";

const services = [
  {
    icon: <HeartPulse size={28} />,
    title: "Cardiology",
    description:
      "Comprehensive heart care including diagnostics, treatment, and preventive cardiology with state-of-the-art technology.",
    color: "#EF4444",
    bgColor: "#FEE2E2",
    gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
  },
  {
    icon: <Brain size={28} />,
    title: "Neurology",
    description:
      "Expert neurological care for brain and nervous system conditions with advanced diagnostic and treatment options.",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
    gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
  },
  {
    icon: <Sparkles size={28} />,
    title: "Dermatology",
    description:
      "Advanced skin care treatments, cosmetic dermatology, and medical solutions for all skin conditions.",
    color: "#EC4899",
    bgColor: "#FCE7F3",
    gradient: "linear-gradient(135deg, #EC4899, #DB2777)",
  },
  {
    icon: <Bone size={28} />,
    title: "Orthopedics",
    description:
      "Specialized care for bones, joints, and muscles. From sports injuries to joint replacements.",
    color: "#F97316",
    bgColor: "#FFF7ED",
    gradient: "linear-gradient(135deg, #F97316, #EA580C)",
  },
  {
    icon: <Baby size={28} />,
    title: "Pediatrics",
    description:
      "Compassionate healthcare for children from newborn to adolescence. Vaccinations, checkups, and specialized care.",
    color: "#10B981",
    bgColor: "#D1FAE5",
    gradient: "linear-gradient(135deg, #10B981, #059669)",
  },
  {
    icon: <Eye size={28} />,
    title: "Ophthalmology",
    description:
      "Complete eye care including vision testing, treatment of eye diseases, and advanced surgical procedures.",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className={styles.services} ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            <HeartPulse size={16} />
            Our Services
          </span>
          <h2 className="section-title">
            Healthcare Services <br />
            <span className={styles.titleAccent}>We Provide</span>
          </h2>
          <p className="section-subtitle">
            We offer a wide range of medical services designed to meet your
            healthcare needs with the highest standards of medical excellence.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className={styles.grid}>
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <div
                className={styles.cardIcon}
                style={{ background: service.bgColor, color: service.color }}
              >
                {service.icon}
              </div>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDesc}>{service.description}</p>
              <a href="#" className={styles.cardLink} style={{ color: service.color }}>
                Learn More <ArrowRight size={16} />
              </a>

              {/* Hover gradient overlay */}
              <div
                className={styles.cardOverlay}
                style={{ background: service.gradient }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
