import { env } from "@/config/env";
import { logger } from "@/config/logger";
import type { RedisClient } from "@/config/redis";
import type { User } from "@/db/schema/users";
import type { CurrentSubscription } from "@/repositories/contracts/subscription.repository";
import type { IUserCacheService } from "@/services/contracts/user-cache-service.interface";

export interface CachedUserState {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string | null;
    createdBy: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
  };
  subscription: {
    id: string;
    userId: string;
    status: string;
    computedStatus: string;
    planId: string;
    startDate: string | null;
    endDate: string | null;
    daysRemaining: number | null;
    plan: {
      id: string;
      name: string;
      price: number;
      features: string[];
    };
  } | null;
  cachedAt: number;
}

export class UserCacheService implements IUserCacheService {
  private readonly prefix = "user_state:";
  private readonly ttl = env.REDIS_CACHE_TTL;

  constructor(private readonly redis: RedisClient) {}

  /**
   * Gera a chave do cache para um usuário
   */
  private getCacheKey(userId: string): string {
    return `${this.prefix}${userId}`;
  }

  /**
   * Busca estado do usuário no cache
   */
  async get(userId: string): Promise<CachedUserState | null> {
    try {
      const cached = await this.redis.get(this.getCacheKey(userId));

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as CachedUserState;

      const age = Date.now() - parsed.cachedAt;
      if (age > this.ttl * 1000) {
        await this.invalidate(userId);
        return null;
      }

      return parsed;
    } catch (error) {
      logger.error({ error, userId }, "Error reading user cache");
      return null;
    }
  }

  /**
   * Salva estado do usuário no cache
   */
  async set(userId: string, user: User, subscription: CurrentSubscription | null): Promise<void> {
    try {
      const cacheData: CachedUserState = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          createdBy: user.createdBy,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
        },
        subscription: subscription
          ? {
              id: subscription.id,
              userId: subscription.userId,
              status: subscription.status,
              computedStatus: subscription.computedStatus,
              planId: subscription.planId,
              startDate: subscription.startDate?.toISOString() || null,
              endDate: subscription.endDate?.toISOString() || null,
              daysRemaining: subscription.daysRemaining,
              plan: subscription.plan,
            }
          : null,
        cachedAt: Date.now(),
      };

      await this.redis.setex(this.getCacheKey(userId), this.ttl, JSON.stringify(cacheData));

      logger.debug({ userId, ttl: this.ttl }, "User state cached");
    } catch (error) {
      logger.error({ error, userId }, "Error writing user cache");
    }
  }

  /**
   * Invalida cache de um usuário
   */
  async invalidate(userId: string): Promise<void> {
    try {
      await this.redis.del(this.getCacheKey(userId));
      logger.debug({ userId }, "User cache invalidated");
    } catch (error) {
      logger.error({ error, userId }, "Error invalidating user cache");
    }
  }

  /**
   * Invalida cache de múltiplos usuários (útil quando um owner muda)
   */
  async invalidateMany(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;

    try {
      const keys = userIds.map((id) => this.getCacheKey(id));
      await this.redis.del(...keys);
      logger.debug({ count: userIds.length }, "Multiple user caches invalidated");
    } catch (error) {
      logger.error({ error, count: userIds.length }, "Error invalidating multiple caches");
    }
  }

  /**
   * Invalida todo o cache de usuários (usar com cuidado)
   */
  async invalidateAll(): Promise<void> {
    try {
      const keys: string[] = [];
      let cursor = "0";

      do {
        const result = await this.redis.scan(cursor, "MATCH", `${this.prefix}*`, "COUNT", 100);
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== "0");

      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info({ count: keys.length }, "All user caches invalidated");
      }
    } catch (error) {
      logger.error({ error }, "Error invalidating all caches");
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{ totalKeys: number; memoryUsage: string }> {
    try {
      const keys: string[] = [];
      let cursor = "0";

      do {
        const result = await this.redis.scan(cursor, "MATCH", `${this.prefix}*`, "COUNT", 100);
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== "0");

      const info = await this.redis.info("memory");
      const memoryMatch = info.match(/used_memory_human:(.+)/);

      return {
        totalKeys: keys.length,
        memoryUsage: memoryMatch ? memoryMatch[1].trim() : "unknown",
      };
    } catch (error) {
      logger.error({ error }, "Error getting cache stats");
      return { totalKeys: 0, memoryUsage: "error" };
    }
  }
}
