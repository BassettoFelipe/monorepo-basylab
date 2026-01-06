import { beforeEach, describe, expect, it } from "bun:test";
import { clearTestData, createTestApp } from "@/test/setup";
import { generateTestEmail } from "@/test/test-helpers";
import { JwtUtils } from "@/utils/jwt.utils";

describe("PUT /api/users/:id - Update User E2E", () => {
  const { client, userRepository, companyRepository, planRepository, subscriptionRepository } =
    createTestApp();

  beforeEach(() => {
    clearTestData();
  });

  it("should return 401 when no auth token provided", async () => {
    const { status } = await client.api.users({ id: "fake-id" }).put({
      name: "Updated Name",
    });

    expect(status).toBe(401);
  });

  it("should return 403 when BROKER tries to update user", async () => {
    const plan = await planRepository.findBySlug("imobiliaria");
    if (!plan) throw new Error("Plan not found");

    const company = await companyRepository.create({
      name: "Update Test Company",
      email: generateTestEmail("update-company"),
    });

    const owner = await userRepository.create({
      email: generateTestEmail("update-owner"),
      password: "hashed",
      name: "Owner",
      role: "owner",
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    await companyRepository.update(company.id, { ownerId: owner.id });

    const broker = await userRepository.create({
      email: generateTestEmail("update-broker"),
      password: "hashed",
      name: "Broker",
      role: "broker",
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    const brokerToken = await JwtUtils.generateToken(broker.id, "access", {
      role: "broker",
      companyId: company.id,
    });

    const { status } = await client.api
      .users({ id: broker.id })
      .put({ name: "Updated" }, { headers: { Authorization: `Bearer ${brokerToken}` } });

    expect(status).toBe(403);
  });

  it("should prevent updating owner account", async () => {
    const plan = await planRepository.findBySlug("imobiliaria");
    if (!plan) throw new Error("Plan not found");

    const company = await companyRepository.create({
      name: "Owner Update Company",
      email: generateTestEmail("owner-update-company"),
    });

    const owner = await userRepository.create({
      email: generateTestEmail("owner-no-update"),
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

    const token = await JwtUtils.generateToken(owner.id, "access", {
      role: "owner",
      companyId: company.id,
    });

    const { status } = await client.api
      .users({ id: owner.id })
      .put({ name: "Should Fail" }, { headers: { Authorization: `Bearer ${token}` } });

    expect(status).toBe(403);
  });

  it("should update user successfully when OWNER", async () => {
    const plan = await planRepository.findBySlug("imobiliaria");
    if (!plan) throw new Error("Plan not found");

    const company = await companyRepository.create({
      name: "Success Update Company",
      email: generateTestEmail("success-update-company"),
    });

    const owner = await userRepository.create({
      email: generateTestEmail("success-update-owner"),
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

    const broker = await userRepository.create({
      email: generateTestEmail("broker-to-update"),
      password: "hashed",
      name: "Old Name",
      role: "broker",
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    const token = await JwtUtils.generateToken(owner.id, "access", {
      role: "owner",
      companyId: company.id,
    });

    const { status, data } = await client.api
      .users({ id: broker.id })
      .put({ name: "New Name" }, { headers: { Authorization: `Bearer ${token}` } });

    expect(status).toBe(200);
    expect(data?.data.name).toBe("New Name");
  });

  it("should validate email uniqueness on update", async () => {
    const plan = await planRepository.findBySlug("imobiliaria");
    if (!plan) throw new Error("Plan not found");

    const company = await companyRepository.create({
      name: "Email Unique Company",
      email: generateTestEmail("email-unique-company"),
    });

    const owner = await userRepository.create({
      email: generateTestEmail("email-unique-owner"),
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

    const existingEmail = generateTestEmail("existing-email");
    await userRepository.create({
      email: existingEmail,
      password: "hashed",
      name: "Existing User",
      role: "broker",
      companyId: company.id,
      isActive: true,
      isEmailVerified: true,
    });

    const broker = await userRepository.create({
      email: generateTestEmail("broker-email-update"),
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

    const { status } = await client.api
      .users({ id: broker.id })
      .put({ email: existingEmail }, { headers: { Authorization: `Bearer ${token}` } });

    expect(status).toBe(409);
  });

  it("should enforce company isolation - cannot update user from different company", async () => {
    const plan = await planRepository.findBySlug("imobiliaria");
    if (!plan) throw new Error("Plan not found");

    // Company A
    const companyA = await companyRepository.create({
      name: "Company A",
      email: generateTestEmail("isolation-company-a"),
    });

    const ownerA = await userRepository.create({
      email: generateTestEmail("isolation-owner-a"),
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

    // Company B
    const companyB = await companyRepository.create({
      name: "Company B",
      email: generateTestEmail("isolation-company-b"),
    });

    const ownerB = await userRepository.create({
      email: generateTestEmail("isolation-owner-b"),
      password: "hashed",
      name: "Owner B",
      role: "owner",
      companyId: companyB.id,
      isActive: true,
      isEmailVerified: true,
    });

    await companyRepository.update(companyB.id, { ownerId: ownerB.id });

    const brokerB = await userRepository.create({
      email: generateTestEmail("isolation-broker-b"),
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

    // Owner A tries to update Broker B (different company)
    const { status } = await client.api
      .users({ id: brokerB.id })
      .put({ name: "Hacked" }, { headers: { Authorization: `Bearer ${tokenA}` } });

    expect(status).toBe(403);
  });
});
