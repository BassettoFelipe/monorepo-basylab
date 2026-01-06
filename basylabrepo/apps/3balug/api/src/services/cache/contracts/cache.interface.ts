/**
 * Generic cache service interface
 * Abstracts the underlying cache implementation (Redis, Memcached, in-memory, etc.)
 */
export interface ICacheService {
	/**
	 * Get a value from cache
	 */
	get<T>(key: string): Promise<T | null>

	/**
	 * Set a value in cache with optional TTL
	 */
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>

	/**
	 * Delete a key from cache
	 */
	delete(key: string): Promise<void>

	/**
	 * Delete multiple keys from cache
	 */
	deleteMany(keys: string[]): Promise<void>

	/**
	 * Delete all keys matching a pattern
	 */
	deleteByPattern(pattern: string): Promise<number>

	/**
	 * Check if a key exists
	 */
	exists(key: string): Promise<boolean>

	/**
	 * Get cache statistics
	 */
	getStats(): Promise<CacheStats>
}

export interface CacheStats {
	totalKeys: number
	memoryUsage: string
}
