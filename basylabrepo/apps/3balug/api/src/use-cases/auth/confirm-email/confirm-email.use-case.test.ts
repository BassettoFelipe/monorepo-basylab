import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  AccountAlreadyVerifiedError,
  InvalidVerificationCodeError,
  PlanNotFoundError,
  SubscriptionNotFoundError,
  UserNotFoundError,
  VerificationCodeExpiredError,
} from "@/errors";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { ISubscriptionRepository } from "@/repositories/contracts/subscription.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { JwtUtils as OriginalJwtUtils } from "@/utils/jwt.utils";
import { TotpUtils as OriginalTotpUtils } from "@/utils/totp.utils";
import { ConfirmEmailUseCase } from "./confirm-email.use-case";

const mockVerifyCode = mock(() => true);
mock.module("@/utils/totp.utils", () => ({
  TotpUtils: {
    verifyCode: mockVerifyCode,
  },
}));

const mockGenerateToken = mock(() => Promise.resolve("checkout-token-123"));
const mockVerifyToken = mock(() =>
  Promise.resolve({
    sub: "user-123",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  }),
);
const mockParseExpirationToSeconds = mock(() => 1800);
mock.module("@/utils/jwt.utils", () => ({
  JwtUtils: {
    generateToken: mockGenerateToken,
    verifyToken: mockVerifyToken,
    parseExpirationToSeconds: mockParseExpirationToSeconds,
  },
}));

afterAll(() => {
  mock.module("@/utils/jwt.utils", () => ({ JwtUtils: OriginalJwtUtils }));
  mock.module("@/utils/totp.utils", () => ({ TotpUtils: OriginalTotpUtils }));
});

