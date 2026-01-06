import { ClipboardList, Clock, Lock, Phone, X } from 'lucide-react'
import type { Plan } from '@/types/plan.types'
import { PlanCard } from '../PlanCard/PlanCard'
import * as styles from './PlanSummary.css'

interface PlanSummaryProps {
	selectedPlan?: Plan
}

const BENEFITS = [
	{ icon: Clock, label: '7 dias grátis' },
	{ icon: X, label: 'Cancele quando quiser' },
	{ icon: Phone, label: 'Suporte prioritário' },
	{ icon: Lock, label: 'Dados seguros' },
]

export function PlanSummary({ selectedPlan }: PlanSummaryProps) {
	return (
		<aside className={styles.registerRightColumn} aria-labelledby="summary-heading">
			<header className={styles.sidebarHeader}>
				<h2 id="summary-heading" className={styles.sidebarTitle}>
					Resumo do Pedido
				</h2>
				<p className={styles.sidebarSubtitle}>Revise antes de continuar</p>
			</header>

			{selectedPlan ? (
				<PlanCard plan={selectedPlan} />
			) : (
				<output className={styles.planPlaceholder} aria-label="Nenhum plano selecionado">
					<ClipboardList size={36} className={styles.planPlaceholderIcon} aria-hidden="true" />
					<h3 className={styles.planPlaceholderTitle}>Selecione um plano</h3>
					<p className={styles.planPlaceholderText}>Escolha ao lado para ver o resumo</p>
				</output>
			)}

			<section className={styles.benefitsSection} aria-labelledby="benefits-heading">
				<h3 id="benefits-heading" className={styles.benefitsTitle}>
					Incluso em todos os planos
				</h3>
				<ul className={styles.benefitsList} aria-label="Benefícios inclusos">
					{BENEFITS.map(({ icon: Icon, label }) => (
						<li key={label} className={styles.benefitItem}>
							<div className={styles.benefitIconWrapper} aria-hidden="true">
								<Icon className={styles.benefitIcon} aria-hidden="true" />
							</div>
							<span>{label}</span>
						</li>
					))}
				</ul>
			</section>
		</aside>
	)
}
