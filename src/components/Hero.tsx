"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Calendar,
  Search,
  HeartPulse,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useAppointment } from "./AppointmentProvider";
import styles from "./Hero.module.css";

const slides = [
  {
    headline: "Trusted Specialist for",
    headlineAccent: "Every Medical",
    headlineSuffix: "Need",
    subtext:
      "Experience healthcare you can trust. Our dedicated team provides compassionate, high-quality care with cutting-edge technology and personalized treatment plans.",
    image: "/images/hero-dental.png",
    imageAlt: "Doctor providing medical consultation",
  },
  {
    headline: "Advanced Care with",
    headlineAccent: "Modern Technology",
    headlineSuffix: "& Innovation",
    subtext:
      "Leveraging AI diagnostics, telemedicine, and digital health records to deliver faster, smarter, and more precise medical care for every patient.",
    image: "/images/hero-doctor2.png",
    imageAlt: "Doctor with modern medical technology",
  },
  {
    headline: "Your Wellness is Our",
    headlineAccent: "Top Priority",
    headlineSuffix: "Always",
    subtext:
      "From preventive checkups to complex surgeries, our 500+ specialists are here 24/7 to keep you and your family in the best of health.",
    image: "/images/hero-doctor3.png",
    imageAlt: "Healthcare professional caring for patient",
  },
];

const doctors = [
  { name: "Dr. Sarah", color: "#3B82F6" },
  { name: "Dr. James", color: "#10B981" },
  { name: "Dr. Emily", color: "#8B5CF6" },
  { name: "Dr. Michael", color: "#F59E0B" },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 3000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = slides[current];
  const { openAppointment } = useAppointment();

  return (
    <section id="home" className={styles.hero}>
      {/* Background decorations */}
      <div className={styles.bgDecor1} />
      <div className={styles.bgDecor2} />
      <div className={styles.bgDecor3} />

      <div className={`container ${styles.heroInner}`}>
        {/* Left Content */}
        <div className={styles.heroContent}>
          <motion.div
            className={styles.badge}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <HeartPulse size={16} />
            <span>Your Health, Our Priority</span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className={styles.headline}>
                {slide.headline}{" "}
                <span className={styles.headlineAccent}>
                  {slide.headlineAccent}
                </span>{" "}
                {slide.headlineSuffix}
              </h1>

              <p className={styles.subtext}>{slide.subtext}</p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className={styles.ctaGroup}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <button
              onClick={openAppointment}
              className={`btn btn-primary btn-sm ${styles.ctaPrimary}`}
            >
              <Calendar size={16} />
              Schedule Appointment
            </button>
            <a
              href="/treatments"
              className={`btn btn-secondary btn-sm ${styles.ctaSecondary}`}
            >
              <Search size={16} />
              Find Doctor
            </a>
          </motion.div>

          {/* Progress Dots */}
          <div className={styles.slideDots}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={`${styles.slideDot} ${i === current ? styles.slideDotActive : ""
                  }`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Google Rating */}
          <motion.div
            className={styles.ratingRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
              ))}
            </div>
            <span className={styles.ratingText}>
              <strong>Google Rating 5.0</strong> ★★★★★ Based On 500 Reviews
            </span>
          </motion.div>
        </div>

        {/* Right - Image Carousel + Floating Cards */}
        <div className={styles.heroVisual}>
          {/* Image Carousel */}
          <div className={styles.imageWrapper}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`image-${current}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={styles.imageSlide}
              >
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  width={580}
                  height={640}
                  className={styles.heroImage}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Card: Doctors */}
          <motion.div
            className={`${styles.floatingCard} ${styles.doctorsCard}`}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={styles.doctorAvatars}>
              {doctors.map((doc, i) => (
                <div
                  key={doc.name}
                  className={styles.avatar}
                  style={{
                    background: `linear-gradient(135deg, ${doc.color}, ${doc.color}dd)`,
                    zIndex: 4 - i,
                    marginLeft: i > 0 ? "-8px" : "0",
                  }}
                >
                  {doc.name.charAt(4)}
                </div>
              ))}
            </div>
            <div className={styles.doctorInfo}>
              <span className={styles.doctorCount}>
                Talk to our 48+ Doctors
              </span>
              <span className={styles.doctorSub}>Online now</span>
            </div>
          </motion.div>

          {/* Floating Card: Satisfied Clients */}
          <motion.div
            className={`${styles.floatingCard} ${styles.satisfiedCard}`}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            <div className={styles.satisfiedIcon}>
              <Users size={20} />
            </div>
            <div>
              <div className={styles.satisfiedCount}>3500+</div>
              <div className={styles.satisfiedLabel}>Satisfied Clients</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
