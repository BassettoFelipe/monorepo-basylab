import postgres from "postgres";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

async function main() {
  if (env.NODE_ENV === "production") {
    throw new Error("db-clean cannot run in production");
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL not configured");
  }

  const sql = postgres(env.DATABASE_URL, { max: 1 });

  try {
    const result = await sql`SELECT current_user`;
    const currentUser = result[0]?.current_user as string;

    await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
    await sql`CREATE SCHEMA IF NOT EXISTS public;`;

    await sql`GRANT ALL ON SCHEMA public TO public;`;
    await sql`GRANT ALL ON SCHEMA public TO ${sql(currentUser)};`;
    await sql`ALTER ROLE ${sql(currentUser)} SET search_path TO public;`;

    logger.info("Database schema reset successfully");
  } finally {
    await sql.end({ timeout: 0 });
  }
}

main().catch((error) => {
  logger.error({ error }, "Failed to clean database");
  process.exit(1);
});
