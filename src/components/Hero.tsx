"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Calendar,
  Search,
  HeartPulse,
  Users,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppointment } from "./AppointmentProvider";
import styles from "./Hero.module.css";

const slides = [
  {
    headline: "Comprehensive Care for",
    headlineAccent: "General Health",
    headlineSuffix: "Needs",
    subtext:
      "Expert general OPD services prioritizing your everyday wellness and routine medical needs with compassionate care.",
    image: "/images/treatment-opd-2.png",
    imageAlt: "General OPD Consultation",
  },
  {
    headline: "Advanced Care for",
    headlineAccent: "Dental",
    headlineSuffix: "Health",
    subtext:
      "Modern and painless dentistry for all ages. From routine check-ups to advanced treatments by experienced specialists.",
    image: "/images/treatment-dental-2.png",
    imageAlt: "Dental Care Consultation",
  },
  {
    headline: "Specialized Treatments for",
    headlineAccent: "Skin & Hair",
    headlineSuffix: "Health",
    subtext:
      "Trusted dermatology services, from cosmetic solutions to clinical treatments, leaving you with healthy, glowing skin.",
    image: "/images/treatment-dermatology-2.png",
    imageAlt: "Dermatology Specialist",
  },
  {
    headline: "Transformative & Compassionate",
    headlineAccent: "Cancer Care",
    headlineSuffix: "Therapy",
    subtext:
      "Advanced oncology care offering early detection, personalized therapy plans, and unwavering support for cancer patients.",
    image: "/images/treatment-cancer-2.png",
    imageAlt: "Cancer Care Treatment",
  },
  {
    headline: "Prioritizing Your",
    headlineAccent: "Heart Health",
    headlineSuffix: "Every Day",
    subtext:
      "State-of-the-art cardiology treatments and dedicated heart specialists to protect your cardiovascular wellness.",
    image: "/images/treatment-cardiology-2.png",
    imageAlt: "Cardiology and Heart Health",
  },
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <HeartPulse size={16} />
            <span>Your Health, Our Priority</span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <button
              onClick={openAppointment}
              className={`btn btn-primary btn-sm ${styles.ctaPrimary}`}
            >
              <Calendar size={16} />
              Schedule Appointment
            </button>
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
              <strong>Google Rating 5.0</strong>
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

            <div className={styles.doctorInfo}>
              <span className={styles.doctorCount}>
                Expert Care Team
              </span>
              <span className={styles.doctorSub}>Available 24/7</span>
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
              <div className={styles.satisfiedCount}>10k+</div>
              <div className={styles.satisfiedLabel}>Happy Patients</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
