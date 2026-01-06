import { Check, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import type { Plan } from '@/types/plan.types'
import { formatPrice } from '@/utils/currency'
import * as styles from '../../RegistrationCheckoutPage/RegistrationCheckoutPage.css'

interface PlanChangeModalProps {
	isOpen: boolean
	onClose: () => void
	plans: Plan[]
	currentPlanId: string
	selectedPlanId: string
	onSelectPlan: (planId: string) => void
	onConfirm: () => void
	isLoading: boolean
}

export function PlanChangeModal({
	isOpen,
	onClose,
	plans,
	currentPlanId,
	selectedPlanId,
	onSelectPlan,
	onConfirm,
	isLoading,
}: PlanChangeModalProps) {
	const modalRef = useRef<HTMLDivElement>(null)
	const firstInputRef = useRef<HTMLInputElement>(null)

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape' && !isLoading) {
				onClose()
			}
		},
		[onClose, isLoading],
	)

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown)
			document.body.style.overflow = 'hidden'
			setTimeout(() => {
				firstInputRef.current?.focus()
			}, 100)
		}
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = ''
		}
	}, [isOpen, handleKeyDown])

	if (!isOpen) return null

	const hasChanges = selectedPlanId !== currentPlanId
	const selectedPlan = plans.find((p) => p.id === selectedPlanId)

	return (
		<div className={styles.planChangeOverlay}>
			<button
				type="button"
				className={styles.planChangeBackdrop}
				onClick={isLoading ? undefined : onClose}
				aria-label="Fechar modal"
				tabIndex={-1}
				disabled={isLoading}
			/>
			<div
				ref={modalRef}
				className={styles.planChangeModal}
				role="dialog"
				aria-modal="true"
				aria-labelledby="plan-modal-title"
			>
				<div className={styles.planChangeHeader}>
					<h2 id="plan-modal-title" className={styles.planChangeTitle}>
						Alterar Plano
					</h2>
					<button
						type="button"
						onClick={onClose}
						className={styles.planChangeCloseButton}
						aria-label="Fechar modal"
						disabled={isLoading}
					>
						<X size={18} />
					</button>
				</div>

				<div className={styles.planChangeContent}>
					<p className={styles.planChangeDescription}>Escolha o plano ideal para o seu negocio</p>

					<div className={styles.planGrid} role="radiogroup" aria-label="Planos disponiveis">
						{plans.map((plan, index) => {
							const isSelected = plan.id === selectedPlanId
							const isCurrent = plan.id === currentPlanId

							return (
								<label
									key={plan.id}
									className={`${styles.planOption} ${isSelected ? styles.planOptionSelected : ''} ${isCurrent && !isSelected ? styles.planOptionCurrent : ''}`}
								>
									<input
										ref={index === 0 ? firstInputRef : undefined}
										type="radio"
										name="plan-selection"
										value={plan.id}
										checked={isSelected}
										onChange={() => onSelectPlan(plan.id)}
										className={styles.planOptionRadioInput}
										disabled={isLoading}
									/>
									{isSelected && (
										<span className={styles.planOptionSelectedBadge} aria-hidden="true">
											<Check size={14} strokeWidth={3} color="#1a1a1a" />
										</span>
									)}

									{isCurrent && <span className={styles.planOptionBadge}>Atual</span>}

									<span className={styles.planOptionName}>{plan.name}</span>

									<div className={styles.planOptionPrice}>
										{formatPrice(plan.price)}
										<span className={styles.planOptionPricePeriod}>/mes</span>
									</div>

									{plan.features.length > 0 && (
										<div className={styles.planOptionFeatures}>
											{plan.features.map((feature) => (
												<div key={feature} className={styles.planOptionFeature}>
													<Check size={14} className={styles.planOptionFeatureIcon} />
													<span>{feature}</span>
												</div>
											))}
										</div>
									)}
								</label>
							)
						})}
					</div>
				</div>

				<div className={styles.planChangeFooter}>
					<button
						type="button"
						onClick={onClose}
						className={styles.planChangeCancelButton}
						disabled={isLoading}
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={!hasChanges || isLoading}
						className={styles.planChangeConfirmButton}
						aria-busy={isLoading}
					>
						{isLoading
							? 'Alterando...'
							: hasChanges
								? `Confirmar ${selectedPlan?.name || ''}`
								: 'Selecione um plano diferente'}
					</button>
				</div>
			</div>
		</div>
	)
}
