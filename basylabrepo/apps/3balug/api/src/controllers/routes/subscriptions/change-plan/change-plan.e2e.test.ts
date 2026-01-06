import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("PATCH /subscriptions/change-plan", () => {
  const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
    createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  async function createUserWithPendingSubscription(planSlug: string) {
    const plan = await planRepository.findBySlug(planSlug);
    if (!plan) throw new Error(`Plan ${planSlug} not found`);

    const company = await companyRepository.create({
      name: "Test Company",
      email: generateTestEmail("company"),
    });

    const user = await userRepository.create({
      email: generateTestEmail("owner"),
      password: "hashed-password",
      name: "Test Owner",
      role: "owner",
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    await companyRepository.update(company.id, {
      ownerId: user.id,
    });

    const subscription = await subscriptionRepository.create({
      userId: user.id,
      planId: plan.id,
      status: "pending",
      startDate: new Date(),
    });

    const token = await JwtUtils.generateToken(user.id, "access", {
      role: "owner",
      companyId: company.id,
    });

    return { user, company, plan, subscription, token };
  }

  describe("Authentication", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.subscriptions["change-plan"].patch({
        planId: "00000000-0000-0000-0000-000000000001",
      });

      expect(status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const { status } = await client.subscriptions["change-plan"].patch(
        {
          planId: "00000000-0000-0000-0000-000000000001",
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
    it("should return 422 for empty planId", async () => {
      const { token } = await createUserWithPendingSubscription("basico");

      const { status } = await client.subscriptions["change-plan"].patch(
        {
          planId: "",
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

  describe("Business Rules", () => {
    it("should change plan successfully when subscription is pending", async () => {
      const { token } = await createUserWithPendingSubscription("basico");

      const newPlan = await planRepository.findBySlug("imobiliaria");
      if (!newPlan) throw new Error("Plan not found");

      const { status, data } = await client.subscriptions["change-plan"].patch(
        {
          planId: newPlan.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(200);
      expect(data?.success).toBe(true);
      expect(data?.subscription.planId).toBe(newPlan.id);
      expect(data?.subscription.plan.name).toBe(newPlan.name);
    });

    it("should return 404 when plan does not exist", async () => {
      const { token } = await createUserWithPendingSubscription("basico");

      const { status, error } = await client.subscriptions["change-plan"].patch(
        {
          planId: "00000000-0000-0000-0000-000000000999",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(404);
      expect((error?.value as { type: string }).type).toBe("PLAN_NOT_FOUND");
    });

    it("should return 400 when trying to change to same plan", async () => {
      const { token, plan } = await createUserWithPendingSubscription("basico");

      const { status, error } = await client.subscriptions["change-plan"].patch(
        {
          planId: plan.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(400);
      expect((error?.value as { type: string }).type).toBe("OPERATION_NOT_ALLOWED");
    });

    it("should return 400 when subscription is active (not pending)", async () => {
      const plan = await planRepository.findBySlug("basico");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Active Company",
        email: generateTestEmail("active-company"),
      });

      const user = await userRepository.create({
        email: generateTestEmail("active-owner"),
        password: "hashed-password",
        name: "Active Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, {
        ownerId: user.id,
      });

      await subscriptionRepository.create({
        userId: user.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      const token = await JwtUtils.generateToken(user.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const newPlan = await planRepository.findBySlug("imobiliaria");
      if (!newPlan) throw new Error("New plan not found");

      const { status, error } = await client.subscriptions["change-plan"].patch(
        {
          planId: newPlan.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(status).toBe(400);
      expect((error?.value as { type: string }).type).toBe("OPERATION_NOT_ALLOWED");
    });

    it("should return 404 when user has no subscription", async () => {
      const company = await companyRepository.create({
        name: "No Sub Company",
        email: generateTestEmail("nosub-company"),
      });

      const user = await userRepository.create({
        email: generateTestEmail("nosub-owner"),
        password: "hashed-password",
        name: "No Sub Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, {
        ownerId: user.id,
      });

      const token = await JwtUtils.generateToken(user.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const plan = await planRepository.findBySlug("basico");
      if (!plan) throw new Error("Plan not found");

      const { status, error } = await client.subscriptions["change-plan"].patch(
        {
          planId: plan.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // 404 SUBSCRIPTION_NOT_FOUND or 403 SUBSCRIPTION_REQUIRED (middleware check)
      expect([403, 404]).toContain(status);
      expect(["SUBSCRIPTION_NOT_FOUND", "SUBSCRIPTION_REQUIRED"]).toContain(
        (error?.value as { type: string }).type,
      );
    });
  });

  describe("Response Format", () => {
    it("should return consistent response format", async () => {
      const { token } = await createUserWithPendingSubscription("basico");

      const newPlan = await planRepository.findBySlug("imobiliaria");
      if (!newPlan) throw new Error("Plan not found");

      const { data } = await client.subscriptions["change-plan"].patch(
        {
          planId: newPlan.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("subscription");
      expect(data?.subscription).toHaveProperty("id");
      expect(data?.subscription).toHaveProperty("planId");
      expect(data?.subscription).toHaveProperty("plan");
      expect(data?.subscription.plan).toHaveProperty("id");
      expect(data?.subscription.plan).toHaveProperty("name");
      expect(data?.subscription.plan).toHaveProperty("price");
    });
  });
});
