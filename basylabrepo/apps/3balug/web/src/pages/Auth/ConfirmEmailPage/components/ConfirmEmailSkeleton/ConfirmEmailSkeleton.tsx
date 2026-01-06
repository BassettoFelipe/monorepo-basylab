import { Skeleton } from '@/components/Skeleton/Skeleton'
import * as pageStyles from '../../ConfirmEmailPage.css'
import * as styles from './ConfirmEmailSkeleton.css'

export function ConfirmEmailSkeleton() {
	const codePlaceholders = ['slot-1', 'slot-2', 'slot-3', 'slot-4', 'slot-5', 'slot-6']

	return (
		<main
			className={pageStyles.confirmEmailPage}
			aria-busy="true"
			aria-label="Carregando página de confirmação de email"
		>
			<div className={pageStyles.backgroundDecor} aria-hidden="true" />
			<div className={pageStyles.backgroundDecor2} aria-hidden="true" />

			<section className={pageStyles.confirmEmailContainer} aria-label="Conteúdo em carregamento">
				<header className={pageStyles.confirmEmailHeader}>
					<div className={pageStyles.confirmEmailIcon}>
						<Skeleton width="48px" height="48px" variant="circular" />
					</div>
					<div style={{ margin: '0 auto 12px', width: '80%' }}>
						<Skeleton width="100%" height="32px" variant="rounded" />
					</div>
					<div style={{ margin: '0 auto 8px', width: '60%' }}>
						<Skeleton width="100%" height="20px" variant="rounded" />
					</div>
					<div style={{ margin: '0 auto', width: '50%' }}>
						<Skeleton width="100%" height="24px" variant="rounded" />
					</div>
				</header>

				<div className={pageStyles.confirmEmailForm} aria-hidden="true">
					<div className={styles.codeInputContainer}>
						{codePlaceholders.map((slotId) => (
							<div
								key={slotId}
								style={{
									width: '60px',
									height: '72px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Skeleton width="100%" height="100%" variant="rounded" />
							</div>
						))}
					</div>

					<div style={{ marginTop: '16px' }}>
						<Skeleton width="100%" height="48px" variant="rounded" />
					</div>

					<footer className={pageStyles.confirmEmailFooter}>
						<div style={{ margin: '0 auto 12px', width: '70%' }}>
							<Skeleton width="100%" height="16px" variant="rounded" />
						</div>
						<div style={{ margin: '0 auto', width: '40%' }}>
							<Skeleton width="100%" height="14px" variant="rounded" />
						</div>
					</footer>
				</div>
			</section>
		</main>
	)
}
