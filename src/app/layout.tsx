import type { Metadata } from "next";
import { AppointmentProvider } from "@/components/AppointmentProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Celeb Aesthecia | Trusted Specialist for Every Medical Need",
  description:
    "Experience world-class healthcare with Celeb Aesthecia. Schedule appointments with top specialists, access 24/7 care, and join 30M+ satisfied patients. Your health, our priority.",
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
    title: "Celeb Aesthecia | Trusted Specialist for Every Medical Need",
    description:
      "Experience world-class healthcare with Celeb Aesthecia. Schedule appointments with top specialists.",
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
        <AppointmentProvider>{children}</AppointmentProvider>
      </body>
    </html>
  );
}
