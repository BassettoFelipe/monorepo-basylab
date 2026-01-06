import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateCompanyInput } from '@/services/company/update-company'
import { updateCompany } from '@/services/company/update-company'

export const useUpdateCompanyMutation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: UpdateCompanyInput) => updateCompany(input),
		onSuccess: () => {
			// Invalida a query de company e de user (me) para atualizar os dados
			queryClient.invalidateQueries({ queryKey: ['company', 'me'] })
			queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
		},
	})
}
