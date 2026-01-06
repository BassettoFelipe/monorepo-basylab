import crypto from 'node:crypto'

/**
 * Random generation utilities
 */
export const RandomUtils = {
	/**
	 * Generate a secure random string
	 * @param length - Length of the string
	 * @returns Random hex string
	 */
	generateSecureString(length: number): string {
		return crypto
			.randomBytes(Math.ceil(length / 2))
			.toString('hex')
			.slice(0, length)
	},

	/**
	 * Generate a random UUID v4
	 * @returns UUID string
	 */
	generateUUID(): string {
		return crypto.randomUUID()
	},

	/**
	 * Generate a secure API key
	 * @param length - Length of the key (default: 32)
	 * @returns Random API key with prefix
	 */
	generateApiKey(length = 32): string {
		const key = crypto.randomBytes(length).toString('base64url').slice(0, length)
		return `basy_${key}`
	},

	/**
	 * Generate a secure random password
	 * @param length - Length of the password (default: 16)
	 * @returns Random password with letters, numbers and special characters
	 */
	generatePassword(length = 16): string {
		const lowercase = 'abcdefghijklmnopqrstuvwxyz'
		const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
		const numbers = '0123456789'
		const special = '!@#$%&*'
		const all = lowercase + uppercase + numbers + special

		const getRandomIndex = (max: number): number => {
			const randomBytes = crypto.randomBytes(4)
			const randomInt = randomBytes.readUInt32BE(0)
			return randomInt % max
		}

		// Ensure at least one of each type
		const password = [
			lowercase[getRandomIndex(lowercase.length)],
			uppercase[getRandomIndex(uppercase.length)],
			numbers[getRandomIndex(numbers.length)],
			special[getRandomIndex(special.length)],
		]

		// Fill the rest with random characters
		for (let i = password.length; i < length; i++) {
			password.push(all[getRandomIndex(all.length)])
		}

		// Shuffle the password
		const shuffled = [...password]
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = getRandomIndex(i + 1)
			;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
		}

		return shuffled.join('')
	},

	/**
	 * Generate random bytes
	 * @param length - Number of bytes
	 * @returns Buffer with random bytes
	 */
	generateBytes(length: number): Buffer {
		return crypto.randomBytes(length)
	},

	/**
	 * Generate a numeric OTP code
	 * @param digits - Number of digits (default: 6)
	 * @returns Numeric OTP string
	 */
	generateOTP(digits = 6): string {
		const max = 10 ** digits
		const randomBytes = crypto.randomBytes(4)
		const randomInt = randomBytes.readUInt32BE(0)
		const code = randomInt % max
		return code.toString().padStart(digits, '0')
	},
}
