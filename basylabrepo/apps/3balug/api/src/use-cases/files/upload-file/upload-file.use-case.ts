import { randomUUID } from "node:crypto";
import { getExtension, sanitizeFileName } from "@/helpers/file-utils.helper";
import { isTypeAllowed } from "@/helpers/file-validation.helper";
import type { IStorageService } from "@/services/storage";

interface UploadFileInput {
  file: Buffer;
  fileName: string;
  contentType: string;
  userId: string;
  fieldId?: string; // ID do campo customizado (opcional)
  maxFileSize?: number; // Tamanho máximo em MB
  allowedTypes?: string[]; // Tipos MIME permitidos
}

interface UploadFileOutput {
  url: string;
  key: string;
  size: number;
  contentType: string;
  fileName: string;
}

export class UploadFileUseCase {
  constructor(private storageService: IStorageService) {}

  async execute(input: UploadFileInput): Promise<UploadFileOutput> {
    const { file, fileName, contentType, userId, fieldId, maxFileSize = 5, allowedTypes } = input;

    const fileSizeInMB = file.length / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) {
      throw new Error(`O arquivo excede o tamanho máximo permitido de ${maxFileSize}MB`);
    }

    if (allowedTypes && allowedTypes.length > 0) {
      const allowed = isTypeAllowed(contentType, allowedTypes);
      if (!allowed) {
        throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`);
      }
    }

    const fileExtension = getExtension(fileName, contentType);
    const uniqueId = randomUUID();
    const sanitized = sanitizeFileName(fileName);

    // Organizar em pastas: files/userId/fieldId/uniqueId_fileName
    const keyParts = ["files", userId];
    if (fieldId) {
      keyParts.push(fieldId);
    }
    keyParts.push(`${uniqueId}_${sanitized}${fileExtension}`);

    const key = keyParts.join("/");

    // Fazer upload
    const result = await this.storageService.upload(file, key, contentType);

    return {
      url: result.url,
      key: result.key,
      size: result.size,
      contentType: result.contentType,
      fileName: sanitized + fileExtension,
    };
  }
}
