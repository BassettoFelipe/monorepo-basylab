import type { User } from "@/db/schema/users";
import type { CurrentSubscription } from "@/repositories/contracts/subscription.repository";
import type { CachedUserState } from "@/services/user-cache.service";

export interface IUserCacheService {
  get(userId: string): Promise<CachedUserState | null>;
  set(userId: string, user: User, subscription: CurrentSubscription | null): Promise<void>;
  invalidate(userId: string): Promise<void>;
  invalidateMany(userIds: string[]): Promise<void>;
  invalidateAll(): Promise<void>;
  getStats(): Promise<{ totalKeys: number; memoryUsage: string }>;
}
