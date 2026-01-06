import { getRedis } from "@/config/redis";
import {
  CompanyCacheService,
  CustomFieldCacheService,
  type IUserCacheService,
  RedisCacheProvider,
  UserCacheService,
} from "@/services/cache";

const redisClient = getRedis();
const cacheProvider = new RedisCacheProvider(redisClient);

export let userCacheService: IUserCacheService = new UserCacheService(cacheProvider);
export const customFieldCacheService = new CustomFieldCacheService(cacheProvider);
export const companyCacheService = new CompanyCacheService(cacheProvider);
