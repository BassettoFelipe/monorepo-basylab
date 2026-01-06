import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/errors";
import type { ICustomFieldRepository } from "@/repositories/contracts/custom-field.repository";
import type { ICustomFieldCacheService } from "@/services/cache/custom-field-cache.service";
import { USER_ROLES } from "@/types/roles";

type DeleteCustomFieldInput = {
  user: User;
  fieldId: string;
};

type DeleteCustomFieldOutput = {
  success: boolean;
};

export class DeleteCustomFieldUseCase {
  constructor(
    private readonly customFieldRepository: ICustomFieldRepository,
    private readonly cache?: ICustomFieldCacheService,
  ) {}

  async execute(input: DeleteCustomFieldInput): Promise<DeleteCustomFieldOutput> {
    if (input.user.role !== USER_ROLES.OWNER) {
      throw new ForbiddenError("Apenas o proprietário pode excluir campos personalizados.");
    }

    if (!input.user.companyId) {
      throw new BadRequestError("Usuário sem empresa vinculada.");
    }

    const existingField = await this.customFieldRepository.findById(input.fieldId);
    if (!existingField) {
      throw new NotFoundError("Campo não encontrado.");
    }

    if (existingField.companyId !== input.user.companyId) {
      throw new ForbiddenError("Você não tem permissão para excluir este campo.");
    }

    const deleted = await this.customFieldRepository.delete(input.fieldId);

    await this.cache?.invalidate(input.user.companyId);

    return { success: deleted };
  }
}
