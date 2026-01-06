import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";

describe("GET /plans/:id", () => {
  const { client, planRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should retrieve a plan by ID successfully", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const { data, status, error } = await client.plans({ id: testPlan.id }).get();

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.id).toBe(testPlan.id);
    expect(data?.name).toBe(testPlan.name);
    expect(data?.slug).toBe(testPlan.slug);
    expect(data?.price).toBe(testPlan.price);
    expect(data?.maxUsers).toBe(testPlan.maxUsers);
    expect(data?.maxManagers).toBe(testPlan.maxManagers);
    expect(data?.maxSerasaQueries).toBe(testPlan.maxSerasaQueries);
    expect(data?.features).toBeDefined();
    expect(Array.isArray(data?.features)).toBe(true);
  });

  it("should return 404 for non-existent plan", async () => {
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";

    const { status, error } = await client.plans({ id: fakeId }).get();

    expect(status).toBe(404);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("PLAN_NOT_FOUND");
  });

  it("should return 404 for invalid UUID format", async () => {
    const invalidId = "not-a-uuid";

    const { status, error } = await client.plans({ id: invalidId }).get();

    expect(status).toBe(404);
    expect(error).toBeDefined();
  });

  it("should include all plan features", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const { data, status } = await client.plans({ id: testPlan.id }).get();

    expect(status).toBe(200);
    expect(data?.features).toBeDefined();
    expect(Array.isArray(data?.features)).toBe(true);
    expect(data?.features.length).toBeGreaterThan(0);
  });

  it("should return consistent data structure for all plans", async () => {
    const plans = await planRepository.findAll();

    for (const plan of plans) {
      const { data, status } = await client.plans({ id: plan.id }).get();

      expect(status).toBe(200);
      expect(data).toBeDefined();
      expect(data?.id).toBeDefined();
      expect(data?.name).toBeDefined();
      expect(data?.slug).toBeDefined();
      expect(data?.price).toBeDefined();
      expect(data?.maxUsers).toBeDefined();
      expect(data?.maxManagers).toBeDefined();
      expect(data?.maxSerasaQueries).toBeDefined();
      expect(data?.features).toBeDefined();
      expect(Array.isArray(data?.features)).toBe(true);
    }
  });

  it("should handle SQL injection attempts in ID parameter", async () => {
    const sqlInjections = [
      "'; DROP TABLE plans; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM users--",
    ];

    for (const injection of sqlInjections) {
      const { status } = await client.plans({ id: injection }).get();

      // Should be 404 or validation error, not crash
      expect([400, 404, 422]).toContain(status);
    }
  });

  it("should not expose internal database fields", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const { data } = await client.plans({ id: testPlan.id }).get();

    // Check that response doesn't contain unexpected internal fields
    const allowedFields = [
      "id",
      "name",
      "slug",
      "description",
      "price",
      "maxUsers",
      "maxManagers",
      "maxSerasaQueries",
      "allowsLateCharges",
      "features",
      "createdAt",
      "updatedAt",
    ];

    // Ensure response has expected structure
    expect(data).toBeDefined();
    for (const key of Object.keys(data || {})) {
      expect(allowedFields).toContain(key);
    }
  });

  it("should return price as integer (cents)", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const { data, status } = await client.plans({ id: testPlan.id }).get();

    expect(status).toBe(200);
    expect(typeof data?.price).toBe("number");
    expect(Number.isInteger(data?.price)).toBe(true);
    expect(data?.price).toBeGreaterThan(0);
  });

  it("should return maxUsers as positive integer", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const { data, status } = await client.plans({ id: testPlan.id }).get();

    expect(status).toBe(200);
    expect(typeof data?.maxUsers).toBe("number");
    expect(Number.isInteger(data?.maxUsers)).toBe(true);
    expect(data?.maxUsers).toBeGreaterThan(0);
  });

  it("should return valid slug format", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const { data, status } = await client.plans({ id: testPlan.id }).get();

    expect(status).toBe(200);
    expect(data?.slug).toBeDefined();
    expect(typeof data?.slug).toBe("string");
    // Slug should be lowercase, alphanumeric with hyphens
    expect(data?.slug).toMatch(/^[a-z0-9-]+$/);
  });
});
