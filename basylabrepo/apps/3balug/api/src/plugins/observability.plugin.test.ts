import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { Elysia } from "elysia";
import { logger } from "@/config/logger";
import { observabilityPlugin } from "./observability.plugin";

// Mock do metrics plugin
mock.module("@/plugins/metrics.plugin", () => ({
  recordHttpMetrics: mock(() => {}),
}));

// Test types
interface TestStore {
  startTime: number;
  requestId: string;
  metricsRecorded: boolean;
}

interface TestError extends Error {
  status: number;
}

interface LogCall {
  msg?: string;
  [key: string]: unknown;
}

describe("observabilityPlugin", () => {
  let infoSpy: ReturnType<typeof spyOn>;
  let warnSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    infoSpy = spyOn(logger, "info").mockImplementation(() => {});
    warnSpy = spyOn(logger, "warn").mockImplementation(() => {});
    errorSpy = spyOn(logger, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe("onRequest", () => {
    it("should initialize store with startTime, requestId, and metricsRecorded", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/test", ({ store }) => {
        const s = store as unknown as TestStore;
        return {
          hasStartTime: typeof s.startTime === "number",
          hasRequestId: typeof s.requestId === "string",
          metricsRecorded: s.metricsRecorded,
        };
      });

      const response = await app.handle(new Request("http://localhost/test"));
      const data = (await response.json()) as {
        hasStartTime: boolean;
        hasRequestId: boolean;
        metricsRecorded: boolean;
      };

      expect(data.hasStartTime).toBe(true);
      expect(data.hasRequestId).toBe(true);
      expect(data.metricsRecorded).toBe(false);
    });
  });

  describe("onAfterHandle", () => {
    it("should log request completion with logger.info", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/test", () => ({ success: true }));

      await app.handle(new Request("http://localhost/test"));

      expect(infoSpy).toHaveBeenCalled();
      const logCall = infoSpy.mock.calls[0][0];
      expect(logCall.msg).toBe("Request completed");
      expect(logCall.method).toBe("GET");
      expect(logCall.path).toBe("/test");
      expect(logCall.status).toBe(200);
    });

    it("should include project in log", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/test", () => ({ success: true }));

      await app.handle(new Request("http://localhost/test"));

      expect(infoSpy).toHaveBeenCalled();
      const logCall = infoSpy.mock.calls[0][0];
      expect(logCall.project).toBe("3balug");
    });

    it("should include responseTime in log", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/test", () => ({ success: true }));

      await app.handle(new Request("http://localhost/test"));

      expect(infoSpy).toHaveBeenCalled();
      const logCall = infoSpy.mock.calls[0][0];
      expect(typeof logCall.responseTime).toBe("number");
      expect(logCall.responseTime).toBeGreaterThanOrEqual(0);
    });

    it("should include requestId in log", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/test", () => ({ success: true }));

      await app.handle(new Request("http://localhost/test"));

      expect(infoSpy).toHaveBeenCalled();
      const logCall = infoSpy.mock.calls[0][0];
      expect(typeof logCall.requestId).toBe("string");
      expect(logCall.requestId.length).toBeGreaterThan(0);
    });
  });

  describe("onError - logger method binding fix", () => {
    it("should use logger.error correctly for 500 status without throwing TypeError", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/error-500", () => {
        const error = new Error("Internal server error");

        (error as TestError).status = 500;
        throw error;
      });

      // This should NOT throw "TypeError: undefined is not an object (evaluating 'this[msgPrefixSym]')"
      const response = await app.handle(new Request("http://localhost/error-500"));

      expect(response.status).toBe(500);
      expect(errorSpy).toHaveBeenCalled();
      const logCall = errorSpy.mock.calls[0][0];
      expect(logCall.msg).toBe("Request error");
    });

    it("should use logger.warn correctly for 400 status without throwing TypeError", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/error-400", () => {
        const error = new Error("Bad request");

        (error as TestError).status = 400;
        throw error;
      });

      // This should NOT throw "TypeError: undefined is not an object (evaluating 'this[msgPrefixSym]')"
      const response = await app.handle(new Request("http://localhost/error-400"));

      expect(response.status).toBe(400);
      expect(warnSpy).toHaveBeenCalled();
      const logCall = warnSpy.mock.calls[0][0];
      expect(logCall.msg).toBe("Request error");
    });

    it("should call logger.error for status 500", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/server-error", () => {
        const error = new Error("Server error");

        (error as TestError).status = 500;
        throw error;
      });

      await app.handle(new Request("http://localhost/server-error"));

      expect(errorSpy).toHaveBeenCalled();

      const errorCalls = errorSpy.mock.calls.filter(
        (call: unknown[]) => (call[0] as LogCall)?.msg === "Request error",
      );
      expect(errorCalls.length).toBeGreaterThan(0);
    });

    it("should call logger.warn for status 404", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/client-error", () => {
        const error = new Error("Not found");

        (error as TestError).status = 404;
        throw error;
      });

      await app.handle(new Request("http://localhost/client-error"));

      expect(warnSpy).toHaveBeenCalled();

      const warnCalls = warnSpy.mock.calls.filter(
        (call: unknown[]) => (call[0] as LogCall)?.msg === "Request error",
      );
      expect(warnCalls.length).toBeGreaterThan(0);
    });

    it("should include path in error log", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/error-path-test", () => {
        const error = new Error("Test error");

        (error as TestError).status = 422;
        throw error;
      });

      await app.handle(new Request("http://localhost/error-path-test"));

      expect(warnSpy).toHaveBeenCalled();

      const logCall = warnSpy.mock.calls.find(
        (call: unknown[]) => (call[0] as LogCall)?.msg === "Request error",
      );
      expect(logCall).toBeDefined();
      expect((logCall![0] as LogCall).path).toBe("/error-path-test");
    });

    it("should include responseTime in error log", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/error-time-test", () => {
        const error = new Error("Test error");

        (error as TestError).status = 400;
        throw error;
      });

      await app.handle(new Request("http://localhost/error-time-test"));

      const logCall = warnSpy.mock.calls.find(
        (call: unknown[]) => (call[0] as LogCall)?.msg === "Request error",
      );
      expect(logCall).toBeDefined();
      expect(typeof (logCall![0] as LogCall).responseTime).toBe("number");
    });

    it("should include requestId in error log", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/error-id-test", () => {
        const error = new Error("Test error");

        (error as TestError).status = 400;
        throw error;
      });

      await app.handle(new Request("http://localhost/error-id-test"));

      const logCall = warnSpy.mock.calls.find(
        (call: unknown[]) => (call[0] as LogCall)?.msg === "Request error",
      );
      expect(logCall).toBeDefined();
      expect(typeof (logCall![0] as LogCall).requestId).toBe("string");
    });

    it("should default to status 500 when error has no status", async () => {
      const app = new Elysia().use(observabilityPlugin).get("/no-status", () => {
        throw new Error("Error without status");
      });

      await app.handle(new Request("http://localhost/no-status"));

      expect(errorSpy).toHaveBeenCalled();

      const logCall = errorSpy.mock.calls.find(
        (call: unknown[]) => (call[0] as LogCall)?.msg === "Request error",
      );
      expect(logCall).toBeDefined();
      expect((logCall![0] as LogCall).status).toBe(500);
    });

    it("should handle consecutive requests without crashing", async () => {
      const app = new Elysia()
        .use(observabilityPlugin)
        .get("/error1", () => {
          const error = new Error("Error 1");

          (error as TestError).status = 500;
          throw error;
        })
        .get("/error2", () => {
          const error = new Error("Error 2");

          (error as TestError).status = 400;
          throw error;
        });

      // All requests should complete without throwing TypeError
      const response1 = await app.handle(new Request("http://localhost/error1"));
      const response2 = await app.handle(new Request("http://localhost/error2"));

      expect(response1.status).toBe(500);
      expect(response2.status).toBe(400);

      // Check that both loggers were called
      expect(errorSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("metrics", () => {
    it("should not record metrics for /metrics path", async () => {
      const { recordHttpMetrics } = await import("@/plugins/metrics.plugin");
      const metricsSpy = recordHttpMetrics as ReturnType<typeof mock>;

      const app = new Elysia().use(observabilityPlugin).get("/metrics", () => "metrics data");

      metricsSpy.mockClear();
      await app.handle(new Request("http://localhost/metrics"));

      expect(metricsSpy).not.toHaveBeenCalled();
    });

    it("should record metrics for regular paths", async () => {
      const { recordHttpMetrics } = await import("@/plugins/metrics.plugin");
      const metricsSpy = recordHttpMetrics as ReturnType<typeof mock>;

      const app = new Elysia().use(observabilityPlugin).get("/api/users", () => ({ users: [] }));

      metricsSpy.mockClear();
      await app.handle(new Request("http://localhost/api/users"));

      expect(metricsSpy).toHaveBeenCalled();
    });

    it("should record metrics on error", async () => {
      const { recordHttpMetrics } = await import("@/plugins/metrics.plugin");
      const metricsSpy = recordHttpMetrics as ReturnType<typeof mock>;

      const app = new Elysia().use(observabilityPlugin).get("/error-metrics", () => {
        const error = new Error("Error for metrics test");

        (error as TestError).status = 500;
        throw error;
      });

      metricsSpy.mockClear();
      await app.handle(new Request("http://localhost/error-metrics"));

      expect(metricsSpy).toHaveBeenCalled();
    });
  });
});
