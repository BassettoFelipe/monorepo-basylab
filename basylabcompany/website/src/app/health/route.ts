import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 *
 * Usado para:
 * - Monitoramento (Grafana/Prometheus)
 * - Warm-up do servidor (cron job)
 * - Verificacao de disponibilidade (Nginx upstream)
 *
 * GET /health
 */
export async function GET() {
  const healthcheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB",
    },
  };

  return NextResponse.json(healthcheck, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
