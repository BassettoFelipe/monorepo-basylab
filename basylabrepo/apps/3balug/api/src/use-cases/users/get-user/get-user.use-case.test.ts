import { beforeEach, describe, expect, it } from "bun:test";
import type { User } from "@/types/user";
import { GetUserUseCase } from "./get-user.use-case";

describe("GetUserUseCase", () => {
  let getUserUseCase: GetUserUseCase;

  const mockUser: User = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    password: "$2b$10$hashedPassword",
    isEmailVerified: true,
    companyId: "company-123",
    role: "member",
    isActive: true,
    phone: null,
    avatarUrl: null,
    createdBy: null,
    verificationSecret: null,
    verificationExpiresAt: null,
    verificationAttempts: 0,
    verificationLastAttemptAt: null,
    passwordResetSecret: null,
    passwordResetExpiresAt: null,
    passwordResetAttempts: 0,
    passwordResetLastAttemptAt: null,
    passwordResetResendCount: 0,
    passwordResetCooldownEndsAt: null,
    passwordResetResendBlocked: false,
    passwordResetResendBlockedUntil: null,
    verificationResendCount: 0,
    verificationLastResendAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
  };

  beforeEach(() => {
    getUserUseCase = new GetUserUseCase();
  });

  describe("Fluxo de sucesso", () => {
    it("deve retornar dados públicos do usuário", async () => {
      const result = await getUserUseCase.execute({ requestedBy: mockUser });

      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        createdAt: mockUser.createdAt,
      });
    });

    it("não deve retornar campos sensíveis", async () => {
      const result = await getUserUseCase.execute({ requestedBy: mockUser });

      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("passwordResetSecret");
      expect(result).not.toHaveProperty("emailVerificationSecret");
      expect(result).not.toHaveProperty("companyId");
      expect(result).not.toHaveProperty("role");
    });

    it("deve retornar apenas campos públicos", async () => {
      const result = await getUserUseCase.execute({ requestedBy: mockUser });

      const keys = Object.keys(result);
      expect(keys).toEqual(["id", "email", "name", "createdAt"]);
    });
  });

  describe("Diferentes tipos de usuário", () => {
    it("deve retornar dados de usuário owner", async () => {
      const ownerUser = { ...mockUser, role: "owner" as const };

      const result = await getUserUseCase.execute({ requestedBy: ownerUser });

      expect(result.id).toBe("user-123");
      expect(result).not.toHaveProperty("role");
    });

    it("deve retornar dados de usuário admin", async () => {
      const adminUser = { ...mockUser, role: "admin" as const };

      const result = await getUserUseCase.execute({ requestedBy: adminUser });

      expect(result.id).toBe("user-123");
      expect(result).not.toHaveProperty("role");
    });

    it("deve retornar dados de usuário inativo", async () => {
      const inactiveUser = { ...mockUser, isActive: false };

      const result = await getUserUseCase.execute({
        requestedBy: inactiveUser,
      });

      expect(result.id).toBe("user-123");
      expect(result).not.toHaveProperty("isActive");
    });
  });

  describe("Diferentes usuários", () => {
    it("deve retornar dados do usuário com ID diferente", async () => {
      const otherUser = { ...mockUser, id: "other-user-id" };

      const result = await getUserUseCase.execute({ requestedBy: otherUser });

      expect(result.id).toBe("other-user-id");
    });
  });
});
