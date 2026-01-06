import { describe, expect, test } from "bun:test";
import { TotpUtils } from "./totp.utils";

describe("TotpUtils", () => {
  describe("generateSecret", () => {
    test("should generate a secret", () => {
      const secret = TotpUtils.generateSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThan(0);
    });

    test("should generate unique secrets", () => {
      const secret1 = TotpUtils.generateSecret();
      const secret2 = TotpUtils.generateSecret();
      const secret3 = TotpUtils.generateSecret();

      expect(secret1).not.toBe(secret2);
      expect(secret1).not.toBe(secret3);
      expect(secret2).not.toBe(secret3);
    });

    test("should generate base64 encoded string", () => {
      const secret = TotpUtils.generateSecret();

      expect(secret).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    test("should generate consistent length secrets", () => {
      const secrets = [];
      for (let i = 0; i < 10; i++) {
        secrets.push(TotpUtils.generateSecret());
      }

      const lengths = secrets.map((s) => s.length);
      const uniqueLengths = new Set(lengths);

      expect(uniqueLengths.size).toBeLessThanOrEqual(2);
    });

    test("should be cryptographically random", () => {
      const secrets = new Set();
      for (let i = 0; i < 100; i++) {
        secrets.add(TotpUtils.generateSecret());
      }

      expect(secrets.size).toBe(100); // All should be unique
    });
  });

  describe("generateCode", () => {
    test("should generate a 6-digit code by default", () => {
      const secret = TotpUtils.generateSecret();
      const code = TotpUtils.generateCode(secret);

      expect(code).toBeDefined();
      expect(typeof code).toBe("string");
      expect(code).toMatch(/^\d{6}$/); // Exactly 6 digits
    });

    test("should generate consistent code for same secret at same time", () => {
      const secret = TotpUtils.generateSecret();
      const code1 = TotpUtils.generateCode(secret);
      const code2 = TotpUtils.generateCode(secret);

      expect(code1).toBe(code2);
    });

    test("should generate different codes for different secrets", () => {
      const secret1 = TotpUtils.generateSecret();
      const secret2 = TotpUtils.generateSecret();

      const code1 = TotpUtils.generateCode(secret1);
      const code2 = TotpUtils.generateCode(secret2);

      expect(code1).not.toBe(code2);
    });

    test("should generate code with timestamp", () => {
      const secret = TotpUtils.generateSecret();
      const timestamp = Date.now();
      const code = TotpUtils.generateCode(secret, timestamp);

      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/);
    });

    test("should generate same code for same secret and timestamp", () => {
      const secret = TotpUtils.generateSecret();
      const timestamp = Date.now();

      const code1 = TotpUtils.generateCode(secret, timestamp);
      const code2 = TotpUtils.generateCode(secret, timestamp);

      expect(code1).toBe(code2);
    });

    test("should generate different codes for different timestamps", () => {
      const secret = TotpUtils.generateSecret();

      const timestamp1 = 1000 * 30 * 1000; // Counter = 1000
      const timestamp2 = 2000 * 30 * 1000; // Counter = 2000

      const code1 = TotpUtils.generateCode(secret, timestamp1);
      const code2 = TotpUtils.generateCode(secret, timestamp2);

      expect(code1).not.toBe(code2);
    });

    test("should pad codes with leading zeros", () => {
      const secret = TotpUtils.generateSecret();

      const codes = [];
      for (let i = 0; i < 100; i++) {
        const timestamp = Date.now() + i * 1000;
        const code = TotpUtils.generateCode(secret, timestamp);
        codes.push(code);

        expect(code.length).toBe(6); // Should always be 6 digits
      }
    });

    test("should handle past timestamps", () => {
      const secret = TotpUtils.generateSecret();
      const pastTimestamp = Date.now() - 3600000; // 1 hour ago

      const code = TotpUtils.generateCode(secret, pastTimestamp);

      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/);
    });

    test("should handle future timestamps", () => {
      const secret = TotpUtils.generateSecret();
      const futureTimestamp = Date.now() + 3600000; // 1 hour from now

      const code = TotpUtils.generateCode(secret, futureTimestamp);

      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe("verifyCode", () => {
    test("should verify correct code", () => {
      const secret = TotpUtils.generateSecret();
      const code = TotpUtils.generateCode(secret);

      const isValid = TotpUtils.verifyCode(secret, code);

      expect(isValid).toBe(true);
    });

    test("should reject incorrect code", () => {
      const secret = TotpUtils.generateSecret();
      const code = TotpUtils.generateCode(secret);

      const wrongCode = code.substring(0, 5) + ((Number.parseInt(code[5], 10) + 1) % 10);

      const isValid = TotpUtils.verifyCode(secret, wrongCode);

      expect(isValid).toBe(false);
    });

    test("should reject completely wrong code", () => {
      const secret = TotpUtils.generateSecret();

      const isValid = TotpUtils.verifyCode(secret, "000000");

      expect(isValid).toBe(false);
    });

    test("should reject code with wrong length", () => {
      const secret = TotpUtils.generateSecret();

      const isValid1 = TotpUtils.verifyCode(secret, "12345");
      const isValid2 = TotpUtils.verifyCode(secret, "1234567");

      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });

    test("should reject non-numeric code", () => {
      const secret = TotpUtils.generateSecret();

      const isValid = TotpUtils.verifyCode(secret, "abcdef");

      expect(isValid).toBe(false);
    });

    test("should verify code generated with same timestamp", () => {
      const secret = TotpUtils.generateSecret();
      const timestamp = Date.now();

      const code = TotpUtils.generateCode(secret, timestamp);
      const isValid = TotpUtils.verifyCode(secret, code, timestamp);

      expect(isValid).toBe(true);
    });

    test("should verify code within same time window", () => {
      const secret = TotpUtils.generateSecret();
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 1000; // 1 second later (same 30s window)

      const code = TotpUtils.generateCode(secret, timestamp1);
      const isValid = TotpUtils.verifyCode(secret, code, timestamp2);

      expect(isValid).toBe(true);
    });

    test("should reject code from different time window (no window tolerance)", () => {
      const secret = TotpUtils.generateSecret();
      const timestamp1 = 1000 * 30 * 1000; // Counter = 1000
      const timestamp2 = 2000 * 30 * 1000; // Counter = 2000

      const code = TotpUtils.generateCode(secret, timestamp1);
      const isValid = TotpUtils.verifyCode(secret, code, timestamp2);

      expect(isValid).toBe(false);
    });

    test("should reject empty code", () => {
      const secret = TotpUtils.generateSecret();

      const isValid = TotpUtils.verifyCode(secret, "");

      expect(isValid).toBe(false);
    });

    test("should not verify code from different secret", () => {
      const secret1 = TotpUtils.generateSecret();
      const secret2 = TotpUtils.generateSecret();

      const code = TotpUtils.generateCode(secret1);
      const isValid = TotpUtils.verifyCode(secret2, code);

      expect(isValid).toBe(false);
    });
  });

  describe("Integration tests", () => {
    test("should complete full cycle: generate secret, code, and verify", () => {
      const secret = TotpUtils.generateSecret();
      expect(secret).toBeDefined();

      const code = TotpUtils.generateCode(secret);
      expect(code).toMatch(/^\d{6}$/);

      const isValid = TotpUtils.verifyCode(secret, code);
      expect(isValid).toBe(true);
    });

    test("should handle multiple verification attempts", () => {
      const secret = TotpUtils.generateSecret();
      const code = TotpUtils.generateCode(secret);

      expect(TotpUtils.verifyCode(secret, code)).toBe(true);
      expect(TotpUtils.verifyCode(secret, code)).toBe(true);
      expect(TotpUtils.verifyCode(secret, code)).toBe(true);
    });

    test("should handle code regeneration with same secret", () => {
      const secret = TotpUtils.generateSecret();

      const code1 = TotpUtils.generateCode(secret);

      const code2 = TotpUtils.generateCode(secret);

      expect(code1).toBe(code2);

      expect(TotpUtils.verifyCode(secret, code1)).toBe(true);
      expect(TotpUtils.verifyCode(secret, code2)).toBe(true);
    });

    test("should demonstrate time-based nature", () => {
      const secret = TotpUtils.generateSecret();

      const timestamp1 = 1000 * 30 * 1000; // Counter = 1000
      const timestamp2 = 2000 * 30 * 1000; // Counter = 2000
      const timestamp3 = 3000 * 30 * 1000; // Counter = 3000

      const code1 = TotpUtils.generateCode(secret, timestamp1);
      const code2 = TotpUtils.generateCode(secret, timestamp2);
      const code3 = TotpUtils.generateCode(secret, timestamp3);

      expect(code1).not.toBe(code2);
      expect(code1).not.toBe(code3);
      expect(code2).not.toBe(code3);

      expect(TotpUtils.verifyCode(secret, code1, timestamp1)).toBe(true);
      expect(TotpUtils.verifyCode(secret, code2, timestamp2)).toBe(true);
      expect(TotpUtils.verifyCode(secret, code3, timestamp3)).toBe(true);

      expect(TotpUtils.verifyCode(secret, code1, timestamp2)).toBe(false);
      expect(TotpUtils.verifyCode(secret, code2, timestamp3)).toBe(false);
    });

    test("should handle realistic email verification flow", () => {
      const userSecret = TotpUtils.generateSecret();
      expect(userSecret).toBeDefined();

      const emailCode = TotpUtils.generateCode(userSecret);
      expect(emailCode).toMatch(/^\d{6}$/);

      const userEnteredCode = emailCode;
      const isValid = TotpUtils.verifyCode(userSecret, userEnteredCode);
      expect(isValid).toBe(true);

      setTimeout(() => {
        TotpUtils.verifyCode(userSecret, userEnteredCode);
      }, 1000);
    });

    test("should ensure secrets are independent", () => {
      const user1Secret = TotpUtils.generateSecret();
      const user2Secret = TotpUtils.generateSecret();

      const user1Code = TotpUtils.generateCode(user1Secret);
      const user2Code = TotpUtils.generateCode(user2Secret);

      expect(TotpUtils.verifyCode(user1Secret, user1Code)).toBe(true);
      expect(TotpUtils.verifyCode(user2Secret, user2Code)).toBe(true);

      expect(TotpUtils.verifyCode(user1Secret, user2Code)).toBe(false);
      expect(TotpUtils.verifyCode(user2Secret, user1Code)).toBe(false);
    });
  });

  describe("Edge cases and security", () => {
    test("should handle empty secret gracefully", () => {
      expect(() => TotpUtils.generateCode("")).not.toThrow();
    });

    test("should handle special characters in code verification", () => {
      const secret = TotpUtils.generateSecret();

      expect(TotpUtils.verifyCode(secret, "12@34#")).toBe(false);
      expect(TotpUtils.verifyCode(secret, "12 345")).toBe(false);
      expect(TotpUtils.verifyCode(secret, "12-345")).toBe(false);
    });

    test("should not accept leading/trailing spaces", () => {
      const secret = TotpUtils.generateSecret();
      const code = TotpUtils.generateCode(secret);

      expect(TotpUtils.verifyCode(secret, ` ${code}`)).toBe(false);
      expect(TotpUtils.verifyCode(secret, `${code} `)).toBe(false);
      expect(TotpUtils.verifyCode(secret, ` ${code} `)).toBe(false);
    });

    test("should handle very old timestamps", () => {
      const secret = TotpUtils.generateSecret();
      const veryOldTimestamp = 0; // Unix epoch

      const code = TotpUtils.generateCode(secret, veryOldTimestamp);

      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/);
    });

    test("should handle far future timestamps", () => {
      const secret = TotpUtils.generateSecret();
      const farFutureTimestamp = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year

      const code = TotpUtils.generateCode(secret, farFutureTimestamp);

      expect(code).toBeDefined();
      expect(code).toMatch(/^\d{6}$/);
    });
  });
});
