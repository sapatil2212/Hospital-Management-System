import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import QuickTreatments from "@/components/QuickTreatments";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import About from "@/components/About";
import Blog from "@/components/Blog";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <QuickTreatments />
        <Stats />
        <About />
        <Services />
        <Blog />
        <Testimonials />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
