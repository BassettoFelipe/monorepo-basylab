import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { InvalidTokenError, UserNotFoundError } from "@basylab/core/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { JwtUtils as OriginalJwtUtils } from "@/utils/jwt.utils";
import { RefreshTokensUseCase } from "./refresh-tokens.use-case";

const mockVerifyToken = mock(() =>
  Promise.resolve({
    sub: "user-123",
    exp: Date.now() / 1000 + 3600,
    iat: Date.now() / 1000,
  }),
);
const mockGenerateToken = mock(() => Promise.resolve("new-token"));
mock.module("@/utils/jwt.utils", () => ({
  JwtUtils: {
    verifyToken: mockVerifyToken,
    generateToken: mockGenerateToken,
  },
}));

afterAll(() => {
  mock.module("@/utils/jwt.utils", () => ({ JwtUtils: OriginalJwtUtils }));
});

describe("RefreshTokensUseCase", () => {
  let useCase: RefreshTokensUseCase;
  let mockUserRepository: IUserRepository;

  const validRefreshToken = "valid-refresh-token";

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    password: "hashed",
    role: "owner" as const,
    phone: null,
    avatarUrl: null,
    companyId: null,
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
    passwordResetResendBlocked: false,
    passwordResetResendBlockedUntil: null,
    passwordResetAttempts: 0,
    passwordResetLastAttemptAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockVerifyToken.mockClear();
    mockGenerateToken.mockClear();

    mockVerifyToken.mockResolvedValue({
      sub: "user-123",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });
    mockGenerateToken.mockResolvedValue("new-token");

    mockUserRepository = {
      findById: mock(() => Promise.resolve(mockUser)),
      findByEmail: mock(() => Promise.resolve(null)),
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

    useCase = new RefreshTokensUseCase(mockUserRepository);
  });

  describe("Token Verification", () => {
    test("should verify refresh token", async () => {
      await useCase.execute(validRefreshToken);

      expect(mockVerifyToken).toHaveBeenCalledWith(validRefreshToken, "refresh");
    });

    test("should throw InvalidTokenError when token is invalid", async () => {
      mockVerifyToken.mockResolvedValue(
        null as unknown as { sub: string; exp: number; iat: number },
      );

      await expect(useCase.execute("invalid-token")).rejects.toThrow(InvalidTokenError);
    });

    test("should throw InvalidTokenError for invalid token", async () => {
      mockVerifyToken.mockResolvedValue(
        null as unknown as { sub: string; exp: number; iat: number },
      );

      await expect(useCase.execute("invalid-token")).rejects.toThrow(InvalidTokenError);
    });

    test("should throw InvalidTokenError when token is expired", async () => {
      mockVerifyToken.mockResolvedValue(
        null as unknown as { sub: string; exp: number; iat: number },
      );

      await expect(useCase.execute(validRefreshToken)).rejects.toThrow(InvalidTokenError);
    });
  });

  describe("User Validation", () => {
    test("should find user by ID from token payload", async () => {
      await useCase.execute(validRefreshToken);

      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
    });

    test("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepository.findById = mock(() => Promise.resolve(null));

      await expect(useCase.execute(validRefreshToken)).rejects.toThrow(UserNotFoundError);
    });

    test("should throw UserNotFoundError when user not found", async () => {
      mockUserRepository.findById = mock(() => Promise.resolve(null));

      try {
        await useCase.execute(validRefreshToken);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(UserNotFoundError);
      }
    });

    test("should throw ForbiddenError when user is not active", async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findById = mock(() => Promise.resolve(inactiveUser));

      await expect(useCase.execute(validRefreshToken)).rejects.toThrow(
        "Sua conta foi desativada. Entre em contato com o administrador da sua empresa para mais informações.",
      );
    });
  });

  describe("Token Generation", () => {
    test("should generate new access token", async () => {
      await useCase.execute(validRefreshToken);

      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser.id, "access", expect.any(Object));
    });

    test("should generate new refresh token", async () => {
      await useCase.execute(validRefreshToken);

      expect(mockGenerateToken).toHaveBeenCalledWith(mockUser.id, "refresh", expect.any(Object));
    });

    test("should generate both tokens in parallel", async () => {
      await useCase.execute(validRefreshToken);

      expect(mockGenerateToken).toHaveBeenCalledTimes(2);
    });
  });

  describe("Return Values", () => {
    test("should return new access token", async () => {
      const result = await useCase.execute(validRefreshToken);

      expect(result.accessToken).toBe("new-token");
    });

    test("should return new refresh token", async () => {
      const result = await useCase.execute(validRefreshToken);

      expect(result.refreshToken).toBe("new-token");
    });

    test("should return both tokens", async () => {
      const result = await useCase.execute(validRefreshToken);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });
  });

  describe("Complete Flow", () => {
    test("should successfully refresh tokens", async () => {
      const result = await useCase.execute(validRefreshToken);

      expect(mockVerifyToken).toHaveBeenCalled();

      expect(mockUserRepository.findById).toHaveBeenCalled();

      expect(mockGenerateToken).toHaveBeenCalledTimes(2);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("should handle different user IDs", async () => {
      mockVerifyToken.mockResolvedValue({
        sub: "different-user",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      });

      await useCase.execute(validRefreshToken);

      expect(mockUserRepository.findById).toHaveBeenCalledWith("different-user");
    });

    test("should handle very long refresh tokens", async () => {
      const longToken = "a".repeat(500);

      await useCase.execute(longToken);

      expect(mockVerifyToken).toHaveBeenCalledWith(longToken, "refresh");
    });

    test("should handle refresh token with special characters", async () => {
      const specialToken = "token.with.dots-and_underscores";

      await useCase.execute(specialToken);

      expect(mockVerifyToken).toHaveBeenCalledWith(specialToken, "refresh");
    });
  });
});
