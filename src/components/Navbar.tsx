"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Heart, Phone, LogIn, ChevronDown,
  Stethoscope, SmilePlus, Sparkles, Ribbon, HeartPulse, PhoneCall,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppointment } from "./AppointmentProvider";
import styles from "./Navbar.module.css";

const treatments = [
  { label: "General OPD", href: "/treatments/general-opd", icon: <Stethoscope size={18} /> },
  { label: "Dental", href: "/treatments/dental", icon: <SmilePlus size={18} /> },
  { label: "Dermatology", href: "/treatments/dermatology", icon: <Sparkles size={18} /> },
  { label: "Cancer", href: "/treatments/cancer", icon: <Ribbon size={18} /> },
  { label: "Cardiology", href: "/treatments/cardiology", icon: <HeartPulse size={18} /> },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Treatments", href: "/treatments", hasDropdown: true },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { openAppointment } = useAppointment();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarInner}`}>
          <div className={styles.topBarLeft}>
            <span className={styles.topBarItem}>
              <Phone size={14} />
              <span>+1 (555) 123-4567</span>
            </span>
            <span className={styles.topBarDivider}>|</span>
            <span className={styles.topBarItem}>
              Mon – Fri: 8:00 AM – 7:00 PM
            </span>
          </div>
          <div className={styles.topBarRight}>
            <Link href="/login" className={styles.topBarLink}>
              <LogIn size={14} />
              Login
            </Link>
            <span className={styles.topBarDivider}>|</span>
            <span className={styles.topBarItem}>Emergency: 24/7 Available</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <motion.nav
        className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className={`container ${styles.navInner}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Heart size={22} fill="white" />
            </div>
            <span className={styles.logoText}>
              Medi<span className={styles.logoAccent}>Care+</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className={styles.desktopNav}>
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.label}
                  className={styles.dropdownTrigger}
                  ref={dropdownRef}
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`${styles.navLink} ${styles.dropdownBtn} ${pathname.startsWith("/treatments") ? styles.navLinkActive : ""
                      }`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ""}`}
                    />
                  </button>

                  {/* Mega Dropdown */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        className={styles.megaDropdown}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <div className={styles.dropdownInner}>
                          {/* Links Column */}
                          <div className={styles.dropdownLinks}>
                            <div className={styles.dropdownHeader}>
                              <span>Our Treatments</span>
                            </div>
                            {treatments.map((item, i) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Link
                                  href={item.href}
                                  className={`${styles.dropdownItem} ${pathname === item.href ? styles.dropdownItemActive : ""
                                    }`}
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <span className={styles.dropdownItemIcon}>
                                    {item.icon}
                                  </span>
                                  <span className={styles.dropdownItemLabel}>
                                    {item.label}
                                  </span>
                                </Link>
                              </motion.div>
                            ))}
                            <Link
                              href="/treatments"
                              className={styles.viewAllLink}
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              View All Treatments →
                            </Link>
                          </div>

                          {/* Image Column */}
                          <motion.div
                            className={styles.dropdownImage}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 }}
                          >
                            <Image
                              src="/images/treatment-dropdown.png"
                              alt="Medical consultation"
                              width={280}
                              height={240}
                              className={styles.dropdownImg}
                            />
                            <div className={styles.dropdownImageOverlay}>
                              <span>Expert Care</span>
                              <p>Trusted by 30M+ patients</p>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ""
                    }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* CTA */}
          <div className={styles.navActions}>
            <Link
              href="/login"
              className={`${styles.navBtn} ${styles.navLogin}`}
            >
              <LogIn size={15} />
              Login
            </Link>
            <a
              href="tel:+919059053938"
              className={`${styles.navBtn} ${styles.navEmergency}`}
            >
              <PhoneCall size={15} />
              Emergency
            </a>
            <button
              onClick={openAppointment}
              className={`${styles.navBtn} ${styles.navCta}`}
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className={styles.hamburger}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {navLinks.map((link, i) =>
                link.hasDropdown ? (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      className={`${styles.mobileLink} ${styles.mobileDropdownBtn}`}
                      onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                    >
                      {link.label}
                      <ChevronDown
                        size={16}
                        className={`${styles.chevron} ${mobileDropdownOpen ? styles.chevronOpen : ""
                          }`}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileDropdownOpen && (
                        <motion.div
                          className={styles.mobileSubMenu}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {treatments.map((t) => (
                            <Link
                              key={t.label}
                              href={t.href}
                              className={styles.mobileSubLink}
                              onClick={() => {
                                setIsMobileOpen(false);
                                setMobileDropdownOpen(false);
                              }}
                            >
                              {t.icon}
                              {t.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileLinkActive : ""
                        }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              )}
              <Link
                href="/login"
                className={`${styles.navBtn} ${styles.navLogin} ${styles.mobileCta}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <LogIn size={15} />
                Login
              </Link>
              <a
                href="tel:+919059053938"
                className={`${styles.navBtn} ${styles.navEmergency} ${styles.mobileCta}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <PhoneCall size={15} />
                Emergency
              </a>
              <button
                className={`${styles.navBtn} ${styles.navCta} ${styles.mobileCta}`}
                onClick={() => { setIsMobileOpen(false); openAppointment(); }}
              >
                Book Appointment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
