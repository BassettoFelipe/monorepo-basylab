import { beforeEach, describe, expect, it, mock } from "bun:test";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { User } from "@/types/user";
import { DeleteUserUseCase } from "./delete-user.use-case";

describe("DeleteUserUseCase", () => {
  let userRepository: IUserRepository;
  let deleteUserUseCase: DeleteUserUseCase;

  const ownerUser: User = {
    id: "owner-123",
    name: "Owner User",
    email: "owner@company.com",
    password: "$2b$10$hashedPassword",
    isEmailVerified: true,
    companyId: "company-123",
    role: "owner",
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const memberUser: User = {
    id: "member-123",
    name: "Member User",
    email: "member@company.com",
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userRepository = {
      findById: mock(() => Promise.resolve({ ...memberUser })),
      delete: mock(() => Promise.resolve(true)),
    } as unknown as IUserRepository;

    deleteUserUseCase = new DeleteUserUseCase(userRepository);
  });

  describe("Fluxo de sucesso", () => {
    it("deve deletar usuário permanentemente quando owner executa", async () => {
      const result = await deleteUserUseCase.execute({
        userId: "member-123",
        deletedBy: ownerUser,
      });

      expect(result).toEqual({
        id: "member-123",
        email: "member@company.com",
        name: "Member User",
        message: "Usuário deletado permanentemente com sucesso",
      });

      expect(userRepository.findById).toHaveBeenCalledWith("member-123");
      expect(userRepository.delete).toHaveBeenCalledWith("member-123");
    });

    it("deve deletar usuário admin quando owner executa", async () => {
      const adminUser = { ...memberUser, role: "admin" as const };
      userRepository.findById = mock(() => Promise.resolve(adminUser));

      const result = await deleteUserUseCase.execute({
        userId: "member-123",
        deletedBy: ownerUser,
      });

      expect(result.message).toBe("Usuário deletado permanentemente com sucesso");
    });
  });

  describe("Validações de permissão", () => {
    it("deve lançar erro se usuário não é owner", async () => {
      const adminUser = { ...ownerUser, role: "admin" as const };

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: adminUser,
        }),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: adminUser,
        }),
      ).rejects.toThrow(
        "Você não tem permissão para deletar usuários. Apenas o proprietário pode realizar esta ação.",
      );
    });

    it("deve lançar erro se member tenta deletar", async () => {
      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: memberUser,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("deve lançar erro se owner não tem companyId", async () => {
      const ownerWithoutCompany = { ...ownerUser, companyId: null };

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerWithoutCompany,
        }),
      ).rejects.toThrow(InternalServerError);

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerWithoutCompany,
        }),
      ).rejects.toThrow("Usuário owner sem empresa vinculada");
    });
  });

  describe("Validações de usuário", () => {
    it("deve lançar erro se usuário não existe", async () => {
      userRepository.findById = mock(() => Promise.resolve(null));

      await expect(
        deleteUserUseCase.execute({
          userId: "non-existent",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(NotFoundError);

      await expect(
        deleteUserUseCase.execute({
          userId: "non-existent",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow("Usuário não encontrado");
    });

    it("deve lançar erro se usuário pertence a outra empresa", async () => {
      const userFromOtherCompany = {
        ...memberUser,
        companyId: "other-company",
      };
      userRepository.findById = mock(() => Promise.resolve(userFromOtherCompany));

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow("Você não pode deletar usuários de outra empresa");
    });

    it("deve lançar erro ao tentar deletar o owner", async () => {
      const anotherOwner = { ...ownerUser, id: "another-owner" };
      userRepository.findById = mock(() => Promise.resolve(ownerUser));

      await expect(
        deleteUserUseCase.execute({
          userId: "owner-123",
          deletedBy: anotherOwner,
        }),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        deleteUserUseCase.execute({
          userId: "owner-123",
          deletedBy: anotherOwner,
        }),
      ).rejects.toThrow("Não é possível deletar o dono da conta");
    });

    it("deve lançar erro ao tentar deletar a si mesmo", async () => {
      // Usar admin para evitar a validação de "não deletar owner"
      const adminUser = {
        ...ownerUser,
        id: "admin-123",
        role: "admin" as const,
      };
      userRepository.findById = mock(() => Promise.resolve(adminUser));

      // Owner tentando deletar admin que na verdade é ele mesmo (mesmo ID)
      const ownerTryingDeleteSelf = { ...ownerUser, id: "admin-123" };

      await expect(
        deleteUserUseCase.execute({
          userId: "admin-123",
          deletedBy: ownerTryingDeleteSelf,
        }),
      ).rejects.toThrow(BadRequestError);

      await expect(
        deleteUserUseCase.execute({
          userId: "admin-123",
          deletedBy: ownerTryingDeleteSelf,
        }),
      ).rejects.toThrow("Você não pode deletar a si mesmo");
    });
  });

  describe("Erros de deleção", () => {
    it("deve lançar erro se deleção falhar no repositório", async () => {
      userRepository.delete = mock(() => Promise.resolve(false));

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(InternalServerError);

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow("Erro ao deletar usuário");
    });

    it("deve lançar erro se repositório lançar exceção", async () => {
      userRepository.delete = mock(() => Promise.reject(new Error("Database error")));

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(InternalServerError);

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow("Erro ao deletar usuário. Tente novamente.");
    });

    it("deve preservar erros de validação mesmo em caso de exceção", async () => {
      userRepository.delete = mock(() => Promise.reject(new ForbiddenError("Custom error")));

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        deleteUserUseCase.execute({
          userId: "member-123",
          deletedBy: ownerUser,
        }),
      ).rejects.toThrow("Custom error");
    });
  });
});
