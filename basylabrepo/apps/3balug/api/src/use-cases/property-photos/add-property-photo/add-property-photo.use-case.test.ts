import { beforeEach, describe, expect, mock, test } from "bun:test";
import { BadRequestError, ForbiddenError, NotFoundError } from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyPhotoRepository } from "@/repositories/contracts/property-photo.repository";
import { USER_ROLES } from "@/types/roles";
import { AddPropertyPhotoUseCase } from "./add-property-photo.use-case";

describe("AddPropertyPhotoUseCase", () => {
  let useCase: AddPropertyPhotoUseCase;
  let mockPropertyPhotoRepository: IPropertyPhotoRepository;
  let mockPropertyRepository: IPropertyRepository;
  let mockUser: User;

  beforeEach(() => {
    mockPropertyPhotoRepository = {
      create: mock((data: any) =>
        Promise.resolve({
          id: "photo-123",
          ...data,
          createdAt: new Date(),
        }),
      ),
      createAsPrimary: mock((data: any) =>
        Promise.resolve({
          id: "photo-123",
          ...data,
          createdAt: new Date(),
        }),
      ),
      countByPropertyId: mock(() => Promise.resolve(0)),
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

    useCase = new AddPropertyPhotoUseCase(mockPropertyPhotoRepository, mockPropertyRepository);
  });

  describe("Casos de Sucesso", () => {
    test("deve adicionar foto com sucesso", async () => {
      const result = await useCase.execute({
        propertyId: "property-123",
        filename: "photo.jpg",
        originalName: "house.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "https://storage.com/photo.jpg",
        user: mockUser,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("photo-123");
      expect(mockPropertyPhotoRepository.create).toHaveBeenCalled();
    });

    test("deve marcar primeira foto como primary automaticamente", async () => {
      (mockPropertyPhotoRepository.countByPropertyId as any).mockResolvedValueOnce(0);

      await useCase.execute({
        propertyId: "property-123",
        filename: "photo.jpg",
        originalName: "house.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        url: "https://storage.com/photo.jpg",
        user: mockUser,
      });

      const call = (mockPropertyPhotoRepository.create as any).mock.calls[0][0];
      expect(call.isPrimary).toBe(true);
    });
  });

  describe("Validações", () => {
    test("deve rejeitar quando usuário não tem permissão", async () => {
      const userWithoutPermission = {
        ...mockUser,
        role: USER_ROLES.BROKER,
      };

      await expect(
        useCase.execute({
          propertyId: "property-123",
          filename: "photo.jpg",
          originalName: "house.jpg",
          mimeType: "image/jpeg",
          size: 1024,
          url: "https://storage.com/photo.jpg",
          user: userWithoutPermission,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    test("deve rejeitar tipo de arquivo não permitido", async () => {
      await expect(
        useCase.execute({
          propertyId: "property-123",
          filename: "doc.pdf",
          originalName: "document.pdf",
          mimeType: "application/pdf",
          size: 1024,
          url: "https://storage.com/doc.pdf",
          user: mockUser,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve rejeitar arquivo muito grande", async () => {
      const largeSize = 11 * 1024 * 1024; // 11MB

      await expect(
        useCase.execute({
          propertyId: "property-123",
          filename: "photo.jpg",
          originalName: "large.jpg",
          mimeType: "image/jpeg",
          size: largeSize,
          url: "https://storage.com/photo.jpg",
          user: mockUser,
        }),
      ).rejects.toThrow("Arquivo muito grande");
    });

    test("deve rejeitar quando propriedade não existe", async () => {
      (mockPropertyRepository.findById as any).mockResolvedValueOnce(null);

      await expect(
        useCase.execute({
          propertyId: "invalid-id",
          filename: "photo.jpg",
          originalName: "house.jpg",
          mimeType: "image/jpeg",
          size: 1024,
          url: "https://storage.com/photo.jpg",
          user: mockUser,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    test("deve rejeitar quando atingir limite de fotos", async () => {
      (mockPropertyPhotoRepository.countByPropertyId as any).mockResolvedValueOnce(20);

      await expect(
        useCase.execute({
          propertyId: "property-123",
          filename: "photo.jpg",
          originalName: "house.jpg",
          mimeType: "image/jpeg",
          size: 1024,
          url: "https://storage.com/photo.jpg",
          user: mockUser,
        }),
      ).rejects.toThrow("Limite de 20 fotos por imovel atingido");
    });
  });
});
