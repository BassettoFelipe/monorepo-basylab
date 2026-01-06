import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  EmailNotVerifiedError,
  InvalidPasswordResetCodeError,
  PasswordResetCodeExpiredError,
  TooManyRequestsError,
  UserNotFoundError,
  WeakPasswordError,
} from "@/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { User } from "@/types/user";
import { CryptoUtils as OriginalCryptoUtils } from "@/utils/crypto.utils";
import { validatePasswordStrength as originalValidatePasswordStrength } from "@/utils/password-validator";
import { TotpUtils as OriginalTotpUtils } from "@/utils/totp.utils";
import { ConfirmPasswordResetUseCase } from "./confirm-password-reset.use-case";

// Mocks
const mockHashPassword = mock(() => Promise.resolve("$2b$10$hashedPassword"));
const mockVerifyCode = mock(() => true);
const mockValidatePasswordStrength = mock(() => ({
  isValid: true,
  errors: [] as string[],
}));

mock.module("@/utils/crypto.utils", () => ({
  CryptoUtils: {
    ...OriginalCryptoUtils,
    hashPassword: mockHashPassword,
  },
}));

mock.module("@/utils/totp.utils", () => ({
  TotpUtils: {
    ...OriginalTotpUtils,
    verifyCode: mockVerifyCode,
  },
}));

mock.module("@/utils/password-validator", () => ({
  validatePasswordStrength: mockValidatePasswordStrength,
}));

afterAll(() => {
  mock.module("@/utils/crypto.utils", () => ({
    CryptoUtils: OriginalCryptoUtils,
  }));
  mock.module("@/utils/totp.utils", () => ({
    TotpUtils: OriginalTotpUtils,
  }));
  mock.module("@/utils/password-validator", () => ({
    validatePasswordStrength: originalValidatePasswordStrength,
  }));
});

