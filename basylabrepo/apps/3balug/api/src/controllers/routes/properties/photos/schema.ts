import { t } from "elysia";

export const uploadPhotoParamsSchema = t.Object({
  id: t.String(),
});

export const uploadPhotoBodySchema = t.Object({
  file: t.File({
    maxSize: "10m",
  }),
  isPrimary: t.Optional(t.Union([t.Boolean(), t.String()])),
});

export const uploadPhotoResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
  data: t.Object({
    id: t.String(),
    propertyId: t.String(),
    filename: t.String(),
    originalName: t.String(),
    mimeType: t.String(),
    size: t.Number(),
    url: t.String(),
    order: t.Number(),
    isPrimary: t.Boolean(),
    createdAt: t.Date(),
  }),
});

export const deletePhotoParamsSchema = t.Object({
  id: t.String(),
  photoId: t.String(),
});

export const deletePhotoResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

export const setPrimaryPhotoParamsSchema = t.Object({
  id: t.String(),
  photoId: t.String(),
});

export const setPrimaryPhotoResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.String(),
});
