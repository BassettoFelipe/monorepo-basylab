import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import type { User } from "@/db/schema/users";
import { errorHandlerPlugin } from "@/plugins/error-handler.plugin";
import type { CurrentSubscription } from "@/repositories/contracts/subscription.repository";
import { validateUserState, validateUserStateAllowPending } from "../user-validation.middleware";

// Mock data
const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  password: "hashed-password",
  role: "owner",
  phone: null,
  avatarUrl: null,
  companyId: "company-123",
  createdBy: null,
  isActive: true,
  isEmailVerified: true,
  verificationSecret: null,
  verificationExpiresAt: null,
  verificationAttempts: 0,
  verificationLastAttemptAt: null,
  verificationResendCount: 0,
  verificationLastResendAt: null,
  passwordResetSecret: null,
  passwordResetExpiresAt: null,
  passwordResetResendCount: 0,
  passwordResetCooldownEndsAt: null,
  passwordResetAttempts: 0,
  passwordResetLastAttemptAt: null,
  passwordResetResendBlocked: false,
  passwordResetResendBlockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSubscription: CurrentSubscription = {
  id: "sub-123",
  userId: "user-123",
  planId: "plan-123",
  status: "active",
  computedStatus: "active",
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  daysRemaining: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
  plan: {
    id: "plan-123",
    name: "Pro",
    slug: "pro",
    price: 99,
    features: ["feature1"],
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    durationDays: 30,
    maxUsers: 10,
    maxManagers: 2,
    maxSerasaQueries: 10,
    allowsLateCharges: 1,
    pagarmePlanId: null,
  } as any,
};

// Mock container
const mockUserCacheGet = mock(() => Promise.resolve(null)) as any;
const mockUserCacheSet = mock(() => Promise.resolve()) as any;
const mockUserRepoFindById = mock(() => Promise.resolve(null)) as any;
const mockSubscriptionRepoFindCurrentByUserId = mock(() => Promise.resolve(null));

mock.module("@/container", () => ({
  container: {
    userCacheService: {
      get: mockUserCacheGet,
      set: mockUserCacheSet,
    },
    userRepository: {
      findById: mockUserRepoFindById,
    },
    subscriptionRepository: {
      findCurrentByUserId: mockSubscriptionRepoFindCurrentByUserId,
    },
  },
}));

// Mock logger to suppress output during tests
mock.module("@/config/logger", () => ({
  logger: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },
}));

// Helper to create a mock auth context
function createMockAuthMiddleware(userId: string | null) {
  return new Elysia({ name: "mock-auth" }).derive({ as: "global" }, () => ({
    userId,
    userRole: "owner",
    userCompanyId: "company-123",
    tokenPayload: { sub: userId ?? "", exp: 0, iat: 0 },
  }));
}

