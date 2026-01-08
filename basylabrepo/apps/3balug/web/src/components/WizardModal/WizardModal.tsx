import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import { Modal } from '@/components/Modal/Modal'
import * as styles from './WizardModal.css'

export interface WizardStep {
	id: string
	title: string
	description: string
	icon: ReactNode
}

interface WizardModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	steps: WizardStep[]
	currentStep: number
	children: ReactNode
	onNext: () => void
	onPrevious: () => void
	onSubmit: () => void
	isSubmitting?: boolean
	submitButtonText?: string
	submitLoadingText?: string
}

export function WizardModal({
	isOpen,
	onClose,
	title,
	steps,
	currentStep,
	children,
	onNext,
	onPrevious,
	onSubmit,
	isSubmitting = false,
	submitButtonText = 'Finalizar',
	submitLoadingText,
}: WizardModalProps) {
	const isFirstStep = currentStep === 0
	const isLastStep = currentStep === steps.length - 1
	const progress = ((currentStep + 1) / steps.length) * 100
	const currentStepData = steps[currentStep]

	const renderCustomHeader = () => (
		<div className={styles.customHeader}>
			<div className={styles.headerLeft}>
				<h2 className={styles.headerTitle}>{title}</h2>
				<p className={styles.headerDescription}>{currentStepData?.description}</p>
			</div>

			<div className={styles.headerCenter}>
				{/* Full step indicators (hidden on small mobile) */}
				<div className={styles.stepsContainer}>
					{steps.map((step, index) => {
						const isCompleted = index < currentStep
						const isActive = index === currentStep

						return (
							<div key={step.id} className={styles.stepItem}>
								{index > 0 && (
									<div
										className={`${styles.stepConnector} ${
											isCompleted ? styles.stepConnectorCompleted : ''
										}`}
									/>
								)}

								<div className={styles.stepContent}>
									<div
										className={`${styles.stepCircle} ${
											isCompleted
												? styles.stepCircleCompleted
												: isActive
													? styles.stepCircleActive
													: styles.stepCirclePending
										}`}
									>
										{isCompleted ? <Check size={16} /> : step.icon}
									</div>
									<span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
										{step.title}
									</span>
								</div>
							</div>
						)
					})}
				</div>

				{/* Mobile dot indicators (shown only on small screens) */}
				<div className={styles.mobileStepIndicator}>
					{steps.map((step, index) => {
						const isCompleted = index < currentStep
						const isActive = index === currentStep

						return (
							<div
								key={step.id}
								className={`${styles.mobileStepDot} ${
									isActive
										? styles.mobileStepDotActive
										: isCompleted
											? styles.mobileStepDotCompleted
											: ''
								}`}
							/>
						)
					})}
				</div>
			</div>

			<div className={styles.headerRight}>
				<button
					type="button"
					className={styles.closeButton}
					onClick={onClose}
					aria-label="Fechar modal"
					disabled={isSubmitting}
				>
					<X size={20} />
				</button>
			</div>
		</div>
	)

	const renderFooter = () => (
		<div className={styles.footer}>
			<div className={styles.footerLeft}>
				<span className={styles.progressText}>
					Passo {currentStep + 1} de {steps.length}
				</span>
				<div className={styles.progressBar}>
					<div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
				</div>
			</div>

			<div className={styles.footerRight}>
				{isFirstStep ? (
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Cancelar
					</Button>
				) : (
					<Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
						<ChevronLeft size={18} />
						Anterior
					</Button>
				)}

				{isLastStep ? (
					<Button variant="primary" onClick={onSubmit} loading={isSubmitting}>
						{isSubmitting && submitLoadingText ? submitLoadingText : submitButtonText}
					</Button>
				) : (
					<Button variant="primary" onClick={onNext} disabled={isSubmitting}>
						Proximo
						<ChevronRight size={18} />
					</Button>
				)}
			</div>
		</div>
	)

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			size="full"
			footer={renderFooter()}
			customHeader={renderCustomHeader()}
		>
			{children}
		</Modal>
	)
}
