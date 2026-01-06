import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import type { Plan } from '@/types/plan.types'
import { formatPrice } from '@/utils/currency'
import * as styles from '../../styles.css'
import { PlanCardSkeleton } from '../PlanCardSkeleton/PlanCardSkeleton'

interface PlansSectionProps {
	plans: Plan[]
	isLoading: boolean
	error: Error | null
	onSelectPlan: (planId: string) => void
	onRetry: () => void
}

export function PlansSection({
	plans,
	isLoading,
	error,
	onSelectPlan,
	onRetry,
}: PlansSectionProps) {
	const getPlanBadge = (slug: string) => {
		switch (slug) {
			case 'basico':
				return { text: 'Ideal para iniciar', color: 'blue' }
			case 'imobiliaria':
				return { text: 'Mais Popular', color: 'green' }
			case 'house':
				return { text: 'Plano Completo', color: 'purple' }
			default:
				return null
		}
	}

	return (
		<section id="planos" className={styles.plansSection} aria-labelledby="plans-heading">
			<div className={styles.container}>
				<header className={styles.sectionHeader}>
					<span className={styles.sectionLabel}>Planos</span>
					<h2 id="plans-heading" className={styles.sectionTitle}>
						Escolha o plano ideal para você
					</h2>
					<p className={styles.sectionDescription}>
						Escolha o plano que melhor se adequa ao seu negócio. Sem taxas escondidas, cancele
						quando quiser.
					</p>
				</header>

				<ul className={styles.plansGrid}>
					{isLoading ? (
						<>
							<PlanCardSkeleton />
							<PlanCardSkeleton />
							<PlanCardSkeleton />
						</>
					) : error ? (
						<div className={styles.errorContainer}>
							<h3 className={styles.errorTitle}>Erro ao carregar planos</h3>
							<p className={styles.errorText}>
								Não foi possível carregar os planos. Tente novamente.
							</p>
							<Button onClick={onRetry}>Tentar Novamente</Button>
						</div>
					) : (
						plans.map((plan) => {
							const badge = getPlanBadge(plan.slug)
							const isPopular = plan.slug === 'imobiliaria'

							return (
								<li
									key={plan.id}
									data-testid="plan-card"
									className={`${styles.planCard} ${isPopular ? styles.planCardPopular : ''}`}
								>
									{isPopular && <span className={styles.planRibbon}>Recomendado</span>}

									<article className={styles.planContent}>
										<header className={styles.planHeader}>
											{badge && (
												<div
													className={`${styles.planBadge} ${
														badge.color === 'blue'
															? styles.badgeBlue
															: badge.color === 'green'
																? styles.badgeGreen
																: styles.badgePurple
													}`}
												>
													{badge.text}
												</div>
											)}
											<h3 className={styles.planName} data-testid="plan-name">
												{plan.name}
											</h3>
											{plan.description && (
												<p className={styles.planDescription}>{plan.description}</p>
											)}
										</header>

										<div className={styles.planPricing}>
											<span className={styles.planPrice} data-testid="plan-price">
												{formatPrice(plan.price)}
											</span>
											<span className={styles.planPeriod}>/mês</span>
										</div>

										<ul className={styles.planFeatures}>
											<li className={styles.planFeature} data-testid="plan-feature">
												<Check className={styles.checkIcon} aria-hidden="true" />
												<span>
													{plan.maxUsers === null
														? 'Usuários ilimitados'
														: `Até ${plan.maxUsers} usuário${plan.maxUsers > 1 ? 's' : ''}`}
												</span>
											</li>
											<li className={styles.planFeature} data-testid="plan-feature">
												<Check className={styles.checkIcon} aria-hidden="true" />
												<span>
													{plan.maxManagers === 0
														? 'Sem gestores'
														: `Até ${plan.maxManagers} gestor${plan.maxManagers > 1 ? 'es' : ''}`}
												</span>
											</li>
											<li className={styles.planFeature} data-testid="plan-feature">
												<Check className={styles.checkIcon} aria-hidden="true" />
												<span>{plan.maxSerasaQueries} consultas Serasa/mês</span>
											</li>
											<li className={styles.planFeature} data-testid="plan-feature">
												<Check className={styles.checkIcon} aria-hidden="true" />
												<span>Gestão completa de imóveis</span>
											</li>
											<li className={styles.planFeature} data-testid="plan-feature">
												<Check className={styles.checkIcon} aria-hidden="true" />
												<span>Contratos digitais</span>
											</li>
											{Boolean(plan.allowsLateCharges) && (
												<li className={styles.planFeature} data-testid="plan-feature">
													<Check className={styles.checkIcon} aria-hidden="true" />
													<span>Sistema de cobrança automático</span>
												</li>
											)}
											{plan.slug !== 'basico' && (
												<li className={styles.planFeature} data-testid="plan-feature">
													<Check className={styles.checkIcon} aria-hidden="true" />
													<span>Marketplace imobiliário</span>
												</li>
											)}
											{plan.slug === 'house' && (
												<>
													<li className={styles.planFeature} data-testid="plan-feature">
														<Check className={styles.checkIcon} aria-hidden="true" />
														<span>Relatórios avançados</span>
													</li>
													<li className={styles.planFeature} data-testid="plan-feature">
														<Check className={styles.checkIcon} aria-hidden="true" />
														<span>Suporte prioritário 24/7</span>
													</li>
												</>
											)}
										</ul>

										<div className={styles.planButton}>
											<Button
												onClick={() => onSelectPlan(plan.id)}
												variant={isPopular ? 'primary' : 'outline'}
												fullWidth
												size="large"
											>
												{isPopular ? 'Começar Agora' : 'Selecionar Plano'}
												{isPopular && <ArrowRight size={16} aria-hidden="true" />}
											</Button>
										</div>
									</article>
								</li>
							)
						})
					)}
				</ul>
			</div>
		</section>
	)
}
