import { Elysia } from "elysia";
import { logger } from "@/config/logger";
import { container } from "@/container";
import { requireAuth } from "@/controllers/middlewares/auth.middleware";
import { getStorageService } from "@/services/storage";
import { DeleteAvatarUseCase } from "@/use-cases/avatar/delete-avatar/delete-avatar.use-case";
import { deleteAvatarResponseSchema } from "./schema";

export const deleteAvatarController = new Elysia().use(requireAuth).delete(
  "/",
  async ({ userId }) => {
    const useCase = new DeleteAvatarUseCase(container.userRepository, getStorageService());

    await useCase.execute({ userId });

    logger.info({ event: "AVATAR_DELETED", userId }, "Avatar removido com sucesso");

    return {
      success: true,
      message: "Avatar removido com sucesso",
    };
  },
  {
    response: {
      200: deleteAvatarResponseSchema,
    },
  },
);
