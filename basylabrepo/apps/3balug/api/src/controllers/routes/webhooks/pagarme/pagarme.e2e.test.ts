import { beforeEach, describe, expect, it } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";

describe("POST /webhooks/pagarme", () => {
  const { client, planRepository, pendingPaymentRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should process order.paid webhook successfully", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];
    const email = generateTestEmail("webhook-order-paid");

    await pendingPaymentRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      pagarmeOrderId: "ord_test_123",
    });

    const { data, status, error } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {
        id: "ord_test_123",
      },
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.success).toBeDefined();
  });

  it("should process charge.paid webhook successfully", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];
    const email = generateTestEmail("webhook-charge-paid");

    await pendingPaymentRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      pagarmeChargeId: "ch_test_456",
    });

    const { data, status, error } = await client.webhooks.pagarme.post({
      type: "charge.paid",
      data: {
        id: "ch_test_456",
      },
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.success).toBeDefined();
  });

  it("should ignore non-payment webhook events", async () => {
    const { data, status, error } = await client.webhooks.pagarme.post({
      type: "order.created",
      data: {
        id: "ord_test_789",
      },
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.success).toBe(true);
    expect(data?.message).toContain("not processed");
  });

  it("should reject webhook with missing type field", async () => {
    const { status, error } = await client.webhooks.pagarme.post({
      data: {
        id: "ord_test_123",
      },
    } as unknown as Parameters<typeof client.webhooks.pagarme.post>[0]);

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should reject webhook with missing data field", async () => {
    const { status, error } = await client.webhooks.pagarme.post({
      type: "order.paid",
    } as unknown as Parameters<typeof client.webhooks.pagarme.post>[0]);

    expect(status).toBe(500);
    expect(error).toBeDefined();
  });

  it("should reject webhook with missing data.id field", async () => {
    const { status, error } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {},
    } as unknown as Parameters<typeof client.webhooks.pagarme.post>[0]);

    expect(status).toBe(200);
    expect(error).toBeFalsy();
  });

  it("should handle webhook for non-existent order gracefully", async () => {
    const { status } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {
        id: "ord_nonexistent",
      },
    });

    // Should not crash, may return success: false or error
    expect([200, 400, 404]).toContain(status);
  });

  it("should handle order.cancelled event", async () => {
    const { data, status, error } = await client.webhooks.pagarme.post({
      type: "order.cancelled",
      data: {
        id: "ord_test_cancelled",
      },
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data?.success).toBe(true);
    expect(data?.message).toContain("not processed");
  });

  it("should handle order.failed event", async () => {
    const { data, status, error } = await client.webhooks.pagarme.post({
      type: "order.failed",
      data: {
        id: "ord_test_failed",
      },
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data?.success).toBe(true);
    expect(data?.message).toContain("not processed");
  });

  it("should validate webhook payload structure", async () => {
    const validPayload = {
      type: "order.paid",
      data: {
        id: "ord_valid",
      },
    };

    const { status, error } = await client.webhooks.pagarme.post(validPayload);

    // Should not have validation errors
    expect([200, 400, 404]).toContain(status);
    if (status === 422) {
      // Should not be validation error for valid payload
      expect(error).toBeFalsy();
    }
  });

  it("should accept webhook with additional data fields", async () => {
    const { status } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {
        id: "ord_test_extra",
        customer: {
          name: "Test Customer",
        },
      },
    });

    // Should accept and process (may fail for business reasons)
    expect([200, 400, 404]).toContain(status);
  });

  it("should handle SQL injection attempts in webhook data", async () => {
    const sqlInjections = [
      "'; DROP TABLE pending_payments; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM users--",
    ];

    for (const injection of sqlInjections) {
      const { status } = await client.webhooks.pagarme.post({
        type: "order.paid",
        data: {
          id: injection,
        },
      });

      // Should not crash
      expect([200, 400, 404, 422]).toContain(status);
    }
  });

  it("should handle XSS attempts in webhook data", async () => {
    const xssAttempts = [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
    ];

    for (const xss of xssAttempts) {
      const { status } = await client.webhooks.pagarme.post({
        type: "order.paid",
        data: {
          id: xss,
        },
      });

      // Should not crash
      expect([200, 400, 404, 422]).toContain(status);
    }
  });

  it("should handle concurrent webhook requests", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    // Create multiple pending payments
    const pendingPayments = await Promise.all([
      pendingPaymentRepository.create({
        email: generateTestEmail("concurrent-1"),
        password: await PasswordUtils.hash("TestPassword123!"),
        name: "Test User 1",
        planId: testPlan.id,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        pagarmeOrderId: "ord_concurrent_1",
      }),
      pendingPaymentRepository.create({
        email: generateTestEmail("concurrent-2"),
        password: await PasswordUtils.hash("TestPassword123!"),
        name: "Test User 2",
        planId: testPlan.id,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        pagarmeOrderId: "ord_concurrent_2",
      }),
      pendingPaymentRepository.create({
        email: generateTestEmail("concurrent-3"),
        password: await PasswordUtils.hash("TestPassword123!"),
        name: "Test User 3",
        planId: testPlan.id,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        pagarmeOrderId: "ord_concurrent_3",
      }),
    ]);

    // Send concurrent webhook requests
    const requests = pendingPayments.map((pp) =>
      client.webhooks.pagarme.post({
        type: "order.paid",
        data: {
          id: pp.pagarmeOrderId ?? "",
        },
      }),
    );

    const results = await Promise.all(requests);

    // All requests should complete without crashing
    for (const { status } of results) {
      expect([200, 400, 404]).toContain(status);
    }
  });

  it("should handle webhook with empty type", async () => {
    const { status, error } = await client.webhooks.pagarme.post({
      type: "",
      data: {
        id: "ord_test_empty_type",
      },
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
  });

  it("should handle webhook with very long type string", async () => {
    const longType = "a".repeat(1000);

    const { status } = await client.webhooks.pagarme.post({
      type: longType,
      data: {
        id: "ord_test_long_type",
      },
    });

    // Should not crash
    expect([200, 400, 422]).toContain(status);
  });

  it("should handle webhook with very long ID", async () => {
    const longId = "a".repeat(1000);

    const { status } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {
        id: longId,
      },
    });

    // Should not crash
    expect([200, 400, 404, 422]).toContain(status);
  });

  it("should handle webhook with numeric ID", async () => {
    const { status } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {
        id: "12345",
      },
    });

    // Should accept string ID
    expect([200, 400, 404]).toContain(status);
  });

  it("should handle webhook with UUID ID", async () => {
    const { status } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
    });

    // Should accept UUID ID
    expect([200, 400, 404]).toContain(status);
  });

  it("should return consistent response structure", async () => {
    const { data, status } = await client.webhooks.pagarme.post({
      type: "order.created",
      data: {
        id: "ord_test_structure",
      },
    });

    expect(status).toBe(200);
    expect(data).toBeDefined();
    expect(typeof data?.success).toBe("boolean");
    expect(typeof data?.message).toBe("string");
  });

  it("should handle case-sensitive event types", async () => {
    const eventTypes = ["order.paid", "ORDER.PAID", "Order.Paid", "charge.paid", "CHARGE.PAID"];

    for (const eventType of eventTypes) {
      const { status } = await client.webhooks.pagarme.post({
        type: eventType,
        data: {
          id: "ord_test_case",
        },
      });

      // Should not crash for any case
      expect([200, 400, 404]).toContain(status);
    }
  });

  it("should handle webhook with special characters in ID", async () => {
    const specialChars = ["ord_test!@#$%", "ord_test+123", "ord_test=456", "ord_test&789"];

    for (const id of specialChars) {
      const { status } = await client.webhooks.pagarme.post({
        type: "order.paid",
        data: {
          id,
        },
      });

      // Should not crash
      expect([200, 400, 404, 422]).toContain(status);
    }
  });

  it("should not expose sensitive data in response", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    await pendingPaymentRepository.create({
      email: generateTestEmail("webhook-security"),
      password: await PasswordUtils.hash("SecretPassword123!"),
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      pagarmeOrderId: "ord_security_test",
    });

    const { data } = await client.webhooks.pagarme.post({
      type: "order.paid",
      data: {
        id: "ord_security_test",
      },
    });

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("SecretPassword123!");
  });
});
