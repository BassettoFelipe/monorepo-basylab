import { logger } from "@/config/logger";
import { BadRequestError } from "@/errors";
import { extractKeyFromUrl } from "@/helpers/s3-url.helper";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { getImageProcessor } from "@/services/image";
import type { IStorageService } from "@/services/storage";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const AVATAR_CONFIG = {
  maxWidth: 256,
  maxHeight: 256,
  quality: 80,
  format: "webp" as const,
};

type UploadAvatarInput = {
  userId: string;
  file: Buffer;
  contentType: string;
};

type UploadAvatarOutput = {
  avatarUrl: string;
};

export class UploadAvatarUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly storageService: IStorageService,
  ) {}

  async execute(input: UploadAvatarInput): Promise<UploadAvatarOutput> {
    const { userId, file, contentType } = input;

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      throw new BadRequestError("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.");
    }

    if (file.length > MAX_FILE_SIZE) {
      throw new BadRequestError("Arquivo muito grande. O tamanho máximo é 10MB.");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError("Usuário não encontrado.");
    }

    const imageProcessor = getImageProcessor();

    const validation = await imageProcessor.validateImage(file);
    if (!validation.valid) {
      throw new BadRequestError(validation.error || "Imagem inválida");
    }

    const processed = await imageProcessor.processAvatar(file, AVATAR_CONFIG);

    const key = `avatars/${userId}/${Date.now()}.webp`;

    if (user.avatarUrl) {
      try {
        const oldKey = extractKeyFromUrl(user.avatarUrl);
        if (oldKey) {
          await this.storageService.delete(oldKey);
        }
      } catch (error) {
        logger.warn(
          { err: error, userId, oldAvatarUrl: user.avatarUrl },
          "Não foi possível remover avatar antigo",
        );
      }
    }

    const result = await this.storageService.upload(processed.buffer, key, processed.contentType);

    await this.userRepository.update(userId, {
      avatarUrl: result.url,
    });

    logger.info(
      {
        userId,
        avatarUrl: result.url,
        originalSize: `${(processed.originalSize / 1024).toFixed(2)}KB`,
        finalSize: `${(processed.processedSize / 1024).toFixed(2)}KB`,
        compressionRatio: `${processed.compressionRatio}%`,
      },
      "Avatar atualizado com sucesso",
    );

    return {
      avatarUrl: result.url,
    };
  }
}
