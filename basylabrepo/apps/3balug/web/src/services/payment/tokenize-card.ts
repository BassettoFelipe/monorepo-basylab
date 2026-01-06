interface TokenizeCardInput {
	cardNumber: string
	cardholderName: string
	cardExpiration: string
	securityCode: string
}

interface TokenizeCardResponse {
	cardToken: string
}

export const tokenizeCard = async (input: TokenizeCardInput): Promise<TokenizeCardResponse> => {
	const pagarmePublicKey = import.meta.env.VITE_PAGARME_PUBLIC_KEY

	if (!pagarmePublicKey) {
		throw new Error('Chave pública do Pagarme não configurada')
	}

	const [expMonth = '', expYear = ''] = input.cardExpiration.split('/')

	const cardData = {
		type: 'card',
		card: {
			number: input.cardNumber.replace(/\s/g, ''),
			holder_name: input.cardholderName,
			exp_month: Number.parseInt(expMonth, 10),
			exp_year: Number.parseInt(`20${expYear}`, 10),
			cvv: input.securityCode,
		},
	}

	const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${pagarmePublicKey}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(cardData),
	})

	if (!response.ok) {
		throw new Error(
			'Não foi possível processar os dados do cartão. Verifique as informações e tente novamente.',
		)
	}

	const tokenData = await response.json()

	return {
		cardToken: tokenData.id,
	}
}
