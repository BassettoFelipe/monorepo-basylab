import { Logo } from "@/components/Logo/Logo";
import { FeaturesList } from "../FeaturesList/FeaturesList";
import * as styles from "./BrandSection.css";

interface BrandSectionProps {
  title?: string;
  subtitle?: string;
  features?: Array<{ icon: React.ReactElement; label: string }>;
}

export function BrandSection({
  title = "Gestão imobiliária inteligente e moderna",
  subtitle = "Transforme sua operação com tecnologia que conecta pessoas, imóveis e oportunidades.",
  features,
}: BrandSectionProps) {
  return (
    <div className={styles.brandSection}>
      <div className={styles.brandContent}>
        <div className={styles.brandLogo}>
          <Logo variant="white" size="large" />
        </div>
        <h2 className={styles.brandTitle}>{title}</h2>
        <p className={styles.brandSubtitle}>{subtitle}</p>

        <FeaturesList features={features} />
      </div>

      <div className={styles.decorCircle1} />
      <div className={styles.decorCircle2} />
      <div className={styles.decorCircle3} />
    </div>
  );
}
