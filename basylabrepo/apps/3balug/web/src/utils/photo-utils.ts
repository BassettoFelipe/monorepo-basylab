/**
 * Utilitarios para manipulacao de fotos de imoveis
 */

export const PHOTO_MAX_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_PHOTOS_PER_PROPERTY = 20

export interface PhotoValidationResult {
	valid: boolean
	error?: string
}

/**
 * Valida se o tipo do arquivo e permitido
 */
export function isValidPhotoType(type: string): boolean {
	return ALLOWED_PHOTO_TYPES.includes(type)
}

/**
 * Valida se o tamanho do arquivo esta dentro do limite
 */
export function isValidPhotoSize(size: number): boolean {
	return size > 0 && size <= PHOTO_MAX_SIZE
}

/**
 * Valida um arquivo de foto
 */
export function validatePhotoFile(file: File): PhotoValidationResult {
	if (!isValidPhotoType(file.type)) {
		return {
			valid: false,
			error: `Tipo de arquivo nao permitido: ${file.type}. Use JPEG, PNG, WebP ou GIF.`,
		}
	}

	if (!isValidPhotoSize(file.size)) {
		if (file.size === 0) {
			return {
				valid: false,
				error: 'Arquivo vazio.',
			}
		}
		return {
			valid: false,
			error: `Arquivo muito grande (${formatFileSize(file.size)}). O tamanho maximo e ${formatFileSize(PHOTO_MAX_SIZE)}.`,
		}
	}

	return { valid: true }
}

/**
 * Valida multiplos arquivos de foto
 */
export function validatePhotoFiles(
	files: File[],
	currentCount = 0,
): { validFiles: File[]; errors: string[] } {
	const validFiles: File[] = []
	const errors: string[] = []

	const remainingSlots = MAX_PHOTOS_PER_PROPERTY - currentCount
	if (files.length > remainingSlots) {
		errors.push(
			`Limite de ${MAX_PHOTOS_PER_PROPERTY} fotos atingido. Voce pode adicionar mais ${remainingSlots} foto(s).`,
		)
		return { validFiles, errors }
	}

	for (const file of files) {
		const result = validatePhotoFile(file)
		if (result.valid) {
			validFiles.push(file)
		} else if (result.error) {
			errors.push(`${file.name}: ${result.error}`)
		}
	}

	return { validFiles, errors }
}

/**
 * Formata o tamanho do arquivo para exibicao
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B'
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Gera um ID unico para uma foto
 */
export function generatePhotoId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Determina a ordem de uma nova foto
 */
export function getNextPhotoOrder(existingOrders: number[]): number {
	if (existingOrders.length === 0) return 0
	return Math.max(...existingOrders) + 1
}

/**
 * Reordena fotos apos remocao
 */
export function reorderPhotos<T extends { order: number }>(photos: T[]): T[] {
	return photos
		.sort((a, b) => a.order - b.order)
		.map((photo, index) => ({ ...photo, order: index }))
}

/**
 * Define uma foto como primaria
 */
export function setPrimaryPhoto<T extends { id: string; isPrimary: boolean }>(
	photos: T[],
	primaryId: string,
): T[] {
	return photos.map((photo) => ({
		...photo,
		isPrimary: photo.id === primaryId,
	}))
}

/**
 * Obtem a foto primaria de uma lista
 */
export function getPrimaryPhoto<T extends { isPrimary: boolean }>(photos: T[]): T | undefined {
	return photos.find((photo) => photo.isPrimary)
}

/**
 * Verifica se existe uma foto primaria
 */
export function hasPrimaryPhoto<T extends { isPrimary: boolean }>(photos: T[]): boolean {
	return photos.some((photo) => photo.isPrimary)
}
