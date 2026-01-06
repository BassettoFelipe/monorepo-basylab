import { t } from "elysia";

export const uploadAvatarBodySchema = t.Object({
  file: t.File({
    maxSize: "10m",
    type: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  }),
});

export const uploadAvatarResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: t.Object({
    avatarUrl: t.String(),
  }),
});
