import { Elysia } from "elysia";
import { createTenantController } from "./create/create";
import { deleteTenantController } from "./delete/delete";
import { getTenantController } from "./get/get";
import { listTenantsController } from "./list/list";
import { updateTenantController } from "./update/update";

export const tenantsRoutes = new Elysia({ prefix: "/api" })
  .use(createTenantController)
  .use(listTenantsController)
  .use(getTenantController)
  .use(updateTenantController)
  .use(deleteTenantController);
