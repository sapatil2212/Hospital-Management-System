"use client";

import { motion } from "framer-motion";
import { ArrowRight, Stethoscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { treatments } from "./treatmentData";
import styles from "./treatments.module.css";

export default function TreatmentsPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
        <section className={styles.pageHero}>
          <div className="container">
            <motion.div
              className={styles.heroContent}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label">
                <Stethoscope size={16} />
                Our Treatments
              </span>
              <h1 className={styles.heroTitle}>
                Specialized <span className={styles.accent}>Treatments</span>{" "}
                for Every Need
              </h1>
              <p className={styles.heroSubtext}>
                From general check-ups to advanced specialty care, we offer
                comprehensive treatment options delivered by world-class
                medical professionals.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Treatments List */}
        <section className={styles.section}>
          <div className="container">
            {treatments.map((t, i) => {
              const IconComp = t.icon;
              const isReversed = i % 2 !== 0;

              return (
                <motion.div
                  key={t.slug}
                  className={`${styles.treatmentRow} ${
                    isReversed ? styles.reversed : ""
                  }`}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {/* Image Side */}
                  <div className={styles.imageCol}>
                    <div className={styles.imageFrame}>
                      <Image
                        src={t.image}
                        alt={t.fullTitle}
                        width={540}
                        height={380}
                        className={styles.treatmentImage}
                      />
                      <div
                        className={styles.imageBadge}
                        style={{ background: t.color }}
                      >
                        <IconComp size={22} color="white" />
                      </div>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className={styles.contentCol}>
                    <div
                      className={styles.iconPill}
                      style={{ background: t.bgColor, color: t.color }}
                    >
                      <IconComp size={18} />
                      <span>{t.label}</span>
                    </div>
                    <h2 className={styles.treatmentTitle}>{t.fullTitle}</h2>
                    <p className={styles.treatmentDesc}>{t.heroDesc}</p>

                    <div className={styles.featureList}>
                      {t.features.slice(0, 4).map((f) => (
                        <div key={f} className={styles.featureItem}>
                          <div
                            className={styles.featureDot}
                            style={{ background: t.color }}
                          />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/treatments/${t.slug}`}
                      className={`btn btn-primary ${styles.learnMoreBtn}`}
                      style={{
                        background: `linear-gradient(135deg, ${t.color}, ${t.color}dd)`,
                      }}
                    >
                      Learn More <ArrowRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
