/**
 * File utilities for handling file operations, MIME types, and validation
 * @module files
 */

/**
 * Maps file extensions to MIME types
 */
const MIME_TYPE_MAP: Record<string, string> = {
	// Documents
	'.pdf': 'application/pdf',
	'.doc': 'application/msword',
	'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'.xls': 'application/vnd.ms-excel',
	'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'.ppt': 'application/vnd.ms-powerpoint',
	'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'.txt': 'text/plain',
	'.csv': 'text/csv',
	'.rtf': 'application/rtf',
	'.odt': 'application/vnd.oasis.opendocument.text',
	'.ods': 'application/vnd.oasis.opendocument.spreadsheet',

	// Images
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.bmp': 'image/bmp',
	'.ico': 'image/x-icon',
	'.tiff': 'image/tiff',
	'.tif': 'image/tiff',
	'.avif': 'image/avif',
	'.heic': 'image/heic',
	'.heif': 'image/heif',

	// Audio
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.ogg': 'audio/ogg',
	'.m4a': 'audio/mp4',
	'.flac': 'audio/flac',

	// Video
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.avi': 'video/x-msvideo',
	'.mov': 'video/quicktime',
	'.mkv': 'video/x-matroska',

	// Archives
	'.zip': 'application/zip',
	'.rar': 'application/vnd.rar',
	'.7z': 'application/x-7z-compressed',
	'.tar': 'application/x-tar',
	'.gz': 'application/gzip',

	// Code/Data
	'.json': 'application/json',
	'.xml': 'application/xml',
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'text/javascript',
}

/**
 * Maps MIME types to file extensions
 */
const EXTENSION_MAP: Record<string, string> = {
	// Images
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/gif': '.gif',
	'image/webp': '.webp',
	'image/svg+xml': '.svg',
	'image/bmp': '.bmp',
	'image/x-icon': '.ico',
	'image/tiff': '.tiff',
	'image/avif': '.avif',
	'image/heic': '.heic',
	'image/heif': '.heif',

	// Documents
	'application/pdf': '.pdf',
	'application/msword': '.doc',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
	'application/vnd.ms-excel': '.xls',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
	'application/vnd.ms-powerpoint': '.ppt',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
	'text/plain': '.txt',
	'text/csv': '.csv',
	'application/rtf': '.rtf',
	'application/vnd.oasis.opendocument.text': '.odt',
	'application/vnd.oasis.opendocument.spreadsheet': '.ods',

	// Audio
	'audio/mpeg': '.mp3',
	'audio/wav': '.wav',
	'audio/ogg': '.ogg',
	'audio/mp4': '.m4a',
	'audio/flac': '.flac',

	// Video
	'video/mp4': '.mp4',
	'video/webm': '.webm',
	'video/x-msvideo': '.avi',
	'video/quicktime': '.mov',
	'video/x-matroska': '.mkv',

	// Archives
	'application/zip': '.zip',
	'application/vnd.rar': '.rar',
	'application/x-7z-compressed': '.7z',
	'application/x-tar': '.tar',
	'application/gzip': '.gz',

	// Code/Data
	'application/json': '.json',
	'application/xml': '.xml',
	'text/html': '.html',
	'text/css': '.css',
	'text/javascript': '.js',
}

/**
 * MIME type utilities
 */
export const MimeTypes = {
	/**
	 * Converts a file extension to its MIME type
	 * @param extension - File extension (with or without dot)
	 * @returns The MIME type or null if not found
	 * @example
	 * MimeTypes.fromExtension('.pdf') // 'application/pdf'
	 * MimeTypes.fromExtension('jpg') // 'image/jpeg'
	 */
	fromExtension(extension: string): string | null {
		const ext = extension.startsWith('.') ? extension : `.${extension}`
		return MIME_TYPE_MAP[ext.toLowerCase()] ?? null
	},

	/**
	 * Converts a MIME type to its file extension
	 * @param mimeType - The MIME type (e.g., 'image/jpeg')
	 * @returns The extension (with dot) or empty string if not found
	 * @example
	 * MimeTypes.toExtension('image/jpeg') // '.jpg'
	 * MimeTypes.toExtension('application/pdf') // '.pdf'
	 */
	toExtension(mimeType: string): string {
		return EXTENSION_MAP[mimeType] ?? ''
	},

	/**
	 * Checks if a MIME type belongs to a category
	 * @param mimeType - The MIME type to check
	 * @param category - The category ('image', 'video', 'audio', 'application', 'text')
	 * @returns true if the MIME type belongs to the category
	 * @example
	 * MimeTypes.isCategory('image/jpeg', 'image') // true
	 * MimeTypes.isCategory('application/pdf', 'image') // false
	 */
	isCategory(mimeType: string, category: string): boolean {
		return mimeType.startsWith(`${category}/`)
	},

	/**
	 * Checks if a MIME type is an image
	 */
	isImage(mimeType: string): boolean {
		return this.isCategory(mimeType, 'image')
	},

	/**
	 * Checks if a MIME type is a video
	 */
	isVideo(mimeType: string): boolean {
		return this.isCategory(mimeType, 'video')
	},

	/**
	 * Checks if a MIME type is audio
	 */
	isAudio(mimeType: string): boolean {
		return this.isCategory(mimeType, 'audio')
	},

	/**
	 * Checks if a MIME type is a document (PDF, Word, Excel, etc.)
	 */
	isDocument(mimeType: string): boolean {
		const documentTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'text/plain',
			'text/csv',
			'application/rtf',
		]
		return documentTypes.includes(mimeType)
	},
}

