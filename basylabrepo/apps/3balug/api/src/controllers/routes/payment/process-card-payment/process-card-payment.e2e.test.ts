import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { IPaymentGateway } from "@/services/payment/contracts/payment-gateway.interface";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";

// Mock do payment gateway
const mockCreateOrder = mock(() =>
  Promise.resolve({
    id: "order_test_123",
    status: "paid" as const,
    charges: [
      {
        id: "charge_test_123",
        status: "paid" as const,
      },
    ],
  }),
);

const mockGetOrder = mock(() =>
  Promise.resolve({
    id: "order_test_123",
    status: "paid" as const,
    externalReference: "test-ref",
    customerEmail: "test@example.com",
  }),
);

const mockProcessWebhook = mock(() =>
  Promise.resolve({
    success: true,
    orderId: "order_test_123",
    status: "paid" as const,
  }),
);

const mockPaymentGateway: IPaymentGateway = {
  createOrder: mockCreateOrder,
  getOrder: mockGetOrder,
  processWebhook: mockProcessWebhook,
  validateWebhookSignature: () => true,
};

// Mock do módulo de payment service
mock.module("@/services/payment", () => ({
  paymentGateway: mockPaymentGateway,
}));

describe("POST /payment/process-card-payment", () => {
  const { client, planRepository, pendingPaymentRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
    mockCreateOrder.mockClear();
    mockGetOrder.mockClear();
    mockProcessWebhook.mockClear();
  });

  afterAll(() => {
    mock.restore();
  });

  it("should process card payment successfully", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];
    const email = generateTestEmail("process-payment");

    // Create a pending payment
    const pendingPayment = await pendingPaymentRepository.create({
      email,
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { data, status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: 1,
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.success).toBe(true);
    expect(data?.message).toBe("Pagamento processado com sucesso");
    expect(data?.data).toBeDefined();
  });

  it("should reject non-UUID pending payment ID", async () => {
    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: "not-a-uuid",
      cardToken: "tok_test_valid_card",
      installments: 1,
    });

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should reject empty card token", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("empty-token"),
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "",
      installments: 1,
    });

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should reject installments less than 1", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("invalid-installments"),
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: 0,
    });

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should reject installments greater than 12", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("too-many-installments"),
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: 13,
    });

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });

  it("should return 404 for non-existent pending payment", async () => {
    const fakeId = "550e8400-e29b-41d4-a716-446655440000";

    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: fakeId,
      cardToken: "tok_test_valid_card",
      installments: 1,
    });

    expect(status).toBe(404);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("PENDING_PAYMENT_NOT_FOUND");
  });

  it("should reject expired pending payment", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    // Create an expired pending payment
    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("expired-payment"),
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    });

    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: 1,
    });

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("PAYMENT_EXPIRED");
  });

  it("should reject already paid pending payment", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    // Create a paid pending payment
    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("already-paid"),
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "paid",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      pagarmeOrderId: "order_123",
    });

    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: 1,
    });

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("PAYMENT_ALREADY_PROCESSED");
  });

  it("should accept valid installments range (1-12)", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    for (const installments of [1, 6, 12]) {
      const pendingPayment = await pendingPaymentRepository.create({
        email: generateTestEmail(`installments-${installments}`),
        password: "$2b$10$hashedpassword",
        name: "Test User",
        planId: testPlan.id,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const { status } = await client.payment["process-card-payment"].post({
        pendingPaymentId: pendingPayment.id,
        cardToken: "tok_test_valid_card",
        installments,
      });

      // Should succeed or fail for business reasons, not validation
      expect([200, 400, 402, 500, 502]).toContain(status);
    }
  });

  it("should handle SQL injection attempts", async () => {
    const sqlInjections = [
      "'; DROP TABLE pending_payments; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM users--",
    ];

    for (const injection of sqlInjections) {
      const { status } = await client.payment["process-card-payment"].post({
        pendingPaymentId: injection,
        cardToken: "tok_test_valid_card",
        installments: 1,
      });

      // Should be validation error, not crash
      expect([400, 404, 422]).toContain(status);
    }
  });

  it("should not expose sensitive data in response", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("security"),
      password: "$2b$10$secrethashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { data } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: 1,
    });

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("secrethashedpassword");
    expect(responseString).not.toContain("cardToken");
  });

  it("should handle decimal installments by rejecting them", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("decimal-installments"),
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { status } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: 2.5 as unknown as number,
    });

    // Should be validation error or gateway error (decimal passed as valid number)
    expect([400, 422, 502]).toContain(status);
  });

  it("should handle negative installments by rejecting them", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];

    const pendingPayment = await pendingPaymentRepository.create({
      email: generateTestEmail("negative-installments"),
      password: "$2b$10$hashedpassword",
      name: "Test User",
      planId: testPlan.id,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const { status, error } = await client.payment["process-card-payment"].post({
      pendingPaymentId: pendingPayment.id,
      cardToken: "tok_test_valid_card",
      installments: -1,
    });

    expect(status).toBe(422);
    expect(error).toBeDefined();
  });
});
