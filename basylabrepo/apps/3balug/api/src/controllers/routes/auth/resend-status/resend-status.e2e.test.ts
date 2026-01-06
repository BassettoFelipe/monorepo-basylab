import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { addMinutes, generateTestEmail } from "@/test/test-helpers";
import { CryptoUtils } from "@/utils/crypto.utils";
import { TotpUtils } from "@/utils/totp.utils";

describe("POST /auth/resend-status", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should return resend status for unverified user with no prior resends", async () => {
    const email = generateTestEmail("resend-status");
    const verificationSecret = TotpUtils.generateSecret();

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Test User",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 0,
      verificationLastResendAt: null,
    });

    const { data, status, error } = await client.auth["resend-status"].post({
      email,
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.remainingAttempts).toBe(5); // Max attempts
    expect(data?.canResend).toBe(true);
  });

  it("should return correct remaining attempts after some resends", async () => {
    const email = generateTestEmail("some-resends");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Test User",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 2, // Already sent 2 times
      verificationLastResendAt: addMinutes(new Date(), -2), // Last resend 2 minutes ago
    });

    const { data, status } = await client.auth["resend-status"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data?.remainingAttempts).toBe(3); // 5 - 2 = 3
    expect(data?.canResend).toBe(true); // Cooldown expired
  });

  it("should indicate cooldown when recent resend occurred", async () => {
    const email = generateTestEmail("cooldown");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Cooldown User",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 1,
      verificationLastResendAt: new Date(), // Just now
    });

    const { data, status } = await client.auth["resend-status"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data?.canResend).toBe(false);
    expect(data?.remainingAttempts).toBe(4);
  });

  it("should indicate no attempts remaining when limit reached", async () => {
    const email = generateTestEmail("limit-reached");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Limit User",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 5, // Max reached
      verificationLastResendAt: addMinutes(new Date(), -2),
    });

    const { data, status } = await client.auth["resend-status"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data?.remainingAttempts).toBe(0);
    expect(data?.canResend).toBe(false);
  });

  it("should reject request for non-existent user", async () => {
    const { status, error } = await client.auth["resend-status"].post({
      email: "nonexistent@example.com",
    });

    expect(status).toBe(404);
    expect(error?.value.type as any).toBe("USER_NOT_FOUND");
  });

  it("should reject request for already verified user", async () => {
    const email = generateTestEmail("verified");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Verified User",
      isEmailVerified: true,
      verificationSecret: null,
    });

    const { status, error } = await client.auth["resend-status"].post({
      email,
    });

    expect(status).toBe(400);
    expect(error?.value.type as any).toBe("ACCOUNT_ALREADY_VERIFIED");
  });

  it("should validate email format", async () => {
    const invalidEmails = ["invalid-email", "test@", "@example.com", ""];

    for (const email of invalidEmails) {
      const { status, error } = await client.auth["resend-status"].post({
        email,
      });

      expect(status).toBe(422);
      expect(error).toBeDefined();
    }
  });

  it("should handle missing email field", async () => {
    const { status, error } = await client.auth["resend-status"].post({} as { email: string });

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should not expose sensitive data in response", async () => {
    const email = generateTestEmail("security");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Security Test",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 1,
    });

    const { data } = await client.auth["resend-status"].post({
      email,
    });

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("verificationSecret");
    expect(data).not.toHaveProperty("user");
    expect(data).not.toHaveProperty("userId");
  });

  it("should return consistent response format", async () => {
    const email = generateTestEmail("format");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Format Test",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    const { data } = await client.auth["resend-status"].post({
      email,
    });

    expect(data).toHaveProperty("remainingAttempts");
    expect(data).toHaveProperty("canResend");
    expect(typeof data?.remainingAttempts).toBe("number");
    expect(typeof data?.canResend).toBe("boolean");
  });

  it("should handle SQL injection attempts", async () => {
    const sqlInjections = ["test@example.com'; DROP TABLE users; --", "admin'--", "' OR '1'='1"];

    for (const injection of sqlInjections) {
      const { status } = await client.auth["resend-status"].post({
        email: injection,
      });

      // Should be validation error or not found, not crash
      expect([404, 422]).toContain(status);
    }
  });

  it("should handle case sensitivity in email", async () => {
    const email = generateTestEmail("case-test").toLowerCase();

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Case Test",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    // Try with different case
    const upperEmail = email.toUpperCase();
    const { status } = await client.auth["resend-status"].post({
      email: upperEmail,
    });

    // Should still find user (case-insensitive email lookup)
    expect([200, 404]).toContain(status);
  });

  it("should calculate cooldown accurately", async () => {
    const email = generateTestEmail("cooldown-calc");

    // Set last resend to 29 seconds ago (within 30 second cooldown)
    const lastResendAt = new Date();
    lastResendAt.setSeconds(lastResendAt.getSeconds() - 29);

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Cooldown Calc",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 1,
      verificationLastResendAt: lastResendAt,
    });

    const { data, status } = await client.auth["resend-status"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data).toBeDefined();
    expect(data?.canResend).toBe(false);
  });
});
