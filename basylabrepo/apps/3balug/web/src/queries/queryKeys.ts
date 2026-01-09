export const queryKeys = {
	dashboard: {
		stats: ['dashboard', 'stats'] as const,
	},
	auth: {
		me: ['auth', 'me'] as const,
		resendStatus: (email: string) => ['auth', 'resend-status', email] as const,
		passwordResetStatus: (email: string) => ['auth', 'password-reset-status', email] as const,
	},
	plans: {
		list: ['plans'] as const,
		detail: (id: string) => ['plans', id] as const,
	},
	subscription: {
		checkoutInfo: (token: string) => ['subscription', 'checkout-info', token] as const,
		status: ['subscription', 'status'] as const,
	},
	users: {
		list: (params?: { role?: string; isActive?: boolean; page?: number; limit?: number }) =>
			['users', 'list', params] as const,
		all: ['users'] as const,
	},
	customFields: {
		list: ['custom-fields'] as const,
		myFields: ['custom-fields', 'my-fields'] as const,
		userFields: (userId: string) => ['custom-fields', 'user', userId] as const,
	},
	propertyOwners: {
		all: ['property-owners'] as const,
		list: (params?: { search?: string; page?: number; limit?: number }) =>
			['property-owners', 'list', params] as const,
		detail: (id: string) => ['property-owners', id] as const,
	},
	tenants: {
		all: ['tenants'] as const,
		list: (params?: {
			search?: string
			state?: string
			city?: string
			hasEmail?: boolean
			hasPhone?: boolean
			minIncome?: number
			maxIncome?: number
			maritalStatus?: string
			createdAtStart?: string
			createdAtEnd?: string
			sortBy?: string
			sortOrder?: string
			page?: number
			limit?: number
		}) => ['tenants', 'list', params] as const,
		detail: (id: string) => ['tenants', id] as const,
	},
	properties: {
		all: ['properties'] as const,
		list: (params?: {
			search?: string
			type?: string
			listingType?: string
			status?: string
			city?: string
			page?: number
			limit?: number
		}) => ['properties', 'list', params] as const,
		detail: (id: string) => ['properties', id] as const,
	},
	contracts: {
		all: ['contracts'] as const,
		list: (params?: {
			status?: string
			propertyId?: string
			tenantId?: string
			ownerId?: string
			page?: number
			limit?: number
		}) => ['contracts', 'list', params] as const,
		detail: (id: string) => ['contracts', id] as const,
	},
} as const