/**
 * File utilities for common file operations
 */
export const FileUtils = {
	/**
	 * Extracts the extension from a filename, with content type fallback
	 * @param fileName - The file name
	 * @param contentType - Content type to use as fallback
	 * @returns The extension (with dot) or empty string
	 * @example
	 * FileUtils.getExtension('document.pdf', 'application/pdf') // '.pdf'
	 * FileUtils.getExtension('file_without_ext', 'image/jpeg') // '.jpg'
	 */
	getExtension(fileName: string, contentType?: string): string {
		const lastDot = fileName.lastIndexOf('.')
		if (lastDot !== -1) {
			return fileName.slice(lastDot).toLowerCase()
		}
		return contentType ? MimeTypes.toExtension(contentType) : ''
	},

	/**
	 * Gets the file name without extension
	 * @param fileName - The file name
	 * @returns The file name without extension
	 * @example
	 * FileUtils.getBaseName('document.pdf') // 'document'
	 * FileUtils.getBaseName('file.name.txt') // 'file.name'
	 */
	getBaseName(fileName: string): string {
		const lastDot = fileName.lastIndexOf('.')
		return lastDot !== -1 ? fileName.slice(0, lastDot) : fileName
	},

	/**
	 * Sanitizes a file name removing special characters and accents
	 * @param fileName - Original file name
	 * @param maxLength - Maximum length (default: 50)
	 * @returns Sanitized file name (without extension)
	 * @example
	 * FileUtils.sanitizeFileName('Meu Arquivo.pdf') // 'Meu_Arquivo'
	 * FileUtils.sanitizeFileName('relatório-ção.doc') // 'relatorio-cao'
	 */
	sanitizeFileName(fileName: string, maxLength = 50): string {
		const nameWithoutExt = this.getBaseName(fileName)

		return nameWithoutExt
			.normalize('NFD')
			.replace(/\p{Mn}/gu, '')
			.replace(/[^a-zA-Z0-9_-]/g, '_')
			.replace(/_+/g, '_')
			.slice(0, maxLength)
	},

	/**
	 * Generates a unique file name with timestamp
	 * @param originalName - Original file name
	 * @param prefix - Optional prefix
	 * @returns Unique file name with extension preserved
	 * @example
	 * FileUtils.generateUniqueName('photo.jpg') // 'photo_1704067200000.jpg'
	 * FileUtils.generateUniqueName('photo.jpg', 'avatar') // 'avatar_photo_1704067200000.jpg'
	 */
	generateUniqueName(originalName: string, prefix?: string): string {
		const ext = this.getExtension(originalName)
		const baseName = this.sanitizeFileName(originalName)
		const timestamp = Date.now()
		const parts = [prefix, baseName, timestamp].filter(Boolean)
		return `${parts.join('_')}${ext}`
	},

	/**
	 * Formats file size to human readable format
	 * @param bytes - Size in bytes
	 * @param decimals - Number of decimal places (default: 2)
	 * @returns Human readable size string
	 * @example
	 * FileUtils.formatSize(1024) // '1 KB'
	 * FileUtils.formatSize(1536, 1) // '1.5 KB'
	 * FileUtils.formatSize(1048576) // '1 MB'
	 */
	formatSize(bytes: number, decimals = 2): string {
		if (bytes === 0) return '0 Bytes'

		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
	},

	/**
	 * Parses a human readable size to bytes
	 * @param size - Size string (e.g., '5MB', '1.5 GB')
	 * @returns Size in bytes
	 * @example
	 * FileUtils.parseSize('5MB') // 5242880
	 * FileUtils.parseSize('1.5 GB') // 1610612736
	 */
	parseSize(size: string): number {
		const units: Record<string, number> = {
			B: 1,
			KB: 1024,
			MB: 1024 ** 2,
			GB: 1024 ** 3,
			TB: 1024 ** 4,
		}

		const match = size.toUpperCase().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)?$/)
		if (!match?.[1]) return 0

		const value = Number.parseFloat(match[1])
		const unit = match[2] ?? 'B'

		return Math.round(value * (units[unit] || 1))
	},
}

