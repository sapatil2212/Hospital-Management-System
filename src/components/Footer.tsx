"use client";

import { motion } from "framer-motion";
import {
  Heart,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Send,
} from "lucide-react";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Blog", href: "#blog" },
  { label: "Contact Us", href: "#contact" },
];

const serviceLinks = [
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Orthopedics",
  "Pediatrics",
  "Ophthalmology",
];

const socialLinks = [
  { icon: <Facebook size={18} />, label: "Facebook", href: "#" },
  { icon: <Twitter size={18} />, label: "Twitter", href: "#" },
  { icon: <Instagram size={18} />, label: "Instagram", href: "#" },
  { icon: <Linkedin size={18} />, label: "LinkedIn", href: "#" },
];

export default function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <footer id="contact" className={styles.footer}>
      {/* Newsletter Banner */}
      {isHomePage && (
        <div className={`container ${styles.newsletterWrapper}`}>
          <div className={styles.newsletter}>
            <div className={styles.nlContent}>
              <h3 className={styles.nlTitle}>
                Subscribe to Our Health Newsletter
              </h3>
              <p className={styles.nlText}>
                Get the latest health tips, wellness advice, and medical news
                delivered to your inbox weekly.
              </p>
            </div>
            <div className={styles.nlForm}>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className={styles.nlInput}
                  id="newsletter-email"
                />
              </div>
              <button className={`btn btn-primary ${styles.nlButton}`}>
                Subscribe
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Content */}
      <div className={`container ${styles.footerContent} ${!isHomePage ? styles.footerNoNewsletter : ""}`}>
        {/* About Column */}
        <div className={styles.footerCol}>
          <a href="#home" className={styles.footerLogo}>
            <div className={styles.logoIcon}>
              <Heart size={20} fill="white" />
            </div>
            <span className={styles.logoText}>
              Medi<span className={styles.logoAccent}>Care+</span>
            </span>
          </a>
          <p className={styles.footerAbout}>
            Providing world-class healthcare services with compassion and
            innovation. Your trusted partner in health and wellness since 2010.
          </p>
          <div className={styles.socialLinks}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={styles.socialLink}
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            {quickLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className={styles.footerLink}>
                  <ArrowRight size={14} />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Our Services</h4>
          <ul className={styles.linkList}>
            {serviceLinks.map((service) => (
              <li key={service}>
                <a href="#services" className={styles.footerLink}>
                  <ArrowRight size={14} />
                  {service}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Contact Info</h4>
          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <MapPin size={18} className={styles.contactIcon} />
              <span>
                Rajashree Hospital, Near Canada Corner,
                <br />
                Gangapur Road, Nashik, Maharastra 411052
              </span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={18} className={styles.contactIcon} />
              <span>+91 90590 53938</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={18} className={styles.contactIcon} />
              <span>rajashreehospital2026@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            © 2026 MediCare+. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
