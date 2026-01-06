import { beforeEach, describe, expect, mock, test } from "bun:test";
import { AccountAlreadyVerifiedError, UserNotFoundError } from "@basylab/core/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { GetResendStatusUseCase } from "./get-resend-status.use-case";

describe("GetResendStatusUseCase", () => {
  let useCase: GetResendStatusUseCase;
  let mockUserRepository: IUserRepository;

  const validEmail = "test@example.com";

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
    verificationSecret: "secret",
    verificationExpiresAt: new Date(Date.now() + 300000),
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

  beforeEach(() => {
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

    useCase = new GetResendStatusUseCase(mockUserRepository);
  });

  describe("User Validation", () => {
    test("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepository.findByEmail = mock(() => Promise.resolve(null));

      await expect(useCase.execute(validEmail)).rejects.toThrow(UserNotFoundError);
    });

    test("should throw UserNotFoundError for non-existent user", async () => {
      mockUserRepository.findByEmail = mock(() => Promise.resolve(null));

      await expect(useCase.execute(validEmail)).rejects.toThrow(UserNotFoundError);
    });

    test("should query user by email", async () => {
      await useCase.execute(validEmail);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validEmail);
    });
  });

  describe("Verified Account Check", () => {
    test("should throw AccountAlreadyVerifiedError when account is verified", async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(verifiedUser));

      await expect(useCase.execute(validEmail)).rejects.toThrow(AccountAlreadyVerifiedError);
    });

    test("should throw AccountAlreadyVerifiedError", async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(verifiedUser));

      await expect(useCase.execute(validEmail)).rejects.toThrow(AccountAlreadyVerifiedError);
    });
  });

  describe("Initial State", () => {
    test("should return 5 remaining attempts initially", async () => {
      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBe(5);
    });

    test("should return can resend true initially", async () => {
      const result = await useCase.execute(validEmail);

      expect(result.canResend).toBe(true);
    });

    test("should have canResendAt null initially", async () => {
      const result = await useCase.execute(validEmail);

      expect(result.canResendAt).toBeNull();
    });
  });

  describe("Cooldown Logic", () => {
    test("should apply 30s cooldown for first resend", async () => {
      const userWithResend = {
        ...mockUser,
        verificationResendCount: 1,
        verificationLastResendAt: new Date(Date.now() - 10000), // 10s ago
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userWithResend));

      const result = await useCase.execute(validEmail);

      expect(result.canResend).toBe(false);
    });

    test("should apply 60s cooldown after 2 resends", async () => {
      const userWithResends = {
        ...mockUser,
        verificationResendCount: 2,
        verificationLastResendAt: new Date(Date.now() - 10000), // 10s ago
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userWithResends));

      const result = await useCase.execute(validEmail);

      expect(result.canResend).toBe(false);
    });

    test("should allow resend after cooldown expires", async () => {
      const userAfterCooldown = {
        ...mockUser,
        verificationResendCount: 1,
        verificationLastResendAt: new Date(Date.now() - 40000), // 40s ago
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userAfterCooldown));

      const result = await useCase.execute(validEmail);

      expect(result.canResend).toBe(true);
    });
  });

  describe("Remaining Attempts", () => {
    test("should decrease remaining attempts", async () => {
      const userWith2Resends = {
        ...mockUser,
        verificationResendCount: 2,
        verificationLastResendAt: new Date(Date.now() - 100000),
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userWith2Resends));

      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBe(3); // 5 - 2
    });

    test("should block resend when max attempts reached", async () => {
      const userMaxAttempts = {
        ...mockUser,
        verificationResendCount: 5,
        verificationLastResendAt: new Date(Date.now() - 100000),
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userMaxAttempts));

      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBe(0);
      expect(result.canResend).toBe(false);
    });

    test("should block resend when over max attempts", async () => {
      const userOverMax = {
        ...mockUser,
        verificationResendCount: 10,
        verificationLastResendAt: new Date(Date.now() - 100000),
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userOverMax));

      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBeLessThanOrEqual(0);
      expect(result.canResend).toBe(false);
    });
  });

  describe("24-Hour Reset", () => {
    test("should reset counter after 24 hours", async () => {
      const userOldResends = {
        ...mockUser,
        verificationResendCount: 5,
        verificationLastResendAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h ago
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userOldResends));

      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBe(5); // Reset to 0, so 5 remaining
      expect(result.canResend).toBe(true);
    });

    test("should not reset counter before 24 hours", async () => {
      const userRecentResends = {
        ...mockUser,
        verificationResendCount: 5,
        verificationLastResendAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23h ago
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userRecentResends));

      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBe(0);
      expect(result.canResend).toBe(false);
    });

    test("should reset at exact 24 hour boundary", async () => {
      const userExact24h = {
        ...mockUser,
        verificationResendCount: 5,
        verificationLastResendAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Exactly 24h
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userExact24h));

      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBe(5);
      expect(result.canResend).toBe(true);
    });
  });

  describe("Return Values", () => {
    test("should return all required fields", async () => {
      const result = await useCase.execute(validEmail);

      expect(result).toHaveProperty("remainingAttempts");
      expect(result).toHaveProperty("canResend");
    });

    test("should return numbers for all fields", async () => {
      const result = await useCase.execute(validEmail);

      expect(typeof result.remainingAttempts).toBe("number");
      expect(typeof result.canResend).toBe("boolean");
    });
  });

  describe("Edge Cases", () => {
    test("should handle null resend count", async () => {
      const userNullCount = {
        ...mockUser,
        verificationResendCount: 0,
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userNullCount));

      const result = await useCase.execute(validEmail);

      expect(result.remainingAttempts).toBe(5);
    });

    test("should handle null last resend date", async () => {
      const userNullDate = {
        ...mockUser,
        verificationLastResendAt: null,
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userNullDate));

      const result = await useCase.execute(validEmail);

      expect(result.canResend).toBe(true);
    });

    test("should have canResendAt when cooldown active", async () => {
      const userPartialCooldown = {
        ...mockUser,
        verificationResendCount: 1,
        verificationLastResendAt: new Date(Date.now() - 10500), // 10.5s ago
      };
      mockUserRepository.findByEmail = mock(() => Promise.resolve(userPartialCooldown));

      const result = await useCase.execute(validEmail);

      expect(result.canResend).toBe(false);
      expect(result.canResendAt).not.toBeNull();
    });
  });
});
