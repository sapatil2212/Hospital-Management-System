import type { Metadata, Viewport } from "next";
import { AppointmentProvider } from "@/components/AppointmentProvider";
import MobileAppointment from "@/components/mobile-appointment";
import WhatsAppWidget from "@/components/whatsapp-widget";
import AIChatbot from "@/components/ai-chatbot";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Celeb Aesthetica | Trusted Specialist for Every Medical Need",
  description:
    "Experience world-class healthcare with Celeb Aesthetica. Schedule appointments with top specialists, access 24/7 care, and join 30M+ satisfied patients. Your health, our priority.",
  keywords: [
    "healthcare",
    "medical",
    "doctor appointment",
    "specialist",
    "telemedicine",
    "cardiology",
    "neurology",
    "dermatology",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo/favicon-icon.png", type: "image/png" }
    ],
  },
  openGraph: {
    title: "Celeb Aesthetica | Trusted Specialist for Every Medical Need",
    description:
      "Experience world-class healthcare with Celeb Aesthetica. Schedule appointments with top specialists.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppointmentProvider>
          {children}
          <WhatsAppWidget />
          <AIChatbot />
          <MobileAppointment />
        </AppointmentProvider>
      </body>
    </html>
  );
}
