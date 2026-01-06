const PREFIX = '3balug_'

const AUTH_CHANGE_EVENT = 'auth-state-change'

const emitAuthChange = () => {
	window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export { AUTH_CHANGE_EVENT, emitAuthChange }

export const STORAGE_KEYS = {
	ACCESS_TOKEN: `${PREFIX}access_token`,
	SUBSCRIPTION_STATUS: `${PREFIX}subscription_status`,
	USER_ROLE: `${PREFIX}user_role`,
	USER_NAME: `${PREFIX}user_name`,
	USER_AVATAR_URL: `${PREFIX}user_avatar_url`,
	USER_CREATED_BY: `${PREFIX}user_created_by`,
	PLAN_NAME: `${PREFIX}plan_name`,
	HAS_PENDING_CUSTOM_FIELDS: `${PREFIX}has_pending_custom_fields`,
} as const

export const storage = {
	getAccessToken(): string | null {
		return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
	},

	setAccessToken(token: string): void {
		localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
		emitAuthChange()
	},

	removeAccessToken(): void {
		localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
		emitAuthChange()
	},

	isAuthenticated(): boolean {
		return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
	},

	getSubscriptionStatus(): string | null {
		return localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS)
	},

	setSubscriptionStatus(status: string): void {
		localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATUS, status)
	},

	removeSubscriptionStatus(): void {
		localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_STATUS)
	},

	getUserRole(): string | null {
		return localStorage.getItem(STORAGE_KEYS.USER_ROLE)
	},

	setUserRole(role: string): void {
		localStorage.setItem(STORAGE_KEYS.USER_ROLE, role)
		emitAuthChange()
	},

	removeUserRole(): void {
		localStorage.removeItem(STORAGE_KEYS.USER_ROLE)
	},

	getUserName(): string | null {
		return localStorage.getItem(STORAGE_KEYS.USER_NAME)
	},

	setUserName(name: string): void {
		localStorage.setItem(STORAGE_KEYS.USER_NAME, name)
	},

	removeUserName(): void {
		localStorage.removeItem(STORAGE_KEYS.USER_NAME)
	},

	getUserAvatarUrl(): string | null {
		return localStorage.getItem(STORAGE_KEYS.USER_AVATAR_URL)
	},

	setUserAvatarUrl(avatarUrl: string): void {
		localStorage.setItem(STORAGE_KEYS.USER_AVATAR_URL, avatarUrl)
	},

	removeUserAvatarUrl(): void {
		localStorage.removeItem(STORAGE_KEYS.USER_AVATAR_URL)
	},

	getUserCreatedBy(): string | null {
		return localStorage.getItem(STORAGE_KEYS.USER_CREATED_BY)
	},

	setUserCreatedBy(createdBy: string): void {
		localStorage.setItem(STORAGE_KEYS.USER_CREATED_BY, createdBy)
	},

	removeUserCreatedBy(): void {
		localStorage.removeItem(STORAGE_KEYS.USER_CREATED_BY)
	},

	getPlanName(): string | null {
		return localStorage.getItem(STORAGE_KEYS.PLAN_NAME)
	},

	setPlanName(planName: string): void {
		localStorage.setItem(STORAGE_KEYS.PLAN_NAME, planName)
	},

	removePlanName(): void {
		localStorage.removeItem(STORAGE_KEYS.PLAN_NAME)
	},

	getHasPendingCustomFields(): boolean {
		return localStorage.getItem(STORAGE_KEYS.HAS_PENDING_CUSTOM_FIELDS) === 'true'
	},

	setHasPendingCustomFields(value: boolean): void {
		localStorage.setItem(STORAGE_KEYS.HAS_PENDING_CUSTOM_FIELDS, String(value))
	},

	removeHasPendingCustomFields(): void {
		localStorage.removeItem(STORAGE_KEYS.HAS_PENDING_CUSTOM_FIELDS)
	},

	clearAll(): void {
		const keys = Object.keys(localStorage)
		for (const key of keys) {
			if (key.startsWith(PREFIX)) {
				localStorage.removeItem(key)
			}
		}
		emitAuthChange()
	},
}
