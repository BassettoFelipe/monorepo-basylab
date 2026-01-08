import dynamic from "next/dynamic";
import { HeroSection } from "@/sections/HeroSection/HeroSection";

// Lazy load sections below the fold for better mobile performance
const AboutSection = dynamic(
  () =>
    import("@/sections/AboutSection/AboutSection").then(
      (mod) => mod.AboutSection,
    ),
  { ssr: true },
);

const ServicesSection = dynamic(
  () =>
    import("@/sections/ServicesSection/ServicesSection").then(
      (mod) => mod.ServicesSection,
    ),
  { ssr: true },
);

const ProcessSection = dynamic(
  () =>
    import("@/sections/ProcessSection/ProcessSection").then(
      (mod) => mod.ProcessSection,
    ),
  { ssr: true },
);

const TechSection = dynamic(
  () =>
    import("@/sections/TechSection/TechSection").then((mod) => mod.TechSection),
  { ssr: true },
);

const CasesSection = dynamic(
  () =>
    import("@/sections/CasesSection/CasesSection").then(
      (mod) => mod.CasesSection,
    ),
  { ssr: true },
);

const ContactSection = dynamic(
  () =>
    import("@/sections/ContactSection/ContactSection").then(
      (mod) => mod.ContactSection,
    ),
  { ssr: true },
);

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <ProcessSection />
      <TechSection />
      <CasesSection />
      <ContactSection />
    </main>
  );
}
