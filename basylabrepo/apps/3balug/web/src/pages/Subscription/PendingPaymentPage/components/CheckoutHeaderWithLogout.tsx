import { CreditCard, LogOut } from 'lucide-react'
import * as styles from '../../RegistrationCheckoutPage/RegistrationCheckoutPage.css'

interface CheckoutHeaderWithLogoutProps {
	onLogout: () => void
	isLoggingOut: boolean
}

export function CheckoutHeaderWithLogout({
	onLogout,
	isLoggingOut,
}: CheckoutHeaderWithLogoutProps) {
	return (
		<div className={styles.checkoutHeaderWithLogout}>
			<div className={styles.checkoutHeader}>
				<div className={styles.checkoutIconWrapper}>
					<CreditCard className={styles.checkoutIcon} />
				</div>
				<div className={styles.checkoutHeaderContent}>
					<h1 className={styles.checkoutHeaderTitle}>Finalizar Assinatura</h1>
					<p className={styles.checkoutHeaderText}>
						Complete os dados do cartao para ativar seu plano
					</p>
				</div>
			</div>
			<button
				type="button"
				onClick={onLogout}
				disabled={isLoggingOut}
				className={styles.logoutButton}
			>
				<LogOut size={14} />
				{isLoggingOut ? 'Saindo...' : 'Sair'}
			</button>
		</div>
	)
}
