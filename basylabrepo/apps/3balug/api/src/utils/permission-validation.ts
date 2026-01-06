import { ForbiddenError, InternalServerError, NotFoundError } from "@basylab/core/errors";
import type { User } from "@/db/schema/users";
import type { IUserRepository } from "@/repositories/contracts/user.repository";
import { USER_ROLES, type UserRole } from "@/types/roles";

export interface IPermissionValidationService {
  validateUserAccess(
    userId: string,
    allowedRoles: UserRole[],
    actionDescription?: string,
  ): Promise<User>;

  validateBrokerOwnership(currentUser: User, entityCreatedBy: string | null): void;

  validateCompanyAccess(entityCompanyId: string, userCompanyId: string): void;

  validateUserAndEntityAccess(
    userId: string,
    allowedRoles: UserRole[],
    entityCompanyId: string,
    entityCreatedBy: string | null,
    actionDescription?: string,
  ): Promise<User>;
}

export class PermissionValidationService implements IPermissionValidationService {
  constructor(private readonly userRepository: IUserRepository) {}

  async validateUserAccess(
    userId: string,
    allowedRoles: UserRole[],
    actionDescription: string = "realizar esta ação",
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      throw new ForbiddenError(`Você não tem permissão para ${actionDescription}`);
    }

    if (!user.companyId) {
      throw new InternalServerError("Usuário sem empresa vinculada.");
    }

    return user;
  }

  validateBrokerOwnership(currentUser: User, entityCreatedBy: string | null): void {
    if (currentUser.role === USER_ROLES.BROKER) {
      if (!entityCreatedBy || entityCreatedBy !== currentUser.id) {
        throw new ForbiddenError(
          "Corretores só podem editar/deletar entidades que eles mesmos criaram",
        );
      }
    }
  }

  validateCompanyAccess(entityCompanyId: string, userCompanyId: string): void {
    if (entityCompanyId !== userCompanyId) {
      throw new ForbiddenError("Você não tem acesso a esta entidade");
    }
  }

  async validateUserAndEntityAccess(
    userId: string,
    allowedRoles: UserRole[],
    entityCompanyId: string,
    entityCreatedBy: string | null,
    actionDescription: string = "realizar esta ação",
  ): Promise<User> {
    const user = await this.validateUserAccess(userId, allowedRoles, actionDescription);

    // validateUserAccess already ensures companyId exists
    this.validateCompanyAccess(entityCompanyId, user.companyId as string);
    this.validateBrokerOwnership(user, entityCreatedBy);

    return user;
  }
}
