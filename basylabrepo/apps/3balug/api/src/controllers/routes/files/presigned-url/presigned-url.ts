import { Elysia } from "elysia";
import { logger } from "@/config/logger";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { getStorageService } from "@/services/storage";
import { GetPresignedUrlUseCase } from "@/use-cases/files/get-presigned-url/get-presigned-url.use-case";
import { presignedUrlBodySchema, presignedUrlResponseSchema } from "./schema";

export const presignedUrlController = new Elysia().use(requireAuth).post(
  "/presigned-url",
  async ({ userId, body }) => {
    const { fileName, contentType, fieldId, allowedTypes } = body;

    const parsedAllowedTypes = allowedTypes && allowedTypes.length > 0 ? allowedTypes : undefined;

    const useCase = new GetPresignedUrlUseCase(getStorageService());

    const result = await useCase.execute({
      fileName,
      contentType,
      userId,
      fieldId: fieldId || undefined,
      allowedTypes: parsedAllowedTypes,
    });

    logger.info({ event: "PRESIGNED_URL_GENERATED", userId, fileName }, "URL pré-assinada gerada");

    return {
      success: true,
      message: "URL pré-assinada gerada com sucesso",
      data: result,
    };
  },
  {
    body: presignedUrlBodySchema,
    response: {
      200: presignedUrlResponseSchema,
    },
  },
);
