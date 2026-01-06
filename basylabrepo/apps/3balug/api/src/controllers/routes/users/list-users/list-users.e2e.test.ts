import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("GET /api/users - List Users E2E", () => {
  const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
    createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  describe("Authentication & Authorization", () => {
    it("should return 401 when no auth token provided", async () => {
      const { status } = await client.api.users.get();

      expect(status).toBe(401);
    });

    it("should return 403 when BROKER tries to list users", async () => {
      const plan = await planRepository.findBySlug("imobiliaria");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Broker Test Company",
        email: generateTestEmail("broker-company"),
      });

      const ownerUser = await userRepository.create({
        email: generateTestEmail("list-owner"),
        password: "hashed",
        name: "Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: ownerUser.id });

      const brokerUser = await userRepository.create({
        email: generateTestEmail("list-broker"),
        password: "hashed",
        name: "Broker",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const brokerToken = await JwtUtils.generateToken(brokerUser.id, "access", {
        role: "broker",
        companyId: company.id,
      });

      const { status } = await client.api.users.get({
        headers: { Authorization: `Bearer ${brokerToken}` },
      });

      expect(status).toBe(403);
    });

    it("should allow OWNER to list users", async () => {
      const plan = await planRepository.findBySlug("imobiliaria");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Owner List Company",
        email: generateTestEmail("owner-list-company"),
      });

      const ownerUser = await userRepository.create({
        email: generateTestEmail("owner-can-list"),
        password: "hashed",
        name: "Owner Can List",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: ownerUser.id });

      await subscriptionRepository.create({
        userId: ownerUser.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      const ownerToken = await JwtUtils.generateToken(ownerUser.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const { status, data } = await client.api.users.get({
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(status).toBe(200);
      expect(data).toBeDefined();
    });

    it("should allow MANAGER to list users", async () => {
      const plan = await planRepository.findBySlug("house");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Manager List Company",
        email: generateTestEmail("manager-list-company"),
      });

      const ownerUser = await userRepository.create({
        email: generateTestEmail("owner-for-manager-list"),
        password: "hashed",
        name: "Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: ownerUser.id });

      await subscriptionRepository.create({
        userId: ownerUser.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      const managerUser = await userRepository.create({
        email: generateTestEmail("manager-can-list"),
        password: "hashed",
        name: "Manager",
        role: "manager",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
        createdBy: ownerUser.id, // Must be created by owner to inherit subscription
      });

      const managerToken = await JwtUtils.generateToken(managerUser.id, "access", {
        role: "manager",
        companyId: company.id,
      });

      const { status, data } = await client.api.users.get({
        headers: { Authorization: `Bearer ${managerToken}` },
      });

      expect(status).toBe(200);
      expect(data).toBeDefined();
    });
  });

  describe("Company Isolation", () => {
    it("should only return users from same company", async () => {
      const plan = await planRepository.findBySlug("imobiliaria");
      if (!plan) throw new Error("Plan not found");

      // Company A
      const companyA = await companyRepository.create({
        name: "Company A",
        email: generateTestEmail("company-a"),
      });

      const ownerA = await userRepository.create({
        email: generateTestEmail("owner-a"),
        password: "hashed",
        name: "Owner A",
        role: "owner",
        companyId: companyA.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(companyA.id, { ownerId: ownerA.id });

      await subscriptionRepository.create({
        userId: ownerA.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      await userRepository.create({
        email: generateTestEmail("broker-a"),
        password: "hashed",
        name: "Broker A",
        role: "broker",
        companyId: companyA.id,
        isActive: true,
        isEmailVerified: true,
      });

      // Company B
      const companyB = await companyRepository.create({
        name: "Company B",
        email: generateTestEmail("company-b"),
      });

      const ownerB = await userRepository.create({
        email: generateTestEmail("owner-b"),
        password: "hashed",
        name: "Owner B",
        role: "owner",
        companyId: companyB.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(companyB.id, { ownerId: ownerB.id });

      await userRepository.create({
        email: generateTestEmail("broker-b"),
        password: "hashed",
        name: "Broker B",
        role: "broker",
        companyId: companyB.id,
        isActive: true,
        isEmailVerified: true,
      });

      const tokenA = await JwtUtils.generateToken(ownerA.id, "access", {
        role: "owner",
        companyId: companyA.id,
      });

      const { status, data } = await client.api.users.get({
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      expect(status).toBe(200);
      expect(data?.data.users).toBeDefined();

      // Should only see users from Company A (excluding owner)
      // Note: companyId is not returned by the API, so we verify by user names
      const users = data?.data.users || [];
      expect(users.length).toBe(1);
      expect(users[0].name).toBe("Broker A");
      // Verify no users from Company B are returned
      expect(users.some((u: any) => u.name === "Broker B")).toBe(false);
      expect(users.some((u: any) => u.name === "Owner B")).toBe(false);
    });
  });

  describe("Filtering and Pagination", () => {
    it("should filter by role", async () => {
      const plan = await planRepository.findBySlug("house");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Filter Company",
        email: generateTestEmail("filter-company"),
      });

      const owner = await userRepository.create({
        email: generateTestEmail("filter-owner"),
        password: "hashed",
        name: "Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: owner.id });

      await subscriptionRepository.create({
        userId: owner.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      await userRepository.create({
        email: generateTestEmail("broker-1"),
        password: "hashed",
        name: "Broker 1",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await userRepository.create({
        email: generateTestEmail("manager-1"),
        password: "hashed",
        name: "Manager 1",
        role: "manager",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const token = await JwtUtils.generateToken(owner.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const { status, data } = await client.api.users.get({
        query: { role: "broker" },
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(status).toBe(200);
      const users = data?.data.users || [];
      expect(users.every((u: any) => u.role === "broker")).toBe(true);
    });

    it("should filter by isActive status", async () => {
      const plan = await planRepository.findBySlug("imobiliaria");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Active Filter Company",
        email: generateTestEmail("active-company"),
      });

      const owner = await userRepository.create({
        email: generateTestEmail("active-owner"),
        password: "hashed",
        name: "Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: owner.id });

      await subscriptionRepository.create({
        userId: owner.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      await userRepository.create({
        email: generateTestEmail("active-broker"),
        password: "hashed",
        name: "Active Broker",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await userRepository.create({
        email: generateTestEmail("inactive-broker"),
        password: "hashed",
        name: "Inactive Broker",
        role: "broker",
        companyId: company.id,
        isActive: false,
        isEmailVerified: true,
      });

      const token = await JwtUtils.generateToken(owner.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const { status, data } = await client.api.users.get({
        query: { isActive: true },
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(status).toBe(200);
      const users = data?.data.users || [];
      expect(users.every((u: any) => u.isActive === true)).toBe(true);
    });

    it("should support pagination", async () => {
      const plan = await planRepository.findBySlug("house");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Pagination Company",
        email: generateTestEmail("pagination-company"),
      });

      const owner = await userRepository.create({
        email: generateTestEmail("pagination-owner"),
        password: "hashed",
        name: "Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: owner.id });

      await subscriptionRepository.create({
        userId: owner.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      // Create 5 brokers
      for (let i = 1; i <= 5; i++) {
        await userRepository.create({
          email: generateTestEmail(`broker-${i}`),
          password: "hashed",
          name: `Broker ${i}`,
          role: "broker",
          companyId: company.id,
          isActive: true,
          isEmailVerified: true,
        });
      }

      const token = await JwtUtils.generateToken(owner.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const { status, data } = await client.api.users.get({
        query: { page: 1, limit: 2 },
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(status).toBe(200);
      expect(data?.data.users.length).toBe(2);
      expect(data?.data.page).toBe(1);
      expect(data?.data.limit).toBe(2);
      expect(data?.data.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Response Format", () => {
    it("should not include owner in the list", async () => {
      const plan = await planRepository.findBySlug("imobiliaria");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "No Owner Company",
        email: generateTestEmail("no-owner-company"),
      });

      const owner = await userRepository.create({
        email: generateTestEmail("should-not-appear"),
        password: "hashed",
        name: "Owner Should Not Appear",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: owner.id });

      await subscriptionRepository.create({
        userId: owner.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      const token = await JwtUtils.generateToken(owner.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const { status, data } = await client.api.users.get({
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(status).toBe(200);
      const users = data?.data.users || [];
      expect(users.some((u: any) => u.role === "owner")).toBe(false);
    });

    it("should not expose password in response", async () => {
      const plan = await planRepository.findBySlug("imobiliaria");
      if (!plan) throw new Error("Plan not found");

      const company = await companyRepository.create({
        name: "Security Company",
        email: generateTestEmail("security-company"),
      });

      const owner = await userRepository.create({
        email: generateTestEmail("security-owner"),
        password: "hashed",
        name: "Owner",
        role: "owner",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      await companyRepository.update(company.id, { ownerId: owner.id });

      await subscriptionRepository.create({
        userId: owner.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
      });

      await userRepository.create({
        email: generateTestEmail("security-broker"),
        password: "hashed",
        name: "Broker",
        role: "broker",
        companyId: company.id,
        isActive: true,
        isEmailVerified: true,
      });

      const token = await JwtUtils.generateToken(owner.id, "access", {
        role: "owner",
        companyId: company.id,
      });

      const { status, data } = await client.api.users.get({
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(status).toBe(200);
      const users = data?.data.users || [];
      expect(users.every((u: any) => !u.password)).toBe(true);
    });
  });
});
