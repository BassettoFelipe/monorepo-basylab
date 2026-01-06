import { randomUUID } from "node:crypto";
import { FileUtils, FileValidation } from "@basylab/core";
import type { IStorageService } from "@/services/storage";

interface GetPresignedUrlInput {
  fileName: string;
  contentType: string;
  userId: string;
  fieldId?: string;
  allowedTypes?: string[];
}

interface GetPresignedUrlOutput {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: Date;
}

export class GetPresignedUrlUseCase {
  constructor(private storageService: IStorageService) {}

  async execute(input: GetPresignedUrlInput): Promise<GetPresignedUrlOutput> {
    const { fileName, contentType, userId, fieldId, allowedTypes } = input;

    if (allowedTypes && allowedTypes.length > 0) {
      const allowed = FileValidation.isTypeAllowed(contentType, allowedTypes);
      if (!allowed) {
        throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`);
      }
    }

    const fileExtension = FileUtils.getExtension(fileName, contentType);
    const uniqueId = randomUUID();
    const sanitized = FileUtils.sanitizeFileName(fileName);

    const keyParts = ["files", userId];
    if (fieldId) {
      keyParts.push(fieldId);
    }
    keyParts.push(`${uniqueId}_${sanitized}${fileExtension}`);

    const key = keyParts.join("/");

    const result = await this.storageService.getPresignedUploadUrl(key, contentType, 300);

    return {
      uploadUrl: result.url,
      key: result.key,
      publicUrl: this.storageService.getPublicUrl(key),
      expiresAt: result.expiresAt,
    };
  }
}
