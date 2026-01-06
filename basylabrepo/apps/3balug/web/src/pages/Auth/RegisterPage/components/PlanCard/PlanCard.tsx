import { Check, CheckSquare } from "lucide-react";
import type { Plan } from "@/types/plan.types";
import { formatPrice } from "@/utils/currency";
import * as styles from "./PlanCard.css";

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <article className={styles.planCard} aria-labelledby={`plan-title-${plan.id}`}>
      <header className={styles.planCardHeader}>
        <div className={styles.planCardIcon} aria-hidden="true">
          <CheckSquare size={16} className={styles.planCardIconSvg} aria-hidden="true" />
        </div>
        <div className={styles.planCardTitleWrapper}>
          <h3 id={`plan-title-${plan.id}`} className={styles.planCardTitle}>
            {plan.name}
          </h3>
          <p className={styles.planCardSubtitle}>Plano selecionado</p>
        </div>
        <p className={styles.planCardPrice}>
          <span className={styles.planCardPriceAmount}>{formatPrice(plan.price)}</span>
          <span className={styles.planCardPricePeriod}>/mês</span>
          <span className="sr-only">Preço: {formatPrice(plan.price)} por mês</span>
        </p>
      </header>

      <hr className={styles.planCardDivider} />

      <ul className={styles.planCardFeatures} aria-label="Recursos inclusos no plano">
        <li className={styles.planCardFeature}>
          <Check size={14} className={styles.planCardFeatureIcon} aria-hidden="true" />
          <span>
            {plan.maxUsers === null
              ? "Usuários ilimitados"
              : `${plan.maxUsers} usuário${plan.maxUsers > 1 ? "s" : ""}`}
          </span>
        </li>
        {plan.maxManagers > 0 && (
          <li className={styles.planCardFeature}>
            <Check size={14} className={styles.planCardFeatureIcon} aria-hidden="true" />
            <span>
              {plan.maxManagers} gestor{plan.maxManagers > 1 ? "es" : ""}
            </span>
          </li>
        )}
        <li className={styles.planCardFeature}>
          <Check size={14} className={styles.planCardFeatureIcon} aria-hidden="true" />
          <span>
            {plan.maxSerasaQueries} consulta
            {plan.maxSerasaQueries > 1 ? "s" : ""} Serasa/mês
          </span>
        </li>
      </ul>
    </article>
  );
}
