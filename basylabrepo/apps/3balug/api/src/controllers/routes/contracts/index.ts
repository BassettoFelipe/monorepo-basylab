import { Elysia } from "elysia";
import { createContractController } from "./create/create";
import { getContractController } from "./get/get";
import { listContractsController } from "./list/list";
import { terminateContractController } from "./terminate/terminate";
import { updateContractController } from "./update/update";

export const contractsRoutes = new Elysia({ prefix: "/api" })
  .use(createContractController)
  .use(listContractsController)
  .use(getContractController)
  .use(updateContractController)
  .use(terminateContractController);
