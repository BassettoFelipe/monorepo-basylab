import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyPhotoRepository } from "@/repositories/contracts/property-photo.repository";
import type { IStorageService } from "@/services/storage";
import { USER_ROLES } from "@/types/roles";
import { RemovePropertyPhotoUseCase } from "./remove-property-photo.use-case";

describe("RemovePropertyPhotoUseCase", () => {
  let useCase: RemovePropertyPhotoUseCase;
  let mockPropertyPhotoRepository: IPropertyPhotoRepository;
  let mockPropertyRepository: IPropertyRepository;
  let mockStorageService: IStorageService;

  const mockUser: User = {
    id: "user-123",
    companyId: "company-123",
    role: USER_ROLES.OWNER,
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockPhoto = {
    id: "photo-123",
    propertyId: "property-123",
    filename: "test-photo.jpg",
    url: "https://s3.amazonaws.com/bucket/test-photo.jpg",
    isPrimary: false,
    order: 1,
  };

  const mockProperty = {
    id: "property-123",
    companyId: "company-123",
    brokerId: "user-123",
    title: "Test Property",
  };

  beforeEach(() => {
    mockPropertyPhotoRepository = {
      findById: mock(() => Promise.resolve(mockPhoto)),
      delete: mock(() => Promise.resolve()),
      findByPropertyId: mock(() => Promise.resolve([])),
      setPrimary: mock(() => Promise.resolve()),
    } as any;

    mockPropertyRepository = {
      findById: mock(() => Promise.resolve(mockProperty)),
    } as any;

    mockStorageService = {
      delete: mock(() => Promise.resolve()),
    } as any;

    useCase = new RemovePropertyPhotoUseCase(
      mockPropertyPhotoRepository,
      mockPropertyRepository,
      mockStorageService,
    );
  });

  describe("Validações de Permissões", () => {
    test("deve permitir OWNER remover foto", async () => {
      const ownerUser = { ...mockUser, role: USER_ROLES.OWNER };

      const result = await useCase.execute({
        photoId: "photo-123",
        user: ownerUser,
      });

      expect(result.success).toBe(true);
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalledWith("photo-123");
    });

    test("deve permitir MANAGER remover foto", async () => {
      const managerUser = { ...mockUser, role: USER_ROLES.MANAGER };

      const result = await useCase.execute({
        photoId: "photo-123",
        user: managerUser,
      });

      expect(result.success).toBe(true);
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalledWith("photo-123");
    });

    test("deve permitir BROKER remover foto de imóvel que gerencia", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-123",
        role: USER_ROLES.BROKER,
      };
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        ...mockProperty,
        brokerId: "broker-123",
      });

      const result = await useCase.execute({
        photoId: "photo-123",
        user: brokerUser,
      });

      expect(result.success).toBe(true);
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalledWith("photo-123");
    });

    test("deve rejeitar quando usuário não tem papel permitido", async () => {
      const userUser = { ...mockUser, role: USER_ROLES.INSURANCE_ANALYST };

      await expect(useCase.execute({ photoId: "photo-123", user: userUser })).rejects.toThrow(
        ForbiddenError,
      );
    });

    test("deve rejeitar quando usuário não tem companyId", async () => {
      const userNoCompany = { ...mockUser, companyId: null };

      await expect(useCase.execute({ photoId: "photo-123", user: userNoCompany })).rejects.toThrow(
        InternalServerError,
      );
    });

    test("deve rejeitar quando BROKER não é responsável pelo imóvel", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-123",
        role: USER_ROLES.BROKER,
      };
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        ...mockProperty,
        brokerId: "other-broker",
      });

      await expect(useCase.execute({ photoId: "photo-123", user: brokerUser })).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe("Validações de Existência", () => {
    test("deve rejeitar quando foto não existe", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce(null);

      await expect(useCase.execute({ photoId: "invalid-id", user: mockUser })).rejects.toThrow(
        NotFoundError,
      );

      expect(mockPropertyPhotoRepository.delete).not.toHaveBeenCalled();
    });

    test("deve rejeitar quando imóvel não existe", async () => {
      (mockPropertyRepository.findById as any).mockResolvedValueOnce(null);

      await expect(useCase.execute({ photoId: "photo-123", user: mockUser })).rejects.toThrow(
        NotFoundError,
      );

      expect(mockPropertyPhotoRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("Isolamento de Empresa", () => {
    test("deve rejeitar quando imóvel não pertence à mesma empresa", async () => {
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        ...mockProperty,
        companyId: "other-company",
      });

      await expect(useCase.execute({ photoId: "photo-123", user: mockUser })).rejects.toThrow(
        ForbiddenError,
      );

      expect(mockPropertyPhotoRepository.delete).not.toHaveBeenCalled();
    });

    test("deve permitir quando imóvel pertence à mesma empresa", async () => {
      const result = await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(result.success).toBe(true);
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalled();
    });
  });

  describe("Remoção de Storage", () => {
    test("deve remover arquivo do storage antes de deletar registro", async () => {
      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockStorageService.delete).toHaveBeenCalledWith("test-photo.jpg");
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalledWith("photo-123");
    });

    test("deve continuar remoção mesmo se storage falhar", async () => {
      (mockStorageService.delete as any).mockRejectedValueOnce(new Error("Storage error"));

      const result = await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(result.success).toBe(true);
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalledWith("photo-123");
    });

    test("deve usar filename correto na remoção do storage", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        ...mockPhoto,
        filename: "custom-filename.png",
      });

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockStorageService.delete).toHaveBeenCalledWith("custom-filename.png");
    });
  });

  describe("Promoção de Foto Principal", () => {
    test("deve promover próxima foto quando remover foto principal", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        ...mockPhoto,
        isPrimary: true,
      });

      const remainingPhotos = [
        { id: "photo-123", isPrimary: true },
        { id: "photo-456", isPrimary: false },
        { id: "photo-789", isPrimary: false },
      ];
      (mockPropertyPhotoRepository.findByPropertyId as any).mockResolvedValueOnce(remainingPhotos);

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.setPrimary).toHaveBeenCalledWith(
        "photo-456",
        "property-123",
      );
    });

    test("não deve promover foto quando remover foto não-principal", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        ...mockPhoto,
        isPrimary: false,
      });

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.setPrimary).not.toHaveBeenCalled();
    });

    test("não deve promover quando não há outras fotos", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        ...mockPhoto,
        isPrimary: true,
      });
      (mockPropertyPhotoRepository.findByPropertyId as any).mockResolvedValueOnce([
        { id: "photo-123", isPrimary: true },
      ]);

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.setPrimary).not.toHaveBeenCalled();
    });

    test("deve filtrar corretamente a foto sendo removida antes de promover", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        ...mockPhoto,
        isPrimary: true,
      });
      (mockPropertyPhotoRepository.findByPropertyId as any).mockResolvedValueOnce([
        { id: "photo-123", isPrimary: true },
        { id: "photo-456", isPrimary: false },
      ]);

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.setPrimary).toHaveBeenCalledWith(
        "photo-456",
        "property-123",
      );
    });
  });

  describe("Tratamento de Erros", () => {
    test("deve lançar InternalServerError quando deleteById falhar", async () => {
      (mockPropertyPhotoRepository.delete as any).mockRejectedValueOnce(
        new Error("Database error"),
      );

      await expect(useCase.execute({ photoId: "photo-123", user: mockUser })).rejects.toThrow(
        InternalServerError,
      );
    });

    test("deve lançar InternalServerError quando setPrimary falhar", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        ...mockPhoto,
        isPrimary: true,
      });
      (mockPropertyPhotoRepository.findByPropertyId as any).mockResolvedValueOnce([
        { id: "photo-123", isPrimary: true },
        { id: "photo-456", isPrimary: false },
      ]);
      (mockPropertyPhotoRepository.setPrimary as any).mockRejectedValueOnce(
        new Error("Update error"),
      );

      await expect(useCase.execute({ photoId: "photo-123", user: mockUser })).rejects.toThrow(
        InternalServerError,
      );
    });

    test("deve preservar erro original quando for ForbiddenError", async () => {
      const userUser = { ...mockUser, role: USER_ROLES.INSURANCE_ANALYST };

      try {
        await useCase.execute({ photoId: "photo-123", user: userUser });
        expect(true).toBe(false); // Não deveria chegar aqui
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as Error).message).toContain("permissao");
      }
    });

    test("deve preservar erro original quando for NotFoundError", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce(null);

      try {
        await useCase.execute({ photoId: "invalid-id", user: mockUser });
        expect(true).toBe(false); // Não deveria chegar aqui
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as Error).message).toContain("nao encontrada");
      }
    });
  });

  describe("Casos de Sucesso Completos", () => {
    test("deve retornar mensagem de sucesso ao remover foto", async () => {
      const result = await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(result).toEqual({
        success: true,
        message: "Foto removida com sucesso.",
      });
    });

    test("deve executar fluxo completo: buscar foto -> buscar imóvel -> remover storage -> deletar registro", async () => {
      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.findById).toHaveBeenCalledWith("photo-123");
      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("property-123");
      expect(mockStorageService.delete).toHaveBeenCalledWith("test-photo.jpg");
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalledWith("photo-123");
    });

    test("deve executar fluxo completo com promoção quando foto é principal", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        ...mockPhoto,
        isPrimary: true,
      });
      (mockPropertyPhotoRepository.findByPropertyId as any).mockResolvedValueOnce([
        { id: "photo-123", isPrimary: true },
        { id: "photo-456", isPrimary: false },
      ]);

      const result = await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.findById).toHaveBeenCalledWith("photo-123");
      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("property-123");
      expect(mockStorageService.delete).toHaveBeenCalledWith("test-photo.jpg");
      expect(mockPropertyPhotoRepository.findByPropertyId).toHaveBeenCalledWith("property-123");
      expect(mockPropertyPhotoRepository.setPrimary).toHaveBeenCalledWith(
        "photo-456",
        "property-123",
      );
      expect(mockPropertyPhotoRepository.delete).toHaveBeenCalledWith("photo-123");
      expect(result.success).toBe(true);
    });
  });

  describe("Cenários de Integração", () => {
    test("OWNER pode remover qualquer foto de qualquer imóvel da empresa", async () => {
      const ownerUser = { ...mockUser, role: USER_ROLES.OWNER };
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        ...mockProperty,
        brokerId: "other-user", // Imóvel de outro usuário
      });

      const result = await useCase.execute({
        photoId: "photo-123",
        user: ownerUser,
      });

      expect(result.success).toBe(true);
    });

    test("MANAGER pode remover qualquer foto de qualquer imóvel da empresa", async () => {
      const managerUser = { ...mockUser, role: USER_ROLES.MANAGER };
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        ...mockProperty,
        brokerId: "other-user", // Imóvel de outro usuário
      });

      const result = await useCase.execute({
        photoId: "photo-123",
        user: managerUser,
      });

      expect(result.success).toBe(true);
    });

    test("BROKER só pode remover fotos de imóveis que gerencia", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-123",
        role: USER_ROLES.BROKER,
      };
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        ...mockProperty,
        brokerId: "other-broker",
      });

      await expect(useCase.execute({ photoId: "photo-123", user: brokerUser })).rejects.toThrow(
        ForbiddenError,
      );
    });

    test("deve respeitar isolamento de empresa mesmo para OWNER", async () => {
      const ownerUser = { ...mockUser, role: USER_ROLES.OWNER };
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        ...mockProperty,
        companyId: "other-company",
      });

      await expect(useCase.execute({ photoId: "photo-123", user: ownerUser })).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
