import { ActivateUserUseCase } from "@/use-cases/users/activate-user/activate-user.use-case";
import { CreateUserUseCase } from "@/use-cases/users/create-user/create-user.use-case";
import { DeactivateUserUseCase } from "@/use-cases/users/deactivate-user/deactivate-user.use-case";
import { DeleteUserUseCase } from "@/use-cases/users/delete-user/delete-user.use-case";
import { GetUserUseCase } from "@/use-cases/users/get-user/get-user.use-case";
import { ListUsersUseCase } from "@/use-cases/users/list-users/list-users.use-case";
import { UpdateUserUseCase } from "@/use-cases/users/update-user/update-user.use-case";
import {
  companyRepository,
  customFieldRepository,
  customFieldResponseRepository,
  planFeatureRepository,
  planRepository,
  subscriptionRepository,
  userRepository,
} from "./repositories";
import { userCacheService } from "./services";

export function createUsersUseCases() {
  return {
    getUser: new GetUserUseCase(),
    createUser: new CreateUserUseCase(
      userRepository,
      companyRepository,
      subscriptionRepository,
      planRepository,
      customFieldRepository,
      customFieldResponseRepository,
      planFeatureRepository,
    ),
    listUsers: new ListUsersUseCase(
      userRepository,
      customFieldRepository,
      customFieldResponseRepository,
    ),
    updateUser: new UpdateUserUseCase(
      userRepository,
      subscriptionRepository,
      planRepository,
      userCacheService,
    ),
    deactivateUser: new DeactivateUserUseCase(userRepository, userCacheService),
    deleteUser: new DeleteUserUseCase(userRepository),
    activateUser: new ActivateUserUseCase(userRepository, userCacheService),
  };
}
