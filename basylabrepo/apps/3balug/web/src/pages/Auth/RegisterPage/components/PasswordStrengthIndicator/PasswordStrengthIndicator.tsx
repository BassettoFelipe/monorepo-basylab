import { calculatePasswordStrength } from '@/utils/password'
import * as styles from './PasswordStrengthIndicator.css'

interface PasswordStrengthIndicatorProps {
	password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
	const strength = password ? calculatePasswordStrength(password) : null
	const strengthClasses = {
		weak: {
			barClass: styles.passwordStrengthBarWeak,
			labelClass: styles.passwordStrengthLabelWeak,
		},
		medium: {
			barClass: styles.passwordStrengthBarMedium,
			labelClass: styles.passwordStrengthLabelMedium,
		},
		strong: {
			barClass: styles.passwordStrengthBarStrong,
			labelClass: styles.passwordStrengthLabelStrong,
		},
	} as const

	const { barClass, labelClass } = strength
		? strengthClasses[strength.color]
		: { barClass: '', labelClass: '' }

	const bars = [0, 1, 2, 3, 4, 5] as const

	return (
		<output
			id="password-strength"
			className={styles.passwordStrength}
			aria-live="polite"
			aria-atomic="true"
		>
			<div className={styles.passwordStrengthBars} aria-hidden="true">
				{bars.map((i) => (
					<div
						key={`strength-bar-${i}`}
						className={`${styles.passwordStrengthBar} ${strength && i < strength.score ? barClass : ''}`}
					/>
				))}
			</div>
			<span className={`${styles.passwordStrengthLabel} ${labelClass}`}>
				{strength ? `Força da senha: ${strength.label}` : '\u00A0'}
			</span>
		</output>
	)
}
