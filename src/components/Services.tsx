"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  HeartPulse,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Services.module.css";
import { treatments } from "@/app/treatments/treatmentData";
import { useAppointment } from "./AppointmentProvider";

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { openAppointment } = useAppointment();

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

        {/* Horizontal Cards List */}
        <div className={styles.list}>
          {treatments.map((treatment, i) => (
            <motion.div
              key={treatment.slug}
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={styles.cardImage}>
                <Image
                  src={treatment.image}
                  alt={treatment.label}
                  fill
                  className={styles.image}
                />
              </div>
              
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{treatment.label}</h3>
                <p className={styles.cardDesc}>{treatment.heroDesc}</p>
                
                <div className={styles.benefitsSection}>
                  <h4 className={styles.benefitsLabel}>Key Benefits:</h4>
                  <div className={styles.benefitsGrid}>
                    {treatment.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className={styles.benefitBadge}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <Link 
                    href={`/treatments/${treatment.slug}`}
                    className={styles.viewMoreBtn}
                  >
                    View More <ArrowRight size={14} />
                  </Link>
                  <button 
                    className={styles.bookNowBtn}
                    onClick={openAppointment}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
