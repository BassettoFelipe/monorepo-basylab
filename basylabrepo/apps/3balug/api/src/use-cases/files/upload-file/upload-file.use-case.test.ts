import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { IStorageService } from "@/services/storage";
import { UploadFileUseCase } from "./upload-file.use-case";

describe("UploadFileUseCase", () => {
  let useCase: UploadFileUseCase;
  let mockStorageService: IStorageService;

  beforeEach(() => {
    mockStorageService = {
      upload: mock((file: Buffer, key: string, contentType: string) =>
        Promise.resolve({
          url: `https://storage.example.com/${key}`,
          key,
          size: file.length,
          contentType,
          bucket: "test-bucket",
        }),
      ),
      delete: mock(() => Promise.resolve()),
      getPublicUrl: mock(() => "https://storage.example.com/public/file"),
      exists: mock(() => Promise.resolve(true)),
      getPresignedUploadUrl: mock(() =>
        Promise.resolve({
          url: "https://storage.example.com/presigned/upload",
          key: "file",
          expiresAt: new Date(),
        }),
      ),
      getPresignedDownloadUrl: mock(() =>
        Promise.resolve({
          url: "https://storage.example.com/presigned/download",
          key: "file",
          expiresAt: new Date(),
        }),
      ),
    };

    useCase = new UploadFileUseCase(mockStorageService);
  });

  describe("Casos de Sucesso", () => {
    test("deve fazer upload de arquivo PDF com sucesso", async () => {
      const file = Buffer.from("fake-pdf-content");
      const result = await useCase.execute({
        file,
        fileName: "documento.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result).toBeDefined();
      expect(result.url).toContain("https://storage.example.com/files/user-123/");
      expect(result.url).toContain("documento.pdf");
      expect(result.key).toContain("files/user-123/");
      expect(result.size).toBe(file.length);
      expect(result.contentType).toBe("application/pdf");
      expect(result.fileName).toContain("documento.pdf");
      expect(mockStorageService.upload).toHaveBeenCalledTimes(1);
    });

    test("deve fazer upload de imagem com sucesso", async () => {
      const file = Buffer.from("fake-image-content");
      const result = await useCase.execute({
        file,
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        userId: "user-456",
      });

      expect(result.url).toContain("files/user-456/");
      expect(result.fileName).toContain("foto.jpg");
      expect(result.contentType).toBe("image/jpeg");
    });

    test("deve organizar arquivo em pasta com fieldId quando fornecido", async () => {
      const file = Buffer.from("fake-content");
      const result = await useCase.execute({
        file,
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
        fieldId: "field-abc",
      });

      expect(result.key).toContain("files/user-123/field-abc/");
      expect(result.url).toContain("files/user-123/field-abc/");
    });

    test("deve sanitizar nome de arquivo com caracteres especiais", async () => {
      const file = Buffer.from("fake-content");
      const result = await useCase.execute({
        file,
        fileName: "Meu Arquivo Com Espaços & Especiais!.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.fileName).toBe("Meu_Arquivo_Com_Espacos_Especiais_.pdf");
      expect(result.key).toContain("Meu_Arquivo_Com_Espacos_Especiais_");
    });

    test("deve remover acentos do nome do arquivo", async () => {
      const file = Buffer.from("fake-content");
      const result = await useCase.execute({
        file,
        fileName: "relatório-ção-são.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.fileName).toBe("relatorio-cao-sao.pdf");
    });

    test("deve adicionar extensão baseada no contentType quando arquivo não tem extensão", async () => {
      const file = Buffer.from("fake-content");
      const result = await useCase.execute({
        file,
        fileName: "arquivo_sem_extensao",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.fileName).toContain(".pdf");
    });

    test("deve fazer upload de diferentes tipos de imagem", async () => {
      const file = Buffer.from("fake-image");

      const resultPng = await useCase.execute({
        file,
        fileName: "imagem.png",
        contentType: "image/png",
        userId: "user-123",
      });
      expect(resultPng.contentType).toBe("image/png");

      const resultWebp = await useCase.execute({
        file,
        fileName: "imagem.webp",
        contentType: "image/webp",
        userId: "user-123",
      });
      expect(resultWebp.contentType).toBe("image/webp");

      const resultGif = await useCase.execute({
        file,
        fileName: "imagem.gif",
        contentType: "image/gif",
        userId: "user-123",
      });
      expect(resultGif.contentType).toBe("image/gif");
    });

    test("deve fazer upload de documentos Office", async () => {
      const file = Buffer.from("fake-doc");

      const resultDocx = await useCase.execute({
        file,
        fileName: "documento.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        userId: "user-123",
      });
      expect(resultDocx.fileName).toContain(".docx");

      const resultXlsx = await useCase.execute({
        file,
        fileName: "planilha.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        userId: "user-123",
      });
      expect(resultXlsx.fileName).toContain(".xlsx");
    });
  });

  describe("Validações de Tamanho", () => {
    test("deve rejeitar arquivo que excede tamanho máximo padrão (5MB)", async () => {
      // 6MB de arquivo
      const largeFile = Buffer.alloc(6 * 1024 * 1024);

      await expect(
        useCase.execute({
          file: largeFile,
          fileName: "arquivo-grande.pdf",
          contentType: "application/pdf",
          userId: "user-123",
        }),
      ).rejects.toThrow("O arquivo excede o tamanho máximo permitido de 5MB");
    });

    test("deve aceitar arquivo que não excede tamanho máximo padrão", async () => {
      // 4MB de arquivo
      const file = Buffer.alloc(4 * 1024 * 1024);

      const result = await useCase.execute({
        file,
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result).toBeDefined();
      expect(result.size).toBe(4 * 1024 * 1024);
    });

    test("deve respeitar maxFileSize customizado", async () => {
      // 8MB de arquivo
      const largeFile = Buffer.alloc(8 * 1024 * 1024);

      // Deve rejeitar com maxFileSize de 5MB
      await expect(
        useCase.execute({
          file: largeFile,
          fileName: "arquivo.pdf",
          contentType: "application/pdf",
          userId: "user-123",
          maxFileSize: 5,
        }),
      ).rejects.toThrow("O arquivo excede o tamanho máximo permitido de 5MB");

      // Deve aceitar com maxFileSize de 10MB
      const result = await useCase.execute({
        file: largeFile,
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
        maxFileSize: 10,
      });

      expect(result).toBeDefined();
    });
  });

  describe("Validações de Tipo de Arquivo", () => {
    test("deve rejeitar arquivo com tipo não permitido (match exato)", async () => {
      const file = Buffer.from("fake-content");

      await expect(
        useCase.execute({
          file,
          fileName: "arquivo.pdf",
          contentType: "application/pdf",
          userId: "user-123",
          allowedTypes: ["image/jpeg", "image/png"],
        }),
      ).rejects.toThrow("Tipo de arquivo não permitido. Tipos aceitos: image/jpeg, image/png");
    });

    test("deve aceitar arquivo com tipo permitido (match exato)", async () => {
      const file = Buffer.from("fake-image");

      const result = await useCase.execute({
        file,
        fileName: "imagem.jpg",
        contentType: "image/jpeg",
        userId: "user-123",
        allowedTypes: ["image/jpeg", "image/png"],
      });

      expect(result).toBeDefined();
      expect(result.contentType).toBe("image/jpeg");
    });

    test("deve aceitar arquivo com wildcard de tipo (image/*)", async () => {
      const file = Buffer.from("fake-image");

      const resultJpeg = await useCase.execute({
        file,
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        userId: "user-123",
        allowedTypes: ["image/*"],
      });
      expect(resultJpeg.contentType).toBe("image/jpeg");

      const resultPng = await useCase.execute({
        file,
        fileName: "foto.png",
        contentType: "image/png",
        userId: "user-123",
        allowedTypes: ["image/*"],
      });
      expect(resultPng.contentType).toBe("image/png");

      const resultWebp = await useCase.execute({
        file,
        fileName: "foto.webp",
        contentType: "image/webp",
        userId: "user-123",
        allowedTypes: ["image/*"],
      });
      expect(resultWebp.contentType).toBe("image/webp");
    });

    test("deve rejeitar arquivo não-imagem com wildcard image/*", async () => {
      const file = Buffer.from("fake-pdf");

      await expect(
        useCase.execute({
          file,
          fileName: "documento.pdf",
          contentType: "application/pdf",
          userId: "user-123",
          allowedTypes: ["image/*"],
        }),
      ).rejects.toThrow("Tipo de arquivo não permitido");
    });

    test("deve aceitar arquivo por extensão (.pdf)", async () => {
      const file = Buffer.from("fake-pdf");

      const result = await useCase.execute({
        file,
        fileName: "documento.pdf",
        contentType: "application/pdf",
        userId: "user-123",
        allowedTypes: [".pdf"],
      });

      expect(result).toBeDefined();
      expect(result.contentType).toBe("application/pdf");
    });

    test("deve aceitar arquivo por múltiplas extensões (.doc,.docx)", async () => {
      const file = Buffer.from("fake-doc");

      const resultDocx = await useCase.execute({
        file,
        fileName: "documento.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        userId: "user-123",
        allowedTypes: [".doc,.docx"],
      });
      expect(resultDocx).toBeDefined();

      const resultDoc = await useCase.execute({
        file,
        fileName: "documento.doc",
        contentType: "application/msword",
        userId: "user-123",
        allowedTypes: [".doc,.docx"],
      });
      expect(resultDoc).toBeDefined();
    });

    test("deve aceitar arquivo quando allowedTypes está vazio", async () => {
      const file = Buffer.from("fake-content");

      const result = await useCase.execute({
        file,
        fileName: "qualquer-arquivo.xyz",
        contentType: "application/octet-stream",
        userId: "user-123",
        allowedTypes: [],
      });

      expect(result).toBeDefined();
    });

    test("deve aceitar arquivo quando allowedTypes não é fornecido", async () => {
      const file = Buffer.from("fake-content");

      const result = await useCase.execute({
        file,
        fileName: "qualquer-arquivo.xyz",
        contentType: "application/octet-stream",
        userId: "user-123",
      });

      expect(result).toBeDefined();
    });
  });

  describe("Geração de Chave Única", () => {
    test("deve gerar chaves únicas para múltiplos uploads do mesmo arquivo", async () => {
      const file = Buffer.from("fake-content");

      const result1 = await useCase.execute({
        file,
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      const result2 = await useCase.execute({
        file,
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result1.key).not.toBe(result2.key);
      expect(result1.url).not.toBe(result2.url);
    });

    test("deve incluir userId na chave do arquivo", async () => {
      const file = Buffer.from("fake-content");

      const result = await useCase.execute({
        file,
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-999",
      });

      expect(result.key).toContain("files/user-999/");
    });

    test("deve limitar tamanho do nome do arquivo a 50 caracteres", async () => {
      const file = Buffer.from("fake-content");
      const longName = "a".repeat(100); // 100 caracteres

      const result = await useCase.execute({
        file,
        fileName: `${longName}.pdf`,
        contentType: "application/pdf",
        userId: "user-123",
      });

      // Nome sanitizado deve ter no máximo 50 chars + extensão
      const nameWithoutExtension = result.fileName.replace(".pdf", "");
      expect(nameWithoutExtension.length).toBeLessThanOrEqual(50);
    });
  });

  describe("Integração com StorageService", () => {
    test("deve chamar storageService.upload com parâmetros corretos", async () => {
      const file = Buffer.from("fake-content");

      await useCase.execute({
        file,
        fileName: "documento.pdf",
        contentType: "application/pdf",
        userId: "user-123",
        fieldId: "field-456",
      });

      expect(mockStorageService.upload).toHaveBeenCalledTimes(1);
      const call = (mockStorageService.upload as any).mock.calls[0];
      expect(call[0]).toBe(file); // Buffer
      expect(call[1]).toContain("files/user-123/field-456/"); // Key
      expect(call[2]).toBe("application/pdf"); // ContentType
    });

    test("deve retornar dados do storageService corretamente", async () => {
      const file = Buffer.from("fake-content");

      const result = await useCase.execute({
        file,
        fileName: "arquivo.pdf",
        contentType: "application/pdf",
        userId: "user-123",
      });

      expect(result.url).toContain("https://storage.example.com/");
      expect(result.size).toBe(file.length);
      expect(result.contentType).toBe("application/pdf");
    });
  });
});
