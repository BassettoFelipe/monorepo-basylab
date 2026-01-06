import { Check, Lock, RefreshCw } from "lucide-react";
import type { CheckoutInfo } from "@/types/auth.types";
import { formatPrice } from "@/utils/currency";
import * as styles from "../../RegistrationCheckoutPage/RegistrationCheckoutPage.css";

interface OrderSummaryWithChangePlanProps {
  checkoutInfo: CheckoutInfo;
  onChangePlan: () => void;
}

export function OrderSummaryWithChangePlan({
  checkoutInfo,
  onChangePlan,
}: OrderSummaryWithChangePlanProps) {
  return (
    <div className={styles.checkoutRightColumn}>
      <div className={styles.planCard}>
        <div className={styles.planCardHeader}>
          <div className={styles.planCardBadge}>Seu plano</div>
          <h3 className={styles.planCardName}>{checkoutInfo.plan.name}</h3>
        </div>

        <div className={styles.planCardPrice}>
          <span className={styles.planCardPriceValue}>{formatPrice(checkoutInfo.plan.price)}</span>
          <span className={styles.planCardPricePeriod}>/mes</span>
        </div>

        {checkoutInfo.plan.features.length > 0 && (
          <div className={styles.planCardFeatures}>
            {checkoutInfo.plan.features.map((feature) => (
              <div key={feature} className={styles.planCardFeatureItem}>
                <div className={styles.planCardFeatureIcon}>
                  <Check size={12} />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onChangePlan} className={styles.changePlanButton}>
          <RefreshCw size={16} />
          Alterar plano
        </button>

        <div className={styles.planCardDivider} />

        <div className={styles.planCardInfo}>
          <div className={styles.planCardInfoRow}>
            <span className={styles.planCardInfoLabel}>Cliente</span>
            <span className={styles.planCardInfoValue}>{checkoutInfo.user.name}</span>
          </div>
          <div className={styles.planCardInfoRow}>
            <span className={styles.planCardInfoLabel}>Email</span>
            <span className={styles.planCardInfoValue}>{checkoutInfo.user.email}</span>
          </div>
          <div className={styles.planCardInfoRow}>
            <span className={styles.planCardInfoLabel}>Cobranca</span>
            <span className={styles.planCardInfoValue}>Mensal</span>
          </div>
        </div>
      </div>

      <div className={styles.securityFooter}>
        <Lock size={14} className={styles.securityFooterIcon} />
        <span>Pagamento seguro. Seus dados nao ficam salvos.</span>
      </div>
    </div>
  );
}
