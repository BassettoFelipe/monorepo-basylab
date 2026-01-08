import { api } from '@/lib/api'
import type {
	DeleteDocumentResponse,
	DocumentEntityType,
	DocumentType,
	ListDeletedDocumentsResponse,
	ListDocumentsResponse,
	UploadDocumentResponse,
} from '@/types/document.types'

export async function listDocuments(
	entityType: DocumentEntityType,
	entityId: string,
): Promise<ListDocumentsResponse> {
	const response = await api.get<ListDocumentsResponse>(`/api/documents/${entityType}/${entityId}`)
	return response.data
}

export async function listDeletedDocuments(
	entityType: DocumentEntityType,
	entityId: string,
): Promise<ListDeletedDocumentsResponse> {
	const response = await api.get<ListDeletedDocumentsResponse>(
		`/api/documents/${entityType}/${entityId}/deleted`,
	)
	return response.data
}

export async function uploadDocument(
	entityType: DocumentEntityType,
	entityId: string,
	documentType: DocumentType,
	file: File,
	description?: string,
): Promise<UploadDocumentResponse> {
	const formData = new FormData()
	formData.append('file', file)
	formData.append('entityType', entityType)
	formData.append('entityId', entityId)
	formData.append('documentType', documentType)
	if (description) {
		formData.append('description', description)
	}

	const response = await api.post<UploadDocumentResponse>('/api/documents', formData, {
		headers: {
			'Content-Type': undefined,
		},
	})
	return response.data
}

export async function deleteDocument(documentId: string): Promise<DeleteDocumentResponse> {
	const response = await api.delete<DeleteDocumentResponse>(`/api/documents/${documentId}`)
	return response.data
}
