import { api } from '@/lib/api'
import type { Contract, CreateContractInput } from '@/types/contract.types'

interface CreateContractResponse {
	data: Contract
	message: string
}

export const createContract = async (
	input: CreateContractInput,
): Promise<CreateContractResponse> => {
	const { data } = await api.post<CreateContractResponse>('/api/contracts', input)
	return data
}
