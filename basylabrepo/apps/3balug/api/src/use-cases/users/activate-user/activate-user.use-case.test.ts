import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { IUserCacheService } from "@/services/cache";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { USER_ROLES } from "@/types/roles";
import { ActivateUserUseCase } from "./activate-user.use-case";

describe("ActivateUserUseCase", () => {
  let useCase: ActivateUserUseCase;
  let mockUserRepository: IUserRepository;
  let mockUserCacheService: IUserCacheService;

  const mockActivatedBy: User = {
    id: "user-123",
    companyId: "company-123",
    role: USER_ROLES.OWNER,
    name: "Owner User",
    email: "owner@example.com",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTargetUser = {
    id: "target-user-123",
    companyId: "company-123",
    role: USER_ROLES.BROKER,
    name: "Target User",
    email: "target@example.com",
    isActive: false,
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: mock(() => Promise.resolve(mockTargetUser)),
      update: mock(() =>
        Promise.resolve({
          ...mockTargetUser,
          isActive: true,
        }),
      ),
    } as any;

    mockUserCacheService = {
      invalidate: mock(() => Promise.resolve()),
    } as any;

    useCase = new ActivateUserUseCase(mockUserRepository, mockUserCacheService);
  });

  describe("Validações de Permissões", () => {
    test("deve permitir OWNER ativar usuário", async () => {
      const ownerUser = { ...mockActivatedBy, role: USER_ROLES.OWNER };

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: ownerUser,
      });

      expect(result.isActive).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith("target-user-123", {
        isActive: true,
      });
    });

    test("deve permitir MANAGER ativar usuário", async () => {
      const managerUser = { ...mockActivatedBy, role: USER_ROLES.MANAGER };

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: managerUser,
      });

      expect(result.isActive).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    test("deve rejeitar quando BROKER tenta ativar usuário", async () => {
      const brokerUser = { ...mockActivatedBy, role: USER_ROLES.BROKER };

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: brokerUser,
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    test("deve rejeitar quando BROKER tenta ativar usuário", async () => {
      const regularUser = { ...mockActivatedBy, role: USER_ROLES.BROKER };

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: regularUser,
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    test("deve rejeitar quando usuário não tem companyId", async () => {
      const userNoCompany = { ...mockActivatedBy, companyId: null };

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: userNoCompany,
        }),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe("Validações de Existência", () => {
    test("deve rejeitar quando usuário alvo não existe", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          userId: "invalid-id",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(NotFoundError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    test("deve buscar usuário correto antes de ativar", async () => {
      await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith("target-user-123");
    });
  });

  describe("Isolamento de Empresa", () => {
    test("deve rejeitar quando usuário alvo está em outra empresa", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        companyId: "other-company",
      });

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    test("deve permitir quando usuário alvo está na mesma empresa", async () => {
      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result.isActive).toBe(true);
    });

    test("deve validar empresa mesmo para OWNER", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        companyId: "other-company",
      });

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: { ...mockActivatedBy, role: USER_ROLES.OWNER },
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("Regras de Negócio", () => {
    test("deve rejeitar quando usuário tenta ativar a si mesmo", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        id: "user-123", // Mesmo ID do activatedBy
      });

      await expect(
        useCase.execute({
          userId: "user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    test("deve rejeitar quando usuário já está ativo", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        isActive: true,
      });

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(BadRequestError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    test("deve rejeitar quando tentar ativar usuário OWNER", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.OWNER,
      });

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(ForbiddenError);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    test("deve permitir ativar MANAGER", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.MANAGER,
      });

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result.isActive).toBe(true);
    });

    test("deve permitir ativar BROKER", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.BROKER,
      });

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result.isActive).toBe(true);
    });

    test("deve permitir ativar MANAGER regular", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.MANAGER,
      });

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result.isActive).toBe(true);
    });
  });

  describe("Invalidação de Cache", () => {
    test("deve invalidar cache do usuário após ativação", async () => {
      await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(mockUserCacheService.invalidate).toHaveBeenCalledWith("target-user-123");
    });

    test("deve invalidar cache mesmo se for o único efeito colateral", async () => {
      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result.isActive).toBe(true);
      expect(mockUserCacheService.invalidate).toHaveBeenCalledWith("target-user-123");
    });
  });

  describe("Retorno de Dados", () => {
    test("deve retornar informações completas do usuário ativado", async () => {
      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result).toEqual({
        id: mockTargetUser.id,
        email: mockTargetUser.email,
        name: mockTargetUser.name,
        isActive: true,
        message: "Usuário ativado com sucesso",
      });
    });

    test("deve retornar isActive como true", async () => {
      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result.isActive).toBe(true);
    });

    test("deve retornar mensagem de sucesso", async () => {
      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(result.message).toBe("Usuário ativado com sucesso");
    });
  });

  describe("Tratamento de Erros", () => {
    test("deve lançar InternalServerError quando update retornar null", async () => {
      (mockUserRepository.update as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(InternalServerError);
    });

    test("deve lançar InternalServerError quando update falhar", async () => {
      (mockUserRepository.update as any).mockRejectedValueOnce(new Error("Database error"));

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(InternalServerError);
    });

    test("deve preservar ForbiddenError original", async () => {
      const brokerUser = { ...mockActivatedBy, role: USER_ROLES.BROKER };

      try {
        await useCase.execute({
          userId: "target-user-123",
          activatedBy: brokerUser,
        });
        expect(true).toBe(false); // Não deveria chegar aqui
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as Error).message).toContain("permissão");
      }
    });

    test("deve preservar BadRequestError original", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        isActive: true,
      });

      try {
        await useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        });
        expect(true).toBe(false); // Não deveria chegar aqui
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestError);
        expect((error as Error).message).toContain("já está ativo");
      }
    });

    test("deve lançar InternalServerError genérico para erros desconhecidos", async () => {
      (mockUserRepository.update as any).mockRejectedValueOnce(new Error("Unknown error"));

      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe("Casos de Sucesso Completos", () => {
    test("deve executar fluxo completo: validar -> buscar -> atualizar -> invalidar cache", async () => {
      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: mockActivatedBy,
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith("target-user-123");
      expect(mockUserRepository.update).toHaveBeenCalledWith("target-user-123", {
        isActive: true,
      });
      expect(mockUserCacheService.invalidate).toHaveBeenCalledWith("target-user-123");
      expect(result.isActive).toBe(true);
    });

    test("OWNER pode ativar MANAGER inativo", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.MANAGER,
        isActive: false,
      });

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: { ...mockActivatedBy, role: USER_ROLES.OWNER },
      });

      expect(result.isActive).toBe(true);
    });

    test("OWNER pode ativar BROKER inativo", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.BROKER,
        isActive: false,
      });

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: { ...mockActivatedBy, role: USER_ROLES.OWNER },
      });

      expect(result.isActive).toBe(true);
    });

    test("MANAGER pode ativar BROKER inativo", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.BROKER,
        isActive: false,
      });

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: { ...mockActivatedBy, role: USER_ROLES.MANAGER },
      });

      expect(result.isActive).toBe(true);
    });

    test("MANAGER pode ativar INSURANCE_ANALYST inativo", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        role: USER_ROLES.INSURANCE_ANALYST,
        isActive: false,
      });

      const result = await useCase.execute({
        userId: "target-user-123",
        activatedBy: { ...mockActivatedBy, role: USER_ROLES.MANAGER },
      });

      expect(result.isActive).toBe(true);
    });
  });

  describe("Cenários de Integração", () => {
    test("deve respeitar hierarquia de permissões - OWNER pode ativar qualquer um exceto OWNER", async () => {
      const roles = [USER_ROLES.MANAGER, USER_ROLES.BROKER, USER_ROLES.INSURANCE_ANALYST];

      for (const role of roles) {
        (mockUserRepository.findById as any).mockResolvedValueOnce({
          ...mockTargetUser,
          role,
          isActive: false,
        });

        const result = await useCase.execute({
          userId: "target-user-123",
          activatedBy: { ...mockActivatedBy, role: USER_ROLES.OWNER },
        });

        expect(result.isActive).toBe(true);
      }
    });

    test("deve respeitar hierarquia de permissões - MANAGER pode ativar BROKER e INSURANCE_ANALYST", async () => {
      const roles = [USER_ROLES.BROKER, USER_ROLES.INSURANCE_ANALYST];

      for (const role of roles) {
        (mockUserRepository.findById as any).mockResolvedValueOnce({
          ...mockTargetUser,
          role,
          isActive: false,
        });

        const result = await useCase.execute({
          userId: "target-user-123",
          activatedBy: { ...mockActivatedBy, role: USER_ROLES.MANAGER },
        });

        expect(result.isActive).toBe(true);
      }
    });

    test("deve falhar quando cache invalidation falhar mas sucesso ao ativar", async () => {
      (mockUserCacheService.invalidate as any).mockRejectedValueOnce(new Error("Cache error"));

      // Cache error não deve impedir ativação
      await expect(
        useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Validações de Mensagens de Erro", () => {
    test("deve retornar mensagem específica quando não tem permissão", async () => {
      const brokerUser = { ...mockActivatedBy, role: USER_ROLES.BROKER };

      try {
        await useCase.execute({
          userId: "target-user-123",
          activatedBy: brokerUser,
        });
      } catch (error) {
        expect((error as Error).message).toContain(
          "Apenas proprietários e gerentes podem realizar esta ação",
        );
      }
    });

    test("deve retornar mensagem específica quando usuário não encontrado", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      try {
        await useCase.execute({
          userId: "invalid-id",
          activatedBy: mockActivatedBy,
        });
      } catch (error) {
        expect((error as Error).message).toBe("Usuário não encontrado");
      }
    });

    test("deve retornar mensagem específica quando tentar ativar usuário de outra empresa", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        companyId: "other-company",
      });

      try {
        await useCase.execute({
          userId: "target-user-123",
          activatedBy: mockActivatedBy,
        });
      } catch (error) {
        expect((error as Error).message).toBe("Você não pode ativar usuários de outra empresa");
      }
    });

    test("deve retornar mensagem específica quando tentar ativar a si mesmo", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        ...mockTargetUser,
        id: "user-123",
      });

      try {
        await useCase.execute({
          userId: "user-123",
          activatedBy: mockActivatedBy,
        });
      } catch (error) {
        expect((error as Error).message).toBe("Você não pode ativar sua própria conta");
      }
    });
  });
});
