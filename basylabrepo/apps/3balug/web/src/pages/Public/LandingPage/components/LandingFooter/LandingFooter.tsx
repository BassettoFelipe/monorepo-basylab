import { Logo } from "@/components/Logo/Logo";
import * as styles from "../../styles.css";

interface LandingFooterProps {
  onLinkClick: (e: React.MouseEvent<HTMLElement>, sectionId: string) => void;
}

export function LandingFooter({ onLinkClick }: LandingFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <Logo variant="white" size="medium" />
            </div>
            <p className={styles.footerTagline}>
              Gestão imobiliária inteligente e moderna para profissionais que querem crescer.
            </p>
          </div>

          <nav className={styles.footerLinks} aria-label="Links do rodapé">
            <div className={styles.footerColumn}>
              <h3 className={styles.footerColumnTitle}>Produto</h3>
              <button
                type="button"
                className={styles.footerLink}
                onClick={(e) => onLinkClick(e, "recursos")}
              >
                Recursos
              </button>
              <button
                type="button"
                className={styles.footerLink}
                onClick={(e) => onLinkClick(e, "planos")}
              >
                Planos
              </button>
              <button
                type="button"
                className={styles.footerLink}
                onClick={(e) => onLinkClick(e, "faq")}
              >
                FAQ
              </button>
            </div>

            <div className={styles.footerColumn}>
              <h3 className={styles.footerColumnTitle}>Conta</h3>
              <a href="/login" className={styles.footerLink}>
                Login
              </a>
              <a href="/register" className={styles.footerLink}>
                Cadastro
              </a>
            </div>

            <div className={styles.footerColumn}>
              <h3 className={styles.footerColumnTitle}>Legal</h3>
              <a href="/terms" className={styles.footerLink}>
                Termos de Uso
              </a>
              <a href="/privacy" className={styles.footerLink}>
                Política de Privacidade
              </a>
            </div>
          </nav>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} 3Balug. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