describe("ConfirmPasswordResetUseCase", () => {
  let userRepository: IUserRepository;
  let confirmPasswordResetUseCase: ConfirmPasswordResetUseCase;

  const mockUser: User = {
    id: "user-id-123",
    name: "Test User",
    email: "test@example.com",
    password: "$2b$10$existingHashedPassword",
    role: "owner",
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
    passwordResetSecret: "TOTP_SECRET_123",
    passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    passwordResetAttempts: 0,
    passwordResetLastAttemptAt: null,
    passwordResetResendCount: 0,
    passwordResetCooldownEndsAt: null,
    passwordResetResendBlocked: false,
    passwordResetResendBlockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockHashPassword.mockClear();
    mockVerifyCode.mockClear();
    mockValidatePasswordStrength.mockClear();

    mockHashPassword.mockResolvedValue("$2b$10$hashedPassword");
    mockVerifyCode.mockReturnValue(true);
    mockValidatePasswordStrength.mockReturnValue({
      isValid: true,
      errors: [] as string[],
    });

    userRepository = {
      findByEmail: mock(() => Promise.resolve({ ...mockUser })),
      update: mock(() => Promise.resolve()),
    } as unknown as IUserRepository;

    confirmPasswordResetUseCase = new ConfirmPasswordResetUseCase(userRepository);
  });

  describe("Fluxo de sucesso", () => {
    it("deve redefinir senha com sucesso", async () => {
      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      const result = await confirmPasswordResetUseCase.execute(input);

      expect(result).toEqual({
        success: true,
        message: "Senha redefinida com sucesso. Faça login com sua nova senha.",
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
      expect(mockVerifyCode).toHaveBeenCalledWith("TOTP_SECRET_123", "123456");
      expect(mockValidatePasswordStrength).toHaveBeenCalledWith("NewStrongP@ss123");
      expect(mockHashPassword).toHaveBeenCalledWith("NewStrongP@ss123");
      expect(userRepository.update).toHaveBeenCalledWith("user-id-123", {
        password: "$2b$10$hashedPassword",
        passwordResetSecret: null,
        passwordResetExpiresAt: null,
        passwordResetResendCount: 0,
        passwordResetCooldownEndsAt: null,
        passwordResetResendBlocked: false,
        passwordResetResendBlockedUntil: null,
        passwordResetAttempts: 0,
        passwordResetLastAttemptAt: null,
      });
    });

    it("deve normalizar email (lowercase e trim)", async () => {
      const input = {
        email: "  TEST@EXAMPLE.COM  ",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      await confirmPasswordResetUseCase.execute(input);

      expect(userRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("deve permitir reset para usuário criado por admin (sem senha)", async () => {
      const adminCreatedUser = {
        ...mockUser,
        password: null, // Usuário criado por admin
        isEmailVerified: false, // Ainda não verificou email
      };

      userRepository.findByEmail = mock(() => Promise.resolve(adminCreatedUser));

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      const result = await confirmPasswordResetUseCase.execute(input);

      expect(result.success).toBe(true);
    });
  });

  describe("Validações de usuário", () => {
    it("deve lançar erro se usuário não existir", async () => {
      userRepository.findByEmail = mock(() => Promise.resolve(null));

      const input = {
        email: "nonexistent@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(UserNotFoundError);
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        "Usuário não encontrado.",
      );
    });

    it("deve lançar erro se email não verificado (usuário normal com senha)", async () => {
      const unverifiedUser = {
        ...mockUser,
        password: "$2b$10$existingPassword", // Tem senha
        isEmailVerified: false, // Email não verificado
      };

      userRepository.findByEmail = mock(() => Promise.resolve(unverifiedUser));

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        EmailNotVerifiedError,
      );
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        "Email não verificado. Por favor, verifique seu email primeiro.",
      );
    });
  });

  describe("Validações de código de reset", () => {
    it("deve lançar erro se nenhum código foi solicitado", async () => {
      const userWithoutReset = {
        ...mockUser,
        passwordResetSecret: null,
        passwordResetExpiresAt: null,
      };

      userRepository.findByEmail = mock(() => Promise.resolve(userWithoutReset));

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        InvalidPasswordResetCodeError,
      );
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        "Nenhum código de recuperação foi solicitado. Solicite um novo código.",
      );
    });

    it("deve lançar erro se código expirou", async () => {
      const userWithExpiredCode = {
        ...mockUser,
        passwordResetExpiresAt: new Date(Date.now() - 1000), // 1 second ago
      };

      userRepository.findByEmail = mock(() => Promise.resolve(userWithExpiredCode));

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        PasswordResetCodeExpiredError,
      );
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        "Código de recuperação expirado. Solicite um novo código.",
      );
    });

    it("deve lançar erro se excedeu limite de tentativas", async () => {
      const userWithMaxAttempts = {
        ...mockUser,
        passwordResetAttempts: 5, // MAX_CODE_ATTEMPTS
      };

      userRepository.findByEmail = mock(() => Promise.resolve(userWithMaxAttempts));

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        TooManyRequestsError,
      );
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        "Você atingiu o limite de tentativas para este código. Solicite um novo código.",
      );
    });

    it("deve aplicar throttle após 3ª tentativa (5 segundos)", async () => {
      const userWith3Attempts = {
        ...mockUser,
        passwordResetAttempts: 2, // 3ª tentativa terá delay de 5s
        passwordResetLastAttemptAt: new Date(Date.now() - 3000), // 3 seconds ago
      };

      userRepository.findByEmail = mock(() => Promise.resolve(userWith3Attempts));

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        TooManyRequestsError,
      );
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        /Aguarde \d+ segundos? antes de tentar novamente\./,
      );
    });

    it("deve permitir tentativa após período de throttle", async () => {
      const userWith3Attempts = {
        ...mockUser,
        passwordResetAttempts: 2,
        passwordResetLastAttemptAt: new Date(Date.now() - 6000), // 6 seconds ago (> 5s throttle)
      };

      userRepository.findByEmail = mock(() => Promise.resolve(userWith3Attempts));

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewStrongP@ss123",
      };

      const result = await confirmPasswordResetUseCase.execute(input);

      expect(result.success).toBe(true);
    });

    it("deve incrementar tentativas e lançar erro se código inválido", async () => {
      mockVerifyCode.mockReturnValue(false); // Código inválido

      const input = {
        email: "test@example.com",
        code: "999999",
        newPassword: "NewStrongP@ss123",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        InvalidPasswordResetCodeError,
      );
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        /Código de recuperação inválido\. Restam \d+ tentativas? para este código\./,
      );

      expect(userRepository.update).toHaveBeenCalledWith("user-id-123", {
        passwordResetAttempts: 1,
        passwordResetLastAttemptAt: expect.any(Date),
      });
    });
  });

  describe("Validações de senha", () => {
    it("deve lançar erro se senha for fraca", async () => {
      mockValidatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ["Senha deve ter pelo menos 8 caracteres", "Senha deve conter letras maiúsculas"],
      });

      const input = {
        email: "test@example.com",
        code: "123456",
        newPassword: "weak",
      };

      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(WeakPasswordError);
      await expect(confirmPasswordResetUseCase.execute(input)).rejects.toThrow(
        "Senha deve ter pelo menos 8 caracteres, Senha deve conter letras maiúsculas",
      );
    });
  });
});
