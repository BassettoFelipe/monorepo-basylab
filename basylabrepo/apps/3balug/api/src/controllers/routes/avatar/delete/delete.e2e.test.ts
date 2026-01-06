import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createAuthenticatedClient, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { CryptoUtils } from "@/utils/crypto.utils";
import { JwtUtils } from "@/utils/jwt.utils";

describe("DELETE /avatar", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  async function createAuthenticatedUser(hasAvatar = false) {
    const email = generateTestEmail("avatar-delete");
    const user = await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "Avatar Delete User",
      isEmailVerified: true,
      isActive: true,
      avatarUrl: hasAvatar ? "https://storage.example.com/avatars/test.png" : null,
    });

    const token = await JwtUtils.generateToken(user.id, "access", {});

    return { user, token };
  }

  describe("Authentication", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.avatar.delete();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.avatar.delete({
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(status).toBe(401);
    });
  });

  describe("Business Rules", () => {
    it("should return 200 when user has no avatar (idempotent operation)", async () => {
      const { token } = await createAuthenticatedUser(false);

      const authClient = createAuthenticatedClient(token);
      const { status, data } = await authClient.avatar.delete();

      // Deleting a non-existent avatar is idempotent - returns success
      expect(status).toBe(200);
      expect(data?.success).toBe(true);
    });
  });

  describe("Response Format", () => {
    it("should return consistent response format on success", async () => {
      const { token } = await createAuthenticatedUser(false);

      const authClient = createAuthenticatedClient(token);
      const { status, data } = await authClient.avatar.delete();

      expect(status).toBe(200);
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
    });
  });
});
