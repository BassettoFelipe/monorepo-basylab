import { Secret, TOTP } from "otpauth";
import { env } from "@/config/env";

function createTotp(secret: string): TOTP {
  const combinedSecret = `${env.TOTP_SECRET}:${secret}`;
  const secretBytes = new TextEncoder().encode(combinedSecret);

  return new TOTP({
    issuer: "CRM Imobil",
    label: "CRM Imobil",
    algorithm: "SHA1",
    digits: env.TOTP_DIGITS,
    period: env.TOTP_STEP_SECONDS,
    secret: new Secret({ buffer: secretBytes.buffer }),
  });
}

export const TotpUtils = {
  generateSecret(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Buffer.from(buffer).toString("base64");
  },

  generateCode(secret: string, timestamp?: number): string {
    const totp = createTotp(secret);

    if (timestamp !== undefined) {
      const counter = Math.floor(timestamp / 1000 / env.TOTP_STEP_SECONDS);
      return totp.generate({
        timestamp: counter * env.TOTP_STEP_SECONDS * 1000,
      });
    }

    return totp.generate();
  },

  verifyCode(secret: string, code: string, timestamp?: number): boolean {
    const totp = createTotp(secret);

    const delta = totp.validate({
      token: code,
      timestamp: timestamp,
      window: 0,
    });

    return delta === 0;
  },
};
