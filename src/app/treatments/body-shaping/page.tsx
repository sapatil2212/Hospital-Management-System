import type { Metadata } from "next";
import {
  CheckCircle,
  ArrowRight,
  Calendar,
  Zap,
  Target,
  Users,
  Activity,
  Sparkles,
  Shield,
  Microscope,
  Stethoscope
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../treatments.module.css";
import BodyShapingHero from "./BodyShapingHero";

export const metadata: Metadata = {
  title: "Body Shaping & Contouring Center | Celeb Aesthetica",
  description:
    "Advanced non-surgical body contouring, fat reduction, and skin tightening at Celeb Aesthetica. Sculpt your body with precision and no downtime.",
  keywords: [
    "body shaping India",
    "fat reduction treatment",
    "cryolipolysis",
    "HIFU body sculpting",
    "skin tightening",
    "cellulite reduction",
  ],
};

export default function BodyShapingPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <BodyShapingHero />

        {/* 1. Fat Reduction (Injection Lipolysis) */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Fat Reduction (Injection Lipolysis)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Target Stubborn Fat with <span className={styles.titleAccent}>Precision</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Injection lipolysis is a non-surgical treatment that dissolves localized fat deposits in areas resistant to diet and exercise.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Reduces stubborn fat pockets (chin, abdomen, thighs)",
                    "Non-invasive with minimal downtime",
                    "Gradual, natural-looking fat reduction",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Perfect for contouring specific problem areas.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image
                    src="/treatments/body-shaping/1.png"
                    alt="Fat Reduction"
                    width={500}
                    height={600}
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 2. Body Sculpting (Cryolipolysis / RF / HIFU) */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Body Sculpting (Cryolipolysis / RF / HIFU)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Advanced Fat Reduction & <span className={styles.titleAccent}>Body Sculpting Technologies</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We use globally advanced technologies to reshape your body effectively without surgery or pain.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Cryolipolysis (fat freezing)",
                    "Radio Frequency (RF) fat reduction",
                    "HIFU (High-Intensity Focused Ultrasound)",
                  ].map((tech, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{tech}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Shape your body without surgery or pain.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image
                    src="/treatments/body-shaping/2.png"
                    alt="Body Sculpting"
                    width={500}
                    height={600}
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 3. Skin Tightening (Face & Body) */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>Skin Tightening (Face & Body)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Firm, Lift & <span className={styles.titleAccent}>Rejuvenate Your Skin</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Loose or sagging skin is tightened using advanced collagen-stimulating technologies for face and body.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Improved skin elasticity",
                    "Firmer, tighter appearance",
                    "Suitable for face and body areas",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Achieve youthful, toned skin naturally.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image
                    src="/treatments/body-shaping/3.png"
                    alt="Skin Tightening"
                    width={500}
                    height={600}
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 4. Cellulite Reduction */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Cellulite Reduction</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Smooth & <span className={styles.titleAccent}>Even Skin Texture</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer targeted treatments to reduce cellulite and improve skin smoothness and firmness.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Reduced dimpled appearance",
                    "Smoother skin texture",
                    "Enhanced skin firmness",
                  ].map((result, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{result}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Say goodbye to uneven skin and cellulite.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image
                    src="/treatments/body-shaping/4.png"
                    alt="Cellulite Reduction"
                    width={500}
                    height={600}
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 5. Stretch Mark Treatments */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>Stretch Mark Treatments</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Restore Skin Texture & <span className={styles.titleAccent}>Confidence</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Advanced therapies help reduce the visibility of stretch marks and improve overall skin quality.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Fades stretch marks",
                    "Improves skin tone and texture",
                    "Stimulates collagen production",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Regain smoother, healthier-looking skin.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image
                    src="/treatments/body-shaping/5.png"
                    alt="Stretch Mark Treatment"
                    width={500}
                    height={600}
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 6. Inch Loss & Transformation Programs */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Inch Loss & Transformation Programs</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Customized Body <span className={styles.titleAccent}>Transformation Plans</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our personalized programs combine multiple treatments for effective inch loss and body reshaping.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Targeted fat reduction therapies",
                    "Skin tightening solutions",
                    "Lifestyle and guidance support",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Designed for visible, measurable transformation.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image
                    src="/treatments/body-shaping/6.png"
                    alt="Transformation Programs"
                    width={500}
                    height={600}
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 7. Post-Weight Loss Body Correction */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Shield size={16} />
                  <span>Post-Weight Loss Body Correction</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Refine Your Body After <span className={styles.titleAccent}>Major Weight Loss</span>
                </h2>
                <p className={styles.aboutDescription}>
                  After significant weight loss, we offer advanced correction solutions for loose skin and uneven contours.
                </p>
                <div className={styles.aboutFeatures}>
                  {[
                    "Skin tightening",
                    "Contour refinement",
                    "Body reshaping",
                  ].map((focus, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{focus}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Complete your transformation journey with confidence.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image
                    src="/treatments/body-shaping/7.png"
                    alt="Post-Weight Loss Correction"
                    width={500}
                    height={600}
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Why Choose Section */}
        <section className={styles.whyChooseSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Why Choose Celeb Aesthetica for Body Contouring?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Microscope size={24} />, text: "AI-based body analysis for personalized treatments" },
                { icon: <Zap size={24} />, text: "Advanced non-surgical technologies (HIFU, RF, Cryolipolysis)" },
                { icon: <Users size={24} />, text: "Expert aesthetic specialists" },
                { icon: <Target size={24} />, text: "Safe, painless, and minimally invasive procedures" },
                { icon: <Activity size={24} />, text: "Visible results with no downtime" },
                { icon: <Shield size={24} />, text: "Premium, hygienic, and patient-friendly environment" },
              ].map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section — Newsletter Style */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>
                Book Your Body Transformation Consultation
              </h2>
              <p className={styles.ctaDescription}>
                Start your journey toward a more sculpted, confident, and healthier body with expert care at Celeb Aesthetica.
              </p>
              <div className={styles.ctaBtnRow}>
                <Link href="/contact" className={styles.ctaButtonWhite}>
                  <Calendar size={18} /> Schedule Your Consultation
                </Link>
              </div>
            </div>
            <div className={styles.ctaImageWrapper}>
              <Image
                src="/images/Quick-Treatments/BodyShaping.png"
                alt="Expert Body Contouring"
                width={500}
                height={600}
                className={styles.ctaImage}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
