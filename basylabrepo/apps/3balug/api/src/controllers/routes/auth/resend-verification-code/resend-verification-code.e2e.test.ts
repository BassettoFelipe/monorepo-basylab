import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { addMinutes, generateTestEmail } from "@/test/test-helpers";
import { TotpUtils } from "@/utils/totp.utils";

// Mock do email service
const mockSendVerificationCode = mock(() => Promise.resolve());

mock.module("@/services/email/email.service", () => ({
  emailService: {
    sendVerificationCode: mockSendVerificationCode,
    verifyConnection: mock(() => Promise.resolve(true)),
  },
  EmailServiceError: class EmailServiceError extends Error {},
}));

describe("POST /auth/resend-verification-code", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
    mockSendVerificationCode.mockClear();
  });

  afterAll(() => {
    mock.restore();
  });

  it("should successfully resend verification code", async () => {
    const email = generateTestEmail("resend");
    const verificationSecret = TotpUtils.generateSecret();

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("Test@1234"),
      name: "Test User",
      isEmailVerified: false,
      verificationSecret,
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 0,
      verificationLastResendAt: null,
    });
    mockSendVerificationCode.mockResolvedValue(undefined);

    const { data, status, error } = await client.auth["resend-verification-code"].post({
      email,
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.success).toBe(true);
    expect(data?.remainingAttempts).toBe(4);
    expect(mockSendVerificationCode).toHaveBeenCalledTimes(1);
  });

  it("should return 404 for non-existent user", async () => {
    const { status, error } = await client.auth["resend-verification-code"].post({
      email: "nonexistent@example.com",
    });

    expect(status).toBe(404);
    expect(error?.value.type as any).toBe("USER_NOT_FOUND");
  });

  it("should return 400 for already verified email", async () => {
    const email = generateTestEmail("verified");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("Test@1234"),
      name: "Verified User",
      isEmailVerified: true,
    });

    const { status, error } = await client.auth["resend-verification-code"].post({
      email,
    });

    expect(status).toBe(400);
    expect(error?.value.type as any).toBe("ACCOUNT_ALREADY_VERIFIED");
  });

  it("should enforce cooldown period", async () => {
    const email = generateTestEmail("cooldown");
    mockSendVerificationCode.mockResolvedValue(undefined);

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("Test@1234"),
      name: "Cooldown Test",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 0,
      verificationLastResendAt: null,
    });

    const firstResponse = await client.auth["resend-verification-code"].post({
      email,
    });
    expect(firstResponse.status).toBe(200);

    const secondResponse = await client.auth["resend-verification-code"].post({
      email,
    });

    expect(secondResponse.status).toBe(429);
    expect(secondResponse.error?.value.type as any).toBe("RESEND_LIMIT_EXCEEDED");
  });

  it("should enforce max resend attempts", async () => {
    const email = generateTestEmail("max-attempts");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("Test@1234"),
      name: "Max Attempts User",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 5,
      verificationLastResendAt: addMinutes(new Date(), -2),
    });

    const { status, error } = await client.auth["resend-verification-code"].post({
      email,
    });

    expect(status).toBe(429);
    expect(error?.value.type as any).toBe("RESEND_LIMIT_EXCEEDED");
  });

  it("should handle brute force protection", async () => {
    const email = generateTestEmail("brute");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("Test@1234"),
      name: "Brute Test",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    const requests = Array.from({ length: 6 }, () =>
      client.auth["resend-verification-code"].post({ email }),
    );

    await Promise.all(requests);

    const { status } = await client.auth["resend-verification-code"].post({
      email,
    });

    expect([429]).toContain(status);
  });

  it("should validate request body schema", async () => {
    const { status } = await client.auth["resend-verification-code"].post({
      email: "invalid-email",
    });

    expect(status).toBe(422);
  });

  it("should handle email service failures gracefully", async () => {
    mockSendVerificationCode.mockRejectedValue(new Error("SMTP Error"));

    const email = generateTestEmail("fail");

    await userRepository.create({
      email,
      password: await PasswordUtils.hash("Test@1234"),
      name: "Fail Test",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
      verificationResendCount: 0,
    });

    const { status, error } = await client.auth["resend-verification-code"].post({
      email,
    });

    expect(status).toBe(502);
    expect(error?.value.type as any).toBe("EMAIL_SEND_FAILED");

    mockSendVerificationCode.mockResolvedValue(undefined);
  });
});
