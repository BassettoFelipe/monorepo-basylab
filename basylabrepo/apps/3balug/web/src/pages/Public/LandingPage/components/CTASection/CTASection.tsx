import { ArrowRight, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/Button/Button";
import * as styles from "../../styles.css";

interface CTASectionProps {
  onScrollToSection: (sectionId: string) => void;
  onLinkClick: (e: React.MouseEvent<HTMLElement>, sectionId: string) => void;
}

export function CTASection({ onScrollToSection, onLinkClick }: CTASectionProps) {
  return (
    <section className={styles.ctaSection} aria-labelledby="cta-heading">
      <div className={styles.container}>
        <article className={styles.ctaCard}>
          <div className={styles.ctaBackground} aria-hidden="true" />
          <div className={styles.ctaDecoration} aria-hidden="true" />
          <div className={styles.ctaDecorationInner} aria-hidden="true" />

          <div className={styles.ctaContent}>
            <div className={styles.ctaLabel}>
              <Zap size={12} aria-hidden="true" />
              Comece Agora
            </div>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              Pronto para transformar seu negócio imobiliário?
            </h2>
            <p className={styles.ctaDescription}>
              Junte-se a mais de 500 imobiliárias que já estão crescendo com nossa plataforma.
              Cadastre-se e comece a usar hoje mesmo.
            </p>
          </div>

          <div className={styles.ctaActions}>
            <Button
              onClick={() => onScrollToSection("planos")}
              variant="primary"
              size="large"
              className={styles.ctaButton}
            >
              Escolher Plano
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <button
              type="button"
              className={styles.ctaSecondaryLink}
              onClick={(e) => onLinkClick(e, "planos")}
              aria-label="Ver todos os planos disponíveis"
            >
              Ver todos os planos
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
