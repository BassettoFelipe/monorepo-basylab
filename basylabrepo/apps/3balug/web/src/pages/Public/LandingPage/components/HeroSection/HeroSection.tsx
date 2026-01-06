import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/Button/Button";
import * as styles from "../../styles.css";

interface HeroSectionProps {
  onScrollToSection: (sectionId: string) => void;
}

export function HeroSection({ onScrollToSection }: HeroSectionProps) {
  return (
    <section className={styles.heroSection} aria-label="Seção principal">
      <div className={styles.heroBackground} aria-hidden="true">
        <div
          className={styles.heroGradientOrb}
          style={{
            width: "600px",
            height: "600px",
            top: "-200px",
            right: "-200px",
            background: "radial-gradient(circle, rgba(230, 255, 75, 0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className={styles.heroGradientOrb}
          style={{
            width: "400px",
            height: "400px",
            bottom: "-100px",
            left: "-100px",
            background: "radial-gradient(circle, rgba(159, 182, 1, 0.2) 0%, transparent 70%)",
            animationDelay: "-4s",
          }}
        />
      </div>

      <div className={styles.container}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>
            <Sparkles size={14} aria-hidden="true" />
            Novo: Integração com Serasa
          </span>

          <h1 className={styles.heroTitle}>
            Gerencie seu negócio imobiliário de forma{" "}
            <span className={styles.heroTitleHighlight}>simples e eficiente</span>
          </h1>

          <p className={styles.heroDescription}>
            Plataforma completa para gestão de imóveis, contratos, clientes e processos. Tudo que
            você precisa em um só lugar para fazer seu negócio crescer.
          </p>

          <div className={styles.heroActions}>
            <Button onClick={() => onScrollToSection("planos")} variant="primary" size="large">
              Começar Agora
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button onClick={() => onScrollToSection("recursos")} variant="outline" size="large">
              Conhecer Recursos
            </Button>
          </div>

          <ul className={styles.heroStats}>
            <li className={styles.heroStat}>
              <span className={styles.heroStatNumber}>500+</span>
              <div className={styles.heroStatLabel}>Imobiliárias</div>
            </li>
            <li className={styles.heroStat}>
              <span className={styles.heroStatNumber}>50k+</span>
              <div className={styles.heroStatLabel}>Imóveis Gerenciados</div>
            </li>
            <li className={styles.heroStat}>
              <span className={styles.heroStatNumber}>99.9%</span>
              <div className={styles.heroStatLabel}>Uptime</div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
