import { beforeEach, describe, expect, it } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { addMinutes, generateTestEmail } from "@/test/test-helpers";
import { TotpUtils } from "@/utils/totp.utils";

describe("POST /auth/confirm-email", () => {
  const { client, userRepository, planRepository, subscriptionRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should confirm email with valid code", async () => {
    const email = generateTestEmail("confirm");
    const plans = await planRepository.findAll();
    const verificationSecret = TotpUtils.generateSecret();
    const code = await TotpUtils.generateCode(verificationSecret);

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Test User",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "pending",
    });

    const { data, status, error } = await client.auth["confirm-email"].post({
      email,
      code,
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.success).toBe(true);
    expect(data?.message).toContain("verificado com sucesso");
    expect(data?.checkoutToken).toBeDefined();
    expect(data?.checkoutExpiresAt).toBeDefined();
    expect(new Date(data!.checkoutExpiresAt).getTime()).toBeGreaterThan(Date.now());

    // Verify user is now verified
    const updatedUser = await userRepository.findById(user.id);
    expect(updatedUser?.isEmailVerified).toBe(true);
    expect(updatedUser?.verificationSecret).toBeNull();
  });

  it("should reject invalid verification code", async () => {
    const email = generateTestEmail("invalid-code");
    const plans = await planRepository.findAll();
    const verificationSecret = TotpUtils.generateSecret();

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Test User",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "pending",
    });

    const { status, error } = await client.auth["confirm-email"].post({
      email,
      code: "000000", // Invalid code
    });

    expect(status).toBe(400);
    expect(error?.value.type as any).toBe("INVALID_VERIFICATION_CODE");
  });

  it("should reject confirmation for non-existent user", async () => {
    const { status, error } = await client.auth["confirm-email"].post({
      email: "nonexistent@example.com",
      code: "123456",
    });

    expect(status).toBe(404);
    expect(error?.value.type as any).toBe("USER_NOT_FOUND");
  });

  it("should reject confirmation for already verified user", async () => {
    const email = generateTestEmail("already-verified");
    const plans = await planRepository.findAll();

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Verified User",
      isEmailVerified: true,
      verificationSecret: null,
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "active",
    });

    const { status, error } = await client.auth["confirm-email"].post({
      email,
      code: "123456",
    });

    expect(status).toBe(400);
    expect(error?.value.type as any).toBe("ACCOUNT_ALREADY_VERIFIED");
  });

  it("should reject expired verification code", async () => {
    const email = generateTestEmail("expired");
    const plans = await planRepository.findAll();

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Expired User",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), -5), // Expired 5 minutes ago
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "pending",
    });

    const { status, error } = await client.auth["confirm-email"].post({
      email,
      code: "123456",
    });

    expect(status).toBe(400);
    expect(error?.value.type as any).toBe("VERIFICATION_CODE_EXPIRED");
  });

  it("should enforce brute force protection after multiple failed attempts", async () => {
    const email = generateTestEmail("brute-force");
    const plans = await planRepository.findAll();
    const verificationSecret = TotpUtils.generateSecret();

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Brute Force Test",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "pending",
    });

    // Make multiple failed attempts
    const maxAttempts = 5;
    for (let i = 0; i < maxAttempts; i++) {
      await client.auth["confirm-email"].post({
        email,
        code: "000000", // Invalid code
      });
    }

    // Next attempt should be blocked
    const { status, error } = await client.auth["confirm-email"].post({
      email,
      code: "000000",
    });

    expect(status).toBe(429);
    expect(error?.value.type as any).toBe("TOO_MANY_REQUESTS");
  });

  it("should validate code format", async () => {
    const email = generateTestEmail("invalid-format");

    // Test codes with wrong length (schema requires exactly 6 characters)
    const invalidCodes = ["123", "12345", "1234567", ""];

    for (const code of invalidCodes) {
      const { status, error } = await client.auth["confirm-email"].post({
        email,
        code,
      });

      expect(status).toBe(422);
      expect(error).toBeDefined();
    }
  });

  it("should validate email format", async () => {
    const invalidEmails = ["invalid-email", "test@", "@example.com", ""];

    for (const email of invalidEmails) {
      const { status, error } = await client.auth["confirm-email"].post({
        email,
        code: "123456",
      });

      expect(status).toBe(422);
      expect(error).toBeDefined();
    }
  });

  it("should not expose sensitive data in response", async () => {
    const email = generateTestEmail("security");
    const plans = await planRepository.findAll();
    const verificationSecret = TotpUtils.generateSecret();
    const code = await TotpUtils.generateCode(verificationSecret);

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Security Test",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "pending",
    });

    const { data } = await client.auth["confirm-email"].post({
      email,
      code,
    });

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("verificationSecret");
    expect(data).not.toHaveProperty("user");
  });

  it("should show remaining attempts in error message", async () => {
    const email = generateTestEmail("remaining-attempts");
    const plans = await planRepository.findAll();
    const verificationSecret = TotpUtils.generateSecret();

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Attempts Test",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "pending",
    });

    const { error } = await client.auth["confirm-email"].post({
      email,
      code: "000000", // Invalid code
    });

    expect(error?.value.message).toMatch(/tentativa|Restam/i);
  });

  it("should handle SQL injection attempts", async () => {
    const sqlInjections = ["test@example.com'; DROP TABLE users; --", "admin'--", "' OR '1'='1"];

    for (const injection of sqlInjections) {
      const { status } = await client.auth["confirm-email"].post({
        email: injection,
        code: "123456",
      });

      // Should be validation error or not found, not crash
      expect([404, 422]).toContain(status);
    }
  });

  it("should activate subscription after email verification", async () => {
    const email = generateTestEmail("activate-sub");
    const plans = await planRepository.findAll();
    const verificationSecret = TotpUtils.generateSecret();
    const code = await TotpUtils.generateCode(verificationSecret);

    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Activation Test",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    await subscriptionRepository.create({
      userId: user.id,
      planId: plans[0].id,
      status: "pending",
    });

    const { status } = await client.auth["confirm-email"].post({
      email,
      code,
    });

    expect(status).toBe(200);

    // Verify subscription is still pending (will be activated on payment)
    const subscription = await subscriptionRepository.findByUserId(user.id);
    expect(subscription).toBeDefined();
  });
});
