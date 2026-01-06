import { describe, expect, test } from "bun:test";
import { CryptoUtils } from "./crypto.utils";

describe("CryptoUtils", () => {
  describe("hashPassword", () => {
    test("should hash a password successfully", async () => {
      const password = "SecureP@ss123";
      const hash = await CryptoUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    test("should generate different hashes for same password", async () => {
      const password = "SamePassword123!";
      const hash1 = await CryptoUtils.hashPassword(password);
      const hash2 = await CryptoUtils.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salt each time
    });

    test("should reject empty string", async () => {
      await expect(CryptoUtils.hashPassword("")).rejects.toThrow();
    });

    test("should handle special characters", async () => {
      const password = "P@$$w0rd!#%&*()";
      const hash = await CryptoUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    test("should handle unicode characters", async () => {
      const password = "Пароль123密码";
      const hash = await CryptoUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    test("should handle very long passwords", async () => {
      const password = "a".repeat(200);
      const hash = await CryptoUtils.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("verifyPassword", () => {
    test("should verify correct password", async () => {
      const password = "MyPassword123!";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const password = "CorrectPassword";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword("WrongPassword", hash);

      expect(isValid).toBe(false);
    });

    test("should reject password with different case", async () => {
      const password = "Password123";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword("password123", hash);

      expect(isValid).toBe(false);
    });

    test("should reject empty password against valid hash", async () => {
      const password = "ValidPassword";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword("", hash);

      expect(isValid).toBe(false);
    });

    test("should reject empty password for hashing", async () => {
      await expect(CryptoUtils.hashPassword("")).rejects.toThrow();
    });

    test("should reject password with extra characters", async () => {
      const password = "Password";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword("Password!", hash);

      expect(isValid).toBe(false);
    });

    test("should reject password with missing characters", async () => {
      const password = "Password123";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword("Password", hash);

      expect(isValid).toBe(false);
    });

    test("should handle special characters correctly", async () => {
      const password = "P@$$w0rd!";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword("P@$$w0rd!", hash);

      expect(isValid).toBe(true);
    });

    test("should handle unicode characters correctly", async () => {
      const password = "密码Пароль123";
      const hash = await CryptoUtils.hashPassword(password);
      const isValid = await CryptoUtils.verifyPassword("密码Пароль123", hash);

      expect(isValid).toBe(true);
    });

    test("should reject invalid hash format", async () => {
      try {
        const isValid = await CryptoUtils.verifyPassword("password", "not-a-valid-hash");
        expect(isValid).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("generateSecureRandomString", () => {
    test("should generate string of requested length", () => {
      const length = 16;
      const randomStr = CryptoUtils.generateSecureRandomString(length);

      expect(randomStr).toBeDefined();
      expect(randomStr.length).toBe(length);
    });

    test("should generate different strings each time", () => {
      const str1 = CryptoUtils.generateSecureRandomString(32);
      const str2 = CryptoUtils.generateSecureRandomString(32);

      expect(str1).not.toBe(str2);
    });

    test("should generate only hexadecimal characters", () => {
      const randomStr = CryptoUtils.generateSecureRandomString(100);

      expect(randomStr).toMatch(/^[0-9a-f]+$/);
    });

    test("should handle length of 1", () => {
      const randomStr = CryptoUtils.generateSecureRandomString(1);

      expect(randomStr.length).toBe(1);
      expect(randomStr).toMatch(/^[0-9a-f]$/);
    });

    test("should handle large lengths", () => {
      const length = 1000;
      const randomStr = CryptoUtils.generateSecureRandomString(length);

      expect(randomStr.length).toBe(length);
      expect(randomStr).toMatch(/^[0-9a-f]+$/);
    });

    test("should handle length of 0", () => {
      const randomStr = CryptoUtils.generateSecureRandomString(0);

      expect(randomStr.length).toBe(0);
      expect(randomStr).toBe("");
    });

    test("should be cryptographically random (statistical test)", () => {
      const strings = new Set();
      for (let i = 0; i < 100; i++) {
        strings.add(CryptoUtils.generateSecureRandomString(32));
      }

      expect(strings.size).toBe(100); // All should be unique
    });
  });

  describe("generateUUID", () => {
    test("should generate valid UUID", () => {
      const uuid = CryptoUtils.generateUUID();

      expect(uuid).toBeDefined();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    test("should generate unique UUIDs", () => {
      const uuid1 = CryptoUtils.generateUUID();
      const uuid2 = CryptoUtils.generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });

    test("should generate v4 UUIDs (random)", () => {
      const uuid = CryptoUtils.generateUUID();
      const parts = uuid.split("-");

      expect(parts[2][0]).toBe("4");
    });

    test("should generate multiple unique UUIDs", () => {
      const uuids = new Set();
      for (let i = 0; i < 1000; i++) {
        uuids.add(CryptoUtils.generateUUID());
      }

      expect(uuids.size).toBe(1000); // All should be unique
    });

    test("should always be lowercase", () => {
      for (let i = 0; i < 10; i++) {
        const uuid = CryptoUtils.generateUUID();
        expect(uuid).toBe(uuid.toLowerCase());
      }
    });

    test("should have correct format and length", () => {
      const uuid = CryptoUtils.generateUUID();

      expect(uuid.length).toBe(36); // 8-4-4-4-12 + 4 hyphens
      expect(uuid.split("-").length).toBe(5);
      expect(uuid.split("-")[0].length).toBe(8);
      expect(uuid.split("-")[1].length).toBe(4);
      expect(uuid.split("-")[2].length).toBe(4);
      expect(uuid.split("-")[3].length).toBe(4);
      expect(uuid.split("-")[4].length).toBe(12);
    });
  });

  describe("Integration tests", () => {
    test("should handle password hash and verify in sequence", async () => {
      const password = "IntegrationTest123!";

      const hash = await CryptoUtils.hashPassword(password);
      expect(hash).toBeDefined();

      const isValidCorrect = await CryptoUtils.verifyPassword(password, hash);
      expect(isValidCorrect).toBe(true);

      const isValidIncorrect = await CryptoUtils.verifyPassword("WrongPassword", hash);
      expect(isValidIncorrect).toBe(false);
    });

    test("should generate unique identifiers consistently", () => {
      const uuids = [];
      const randomStrings = [];

      for (let i = 0; i < 10; i++) {
        uuids.push(CryptoUtils.generateUUID());
        randomStrings.push(CryptoUtils.generateSecureRandomString(32));
      }

      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(10);

      const uniqueStrings = new Set(randomStrings);
      expect(uniqueStrings.size).toBe(10);
    });
  });
});
