import { beforeEach, describe, expect, it } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { addMinutes, generateTestEmail } from "@/test/test-helpers";
import { TotpUtils } from "@/utils/totp.utils";

describe("POST /auth/confirm-password-reset", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should reset password with valid code", async () => {
    const email = generateTestEmail("reset-password");
    const resetSecret = TotpUtils.generateSecret();
    const code = await TotpUtils.generateCode(resetSecret);

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("OldPassword123!"),
      name: "Test User",
      isEmailVerified: true,
      passwordResetSecret: resetSecret,
      passwordResetExpiresAt: addMinutes(new Date(), 5),
    });

    const { data, status, error } = await client.auth["confirm-password-reset"].post({
      email,
      code,
      newPassword: "Xk9#mL2$vQ7@nP4!",
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data?.success).toBe(true);
    expect(data?.message).toBeDefined();
  });

  it("should reject invalid reset code", async () => {
    const email = generateTestEmail("invalid-reset-code");
    const resetSecret = TotpUtils.generateSecret();

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("OldPassword123!"),
      name: "Test User",
      isEmailVerified: true,
      passwordResetSecret: resetSecret,
      passwordResetExpiresAt: addMinutes(new Date(), 5),
    });

    const { status, error } = await client.auth["confirm-password-reset"].post({
      email,
      code: "000000",
      newPassword: "Xk9#mL2$vQ7@nP4!",
    });

    expect(status).toBe(400);
    expect(error).toBeDefined();
  });

  it("should reject reset for non-existent user", async () => {
    const { status, error } = await client.auth["confirm-password-reset"].post({
      email: "nonexistent@example.com",
      code: "123456",
      newPassword: "Xk9#mL2$vQ7@nP4!",
    });

    expect(status).toBe(404);
    expect(error).toBeDefined();
  });

  it("should reject expired reset code", async () => {
    const email = generateTestEmail("expired-reset");
    const resetSecret = TotpUtils.generateSecret();

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("OldPassword123!"),
      name: "Test User",
      isEmailVerified: true,
      passwordResetSecret: resetSecret,
      passwordResetExpiresAt: addMinutes(new Date(), -5),
    });

    const { status, error } = await client.auth["confirm-password-reset"].post({
      email,
      code: "123456",
      newPassword: "Xk9#mL2$vQ7@nP4!",
    });

    expect(status).toBe(400);
    expect(error).toBeDefined();
  });

  it("should reject weak password", async () => {
    const email = generateTestEmail("weak-password");
    const resetSecret = TotpUtils.generateSecret();
    const code = await TotpUtils.generateCode(resetSecret);

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("OldPassword123!"),
      name: "Test User",
      isEmailVerified: true,
      passwordResetSecret: resetSecret,
      passwordResetExpiresAt: addMinutes(new Date(), 5),
    });

    const { status, error } = await client.auth["confirm-password-reset"].post({
      email,
      code,
      newPassword: "weak",
    });

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should validate code format", async () => {
    const email = generateTestEmail("code-format");

    const invalidCodes = ["123", "12345", "1234567", ""];

    for (const code of invalidCodes) {
      const { status, error } = await client.auth["confirm-password-reset"].post({
        email,
        code,
        newPassword: "Xk9#mL2$vQ7@nP4!",
      });

      expect(status).toBe(422);
      expect(error).toBeDefined();
    }
  });

  it("should validate email format", async () => {
    const invalidEmails = ["invalid-email", "test@", "@example.com", ""];

    for (const email of invalidEmails) {
      const { status, error } = await client.auth["confirm-password-reset"].post({
        email,
        code: "123456",
        newPassword: "Xk9#mL2$vQ7@nP4!",
      });

      expect(status).toBe(422);
      expect(error).toBeDefined();
    }
  });

  it("should clear reset secret after successful reset", async () => {
    const email = generateTestEmail("clear-secret");
    const resetSecret = TotpUtils.generateSecret();
    const code = await TotpUtils.generateCode(resetSecret);

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("OldPassword123!"),
      name: "Test User",
      isEmailVerified: true,
      passwordResetSecret: resetSecret,
      passwordResetExpiresAt: addMinutes(new Date(), 5),
    });

    await client.auth["confirm-password-reset"].post({
      email,
      code,
      newPassword: "Xk9#mL2$vQ7@nP4!",
    });

    const updatedUser = await userRepository.findById(user.id);
    expect(updatedUser?.passwordResetSecret).toBeNull();
  });

  it("should handle SQL injection attempts", async () => {
    const sqlInjections = ["test@example.com'; DROP TABLE users; --", "admin'--", "' OR '1'='1"];

    for (const injection of sqlInjections) {
      const { status } = await client.auth["confirm-password-reset"].post({
        email: injection,
        code: "123456",
        newPassword: "Xk9#mL2$vQ7@nP4!",
      });

      expect([404, 422]).toContain(status);
    }
  });
});
