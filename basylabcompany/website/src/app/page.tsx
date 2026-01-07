import { HeroSection } from "@/sections/HeroSection/HeroSection";
import { ServicesSection } from "@/sections/ServicesSection/ServicesSection";
import { ProcessSection } from "@/sections/ProcessSection/ProcessSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
    </main>
  );
}