describe("ConfirmEmailUseCase", () => {
  let useCase: ConfirmEmailUseCase;
  let mockUserRepository: IUserRepository;
  let mockSubscriptionRepository: ISubscriptionRepository;
  let mockPlanRepository: IPlanRepository;

  const validInput = {
    email: "test@example.com",
    code: "123456",
  };

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    password: "hashed",
    role: "owner",
    phone: null,
    avatarUrl: null,
    companyId: null,
    createdBy: null,
    isActive: true,
    isEmailVerified: false,
    verificationSecret: "secret-123",
    verificationExpiresAt: new Date(Date.now() + 300000), // 5 min future
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

  const mockSubscription = {
    id: "sub-123",
    userId: "user-123",
    planId: "plan-123",
    status: "pending" as const,
    startDate: new Date(),
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlan = {
    id: "plan-123",
    name: "Basic Plan",
    slug: "basic",
    description: "Basic plan",
    price: 9990,
    durationDays: 30,
    maxUsers: 1,
    maxManagers: 0,
    maxSerasaQueries: 100,
    allowsLateCharges: 0,
    features: ["feature1"],
    pagarmePlanId: "plan_test_123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockVerifyCode.mockClear();
    mockGenerateToken.mockClear();
    mockParseExpirationToSeconds.mockClear();

    mockVerifyCode.mockReturnValue(true);
    mockGenerateToken.mockResolvedValue("checkout-token-123");
    mockParseExpirationToSeconds.mockReturnValue(1800);

    mockUserRepository = {
      findById: mock(() => Promise.resolve(null)),
      findByEmail: mock(() => Promise.resolve(mockUser)),
      findByCompanyId: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve(mockUser)),
      registerWithTransaction: mock(() =>
        Promise.resolve({
          user: mockUser,
          companyId: "company-123",
          subscriptionId: "sub-123",
        }),
      ),
      update: mock(() => Promise.resolve(mockUser)),
      delete: mock(() => Promise.resolve(true)),
      deleteByEmail: mock(() => Promise.resolve(true)),
    };

    mockSubscriptionRepository = {
      findById: mock(() => Promise.resolve(null)),
      findByUserId: mock(() => Promise.resolve(mockSubscription)),
      findActiveByUserId: mock(() => Promise.resolve(null)),
      findCurrentByUserId: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve(mockSubscription)),
      update: mock(() => Promise.resolve(mockSubscription)),
      delete: mock(() => Promise.resolve(true)),
    };

    mockPlanRepository = {
      findById: mock(() => Promise.resolve(mockPlan)),
      findBySlug: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve(mockPlan)),
      update: mock(() => Promise.resolve(null)),
      delete: mock(() => Promise.resolve(true)),
    };

    useCase = new ConfirmEmailUseCase(
      mockUserRepository,
      mockSubscriptionRepository,
      mockPlanRepository,
    );
  });

  describe("User Validation", () => {
    test("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepository.findByEmail = mock(() => Promise.resolve(null));

      await expect(useCase.execute(validInput)).rejects.toThrow(UserNotFoundError);
    });

    test("should throw UserNotFoundError for non-existent user", async () => {
      mockUserRepository.findByEmail = mock(() => Promise.resolve(null));

      try {
        await useCase.execute(validInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(UserNotFoundError);
      }
    });

    test("should query user by email", async () => {
      await useCase.execute(validInput);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
    });
  });

  describe("Already Verified Check", () => {
    test("should throw AccountAlreadyVerifiedError when email is already verified", async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(verifiedUser));

      await expect(useCase.execute(validInput)).rejects.toThrow(AccountAlreadyVerifiedError);
    });

    test("should throw AccountAlreadyVerifiedError for verified account", async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(verifiedUser));

      await expect(useCase.execute(validInput)).rejects.toThrow(AccountAlreadyVerifiedError);
    });
  });

  describe("Verification Code Validation", () => {
    test("should throw InvalidVerificationCodeError when no verification code exists", async () => {
      const userNoCode = {
        ...mockUser,
        verificationSecret: null,
        verificationExpiresAt: null,
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userNoCode));

      await expect(useCase.execute(validInput)).rejects.toThrow(InvalidVerificationCodeError);
    });

    test("should throw InvalidVerificationCodeError when secret is null", async () => {
      const userNoSecret = {
        ...mockUser,
        verificationSecret: null,
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userNoSecret));

      try {
        await useCase.execute(validInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidVerificationCodeError);
      }
    });

    test("should throw InvalidVerificationCodeError when expiresAt is null", async () => {
      const userNoExpires = {
        ...mockUser,
        verificationExpiresAt: null,
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userNoExpires));

      try {
        await useCase.execute(validInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidVerificationCodeError);
      }
    });

    test("should throw VerificationCodeExpiredError when code is expired", async () => {
      const userExpired = {
        ...mockUser,
        verificationExpiresAt: new Date(Date.now() - 1000), // 1 second ago
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userExpired));

      await expect(useCase.execute(validInput)).rejects.toThrow(VerificationCodeExpiredError);
    });

    test("should throw VerificationCodeExpiredError for expired code", async () => {
      const userExpired = {
        ...mockUser,
        verificationExpiresAt: new Date(Date.now() - 1000),
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userExpired));

      try {
        await useCase.execute(validInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(VerificationCodeExpiredError);
      }
    });

    test("should throw InvalidVerificationCodeError when code is invalid", async () => {
      mockVerifyCode.mockReturnValue(false);

      await expect(useCase.execute(validInput)).rejects.toThrow(InvalidVerificationCodeError);
    });

    test("should throw InvalidVerificationCodeError for wrong code", async () => {
      mockVerifyCode.mockReturnValue(false);

      try {
        await useCase.execute(validInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidVerificationCodeError);
      }
    });

    test("should verify code using TotpUtils", async () => {
      await useCase.execute(validInput);

      expect(mockVerifyCode).toHaveBeenCalledWith(mockUser.verificationSecret, validInput.code);
    });
  });

  describe("Subscription and Plan Validation", () => {
    test("should throw SubscriptionNotFoundError when subscription does not exist", async () => {
      mockSubscriptionRepository.findByUserId = mock(() => Promise.resolve(null));

      await expect(useCase.execute(validInput)).rejects.toThrow(SubscriptionNotFoundError);
    });

    test("should throw SubscriptionNotFoundError", async () => {
      mockSubscriptionRepository.findByUserId = mock(() => Promise.resolve(null));

      try {
        await useCase.execute(validInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(SubscriptionNotFoundError);
      }
    });

    test("should throw PlanNotFoundError when plan does not exist", async () => {
      mockPlanRepository.findById = mock(() => Promise.resolve(null));

      await expect(useCase.execute(validInput)).rejects.toThrow(PlanNotFoundError);
    });

    test("should throw PlanNotFoundError", async () => {
      mockPlanRepository.findById = mock(() => Promise.resolve(null));

      try {
        await useCase.execute(validInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(PlanNotFoundError);
      }
    });

    test("should query subscription by user ID", async () => {
      await useCase.execute(validInput);

      expect(mockSubscriptionRepository.findByUserId).toHaveBeenCalledWith(mockUser.id);
    });

    test("should query plan by plan ID from subscription", async () => {
      await useCase.execute(validInput);

      expect(mockPlanRepository.findById).toHaveBeenCalledWith(mockSubscription.planId);
    });
  });

  describe("User Update", () => {
    test("should mark email as verified", async () => {
      await useCase.execute(validInput);

      expect(mockUserRepository.update).toHaveBeenCalled();
      const updateCall = (mockUserRepository.update as ReturnType<typeof mock>).mock.calls[0];
      expect(updateCall[0]).toBe(mockUser.id);
      expect(updateCall[1].isEmailVerified).toBe(true);
    });

    test("should clear verification secret and expiration", async () => {
      await useCase.execute(validInput);

      const updateCall = (mockUserRepository.update as ReturnType<typeof mock>).mock.calls[0];
      expect(updateCall[1].verificationSecret).toBeNull();
      expect(updateCall[1].verificationExpiresAt).toBeNull();
    });
  });

  describe("Checkout Token Generation", () => {
    test("should generate checkout token with correct payload", async () => {
      await useCase.execute(validInput);

      expect(mockGenerateToken).toHaveBeenCalled();
      const tokenCall = mockGenerateToken.mock.calls[0] as unknown as [
        string,
        string,
        Record<string, unknown>,
      ];
      expect(tokenCall[0]).toBe(mockUser.id);
      expect(tokenCall[1]).toBe("checkout");
      expect(tokenCall[2]).toHaveProperty("purpose", "checkout");
      expect(tokenCall[2]).toHaveProperty("user");
      expect(tokenCall[2]).toHaveProperty("subscription");
      expect(tokenCall[2]).toHaveProperty("plan");
    });

    test("should include user data in checkout token", async () => {
      await useCase.execute(validInput);

      const tokenCall = mockGenerateToken.mock.calls[0] as unknown as [
        string,
        string,
        Record<string, any>,
      ];
      expect(tokenCall[2].user).toEqual({
        name: mockUser.name,
        email: mockUser.email,
      });
    });

    test("should include subscription data in checkout token", async () => {
      await useCase.execute(validInput);

      const tokenCall = mockGenerateToken.mock.calls[0] as unknown as [
        string,
        string,
        Record<string, any>,
      ];
      expect(tokenCall[2].subscription).toEqual({
        id: mockSubscription.id,
        status: mockSubscription.status,
      });
    });

    test("should include plan data in checkout token", async () => {
      await useCase.execute(validInput);

      const tokenCall = mockGenerateToken.mock.calls[0] as unknown as [
        string,
        string,
        Record<string, any>,
      ];
      expect(tokenCall[2].plan).toEqual({
        id: mockPlan.id,
        name: mockPlan.name,
        price: mockPlan.price,
        features: mockPlan.features,
      });
    });
  });

  describe("Return Values", () => {
    test("should return checkout token", async () => {
      const result = await useCase.execute(validInput);

      expect(result.checkoutToken).toBe("checkout-token-123");
    });

    test("should return expiration time as absolute timestamp", async () => {
      const result = await useCase.execute(validInput);

      expect(result.checkoutExpiresAt).toBeTruthy();
      const expiresDate = new Date(result.checkoutExpiresAt);
      const expectedTime = Date.now() + 1800000; // 30 minutos
      expect(expiresDate.getTime()).toBeGreaterThanOrEqual(expectedTime - 2000);
      expect(expiresDate.getTime()).toBeLessThanOrEqual(expectedTime + 2000);
    });

    test("should parse expiration from env", async () => {
      await useCase.execute(validInput);

      expect(mockParseExpirationToSeconds).toHaveBeenCalled();
    });
  });

  describe("Complete Flow", () => {
    test("should complete email confirmation successfully", async () => {
      const result = await useCase.execute(validInput);

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();

      expect(mockVerifyCode).toHaveBeenCalled();

      expect(mockSubscriptionRepository.findByUserId).toHaveBeenCalled();
      expect(mockPlanRepository.findById).toHaveBeenCalled();

      expect(mockUserRepository.update).toHaveBeenCalled();

      expect(mockGenerateToken).toHaveBeenCalled();

      expect(result.checkoutToken).toBeDefined();
      expect(result.checkoutExpiresAt).toBeDefined();
      expect(new Date(result.checkoutExpiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("Edge Cases", () => {
    test("should reject code at exact expiration boundary", async () => {
      const exactExpire = {
        ...mockUser,
        verificationExpiresAt: new Date(Date.now() - 1), // 1ms in the past
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(exactExpire));

      await expect(useCase.execute(validInput)).rejects.toThrow(VerificationCodeExpiredError);
    });

    test("should handle 6-digit code", async () => {
      await useCase.execute({ ...validInput, code: "123456" });

      expect(mockVerifyCode).toHaveBeenCalledWith(mockUser.verificationSecret, "123456");
    });

    test("should handle special characters in email", async () => {
      const specialEmail = "user+tag@example.com";
      const userWithSpecialEmail = { ...mockUser, email: specialEmail };
      (mockUserRepository.findByEmail as ReturnType<typeof mock>).mockResolvedValue(
        userWithSpecialEmail,
      );

      await useCase.execute({ ...validInput, email: specialEmail });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(specialEmail);
    });
  });
});
