import Cards from 'react-credit-cards-2'
import 'react-credit-cards-2/dist/es/styles-compiled.css'
import * as styles from './CreditCardPreview.css'

interface CreditCardPreviewProps {
	cardNumber: string
	cardholderName: string
	cardExpiration: string
	securityCode: string
}

export function CreditCardPreview({
	cardNumber,
	cardholderName,
	cardExpiration,
	securityCode,
}: CreditCardPreviewProps) {
	return (
		<div
			className={styles.cardWrapper}
			role="img"
			aria-label="Pré-visualização do cartão de crédito"
		>
			<Cards
				number={cardNumber.replace(/\s/g, '')}
				name={cardholderName}
				expiry={cardExpiration.replace('/', '')}
				cvc={securityCode}
				locale={{
					valid: 'Válido até',
				}}
				placeholders={{
					name: 'SEU NOME AQUI',
				}}
			/>
		</div>
	)
}
