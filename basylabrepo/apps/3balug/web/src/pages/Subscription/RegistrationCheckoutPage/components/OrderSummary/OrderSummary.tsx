import { Check, Lock } from "lucide-react";
import type { CheckoutInfo } from "@/types/auth.types";
import { formatPrice } from "@/utils/currency";
import * as styles from "./OrderSummary.css";

interface OrderSummaryProps {
  checkoutInfo: CheckoutInfo;
}

export function OrderSummary({ checkoutInfo }: OrderSummaryProps) {
  return (
    <aside className={styles.checkoutRightColumn} aria-labelledby="order-summary-title">
      <article className={styles.planCard}>
        <header className={styles.planCardHeader}>
          <div className={styles.planCardBadge}>Seu plano</div>
          <h2 id="order-summary-title" className={styles.planCardName}>
            {checkoutInfo.plan.name}
          </h2>
        </header>

        <div className={styles.planCardPrice}>
          <span className={styles.planCardPriceValue}>{formatPrice(checkoutInfo.plan.price)}</span>
          <span className={styles.planCardPricePeriod} aria-hidden="true">
            /mes
          </span>
        </div>

        {checkoutInfo.plan.features.length > 0 && (
          <ul className={styles.planCardFeatures} aria-label="Recursos incluídos no plano">
            {checkoutInfo.plan.features.map((feature) => (
              <li key={feature} className={styles.planCardFeatureItem}>
                <div className={styles.planCardFeatureIcon} aria-hidden="true">
                  <Check size={12} />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <hr className={styles.planCardDivider} />

        <dl className={styles.planCardInfo}>
          <div className={styles.planCardInfoRow}>
            <dt className={styles.planCardInfoLabel}>Cliente</dt>
            <dd className={styles.planCardInfoValue}>{checkoutInfo.user.name}</dd>
          </div>
          <div className={styles.planCardInfoRow}>
            <dt className={styles.planCardInfoLabel}>Email</dt>
            <dd className={styles.planCardInfoValue}>{checkoutInfo.user.email}</dd>
          </div>
          <div className={styles.planCardInfoRow}>
            <dt className={styles.planCardInfoLabel}>Cobrança</dt>
            <dd className={styles.planCardInfoValue}>Mensal</dd>
          </div>
          <div className={styles.planCardInfoRow}>
            <dt className={styles.planCardInfoLabel}>Cancelamento</dt>
            <dd className={styles.planCardInfoValue}>A qualquer momento</dd>
          </div>
        </dl>
      </article>

      <footer className={styles.securityFooter}>
        <Lock size={14} className={styles.securityFooterIcon} aria-hidden="true" />
        <p>Pagamento seguro. Seus dados não ficam salvos.</p>
      </footer>
    </aside>
  );
}
