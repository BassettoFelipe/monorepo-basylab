import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import * as styles from './ResendSection.css'

interface ResendSectionProps {
	remainingAttempts: number
	cooldownSeconds: number
	onResend: () => void
	isResending: boolean
	isBlocked: boolean
}

export function ResendSection({
	remainingAttempts,
	cooldownSeconds,
	onResend,
	isResending,
	isBlocked,
}: ResendSectionProps) {
	const isResendBlocked = remainingAttempts === 0 || isBlocked
	const isDisabled = cooldownSeconds > 0 || isResending || isResendBlocked

	if (isResendBlocked) {
		return (
			<div className={styles.errorBox}>
				<div className={styles.errorContent}>
					<AlertCircle className={styles.errorIcon} />
					<div className={styles.errorTextContainer}>
						<h4 className={styles.errorTitle}>Limite de reenvios atingido</h4>
						<p className={styles.errorDescription}>
							Aguarde alguns minutos e solicite um novo código na{' '}
							<a href="/forgot-password" className={styles.errorLink}>
								tela anterior
							</a>
							.
						</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<div className={styles.resendContent}>
				<div className={styles.resendText}>
					<span className={styles.promptText}>Não recebeu o código?</span>
					{remainingAttempts > 0 && remainingAttempts < 5 && (
						<span className={styles.attemptsText}>
							{remainingAttempts}{' '}
							{remainingAttempts === 1 ? 'reenvio restante' : 'reenvios restantes'}
						</span>
					)}
				</div>
				<Button
					type="button"
					onClick={onResend}
					disabled={isDisabled}
					variant="secondary"
					size="small"
					loading={isResending}
				>
					{cooldownSeconds > 0 ? `Aguarde ${cooldownSeconds}s` : 'Reenviar código'}
				</Button>
			</div>
		</div>
	)
}
