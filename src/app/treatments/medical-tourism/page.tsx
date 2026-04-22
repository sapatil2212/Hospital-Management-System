"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Globe, 
  MapPin, 
  Clock, 
  IndianRupee, 
  ArrowRight,
  Check,
  Mountain, 
  Palmtree, 
  Waves, 
  Trees, 
  Compass,
  HeartPulse,
  Shield,
  Plane,
  Hotel,
  Stethoscope,
  ChevronDown,
  Search,
  X,
  User,
  Mail,
  Phone,
  Paperclip,
  Users,
  Send
} from "lucide-react";

const IconMap: Record<string, any> = {
  Mountain,
  Palmtree,
  Waves,
  Trees,
  Compass
};
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { medicalTourismData } from "./tourismData";
import styles from "./medical-tourism.module.css";
import heroStyles from "../treatments.module.css";
import MedicalTourismHero from "./MedicalTourismHero";
import BookingModal from "./BookingModal";

export default function MedicalTourismPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const aboutRef = useRef(null);
  const isAboutInView = useInView(aboutRef, { once: true, margin: "-100px" });
  const zonesRef = useRef(null);
  const isZonesInView = useInView(zonesRef, { once: true, margin: "-100px" });

  const openBookingModal = (zoneId?: string) => {
    setSelectedZone(zoneId || "");
    setIsBookingModalOpen(true);
  };

  const features = [
    { icon: Stethoscope, title: "World-Class Healthcare", desc: "Access to JCI-accredited hospitals and renowned specialists" },
    { icon: Plane, title: "Complete Travel Support", desc: "Visa assistance, airport transfers, and flight bookings" },
    { icon: Hotel, title: "Premium Accommodation", desc: "5-star hotels and recovery suites near medical facilities" },
    { icon: Shield, title: "Comprehensive Insurance", desc: "Medical travel insurance and 24/7 emergency support" },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* HERO SECTION - Same as other treatment pages */}
        <MedicalTourismHero />

        {/* ABOUT SECTION - Basic details about medical tourism */}
        <section className={styles.aboutSection} ref={aboutRef}>
          <div className="container">
            <div className={styles.aboutGrid}>
              {/* Left: Content */}
              <motion.div 
                className={styles.aboutContent}
                initial={{ opacity: 0, x: -30 }}
                animate={isAboutInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <span className="section-label">
                  <Globe size={16} />
                  Medical Tourism
                </span>
                <h2 className="section-title">
                  World-Class Healthcare <span className={styles.accent}>in India</span>
                </h2>
                <p className={styles.aboutText}>
                  Experience the perfect blend of advanced medical care and unforgettable travel. 
                  At Celeb Aesthetica, we specialize in providing international patients with 
                  seamless medical tourism experiences across India's most iconic destinations.
                </p>
                <p className={styles.aboutText}>
                  From state-of-the-art hospitals to serene recovery environments, we handle 
                  every aspect of your journey — medical consultations, travel arrangements, 
                  accommodation, and post-treatment care — ensuring a stress-free healing experience.
                </p>

                <div className={styles.featuresGrid}>
                  {features.map((feature, idx) => (
                    <motion.div 
                      key={feature.title}
                      className={styles.featureItem}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isAboutInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                    >
                      <div className={styles.featureIcon}>
                        <feature.icon size={20} />
                      </div>
                      <div>
                        <h4 className={styles.featureTitle}>{feature.title}</h4>
                        <p className={styles.featureDesc}>{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right: Stats */}
              <motion.div 
                className={styles.aboutStats}
                initial={{ opacity: 0, x: 30 }}
                animate={isAboutInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>50K+</div>
                  <div className={styles.statLabel}>International Patients</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>25+</div>
                  <div className={styles.statLabel}>Partner Hospitals</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>15+</div>
                  <div className={styles.statLabel}>Countries Served</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>98%</div>
                  <div className={styles.statLabel}>Patient Satisfaction</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* REGIONAL CIRCUITS SECTION - Cards like homepage treatments */}
        <section className={styles.circuitsSection} ref={zonesRef}>
          <div className="container">
            {/* Header */}
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isZonesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <button className={styles.sectionLabelBtn} onClick={() => openBookingModal()}>
                <HeartPulse size={16} />
                Explore Destinations
              </button>
              <h2 className="section-title">
                Regional <span className={styles.accent}>Circuits</span>
              </h2>
              <p className="section-subtitle">
                Choose from our carefully curated regional circuits, each offering unique 
                healthcare and travel experiences across India&apos;s most sought-after destinations.
              </p>
            </motion.div>

            {/* Cards Grid - Homepage Services style */}
            <div className={styles.circuitsGrid}>
              {medicalTourismData.map((zone, i) => {
                const ZoneIcon = IconMap[zone.icon] || Globe;
                return (
                  <motion.div
                    key={zone.id}
                    className={styles.circuitCard}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isZonesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    {/* Card Image - Half */}
                    <div className={styles.circuitImageContainer}>
                      <Image
                        src={zone.image}
                        alt={zone.name}
                        fill
                        className={styles.circuitImage}
                        onError={(e: any) => {
                          e.target.src = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop";
                        }}
                      />
                    </div>
                    
                    {/* Card Content - Half */}
                    <div className={styles.circuitContent}>
                      <div className={styles.circuitIcon}>
                        <ZoneIcon size={20} />
                      </div>
                      <h3 className={styles.circuitTitle}>{zone.name}</h3>
                      <p className={styles.circuitDesc}>{zone.shortDescription}</p>
                      
                      <div className={styles.benefitsSection}>
                        <h4 className={styles.benefitsLabel}>Coverage:</h4>
                        <div className={styles.benefitsGrid}>
                          {zone.coverage.slice(0, 3).map((item) => (
                            <span key={item} className={styles.benefitBadge}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={styles.circuitMeta}>
                        <div className={styles.metaItem}>
                          <IndianRupee size={12} />
                          <span>{zone.startingPackage}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <Link 
                          href={`/treatments/medical-tourism/${zone.id}`}
                          className={styles.viewMoreBtn}
                        >
                          View Details <ArrowRight size={14} />
                        </Link>
                        <button 
                          className={styles.bookNowBtn}
                          onClick={() => openBookingModal(zone.id)}
                        >
                          Book Now <Check size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaContainer}>
              <div className={styles.ctaContent}>
                <h3>Ready to Begin Your Medical Journey?</h3>
                <p>Get a personalized medical tourism package tailored to your healthcare needs and travel preferences.</p>
                <button onClick={() => openBookingModal()} className={styles.ctaBtn}>
                  Get Free Consultation <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} preSelectedZone={selectedZone} />
      <Footer />
    </>
  );
}
