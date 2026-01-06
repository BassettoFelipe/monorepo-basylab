import crypto from 'node:crypto'

/**
 * Hashing utilities
 */
export const HashUtils = {
	/**
	 * Generate SHA-256 hash
	 * @param data - Data to hash
	 * @returns Hex-encoded hash
	 */
	sha256(data: string): string {
		return crypto.createHash('sha256').update(data).digest('hex')
	},

	/**
	 * Generate SHA-512 hash
	 * @param data - Data to hash
	 * @returns Hex-encoded hash
	 */
	sha512(data: string): string {
		return crypto.createHash('sha512').update(data).digest('hex')
	},

	/**
	 * Generate MD5 hash (not secure, use only for checksums)
	 * @param data - Data to hash
	 * @returns Hex-encoded hash
	 */
	md5(data: string): string {
		return crypto.createHash('md5').update(data).digest('hex')
	},

	/**
	 * Generate HMAC-SHA256
	 * @param data - Data to sign
	 * @param secret - Secret key
	 * @returns Hex-encoded HMAC
	 */
	hmacSha256(data: string, secret: string): string {
		return crypto.createHmac('sha256', secret).update(data).digest('hex')
	},

	/**
	 * Generate HMAC-SHA512
	 * @param data - Data to sign
	 * @param secret - Secret key
	 * @returns Hex-encoded HMAC
	 */
	hmacSha512(data: string, secret: string): string {
		return crypto.createHmac('sha512', secret).update(data).digest('hex')
	},

	/**
	 * Verify HMAC signature
	 * @param data - Original data
	 * @param signature - Signature to verify
	 * @param secret - Secret key
	 * @param algorithm - Hash algorithm (default: sha256)
	 * @returns true if signature is valid
	 */
	verifyHmac(
		data: string,
		signature: string,
		secret: string,
		algorithm: 'sha256' | 'sha512' = 'sha256',
	): boolean {
		const expected =
			algorithm === 'sha256' ? this.hmacSha256(data, secret) : this.hmacSha512(data, secret)

		// Use timing-safe comparison
		try {
			return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
		} catch {
			return false
		}
	},
}
