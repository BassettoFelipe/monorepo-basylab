import { sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { getRedis } from "@/config/redis";
import { db } from "@/db";

const redis = getRedis();

/**
 * Health Check Endpoint
 *
 * Returns system health status for monitoring and deployment validation
 * - Database connectivity
 * - Redis connectivity
 * - Application version
 * - Uptime
 */

const startTime = Date.now();

export const healthController = new Elysia({ prefix: "/health" }).get(
  "/",
  async () => {
    const checks = {
      database: false,
      redis: false,
    };

    const details: Record<string, unknown> = {};

    try {
      await db.execute(sql`SELECT 1`);
      checks.database = true;
    } catch (error) {
      checks.database = false;
      details.databaseError = error instanceof Error ? error.message : String(error);
    }

    try {
      await redis.ping();
      checks.redis = true;
    } catch (error) {
      checks.redis = false;
      details.redisError = error instanceof Error ? error.message : String(error);
    }

    const healthy = checks.database && checks.redis;
    const status: "healthy" | "unhealthy" = healthy ? "healthy" : "unhealthy";

    const uptime = Math.floor((Date.now() - startTime) / 1000);

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || "1.0.0",
      checks,
      ...(Object.keys(details).length > 0 ? { details } : {}),
    };
  },
  {
    response: t.Object({
      status: t.Union([t.Literal("healthy"), t.Literal("unhealthy")]),
      timestamp: t.String(),
      uptime: t.Number(),
      version: t.String(),
      checks: t.Object({
        database: t.Boolean(),
        redis: t.Boolean(),
      }),
      details: t.Optional(t.Record(t.String(), t.Unknown())),
    }),
  },
);
