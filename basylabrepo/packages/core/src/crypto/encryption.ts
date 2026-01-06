import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * AES-256-GCM Encryption utilities
 */
export const EncryptionUtils = {
	/**
	 * Encrypt data using AES-256-GCM
	 * @param plaintext - Data to encrypt
	 * @param key - 32-byte encryption key (or will be derived from string)
	 * @returns Base64-encoded encrypted data (iv:authTag:ciphertext)
	 */
	encrypt(plaintext: string, key: string | Buffer): string {
		const keyBuffer =
			typeof key === 'string' ? crypto.createHash('sha256').update(key).digest() : key

		const iv = crypto.randomBytes(IV_LENGTH)
		const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv)

		let encrypted = cipher.update(plaintext, 'utf8', 'base64')
		encrypted += cipher.final('base64')

		const authTag = cipher.getAuthTag()

		// Format: iv:authTag:ciphertext (all base64)
		return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
	},

	/**
	 * Decrypt data using AES-256-GCM
	 * @param encryptedData - Base64-encoded encrypted data (iv:authTag:ciphertext)
	 * @param key - 32-byte encryption key (or will be derived from string)
	 * @returns Decrypted plaintext
	 * @throws Error if decryption fails
	 */
	decrypt(encryptedData: string, key: string | Buffer): string {
		const keyBuffer =
			typeof key === 'string' ? crypto.createHash('sha256').update(key).digest() : key

		const parts = encryptedData.split(':')
		if (parts.length !== 3) {
			throw new Error('Invalid encrypted data format')
		}

		const [ivBase64, authTagBase64, ciphertext] = parts
		if (!ivBase64 || !authTagBase64 || !ciphertext) {
			throw new Error('Invalid encrypted data format')
		}

		const iv = Buffer.from(ivBase64, 'base64')
		const authTag = Buffer.from(authTagBase64, 'base64')

		if (iv.length !== IV_LENGTH) {
			throw new Error('Invalid IV length')
		}

		if (authTag.length !== AUTH_TAG_LENGTH) {
			throw new Error('Invalid auth tag length')
		}

		const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv)
		decipher.setAuthTag(authTag)

		let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
		decrypted += decipher.final('utf8')

		return decrypted
	},

	/**
	 * Generate a random encryption key
	 * @returns 32-byte key as hex string
	 */
	generateKey(): string {
		return crypto.randomBytes(32).toString('hex')
	},
}
