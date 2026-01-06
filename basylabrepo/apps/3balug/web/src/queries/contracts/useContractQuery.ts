import { useQuery } from '@tanstack/react-query'
import { getContract } from '@/services/contracts/get'
import type { Contract } from '@/types/contract.types'
import { queryKeys } from '../queryKeys'

interface UseContractQueryOptions {
	enabled?: boolean
}

export const useContractQuery = (id: string | undefined, options?: UseContractQueryOptions) => {
	return useQuery<Contract>({
		queryKey: queryKeys.contracts.detail(id ?? ''),
		queryFn: () => getContract(id as string),
		enabled: !!id && (options?.enabled ?? true),
		staleTime: 0,
		gcTime: 1000 * 60 * 5,
	})
}
