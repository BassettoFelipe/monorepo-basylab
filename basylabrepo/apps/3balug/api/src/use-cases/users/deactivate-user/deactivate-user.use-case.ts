import { logger } from "@/config/logger";
import type { User } from "@/db/schema/users";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "@/errors";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import type { IUserCacheService } from "@/services/contracts/user-cache-service.interface";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";
import { PermissionsUtils } from "@/utils/permissions.utils";

type DeactivateUserInput = {
  userId: string; // ID do usuário a ser desativado
  deactivatedBy: User; // Usuário que está desativando (deve ser owner)
};

type DeactivateUserOutput = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  message: string;
};

export class DeactivateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userCacheService: IUserCacheService,
  ) {}

  async execute(input: DeactivateUserInput): Promise<DeactivateUserOutput> {
    if (!PermissionsUtils.canDeactivateUser(input.deactivatedBy.role as UserRole)) {
      throw new ForbiddenError(
        "Você não tem permissão para desativar usuários. Apenas proprietários e gerentes podem realizar esta ação.",
      );
    }

    if (!input.deactivatedBy.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada");
    }

    const userToDeactivate = await this.userRepository.findById(input.userId);
    if (!userToDeactivate) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (userToDeactivate.companyId !== input.deactivatedBy.companyId) {
      throw new ForbiddenError("Você não pode desativar usuários de outra empresa");
    }

    if (userToDeactivate.id === input.deactivatedBy.id) {
      throw new ForbiddenError("Você não pode desativar sua própria conta");
    }

    if (userToDeactivate.role === USER_ROLES.OWNER) {
      throw new ForbiddenError("Não é possível desativar o dono da conta");
    }

    if (!userToDeactivate.isActive) {
      throw new BadRequestError("Este usuário já está desativado");
    }

    try {
      const updatedUser = await this.userRepository.update(input.userId, {
        isActive: false,
      });

      if (!updatedUser) {
        throw new InternalServerError("Erro ao desativar usuário");
      }

      logger.info(
        {
          userId: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role as string,
          deactivatedBy: input.deactivatedBy.id,
        },
        "Usuário desativado com sucesso",
      );

      // Invalidar cache do usuário
      await this.userCacheService.invalidate(updatedUser.id);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isActive: updatedUser.isActive,
        message: "Usuário desativado com sucesso",
      };
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof BadRequestError) {
        throw error;
      }

      logger.error(
        {
          err: error,
          userId: input.userId,
          companyId: input.deactivatedBy.companyId,
        },
        "Erro ao desativar usuário",
      );

      throw new InternalServerError("Erro ao desativar usuário. Tente novamente.");
    }
  }
}
