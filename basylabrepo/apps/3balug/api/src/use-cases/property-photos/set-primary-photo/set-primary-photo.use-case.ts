import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import { ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyPhotoRepository } from "@/repositories/contracts/property-photo.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

interface SetPrimaryPhotoInput {
  photoId: string;
  user: User;
}

interface SetPrimaryPhotoOutput {
  success: boolean;
  message: string;
}

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BROKER];

export class SetPrimaryPhotoUseCase {
  constructor(
    private readonly propertyPhotoRepository: IPropertyPhotoRepository,
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(input: SetPrimaryPhotoInput): Promise<SetPrimaryPhotoOutput> {
    const { photoId, user } = input;

    if (!ALLOWED_ROLES.includes(user.role as UserRole)) {
      throw new ForbiddenError("Voce nao tem permissao para alterar fotos.");
    }

    if (!user.companyId) {
      throw new InternalServerError("Usuario sem empresa vinculada.");
    }

    const photo = await this.propertyPhotoRepository.findById(photoId);
    if (!photo) {
      throw new NotFoundError("Foto nao encontrada.");
    }

    if (photo.isPrimary) {
      return {
        success: true,
        message: "Esta foto ja e a foto principal.",
      };
    }

    const property = await this.propertyRepository.findById(photo.propertyId);
    if (!property) {
      throw new NotFoundError("Imovel nao encontrado.");
    }

    if (property.companyId !== user.companyId) {
      throw new ForbiddenError("Imovel nao pertence a sua empresa.");
    }

    if (user.role === USER_ROLES.BROKER && property.brokerId !== user.id) {
      throw new ForbiddenError("Voce so pode alterar fotos de imoveis que voce gerencia.");
    }

    try {
      await this.propertyPhotoRepository.setPrimary(photoId, photo.propertyId);

      logger.info(
        {
          photoId,
          propertyId: photo.propertyId,
          changedBy: user.id,
        },
        "Foto definida como principal",
      );

      return {
        success: true,
        message: "Foto definida como principal com sucesso.",
      };
    } catch (error) {
      logger.error({ err: error, photoId }, "Erro ao definir foto principal");
      throw new InternalServerError("Erro ao definir foto principal. Tente novamente.");
    }
  }
}
