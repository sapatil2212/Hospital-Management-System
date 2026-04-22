"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useAppointment } from "@/components/AppointmentProvider";
import styles from "./treatments.module.css";

interface CTASectionProps {
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export default function CTASection({
  title = "Start Your Transformation <br /> with Expert Care",
  description = "Book your consultation today and experience advanced, ethical, and personalized treatment designed for your health, confidence, and long-term results.",
  imageSrc = "/images/home-cta.webp",
  imageAlt = "Healthcare professional",
}: CTASectionProps) {
  const { openAppointment } = useAppointment();

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <div className={styles.ctaContent}>
          <h2
            className={styles.ctaTitle}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className={styles.ctaDescription}>{description}</p>
          <div className={styles.ctaBtnRow}>
            <button
              type="button"
              className={styles.ctaButtonWhite}
              onClick={openAppointment}
            >
              Book Appointment Now
              <ArrowRight size={18} className={styles.ctaButtonIcon} />
            </button>
          </div>
        </div>
        <div className={styles.ctaImageWrapper}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={500}
            height={600}
            className={styles.ctaImage}
            priority
          />
        </div>
      </div>
    </section>
  );
}
