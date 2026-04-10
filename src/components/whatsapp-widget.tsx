"use client";

import Image from "next/image";
import styles from "./whatsapp-widget.module.css";

export default function WhatsAppWidget() {
  const phoneNumber = "+919059053938";
  const message = "Hello Celeb Aesthetica, I would like to inquire about your treatments.";
  const whatsappUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={styles.whatsappWidget}
      aria-label="Chat on WhatsApp"
    >
      <div className={styles.iconWrapper}>
        <Image 
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
          alt="WhatsApp" 
          width={32} 
          height={32} 
          className={styles.whatsappLogo}
        />
      </div>
      <div className={styles.tooltip}>Chat with us</div>
    </a>
  );
}
