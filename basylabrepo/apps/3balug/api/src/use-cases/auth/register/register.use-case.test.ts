import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  EmailAlreadyExistsError,
  EmailNotVerifiedError,
  EmailSendFailedError,
  PlanNotFoundError,
  WeakPasswordError,
} from "@basylab/core/errors";
import {
  Sanitizers as OriginalSanitizers,
  Validators as OriginalValidators,
} from "@basylab/core/validation";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { EmailServiceError, emailService as originalEmailService } from "@/services/email";
import { createBasicPlan, createMockUser } from "@/test/test-data";
import { createMockPlanRepository, createMockUserRepository } from "@/test/test-helpers";
import { RegisterUseCase } from "./register.use-case";

const mockSendVerificationCode = mock(() => Promise.resolve());
const mockSendUserInvitation = mock(() => Promise.resolve());
const mockValidatePasswordStrength = mock((password: string): string[] => {
  // Simulate real validation for weak passwords
  if (password === "weak") {
    return ["Senha deve ter pelo menos 8 caracteres"];
  }
  return [];
});

mock.module("@/services/email/email.service", () => ({
  emailService: {
    ...originalEmailService,
    sendVerificationCode: mockSendVerificationCode,
    sendUserInvitation: mockSendUserInvitation,
    verifyConnection: mock(() => Promise.resolve(true)),
  },
  EmailServiceError,
}));

mock.module("@basylab/core/validation", () => ({
  Validators: {
    ...OriginalValidators,
    validatePasswordStrength: mockValidatePasswordStrength,
  },
  Sanitizers: OriginalSanitizers,
}));

afterAll(() => {
  mock.module("@/services/email/email.service", () => ({
    emailService: originalEmailService,
    EmailServiceError,
  }));
  mock.module("@basylab/core/validation", () => ({
    Validators: OriginalValidators,
    Sanitizers: OriginalSanitizers,
  }));
});

describe("RegisterUseCase", () => {
  let useCase: RegisterUseCase;
  let mockUserRepository: IUserRepository;
  let mockPlanRepository: IPlanRepository;

  const validInput = {
    email: "test@example.com",
    password: "SecureP@ss123",
    name: "Test User",
    companyName: "Test Company",
    planId: "plan-123",
  };

  function seedHappyPath() {
    const mockUser = createMockUser({ companyId: "company-123" });
    const mockPlan = createBasicPlan();

    mockUserRepository.findByEmail = mock(() => Promise.resolve(null));
    mockPlanRepository.findById = mock(() => Promise.resolve(mockPlan));
    mockUserRepository.registerWithTransaction = mock(() =>
      Promise.resolve({
        user: mockUser,
        companyId: "company-123",
        subscriptionId: "subscription-123",
      }),
    );

    return { mockUser, mockPlan };
  }

  beforeEach(() => {
    mockSendVerificationCode.mockClear();
    mockSendVerificationCode.mockResolvedValue(undefined);

    mockUserRepository = createMockUserRepository();
    mockPlanRepository = createMockPlanRepository();

    useCase = new RegisterUseCase(mockUserRepository, mockPlanRepository);
  });

  describe("Password validation", () => {
    test("rejects weak password", async () => {
      mockPlanRepository.findById = mock(() => Promise.resolve(createBasicPlan()));

      await expect(useCase.execute({ ...validInput, password: "weak" })).rejects.toThrow(
        WeakPasswordError,
      );
    });
  });

  describe("Plan validation", () => {
    test("rejects missing plan", async () => {
      mockUserRepository.findByEmail = mock(() => Promise.resolve(null));
      mockPlanRepository.findById = mock(() => Promise.resolve(null));

      await expect(useCase.execute(validInput)).rejects.toThrow(PlanNotFoundError);
    });
  });

  describe("Existing user validation", () => {
    test("rejects verified email", async () => {
      const existing = createMockUser({
        email: validInput.email,
        isEmailVerified: true,
      });
      mockUserRepository.findByEmail = mock(() => Promise.resolve(existing));

      await expect(useCase.execute(validInput)).rejects.toThrow(EmailAlreadyExistsError);
    });

    test("returns error for unverified email without sending code", async () => {
      const unverified = createMockUser({
        email: validInput.email,
        isEmailVerified: false,
        verificationSecret: "old-secret",
        verificationExpiresAt: new Date(),
      });

      mockUserRepository.findByEmail = mock(() => Promise.resolve(unverified));
      mockUserRepository.update = mock(() => Promise.resolve(unverified));

      await expect(useCase.execute(validInput)).rejects.toThrow(EmailNotVerifiedError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockSendVerificationCode).not.toHaveBeenCalled();
    });
  });

  describe("Success flow", () => {
    test("creates user, subscription and sends email", async () => {
      seedHappyPath();

      const result = await useCase.execute(validInput);

      expect(result).toHaveProperty("userId");
      expect(mockUserRepository.registerWithTransaction).toHaveBeenCalled();
      expect(mockSendVerificationCode).toHaveBeenCalledTimes(1);
    });
  });

  describe("Email failures", () => {
    test("rolls back on email failure", async () => {
      const createdUser = createMockUser({ id: "user-rollback" });

      mockUserRepository.findByEmail = mock(() => Promise.resolve(null));
      mockPlanRepository.findById = mock(() => Promise.resolve(createBasicPlan()));
      mockUserRepository.registerWithTransaction = mock(() =>
        Promise.resolve({
          user: createdUser,
          companyId: "company-123",
          subscriptionId: "subscription-123",
        }),
      );
      mockUserRepository.delete = mock(() => Promise.resolve(true));
      mockSendVerificationCode.mockRejectedValue(
        new EmailServiceError("SMTP down", new Error("Connection failed")),
      );

      await expect(useCase.execute(validInput)).rejects.toThrow(EmailSendFailedError);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(createdUser.id);
    });
  });
});
