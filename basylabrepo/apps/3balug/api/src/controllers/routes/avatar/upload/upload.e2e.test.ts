import { beforeEach, describe, expect, it } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /avatar", () => {
  const { client, userRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  async function createAuthenticatedUser() {
    const email = generateTestEmail("avatar-user");
    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Avatar Test User",
      isEmailVerified: true,
      isActive: true,
    });

    const token = await JwtUtils.generateToken(user.id, "access", {});

    return { user, token };
  }

  describe("Authentication", () => {
    it("should return 401 when no auth token provided", async () => {
      const file = new File(["test"], "avatar.png", { type: "image/png" });

      const { status } = await client.avatar.post({
        file,
      });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const file = new File(["test"], "avatar.png", { type: "image/png" });

      const { status } = await client.avatar.post(
        {
          file,
        },
        {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      );

      expect(status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should return 422 when no file provided", async () => {
      const { token } = await createAuthenticatedUser();

      const { status } = await client.avatar.post({} as { file: File }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(status).toBe(422);
    });

    it("should return 422 for invalid file type", async () => {
      const { token } = await createAuthenticatedUser();
      const file = new File(["test"], "document.pdf", {
        type: "application/pdf",
      });

      const { status } = await client.avatar.post(
        {
          file,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(422);
    });
  });
});
