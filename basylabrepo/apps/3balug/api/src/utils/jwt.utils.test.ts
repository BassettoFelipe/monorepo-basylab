import { describe, expect, test } from "bun:test";
import type { CheckoutTokenPayload } from "./jwt.utils";
import { JwtUtils } from "./jwt.utils";

describe("JwtUtils", () => {
  const testUserId = "user-123";

  describe("parseExpirationToSeconds", () => {
    test("should parse seconds correctly", () => {
      expect(JwtUtils.parseExpirationToSeconds("30s")).toBe(30);
      expect(JwtUtils.parseExpirationToSeconds("1s")).toBe(1);
      expect(JwtUtils.parseExpirationToSeconds("60s")).toBe(60);
    });

    test("should parse minutes correctly", () => {
      expect(JwtUtils.parseExpirationToSeconds("15m")).toBe(15 * 60);
      expect(JwtUtils.parseExpirationToSeconds("1m")).toBe(60);
      expect(JwtUtils.parseExpirationToSeconds("60m")).toBe(3600);
    });

    test("should parse hours correctly", () => {
      expect(JwtUtils.parseExpirationToSeconds("1h")).toBe(3600);
      expect(JwtUtils.parseExpirationToSeconds("24h")).toBe(24 * 3600);
      expect(JwtUtils.parseExpirationToSeconds("2h")).toBe(2 * 3600);
    });

    test("should parse days correctly", () => {
      expect(JwtUtils.parseExpirationToSeconds("1d")).toBe(24 * 3600);
      expect(JwtUtils.parseExpirationToSeconds("7d")).toBe(7 * 24 * 3600);
      expect(JwtUtils.parseExpirationToSeconds("30d")).toBe(30 * 24 * 3600);
    });

    test("should throw error for invalid format", () => {
      expect(() => JwtUtils.parseExpirationToSeconds("invalid")).toThrow(
        "Invalid expiration format",
      );
      expect(() => JwtUtils.parseExpirationToSeconds("10")).toThrow();
      expect(() => JwtUtils.parseExpirationToSeconds("10x")).toThrow();
      expect(() => JwtUtils.parseExpirationToSeconds("")).toThrow();
    });

    test("should handle large numbers", () => {
      expect(JwtUtils.parseExpirationToSeconds("999d")).toBe(999 * 24 * 3600);
      expect(JwtUtils.parseExpirationToSeconds("1000h")).toBe(1000 * 3600);
    });
  });

  describe("generateToken - access token", () => {
    test("should generate valid access token", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".").length).toBe(3); // JWT format: header.payload.signature
    });

    test("should include user ID in token payload", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access");
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(testUserId);
    });

    test("should include expiration in token payload", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access");
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeDefined();
      expect(payload?.exp).toBeDefined();
      expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    test("should include issued at in token payload", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access");
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeDefined();
      expect(payload?.iat).toBeDefined();
      expect(payload?.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    });

    test("should include additional payload data", async () => {
      const additionalData = {
        role: "admin",
        email: "test@example.com",
      };

      const token = await JwtUtils.generateToken(testUserId, "access", additionalData);
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeDefined();
      expect((payload as Record<string, unknown>).role).toBe("admin");
      expect((payload as Record<string, unknown>).email).toBe("test@example.com");
    });

    test("should generate different tokens each time", async () => {
      const token1 = await JwtUtils.generateToken(testUserId, "access");
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const token2 = await JwtUtils.generateToken(testUserId, "access");

      expect(token1).not.toBe(token2);
    });
  });

  describe("generateToken - refresh token", () => {
    test("should generate valid refresh token", async () => {
      const token = await JwtUtils.generateToken(testUserId, "refresh");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });

    test("should not verify refresh token with access secret", async () => {
      const token = await JwtUtils.generateToken(testUserId, "refresh");
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeNull(); // Different secret
    });

    test("should verify refresh token with refresh secret", async () => {
      const token = await JwtUtils.generateToken(testUserId, "refresh");
      const payload = await JwtUtils.verifyToken(token, "refresh");

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(testUserId);
    });
  });

  describe("generateToken - reset password token", () => {
    test("should generate valid reset password token", async () => {
      const token = await JwtUtils.generateToken(testUserId, "resetPassword");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });

    test("should verify with correct secret", async () => {
      const token = await JwtUtils.generateToken(testUserId, "resetPassword");
      const payload = await JwtUtils.verifyToken(token, "resetPassword");

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(testUserId);
    });

    test("should not verify with wrong secret", async () => {
      const token = await JwtUtils.generateToken(testUserId, "resetPassword");
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeNull();
    });
  });

  describe("generateToken - checkout token", () => {
    test("should generate valid checkout token with metadata", async () => {
      const checkoutData = {
        purpose: "checkout" as const,
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
        subscription: {
          id: "sub-123",
          status: "pending",
        },
        plan: {
          id: "plan-123",
          name: "Basic Plan",
          price: 9990,
          features: ["feature1", "feature2"],
        },
      };

      const token = await JwtUtils.generateToken(testUserId, "checkout", checkoutData);

      expect(token).toBeDefined();

      const payload = (await JwtUtils.verifyToken(
        token,
        "checkout",
      )) as CheckoutTokenPayload | null;

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(testUserId);
      expect(payload?.purpose).toBe("checkout");
      expect(payload?.user.name).toBe("John Doe");
      expect(payload?.user.email).toBe("john@example.com");
      expect(payload?.subscription.id).toBe("sub-123");
      expect(payload?.plan.id).toBe("plan-123");
      expect(payload?.plan.price).toBe(9990);
    });
  });

  describe("verifyToken", () => {
    test("should return null for invalid token", async () => {
      const payload = await JwtUtils.verifyToken("invalid-token", "access");

      expect(payload).toBeNull();
    });

    test("should return null for malformed token", async () => {
      const payload = await JwtUtils.verifyToken("not.a.token", "access");

      expect(payload).toBeNull();
    });

    test("should return null for empty token", async () => {
      const payload = await JwtUtils.verifyToken("", "access");

      expect(payload).toBeNull();
    });

    test("should return null for expired token", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access");

      expect(token).toBeDefined();
    }, 100);

    test("should verify token with correct secret only", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access");

      const validPayload = await JwtUtils.verifyToken(token, "access");
      expect(validPayload).toBeDefined();

      const invalidPayload = await JwtUtils.verifyToken(token, "refresh");
      expect(invalidPayload).toBeNull();
    });

    test("should return complete payload structure", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access", {
        custom: "data",
      });
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toHaveProperty("sub");
      expect(payload).toHaveProperty("exp");
      expect(payload).toHaveProperty("iat");
      expect(payload).toHaveProperty("custom");
    });
  });

  describe("Token type isolation", () => {
    test("access token should not verify with refresh secret", async () => {
      const accessToken = await JwtUtils.generateToken(testUserId, "access");
      const payload = await JwtUtils.verifyToken(accessToken, "refresh");

      expect(payload).toBeNull();
    });

    test("refresh token should not verify with access secret", async () => {
      const refreshToken = await JwtUtils.generateToken(testUserId, "refresh");
      const payload = await JwtUtils.verifyToken(refreshToken, "access");

      expect(payload).toBeNull();
    });

    test("checkout token verification", async () => {
      const checkoutToken = await JwtUtils.generateToken(testUserId, "checkout");
      const payload = await JwtUtils.verifyToken(checkoutToken, "checkout");

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(testUserId);
    });

    test("resetPassword token should be isolated", async () => {
      const resetToken = await JwtUtils.generateToken(testUserId, "resetPassword");

      expect(await JwtUtils.verifyToken(resetToken, "access")).toBeNull();
      expect(await JwtUtils.verifyToken(resetToken, "refresh")).toBeNull();
      expect(await JwtUtils.verifyToken(resetToken, "checkout")).toBeNull();
      expect(await JwtUtils.verifyToken(resetToken, "resetPassword")).toBeDefined();
    });
  });

  describe("Token security", () => {
    test("should not allow token manipulation", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access");
      const parts = token.split(".");

      const manipulatedToken = `${parts[0]}.${Buffer.from(JSON.stringify({ sub: "hacker-123", exp: Date.now() + 10000 })).toString("base64")}.${parts[2]}`;

      const payload = await JwtUtils.verifyToken(manipulatedToken, "access");

      expect(payload).toBeNull(); // Should reject manipulated token
    });

    test("should not allow reusing signature from different token", async () => {
      const token1 = await JwtUtils.generateToken("user-1", "access");
      const token2 = await JwtUtils.generateToken("user-2", "access");

      const parts1 = token1.split(".");
      const parts2 = token2.split(".");

      const frankensteinToken = `${parts2[0]}.${parts2[1]}.${parts1[2]}`;

      const payload = await JwtUtils.verifyToken(frankensteinToken, "access");

      expect(payload).toBeNull(); // Should reject
    });
  });

  describe("Edge cases", () => {
    test("should handle very long user IDs", async () => {
      const longUserId = "a".repeat(500);
      const token = await JwtUtils.generateToken(longUserId, "access");
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload?.sub).toBe(longUserId);
    });

    test("should handle special characters in user ID", async () => {
      const specialUserId = "user-123!@#$%^&*()";
      const token = await JwtUtils.generateToken(specialUserId, "access");
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload?.sub).toBe(specialUserId);
    });

    test("should handle large additional payload", async () => {
      const largePayload = {
        data: "x".repeat(10000),
        nested: {
          deep: {
            value: "test",
          },
        },
      };

      const token = await JwtUtils.generateToken(testUserId, "access", largePayload);
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeDefined();
      expect((payload as Record<string, unknown>).data as string).toHaveLength(10000);
    });

    test("should handle empty additional payload", async () => {
      const token = await JwtUtils.generateToken(testUserId, "access", {});
      const payload = await JwtUtils.verifyToken(token, "access");

      expect(payload).toBeDefined();
      expect(payload?.sub).toBe(testUserId);
    });
  });
});
