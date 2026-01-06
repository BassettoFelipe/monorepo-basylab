import { Elysia } from "elysia";
import { deleteFileController } from "./delete/delete";
import { presignedUrlController } from "./presigned-url/presigned-url";
import { uploadFileController } from "./upload/upload";

export const filesController = new Elysia({ prefix: "/files" })
  .use(uploadFileController)
  .use(presignedUrlController)
  .use(deleteFileController);
