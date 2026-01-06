import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";

describe("POST /auth/logout", () => {
  const { client } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should logout successfully", async () => {
    // The logout endpoint doesn't require authentication in current implementation
    // This is a basic endpoint that returns success
    const { data, status, error } = await client.auth.logout.post();

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.success).toBe(true);
    expect(data?.message).toContain("Logout realizado com sucesso");
  });

  it("should logout without authentication", async () => {
    // Current implementation allows logout without auth
    // This is valid as logout is idempotent
    const { data, status, error } = await client.auth.logout.post();

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data?.success).toBe(true);
  });

  it("should not expose sensitive data in response", async () => {
    const { data } = await client.auth.logout.post();

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("secret");
    expect(responseString).not.toContain("token");
  });

  it("should return consistent response format", async () => {
    const { data } = await client.auth.logout.post();

    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("message");
    expect(data?.success).toBe(true);
    expect(typeof data?.message).toBe("string");
  });

  it("should handle multiple logout calls idempotently", async () => {
    // Call logout multiple times
    const response1 = await client.auth.logout.post();
    const response2 = await client.auth.logout.post();
    const response3 = await client.auth.logout.post();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response3.status).toBe(200);

    expect(response1.data?.success).toBe(true);
    expect(response2.data?.success).toBe(true);
    expect(response3.data?.success).toBe(true);
  });

  it("should complete successfully even without prior login", async () => {
    // Logout should succeed even if user was never logged in
    const { data, status } = await client.auth.logout.post();

    expect(status).toBe(200);
    expect(data?.success).toBe(true);
  });
});
