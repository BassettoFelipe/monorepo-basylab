type BlacklistEntry = {
	expiresAt: number
}

const blacklist = new Map<string, BlacklistEntry>()

const cleanupExpiredTokens = () => {
	const now = Date.now()
	for (const [token, entry] of blacklist.entries()) {
		if (entry.expiresAt <= now) {
			blacklist.delete(token)
		}
	}
}

setInterval(cleanupExpiredTokens, 60_000)

export const TokenBlacklist = {
	add(token: string, expiresInSeconds: number): void {
		const expiresAt = Date.now() + expiresInSeconds * 1000
		blacklist.set(token, { expiresAt })
	},

	isBlacklisted(token: string): boolean {
		const entry = blacklist.get(token)
		if (!entry) {
			return false
		}

		if (entry.expiresAt <= Date.now()) {
			blacklist.delete(token)
			return false
		}

		return true
	},

	remove(token: string): void {
		blacklist.delete(token)
	},

	clear(): void {
		blacklist.clear()
	},

	size(): number {
		return blacklist.size
	},
}
