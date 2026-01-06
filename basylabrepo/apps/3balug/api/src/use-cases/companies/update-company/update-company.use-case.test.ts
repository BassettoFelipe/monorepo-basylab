import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError } from "@/errors";
import type { ICompanyRepository } from "@/repositories/contracts/company.repository";
import { USER_ROLES } from "@/types/roles";
import { UpdateCompanyUseCase } from "./update-company.use-case";

// Mock do CompanyCacheService
const mockCache = {
  invalidate: mock(() => Promise.resolve()),
};

mock.module("@/services/cache/company-cache.service", () => ({
  CompanyCacheService: class {
    invalidate = mockCache.invalidate;
  },
}));

describe("UpdateCompanyUseCase", () => {
  let useCase: UpdateCompanyUseCase;
  let mockCompanyRepository: ICompanyRepository;
  let mockOwner: User;

  beforeEach(() => {
    mockCompanyRepository = {
      update: mock((id: string, data: any) =>
        Promise.resolve({
          id,
          name: data.name || "Updated Company",
          email: "company@example.com",
          cnpj: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    } as any;

    mockOwner = {
      id: "user-123",
      companyId: "company-123",
      name: "Owner User",
      email: "owner@test.com",
      role: USER_ROLES.OWNER,
    } as User;

    useCase = new UpdateCompanyUseCase(mockCompanyRepository);

    // Reset cache mocks
    (mockCache.invalidate as any).mockClear();
  });

  describe("Casos de Sucesso", () => {
    test("deve atualizar empresa com sucesso", async () => {
      const result = await useCase.execute({
        updatedBy: mockOwner,
        name: "Nova Empresa Ltda",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("company-123");
      expect(result.name).toBe("Nova Empresa Ltda");
      expect(result.email).toBe("company@example.com");
      expect(mockCompanyRepository.update).toHaveBeenCalledWith("company-123", {
        name: "Nova Empresa Ltda",
      });
    });

    test("deve invalidar cache após atualização", async () => {
      await useCase.execute({
        updatedBy: mockOwner,
        name: "Empresa Atualizada",
      });

      expect(mockCache.invalidate).toHaveBeenCalledWith("company-123");
    });

    test("deve atualizar apenas nome quando fornecido", async () => {
      await useCase.execute({
        updatedBy: mockOwner,
        name: "Novo Nome",
      });

      expect(mockCompanyRepository.update).toHaveBeenCalledWith("company-123", {
        name: "Novo Nome",
      });
    });

    test("deve permitir atualização sem fornecer name", async () => {
      await useCase.execute({
        updatedBy: mockOwner,
      });

      expect(mockCompanyRepository.update).toHaveBeenCalledWith("company-123", {
        name: undefined,
      });
    });
  });

  describe("Validações de Permissão", () => {
    test("deve rejeitar quando usuário não é OWNER", async () => {
      const adminUser = {
        ...mockOwner,
        role: USER_ROLES.ADMIN,
      };

      await expect(
        useCase.execute({
          updatedBy: adminUser,
          name: "Tentativa",
        }),
      ).rejects.toThrow("Apenas o proprietário pode atualizar a empresa");
    });

    test("deve lançar ForbiddenError quando usuário não é OWNER", async () => {
      const userRole = {
        ...mockOwner,
        role: USER_ROLES.BROKER,
      };

      await expect(
        useCase.execute({
          updatedBy: userRole,
          name: "Tentativa",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve permitir apenas OWNER fazer atualização", async () => {
      const result = await useCase.execute({
        updatedBy: mockOwner,
        name: "Atualização permitida",
      });

      expect(result.name).toBe("Atualização permitida");
    });
  });

  describe("Validações de Empresa", () => {
    test("deve rejeitar quando usuário não tem companyId", async () => {
      const userWithoutCompany = {
        ...mockOwner,
        companyId: null,
      } as User;

      await expect(
        useCase.execute({
          updatedBy: userWithoutCompany,
          name: "Tentativa",
        }),
      ).rejects.toThrow("Usuário sem empresa vinculada");
    });

    test("deve lançar InternalServerError quando usuário não tem companyId", async () => {
      const userWithoutCompany = {
        ...mockOwner,
        companyId: null,
      } as User;

      await expect(
        useCase.execute({
          updatedBy: userWithoutCompany,
          name: "Tentativa",
        }),
      ).rejects.toThrow(InternalServerError);
    });

    test("deve rejeitar quando update retorna null", async () => {
      (mockCompanyRepository.update as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          updatedBy: mockOwner,
          name: "Tentativa",
        }),
      ).rejects.toThrow("Erro ao atualizar empresa");
    });
  });

  describe("Integração com Serviços", () => {
    test("deve chamar serviços na ordem correta", async () => {
      const callOrder: string[] = [];

      (mockCompanyRepository.update as any).mockImplementation(async () => {
        callOrder.push("repository.update");
        return {
          id: "company-123",
          name: "Updated",
          email: "email@test.com",
          cnpj: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      (mockCache.invalidate as any).mockImplementation(async () => {
        callOrder.push("cache.invalidate");
      });

      await useCase.execute({
        updatedBy: mockOwner,
        name: "Test",
      });

      expect(callOrder).toEqual(["repository.update", "cache.invalidate"]);
    });

    test("deve chamar update apenas uma vez", async () => {
      await useCase.execute({
        updatedBy: mockOwner,
        name: "Test",
      });

      expect(mockCompanyRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("Casos Edge", () => {
    test("deve propagar erro do repositório", async () => {
      (mockCompanyRepository.update as any).mockRejectedValueOnce(new Error("Database error"));

      await expect(
        useCase.execute({
          updatedBy: mockOwner,
          name: "Test",
        }),
      ).rejects.toThrow("Database error");
    });

    test("deve propagar erro do cache", async () => {
      (mockCache.invalidate as any).mockRejectedValueOnce(new Error("Cache error"));

      await expect(
        useCase.execute({
          updatedBy: mockOwner,
          name: "Test",
        }),
      ).rejects.toThrow("Cache error");
    });

    test("deve lidar com nome vazio", async () => {
      await useCase.execute({
        updatedBy: mockOwner,
        name: "",
      });

      expect(mockCompanyRepository.update).toHaveBeenCalledWith("company-123", {
        name: "",
      });
    });

    test("deve lidar com nome com caracteres especiais", async () => {
      const specialName = "Empresa & Cia Ltda - ME";

      await useCase.execute({
        updatedBy: mockOwner,
        name: specialName,
      });

      expect(mockCompanyRepository.update).toHaveBeenCalledWith("company-123", {
        name: specialName,
      });
    });
  });
});
