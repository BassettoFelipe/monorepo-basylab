import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { User } from "@/db/schema/users";
import {
  AccountAlreadyVerifiedError,
  EmailSendFailedError,
  ResendLimitExceededError,
  UserNotFoundError,
} from "@/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { EmailServiceError, emailService as originalEmailService } from "@/services/email";
import { ResendVerificationCodeUseCase } from "./resend-verification-code.use-case";

const mockSendVerificationCode = mock(() => Promise.resolve());
const mockSendUserInvitation = mock(() => Promise.resolve());

mock.module("@/services/email/email.service", () => ({
  emailService: {
    ...originalEmailService,
    sendVerificationCode: mockSendVerificationCode,
    sendUserInvitation: mockSendUserInvitation,
  },
  EmailServiceError: EmailServiceError,
}));

afterAll(() => {
  mock.module("@/services/email/email.service", () => ({
    emailService: originalEmailService,
    EmailServiceError,
  }));
});

describe("ResendVerificationCodeUseCase", () => {
  let useCase: ResendVerificationCodeUseCase;
  let mockUserRepository: IUserRepository;

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: "user-id-123",
    email: "user@example.com",
    name: "João Silva",
    password: "hashed-password",
    role: "owner",
    phone: null,
    avatarUrl: null,
    companyId: null,
    createdBy: null,
    isActive: true,
    isEmailVerified: false,
    verificationSecret: "old-secret",
    verificationExpiresAt: new Date(Date.now() + 300000),
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
    ...overrides,
  });

  beforeEach(() => {
    mockSendVerificationCode.mockClear();

    mockUserRepository = {
      findByEmail: mock(() => Promise.resolve(null)),
      findById: mock(() => Promise.resolve(null)),
      findByCompanyId: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve(createMockUser())),
      registerWithTransaction: mock(() =>
        Promise.resolve({
          user: createMockUser(),
          companyId: "company-123",
          subscriptionId: "sub-123",
        }),
      ),
      update: mock(() => Promise.resolve(createMockUser())),
      delete: mock(() => Promise.resolve(true)),
      deleteByEmail: mock(() => Promise.resolve(true)),
    };

    useCase = new ResendVerificationCodeUseCase(mockUserRepository);
  });

  describe("User Validation", () => {
    test("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepository.findByEmail = mock(() => Promise.resolve(null));

      await expect(useCase.execute({ email: "nonexistent@example.com" })).rejects.toThrow(
        UserNotFoundError,
      );
    });

    test("should throw AccountAlreadyVerifiedError when email is already verified", async () => {
      const verifiedUser = createMockUser({ isEmailVerified: true });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(verifiedUser));

      await expect(useCase.execute({ email: "user@example.com" })).rejects.toThrow(
        AccountAlreadyVerifiedError,
      );
    });
  });

  describe("Rate Limiting", () => {
    test("should allow resend with initial 30s cooldown for first attempts", async () => {
      const user = createMockUser({
        verificationResendCount: 0,
        verificationLastResendAt: new Date(Date.now() - 31000), // 31 seconds ago
      });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));

      const result = await useCase.execute({ email: "user@example.com" });

      expect(result.success).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    test("should apply 60s cooldown after 2 resends", async () => {
      const user = createMockUser({
        verificationResendCount: 2,
        verificationLastResendAt: new Date(Date.now() - 61000), // 61 seconds ago
      });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));

      const result = await useCase.execute({ email: "user@example.com" });

      expect(result.success).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    test("should block resend during cooldown period", async () => {
      const user = createMockUser({
        verificationResendCount: 1,
        verificationLastResendAt: new Date(Date.now() - 10000), // 10 seconds ago
      });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));

      await expect(useCase.execute({ email: "user@example.com" })).rejects.toThrow(
        ResendLimitExceededError,
      );
    });

    test("should reject after max resend attempts", async () => {
      const user = createMockUser({
        verificationResendCount: 5,
        verificationLastResendAt: new Date(Date.now() - 100000),
      });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));

      await expect(useCase.execute({ email: "user@example.com" })).rejects.toThrow(
        ResendLimitExceededError,
      );
    });

    test("should reset counter after 24 hours", async () => {
      const user = createMockUser({
        verificationResendCount: 5,
        verificationLastResendAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));

      const result = await useCase.execute({ email: "user@example.com" });

      expect(result.success).toBe(true);
      expect(result.remainingAttempts).toBe(4); // Reset to 0, then incremented to 1
    });
  });

  describe("Code Generation and Persistence", () => {
    test("should generate new verification secret and code", async () => {
      const user = createMockUser();
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));

      await useCase.execute({ email: "user@example.com" });

      expect(mockUserRepository.update).toHaveBeenCalled();
      const updateCall = (mockUserRepository.update as ReturnType<typeof mock>).mock.calls[0];
      expect(updateCall[1]).toHaveProperty("verificationSecret");
      expect(updateCall[1]).toHaveProperty("verificationExpiresAt");
      expect(updateCall[1].verificationSecret).not.toBe("old-secret");
    });

    test("should increment resend count", async () => {
      const user = createMockUser({ verificationResendCount: 2 });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));

      await useCase.execute({ email: "user@example.com" });

      const updateCall = (mockUserRepository.update as ReturnType<typeof mock>).mock.calls[0];
      expect(updateCall[1].verificationResendCount).toBe(3);
    });

    test("should update last resend timestamp", async () => {
      const user = createMockUser();
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));

      const beforeTime = Date.now();
      await useCase.execute({ email: "user@example.com" });
      const afterTime = Date.now();

      const updateCall = (mockUserRepository.update as ReturnType<typeof mock>).mock.calls[0];
      const timestamp = updateCall[1].verificationLastResendAt.getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("Email Sending", () => {
    test("should send verification email with correct parameters", async () => {
      const user = createMockUser();
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));
      mockSendVerificationCode.mockResolvedValue(undefined);

      await useCase.execute({ email: "user@example.com" });

      expect(mockSendVerificationCode).toHaveBeenCalledTimes(1);
      const [email, name, code] = mockSendVerificationCode.mock.calls[0] as unknown as [
        string,
        string,
        string,
      ];
      expect(email).toBe("user@example.com");
      expect(name).toBe("João Silva");
      expect(code).toMatch(/^\d{6}$/); // 6-digit code
    });

    test("should rollback database changes if email send fails", async () => {
      const user = createMockUser({
        verificationSecret: "original-secret",
        verificationResendCount: 2,
      });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));
      mockSendVerificationCode.mockRejectedValue(
        new EmailServiceError("SMTP Error", new Error("SMTP connection failed")),
      );

      await expect(useCase.execute({ email: "user@example.com" })).rejects.toThrow(
        EmailSendFailedError,
      );

      expect(mockUserRepository.update).toHaveBeenCalledTimes(2);

      const rollbackCall = (mockUserRepository.update as ReturnType<typeof mock>).mock.calls[1];
      expect(rollbackCall[1].verificationSecret).toBe("original-secret");
      expect(rollbackCall[1].verificationResendCount).toBe(2);
    });

    test("should throw EmailSendFailedError on email failure", async () => {
      const user = createMockUser();
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));
      mockSendVerificationCode.mockRejectedValue(
        new EmailServiceError("Connection timeout", new Error("Timeout exceeded")),
      );

      await expect(useCase.execute({ email: "user@example.com" })).rejects.toThrow(
        EmailSendFailedError,
      );
    });

    test("should handle generic errors during email send", async () => {
      const user = createMockUser();
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));
      mockSendVerificationCode.mockRejectedValue(new Error("Unknown error"));

      await expect(useCase.execute({ email: "user@example.com" })).rejects.toThrow(
        EmailSendFailedError,
      );
    });
  });

  describe("Return Values", () => {
    test("should return correct response structure on success", async () => {
      const user = createMockUser();
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));
      mockSendVerificationCode.mockResolvedValue(undefined);

      const result = await useCase.execute({ email: "user@example.com" });

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("remainingAttempts");
      expect(result).toHaveProperty("canResendAt");
      expect(result).toHaveProperty("isBlocked");
      expect(result).toHaveProperty("blockedUntil");
    });

    test("should return decremented remaining attempts", async () => {
      const user = createMockUser({ verificationResendCount: 3 });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(user));
      mockUserRepository.update = mock(() => Promise.resolve(user));
      mockSendVerificationCode.mockResolvedValue(undefined); // Ensure email succeeds

      const result = await useCase.execute({ email: "user@example.com" });

      expect(result.remainingAttempts).toBe(1); // 5 - (3 + 1)
    });
  });
});
