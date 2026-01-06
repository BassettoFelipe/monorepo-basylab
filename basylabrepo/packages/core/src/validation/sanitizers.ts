/**
 * Sanitization utilities
 */
export const Sanitizers = {
	/**
	 * Sanitizes dangerous characters from a name
	 * @param name - Name to sanitize
	 * @returns Sanitized name
	 */
	sanitizeName(name: string): string {
		return name.replace(/[<>]/g, '').trim()
	},

	/**
	 * Sanitizes email (lowercase and trim)
	 * @param email - Email to sanitize
	 * @returns Sanitized email
	 */
	sanitizeEmail(email: string): string {
		return email.toLowerCase().trim()
	},

	/**
	 * Removes all non-digit characters
	 * @param value - Value to clean
	 * @returns Only digits
	 */
	onlyDigits(value: string): string {
		return value.replace(/\D/g, '')
	},

	/**
	 * Removes all non-alphanumeric characters
	 * @param value - Value to clean
	 * @returns Only alphanumeric characters
	 */
	onlyAlphanumeric(value: string): string {
		return value.replace(/[^a-zA-Z0-9]/g, '')
	},

	/**
	 * Converts string to slug format
	 * @param value - Value to convert
	 * @returns Slug-formatted string
	 */
	toSlug(value: string): string {
		// biome-ignore lint/suspicious/noMisleadingCharacterClass: Unicode range for diacritical marks is intentional
		const diacriticsRegex = /[\u0300-\u036f]/g
		return value
			.toLowerCase()
			.normalize('NFD')
			.replace(diacriticsRegex, '') // Remove accents
			.replace(/[^a-z0-9\s-]/g, '') // Remove special chars
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/-+/g, '-') // Replace multiple hyphens
			.replace(/^-|-$/g, '') // Remove leading/trailing hyphens
	},

	/**
	 * Trim and normalize whitespace
	 * @param value - Value to normalize
	 * @returns Normalized string
	 */
	normalizeWhitespace(value: string): string {
		return value.trim().replace(/\s+/g, ' ')
	},

	/**
	 * Escape HTML entities
	 * @param value - Value to escape
	 * @returns Escaped string
	 */
	escapeHtml(value: string): string {
		const htmlEntities: Record<string, string> = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
		}
		return value.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
	},
}
