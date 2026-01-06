import { Elysia } from "elysia";
import { dashboardStatsController } from "./stats/stats";

export const dashboardRoutes = new Elysia({ prefix: "/api" }).use(dashboardStatsController);
