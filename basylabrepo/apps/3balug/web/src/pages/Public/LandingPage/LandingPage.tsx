import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { usePlansQuery } from "@/queries/plans/usePlansQuery";
import { CTASection } from "./components/CTASection/CTASection";
import { FAQSection } from "./components/FAQSection/FAQSection";
import { FeaturesSection } from "./components/FeaturesSection/FeaturesSection";
import { HeroSection } from "./components/HeroSection/HeroSection";
import { LandingFooter } from "./components/LandingFooter/LandingFooter";
import { LandingHeader } from "./components/LandingHeader/LandingHeader";
import { PlansSection } from "./components/PlansSection/PlansSection";
import * as styles from "./styles.css";

export function LandingPage() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: plans = [], isLoading, error } = usePlansQuery();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectPlan = (planId: string) => {
    navigate(`/register?planId=${planId}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLElement>, sectionId: string) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "3Balug - CRM Imobiliário",
    applicationCategory: "BusinessApplication",
    description:
      "Plataforma completa para gestão de imóveis, contratos, clientes e processos imobiliários.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: plans.length > 0 ? Math.min(...plans.map((p) => p.price)) : "0",
      highPrice: plans.length > 0 ? Math.max(...plans.map((p) => p.price)) : "0",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "500",
    },
    operatingSystem: "Web",
  };

  return (
    <>
      <Helmet>
        <title>CRM Imobiliário - Gestão Completa para Imobiliárias | 3Balug</title>
        <meta
          name="description"
          content="Plataforma completa para gestão de imóveis, contratos, clientes e processos. Mais de 500 imobiliárias confiam na 3Balug. Teste grátis."
        />
        <meta
          name="keywords"
          content="CRM imobiliário, gestão de imóveis, software imobiliária, contratos digitais, consulta serasa"
        />
        <link rel="canonical" href={window.location.href} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CRM Imobiliário - Gestão Completa para Imobiliárias" />
        <meta
          property="og:description"
          content="Plataforma completa para gestão de imóveis, contratos, clientes e processos. Mais de 500 imobiliárias confiam na 3Balug."
        />
        <meta property="og:url" content={window.location.href} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CRM Imobiliário - Gestão Completa para Imobiliárias" />
        <meta
          name="twitter:description"
          content="Plataforma completa para gestão de imóveis, contratos, clientes e processos."
        />

        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className={styles.pageWrapper}>
        <LandingHeader onLogoClick={scrollToTop} onLinkClick={handleLinkClick} />

        <main>
          <HeroSection onScrollToSection={scrollToSection} />

          <FeaturesSection />

          <PlansSection
            plans={plans}
            isLoading={isLoading}
            error={error}
            onSelectPlan={handleSelectPlan}
            onRetry={() => navigate(0)}
          />

          <FAQSection />

          <CTASection onScrollToSection={scrollToSection} onLinkClick={handleLinkClick} />
        </main>

        <LandingFooter onLinkClick={handleLinkClick} />

        <button
          type="button"
          className={`${styles.scrollToTop} ${showScrollTop ? styles.scrollToTopVisible : ""}`}
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={20} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
