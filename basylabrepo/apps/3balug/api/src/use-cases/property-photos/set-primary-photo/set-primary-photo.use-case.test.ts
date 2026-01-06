import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyPhotoRepository } from "@/repositories/contracts/property-photo.repository";
import { USER_ROLES } from "@/types/roles";
import { SetPrimaryPhotoUseCase } from "./set-primary-photo.use-case";

describe("SetPrimaryPhotoUseCase", () => {
  let useCase: SetPrimaryPhotoUseCase;
  let mockPropertyPhotoRepository: IPropertyPhotoRepository;
  let mockPropertyRepository: IPropertyRepository;
  let mockUser: User;

  beforeEach(() => {
    mockPropertyPhotoRepository = {
      findById: mock(() =>
        Promise.resolve({
          id: "photo-123",
          propertyId: "property-123",
          isPrimary: false,
        }),
      ),
      setPrimary: mock(() => Promise.resolve()),
    } as any;

    mockPropertyRepository = {
      findById: mock(() =>
        Promise.resolve({
          id: "property-123",
          companyId: "company-123",
          brokerId: null,
        }),
      ),
    } as any;

    mockUser = {
      id: "user-123",
      companyId: "company-123",
      role: USER_ROLES.OWNER,
    } as User;

    useCase = new SetPrimaryPhotoUseCase(mockPropertyPhotoRepository, mockPropertyRepository);
  });

  describe("Casos de Sucesso", () => {
    test("deve definir foto como principal com sucesso", async () => {
      const result = await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Foto definida como principal com sucesso.");
      expect(mockPropertyPhotoRepository.setPrimary).toHaveBeenCalledWith(
        "photo-123",
        "property-123",
      );
    });

    test("deve retornar mensagem quando foto já é principal", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        id: "photo-123",
        propertyId: "property-123",
        isPrimary: true,
      });

      const result = await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Esta foto ja e a foto principal.");
      expect(mockPropertyPhotoRepository.setPrimary).not.toHaveBeenCalled();
    });

    test("deve permitir OWNER definir foto principal", async () => {
      const ownerUser = { ...mockUser, role: USER_ROLES.OWNER };

      const result = await useCase.execute({
        photoId: "photo-123",
        user: ownerUser,
      });

      expect(result.success).toBe(true);
    });

    test("deve permitir MANAGER definir foto principal", async () => {
      const managerUser = { ...mockUser, role: USER_ROLES.MANAGER };

      const result = await useCase.execute({
        photoId: "photo-123",
        user: managerUser,
      });

      expect(result.success).toBe(true);
    });

    test("deve permitir BROKER definir foto principal de imóvel que gerencia", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-123",
        role: USER_ROLES.BROKER,
      };

      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        id: "property-123",
        companyId: "company-123",
        brokerId: "broker-123",
      });

      const result = await useCase.execute({
        photoId: "photo-123",
        user: brokerUser,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Validações de Permissão", () => {
    test("deve rejeitar quando usuário não tem permissão", async () => {
      const userWithoutPermission = {
        ...mockUser,
        role: USER_ROLES.INSURANCE_ANALYST,
      };

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: userWithoutPermission,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve rejeitar quando usuário não tem companyId", async () => {
      const userWithoutCompany = {
        ...mockUser,
        companyId: null,
      } as User;

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: userWithoutCompany,
        }),
      ).rejects.toThrow(InternalServerError);
    });

    test("deve rejeitar quando usuário não tem companyId com mensagem adequada", async () => {
      const userWithoutCompany = {
        ...mockUser,
        companyId: null,
      } as User;

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: userWithoutCompany,
        }),
      ).rejects.toThrow("Usuario sem empresa vinculada.");
    });
  });

  describe("Validações de Foto", () => {
    test("deve rejeitar quando foto não existe", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          photoId: "invalid-id",
          user: mockUser,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    test("deve rejeitar quando foto não existe com mensagem adequada", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          photoId: "invalid-id",
          user: mockUser,
        }),
      ).rejects.toThrow("Foto nao encontrada.");
    });

    test("deve buscar foto pelo ID correto", async () => {
      await useCase.execute({
        photoId: "photo-999",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.findById).toHaveBeenCalledWith("photo-999");
    });
  });

  describe("Validações de Propriedade", () => {
    test("deve rejeitar quando propriedade não existe", async () => {
      (mockPropertyRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: mockUser,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    test("deve rejeitar quando propriedade não existe com mensagem adequada", async () => {
      (mockPropertyRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: mockUser,
        }),
      ).rejects.toThrow("Imovel nao encontrado.");
    });

    test("deve rejeitar quando propriedade pertence a outra empresa", async () => {
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        id: "property-123",
        companyId: "other-company",
        brokerId: null,
      });

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: mockUser,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve rejeitar quando propriedade pertence a outra empresa com mensagem adequada", async () => {
      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        id: "property-123",
        companyId: "other-company",
        brokerId: null,
      });

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: mockUser,
        }),
      ).rejects.toThrow("Imovel nao pertence a sua empresa.");
    });

    test("deve buscar propriedade pelo ID da foto", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        id: "photo-123",
        propertyId: "property-999",
        isPrimary: false,
      });

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyRepository.findById).toHaveBeenCalledWith("property-999");
    });
  });

  describe("Validações de Broker", () => {
    test("deve rejeitar quando broker não é responsável pelo imóvel", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-123",
        role: USER_ROLES.BROKER,
      };

      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        id: "property-123",
        companyId: "company-123",
        brokerId: "other-broker",
      });

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: brokerUser,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve rejeitar quando broker não é responsável com mensagem adequada", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-123",
        role: USER_ROLES.BROKER,
      };

      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        id: "property-123",
        companyId: "company-123",
        brokerId: "other-broker",
      });

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: brokerUser,
        }),
      ).rejects.toThrow("Voce so pode alterar fotos de imoveis que voce gerencia.");
    });

    test("deve permitir quando broker é o responsável pelo imóvel", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-123",
        role: USER_ROLES.BROKER,
      };

      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        id: "property-123",
        companyId: "company-123",
        brokerId: "broker-123",
      });

      const result = await useCase.execute({
        photoId: "photo-123",
        user: brokerUser,
      });

      expect(result.success).toBe(true);
    });

    test("deve permitir quando broker é responsável e imóvel está na mesma empresa", async () => {
      const brokerUser = {
        ...mockUser,
        id: "broker-456",
        companyId: "company-456",
        role: USER_ROLES.BROKER,
      };

      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        id: "photo-123",
        propertyId: "property-456",
        isPrimary: false,
      });

      (mockPropertyRepository.findById as any).mockResolvedValueOnce({
        id: "property-456",
        companyId: "company-456",
        brokerId: "broker-456",
      });

      const result = await useCase.execute({
        photoId: "photo-123",
        user: brokerUser,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Integração com Repository", () => {
    test("deve chamar setPrimary com parâmetros corretos", async () => {
      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.setPrimary).toHaveBeenCalledWith(
        "photo-123",
        "property-123",
      );
    });

    test("deve chamar setPrimary apenas uma vez", async () => {
      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.setPrimary).toHaveBeenCalledTimes(1);
    });

    test("deve propagar erro do setPrimary", async () => {
      (mockPropertyPhotoRepository.setPrimary as any).mockRejectedValueOnce(
        new Error("Database error"),
      );

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: mockUser,
        }),
      ).rejects.toThrow(InternalServerError);
    });

    test("deve lançar InternalServerError quando setPrimary falha", async () => {
      (mockPropertyPhotoRepository.setPrimary as any).mockRejectedValueOnce(
        new Error("Database error"),
      );

      await expect(
        useCase.execute({
          photoId: "photo-123",
          user: mockUser,
        }),
      ).rejects.toThrow("Erro ao definir foto principal. Tente novamente.");
    });

    test("deve chamar serviços na ordem correta", async () => {
      const callOrder: string[] = [];

      (mockPropertyPhotoRepository.findById as any).mockImplementation(async () => {
        callOrder.push("findPhoto");
        return {
          id: "photo-123",
          propertyId: "property-123",
          isPrimary: false,
        };
      });

      (mockPropertyRepository.findById as any).mockImplementation(async () => {
        callOrder.push("findProperty");
        return { id: "property-123", companyId: "company-123", brokerId: null };
      });

      (mockPropertyPhotoRepository.setPrimary as any).mockImplementation(async () => {
        callOrder.push("setPrimary");
      });

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(callOrder).toEqual(["findPhoto", "findProperty", "setPrimary"]);
    });
  });

  describe("Casos Edge", () => {
    test("deve lidar com foto já principal e não chamar setPrimary", async () => {
      (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
        id: "photo-123",
        propertyId: "property-123",
        isPrimary: true,
      });

      await useCase.execute({
        photoId: "photo-123",
        user: mockUser,
      });

      expect(mockPropertyPhotoRepository.setPrimary).not.toHaveBeenCalled();
      expect(mockPropertyRepository.findById).not.toHaveBeenCalled();
    });

    test("deve lidar com diferentes IDs de foto", async () => {
      const photoIds = ["photo-1", "photo-abc-123", "uuid-photo", "12345"];

      for (const photoId of photoIds) {
        (mockPropertyPhotoRepository.findById as any).mockResolvedValueOnce({
          id: photoId,
          propertyId: "property-123",
          isPrimary: false,
        });

        await useCase.execute({
          photoId,
          user: mockUser,
        });

        expect(mockPropertyPhotoRepository.setPrimary).toHaveBeenCalledWith(
          photoId,
          "property-123",
        );
      }
    });

    test("deve verificar empresa corretamente", async () => {
      const companies = ["company-1", "company-2", "abc-123-xyz"];

      for (const companyId of companies) {
        const user = { ...mockUser, companyId };

        (mockPropertyRepository.findById as any).mockResolvedValueOnce({
          id: "property-123",
          companyId,
          brokerId: null,
        });

        const result = await useCase.execute({
          photoId: "photo-123",
          user,
        });

        expect(result.success).toBe(true);
      }
    });
  });
});
