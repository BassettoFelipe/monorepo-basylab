import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebouncedValue } from './useDebouncedValue'

type FilterValue = string | undefined

interface UseUrlFiltersOptions {
	/**
	 * Debounce delay for search input in milliseconds
	 * @default 300
	 */
	searchDebounceMs?: number
	/**
	 * URL param keys that should be preserved when clearing filters
	 * Useful for modal state (e.g., 'modal', 'id')
	 */
	preserveOnClear?: string[]
	/**
	 * Default sort field when no sort is specified in URL
	 */
	defaultSortBy?: string
	/**
	 * Default sort order when no order is specified in URL
	 */
	defaultSortOrder?: 'asc' | 'desc'
}

interface UseUrlFiltersReturn<TFilters extends Record<string, FilterValue>> {
	/** Current filter values parsed from URL */
	filters: TFilters
	/** Raw search input value (before debounce) */
	searchInput: string
	/** Set search input (will be debounced before updating URL) */
	setSearchInput: (value: string) => void
	/** Debounced search value (synced with URL) */
	debouncedSearch: string
	/** Current page number */
	page: number
	/** Current sort field */
	sortBy: string
	/** Current sort order */
	sortOrder: 'asc' | 'desc'
	/** Update a single filter */
	updateFilter: (key: keyof TFilters, value: string) => void
	/** Update multiple filters at once */
	updateFilters: (updates: Partial<Record<keyof TFilters, string>>) => void
	/** Update sort settings */
	handleSort: (field: string) => void
	/** Clear all filters (preserves specified keys) */
	clearAllFilters: () => void
	/** Count of active advanced filters (excludes search, page, sort) */
	activeFiltersCount: number
	/** Check if any filters are active */
	hasActiveFilters: boolean
}

/**
 * Hook for managing URL-based filters with debounced search
 *
 * @example
 * ```tsx
 * const { filters, searchInput, setSearchInput, updateFilter, clearAllFilters } = useUrlFilters({
 *   preserveOnClear: ['modal', 'id'],
 *   defaultSortBy: 'name',
 *   defaultSortOrder: 'asc'
 * })
 *
 * // Access filters
 * const { type, status, state, city } = filters
 *
 * // Update single filter
 * updateFilter('type', 'house')
 *
 * // Update search (debounced)
 * setSearchInput(e.target.value)
 * ```
 */
export function useUrlFilters<TFilters extends Record<string, FilterValue>>(
	options: UseUrlFiltersOptions = {},
): UseUrlFiltersReturn<TFilters> {
	const {
		searchDebounceMs = 300,
		preserveOnClear = ['modal', 'id'],
		defaultSortBy = 'name',
		defaultSortOrder = 'asc',
	} = options

	const [searchParams, setSearchParams] = useSearchParams()

	// Helper function to update URL search params
	const updateSearchParams = useCallback(
		(updates: Record<string, string>) => {
			setSearchParams((prevParams) => {
				const newParams = new URLSearchParams(prevParams)
				for (const [key, value] of Object.entries(updates)) {
					if (value) {
						newParams.set(key, value)
					} else {
						newParams.delete(key)
					}
				}
				return newParams
			})
		},
		[setSearchParams],
	)

	// Search with debounce
	const searchFromUrl = searchParams.get('search') || ''
	const [searchInput, setSearchInput] = useState(searchFromUrl)
	const debouncedSearch = useDebouncedValue(searchInput, searchDebounceMs)

	// Sync URL with debounced search value
	useEffect(() => {
		if (debouncedSearch !== searchFromUrl) {
			updateSearchParams({ search: debouncedSearch, page: '1' })
		}
	}, [debouncedSearch, searchFromUrl, updateSearchParams])

	// Sync input with URL (when URL changes externally)
	useEffect(() => {
		if (searchFromUrl !== searchInput && searchFromUrl !== debouncedSearch) {
			setSearchInput(searchFromUrl)
		}
	}, [searchFromUrl, debouncedSearch, searchInput])

	// Parse filters from URL
	const filters = useMemo(() => {
		const result: Record<string, FilterValue> = {}
		for (const [key, value] of searchParams.entries()) {
			// Skip pagination, sort, and preserved keys
			if (!['page', 'search', 'sortBy', 'sortOrder', ...preserveOnClear].includes(key)) {
				result[key] = value || undefined
			}
		}
		return result as TFilters
	}, [searchParams, preserveOnClear])

	// Pagination
	const page = Number(searchParams.get('page')) || 1

	// Sorting
	const sortBy = searchParams.get('sortBy') || defaultSortBy
	const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || defaultSortOrder

	// Update single filter
	const updateFilter = useCallback(
		(key: keyof TFilters, value: string) => {
			updateSearchParams({ [key as string]: value, page: '1' })
		},
		[updateSearchParams],
	)

	// Update multiple filters
	const updateFilters = useCallback(
		(updates: Partial<Record<keyof TFilters, string>>) => {
			updateSearchParams({ ...(updates as Record<string, string>), page: '1' })
		},
		[updateSearchParams],
	)

	// Handle sort
	const handleSort = useCallback(
		(field: string) => {
			if (sortBy === field) {
				updateSearchParams({
					sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
					page: '1',
				})
			} else {
				updateSearchParams({
					sortBy: field,
					sortOrder: 'asc',
					page: '1',
				})
			}
		},
		[sortBy, sortOrder, updateSearchParams],
	)

	// Clear all filters
	const clearAllFilters = useCallback(() => {
		const newParams = new URLSearchParams()
		// Preserve specified keys
		for (const key of preserveOnClear) {
			const value = searchParams.get(key)
			if (value) {
				newParams.set(key, value)
			}
		}
		setSearchParams(newParams)
		setSearchInput('')
	}, [searchParams, setSearchParams, preserveOnClear])

	// Count active advanced filters
	const activeFiltersCount = useMemo(() => {
		return Object.values(filters).filter(Boolean).length
	}, [filters])

	// Check if any filters are active
	const hasActiveFilters = useMemo(() => {
		return (
			!!searchFromUrl ||
			activeFiltersCount > 0 ||
			sortBy !== defaultSortBy ||
			sortOrder !== defaultSortOrder
		)
	}, [searchFromUrl, activeFiltersCount, sortBy, sortOrder, defaultSortBy, defaultSortOrder])

	return {
		filters,
		searchInput,
		setSearchInput,
		debouncedSearch,
		page,
		sortBy,
		sortOrder,
		updateFilter,
		updateFilters,
		handleSort,
		clearAllFilters,
		activeFiltersCount,
		hasActiveFilters,
	}
}
