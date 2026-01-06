import { Constants } from "@/config/constants";
import { getRedis } from "@/config/redis";
import type { CustomField } from "@/db/schema/custom-fields";

export interface ICustomFieldCacheService {
  getActiveFields(companyId: string): Promise<CustomField[] | null>;
  getAllFields(companyId: string): Promise<CustomField[] | null>;
  setActiveFields(companyId: string, fields: CustomField[]): Promise<void>;
  setAllFields(companyId: string, fields: CustomField[]): Promise<void>;
  invalidate(companyId: string): Promise<void>;
}

export class CustomFieldCacheService implements ICustomFieldCacheService {
  private readonly redis = getRedis();
  private readonly ttl = Constants.CACHE.CUSTOM_FIELDS_TTL_S;

  private getActiveFieldsKey(companyId: string): string {
    return `custom-fields:active:${companyId}`;
  }

  private getAllFieldsKey(companyId: string): string {
    return `custom-fields:all:${companyId}`;
  }

  async getActiveFields(companyId: string): Promise<CustomField[] | null> {
    try {
      const cached = await this.redis.get(this.getActiveFieldsKey(companyId));
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  async getAllFields(companyId: string): Promise<CustomField[] | null> {
    try {
      const cached = await this.redis.get(this.getAllFieldsKey(companyId));
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  async setActiveFields(companyId: string, fields: CustomField[]): Promise<void> {
    try {
      await this.redis.setex(this.getActiveFieldsKey(companyId), this.ttl, JSON.stringify(fields));
    } catch {
      // Silently fail - cache is optional
    }
  }

  async setAllFields(companyId: string, fields: CustomField[]): Promise<void> {
    try {
      await this.redis.setex(this.getAllFieldsKey(companyId), this.ttl, JSON.stringify(fields));
    } catch {
      // Silently fail - cache is optional
    }
  }

  async invalidate(companyId: string): Promise<void> {
    try {
      await Promise.all([
        this.redis.del(this.getActiveFieldsKey(companyId)),
        this.redis.del(this.getAllFieldsKey(companyId)),
      ]);
    } catch {
      // Silently fail - cache is optional
    }
  }
}
