export type MaskType =
	| 'cardNumber'
	| 'cpf'
	| 'cnpj'
	| 'rg'
	| 'phone'
	| 'cep'
	| 'date'
	| 'cardExpiration'
	| 'cvv'
	| 'currency'

export function applyMask(value: string, maskType: MaskType): string {
	const digits = value.replace(/\D/g, '')

	switch (maskType) {
		case 'cardNumber':
			return applyCardNumberMask(digits)
		case 'cpf':
			return applyCpfMask(digits)
		case 'cnpj':
			return applyCnpjMask(digits)
		case 'rg':
			return applyRgMask(digits)
		case 'phone':
			return applyPhoneMask(digits)
		case 'cep':
			return applyCepMask(digits)
		case 'date':
			return applyDateMask(digits)
		case 'cardExpiration':
			return applyCardExpirationMask(digits)
		case 'cvv':
			return applyCvvMask(digits)
		case 'currency':
			return applyCurrencyMask(value)
		default:
			return value
	}
}

export function getRawValue(value: string): string {
	return value.replace(/\D/g, '')
}

function applyCardNumberMask(digits: string): string {
	const limited = digits.slice(0, 16)
	return limited.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function applyCpfMask(digits: string): string {
	const limited = digits.slice(0, 11)

	if (limited.length <= 3) {
		return limited
	}
	if (limited.length <= 6) {
		return `${limited.slice(0, 3)}.${limited.slice(3)}`
	}
	if (limited.length <= 9) {
		return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
	}
	return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
}

function applyCnpjMask(digits: string): string {
	const limited = digits.slice(0, 14)

	if (limited.length <= 2) {
		return limited
	}
	if (limited.length <= 5) {
		return `${limited.slice(0, 2)}.${limited.slice(2)}`
	}
	if (limited.length <= 8) {
		return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`
	}
	if (limited.length <= 12) {
		return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`
	}
	return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`
}

function applyRgMask(digits: string): string {
	const limited = digits.slice(0, 9)

	if (limited.length <= 2) {
		return limited
	}
	if (limited.length <= 5) {
		return `${limited.slice(0, 2)}.${limited.slice(2)}`
	}
	if (limited.length <= 8) {
		return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`
	}
	return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}-${limited.slice(8)}`
}

function applyPhoneMask(digits: string): string {
	const limited = digits.slice(0, 11)

	if (limited.length <= 2) {
		return limited
	}
	if (limited.length <= 6) {
		return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
	}
	if (limited.length <= 10) {
		return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
	}
	return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
}

function applyCepMask(digits: string): string {
	const limited = digits.slice(0, 8)

	if (limited.length <= 5) {
		return limited
	}
	return `${limited.slice(0, 5)}-${limited.slice(5)}`
}

function applyDateMask(digits: string): string {
	const limited = digits.slice(0, 8)

	if (limited.length <= 2) {
		return limited
	}
	if (limited.length <= 4) {
		return `${limited.slice(0, 2)}/${limited.slice(2)}`
	}
	return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`
}

function applyCardExpirationMask(digits: string): string {
	const limited = digits.slice(0, 4)

	if (limited.length <= 2) {
		return limited
	}
	return `${limited.slice(0, 2)}/${limited.slice(2)}`
}

function applyCvvMask(digits: string): string {
	return digits.slice(0, 4)
}

function applyCurrencyMask(value: string): string {
	const digits = value.replace(/\D/g, '')

	if (!digits) {
		return ''
	}

	// Converte para centavos e formata
	const cents = Number.parseInt(digits, 10)
	const reais = cents / 100

	return reais.toLocaleString('pt-BR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
}

/**
 * Extrai o valor em CENTAVOS de uma string formatada como moeda.
 * Ex: "1.234,56" -> 123456 (centavos)
 * @param value String formatada como moeda (ex: "1.234,56")
 * @returns Valor em centavos (integer)
 */
export function getCurrencyRawValue(value: string): number {
	const digits = value.replace(/\D/g, '')
	if (!digits) return 0
	// Retorna o valor em centavos (não divide por 100)
	return Number.parseInt(digits, 10)
}

/**
 * Formata um valor em CENTAVOS para exibição em input.
 * Ex: 123456 (centavos) -> "1.234,56"
 * @param valueInCents Valor em centavos
 * @returns String formatada para exibição
 */
export function formatCurrencyToInput(valueInCents: number): string {
	if (!valueInCents) return ''
	// Converte de centavos para reais antes de formatar
	const valueInReais = valueInCents / 100
	return valueInReais.toLocaleString('pt-BR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
}
