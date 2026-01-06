import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { addMinutes, generateTestEmail } from "@/test/test-helpers";
import { CryptoUtils } from "@/utils/crypto.utils";
import { TotpUtils } from "@/utils/totp.utils";

describe("POST /auth/validate-email-for-reset", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should validate email successfully for verified user", async () => {
    const email = generateTestEmail("validate-email");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Test User",
      isEmailVerified: true,
    });

    const { data, status, error } = await client.auth["validate-email-for-reset"].post({
      email,
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.email).toBe(email);
  });

  it("should normalize email to lowercase", async () => {
    const email = generateTestEmail("uppercase").toLowerCase();

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Test User",
      isEmailVerified: true,
    });

    const { data, status } = await client.auth["validate-email-for-reset"].post({
      email: email.toUpperCase(),
    });

    expect(status).toBe(200);
    expect(data?.email).toBe(email);
  });

  it("should reject request for non-existent user", async () => {
    const { status, error } = await client.auth["validate-email-for-reset"].post({
      email: "nonexistent@example.com",
    });

    expect(status).toBe(404);
    expect((error?.value as { type: string }).type).toBe("USER_NOT_FOUND");
  });

  it("should reject request for user with unverified email", async () => {
    const email = generateTestEmail("unverified");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Unverified User",
      isEmailVerified: false,
      verificationSecret: TotpUtils.generateSecret(),
      verificationExpiresAt: addMinutes(new Date(), 5),
    });

    const { status, error } = await client.auth["validate-email-for-reset"].post({
      email,
    });

    expect(status).toBe(400);
    expect((error?.value as { type: string }).type).toBe("EMAIL_NOT_VERIFIED");
  });

  it("should allow admin-created users without password", async () => {
    const email = generateTestEmail("admin-created");

    await userRepository.create({
      email,
      password: null,
      name: "Admin Created User",
      isEmailVerified: true,
    });

    const { data, status } = await client.auth["validate-email-for-reset"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data?.email).toBe(email);
  });

  it("should allow unverified admin-created users (no password)", async () => {
    const email = generateTestEmail("admin-unverified");

    await userRepository.create({
      email,
      password: null,
      name: "Admin User Unverified",
      isEmailVerified: false,
    });

    const { data, status } = await client.auth["validate-email-for-reset"].post({
      email,
    });

    expect(status).toBe(200);
    expect(data?.email).toBe(email);
  });

  it("should validate email format", async () => {
    const invalidEmails = ["invalid-email", "test@", "@example.com"];

    for (const email of invalidEmails) {
      const { status, error } = await client.auth["validate-email-for-reset"].post({
        email,
      });

      expect(status).toBe(422);
      expect(error).toBeDefined();
    }
  });

  it("should handle missing email field", async () => {
    const { status, error } = await client.auth["validate-email-for-reset"].post(
      {} as { email: string },
    );

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should reject email with whitespace", async () => {
    const email = generateTestEmail("whitespace");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Whitespace User",
      isEmailVerified: true,
    });

    const { status, error } = await client.auth["validate-email-for-reset"].post({
      email: `  ${email}  `,
    });

    // Email com espaços é inválido e deve ser rejeitado na validação
    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should not expose sensitive data in response", async () => {
    const email = generateTestEmail("security");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Security Test",
      isEmailVerified: true,
    });

    const { data } = await client.auth["validate-email-for-reset"].post({
      email,
    });

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("Secret");
    expect(responseString).not.toContain("id");
  });

  it("should return consistent response format", async () => {
    const email = generateTestEmail("format");

    await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Format Test",
      isEmailVerified: true,
    });

    const { data } = await client.auth["validate-email-for-reset"].post({
      email,
    });

    expect(data).toHaveProperty("email");
    expect(typeof data?.email).toBe("string");
  });

  it("should handle SQL injection attempts", async () => {
    const sqlInjections = ["test@example.com'; DROP TABLE users; --", "admin'--", "' OR '1'='1"];

    for (const injection of sqlInjections) {
      const { status } = await client.auth["validate-email-for-reset"].post({
        email: injection,
      });

      expect([404, 422]).toContain(status);
    }
  });
});
