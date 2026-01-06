import { BadRequestError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import type { IPropertyRepository } from "@/repositories/contracts/property.repository";
import type { IPropertyOwnerRepository } from "@/repositories/contracts/property-owner.repository";

type DeletePropertyOwnerInput = {
  id: string;
  deletedBy: User;
};

type DeletePropertyOwnerOutput = {
  success: boolean;
  message: string;
};

export class DeletePropertyOwnerUseCase {
  constructor(
    private readonly propertyOwnerRepository: IPropertyOwnerRepository,
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(input: DeletePropertyOwnerInput): Promise<DeletePropertyOwnerOutput> {
    const { deletedBy } = input;

    if (!deletedBy.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    const propertyOwner = await this.propertyOwnerRepository.findById(input.id);

    if (!propertyOwner || propertyOwner.companyId !== deletedBy.companyId) {
      throw new NotFoundError("Proprietário não encontrado.");
    }

    const propertiesCount = await this.propertyRepository.countByOwnerId(input.id);

    if (propertiesCount > 0) {
      throw new BadRequestError(
        `Não é possível excluir este proprietário. Existem ${propertiesCount} imóvel(is) vinculado(s).`,
      );
    }

    try {
      const deleted = await this.propertyOwnerRepository.delete(input.id);

      if (!deleted) {
        throw new InternalServerError("Erro ao excluir proprietário.");
      }

      logger.info(
        {
          propertyOwnerId: input.id,
          deletedBy: deletedBy.id,
        },
        "Proprietário excluído com sucesso",
      );

      return {
        success: true,
        message: "Proprietário excluído com sucesso.",
      };
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error({ err: error }, "Erro ao excluir proprietário");
      throw new InternalServerError("Erro ao excluir proprietário. Tente novamente.");
    }
  }
}
