import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { treaty } from "@elysiajs/eden";
import type { App } from "@/server";
import { container } from "@/container";

const api = treaty<App>("localhost:3000");

describe.skip("Plan Middleware E2E Tests (skipped: example routes not active)", () => {
  let basicUserToken: string;
  let imobiliariaUserToken: string;
  let houseUserToken: string;

  let basicPlanId: string;
  let imobiliariaPlanId: string;
  let housePlanId: string;

  beforeAll(async () => {
    const plansResponse = await api.plans.index.get();
    if (plansResponse.data) {
      const plans = plansResponse.data.data;
      basicPlanId = plans.find((p) => p.slug === "basico")?.id || "";
      imobiliariaPlanId = plans.find((p) => p.slug === "imobiliaria")?.id || "";
      housePlanId = plans.find((p) => p.slug === "house")?.id || "";
    }

    const basicUser = await api.auth.register.post({
      email: "basic@test.com",
      password: "password123",
      name: "Basic User",
      planId: basicPlanId,
    });
    if (basicUser.data) {
      basicUserToken = basicUser.data.data.token;
    }

    const imobiliariaUser = await api.auth.register.post({
      email: "imobiliaria@test.com",
      password: "password123",
      name: "Imobiliaria User",
      planId: imobiliariaPlanId,
    });
    if (imobiliariaUser.data) {
      imobiliariaUserToken = imobiliariaUser.data.data.token;
    }

    const houseUser = await api.auth.register.post({
      email: "house@test.com",
      password: "password123",
      name: "House User",
      planId: housePlanId,
    });
    if (houseUser.data) {
      houseUserToken = houseUser.data.data.token;
    }
  });

  afterAll(async () => {
    const userRepo = container.userRepository;
    await userRepo.deleteByEmail("basic@test.com");
    await userRepo.deleteByEmail("imobiliaria@test.com");
    await userRepo.deleteByEmail("house@test.com");
  });

  test("should allow basic plan user to access with-plan route", async () => {
    const response = await api.examples["with-plan"].get({
      headers: {
        authorization: `Bearer ${basicUserToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    if (response.data) {
      expect(response.data.subscription.planSlug).toBe("basico");
    }
  });

  test("should block basic plan user from late charges route", async () => {
    const response = await api.examples["charge-with-interest"].post(
      {
        amount: 1000,
        daysLate: 5,
      },
      {
        headers: {
          authorization: `Bearer ${basicUserToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
    expect(response.error).toBeDefined();
  });

  test("should allow imobiliaria plan user to access late charges route", async () => {
    const response = await api.examples["charge-with-interest"].post(
      {
        amount: 1000,
        daysLate: 5,
      },
      {
        headers: {
          authorization: `Bearer ${imobiliariaUserToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    if (response.data) {
      expect(response.data.feature).toBe("lateCharges");
    }
  });

  test("should block basic plan user from invite-user route", async () => {
    const response = await api.examples["invite-user"].post(
      {
        email: "newuser@test.com",
      },
      {
        headers: {
          authorization: `Bearer ${basicUserToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
    expect(response.error).toBeDefined();
  });

  test("should allow imobiliaria plan user to access invite-user route", async () => {
    const response = await api.examples["invite-user"].post(
      {
        email: "newuser@test.com",
      },
      {
        headers: {
          authorization: `Bearer ${imobiliariaUserToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  test("should block basic plan user from assign-manager route", async () => {
    const response = await api.examples["assign-manager"].post(
      {
        userId: "test-user-id",
      },
      {
        headers: {
          authorization: `Bearer ${basicUserToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
    expect(response.error).toBeDefined();
  });

  test("should block imobiliaria plan user from assign-manager route", async () => {
    const response = await api.examples["assign-manager"].post(
      {
        userId: "test-user-id",
      },
      {
        headers: {
          authorization: `Bearer ${imobiliariaUserToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
    expect(response.error).toBeDefined();
  });

  test("should allow house plan user to access assign-manager route", async () => {
    const response = await api.examples["assign-manager"].post(
      {
        userId: "test-user-id",
      },
      {
        headers: {
          authorization: `Bearer ${houseUserToken}`,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });

  test("should return correct conditional logic for each plan", async () => {
    const basicResponse = await api.examples["conditional-logic"].get({
      headers: {
        authorization: `Bearer ${basicUserToken}`,
      },
    });

    expect(basicResponse.status).toBe(200);
    if (basicResponse.data) {
      expect(basicResponse.data.availableFeatures.isBasic).toBe(true);
      expect(basicResponse.data.availableFeatures.lateCharges).toBe(false);
      expect(basicResponse.data.availableFeatures.hasManagers).toBe(false);
    }

    const imobiliariaResponse = await api.examples["conditional-logic"].get({
      headers: {
        authorization: `Bearer ${imobiliariaUserToken}`,
      },
    });

    expect(imobiliariaResponse.status).toBe(200);
    if (imobiliariaResponse.data) {
      expect(imobiliariaResponse.data.availableFeatures.isImobiliaria).toBe(
        true,
      );
      expect(imobiliariaResponse.data.availableFeatures.lateCharges).toBe(true);
      expect(imobiliariaResponse.data.availableFeatures.multipleUsers).toBe(
        true,
      );
      expect(imobiliariaResponse.data.availableFeatures.hasManagers).toBe(
        false,
      );
    }

    const houseResponse = await api.examples["conditional-logic"].get({
      headers: {
        authorization: `Bearer ${houseUserToken}`,
      },
    });

    expect(houseResponse.status).toBe(200);
    if (houseResponse.data) {
      expect(houseResponse.data.availableFeatures.isHouse).toBe(true);
      expect(houseResponse.data.availableFeatures.lateCharges).toBe(true);
      expect(houseResponse.data.availableFeatures.multipleUsers).toBe(true);
      expect(houseResponse.data.availableFeatures.hasManagers).toBe(true);
    }
  });
});
