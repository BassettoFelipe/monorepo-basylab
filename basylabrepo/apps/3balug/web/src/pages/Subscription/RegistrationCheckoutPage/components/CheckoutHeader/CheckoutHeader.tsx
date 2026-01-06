import { CreditCard } from 'lucide-react'
import * as styles from './CheckoutHeader.css'

export function CheckoutHeader() {
	return (
		<header className={styles.checkoutHeader}>
			<div className={styles.checkoutIconWrapper} aria-hidden="true">
				<CreditCard className={styles.checkoutIcon} />
			</div>
			<div className={styles.checkoutHeaderContent}>
				<h1 className={styles.checkoutHeaderTitle}>Finalizar Assinatura</h1>
				<p className={styles.checkoutHeaderText}>
					Complete os dados do cartão para ativar seu plano
				</p>
			</div>
		</header>
	)
}
