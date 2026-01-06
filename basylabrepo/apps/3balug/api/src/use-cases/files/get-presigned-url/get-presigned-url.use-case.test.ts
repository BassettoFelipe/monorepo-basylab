import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { IStorageService } from "@/services/storage";
import { GetPresignedUrlUseCase } from "./get-presigned-url.use-case";

describe("GetPresignedUrlUseCase", () => {
  let useCase: GetPresignedUrlUseCase;
  let mockStorageService: IStorageService;

  beforeEach(() => {
    const futureDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos no futuro

    mockStorageService = {
      upload: mock(() =>
        Promise.resolve({ url: "", key: "", bucket: "", size: 0, contentType: "" }),
      ),
      delete: mock(() => Promise.resolve()),
      getPresignedUrl: mock(() => Promise.resolve("https://storage.example.com/presigned")),
      getPresignedUploadUrl: mock((key: string) =>
        Promise.resolve({
          url: `https://storage.example.com/upload?key=${key}`,
          key,
          expiresAt: futureDate,
        }),
      ),
      getPublicUrl: mock((key: string) => `https://storage.example.com/public/${key}`),
    } as any;

    useCase = new GetPresignedUrlUseCase(mockStorageService);
  });

  describe("Casos de Sucesso", () => {
    test("deve gerar URL pré-assinada para upload de PDF", async () => {
      const result = await useCase.execute({
        fileName: "documento.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result).toBeDefined();
      expect(result.uploadUrl).toContain("https://storage.example.com/upload");
      expect(result.key).toContain("files/user-123/");
      expect(result.key).toContain("documento.pdf");
      expect(result.publicUrl).toContain("https://storage.example.com/public/");
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(mockStorageService.getPresignedUploadUrl).toHaveBeenCalledTimes(1);
    });

    test("deve gerar URL pré-assinada para upload de imagem", async () => {
      const result = await useCase.execute({
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        userId: "user-456",
      });

      expect(result.key).toContain("files/user-456/");
      expect(result.key).toContain("foto.jpg");
      expect(result.uploadUrl).toContain("files/user-456/");
    });

    test("deve organizar arquivo em pasta com fieldId quando fornecido", async () => {
      const result = await useCase.execute({
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
        fieldId: "field-abc",
      });

      expect(result.key).toContain("files/user-123/field-abc/");
      expect(result.publicUrl).toContain("files/user-123/field-abc/");
    });

    test("deve sanitizar nome de arquivo com caracteres especiais", async () => {
      const result = await useCase.execute({
        fileName: "Arquivo com Espaços!.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.key).toContain("Arquivo_com_Espacos_");
      expect(result.publicUrl).toContain("Arquivo_com_Espacos_");
    });

    test("deve remover acentos do nome do arquivo", async () => {
      const result = await useCase.execute({
        fileName: "relatório-são.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.key).toContain("relatorio-sao.pdf");
    });

    test("deve adicionar extensão baseada no contentType quando arquivo não tem extensão", async () => {
      const result = await useCase.execute({
        fileName: "arquivo_sem_extensao",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.key).toContain(".pdf");
    });

    test("deve gerar diferentes tipos de URLs presigned para diferentes formatos", async () => {
      const resultPdf = await useCase.execute({
        fileName: "doc.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });
      expect(resultPdf.uploadUrl).toBeDefined();

      const resultPng = await useCase.execute({
        fileName: "img.png",
        contentType: "image/png",
        userId: "user-123",
      });
      expect(resultPng.uploadUrl).toBeDefined();

      const resultDocx = await useCase.execute({
        fileName: "doc.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        userId: "user-123",
      });
      expect(resultDocx.uploadUrl).toBeDefined();
    });
  });

  describe("Validações de Tipo de Arquivo", () => {
    test("deve rejeitar arquivo com tipo não permitido (match exato)", async () => {
      await expect(
        useCase.execute({
          fileName: "arquivo.pdf",
          contentType: "application/pdf",
          userId: "user-123",
          allowedTypes: ["image/jpeg", "image/png"],
        }),
      ).rejects.toThrow("Tipo de arquivo não permitido. Tipos aceitos: image/jpeg, image/png");
    });

    test("deve aceitar arquivo com tipo permitido (match exato)", async () => {
      const result = await useCase.execute({
        fileName: "imagem.jpg",
        contentType: "image/jpeg",
        userId: "user-123",
        allowedTypes: ["image/jpeg", "image/png"],
      });

      expect(result).toBeDefined();
      expect(result.key).toContain("imagem.jpg");
    });

    test("deve aceitar arquivo com wildcard de tipo (image/*)", async () => {
      const resultJpeg = await useCase.execute({
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        userId: "user-123",
        allowedTypes: ["image/*"],
      });
      expect(resultJpeg.key).toContain("foto.jpg");

      const resultPng = await useCase.execute({
        fileName: "foto.png",
        contentType: "image/png",
        userId: "user-123",
        allowedTypes: ["image/*"],
      });
      expect(resultPng.key).toContain("foto.png");

      const resultWebp = await useCase.execute({
        fileName: "foto.webp",
        contentType: "image/webp",
        userId: "user-123",
        allowedTypes: ["image/*"],
      });
      expect(resultWebp.key).toContain("foto.webp");
    });

    test("deve rejeitar arquivo não-imagem com wildcard image/*", async () => {
      await expect(
        useCase.execute({
          fileName: "documento.pdf",
          contentType: "application/pdf",
          userId: "user-123",
          allowedTypes: ["image/*"],
        }),
      ).rejects.toThrow("Tipo de arquivo não permitido");
    });

    test("deve aceitar arquivo por extensão (.pdf)", async () => {
      const result = await useCase.execute({
        fileName: "documento.pdf",
        contentType: "application/pdf",
        userId: "user-123",
        allowedTypes: [".pdf"],
      });

      expect(result).toBeDefined();
      expect(result.key).toContain(".pdf");
    });

    test("deve aceitar arquivo por múltiplas extensões (.doc,.docx)", async () => {
      const resultDocx = await useCase.execute({
        fileName: "documento.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        userId: "user-123",
        allowedTypes: [".doc,.docx"],
      });
      expect(resultDocx).toBeDefined();

      const resultDoc = await useCase.execute({
        fileName: "documento.doc",
        contentType: "application/msword",
        userId: "user-123",
        allowedTypes: [".doc,.docx"],
      });
      expect(resultDoc).toBeDefined();
    });

    test("deve aceitar arquivo quando allowedTypes está vazio", async () => {
      const result = await useCase.execute({
        fileName: "qualquer-arquivo.xyz",
        contentType: "application/octet-stream",
        userId: "user-123",
        allowedTypes: [],
      });

      expect(result).toBeDefined();
    });

    test("deve aceitar arquivo quando allowedTypes não é fornecido", async () => {
      const result = await useCase.execute({
        fileName: "qualquer-arquivo.xyz",
        contentType: "application/octet-stream",
        userId: "user-123",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Geração de Chave Única", () => {
    test("deve gerar chaves únicas para múltiplas requisições do mesmo arquivo", async () => {
      const result1 = await useCase.execute({
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      const result2 = await useCase.execute({
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result1.key).not.toBe(result2.key);
      expect(result1.uploadUrl).not.toBe(result2.uploadUrl);
    });

    test("deve incluir userId na chave do arquivo", async () => {
      const result = await useCase.execute({
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-999",
      });

      expect(result.key).toContain("files/user-999/");
      expect(result.publicUrl).toContain("files/user-999/");
    });

    test("deve limitar tamanho do nome do arquivo a 50 caracteres", async () => {
      const longName = "a".repeat(100); // 100 caracteres

      const result = await useCase.execute({
        fileName: `${longName}.pdf`,
        contentType: "application/pdf",
        userId: "user-123",
      });

      // Extrair o nome do arquivo da chave
      const keyParts = result.key.split("/");
      const fileNameFromKey = keyParts[keyParts.length - 1];
      const nameWithoutUUID = fileNameFromKey.split("_").slice(1).join("_"); // Remove UUID
      const nameWithoutExtension = nameWithoutUUID.replace(".pdf", "");

      expect(nameWithoutExtension.length).toBeLessThanOrEqual(50);
    });
  });

  describe("Integração com StorageService", () => {
    test("deve chamar getPresignedUploadUrl com parâmetros corretos", async () => {
      await useCase.execute({
        fileName: "documento.pdf",
        contentType: "application/pdf",
        userId: "user-123",
        fieldId: "field-456",
      });

      expect(mockStorageService.getPresignedUploadUrl).toHaveBeenCalledTimes(1);
      const call = (mockStorageService.getPresignedUploadUrl as any).mock.calls[0];
      expect(call[0]).toContain("files/user-123/field-456/"); // Key
      expect(call[1]).toBe("application/pdf"); // ContentType
      expect(call[2]).toBe(300); // 5 minutos em segundos
    });

    test("deve chamar getPublicUrl para gerar URL pública", async () => {
      const result = await useCase.execute({
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(mockStorageService.getPublicUrl).toHaveBeenCalledTimes(1);
      expect(result.publicUrl).toContain("https://storage.example.com/public/");
    });

    test("deve retornar todos os campos necessários no output", async () => {
      const result = await useCase.execute({
        fileName: "test.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.uploadUrl).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.publicUrl).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(typeof result.uploadUrl).toBe("string");
      expect(typeof result.key).toBe("string");
      expect(typeof result.publicUrl).toBe("string");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });
});
