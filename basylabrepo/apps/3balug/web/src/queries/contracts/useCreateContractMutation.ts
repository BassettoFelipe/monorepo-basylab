import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContract } from '@/services/contracts/create'
import type { CreateContractInput } from '@/types/contract.types'
import { queryKeys } from '../queryKeys'

export const useCreateContractMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: CreateContractInput) => createContract(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.contracts.all,
				refetchType: 'active',
			})
			await queryClient.invalidateQueries({
				queryKey: queryKeys.properties.all,
				refetchType: 'active',
			})
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboard.stats,
				refetchType: 'active',
			})
		},
	})
}
