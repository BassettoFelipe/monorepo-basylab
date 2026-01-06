import { createJwtUtils, type TokenPayload } from "@basylab/core/auth";
import { env } from "@/config/env";

/**
 * Token types supported by the application
 */
export type TokenType = "access" | "refresh" | "resetPassword" | "checkout";

/**
 * JWT payload with app-specific fields
 */
export interface JwtPayload extends TokenPayload {
  role?: string;
  companyId?: string | null;
}

/**
 * Checkout token specific payload
 */
export interface CheckoutTokenPayload extends JwtPayload {
  purpose: "checkout";
  user: {
    name: string;
    email: string;
  };
  subscription: {
    id: string;
    status: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
  };
}

/**
 * JWT configuration per token type
 */
interface JwtTokenConfig {
  secret: string;
  expiresIn: string;
}

/**
 * Get JWT configuration for a token type
 */
function getTokenConfig(type: TokenType): JwtTokenConfig {
  const configs: Record<TokenType, JwtTokenConfig> = {
    access: {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
    refresh: {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    resetPassword: {
      secret: env.JWT_RESET_PASSWORD_SECRET,
      expiresIn: env.JWT_RESET_PASSWORD_EXPIRES_IN,
    },
    checkout: {
      secret: env.JWT_CHECKOUT_SECRET,
      expiresIn: env.JWT_CHECKOUT_EXPIRES_IN,
    },
  };

  return configs[type];
}

// Lazy-initialized JWT utils per token type
const jwtInstances = new Map<TokenType, ReturnType<typeof createJwtUtils>>();

function getJwtInstance(type: TokenType) {
  let instance = jwtInstances.get(type);
  if (!instance) {
    const config = getTokenConfig(type);
    instance = createJwtUtils({
      secret: config.secret,
      issuer: "3balug",
    });
    jwtInstances.set(type, instance);
  }
  return instance;
}

/**
 * Parse expiration string to seconds
 * Supports: 30s, 15m, 1h, 7d
 */
function parseExpirationToSeconds(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid expiration format: ${exp}`);
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return value * (multipliers[unit] ?? 1);
}

/**
 * JWT Utils - handles token generation and verification
 */
export const JwtUtils = {
  /**
   * Generate a signed JWT token
   */
  async generateToken(
    userId: string,
    type: TokenType,
    additionalPayload?: Record<string, unknown>,
  ): Promise<string> {
    const config = getTokenConfig(type);
    const jwtInstance = getJwtInstance(type);

    return jwtInstance.sign(userId, {
      expiresIn: config.expiresIn,
      additionalClaims: additionalPayload,
    });
  },

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(token: string, type: TokenType): Promise<JwtPayload | null> {
    const jwtInstance = getJwtInstance(type);
    const payload = await jwtInstance.verify(token);

    if (!payload) {
      return null;
    }

    return payload as JwtPayload;
  },

  /**
   * Get expiration time in seconds for a token type
   */
  getExpirationSeconds(type: TokenType): number {
    const config = getTokenConfig(type);
    return parseExpirationToSeconds(config.expiresIn);
  },

  /**
   * Parse expiration string to seconds
   */
  parseExpirationToSeconds,
};

// Re-export types for convenience
export type { TokenType as JwtTokenType };
