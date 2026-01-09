import { useCallback, useState } from 'react'

interface ViaCepResponse {
	cep: string
	logradouro: string
	complemento: string
	bairro: string
	localidade: string
	uf: string
	erro?: boolean
}

export interface CepResult {
	address: string
	neighborhood: string
	city: string
	state: string
}

export interface UseCepLookupReturn {
	isLoading: boolean
	error: string | null
	fetchAddress: (cep: string) => Promise<CepResult | null>
	clearError: () => void
}

/**
 * Hook for looking up addresses by CEP (Brazilian postal code)
 * Uses the ViaCEP API (https://viacep.com.br/)
 *
 * @returns Object with loading state, error state, and fetch function
 *
 * @example
 * const { isLoading, error, fetchAddress, clearError } = useCepLookup()
 *
 * const handleCepBlur = async (cep: string) => {
 *   const result = await fetchAddress(cep)
 *   if (result) {
 *     setValue('address', result.address)
 *     setValue('city', result.city)
 *     setValue('state', result.state)
 *   }
 * }
 */
export function useCepLookup(): UseCepLookupReturn {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchAddress = useCallback(async (cep: string): Promise<CepResult | null> => {
		const cleanCep = cep.replace(/\D/g, '')

		if (cleanCep.length !== 8) {
			return null
		}

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)

			if (!response.ok) {
				throw new Error('Erro ao buscar CEP')
			}

			const data: ViaCepResponse = await response.json()

			if (data.erro) {
				setError('CEP nao encontrado')
				return null
			}

			return {
				address: data.logradouro || '',
				neighborhood: data.bairro || '',
				city: data.localidade || '',
				state: data.uf || '',
			}
		} catch {
			setError('Erro ao buscar CEP. Preencha manualmente.')
			return null
		} finally {
			setIsLoading(false)
		}
	}, [])

	const clearError = useCallback(() => {
		setError(null)
	}, [])

	return { isLoading, error, fetchAddress, clearError }
}
