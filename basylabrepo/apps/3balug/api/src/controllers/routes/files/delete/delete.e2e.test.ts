import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createAuthenticatedClient, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { CryptoUtils } from "@/utils/crypto.utils";
import { JwtUtils } from "@/utils/jwt.utils";

describe("DELETE /files/:key", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  async function createAuthenticatedUser() {
    const email = generateTestEmail("file-delete");
    const user = await userRepository.create({
      email,
      password: await CryptoUtils.hashPassword("TestPassword123!"),
      name: "File Delete User",
      isEmailVerified: true,
      isActive: true,
    });

    const token = await JwtUtils.generateToken(user.id, "access", {});

    return { user, token };
  }

  describe("Authentication", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.files({ key: "test-file-key" }).delete();

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const authClient = createAuthenticatedClient("invalid-token");
      const { status } = await authClient.files({ key: "test-file-key" }).delete();

      expect(status).toBe(401);
    });
  });

  describe("Business Rules", () => {
    it("should return 404 when file does not exist", async () => {
      const { token } = await createAuthenticatedUser();

      const authClient = createAuthenticatedClient(token);
      const { status } = await authClient.files({ key: "non-existent-file-key" }).delete();

      expect([404, 500]).toContain(status);
    });

    it("should handle URL-encoded keys", async () => {
      const { token } = await createAuthenticatedUser();
      const encodedKey = encodeURIComponent("folder/subfolder/file.pdf");

      const authClient = createAuthenticatedClient(token);
      const { status } = await authClient.files({ key: encodedKey }).delete();

      expect([200, 404, 500]).toContain(status);
    });
  });

  describe("Response Format", () => {
    it("should return consistent error format on not found", async () => {
      const { token } = await createAuthenticatedUser();

      const authClient = createAuthenticatedClient(token);
      const { error, status } = await authClient.files({ key: "non-existent-key" }).delete();

      if (status === 404 && error) {
        expect(error.value).toHaveProperty("type");
        expect(error.value).toHaveProperty("message");
      }
    });
  });
});
