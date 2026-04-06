"use client";

import { useAppointment } from "./AppointmentProvider";
import { Calendar, Phone } from "lucide-react";
import styles from "./mobile-appointment.module.css";

export default function MobileAppointment() {
  const { openAppointment } = useAppointment();

  return (
    <div className={styles.mobileContainer}>
      <div className={styles.buttonGroup}>
        <a href="tel:+919059053938" className={styles.contactButton}>
          <Phone size={16} className={styles.icon} />
          <span>Contact Us</span>
        </a>
        <button className={styles.appointmentButton} onClick={openAppointment}>
          <Calendar size={16} className={styles.icon} />
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
}
