import { beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { errorHandlerPlugin } from "@/plugins/error-handler.plugin";
import { JwtUtils } from "@/utils/jwt.utils";
import { createCheckoutMiddleware } from "../checkout.middleware";

describe("requireCheckout middleware", () => {
  let app: any;

  beforeEach(() => {
    app = new Elysia()
      .use(errorHandlerPlugin)
      .use(createCheckoutMiddleware())
      .get("/test", ({ userId, subscriptionId, planId, userName, userEmail }: any) => ({
        userId,
        subscriptionId,
        planId,
        userName,
        userEmail,
      }));
  });

  test("should extract checkout context from valid token", async () => {
    const checkoutToken = await JwtUtils.generateToken("user-123", "checkout", {
      purpose: "checkout",
      user: {
        name: "Test User",
        email: "test@example.com",
      },
      subscription: {
        id: "sub-123",
        status: "pending",
      },
      plan: {
        id: "plan-123",
        name: "Pro Plan",
        price: 99.99,
        features: ["feature1", "feature2"],
      },
    });

    const response = await app.handle(
      new Request("http://localhost/test", {
        headers: {
          Authorization: `Bearer ${checkoutToken}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      userId: string;
      subscriptionId: string;
      planId: string;
      userName: string;
      userEmail: string;
    };
    expect(data.userId).toBe("user-123");
    expect(data.subscriptionId).toBe("sub-123");
    expect(data.planId).toBe("plan-123");
    expect(data.userName).toBe("Test User");
    expect(data.userEmail).toBe("test@example.com");
  });

  test("should reject request without authorization header", async () => {
    const response = await app.handle(new Request("http://localhost/test"));

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.type).toBe("BAD_REQUEST");
  });

  test("should reject request with malformed authorization header", async () => {
    const response = await app.handle(
      new Request("http://localhost/test", {
        headers: {
          Authorization: "InvalidFormat",
        },
      }),
    );

    expect(response.status).toBe(400);
    const data = (await response.json()) as any;
    expect(data.type).toBe("BAD_REQUEST");
  });

  test("should reject invalid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/test", {
        headers: {
          Authorization: "Bearer invalid_token_here",
        },
      }),
    );

    expect(response.status).toBe(401);
    const data = (await response.json()) as any;
    expect(data.type).toBe("INVALID_TOKEN");
  });

  test("should reject access token instead of checkout token", async () => {
    const accessToken = await JwtUtils.generateToken("user-123", "access", {
      role: "owner",
    });

    const response = await app.handle(
      new Request("http://localhost/test", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );

    expect(response.status).toBe(401);
    const data = (await response.json()) as any;
    expect(data.type).toBe("INVALID_TOKEN");
  });

  test("should reject token with wrong purpose", async () => {
    const wrongPurposeToken = await JwtUtils.generateToken("user-123", "checkout", {
      purpose: "wrong-purpose",
      user: {
        name: "Test User",
        email: "test@example.com",
      },
    });

    const response = await app.handle(
      new Request("http://localhost/test", {
        headers: {
          Authorization: `Bearer ${wrongPurposeToken}`,
        },
      }),
    );

    expect(response.status).toBe(401);
    const data = (await response.json()) as any;
    expect(data.type).toBe("INVALID_TOKEN");
  });
});
