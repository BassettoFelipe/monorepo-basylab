import { HeroSection } from '@/sections/HeroSection/HeroSection';
import { ProcessSection } from '@/sections/ProcessSection/ProcessSection';
import { ServicesSection } from '@/sections/ServicesSection/ServicesSection';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
    </main>
  );
}