/**
 * File validation utilities
 */
export const FileValidation = {
	/**
	 * Checks if a file type is allowed
	 * @param contentType - The content type of the file
	 * @param allowedTypes - Array of allowed types (supports wildcards and extensions)
	 * @returns true if the type is allowed
	 * @example
	 * FileValidation.isTypeAllowed('image/jpeg', ['image/*']) // true
	 * FileValidation.isTypeAllowed('application/pdf', ['.pdf', '.doc']) // true
	 * FileValidation.isTypeAllowed('video/mp4', ['image/*']) // false
	 */
	isTypeAllowed(contentType: string, allowedTypes: string[]): boolean {
		for (const allowed of allowedTypes) {
			// Wildcard matching (e.g., 'image/*')
			if (allowed.endsWith('/*')) {
				const prefix = allowed.slice(0, -2)
				if (contentType.startsWith(prefix)) {
					return true
				}
			}
			// Extension matching (e.g., '.pdf' or '.doc,.docx')
			else if (allowed.startsWith('.')) {
				// Support comma-separated extensions in a single item
				const extensions = allowed.split(',').map((ext) => ext.trim())
				for (const ext of extensions) {
					const mimeType = MimeTypes.fromExtension(ext)
					if (mimeType && contentType === mimeType) {
						return true
					}
				}
			}
			// Exact MIME type matching
			else if (contentType === allowed) {
				return true
			}
		}
		return false
	},

	/**
	 * Checks if a file size is within limits
	 * @param size - File size in bytes
	 * @param maxSize - Maximum size (bytes or human readable string)
	 * @returns true if within limits
	 * @example
	 * FileValidation.isSizeAllowed(1024, 2048) // true
	 * FileValidation.isSizeAllowed(1024, '5MB') // true
	 */
	isSizeAllowed(size: number, maxSize: number | string): boolean {
		const maxBytes = typeof maxSize === 'string' ? FileUtils.parseSize(maxSize) : maxSize
		return size <= maxBytes
	},

	/**
	 * Validates a file against type and size constraints
	 * @param file - Object with contentType and size properties
	 * @param options - Validation options
	 * @returns Validation result with success flag and optional error message
	 */
	validate(
		file: { contentType: string; size: number },
		options: {
			allowedTypes?: string[]
			maxSize?: number | string
		},
	): { valid: boolean; error?: string } {
		if (options.allowedTypes && !this.isTypeAllowed(file.contentType, options.allowedTypes)) {
			return { valid: false, error: 'File type not allowed' }
		}

		if (options.maxSize && !this.isSizeAllowed(file.size, options.maxSize)) {
			const maxFormatted =
				typeof options.maxSize === 'string'
					? options.maxSize
					: FileUtils.formatSize(options.maxSize)
			return { valid: false, error: `File size exceeds maximum of ${maxFormatted}` }
		}

		return { valid: true }
	},
}

/**
 * S3/Cloud storage URL utilities
 */
export const StorageUrlUtils = {
	/**
	 * Extracts the key from an S3 URL
	 * @param url - Full S3 URL
	 * @returns The file key or null if extraction fails
	 * @example
	 * StorageUrlUtils.extractS3Key('https://bucket.s3.amazonaws.com/avatars/user-123/avatar.webp')
	 * // returns 'avatars/user-123/avatar.webp'
	 */
	extractS3Key(url: string): string | null {
		try {
			const urlObj = new URL(url)
			const path = urlObj.pathname
			const parts = path.split('/').filter(Boolean)
			// Remove bucket name from path-style URLs
			parts.shift()
			return parts.join('/')
		} catch {
			return null
		}
	},

	/**
	 * Extracts the file name from a URL
	 * @param url - The URL
	 * @returns The file name or null if extraction fails
	 * @example
	 * StorageUrlUtils.extractFileName('https://example.com/path/to/file.pdf')
	 * // returns 'file.pdf'
	 */
	extractFileName(url: string): string | null {
		try {
			const urlObj = new URL(url)
			const parts = urlObj.pathname.split('/').filter(Boolean)
			return parts[parts.length - 1] ?? null
		} catch {
			return null
		}
	},

	/**
	 * Builds an S3 URL from bucket and key
	 * @param bucket - The S3 bucket name
	 * @param key - The file key
	 * @param region - AWS region (default: 'us-east-1')
	 * @returns The full S3 URL
	 */
	buildS3Url(bucket: string, key: string, region = 'us-east-1'): string {
		return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
	},
}
