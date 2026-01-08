import { applyMask } from './masks'

/**
 * Formata um documento (CPF ou CNPJ) para exibicao
 * @param doc - Documento (apenas digitos ou ja formatado)
 * @param type - Tipo do documento ('cpf' ou 'cnpj')
 * @returns Documento formatado
 */
export function formatDocument(doc: string, type: 'cpf' | 'cnpj'): string {
	return applyMask(doc, type)
}

/**
 * Formata um telefone para exibicao
 * @param phone - Telefone (apenas digitos ou ja formatado)
 * @returns Telefone formatado ou null se vazio
 */
export function formatPhone(phone: string | null | undefined): string | null {
	if (!phone) return null
	return applyMask(phone, 'phone')
}

/**
 * Formata uma data ISO para exibicao no formato brasileiro (dd/mm/yyyy)
 * @param dateString - Data em formato ISO ou string de data valida
 * @returns Data formatada ou '-' se invalida
 */
export function formatDate(dateString: string | null | undefined): string {
	if (!dateString) return '-'
	try {
		const date = new Date(dateString)
		if (Number.isNaN(date.getTime())) return '-'
		return date.toLocaleDateString('pt-BR')
	} catch {
		return '-'
	}
}

/**
 * Formata uma data ISO para exibicao no formato brasileiro ou retorna null
 * Util quando voce quer checar se a data e valida antes de exibir
 * @param dateString - Data em formato ISO ou string de data valida
 * @returns Data formatada ou null se invalida
 */
export function formatDateOrNull(dateString: string | null | undefined): string | null {
	if (!dateString) return null
	try {
		const date = new Date(dateString)
		if (Number.isNaN(date.getTime())) return null
		return date.toLocaleDateString('pt-BR')
	} catch {
		return null
	}
}

/**
 * Formata um CEP para exibicao
 * @param cep - CEP (apenas digitos ou ja formatado)
 * @returns CEP formatado ou o valor original se invalido
 */
export function formatCep(cep: string | null | undefined): string | null {
	if (!cep) return null
	return applyMask(cep, 'cep')
}

/**
 * Formata um valor em centavos para moeda brasileira
 * @param valueInCents - Valor em centavos
 * @returns Valor formatado (ex: R$ 1.234,56) ou null se invalido
 */
export function formatCurrencyFromCents(valueInCents: number | null | undefined): string | null {
	if (valueInCents === null || valueInCents === undefined) return null
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(valueInCents / 100)
}

/**
 * Formata um valor em reais para moeda brasileira
 * @param value - Valor em reais
 * @returns Valor formatado (ex: R$ 1.234,56) ou null se invalido
 */
export function formatCurrency(value: number | null | undefined): string | null {
	if (value === null || value === undefined) return null
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value)
}

/**
 * Formata tamanho de arquivo para exibicao legivel
 * @param bytes - Tamanho em bytes
 * @returns Tamanho formatado (ex: 1.5 MB)
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
