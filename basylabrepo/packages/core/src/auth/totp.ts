/**
 * TOTP (Time-based One-Time Password) utilities
 * Requires 'otpauth' package as peer dependency
 */

export interface TotpConfig {
	/**
	 * Application secret for additional security
	 */
	appSecret: string
	/**
	 * Issuer name shown in authenticator apps
	 */
	issuer?: string
	/**
	 * Label shown in authenticator apps
	 */
	label?: string
	/**
	 * Number of digits in OTP (default: 6)
	 */
	digits?: number
	/**
	 * Time step in seconds (default: 30)
	 */
	period?: number
}

/**
 * Create TOTP utilities
 * Note: Requires 'otpauth' package to be installed
 */
export function createTotpUtils(config: TotpConfig) {
	const { appSecret, issuer = 'BasyLab', label = 'BasyLab', digits = 6, period = 30 } = config

	// Lazy import to make otpauth optional
	async function getOtpAuth() {
		try {
			const { TOTP, Secret } = await import('otpauth')
			return { TOTP, Secret }
		} catch {
			throw new Error(
				'otpauth package is required for TOTP functionality. Install it with: bun add otpauth',
			)
		}
	}

	async function createTotp(secret: string) {
		const { TOTP, Secret } = await getOtpAuth()

		const combinedSecret = `${appSecret}:${secret}`
		const secretBytes = new TextEncoder().encode(combinedSecret)

		return new TOTP({
			issuer,
			label,
			algorithm: 'SHA1',
			digits,
			period,
			secret: new Secret({ buffer: secretBytes.buffer as ArrayBuffer }),
		})
	}

	return {
		/**
		 * Generate a new random secret
		 */
		generateSecret(): string {
			const buffer = new Uint8Array(32)
			crypto.getRandomValues(buffer)
			return Buffer.from(buffer).toString('base64')
		},

		/**
		 * Generate a TOTP code
		 */
		async generateCode(secret: string, timestamp?: number): Promise<string> {
			const totp = await createTotp(secret)

			if (timestamp !== undefined) {
				const counter = Math.floor(timestamp / 1000 / period)
				return totp.generate({
					timestamp: counter * period * 1000,
				})
			}

			return totp.generate()
		},

		/**
		 * Verify a TOTP code
		 */
		async verifyCode(secret: string, code: string, timestamp?: number): Promise<boolean> {
			const totp = await createTotp(secret)

			const delta = totp.validate({
				token: code,
				timestamp,
				window: 0,
			})

			return delta === 0
		},

		/**
		 * Verify a TOTP code with window tolerance
		 * Allows codes from previous/next time steps
		 */
		async verifyCodeWithWindow(
			secret: string,
			code: string,
			window = 1,
			timestamp?: number,
		): Promise<boolean> {
			const totp = await createTotp(secret)

			const delta = totp.validate({
				token: code,
				timestamp,
				window,
			})

			return delta !== null
		},
	}
}

export type TotpUtils = ReturnType<typeof createTotpUtils>
