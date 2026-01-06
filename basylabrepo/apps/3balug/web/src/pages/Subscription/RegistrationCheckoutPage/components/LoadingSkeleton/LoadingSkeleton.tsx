import * as inputStyles from "@/components/Input/Input.css";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import * as styles from "./LoadingSkeleton.css";

function InputSkeleton({ labelWidth = "120px" }: { labelWidth?: string }) {
  return (
    <div className={inputStyles.inputWrapper} style={{ width: "100%" }}>
      <Skeleton width={labelWidth} height="20px" variant="rounded" />
      <Skeleton width="100%" height="44px" variant="rounded" />
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <output className={styles.checkoutPage} aria-label="Carregando página de checkout">
      <div className={styles.checkoutContainer}>
        {/* Left Column - Skeleton */}
        <section className={styles.checkoutLeftColumn} aria-label="Formulário de pagamento">
          {/* Header */}
          <div className={styles.checkoutHeader}>
            <Skeleton width="36px" height="36px" variant="rounded" />
            <div className={styles.checkoutHeaderContent}>
              <Skeleton width="180px" height="24px" variant="rounded" />
              <Skeleton
                width="280px"
                height="14px"
                variant="rounded"
                style={{ marginTop: "4px" }}
              />
            </div>
          </div>

          {/* Credit Card Preview */}
          <div className={styles.cardWrapper}>
            <Skeleton width="290px" height="182px" variant="rounded" />
          </div>

          {/* Form Fields */}
          <div className={styles.checkoutForm}>
            {/* Card Number */}
            <InputSkeleton labelWidth="130px" />

            {/* Cardholder Name */}
            <InputSkeleton labelWidth="120px" />

            {/* Expiration and CVV Row */}
            <div className={styles.inputRow}>
              <InputSkeleton labelWidth="70px" />
              <InputSkeleton labelWidth="40px" />
            </div>

            {/* CPF */}
            <InputSkeleton labelWidth="100px" />

            {/* Submit Button */}
            <Skeleton width="100%" height="42px" variant="rounded" style={{ marginTop: "8px" }} />
          </div>
        </section>

        {/* Right Column - Skeleton */}
        <aside className={styles.checkoutRightColumn} aria-label="Resumo do pedido">
          {/* Plan Card */}
          <div className={styles.planCard}>
            {/* Header */}
            <div className={styles.planCardHeader}>
              <Skeleton
                width="90px"
                height="24px"
                variant="rounded"
                style={{ margin: "0 auto 8px" }}
              />
              <Skeleton
                width="140px"
                height="32px"
                variant="rounded"
                style={{ margin: "0 auto" }}
              />
            </div>

            {/* Price */}
            <div className={styles.planCardPrice}>
              <Skeleton
                width="120px"
                height="40px"
                variant="rounded"
                style={{ margin: "0 auto" }}
              />
            </div>

            {/* Features */}
            <div className={styles.planCardFeatures}>
              <div className={styles.planCardFeatureItem}>
                <Skeleton width="16px" height="16px" variant="circular" />
                <Skeleton width="85%" height="14px" variant="rounded" />
              </div>
              <div className={styles.planCardFeatureItem}>
                <Skeleton width="16px" height="16px" variant="circular" />
                <Skeleton width="90%" height="14px" variant="rounded" />
              </div>
              <div className={styles.planCardFeatureItem}>
                <Skeleton width="16px" height="16px" variant="circular" />
                <Skeleton width="80%" height="14px" variant="rounded" />
              </div>
            </div>

            {/* Divider */}
            <div className={styles.planCardDivider} />

            {/* Info Rows */}
            <div className={styles.planCardInfo}>
              <div className={styles.planCardInfoRow}>
                <Skeleton width="50px" height="14px" variant="rounded" />
                <Skeleton width="120px" height="14px" variant="rounded" />
              </div>
              <div className={styles.planCardInfoRow}>
                <Skeleton width="40px" height="14px" variant="rounded" />
                <Skeleton width="160px" height="14px" variant="rounded" />
              </div>
              <div className={styles.planCardInfoRow}>
                <Skeleton width="60px" height="14px" variant="rounded" />
                <Skeleton width="60px" height="14px" variant="rounded" />
              </div>
              <div className={styles.planCardInfoRow}>
                <Skeleton width="90px" height="14px" variant="rounded" />
                <Skeleton width="110px" height="14px" variant="rounded" />
              </div>
            </div>
          </div>

          {/* Security Footer */}
          <div className={styles.securityFooter}>
            <Skeleton width="14px" height="14px" variant="rounded" />
            <Skeleton width="280px" height="14px" variant="rounded" />
          </div>
        </aside>
      </div>
      <span className="sr-only">Carregando informações de checkout...</span>
    </output>
  );
}
