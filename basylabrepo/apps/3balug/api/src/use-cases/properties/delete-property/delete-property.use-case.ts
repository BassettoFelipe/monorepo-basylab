import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IContractRepository } from "@/repositories/contracts/contract.repository";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyPhotoRepository } from "@/repositories/contracts/property-photo.repository";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

type DeletePropertyInput = {
  id: string;
  deletedBy: User;
};

type DeletePropertyOutput = {
  success: boolean;
  message: string;
};

const ALLOWED_ROLES: UserRole[] = [USER_ROLES.OWNER, USER_ROLES.MANAGER];

export class DeletePropertyUseCase {
  constructor(
    private readonly propertyRepository: IPropertyRepository,
    private readonly contractRepository: IContractRepository,
    readonly _propertyPhotoRepository: IPropertyPhotoRepository,
  ) {}

  async execute(input: DeletePropertyInput): Promise<DeletePropertyOutput> {
    const { deletedBy } = input;

    if (!ALLOWED_ROLES.includes(deletedBy.role as UserRole)) {
      throw new ForbiddenError("Você não tem permissão para excluir imóveis.");
    }

    if (!deletedBy.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const property = await this.propertyRepository.findById(input.id);

    if (!property) {
      throw new NotFoundError("Imóvel não encontrado.");
    }

    if (property.companyId !== deletedBy.companyId) {
      throw new ForbiddenError("Você não tem permissão para excluir este imóvel.");
    }

    const contracts = await this.contractRepository.findByPropertyId(input.id);

    if (contracts.length > 0) {
      throw new BadRequestError(
        `Não é possível excluir este imóvel. Existem ${contracts.length} contrato(s) vinculado(s).`,
      );
    }

    try {
      const deleted = await this.propertyRepository.deleteWithPhotos(input.id);

      if (!deleted) {
        throw new InternalServerError("Erro ao excluir imóvel.");
      }

      logger.info(
        {
          propertyId: input.id,
          deletedBy: deletedBy.id,
        },
        "Imóvel excluído com sucesso",
      );

      return {
        success: true,
        message: "Imóvel excluído com sucesso.",
      };
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao excluir imóvel");
      throw new InternalServerError("Erro ao excluir imóvel. Tente novamente.");
    }
  }
}
