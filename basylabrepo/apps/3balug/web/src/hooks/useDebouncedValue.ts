import { useEffect, useState } from 'react'

/**
 * Hook that debounces a value by the specified delay
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebouncedValue(search, 300)
 *
 * // Use debouncedSearch for API calls
 * useEffect(() => {
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(timer)
		}
	}, [value, delay])

	return debouncedValue
}
