import { beforeEach, describe, expect, mock, test } from "bun:test";
import { pagarmeService } from "./pagarme.service";

const mockFetch = mock(() => Promise.resolve({} as Response));
global.fetch = mockFetch as unknown as typeof fetch;

describe("PagarmeService", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("createOrder", () => {
    const validOrderInput = {
      title: "Plano Básico",
      quantity: 1,
      unitPrice: 9990, // R$ 99.90 in cents
      customerName: "João Silva",
      customerEmail: "joao@example.com",
      externalReference: "sub-123",
      cardToken: "tok_abc123",
      installments: 1,
    };

    test("should create order successfully", async () => {
      const mockResponse = {
        id: "order_123",
        status: "paid",
        charges: [
          {
            id: "charge_123",
            status: "paid",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await pagarmeService.createOrder(validOrderInput);

      expect(result).toEqual(mockResponse);
      expect(result.id).toBe("order_123");
      expect(result.status).toBe("paid");
      expect(result.charges).toHaveLength(1);
      expect(result.charges[0].id).toBe("charge_123");
    });

    test("should send correct request to Pagar.me API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "order_123",
          status: "paid",
          charges: [],
        }),
      } as Response);

      await pagarmeService.createOrder(validOrderInput);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const callArgs = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const [url, options] = callArgs;

      expect(url).toBe("https://api.pagar.me/core/v5/orders");
      expect(options.method).toBe("POST");
      expect(options.headers).toHaveProperty("Authorization");
      expect(options.headers).toHaveProperty("Content-Type", "application/json");

      const body = JSON.parse(options.body as string);
      expect(body.code).toBe(validOrderInput.externalReference);
      expect(body.customer.name).toBe(validOrderInput.customerName);
      expect(body.customer.email).toBe(validOrderInput.customerEmail);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].amount).toBe(validOrderInput.unitPrice);
      expect(body.items[0].description).toBe(validOrderInput.title);
      expect(body.items[0].quantity).toBe(validOrderInput.quantity);
      expect(body.payments).toHaveLength(1);
      expect(body.payments[0].payment_method).toBe("credit_card");
      expect(body.payments[0].credit_card.card_token).toBe(validOrderInput.cardToken);
      expect(body.payments[0].credit_card.installments).toBe(validOrderInput.installments);
      expect(body.closed).toBe(true);
    });

    test("should include authorization header with Basic auth", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder(validOrderInput);

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers.Authorization).toMatch(/^Basic /);
    });

    test("should throw error when API returns 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Invalid card token",
      } as Response);

      await expect(pagarmeService.createOrder(validOrderInput)).rejects.toThrow(
        "Pagar.me API error: 400 - Invalid card token",
      );
    });

    test("should throw error when API returns 401 (unauthorized)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      await expect(pagarmeService.createOrder(validOrderInput)).rejects.toThrow(
        "Pagar.me API error: 401 - Unauthorized",
      );
    });

    test("should throw error when API returns 422 (validation error)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () =>
          JSON.stringify({
            errors: { card_token: ["is invalid"] },
          }),
      } as Response);

      await expect(pagarmeService.createOrder(validOrderInput)).rejects.toThrow(
        "Pagar.me API error: 422",
      );
    });

    test("should throw error when API returns 500", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response);

      await expect(pagarmeService.createOrder(validOrderInput)).rejects.toThrow(
        "Pagar.me API error: 500",
      );
    });

    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(pagarmeService.createOrder(validOrderInput)).rejects.toThrow("Network error");
    });

    test("should handle multiple installments", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder({
        ...validOrderInput,
        installments: 12,
      });

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.payments[0].credit_card.installments).toBe(12);
    });

    test("should include external reference in metadata", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder(validOrderInput);

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.metadata.external_reference).toBe(validOrderInput.externalReference);
    });

    test("should set statement descriptor to CRM IMOBIL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder(validOrderInput);

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.payments[0].credit_card.statement_descriptor).toBe("CRM IMOBIL");
    });

    test("should mark order as closed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder(validOrderInput);

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.closed).toBe(true);
    });

    test("should handle different order statuses", async () => {
      const statuses = ["paid", "pending", "failed", "canceled"];

      for (const status of statuses) {
        mockFetch.mockClear();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "order_123", status, charges: [] }),
        } as Response);

        const result = await pagarmeService.createOrder(validOrderInput);

        expect(result.status).toBe(status);
      }
    });

    test("should handle order with multiple charges", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "order_123",
          status: "paid",
          charges: [
            { id: "charge_1", status: "paid" },
            { id: "charge_2", status: "failed" },
          ],
        }),
      } as Response);

      const result = await pagarmeService.createOrder(validOrderInput);

      expect(result.charges).toHaveLength(2);
      expect(result.charges[0].status).toBe("paid");
      expect(result.charges[1].status).toBe("failed");
    });

    test("should handle large amounts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder({
        ...validOrderInput,
        unitPrice: 9999900, // R$ 99,999.00 in cents
      });

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.items[0].amount).toBe(9999900);
    });

    test("should handle special characters in customer name", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder({
        ...validOrderInput,
        customerName: "José María O'Brien",
      });

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.customer.name).toBe("José María O'Brien");
    });
  });

  describe("getOrder", () => {
    test("should get order successfully", async () => {
      const mockOrder = {
        id: "order_123",
        status: "paid",
        code: "sub-123",
        customer: {
          email: "joao@example.com",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
      } as Response);

      const result = await pagarmeService.getOrder("order_123");

      expect(result.id).toBe("order_123");
      expect(result.status).toBe("paid");
      expect(result.code).toBe("sub-123");
      expect(result.customerEmail).toBe("joao@example.com");
    });

    test("should send GET request to correct endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "order_123",
          status: "paid",
        }),
      } as Response);

      await pagarmeService.getOrder("order_123");

      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];

      expect(url).toBe("https://api.pagar.me/core/v5/orders/order_123");
      expect(options.method).toBe("GET");
      expect(options.headers).toHaveProperty("Authorization");
    });

    test("should handle missing optional fields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "order_123",
          status: "paid",
        }),
      } as Response);

      const result = await pagarmeService.getOrder("order_123");

      expect(result.id).toBe("order_123");
      expect(result.status).toBe("paid");
      expect(result.code).toBeNull();
      expect(result.customerEmail).toBeNull();
    });

    test("should handle completely empty response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const result = await pagarmeService.getOrder("order_123");

      expect(result.id).toBe("");
      expect(result.status).toBe("");
      expect(result.code).toBeNull();
      expect(result.customerEmail).toBeNull();
    });

    test("should throw error when order not found (404)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Order not found",
      } as Response);

      await expect(pagarmeService.getOrder("invalid_order")).rejects.toThrow(
        "Pagar.me API error: 404 - Order not found",
      );
    });

    test("should throw error on unauthorized request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response);

      await expect(pagarmeService.getOrder("order_123")).rejects.toThrow("Pagar.me API error: 401");
    });

    test("should handle different order statuses", async () => {
      const statuses = ["pending", "paid", "failed", "canceled", "refunded"];

      for (const status of statuses) {
        mockFetch.mockClear();
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "order_123",
            status,
          }),
        } as Response);

        const result = await pagarmeService.getOrder("order_123");

        expect(result.status).toBe(status);
      }
    });

    test("should handle customer without email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "order_123",
          status: "paid",
          customer: {},
        }),
      } as Response);

      const result = await pagarmeService.getOrder("order_123");

      expect(result.customerEmail).toBeNull();
    });

    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network timeout"));

      await expect(pagarmeService.getOrder("order_123")).rejects.toThrow("Network timeout");
    });
  });

  describe("Authorization", () => {
    test("should use Basic auth with API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "order_123", status: "paid", charges: [] }),
      } as Response);

      await pagarmeService.createOrder({
        title: "Test",
        quantity: 1,
        unitPrice: 1000,
        customerName: "Test",
        customerEmail: "test@test.com",
        externalReference: "ref",
        cardToken: "tok",
        installments: 1,
      });

      const [, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      const authHeader = headers.Authorization;

      expect(authHeader).toMatch(/^Basic /);

      const base64Part = authHeader.replace("Basic ", "");
      expect(() => Buffer.from(base64Part, "base64").toString()).not.toThrow();
    });
  });

  describe("Error handling", () => {
    test("should handle JSON parsing errors in error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Invalid JSON {{{",
      } as Response);

      await expect(
        pagarmeService.createOrder({
          title: "Test",
          quantity: 1,
          unitPrice: 1000,
          customerName: "Test",
          customerEmail: "test@test.com",
          externalReference: "ref",
          cardToken: "tok",
          installments: 1,
        }),
      ).rejects.toThrow("Pagar.me API error");
    });

    test("should handle timeout errors", async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 100);
          }),
      );

      await expect(pagarmeService.getOrder("order_123")).rejects.toThrow("Timeout");
    });
  });

  describe("Integration scenarios", () => {
    test("should handle complete payment flow", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "order_123",
          status: "pending",
          charges: [{ id: "charge_123", status: "pending" }],
        }),
      } as Response);

      const createResult = await pagarmeService.createOrder({
        title: "Plano Básico",
        quantity: 1,
        unitPrice: 9990,
        customerName: "João Silva",
        customerEmail: "joao@example.com",
        externalReference: "sub-123",
        cardToken: "tok_abc123",
        installments: 1,
      });

      expect(createResult.id).toBe("order_123");
      expect(createResult.status).toBe("pending");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "order_123",
          status: "paid",
          code: "sub-123",
          customer: { email: "joao@example.com" },
        }),
      } as Response);

      const getResult = await pagarmeService.getOrder(createResult.id);

      expect(getResult.id).toBe("order_123");
      expect(getResult.status).toBe("paid");
      expect(getResult.code).toBe("sub-123");
    });
  });
});
