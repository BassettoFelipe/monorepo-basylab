/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
	success: boolean
	data: T
	message?: string
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
	success: false
	error: string
	code?: string
	statusCode: number
	metadata?: Record<string, unknown>
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
	page?: number
	limit?: number
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
	data: T[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
}

/**
 * Filter operators for queries
 */
export type FilterOperator =
	| 'eq'
	| 'ne'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte'
	| 'in'
	| 'nin'
	| 'like'
	| 'ilike'

/**
 * Generic filter definition
 */
export interface Filter<T = unknown> {
	field: string
	operator: FilterOperator
	value: T
}

/**
 * Date range filter
 */
export interface DateRange {
	from?: Date | string
	to?: Date | string
}

/**
 * Sort definition
 */
export interface Sort {
	field: string
	order: 'asc' | 'desc'
}

/**
 * Base entity with common fields
 */
export interface BaseEntity {
	id: string
	createdAt: Date
	updatedAt: Date
}

/**
 * Soft delete entity
 */
export interface SoftDeleteEntity extends BaseEntity {
	deletedAt?: Date | null
}

/**
 * Auditable entity
 */
export interface AuditableEntity extends BaseEntity {
	createdBy?: string | null
	updatedBy?: string | null
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
