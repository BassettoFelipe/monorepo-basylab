import Elysia from "elysia";

type EndpointConfig = {
  delays: number[];
  maxAttempts: number;
  blockDurationMs: number;
};

type EndpointName = "verification" | "passwordReset" | "login";

const ENDPOINT_CONFIGS: Record<EndpointName, EndpointConfig> = {
  verification: {
    delays: [0, 0, 5, 15, 30],
    maxAttempts: 5,
    blockDurationMs: 10 * 60 * 1000,
  },
  passwordReset: {
    delays: [0, 0, 3, 10, 30, 60],
    maxAttempts: 6,
    blockDurationMs: 15 * 60 * 1000,
  },
  login: {
    delays: [0, 0, 5, 15, 30, 60, 120],
    maxAttempts: 7,
    blockDurationMs: 30 * 60 * 1000,
  },
};

type AttemptRecord = {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil?: number;
};

class EnhancedBruteForceProtection {
  private ipAttempts = new Map<string, Map<string, AttemptRecord>>();
  private identifierAttempts = new Map<string, Map<string, AttemptRecord>>();
  private cleanupIntervalId: Timer | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupIntervalId = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();

    for (const [ip, endpoints] of this.ipAttempts.entries()) {
      for (const [endpoint, record] of endpoints.entries()) {
        const config = this.getConfig(endpoint as EndpointName);
        if (!config) continue;

        const isExpired = now - record.lastAttemptAt > config.blockDurationMs + 60000;
        if (isExpired) {
          endpoints.delete(endpoint);
        }
      }
      if (endpoints.size === 0) {
        this.ipAttempts.delete(ip);
      }
    }

    for (const [identifier, endpoints] of this.identifierAttempts.entries()) {
      for (const [endpoint, record] of endpoints.entries()) {
        const config = this.getConfig(endpoint as EndpointName);
        if (!config) continue;

        const isExpired = now - record.lastAttemptAt > config.blockDurationMs + 60000;
        if (isExpired) {
          endpoints.delete(endpoint);
        }
      }
      if (endpoints.size === 0) {
        this.identifierAttempts.delete(identifier);
      }
    }
  }

  private getConfig(endpoint: EndpointName): EndpointConfig {
    return ENDPOINT_CONFIGS[endpoint];
  }

  private getAttemptRecord(
    map: Map<string, Map<string, AttemptRecord>>,
    key: string,
    endpoint: string,
  ): AttemptRecord | null {
    const endpoints = map.get(key);
    if (!endpoints) return null;
    return endpoints.get(endpoint) || null;
  }

  private setAttemptRecord(
    map: Map<string, Map<string, AttemptRecord>>,
    key: string,
    endpoint: string,
    record: AttemptRecord,
  ) {
    let endpoints = map.get(key);
    if (!endpoints) {
      endpoints = new Map();
      map.set(key, endpoints);
    }
    endpoints.set(endpoint, record);
  }

  check(
    endpoint: EndpointName,
    ip: string,
    identifier?: string,
  ): {
    allowed: boolean;
    throttleSeconds: number;
    remainingAttempts: number;
    blockedUntil?: number;
  } {
    const config = this.getConfig(endpoint);

    const now = Date.now();
    const ipRecord = this.getAttemptRecord(this.ipAttempts, ip, endpoint);
    const identifierRecord = identifier
      ? this.getAttemptRecord(this.identifierAttempts, identifier, endpoint)
      : null;

    const records = [ipRecord, identifierRecord].filter((r): r is AttemptRecord => r !== null);

    for (const record of records) {
      if (record.blockedUntil && now < record.blockedUntil) {
        const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
        return {
          allowed: false,
          throttleSeconds: remainingSeconds,
          remainingAttempts: 0,
          blockedUntil: record.blockedUntil,
        };
      }
    }

    const maxCount = Math.max(...records.map((r) => r.count), 0);

    if (maxCount >= config.maxAttempts) {
      const blockUntil = now + config.blockDurationMs;
      for (const record of records) {
        record.blockedUntil = blockUntil;
      }
      return {
        allowed: false,
        throttleSeconds: Math.ceil(config.blockDurationMs / 1000),
        remainingAttempts: 0,
        blockedUntil: blockUntil,
      };
    }

    const mostRecentAttempt = Math.max(...records.map((r) => r.lastAttemptAt), 0);
    const delayIndex = Math.min(maxCount, config.delays.length - 1);
    const requiredDelay = config.delays[delayIndex] * 1000;
    const timeSinceLastAttempt = now - mostRecentAttempt;

    if (timeSinceLastAttempt < requiredDelay) {
      const remainingDelay = Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000);
      return {
        allowed: false,
        throttleSeconds: remainingDelay,
        remainingAttempts: config.maxAttempts - maxCount,
      };
    }

    return {
      allowed: true,
      throttleSeconds: 0,
      remainingAttempts: config.maxAttempts - maxCount,
    };
  }

  recordAttempt(endpoint: EndpointName, ip: string, identifier?: string, success: boolean = false) {
    if (success) {
      this.clearAttempts(endpoint, ip, identifier);
      return;
    }

    const now = Date.now();

    const ipRecord = this.getAttemptRecord(this.ipAttempts, ip, endpoint);
    if (ipRecord) {
      ipRecord.count++;
      ipRecord.lastAttemptAt = now;
    } else {
      this.setAttemptRecord(this.ipAttempts, ip, endpoint, {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
    }

    if (identifier) {
      const identifierRecord = this.getAttemptRecord(this.identifierAttempts, identifier, endpoint);
      if (identifierRecord) {
        identifierRecord.count++;
        identifierRecord.lastAttemptAt = now;
      } else {
        this.setAttemptRecord(this.identifierAttempts, identifier, endpoint, {
          count: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
        });
      }
    }
  }

  clearAttempts(endpoint: EndpointName, ip: string, identifier?: string) {
    const ipEndpoints = this.ipAttempts.get(ip);
    if (ipEndpoints) {
      ipEndpoints.delete(endpoint);
      if (ipEndpoints.size === 0) {
        this.ipAttempts.delete(ip);
      }
    }

    if (identifier) {
      const identifierEndpoints = this.identifierAttempts.get(identifier);
      if (identifierEndpoints) {
        identifierEndpoints.delete(endpoint);
        if (identifierEndpoints.size === 0) {
          this.identifierAttempts.delete(identifier);
        }
      }
    }
  }

  destroy() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    this.ipAttempts.clear();
    this.identifierAttempts.clear();
  }
}

export const enhancedBruteForce = new EnhancedBruteForceProtection();

export const enhancedBruteForcePlugin = new Elysia({
  name: "enhanced-brute-force",
}).decorate("enhancedBruteForce", enhancedBruteForce);
