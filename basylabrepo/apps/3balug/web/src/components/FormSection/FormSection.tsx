import { ChevronDown } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import * as styles from './FormSection.css'

export interface FormSectionProps {
	title: string
	description?: string
	icon?: ReactNode
	children: ReactNode
	defaultExpanded?: boolean
	collapsible?: boolean
	requiredFields?: number
	completedFields?: number
	optionalFields?: number
	completedOptionalFields?: number
}

export function FormSection({
	title,
	description,
	icon,
	children,
	defaultExpanded = true,
	collapsible = true,
	requiredFields,
	completedFields,
	optionalFields,
	completedOptionalFields,
}: FormSectionProps) {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded)
	const [isAnimating, setIsAnimating] = useState(false)

	const hasRequired = requiredFields !== undefined && requiredFields > 0
	const showProgress = hasRequired && completedFields !== undefined
	const isComplete = showProgress && completedFields === requiredFields
	const hasStarted = showProgress && completedFields > 0

	const handleToggle = () => {
		if (collapsible) {
			setIsAnimating(true)
			setIsExpanded(!isExpanded)
			setTimeout(() => setIsAnimating(false), 200)
		}
	}

	const headerContent = (
		<>
			<div className={styles.headerLeft}>
				{icon && <div className={styles.icon}>{icon}</div>}
				<div className={styles.headerContent}>
					<div className={styles.titleRow}>
						<h3 className={styles.title}>{title}</h3>
						{showProgress && (
							<span
								className={`${styles.badge} ${
									isComplete
										? styles.badgeComplete
										: hasStarted
											? styles.badgeInProgress
											: styles.badgePending
								}`}
							>
								{completedFields}/{requiredFields} obrigatório
								{requiredFields !== 1 ? 's' : ''}
							</span>
						)}
						{optionalFields !== undefined && optionalFields > 0 && (
							<span className={styles.totalBadge}>
								{completedOptionalFields ?? 0}/{optionalFields} opcional
								{optionalFields !== 1 ? 'is' : ''}
							</span>
						)}
					</div>
					{description && <p className={styles.description}>{description}</p>}
				</div>
			</div>

			{collapsible && (
				<div className={`${styles.chevron} ${isExpanded ? styles.chevronRotated : ''}`}>
					<ChevronDown size={20} />
				</div>
			)}
		</>
	)

	return (
		<div className={styles.container}>
			{collapsible ? (
				<button type="button" onClick={handleToggle} className={styles.header}>
					{headerContent}
				</button>
			) : (
				<div className={styles.headerStatic}>{headerContent}</div>
			)}

			{(isExpanded || isAnimating) && (
				<div
					className={`${styles.contentWrapper} ${
						isExpanded ? styles.contentExpanded : styles.contentCollapsed
					}`}
				>
					<div className={styles.content}>{children}</div>
				</div>
			)}
		</div>
	)
}