describe("user-validation.middleware", () => {
  beforeEach(() => {
    mockUserCacheGet.mockReset();
    mockUserCacheSet.mockReset();
    mockUserRepoFindById.mockReset();
    mockSubscriptionRepoFindCurrentByUserId.mockReset();
  });

  describe("validateUserState", () => {
    test("should return 401 when userId is not present", async () => {
      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware(null))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(401);
      const body = (await response.json()) as any;
      expect(body.type).toBe("AUTHENTICATION_REQUIRED");
    });

    test("should return 404 when user is not found in database", async () => {
      mockUserCacheGet.mockResolvedValue(null);
      mockUserRepoFindById.mockResolvedValue(null);

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(404);
      const body = (await response.json()) as any;
      expect(body.type).toBe("USER_NOT_FOUND");
    });

    test("should return 403 when user is deactivated", async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUserCacheGet.mockResolvedValue({
        user: deactivatedUser,
        subscription: mockSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(403);
      const body = (await response.json()) as any;
      expect(body.type).toBe("ACCOUNT_DEACTIVATED");
    });

    test("should return 403 when user has no subscription", async () => {
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: null,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(403);
      const body = (await response.json()) as any;
      expect(body.type).toBe("SUBSCRIPTION_REQUIRED");
    });

    test("should return 403 when subscription is expired", async () => {
      const expiredSubscription = {
        ...mockSubscription,
        computedStatus: "expired",
      };
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: expiredSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(403);
      const body = (await response.json()) as any;
      expect(body.message).toContain("expirou");
    });

    test("should return 403 when subscription is canceled", async () => {
      const canceledSubscription = {
        ...mockSubscription,
        computedStatus: "canceled",
      };
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: canceledSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(403);
      const body = (await response.json()) as any;
      expect(body.message).toContain("cancelada");
    });

    test("should allow access when user and subscription are valid", async () => {
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: mockSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", ({ validatedUser, validatedSubscription }) => ({
          userId: validatedUser.id,
          subscriptionId: validatedSubscription.id,
        }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.userId).toBe("user-123");
      expect(body.subscriptionId).toBe("sub-123");
    });

    test("should load from database when cache miss", async () => {
      mockUserCacheGet.mockResolvedValue(null);
      mockUserRepoFindById.mockResolvedValue(mockUser);
      mockSubscriptionRepoFindCurrentByUserId.mockResolvedValue(mockSubscription as any);

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
      expect(mockUserRepoFindById).toHaveBeenCalledWith("user-123");
      expect(mockSubscriptionRepoFindCurrentByUserId).toHaveBeenCalledWith("user-123");
      expect(mockUserCacheSet).toHaveBeenCalled();
    });

    test("should check owner subscription when user has no subscription but has createdBy", async () => {
      const memberUser = {
        ...mockUser,
        id: "member-123",
        createdBy: "owner-123",
      };
      const ownerUser = { ...mockUser, id: "owner-123" };

      mockUserCacheGet.mockResolvedValue(null);
      mockUserRepoFindById
        .mockResolvedValueOnce(memberUser) // First call for member
        .mockResolvedValueOnce(ownerUser); // Second call for owner
      mockSubscriptionRepoFindCurrentByUserId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSubscription as any);

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("member-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
      expect(mockSubscriptionRepoFindCurrentByUserId).toHaveBeenCalledTimes(2);
    });

    test("should allow pending subscription status", async () => {
      const pendingSubscription = {
        ...mockSubscription,
        computedStatus: "pending",
      };
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: pendingSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });
  });

  describe("validateUserStateAllowPending", () => {
    test("should return 401 when userId is not present", async () => {
      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware(null))
        .use(validateUserStateAllowPending)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(401);
    });

    test("should allow pending subscription", async () => {
      const pendingSubscription = {
        ...mockSubscription,
        computedStatus: "pending",
      };
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: pendingSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserStateAllowPending)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    test("should allow active subscription", async () => {
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: mockSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserStateAllowPending)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(200);
    });

    test("should reject expired subscription", async () => {
      const expiredSubscription = {
        ...mockSubscription,
        computedStatus: "expired",
      };
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: expiredSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserStateAllowPending)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(403);
    });

    test("should reject canceled subscription", async () => {
      const canceledSubscription = {
        ...mockSubscription,
        computedStatus: "canceled",
      };
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: canceledSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserStateAllowPending)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(403);
    });

    test("should reject deactivated user", async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUserCacheGet.mockResolvedValue({
        user: deactivatedUser,
        subscription: mockSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserStateAllowPending)
        .get("/test", () => ({ success: true }));

      const response = await app.handle(new Request("http://localhost/test"));

      expect(response.status).toBe(403);
    });
  });

  describe("caching behavior", () => {
    test("should use cached data when available", async () => {
      mockUserCacheGet.mockResolvedValue({
        user: mockUser,
        subscription: mockSubscription,
        cachedAt: Date.now(),
      });

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      await app.handle(new Request("http://localhost/test"));

      expect(mockUserCacheGet).toHaveBeenCalledWith("user-123");
      expect(mockUserRepoFindById).not.toHaveBeenCalled();
    });

    test("should cache data after loading from database", async () => {
      mockUserCacheGet.mockResolvedValue(null);
      mockUserRepoFindById.mockResolvedValue(mockUser);
      mockSubscriptionRepoFindCurrentByUserId.mockResolvedValue(mockSubscription as any);

      const app = new Elysia()
        .use(errorHandlerPlugin)
        .use(createMockAuthMiddleware("user-123"))
        .use(validateUserState)
        .get("/test", () => ({ success: true }));

      await app.handle(new Request("http://localhost/test"));

      expect(mockUserCacheSet).toHaveBeenCalledWith("user-123", mockUser, mockSubscription);
    });
  });
});
