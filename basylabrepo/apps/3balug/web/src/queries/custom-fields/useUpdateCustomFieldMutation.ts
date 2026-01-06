import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { queryKeys } from '@/queries/queryKeys'
import { type UpdateCustomFieldPayload, updateCustomField } from '@/services/custom-fields/update'
import type { ListCustomFieldsResponse } from '@/types/custom-field.types'

export function useUpdateCustomFieldMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ fieldId, payload }: { fieldId: string; payload: UpdateCustomFieldPayload }) =>
			updateCustomField(fieldId, payload),

		// Optimistic update
		onMutate: async ({ fieldId, payload }) => {
			// Cancela queries em andamento
			await queryClient.cancelQueries({
				queryKey: queryKeys.customFields.list,
			})

			// Snapshot do estado anterior
			const previousData = queryClient.getQueriesData<ListCustomFieldsResponse>({
				queryKey: queryKeys.customFields.list,
			})

			// Atualiza otimisticamente
			queryClient.setQueriesData<ListCustomFieldsResponse>(
				{ queryKey: queryKeys.customFields.list },
				(old) => {
					if (!old) return old
					return {
						...old,
						data: old.data.map((field) =>
							field.id === fieldId ? { ...field, ...payload } : field,
						),
					}
				},
			)

			return { previousData }
		},

		onError: (err: unknown, _variables, context) => {
			// Reverte em caso de erro
			if (context?.previousData) {
				for (const [queryKey, data] of context.previousData) {
					queryClient.setQueryData(queryKey, data)
				}
			}

			const errorMessage =
				err instanceof Error ? err.message : 'Erro ao atualizar campo customizado'
			toast.error(errorMessage)
		},

		onSettled: () => {
			// Revalida para garantir consistência
			queryClient.invalidateQueries({ queryKey: queryKeys.customFields.list })
		},
	})
}
