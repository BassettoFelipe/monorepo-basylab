import { Check, Circle } from 'lucide-react'
import { PASSWORD_REQUIREMENTS } from '@/utils/password'
import * as styles from './PasswordRequirementsList.css'

interface PasswordRequirementsListProps {
	password: string
}

export function PasswordRequirementsList({ password }: PasswordRequirementsListProps) {
	const metRequirements = PASSWORD_REQUIREMENTS.filter(({ test }) =>
		password ? test(password) : false,
	).length
	const totalRequirements = PASSWORD_REQUIREMENTS.length

	return (
		<output
			id="password-requirements"
			className={styles.passwordRequirements}
			aria-live="polite"
			aria-label={`Requisitos da senha: ${metRequirements} de ${totalRequirements} atendidos`}
		>
			{PASSWORD_REQUIREMENTS.map(({ label, test }) => {
				const met = password ? test(password) : false
				return (
					<div
						key={label}
						className={`${styles.passwordRequirement} ${met ? styles.passwordRequirementMet : ''}`}
					>
						{met ? (
							<Check size={12} className={styles.passwordRequirementIcon} aria-hidden="true" />
						) : (
							<Circle size={12} className={styles.passwordRequirementIcon} aria-hidden="true" />
						)}
						<span>
							<span className="sr-only">{met ? 'Atendido: ' : 'Não atendido: '}</span>
							{label}
						</span>
					</div>
				)
			})}
		</output>
	)
}
