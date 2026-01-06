/**
 * Password hashing utilities using bcrypt
 */
export const PasswordUtils = {
	/**
	 * Hash a password using bcrypt
	 * @param password - Plain text password
	 * @returns Hashed password
	 */
	async hash(password: string): Promise<string> {
		return Bun.password.hash(password, {
			algorithm: 'bcrypt',
			cost: 12,
		})
	},

	/**
	 * Verify a password against a hash
	 * @param password - Plain text password
	 * @param hash - Hashed password
	 * @returns true if password matches hash
	 */
	async verify(password: string, hash: string): Promise<boolean> {
		return Bun.password.verify(password, hash)
	},
}
