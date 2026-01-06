import { beforeEach, describe, expect, mock, test } from "bun:test";
import { InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { ICompanyRepository } from "@/repositories/contracts/company.repository";
import type { ICompanyCacheService } from "@/services/cache";
import { GetCompanyUseCase } from "./get-company.use-case";

describe("GetCompanyUseCase", () => {
  let useCase: GetCompanyUseCase;
  let mockCompanyRepository: ICompanyRepository;
  let mockCache: ICompanyCacheService;
  let mockUser: User;

  beforeEach(() => {
    mockCompanyRepository = {
      findById: mock((id: string) =>
        Promise.resolve({
          id,
          name: "Empresa Teste",
          email: "contato@empresa.com",
          cnpj: "12.345.678/0001-90",
          phone: "(11) 1234-5678",
          address: "Rua Teste, 123",
          city: "São Paulo",
          state: "SP",
          zipCode: "12345-678",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    } as any;

    mockCache = {
      get: mock(() => Promise.resolve(null)),
      set: mock(() => Promise.resolve()),
      invalidate: mock(() => Promise.resolve()),
    };

    mockUser = {
      id: "user-123",
      companyId: "company-123",
      name: "Test User",
      email: "user@test.com",
    } as User;

    useCase = new GetCompanyUseCase(mockCompanyRepository, mockCache);
  });

  describe("Casos de Sucesso", () => {
    test("deve retornar empresa do usuário", async () => {
      const result = await useCase.execute({
        requestedBy: mockUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("company-123");
      expect(result.name).toBe("Empresa Teste");
      expect(result.email).toBe("contato@empresa.com");
      expect(result.cnpj).toBe("12.345.678/0001-90");
      expect(result.phone).toBe("(11) 1234-5678");
      expect(result.address).toBe("Rua Teste, 123");
      expect(result.city).toBe("São Paulo");
      expect(result.state).toBe("SP");
      expect(result.zipCode).toBe("12345-678");
      expect(mockCompanyRepository.findById).toHaveBeenCalledWith("company-123");
    });

    test("deve retornar apenas campos permitidos no output", async () => {
      const result = await useCase.execute({
        requestedBy: mockUser,
      });

      // Verificar que não retorna campos internos como createdAt, updatedAt
      expect(result).not.toHaveProperty("createdAt");
      expect(result).not.toHaveProperty("updatedAt");
    });

    test("deve retornar empresa com campos nulos", async () => {
      (mockCompanyRepository.findById as any).mockResolvedValueOnce({
        id: "company-456",
        name: "Empresa Simples",
        email: null,
        cnpj: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({
        requestedBy: {
          ...mockUser,
          companyId: "company-456",
        },
      });

      expect(result.name).toBe("Empresa Simples");
      expect(result.email).toBeNull();
      expect(result.cnpj).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.address).toBeNull();
      expect(result.city).toBeNull();
      expect(result.state).toBeNull();
      expect(result.zipCode).toBeNull();
    });
  });

  describe("Cache", () => {
    test("deve buscar empresa do cache se disponível", async () => {
      const cachedCompany = {
        id: "company-123",
        name: "Empresa em Cache",
        email: "cache@empresa.com",
        cnpj: "99.999.999/0001-99",
        phone: "(11) 9999-9999",
        address: "Rua Cache",
        city: "Cacheland",
        state: "CA",
        zipCode: "99999-999",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockCache.get as any).mockResolvedValueOnce(cachedCompany);

      const result = await useCase.execute({
        requestedBy: mockUser,
      });

      expect(result.name).toBe("Empresa em Cache");
      expect(mockCache.get).toHaveBeenCalledWith("company-123");
      expect(mockCompanyRepository.findById).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    test("deve buscar do banco e cachear se não estiver em cache", async () => {
      (mockCache.get as any).mockResolvedValueOnce(null);

      const result = await useCase.execute({
        requestedBy: mockUser,
      });

      expect(mockCache.get).toHaveBeenCalledWith("company-123");
      expect(mockCompanyRepository.findById).toHaveBeenCalledWith("company-123");
      expect(mockCache.set).toHaveBeenCalledWith(
        "company-123",
        expect.objectContaining({
          id: "company-123",
          name: "Empresa Teste",
        }),
      );
      expect(result.name).toBe("Empresa Teste");
    });

    test("deve usar chave de cache correta para diferentes empresas", async () => {
      const user1 = { ...mockUser, companyId: "company-111" };
      const user2 = { ...mockUser, companyId: "company-222" };

      await useCase.execute({ requestedBy: user1 });
      await useCase.execute({ requestedBy: user2 });

      expect(mockCache.get).toHaveBeenCalledWith("company-111");
      expect(mockCache.get).toHaveBeenCalledWith("company-222");
    });
  });

  describe("Validações", () => {
    test("deve rejeitar quando usuário não tem companyId", async () => {
      const userWithoutCompany = {
        ...mockUser,
        companyId: null,
      } as User;

      await expect(
        useCase.execute({
          requestedBy: userWithoutCompany,
        }),
      ).rejects.toThrow("Usuário sem empresa vinculada");
    });

    test("deve lançar InternalServerError quando usuário não tem companyId", async () => {
      const userWithoutCompany = {
        ...mockUser,
        companyId: null,
      } as User;

      await expect(
        useCase.execute({
          requestedBy: userWithoutCompany,
        }),
      ).rejects.toThrow(InternalServerError);
    });

    test("deve rejeitar quando empresa não existe", async () => {
      (mockCompanyRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          requestedBy: mockUser,
        }),
      ).rejects.toThrow("Empresa não encontrada");
    });

    test("deve lançar NotFoundError quando empresa não existe", async () => {
      (mockCompanyRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          requestedBy: mockUser,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    test("deve rejeitar quando companyId é string vazia", async () => {
      const userWithEmptyCompany = {
        ...mockUser,
        companyId: "",
      } as User;

      await expect(
        useCase.execute({
          requestedBy: userWithEmptyCompany,
        }),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe("Integração com Serviços", () => {
    test("deve chamar serviços na ordem correta quando não há cache", async () => {
      const callOrder: string[] = [];

      (mockCache.get as any).mockImplementation(async () => {
        callOrder.push("cache.get");
        return null;
      });

      (mockCompanyRepository.findById as any).mockImplementation(async () => {
        callOrder.push("repository.findById");
        return {
          id: "company-123",
          name: "Empresa",
          email: null,
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

      (mockCache.set as any).mockImplementation(async () => {
        callOrder.push("cache.set");
      });

      await useCase.execute({
        requestedBy: mockUser,
      });

      expect(callOrder).toEqual(["cache.get", "repository.findById", "cache.set"]);
    });

    test("deve chamar apenas cache quando dados estão cacheados", async () => {
      (mockCache.get as any).mockResolvedValueOnce({
        id: "company-123",
        name: "Cached",
        email: null,
        cnpj: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await useCase.execute({
        requestedBy: mockUser,
      });

      expect(mockCache.get).toHaveBeenCalledTimes(1);
      expect(mockCompanyRepository.findById).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe("Casos Edge", () => {
    test("deve propagar erro do repositório", async () => {
      (mockCompanyRepository.findById as any).mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      await expect(
        useCase.execute({
          requestedBy: mockUser,
        }),
      ).rejects.toThrow("Database connection failed");
    });

    test("deve propagar erro do cache.get", async () => {
      (mockCache.get as any).mockRejectedValueOnce(new Error("Cache connection failed"));

      await expect(
        useCase.execute({
          requestedBy: mockUser,
        }),
      ).rejects.toThrow("Cache connection failed");
    });

    test("deve lidar com diferentes tipos de companyId", async () => {
      const userWithDifferentId = {
        ...mockUser,
        companyId: "abc-123-xyz-789",
      };

      await useCase.execute({
        requestedBy: userWithDifferentId,
      });

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith("abc-123-xyz-789");
    });
  });
});
