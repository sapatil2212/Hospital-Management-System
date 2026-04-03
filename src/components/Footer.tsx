"use client";

import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
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

const treatmentLinks = [
  { label: "Dental", href: "/treatments/dental" },
  { label: "Skin", href: "/treatments/skin" },
  { label: "Hair", href: "/treatments/hair" },
  { label: "HNF Cancer", href: "/treatments/oncology" },
  { label: "Facial Trauma", href: "/treatments/general-opd" },
  { label: "Body Shaping", href: "/treatments" },
  { label: "Nutrition", href: "/treatments" },
  { label: "Sexual Health", href: "/treatments" },
  { label: "Premium Aesthetic", href: "/treatments" },
  { label: "Dental and Medical Tourism", href: "/treatments" },
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
      {/* Footer Content */}
      <div className={`container ${styles.footerContent} ${!isHomePage ? styles.footerNoNewsletter : ""}`}>
        {/* About Column */}
        <div className={styles.footerCol}>
          <a href="#home" className={styles.footerLogo}>
            <Image
              src="/logo/celeb-aesthecia-logo.png"
              alt="Celeb Aesthecia"
              width={140}
              height={42}
              className={styles.footerLogoImage}
            />
          </a>
          <h5 className={styles.footerTagline}>Experience the Future of Healthcare</h5>
          <p className={styles.footerAbout}>
            At Celeb Aesthecia, we are not just treating patients—we are redefining healthcare experiences through innovation, precision, and compassion.
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

        {/* Treatments */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Our Treatments</h4>
          <ul className={styles.linkList}>
            {treatmentLinks.map((treatment) => (
              <li key={treatment.label}>
                <a href={treatment.href} className={styles.footerLink}>
                  <ArrowRight size={14} />
                  {treatment.label}
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
                3/Alampat Business Centre, Near cycle circle,
                <br />
                Krushi Nagar, college road, Nashik 422001
              </span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={18} className={styles.contactIcon} />
              <span>+91 90590 53938</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={18} className={styles.contactIcon} />
              <span>celebaesthecia666@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            © 2026 Celeb Aesthecia. All rights reserved.
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
