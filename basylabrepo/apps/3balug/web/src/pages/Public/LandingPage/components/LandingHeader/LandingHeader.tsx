import { Logo } from "@/components/Logo/Logo";
import * as styles from "../../styles.css";

interface LandingHeaderProps {
  onLogoClick: () => void;
  onLinkClick: (e: React.MouseEvent<HTMLElement>, sectionId: string) => void;
}

export function LandingHeader({ onLogoClick, onLinkClick }: LandingHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <button
            type="button"
            className={styles.logo}
            onClick={onLogoClick}
            aria-label="Voltar ao topo"
          >
            <Logo variant="primary" size="medium" />
          </button>
          <nav className={styles.nav}>
            <button
              type="button"
              className={styles.navLink}
              onClick={(e) => onLinkClick(e, "recursos")}
            >
              Recursos
            </button>
            <button
              type="button"
              className={styles.navLink}
              onClick={(e) => onLinkClick(e, "planos")}
            >
              Planos
            </button>
            <button type="button" className={styles.navLink} onClick={(e) => onLinkClick(e, "faq")}>
              FAQ
            </button>
            <a href="/login" className={styles.navButton}>
              Entrar
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
