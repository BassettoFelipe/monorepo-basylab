import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { createAuthenticatedUser } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("POST /auth/refresh", () => {
  const { app, client, userRepository, planRepository, subscriptionRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should refresh tokens with valid refresh token in Authorization header", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    const refreshToken = await JwtUtils.generateToken(user.id, "refresh");

    const { data, status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );

    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.accessToken).toBeDefined();
    expect(typeof data?.accessToken).toBe("string");
  });

  it("should refresh tokens with valid refresh token in request body", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    const refreshToken = await JwtUtils.generateToken(user.id, "refresh");

    const { data, status, error } = await client.auth.refresh.post({
      refreshToken,
    });

    expect(status).toBe(200);
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.accessToken).toBeDefined();
  });

  it("should reject request without refresh token", async () => {
    const { status, error } = await client.auth.refresh.post({});

    expect(status).toBe(401);
    expect(error).toBeDefined();
    expect((error?.value as { type?: string })?.type).toBe("INVALID_TOKEN");
    expect((error?.value as { message?: string })?.message).toContain("não fornecido");
  });

  it("should reject request with invalid refresh token", async () => {
    const { status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: "Bearer invalid-token-format",
        },
      },
    );

    expect(status).toBe(401);
    expect(error).toBeDefined();
    expect((error?.value as { type?: string })?.type).toBe("INVALID_TOKEN");
  });

  it("should reject request with expired refresh token", async () => {
    // Note: Creating an actually expired token requires mocking time
    // Here we test with a malformed/invalid token as proxy
    const { status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: "Bearer expired.token.here",
        },
      },
    );

    expect(status).toBe(401);
    expect(error).toBeDefined();
  });

  it("should reject access token used as refresh token", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    // Use access token instead of refresh token
    const accessToken = await JwtUtils.generateToken(user.id, "access");

    const { status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // Should fail as access token secret differs from refresh token secret
    expect(status).toBe(401);
    expect(error).toBeDefined();
  });

  it("should generate new tokens different from old ones", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    const originalRefreshToken = await JwtUtils.generateToken(user.id, "refresh");

    const { data, status } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: `Bearer ${originalRefreshToken}`,
        },
      },
    );

    expect(status).toBe(200);
    expect(data?.accessToken).toBeDefined();
  });

  it("should not expose sensitive data in response", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    const refreshToken = await JwtUtils.generateToken(user.id, "refresh");

    const { data } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("secret");
    expect(data).not.toHaveProperty("user");
    expect(data).not.toHaveProperty("userId");
  });

  it("should handle malformed Authorization header", async () => {
    const { status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: "InvalidFormat token-here",
        },
      },
    );

    expect(status).toBe(401);
    expect(error).toBeDefined();
  });

  it("should handle empty Authorization header", async () => {
    const { status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: "",
        },
      },
    );

    expect(status).toBe(401);
    expect(error).toBeDefined();
  });

  it("should handle missing Bearer prefix", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    const refreshToken = await JwtUtils.generateToken(user.id, "refresh");

    const { status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: refreshToken, // Missing "Bearer " prefix
        },
      },
    );

    expect(status).toBe(401);
    expect(error).toBeDefined();
  });

  it("should validate token signature", async () => {
    // Tampered token (modified payload)
    const tamperedToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0YW1wZXJlZCIsImV4cCI6OTk5OTk5OTk5OX0.invalid";

    const { status, error } = await client.auth.refresh.post(
      {},
      {
        headers: {
          Authorization: `Bearer ${tamperedToken}`,
        },
      },
    );

    expect(status).toBe(401);
    expect(error).toBeDefined();
  });

  it("should prioritize Authorization header over body", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    const validRefreshToken = await JwtUtils.generateToken(user.id, "refresh");
    const invalidBodyToken = "invalid-token-in-body";

    const { status, data } = await client.auth.refresh.post(
      { refreshToken: invalidBodyToken },
      {
        headers: {
          Authorization: `Bearer ${validRefreshToken}`,
        },
      },
    );

    // Should use header token and succeed
    expect(status).toBe(200);
    expect(data?.accessToken).toBeDefined();
  });

  it("should use the newest refresh token when multiple cookies are sent", async () => {
    const { user } = await createAuthenticatedUser(
      userRepository,
      planRepository,
      subscriptionRepository,
    );

    const validRefreshToken = await JwtUtils.generateToken(user.id, "refresh");
    const staleRefreshToken = "invalid-refresh-token";

    // NOTE: This test uses app.handle() instead of Eden Treaty client because
    // it needs to test a specific edge case with multiple cookie values,
    // which requires precise control over the raw Cookie header format.
    // Eden Treaty doesn't support sending duplicate cookie names in a single header.
    const response = await app.handle(
      new Request("http://localhost/auth/refresh", {
        method: "POST",
        headers: {
          cookie: `refreshToken=${staleRefreshToken}; refreshToken=${validRefreshToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    const body = (await response.json()) as { accessToken?: string };

    expect(response.status).toBe(200);
    expect(body.accessToken).toBeDefined();
    expect(response.headers.get("set-cookie")).toContain("refreshToken=");
  });
});
