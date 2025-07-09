import Hero from "./components/Hero";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import CTABanner from "./components/cta-banner";
import { Navbar } from "./components/navbar";
import Footer from "./components/Footer";
import FAQ from "./components/FAQ";
export default function Landing() {
  return (
        <>
        <Navbar />
      <main className="pt-16 xs:pt-20 sm:pt-24">
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}