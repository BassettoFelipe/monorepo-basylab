import { beforeEach, describe, expect, it } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { addDays, generateTestEmail } from "@/test/test-helpers";

describe("POST /auth/login", () => {
  const { client, userRepository, planRepository, subscriptionRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  describe("successful login scenarios", () => {
    it("should login successfully with valid credentials", async () => {
      const email = generateTestEmail("login");
      const password = "TestPassword123!";
      const hashedPassword = await PasswordUtils.hash(password);

      // Setup: Create verified user with active subscription
      const plans = await planRepository.findAll();
      const user = await userRepository.create({
        email,
        password: hashedPassword,
        name: "Test User",
        isEmailVerified: true,
      });

      const now = new Date();
      await subscriptionRepository.create({
        userId: user.id,
        planId: plans[0].id,
        status: "active",
        startDate: now,
        endDate: addDays(now, 30),
      });

      // Act: Login with Eden Treaty client
      const { data, status, error } = await client.auth.login.post({
        email,
        password,
      });

      // Assert: Verify successful response
      expect(status).toBe(200);
      expect(error).toBeFalsy();
      expect(data).toBeDefined();
      expect(data?.success).toBe(true);
      expect(data?.data.user.email).toBe(email);
      expect(data?.data.user.name).toBe("Test User");
      expect(data?.data.accessToken).toBeDefined();
      expect(data?.data.subscription).toBeDefined();
      expect(data?.data.subscription.status).toBe("active");
    });

    it("should return checkout token for pending subscription", async () => {
      const email = generateTestEmail("pending-sub");
      const password = "TestPassword123!";
      const hashedPassword = await PasswordUtils.hash(password);

      // Setup: Create user with pending subscription
      const plans = await planRepository.findAll();
      const user = await userRepository.create({
        email,
        password: hashedPassword,
        name: "Pending User",
        isEmailVerified: true,
      });

      await subscriptionRepository.create({
        userId: user.id,
        planId: plans[0].id,
        status: "pending",
      });

      // Act: Login
      const { data, status } = await client.auth.login.post({
        email,
        password,
      });

      // Assert: Verify checkout token is returned
      expect(status).toBe(200);
      expect(data?.data.subscription.status).toBe("pending");
      expect(data?.data.checkoutToken).toBeDefined();
      expect(data?.data.checkoutExpiresAt).toBeDefined();
      if (data?.data.checkoutExpiresAt) {
        expect(new Date(data.data.checkoutExpiresAt).getTime()).toBeGreaterThan(Date.now());
      }
    });

    it("should handle expired subscription gracefully", async () => {
      const email = generateTestEmail("expired-sub");
      const password = "TestPassword123!";
      const hashedPassword = await PasswordUtils.hash(password);

      // Setup: Create user with expired subscription
      const plans = await planRepository.findAll();
      const user = await userRepository.create({
        email,
        password: hashedPassword,
        name: "Expired User",
        isEmailVerified: true,
      });

      const now = new Date();
      await subscriptionRepository.create({
        userId: user.id,
        planId: plans[0].id,
        status: "expired",
        startDate: addDays(now, -60),
        endDate: addDays(now, -30),
      });

      // Act: Login
      const { data, status } = await client.auth.login.post({
        email,
        password,
      });

      // Assert: Should still allow login but show expired status
      expect(status).toBe(200);
      expect(data?.data.subscription.status).toBe("expired");
    });
  });

  describe("authentication failures", () => {
    it("should reject login with invalid email", async () => {
      // Act: Attempt login with non-existent email
      const { status, error } = await client.auth.login.post({
        email: "nonexistent@example.com",
        password: "SomePassword123!",
      });

      // Assert: Should return unauthorized
      expect(status).toBe(401);
      expect(error).toBeDefined();
    });

    it("should reject login with invalid password", async () => {
      const email = generateTestEmail("wrong-pass");
      const hashedPassword = await PasswordUtils.hash("CorrectPassword123!");

      // Setup: Create verified user
      await userRepository.create({
        email,
        password: hashedPassword,
        name: "Test User",
        isEmailVerified: true,
      });

      // Act: Attempt login with wrong password
      const { status } = await client.auth.login.post({
        email,
        password: "WrongPassword123!",
      });

      // Assert: Should return unauthorized
      expect(status).toBe(401);
    });

    it("should reject login with unverified email", async () => {
      const email = generateTestEmail("unverified");
      const password = "TestPassword123!";
      const hashedPassword = await PasswordUtils.hash(password);

      // Setup: Create unverified user
      await userRepository.create({
        email,
        password: hashedPassword,
        name: "Unverified User",
        isEmailVerified: false,
        verificationSecret: "some-secret",
      });

      // Act: Attempt login
      const { status } = await client.auth.login.post({
        email,
        password,
      });

      // Assert: Should reject unverified user
      expect(status).toBe(400);
    });
  });

  describe("input validation", () => {
    it("should validate email format", async () => {
      // Act: Send invalid email format
      const { status, error } = await client.auth.login.post({
        email: "invalid-email-format",
        password: "TestPassword123!",
      });

      // Assert: Should return validation error
      expect(status).toBe(422);
      expect(error).toBeDefined();
    });

    it("should handle missing credentials", async () => {
      // Act: Send empty credentials
      const { status, error } = await client.auth.login.post({
        email: "",
        password: "",
      });

      // Assert: Should return validation error
      expect(status).toBe(422);
      expect(error).toBeDefined();
    });
  });

  describe("security", () => {
    it("should not expose sensitive data in response", async () => {
      const email = generateTestEmail("security");
      const password = "TestPassword123!";
      const hashedPassword = await PasswordUtils.hash(password);

      // Setup: Create user with active subscription
      const plans = await planRepository.findAll();
      const user = await userRepository.create({
        email,
        password: hashedPassword,
        name: "Security Test",
        isEmailVerified: true,
      });

      const now = new Date();
      await subscriptionRepository.create({
        userId: user.id,
        planId: plans[0].id,
        status: "active",
        startDate: now,
        endDate: addDays(now, 30),
      });

      // Act: Login
      const { data } = await client.auth.login.post({
        email,
        password,
      });

      // Assert: Verify no sensitive data in response
      const responseString = JSON.stringify(data);
      expect(responseString).not.toContain(hashedPassword);
      expect(responseString).not.toContain("verificationSecret");
      expect(data?.data.user).not.toHaveProperty("password");
    });

    it("should prevent SQL injection attempts", async () => {
      const sqlInjections = [
        "admin@example.com' OR '1'='1",
        "test@example.com'; DROP TABLE users; --",
        "' OR 1=1 --",
      ];

      for (const injection of sqlInjections) {
        // Act: Attempt SQL injection
        const { status } = await client.auth.login.post({
          email: injection,
          password: "TestPassword123!",
        });

        // Assert: Should return validation error or unauthorized, not crash
        expect([401, 422]).toContain(status);
      }
    });
  });
});
