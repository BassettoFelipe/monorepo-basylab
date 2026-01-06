import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { addMinutes, generateTestEmail } from "@/test/test-helpers";
import { TotpUtils } from "@/utils/totp.utils";

// Mock do email service
const mockSendPasswordResetCode = mock(() => Promise.resolve());

mock.module("@/services/email/email.service", () => ({
  emailService: {
    sendPasswordResetCode: mockSendPasswordResetCode,
    verifyConnection: mock(() => Promise.resolve(true)),
  },
  EmailServiceError: class EmailServiceError extends Error {},
}));

describe("POST /auth/resend-password-reset-code", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
    mockSendPasswordResetCode.mockClear();
  });

  afterAll(() => {
    mock.restore();
  });

  it("should resend password reset code successfully", async () => {
    const email = generateTestEmail("resend-code");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Test User",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
      passwordResetResendCount: 0,
    });

    const { data, status, error } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.remainingResendAttempts).toBe(4);
    expect(data?.canResendAt).toBeTruthy();
    expect(new Date(data!.canResendAt).getTime()).toBeGreaterThan(Date.now());
    expect(data?.codeExpiresAt).toBeDefined();
  });

  it("should decrement remaining attempts with each resend", async () => {
    const email = generateTestEmail("decrement");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Test User",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
      passwordResetResendCount: 3,
    });

    const { data, status } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data?.remainingResendAttempts).toBe(1);
  });

  it("should reject when cooldown is active", async () => {
    const email = generateTestEmail("cooldown");
    const cooldownEndsAt = addMinutes(new Date(), 1);

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Cooldown User",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
      passwordResetCooldownEndsAt: cooldownEndsAt,
    });

    const { status, error } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(429);
    expect((error?.value as { type: string }).type).toBe("TOO_MANY_ATTEMPTS");
  });

  it("should reject when resend is blocked", async () => {
    const email = generateTestEmail("blocked");
    const blockedUntil = addMinutes(new Date(), 30);

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Blocked User",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
      passwordResetResendBlocked: true,
      passwordResetResendBlockedUntil: blockedUntil,
    });

    const { status, error } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(429);
    expect((error?.value as { type: string }).type).toBe("TOO_MANY_ATTEMPTS");
  });

  it("should block after max resend attempts reached", async () => {
    const email = generateTestEmail("max-reached");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Max User",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
      passwordResetResendCount: 5,
    });

    const { status, error } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(429);
    expect((error?.value as { type: string }).type).toBe("TOO_MANY_ATTEMPTS");
  });

  it("should reject request for non-existent user", async () => {
    const { status, error } = await client.auth["resend-password-reset-code"].post({
      email: "nonexistent@example.com",
    });

    expect(status).toBe(404);
    expect((error?.value as { type: string }).type).toBe("USER_NOT_FOUND");
  });

  it("should reject request for user with unverified email", async () => {
    const email = generateTestEmail("unverified");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Unverified User",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    const { status, error } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(400);
    expect((error?.value as { type: string }).type).toBe("EMAIL_NOT_VERIFIED");
  });

  it("should allow admin-created users without password to resend", async () => {
    const email = generateTestEmail("admin-created");

    await userRepository.create({
      email,
      password: null,
      name: "Admin Created User",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
    });

    const { data, status } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data?.remainingResendAttempts).toBe(4);
  });

  it("should reset code attempts on resend", async () => {
    const email = generateTestEmail("reset-attempts");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Reset Attempts User",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
      passwordResetAttempts: 3,
    });

    const { status } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(status).toBe(200);

    const user = await userRepository.findByEmail(email);
    expect(user?.passwordResetAttempts).toBe(0);
  });

  it("should validate email format", async () => {
    const invalidEmails = ["invalid-email", "test@", "@example.com"];

    for (const email of invalidEmails) {
      const { status, error } = await client.auth["resend-password-reset-code"].post({
        email,
      });

      expect(status).toBe(422);
      expect(error).toBeDefined();
    }
  });

  it("should handle missing email field", async () => {
    const { status, error } = await client.auth["resend-password-reset-code"].post(
      {} as { email: string },
    );

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should not expose sensitive data in response", async () => {
    const email = generateTestEmail("security");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Security Test",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
    });

    const { data } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("passwordResetSecret");
    expect(responseString).not.toContain("Secret");
    expect(responseString).not.toContain("resetCode");
  });

  it("should return consistent response format", async () => {
    const email = generateTestEmail("format");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Format Test",
      isEmailVerified: true,
      passwordResetSecret: TotpUtils.generateSecret(),
      passwordResetExpiresAt: addMinutes(new Date(), 5),
    });

    const { data } = await client.auth["resend-password-reset-code"].post({
      email,
    });

    expect(data).toHaveProperty("remainingResendAttempts");
    expect(data).toHaveProperty("canResendAt");
    expect(data).toHaveProperty("codeExpiresAt");
    expect(typeof data?.remainingResendAttempts).toBe("number");
    // canResendAt pode ser string (ISO) ou Date (quando Eden Treaty auto-converte)
    expect(["string", "object"].includes(typeof data?.canResendAt)).toBe(true);
    expect(data?.codeExpiresAt).toBeDefined();
  });
});
