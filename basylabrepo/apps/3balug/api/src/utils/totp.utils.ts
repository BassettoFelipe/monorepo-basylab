import { createTotpUtils } from "@basylab/core/auth";
import { env } from "@/config/env";

// Create TOTP utils configured for this app
const totpUtils = createTotpUtils({
  appSecret: env.TOTP_SECRET,
  issuer: "3Balug",
  label: "3Balug",
  digits: env.TOTP_DIGITS,
  period: env.TOTP_STEP_SECONDS,
});

/**
 * TOTP Utils - handles time-based one-time password generation and verification
 */
export const TotpUtils = {
  /**
   * Generate a new random secret for TOTP
   */
  generateSecret(): string {
    return totpUtils.generateSecret();
  },

  /**
   * Generate a TOTP code for the given secret
   * @param secret - The user's TOTP secret
   * @param timestamp - Optional timestamp (defaults to current time)
   */
  async generateCode(secret: string, timestamp?: number): Promise<string> {
    return totpUtils.generateCode(secret, timestamp);
  },

  /**
   * Verify a TOTP code
   * @param secret - The user's TOTP secret
   * @param code - The code to verify
   * @param timestamp - Optional timestamp (defaults to current time)
   */
  async verifyCode(secret: string, code: string, timestamp?: number): Promise<boolean> {
    return totpUtils.verifyCode(secret, code, timestamp);
  },

  /**
   * Verify a TOTP code with window tolerance
   * Allows codes from previous/next time steps
   * @param secret - The user's TOTP secret
   * @param code - The code to verify
   * @param window - Number of time steps to check before/after (default: 1)
   * @param timestamp - Optional timestamp (defaults to current time)
   */
  async verifyCodeWithWindow(
    secret: string,
    code: string,
    window = 1,
    timestamp?: number,
  ): Promise<boolean> {
    return totpUtils.verifyCodeWithWindow(secret, code, window, timestamp);
  },

  /**
   * Get the current time step period in seconds
   */
  getPeriod(): number {
    return env.TOTP_STEP_SECONDS;
  },
};
