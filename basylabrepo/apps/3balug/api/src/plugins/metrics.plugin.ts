import { Elysia } from "elysia";
import client from "prom-client";

const registry = new client.Registry();

client.collectDefaultMetrics({ register: registry });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export function recordHttpMetrics(input: {
  method: string;
  route: string;
  status: string;
  durationSeconds: number;
}): void {
  httpRequestsTotal.inc({
    method: input.method,
    route: input.route,
    status: input.status,
  });
  httpRequestDurationSeconds.observe(
    { method: input.method, route: input.route, status: input.status },
    input.durationSeconds,
  );
}

export const metricsPlugin = () =>
  new Elysia({ name: "metrics" }).get("/metrics", ({ set }) => {
    set.headers["content-type"] = registry.contentType;
    return registry.metrics();
  });
