import { Constants } from "@/config/constants";
import { getRedis } from "@/config/redis";
import type { Company } from "@/db/schema/companies";

export class CompanyCacheService {
  private readonly redis = getRedis();
  private readonly ttl = Constants.CACHE.COMPANY_SETTINGS_TTL_S;

  private getKey(companyId: string): string {
    return `company:${companyId}`;
  }

  async get(companyId: string): Promise<Company | null> {
    try {
      const cached = await this.redis.get(this.getKey(companyId));
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  async set(companyId: string, company: Company): Promise<void> {
    try {
      await this.redis.setex(this.getKey(companyId), this.ttl, JSON.stringify(company));
    } catch {
      // Silently fail - cache is optional
    }
  }

  async invalidate(companyId: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(companyId));
    } catch {
      // Silently fail - cache is optional
    }
  }
}
