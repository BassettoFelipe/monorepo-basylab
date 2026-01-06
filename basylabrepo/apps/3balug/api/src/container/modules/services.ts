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

export interface Services {
  userCacheService: IUserCacheService;
  customFieldCacheService: CustomFieldCacheService;
  companyCacheService: CompanyCacheService;
}

export const services: Services = {
  userCacheService: new UserCacheService(cacheProvider),
  customFieldCacheService: new CustomFieldCacheService(cacheProvider),
  companyCacheService: new CompanyCacheService(cacheProvider),
};
