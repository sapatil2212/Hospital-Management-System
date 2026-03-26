"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import styles from "./WhoWeAre.module.css";

export default function WhoWeAre() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={styles.whoWeAreSection} ref={ref}>
      <div className={`container ${styles.container}`}>
        {/* Left Side - Image */}
        <motion.div
          className={styles.imageSection}
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.imageWrapper}>
            <Image
              src="/images/about-team.png"
              alt="Medical Team with Patient"
              width={480}
              height={380}
              className={styles.mainImage}
            />

            {/* Rotating Experience Badge */}
            <motion.div
              className={styles.experienceBadge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className={styles.badgeInner}>
                <span className={styles.badgeNumber}>10+</span>
                <div className={styles.badgeText}>
                  <svg viewBox="0 0 140 140">
                    <defs>
                      <path
                        id="circlePath"
                        d="M 70, 70 m -55, 0 a 55,55 0 1,1 110,0 a 55,55 0 1,1 -110,0"
                      />
                    </defs>
                    <text>
                      <textPath href="#circlePath" startOffset="0%">
                        YEARS OF EXPERIENCE • YEARS OF EXPERIENCE •
                      </textPath>
                    </text>
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Content */}
        <motion.div
          className={styles.contentSection}
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className={styles.sectionBadge}>Who we are</span>

          <h2 className={styles.mainHeading}>
            About <span className={styles.headingAccent}>Celeb Aesthecia</span>
          </h2>

          <p className={styles.description}>
            We are dedicated to delivering exceptional healthcare services with 
            compassion and expertise. With a commitment to patient-centered care, 
            our team of healthcare professionals strives to provide comprehensive 
            medical treatments tailored to individual needs.
          </p>

          <Link href="/treatments" className={styles.ctaButton}>
            Learn more
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
