import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/Button/Button'
import * as styles from './StepWizard.css'

export interface Step {
	id: string
	title: string
	description?: string
	icon?: ReactNode
}

interface StepWizardProps {
	steps: Step[]
	currentStep: number
	onStepChange: (step: number) => void
	children: ReactNode
	onCancel?: () => void
	onComplete?: () => void
	isSubmitting?: boolean
	canProceed?: boolean
	completeButtonText?: string
	cancelButtonText?: string
	nextButtonText?: string
	previousButtonText?: string
	showProgressBar?: boolean
}

export function StepWizard({
	steps,
	currentStep,
	onStepChange,
	children,
	onCancel,
	onComplete,
	isSubmitting = false,
	canProceed = true,
	completeButtonText = 'Finalizar',
	cancelButtonText = 'Cancelar',
	nextButtonText = 'Proximo',
	previousButtonText = 'Anterior',
	showProgressBar = true,
}: StepWizardProps) {
	const isFirstStep = currentStep === 0
	const isLastStep = currentStep === steps.length - 1
	const progress = ((currentStep + 1) / steps.length) * 100
	const currentStepData = steps[currentStep]

	const handlePrevious = () => {
		if (!isFirstStep) {
			onStepChange(currentStep - 1)
		}
	}

	const handleNext = () => {
		if (isLastStep) {
			onComplete?.()
		} else {
			onStepChange(currentStep + 1)
		}
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
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

								<div
									className={`${styles.stepCircle} ${
										isCompleted
											? styles.stepCircleCompleted
											: isActive
												? styles.stepCircleActive
												: styles.stepCirclePending
									}`}
								>
									{isCompleted ? <Check size={16} /> : index + 1}
								</div>

								<span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
									{step.title}
								</span>
							</div>
						)
					})}
				</div>
			</div>

			<div className={styles.body}>
				{currentStepData && (
					<>
						<h3 className={styles.stepTitle}>{currentStepData.title}</h3>
						{currentStepData.description && (
							<p className={styles.stepDescription}>{currentStepData.description}</p>
						)}
					</>
				)}
				{children}
			</div>

			<div className={styles.footer}>
				<div className={styles.footerLeft}>
					{showProgressBar && (
						<>
							<span className={styles.progressText}>
								Passo {currentStep + 1} de {steps.length}
							</span>
							<div className={styles.progressBar}>
								<div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
							</div>
						</>
					)}
				</div>

				<div className={styles.footerRight}>
					{isFirstStep ? (
						<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
							{cancelButtonText}
						</Button>
					) : (
						<Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
							<ChevronLeft size={18} />
							{previousButtonText}
						</Button>
					)}

					<Button
						variant="primary"
						onClick={handleNext}
						disabled={!canProceed || isSubmitting}
						loading={isSubmitting && isLastStep}
					>
						{isLastStep ? (
							completeButtonText
						) : (
							<>
								{nextButtonText}
								<ChevronRight size={18} />
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	)
}
