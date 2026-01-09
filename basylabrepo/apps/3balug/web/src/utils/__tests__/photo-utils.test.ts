import { describe, expect, it } from 'bun:test'

import {
	ALLOWED_PHOTO_TYPES,
	formatFileSize,
	generatePhotoId,
	getNextPhotoOrder,
	getPrimaryPhoto,
	hasPrimaryPhoto,
	isValidPhotoSize,
	isValidPhotoType,
	MAX_PHOTOS_PER_PROPERTY,
	PHOTO_MAX_SIZE,
	reorderPhotos,
	setPrimaryPhoto,
	validatePhotoFile,
	validatePhotoFiles,
} from '../photo-utils'

// Helper to create a mock File
function createMockFile(name: string, size: number, type: string): File {
	const content = new Uint8Array(size)
	return new File([content], name, { type })
}

describe('Photo Utils', () => {
	describe('Constants', () => {
		it('should have correct max file size (10MB)', () => {
			expect(PHOTO_MAX_SIZE).toBe(10 * 1024 * 1024)
		})

		it('should have correct allowed types', () => {
			expect(ALLOWED_PHOTO_TYPES).toContain('image/jpeg')
			expect(ALLOWED_PHOTO_TYPES).toContain('image/png')
			expect(ALLOWED_PHOTO_TYPES).toContain('image/webp')
			expect(ALLOWED_PHOTO_TYPES).toContain('image/gif')
		})

		it('should have correct max photos per property', () => {
			expect(MAX_PHOTOS_PER_PROPERTY).toBe(20)
		})
	})

	describe('isValidPhotoType', () => {
		it('should return true for JPEG', () => {
			expect(isValidPhotoType('image/jpeg')).toBe(true)
		})

		it('should return true for PNG', () => {
			expect(isValidPhotoType('image/png')).toBe(true)
		})

		it('should return true for WebP', () => {
			expect(isValidPhotoType('image/webp')).toBe(true)
		})

		it('should return true for GIF', () => {
			expect(isValidPhotoType('image/gif')).toBe(true)
		})

		it('should return false for PDF', () => {
			expect(isValidPhotoType('application/pdf')).toBe(false)
		})

		it('should return false for SVG', () => {
			expect(isValidPhotoType('image/svg+xml')).toBe(false)
		})

		it('should return false for BMP', () => {
			expect(isValidPhotoType('image/bmp')).toBe(false)
		})

		it('should return false for empty string', () => {
			expect(isValidPhotoType('')).toBe(false)
		})
	})

	describe('isValidPhotoSize', () => {
		it('should return true for 1 byte', () => {
			expect(isValidPhotoSize(1)).toBe(true)
		})

		it('should return true for 1KB', () => {
			expect(isValidPhotoSize(1024)).toBe(true)
		})

		it('should return true for 1MB', () => {
			expect(isValidPhotoSize(1024 * 1024)).toBe(true)
		})

		it('should return true for exactly 10MB', () => {
			expect(isValidPhotoSize(PHOTO_MAX_SIZE)).toBe(true)
		})

		it('should return false for 0 bytes', () => {
			expect(isValidPhotoSize(0)).toBe(false)
		})

		it('should return false for negative size', () => {
			expect(isValidPhotoSize(-1)).toBe(false)
		})

		it('should return false for size greater than 10MB', () => {
			expect(isValidPhotoSize(PHOTO_MAX_SIZE + 1)).toBe(false)
		})

		it('should return false for 15MB', () => {
			expect(isValidPhotoSize(15 * 1024 * 1024)).toBe(false)
		})
	})

	describe('validatePhotoFile', () => {
		it('should accept valid JPEG file', () => {
			const file = createMockFile('photo.jpg', 1024 * 1024, 'image/jpeg')
			const result = validatePhotoFile(file)
			expect(result.valid).toBe(true)
			expect(result.error).toBeUndefined()
		})

		it('should accept valid PNG file', () => {
			const file = createMockFile('photo.png', 500 * 1024, 'image/png')
			const result = validatePhotoFile(file)
			expect(result.valid).toBe(true)
		})

		it('should accept valid WebP file', () => {
			const file = createMockFile('photo.webp', 200 * 1024, 'image/webp')
			const result = validatePhotoFile(file)
			expect(result.valid).toBe(true)
		})

		it('should reject PDF file', () => {
			const file = createMockFile('document.pdf', 1024, 'application/pdf')
			const result = validatePhotoFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toContain('Tipo de arquivo nao permitido')
		})

		it('should reject file larger than 10MB', () => {
			const file = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg')
			const result = validatePhotoFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toContain('Arquivo muito grande')
		})

		it('should reject empty file', () => {
			const file = createMockFile('empty.jpg', 0, 'image/jpeg')
			const result = validatePhotoFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toContain('Arquivo vazio')
		})

		it('should accept file exactly at max size', () => {
			const file = createMockFile('max.jpg', PHOTO_MAX_SIZE, 'image/jpeg')
			const result = validatePhotoFile(file)
			expect(result.valid).toBe(true)
		})
	})

	describe('validatePhotoFiles', () => {
		it('should accept multiple valid files', () => {
			const files = [
				createMockFile('photo1.jpg', 1024, 'image/jpeg'),
				createMockFile('photo2.png', 2048, 'image/png'),
			]
			const result = validatePhotoFiles(files)
			expect(result.validFiles).toHaveLength(2)
			expect(result.errors).toHaveLength(0)
		})

		it('should filter out invalid files', () => {
			const files = [
				createMockFile('photo1.jpg', 1024, 'image/jpeg'),
				createMockFile('document.pdf', 1024, 'application/pdf'),
				createMockFile('photo2.png', 2048, 'image/png'),
			]
			const result = validatePhotoFiles(files)
			expect(result.validFiles).toHaveLength(2)
			expect(result.errors).toHaveLength(1)
			expect(result.errors[0]).toContain('document.pdf')
		})

		it('should reject all files if exceeds max photos limit', () => {
			const files = [createMockFile('photo.jpg', 1024, 'image/jpeg')]
			const result = validatePhotoFiles(files, MAX_PHOTOS_PER_PROPERTY)
			expect(result.validFiles).toHaveLength(0)
			expect(result.errors).toHaveLength(1)
			expect(result.errors[0]).toContain('Limite')
		})

		it('should respect current count when checking limit', () => {
			const files = [
				createMockFile('photo1.jpg', 1024, 'image/jpeg'),
				createMockFile('photo2.jpg', 1024, 'image/jpeg'),
			]
			const result = validatePhotoFiles(files, MAX_PHOTOS_PER_PROPERTY - 1)
			expect(result.validFiles).toHaveLength(0)
			expect(result.errors[0]).toContain('1 foto(s)')
		})

		it('should handle empty file array', () => {
			const result = validatePhotoFiles([])
			expect(result.validFiles).toHaveLength(0)
			expect(result.errors).toHaveLength(0)
		})
	})

	describe('formatFileSize', () => {
		it('should format 0 bytes', () => {
			expect(formatFileSize(0)).toBe('0 B')
		})

		it('should format bytes', () => {
			expect(formatFileSize(500)).toBe('500 B')
		})

		it('should format kilobytes', () => {
			expect(formatFileSize(1024)).toBe('1.0 KB')
			expect(formatFileSize(1536)).toBe('1.5 KB')
		})

		it('should format megabytes', () => {
			expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
			expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
		})

		it('should format 10MB correctly', () => {
			expect(formatFileSize(PHOTO_MAX_SIZE)).toBe('10.0 MB')
		})
	})

	describe('generatePhotoId', () => {
		it('should generate unique IDs', () => {
			const id1 = generatePhotoId()
			const id2 = generatePhotoId()
			expect(id1).not.toBe(id2)
		})

		it('should generate string IDs', () => {
			const id = generatePhotoId()
			expect(typeof id).toBe('string')
		})

		it('should contain timestamp', () => {
			const before = Date.now()
			const id = generatePhotoId()
			const after = Date.now()
			const timestamp = Number.parseInt(id.split('-')[0], 10)
			expect(timestamp).toBeGreaterThanOrEqual(before)
			expect(timestamp).toBeLessThanOrEqual(after)
		})
	})

	describe('getNextPhotoOrder', () => {
		it('should return 0 for empty array', () => {
			expect(getNextPhotoOrder([])).toBe(0)
		})

		it('should return next order after max', () => {
			expect(getNextPhotoOrder([0, 1, 2])).toBe(3)
		})

		it('should handle non-sequential orders', () => {
			expect(getNextPhotoOrder([0, 5, 2])).toBe(6)
		})

		it('should handle single element', () => {
			expect(getNextPhotoOrder([0])).toBe(1)
		})
	})

	describe('reorderPhotos', () => {
		it('should reorder photos sequentially', () => {
			const photos = [
				{ id: 'a', order: 5 },
				{ id: 'b', order: 0 },
				{ id: 'c', order: 2 },
			]
			const result = reorderPhotos(photos)
			expect(result).toEqual([
				{ id: 'b', order: 0 },
				{ id: 'c', order: 1 },
				{ id: 'a', order: 2 },
			])
		})

		it('should handle empty array', () => {
			expect(reorderPhotos([])).toEqual([])
		})

		it('should handle single photo', () => {
			const photos = [{ id: 'a', order: 5 }]
			const result = reorderPhotos(photos)
			expect(result).toEqual([{ id: 'a', order: 0 }])
		})

		it('should preserve other properties', () => {
			const photos = [
				{ id: 'a', order: 1, name: 'Photo A' },
				{ id: 'b', order: 0, name: 'Photo B' },
			]
			const result = reorderPhotos(photos)
			expect(result[0].name).toBe('Photo B')
			expect(result[1].name).toBe('Photo A')
		})
	})

	describe('setPrimaryPhoto', () => {
		it('should set the specified photo as primary', () => {
			const photos = [
				{ id: 'a', isPrimary: false },
				{ id: 'b', isPrimary: false },
				{ id: 'c', isPrimary: false },
			]
			const result = setPrimaryPhoto(photos, 'b')
			expect(result.find((p) => p.id === 'b')?.isPrimary).toBe(true)
		})

		it('should unset previous primary', () => {
			const photos = [
				{ id: 'a', isPrimary: true },
				{ id: 'b', isPrimary: false },
			]
			const result = setPrimaryPhoto(photos, 'b')
			expect(result.find((p) => p.id === 'a')?.isPrimary).toBe(false)
			expect(result.find((p) => p.id === 'b')?.isPrimary).toBe(true)
		})

		it('should handle setting already primary photo', () => {
			const photos = [
				{ id: 'a', isPrimary: true },
				{ id: 'b', isPrimary: false },
			]
			const result = setPrimaryPhoto(photos, 'a')
			expect(result.find((p) => p.id === 'a')?.isPrimary).toBe(true)
			expect(result.filter((p) => p.isPrimary)).toHaveLength(1)
		})

		it('should handle non-existent id gracefully', () => {
			const photos = [
				{ id: 'a', isPrimary: false },
				{ id: 'b', isPrimary: false },
			]
			const result = setPrimaryPhoto(photos, 'nonexistent')
			expect(result.filter((p) => p.isPrimary)).toHaveLength(0)
		})
	})

	describe('getPrimaryPhoto', () => {
		it('should return the primary photo', () => {
			const photos = [
				{ id: 'a', isPrimary: false },
				{ id: 'b', isPrimary: true },
				{ id: 'c', isPrimary: false },
			]
			const result = getPrimaryPhoto(photos)
			expect(result?.id).toBe('b')
		})

		it('should return undefined when no primary exists', () => {
			const photos = [
				{ id: 'a', isPrimary: false },
				{ id: 'b', isPrimary: false },
			]
			const result = getPrimaryPhoto(photos)
			expect(result).toBeUndefined()
		})

		it('should return first primary if multiple exist', () => {
			const photos = [
				{ id: 'a', isPrimary: true },
				{ id: 'b', isPrimary: true },
			]
			const result = getPrimaryPhoto(photos)
			expect(result?.id).toBe('a')
		})

		it('should handle empty array', () => {
			expect(getPrimaryPhoto([])).toBeUndefined()
		})
	})

	describe('hasPrimaryPhoto', () => {
		it('should return true when primary exists', () => {
			const photos = [
				{ id: 'a', isPrimary: false },
				{ id: 'b', isPrimary: true },
			]
			expect(hasPrimaryPhoto(photos)).toBe(true)
		})

		it('should return false when no primary exists', () => {
			const photos = [
				{ id: 'a', isPrimary: false },
				{ id: 'b', isPrimary: false },
			]
			expect(hasPrimaryPhoto(photos)).toBe(false)
		})

		it('should return false for empty array', () => {
			expect(hasPrimaryPhoto([])).toBe(false)
		})
	})
})
