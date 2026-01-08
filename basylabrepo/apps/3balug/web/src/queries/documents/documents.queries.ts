import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	deleteDocument,
	listDeletedDocuments,
	listDocuments,
	uploadDocument,
} from '@/services/documents/documents.service'
import type { DocumentEntityType, DocumentType } from '@/types/document.types'

export const documentKeys = {
	all: ['documents'] as const,
	lists: () => [...documentKeys.all, 'list'] as const,
	list: (entityType: DocumentEntityType, entityId: string) =>
		[...documentKeys.lists(), entityType, entityId] as const,
	deletedLists: () => [...documentKeys.all, 'deleted'] as const,
	deletedList: (entityType: DocumentEntityType, entityId: string) =>
		[...documentKeys.deletedLists(), entityType, entityId] as const,
}

export function useDocumentsQuery(
	entityType: DocumentEntityType,
	entityId: string,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: documentKeys.list(entityType, entityId),
		queryFn: () => listDocuments(entityType, entityId),
		enabled: options?.enabled ?? !!entityId,
	})
}

export function useDeletedDocumentsQuery(
	entityType: DocumentEntityType,
	entityId: string,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: documentKeys.deletedList(entityType, entityId),
		queryFn: () => listDeletedDocuments(entityType, entityId),
		enabled: options?.enabled ?? !!entityId,
	})
}

export function useUploadDocumentMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			entityType,
			entityId,
			documentType,
			file,
			description,
		}: {
			entityType: DocumentEntityType
			entityId: string
			documentType: DocumentType
			file: File
			description?: string
		}) => uploadDocument(entityType, entityId, documentType, file, description),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: documentKeys.list(variables.entityType, variables.entityId),
			})
		},
	})
}

export function useDeleteDocumentMutation() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			documentId,
		}: {
			documentId: string
			entityType: DocumentEntityType
			entityId: string
		}) => deleteDocument(documentId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: documentKeys.list(variables.entityType, variables.entityId),
			})
		},
	})
}
