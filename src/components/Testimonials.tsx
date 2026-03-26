"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import styles from "./Testimonials.module.css";

interface Testimonial {
  id: number;
  name: string;
  treatment: string;
  rating: number;
  text: string;
  avatar: string;
  color: string;
  verified: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Priya Sharma",
    treatment: "Cardiology Care",
    rating: 5,
    text: "The cardiac team here saved my father's life. From emergency admission to successful bypass surgery, every doctor and nurse showed exceptional care. The 24/7 monitoring and post-operative care was outstanding.",
    avatar: "PS",
    color: "#0E898F",
    verified: true,
  },
  {
    id: 2,
    name: "Rahul Verma",
    treatment: "Orthopedic Surgery",
    rating: 5,
    text: "After my knee replacement surgery, I'm walking pain-free for the first time in years. Dr. Patel and his team used the latest techniques and the recovery was faster than expected. Highly recommended!",
    avatar: "RV",
    color: "#8B5CF6",
    verified: true,
  },
  {
    id: 3,
    name: "Anita Desai",
    treatment: "Dermatology",
    rating: 5,
    text: "I struggled with severe acne for years. The dermatology department provided a comprehensive treatment plan that transformed my skin and my confidence. The doctors truly understand their patients' concerns.",
    avatar: "AD",
    color: "#10B981",
    verified: true,
  },
  {
    id: 4,
    name: "Vikram Singh",
    treatment: "Dental Implants",
    rating: 5,
    text: "Got full mouth dental implants done here. The procedure was painless and the results are amazing. The dental team explained everything clearly and made sure I was comfortable throughout the process.",
    avatar: "VS",
    color: "#F59E0B",
    verified: true,
  },
  {
    id: 5,
    name: "Meera Kapoor",
    treatment: "Maternity Care",
    rating: 5,
    text: "Delivered my baby here and it was the best decision. The maternity ward is state-of-the-art, the nurses are incredibly supportive, and the doctors made me feel safe throughout my pregnancy journey.",
    avatar: "MK",
    color: "#EC4899",
    verified: true,
  },
  {
    id: 6,
    name: "Arjun Patel",
    treatment: "Neurology",
    rating: 5,
    text: "After suffering from chronic migraines for years, the neurology team finally diagnosed and treated my condition effectively. Their advanced diagnostic equipment and expertise made all the difference.",
    avatar: "AP",
    color: "#6366F1",
    verified: true,
  },
  {
    id: 7,
    name: "Sneha Gupta",
    treatment: "Pediatric Care",
    rating: 5,
    text: "Finding a good pediatrician is every parent's priority. The children's department here is fantastic - child-friendly environment, patient doctors, and they always explain everything in a way kids understand.",
    avatar: "SG",
    color: "#14B8A6",
    verified: true,
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < rating ? styles.starFilled : styles.starEmpty}
        fill={i < rating ? "#F59E0B" : "none"}
      />
    ));
  };

  const GoogleLogo = () => (
    <div className={styles.googleLogo}>
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>Google</span>
    </div>
  );

  return (
    <section className={styles.testimonials} ref={ref}>
      <div className="container">
        <motion.div
          className={styles.mainCard}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.badge}>
              <Star size={14} fill="currentColor" />
              <span>Patient Testimonials</span>
            </div>

            <h2 className={styles.title}>
              What Our <span className={styles.titleAccent}>Valued Patients</span> Say About Us
            </h2>

            <p className={styles.subtitle}>
              Real experiences from our valued patients who trust us for exceptional healthcare and life-changing treatments
            </p>
          </div>

          {/* Carousel */}
          <div className={styles.carouselWrapper}>
            {/* Fade Gradients */}
            <div className={styles.fadeLeft} />
            <div className={styles.fadeRight} />

            {/* Navigation Arrows */}
            <button
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next testimonials"
            >
              <ChevronRight size={20} />
            </button>

            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              centeredSlides={true}
              loop={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              speed={800}
              breakpoints={{
                480: {
                  slidesPerView: 1.2,
                  spaceBetween: 16,
                },
                640: {
                  slidesPerView: 1.4,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 1.8,
                  spaceBetween: 24,
                },
                1024: {
                  slidesPerView: 2.2,
                  spaceBetween: 28,
                },
                1280: {
                  slidesPerView: 2.5,
                  spaceBetween: 32,
                },
              }}
              onSwiper={(swiper: SwiperType) => {
                swiperRef.current = swiper;
              }}
              className={styles.swiper}
            >
              {testimonials.map((testimonial) => (
                <SwiperSlide key={testimonial.id}>
                  <div className={styles.testimonialCard}>
                    {/* Quote Icon */}
                    <div className={styles.quoteIcon}>
                      <Quote size={24} />
                    </div>

                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarWrapper}>
                        <div
                          className={styles.authorAvatar}
                          style={{
                            background: `linear-gradient(135deg, ${testimonial.color}, ${testimonial.color}dd)`,
                          }}
                        >
                          {testimonial.avatar}
                        </div>
                        {testimonial.verified && (
                          <div className={styles.verifiedBadge}>
                            <Check size={8} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className={styles.authorInfo}>
                        <div className={styles.authorTop}>
                          <h4 className={styles.authorName}>{testimonial.name}</h4>
                          <div className={styles.stars}>{renderStars(testimonial.rating)}</div>
                        </div>
                        <p className={styles.authorTreatment}>{testimonial.treatment}</p>
                      </div>
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className={styles.testimonialText}>
                      <span className={styles.quoteStart}>&ldquo;</span>
                      <span className={styles.textContent}>{testimonial.text}</span>
                      <span className={styles.quoteEnd}>&rdquo;</span>
                      <div className={styles.textFade} />
                    </blockquote>

                    {/* Card Footer */}
                    <div className={styles.cardFooter}>
                      <GoogleLogo />
                      <div className={styles.verifiedReview}>
                        <Check size={12} strokeWidth={3} />
                        <span>Verified Patient</span>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
