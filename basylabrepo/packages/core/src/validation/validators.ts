/**
 * Validation utilities for common Brazilian and international formats
 */
export const Validators = {
	/**
	 * Validates if a CPF is valid
	 * @param cpf - CPF with or without mask
	 * @returns true if CPF is valid
	 */
	isValidCPF(cpf: string): boolean {
		const cleanCPF = cpf.replace(/\D/g, '')

		if (cleanCPF.length !== 11) {
			return false
		}

		// Check for known invalid patterns
		if (/^(\d)\1{10}$/.test(cleanCPF)) {
			return false
		}

		// Validate first digit
		let sum = 0
		for (let i = 0; i < 9; i++) {
			sum += Number.parseInt(cleanCPF.charAt(i), 10) * (10 - i)
		}
		let digit = 11 - (sum % 11)
		if (digit >= 10) digit = 0
		if (digit !== Number.parseInt(cleanCPF.charAt(9), 10)) {
			return false
		}

		// Validate second digit
		sum = 0
		for (let i = 0; i < 10; i++) {
			sum += Number.parseInt(cleanCPF.charAt(i), 10) * (11 - i)
		}
		digit = 11 - (sum % 11)
		if (digit >= 10) digit = 0
		if (digit !== Number.parseInt(cleanCPF.charAt(10), 10)) {
			return false
		}

		return true
	},

	/**
	 * Validates if a CNPJ is valid
	 * @param cnpj - CNPJ with or without mask
	 * @returns true if CNPJ is valid
	 */
	isValidCNPJ(cnpj: string): boolean {
		const cleanCNPJ = cnpj.replace(/\D/g, '')

		if (cleanCNPJ.length !== 14) {
			return false
		}

		// Check for known invalid patterns
		if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
			return false
		}

		// Validate first digit
		let sum = 0
		let weight = 5
		for (let i = 0; i < 12; i++) {
			sum += Number.parseInt(cleanCNPJ.charAt(i), 10) * weight
			weight = weight === 2 ? 9 : weight - 1
		}
		let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
		if (digit !== Number.parseInt(cleanCNPJ.charAt(12), 10)) {
			return false
		}

		// Validate second digit
		sum = 0
		weight = 6
		for (let i = 0; i < 13; i++) {
			sum += Number.parseInt(cleanCNPJ.charAt(i), 10) * weight
			weight = weight === 2 ? 9 : weight - 1
		}
		digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
		if (digit !== Number.parseInt(cleanCNPJ.charAt(13), 10)) {
			return false
		}

		return true
	},

	/**
	 * Validates if an email is valid
	 * @param email - Email to validate
	 * @returns true if email is valid
	 */
	isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	},

	/**
	 * Validates if a Brazilian phone number is valid (mobile or landline)
	 * @param phone - Phone with or without mask
	 * @returns true if phone is valid
	 */
	isValidPhone(phone: string): boolean {
		const cleanPhone = phone.replace(/\D/g, '')

		// Mobile: 11 digits (DDD + 9 + 8 digits)
		if (cleanPhone.length === 11) {
			return /^[1-9]{2}9[0-9]{8}$/.test(cleanPhone)
		}

		// Landline: 10 digits (DDD + 8 digits starting with 2-5)
		if (cleanPhone.length === 10) {
			return /^[1-9]{2}[2-5][0-9]{7}$/.test(cleanPhone)
		}

		return false
	},

	/**
	 * Validates if a Brazilian CEP is valid
	 * @param cep - CEP with or without mask
	 * @returns true if CEP is valid
	 */
	isValidCEP(cep: string): boolean {
		const cleanCEP = cep.replace(/\D/g, '')
		return cleanCEP.length === 8 && /^[0-9]{8}$/.test(cleanCEP)
	},

	/**
	 * Validates if a full name has at least first and last name
	 * @param name - Full name
	 * @returns true if name has at least 2 parts
	 */
	hasFullName(name: string): boolean {
		const nameParts = name.trim().split(/\s+/)
		return nameParts.length >= 2 && nameParts.every((part) => part.length > 0)
	},

	/**
	 * Validates if a name contains only letters and spaces
	 * @param name - Name to validate
	 * @returns true if name is valid
	 */
	isValidName(name: string): boolean {
		return /^[a-zA-ZÀ-ÿ\s]+$/.test(name)
	},

	/**
	 * Validates if a UUID is valid (v4 format)
	 * @param id - UUID to validate
	 * @returns true if UUID is valid
	 */
	isValidUUID(id: string): boolean {
		return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
	},

	/**
	 * Validates password strength
	 * @param password - Password to validate
	 * @returns Array of error messages (empty if password is valid)
	 */
	validatePasswordStrength(password: string): string[] {
		const errors: string[] = []

		if (password.length < 8) {
			errors.push('mínimo 8 caracteres')
		}

		if (password.length > 100) {
			errors.push('máximo 100 caracteres')
		}

		if (!/[A-Z]/.test(password)) {
			errors.push('uma letra maiúscula')
		}

		if (!/[a-z]/.test(password)) {
			errors.push('uma letra minúscula')
		}

		if (!/[0-9]/.test(password)) {
			errors.push('um número')
		}

		if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
			errors.push('um caractere especial (!@#$%...)')
		}

		const commonPasswords = [
			'password',
			'12345678',
			'password1',
			'password123',
			'password456',
			'qwerty123',
			'abc12345',
		]
		if (commonPasswords.some((weak) => password.toLowerCase().includes(weak))) {
			errors.push('senha muito comum')
		}

		return errors
	},

	/**
	 * Validates if a URL is valid
	 * @param url - URL to validate
	 * @returns true if URL is valid
	 */
	isValidURL(url: string): boolean {
		try {
			new URL(url)
			return true
		} catch {
			return false
		}
	},

	/**
	 * Validates if a slug is valid (lowercase, alphanumeric, hyphens)
	 * @param slug - Slug to validate
	 * @returns true if slug is valid
	 */
	isValidSlug(slug: string): boolean {
		return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
	},
}
