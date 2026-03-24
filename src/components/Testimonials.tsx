"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Award } from "lucide-react";
import styles from "./Testimonials.module.css";

const testimonials = [
  {
    name: "Jessica Thompson",
    role: "Heart Surgery Patient",
    avatar: "JT",
    color: "#0E898F",
    rating: 5,
    text: "The care I received at MediCare+ was exceptional. From my initial consultation to post-surgery recovery, every step was handled with professionalism and genuine compassion. Dr. Chen and her team saved my life.",
  },
  {
    name: "Robert Martinez",
    role: "Neurology Patient",
    avatar: "RM",
    color: "#8B5CF6",
    rating: 5,
    text: "After struggling with chronic migraines for years, the neurology team at MediCare+ finally found a treatment that works. The staff is incredibly knowledgeable and made me feel comfortable throughout the process.",
  },
  {
    name: "Amanda Williams",
    role: "Pediatrics Patient",
    avatar: "AW",
    color: "#10B981",
    rating: 5,
    text: "As a parent, finding the right pediatrician is crucial. The pediatrics team at MediCare+ has been wonderful with my children. They are patient, thorough, and truly care about our family's well-being.",
  },
];

const trustLogos = [
  "WHO Certified",
  "ISO 9001",
  "NABH Accredited",
  "JCI International",
  "HIPAA Compliant",
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((p) => (p + 1) % testimonials.length);
  const prev = () =>
    setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length);

  return (
    <section className={styles.testimonials} ref={ref}>
      <div className="container">
        {/* Trust Logos */}
        <motion.div
          className={styles.trustBar}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.trustLabel}>Trusted By</span>
          <div className={styles.trustLogos}>
            {trustLogos.map((logo) => (
              <div key={logo} className={styles.trustLogo}>
                <Award size={18} />
                <span>{logo}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          className={styles.testimonialSection}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.header}>
            <span className="section-label">
              <Star size={16} />
              Testimonials
            </span>
            <h2 className="section-title">
              What Our <span className={styles.titleAccent}>Patients</span> Say
            </h2>
          </div>

          <div className={styles.slider}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                className={styles.testimonialCard}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.quoteIcon}>
                  <Quote size={32} />
                </div>

                <p className={styles.testimonialText}>
                  {testimonials[current].text}
                </p>

                <div className={styles.stars}>
                  {Array.from({ length: testimonials[current].rating }).map(
                    (_, i) => (
                      <Star key={i} size={18} fill="#F59E0B" color="#F59E0B" />
                    )
                  )}
                </div>

                <div className={styles.author}>
                  <div
                    className={styles.authorAvatar}
                    style={{
                      background: `linear-gradient(135deg, ${testimonials[current].color}, ${testimonials[current].color}cc)`,
                    }}
                  >
                    {testimonials[current].avatar}
                  </div>
                  <div>
                    <div className={styles.authorName}>
                      {testimonials[current].name}
                    </div>
                    <div className={styles.authorRole}>
                      {testimonials[current].role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className={styles.controls}>
              <button className={styles.controlBtn} onClick={prev} aria-label="Previous">
                <ChevronLeft size={20} />
              </button>
              <div className={styles.dots}>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${
                      i === current ? styles.dotActive : ""
                    }`}
                    onClick={() => setCurrent(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button className={styles.controlBtn} onClick={next} aria-label="Next">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
