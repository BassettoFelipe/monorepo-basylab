import { logger } from "@/config/logger";
import type { RedisClient } from "@/config/redis";
import type { CacheStats, ICacheService } from "../../contracts/cache.interface";

/**
 * Redis implementation of the cache service
 */
export class RedisCacheProvider implements ICacheService {
  constructor(private readonly redis: RedisClient) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error({ error, key }, "Error reading from Redis cache");
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.error({ error, key }, "Error writing to Redis cache");
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error({ error, key }, "Error deleting from Redis cache");
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      await this.redis.del(...keys);
    } catch (error) {
      logger.error({ error, count: keys.length }, "Error deleting multiple keys from Redis cache");
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys: string[] = [];
      let cursor = "0";

      do {
        const result = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== "0");

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      return keys.length;
    } catch (error) {
      logger.error({ error, pattern }, "Error deleting keys by pattern from Redis cache");
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, "Error checking key existence in Redis cache");
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info("memory");
      const memoryMatch = info.match(/used_memory_human:(.+)/);

      const dbInfo = await this.redis.info("keyspace");
      const keysMatch = dbInfo.match(/keys=(\d+)/);

      return {
        totalKeys: keysMatch ? Number.parseInt(keysMatch[1], 10) : 0,
        memoryUsage: memoryMatch ? memoryMatch[1].trim() : "unknown",
      };
    } catch (error) {
      logger.error({ error }, "Error getting Redis cache stats");
      return { totalKeys: 0, memoryUsage: "error" };
    }
  }
}
