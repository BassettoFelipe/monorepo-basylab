import { Elysia } from "elysia";
import { deleteDocumentController } from "./delete/delete";
import { listDocumentsController } from "./list/list";
import { uploadDocumentController } from "./upload/upload";

export const documentsController = new Elysia({ prefix: "/api" })
  .use(uploadDocumentController)
  .use(listDocumentsController)
  .use(deleteDocumentController);
