/**
 * Email Verification Rate Limiting
 */
export const EMAIL_VERIFICATION = {
  MAX_RESEND_ATTEMPTS: 5,
  MAX_CODE_ATTEMPTS: 5,
  INITIAL_COOLDOWN_SECONDS: 30,
  SUBSEQUENT_COOLDOWN_SECONDS: 60,
  RESET_WINDOW_HOURS: 24,
  THROTTLE_DELAYS: [0, 0, 5, 10, 15] as const,
} as const;

/**
 * Password Reset Rate Limiting
 */
export const PASSWORD_RESET = {
  MAX_RESEND_ATTEMPTS: 5,
  MAX_CODE_ATTEMPTS: 5,
  COOLDOWN_SECONDS: 60,
  BLOCK_DURATION_MINUTES: 30,
  THROTTLE_DELAYS: [0, 0, 5, 15, 30] as const,
} as const;
