import { beforeEach, describe, expect, mock, test } from "bun:test";
import { BadRequestError } from "@/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { ImageProcessorService } from "@/services/image";
import type { IStorageService } from "@/services/storage";
import { UploadAvatarUseCase } from "./upload-avatar.use-case";

// Mock do getImageProcessor
const mockImageProcessor: ImageProcessorService = {
  validateImage: mock(() => Promise.resolve({ valid: true })),
  processAvatar: mock(() =>
    Promise.resolve({
      buffer: Buffer.from("processed-image"),
      contentType: "image/webp",
      originalSize: 1024 * 100, // 100KB
      processedSize: 1024 * 50, // 50KB
      compressionRatio: 50,
    }),
  ),
} as any;

// Mock da função getImageProcessor
mock.module("@/services/image", () => ({
  getImageProcessor: () => mockImageProcessor,
}));

describe("UploadAvatarUseCase", () => {
  let useCase: UploadAvatarUseCase;
  let mockUserRepository: IUserRepository;
  let mockStorageService: IStorageService;

  beforeEach(() => {
    mockUserRepository = {
      findById: mock((id: string) =>
        Promise.resolve({
          id,
          name: "Test User",
          email: "test@example.com",
          avatarUrl: null,
        }),
      ),
      update: mock(() => Promise.resolve()),
    } as any;

    mockStorageService = {
      upload: mock((file: Buffer, key: string, contentType: string) =>
        Promise.resolve({
          url: `https://storage.example.com/${key}`,
          key,
          size: file.length,
          contentType,
        }),
      ),
      delete: mock(() => Promise.resolve()),
    } as any;

    useCase = new UploadAvatarUseCase(mockUserRepository, mockStorageService);

    // Reset mocks do imageProcessor
    (mockImageProcessor.validateImage as any).mockClear();
    (mockImageProcessor.processAvatar as any).mockClear();
  });

  describe("Casos de Sucesso", () => {
    test("deve fazer upload de avatar JPEG com sucesso", async () => {
      const file = Buffer.from("fake-jpeg-content");
      const result = await useCase.execute({
        userId: "user-123",
        file,
        contentType: "image/jpeg",
      });

      expect(result).toBeDefined();
      expect(result.avatarUrl).toContain("https://storage.example.com/avatars/user-123/");
      expect(result.avatarUrl).toContain(".webp");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
      expect(mockImageProcessor.validateImage).toHaveBeenCalledWith(file);
      expect(mockImageProcessor.processAvatar).toHaveBeenCalled();
      expect(mockStorageService.upload).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.update).toHaveBeenCalledWith("user-123", {
        avatarUrl: expect.stringContaining("avatars/user-123/"),
      });
    });

    test("deve fazer upload de avatar PNG com sucesso", async () => {
      const file = Buffer.from("fake-png-content");
      const result = await useCase.execute({
        userId: "user-456",
        file,
        contentType: "image/png",
      });

      expect(result.avatarUrl).toContain("avatars/user-456/");
      expect(result.avatarUrl).toContain(".webp");
    });

    test("deve fazer upload de avatar WebP com sucesso", async () => {
      const file = Buffer.from("fake-webp-content");
      const result = await useCase.execute({
        userId: "user-789",
        file,
        contentType: "image/webp",
      });

      expect(result.avatarUrl).toContain("avatars/user-789/");
      expect(result.avatarUrl).toContain(".webp");
    });

    test("deve remover avatar antigo antes de fazer upload do novo", async () => {
      // Configurar usuário com avatar existente
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        avatarUrl: "https://storage.example.com/bucket/avatars/user-123/old-avatar.webp",
      });

      const file = Buffer.from("fake-image");
      await useCase.execute({
        userId: "user-123",
        file,
        contentType: "image/jpeg",
      });

      expect(mockStorageService.delete).toHaveBeenCalledWith("avatars/user-123/old-avatar.webp");
      expect(mockStorageService.upload).toHaveBeenCalledTimes(1);
    });

    test("deve processar e comprimir imagem antes do upload", async () => {
      const file = Buffer.from("fake-large-image");
      await useCase.execute({
        userId: "user-123",
        file,
        contentType: "image/jpeg",
      });

      expect(mockImageProcessor.processAvatar).toHaveBeenCalledWith(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 80,
        format: "webp",
      });

      // Verificar que o upload foi feito com a imagem processada
      const uploadCall = (mockStorageService.upload as any).mock.calls[0];
      expect(uploadCall[0]).toEqual(Buffer.from("processed-image"));
      expect(uploadCall[2]).toBe("image/webp");
    });
  });

  describe("Validações de Tipo de Arquivo", () => {
    test("deve rejeitar tipo de arquivo não permitido", async () => {
      const file = Buffer.from("fake-pdf");

      await expect(
        useCase.execute({
          userId: "user-123",
          file,
          contentType: "application/pdf",
        }),
      ).rejects.toThrow("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.");

      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });

    test("deve rejeitar tipo de arquivo SVG", async () => {
      const file = Buffer.from("fake-svg");

      await expect(
        useCase.execute({
          userId: "user-123",
          file,
          contentType: "image/svg+xml",
        }),
      ).rejects.toThrow(BadRequestError);
    });

    test("deve rejeitar tipo de arquivo GIF", async () => {
      const file = Buffer.from("fake-gif");

      await expect(
        useCase.execute({
          userId: "user-123",
          file,
          contentType: "image/gif",
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("Validações de Tamanho", () => {
    test("deve rejeitar arquivo maior que 10MB", async () => {
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB

      await expect(
        useCase.execute({
          userId: "user-123",
          file: largeFile,
          contentType: "image/jpeg",
        }),
      ).rejects.toThrow("Arquivo muito grande. O tamanho máximo é 10MB.");

      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });

    test("deve aceitar arquivo de exatamente 10MB", async () => {
      const file = Buffer.alloc(10 * 1024 * 1024); // Exatamente 10MB

      const result = await useCase.execute({
        userId: "user-123",
        file,
        contentType: "image/jpeg",
      });

      expect(result).toBeDefined();
      expect(mockStorageService.upload).toHaveBeenCalled();
    });

    test("deve aceitar arquivo pequeno (1MB)", async () => {
      const file = Buffer.alloc(1 * 1024 * 1024); // 1MB

      const result = await useCase.execute({
        userId: "user-123",
        file,
        contentType: "image/png",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Validações de Usuário", () => {
    test("deve rejeitar quando usuário não existe", async () => {
      (mockUserRepository.findById as any).mockResolvedValueOnce(null);

      const file = Buffer.from("fake-image");

      await expect(
        useCase.execute({
          userId: "user-999",
          file,
          contentType: "image/jpeg",
        }),
      ).rejects.toThrow("Usuário não encontrado.");

      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });
  });

  describe("Validações de Imagem", () => {
    test("deve rejeitar imagem inválida", async () => {
      (mockImageProcessor.validateImage as any).mockResolvedValueOnce({
        valid: false,
        error: "Imagem corrompida",
      });

      const file = Buffer.from("corrupted-image");

      await expect(
        useCase.execute({
          userId: "user-123",
          file,
          contentType: "image/jpeg",
        }),
      ).rejects.toThrow("Imagem corrompida");

      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });

    test("deve rejeitar imagem inválida sem mensagem de erro específica", async () => {
      (mockImageProcessor.validateImage as any).mockResolvedValueOnce({
        valid: false,
      });

      const file = Buffer.from("invalid-image");

      await expect(
        useCase.execute({
          userId: "user-123",
          file,
          contentType: "image/jpeg",
        }),
      ).rejects.toThrow("Imagem inválida");
    });
  });

  describe("Tratamento de Erros", () => {
    test("deve continuar upload mesmo se falhar ao deletar avatar antigo", async () => {
      // Configurar usuário com avatar existente
      (mockUserRepository.findById as any).mockResolvedValueOnce({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        avatarUrl: "https://storage.example.com/bucket/avatars/user-123/old.webp",
      });

      // Fazer delete falhar
      (mockStorageService.delete as any).mockRejectedValueOnce(new Error("Delete failed"));

      const file = Buffer.from("fake-image");
      const result = await useCase.execute({
        userId: "user-123",
        file,
        contentType: "image/jpeg",
      });

      // Upload deve ter sido realizado mesmo assim
      expect(result).toBeDefined();
      expect(mockStorageService.upload).toHaveBeenCalled();
    });
  });

  describe("Integração com Serviços", () => {
    test("deve chamar todos os serviços na ordem correta", async () => {
      const file = Buffer.from("fake-image");
      const callOrder: string[] = [];

      (mockUserRepository.findById as any).mockImplementation(async () => {
        callOrder.push("findById");
        return { id: "user-123", email: "test@example.com", avatarUrl: null };
      });

      (mockImageProcessor.validateImage as any).mockImplementation(async () => {
        callOrder.push("validateImage");
        return { valid: true };
      });

      (mockImageProcessor.processAvatar as any).mockImplementation(async () => {
        callOrder.push("processAvatar");
        return {
          buffer: Buffer.from("processed"),
          contentType: "image/webp",
          originalSize: 100,
          processedSize: 50,
          compressionRatio: 50,
        };
      });

      (mockStorageService.upload as any).mockImplementation(async () => {
        callOrder.push("upload");
        return {
          url: "https://example.com/avatar.webp",
          key: "key",
          size: 50,
          contentType: "image/webp",
        };
      });

      (mockUserRepository.update as any).mockImplementation(async () => {
        callOrder.push("update");
      });

      await useCase.execute({
        userId: "user-123",
        file,
        contentType: "image/jpeg",
      });

      expect(callOrder).toEqual(["findById", "validateImage", "processAvatar", "upload", "update"]);
    });
  });
});
