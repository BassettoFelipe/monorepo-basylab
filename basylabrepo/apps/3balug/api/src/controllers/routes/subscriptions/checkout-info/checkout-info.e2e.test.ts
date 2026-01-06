import { beforeEach, describe, expect, it } from "bun:test";
import { PasswordUtils } from "@basylab/core/crypto";
import { clearTestData, createTestApp } from "@/test/setup";
import { addDays, generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /subscriptions/checkout-info", () => {
  const { client, userRepository, planRepository, subscriptionRepository } = createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  /**
   * Helper function to create a user with pending subscription and checkout token
   */
  async function createPendingSubscriptionSetup() {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];
    const email = generateTestEmail("checkout-info");
    const password = "TestPassword123!";

    // Create verified user
    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash(password),
      name: "Test User",
      isEmailVerified: true,
    });

    // Create pending subscription
    const subscription = await subscriptionRepository.create({
      userId: user.id,
      planId: testPlan.id,
      status: "pending",

      endDate: undefined,
    });

    // Generate checkout token
    const checkoutToken = await JwtUtils.generateToken(user.id, "checkout", {
      purpose: "checkout",
      user: {
        name: user.name,
        email: user.email,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
      plan: {
        id: testPlan.id,
        name: testPlan.name,
        price: testPlan.price,
        features: testPlan.features,
      },
    });

    return { user, subscription, checkoutToken, plan: testPlan };
  }

  it("should retrieve checkout info successfully with valid token", async () => {
    const { user, subscription, checkoutToken, plan } = await createPendingSubscriptionSetup();

    const { data, status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(200);
    expect(error).toBeFalsy();
    expect(data).toBeDefined();
    expect(data?.user).toBeDefined();
    expect(data?.user.name).toBe(user.name);
    expect(data?.user.email).toBe(user.email);
    expect(data?.subscription).toBeDefined();
    expect(data?.subscription.id).toBe(subscription.id);
    expect(data?.subscription.status).toBe("pending");
    expect(data?.plan).toBeDefined();
    expect(data?.plan.id).toBe(plan.id);
    expect(data?.plan.name).toBe(plan.name);
    expect(data?.plan.price).toBe(plan.price);
  });

  it("should reject request without authorization header", async () => {
    const { status, error } = await client.subscriptions["checkout-info"].get();

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("BAD_REQUEST");
  });

  it("should reject request with malformed authorization header", async () => {
    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: "InvalidFormat",
      },
    });

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("BAD_REQUEST");
  });

  it("should reject request with invalid token", async () => {
    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: "Bearer invalid_token",
      },
    });

    expect(status).toBe(401);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("INVALID_TOKEN");
  });

  it("should reject access token instead of checkout token", async () => {
    const { user } = await createPendingSubscriptionSetup();

    // Generate access token instead of checkout token
    const accessToken = await JwtUtils.generateToken(user.id, "access");

    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(status).toBe(401);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("INVALID_TOKEN");
  });

  it("should reject if user email is not verified", async () => {
    const plans = await planRepository.findAll();
    const testPlan = plans[0];
    const email = generateTestEmail("unverified");

    // Create unverified user
    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Unverified User",
      isEmailVerified: false,
      verificationSecret: "secret",
      verificationExpiresAt: new Date(Date.now() + 3600000),
    });

    // Create pending subscription
    const subscription = await subscriptionRepository.create({
      userId: user.id,
      planId: testPlan.id,
      status: "pending",

      endDate: undefined,
    });

    // Generate checkout token
    const checkoutToken = await JwtUtils.generateToken(user.id, "checkout", {
      purpose: "checkout",
      user: {
        name: user.name,
        email: user.email,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
      plan: {
        id: testPlan.id,
        name: testPlan.name,
        price: testPlan.price,
        features: testPlan.features,
      },
    });

    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("EMAIL_NOT_VERIFIED");
  });

  it("should reject if subscription is already active", async () => {
    const { user, subscription, plan } = await createPendingSubscriptionSetup();

    // Update subscription to active
    await subscriptionRepository.update(subscription.id, {
      status: "active",
      startDate: new Date(),
      endDate: addDays(new Date(), plan.durationDays),
    });

    // Generate checkout token with active status
    const checkoutToken = await JwtUtils.generateToken(user.id, "checkout", {
      purpose: "checkout",
      user: {
        name: user.name,
        email: user.email,
      },
      subscription: {
        id: subscription.id,
        status: "active",
      },
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        features: plan.features,
      },
    });

    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(400);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("OPERATION_NOT_ALLOWED");
  });

  it("should return 404 if user not found", async () => {
    const plans = await planRepository.findAll();
    const fakeUserId = "550e8400-e29b-41d4-a716-446655440000";

    // Generate checkout token with fake user ID
    const checkoutToken = await JwtUtils.generateToken(fakeUserId, "checkout", {
      purpose: "checkout",
      user: {
        name: "Fake User",
        email: "fake@example.com",
      },
      subscription: {
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: "pending",
      },
      plan: {
        id: plans[0].id,
        name: plans[0].name,
        price: plans[0].price,
        features: plans[0].features,
      },
    });

    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(404);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("USER_NOT_FOUND");
  });

  it("should return 404 if subscription not found", async () => {
    const plans = await planRepository.findAll();
    const email = generateTestEmail("no-subscription");

    // Create user without subscription
    const user = await userRepository.create({
      email,
      password: await PasswordUtils.hash("TestPassword123!"),
      name: "Test User",
      isEmailVerified: true,
    });

    // Generate checkout token with fake subscription ID
    const fakeSubscriptionId = "550e8400-e29b-41d4-a716-446655440000";
    const checkoutToken = await JwtUtils.generateToken(user.id, "checkout", {
      purpose: "checkout",
      user: {
        name: user.name,
        email: user.email,
      },
      subscription: {
        id: fakeSubscriptionId,
        status: "pending",
      },
      plan: {
        id: plans[0].id,
        name: plans[0].name,
        price: plans[0].price,
        features: plans[0].features,
      },
    });

    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(404);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("SUBSCRIPTION_NOT_FOUND");
  });

  it("should include plan features in response", async () => {
    const { checkoutToken } = await createPendingSubscriptionSetup();

    const { data, status } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(200);
    expect(data?.plan.features).toBeDefined();
    expect(Array.isArray(data?.plan.features)).toBe(true);
    expect(data?.plan.features.length).toBeGreaterThan(0);
  });

  it("should not expose sensitive data in response", async () => {
    const { checkoutToken } = await createPendingSubscriptionSetup();

    const { data } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    const responseString = JSON.stringify(data);
    expect(responseString).not.toContain("password");
    expect(responseString).not.toContain("verificationSecret");
  });

  it("should return user information from token", async () => {
    const { user, checkoutToken } = await createPendingSubscriptionSetup();

    const { data, status } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(200);
    expect(data?.user).toBeDefined();
    expect(data?.user.name).toBe(user.name);
    expect(data?.user.email).toBe(user.email);
  });

  it("should return subscription information from token", async () => {
    const { subscription, checkoutToken } = await createPendingSubscriptionSetup();

    const { data, status } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(200);
    expect(data?.subscription).toBeDefined();
    expect(data?.subscription.id).toBe(subscription.id);
    expect(data?.subscription.status).toBe("pending");
  });

  it("should return plan information from token", async () => {
    const { plan, checkoutToken } = await createPendingSubscriptionSetup();

    const { data, status } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    });

    expect(status).toBe(200);
    expect(data?.plan).toBeDefined();
    expect(data?.plan.id).toBe(plan.id);
    expect(data?.plan.name).toBe(plan.name);
    expect(data?.plan.price).toBe(plan.price);
  });

  it("should handle concurrent requests with same token", async () => {
    const { checkoutToken } = await createPendingSubscriptionSetup();

    const requests = [
      client.subscriptions["checkout-info"].get({
        headers: { Authorization: `Bearer ${checkoutToken}` },
      }),
      client.subscriptions["checkout-info"].get({
        headers: { Authorization: `Bearer ${checkoutToken}` },
      }),
      client.subscriptions["checkout-info"].get({
        headers: { Authorization: `Bearer ${checkoutToken}` },
      }),
    ];

    const results = await Promise.all(requests);

    // All requests should succeed
    for (const { status, data } of results) {
      expect(status).toBe(200);
      expect(data).toBeDefined();
    }

    // All requests should return the same data
    const firstData = results[0].data;
    for (let i = 1; i < results.length; i++) {
      expect(results[i].data?.user.email).toBe(firstData?.user.email);
      expect(results[i].data?.subscription.id).toBe(firstData?.subscription.id);
      expect(results[i].data?.plan.id).toBe(firstData?.plan.id);
    }
  });

  it("should reject token with wrong purpose field", async () => {
    const { user } = await createPendingSubscriptionSetup();

    // Generate checkout token with wrong purpose
    const wrongPurposeToken = await JwtUtils.generateToken(user.id, "checkout", {
      purpose: "wrong-purpose", // Should be "checkout"
      user: {
        name: user.name,
        email: user.email,
      },
    });

    const { status, error } = await client.subscriptions["checkout-info"].get({
      headers: {
        Authorization: `Bearer ${wrongPurposeToken}`,
      },
    });

    expect(status).toBe(401);
    expect(error).toBeDefined();
    expect(error?.value.type as any).toBe("INVALID_TOKEN");
  });
});
