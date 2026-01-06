import { env } from "@/config/env";

const PAGARME_API_URL = "https://api.pagar.me/core/v5";

interface CreateOrderInput {
  title: string;
  quantity: number;
  unitPrice: number;
  customerName: string;
  customerEmail: string;
  externalReference: string;
  cardToken: string;
  installments: number;
}

interface CreateOrderOutput {
  id: string;
  status: string;
  charges: Array<{
    id: string;
    status: string;
  }>;
}

interface OrderInfo {
  id: string;
  status: string;
  code: string | null;
  customerEmail: string | null;
}

function getAuthHeader(): string {
  const credentials = `${env.PAGARME_API_KEY}:`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

async function makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pagar.me API error: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export const pagarmeService = {
  async createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const orderBody = {
      code: input.externalReference,
      customer: {
        name: input.customerName,
        email: input.customerEmail,
      },
      items: [
        {
          amount: input.unitPrice,
          description: input.title,
          quantity: input.quantity,
        },
      ],
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            installments: input.installments,
            statement_descriptor: "CRM IMOBIL",
            card_token: input.cardToken,
          },
        },
      ],
      metadata: {
        external_reference: input.externalReference,
      },
      closed: true,
    };

    const order = await makeRequest<CreateOrderOutput>("/orders", {
      method: "POST",
      body: JSON.stringify(orderBody),
    });

    return order;
  },

  async getOrder(orderId: string): Promise<OrderInfo> {
    const order = await makeRequest<{
      id?: string;
      status?: string;
      code?: string;
      customer?: { email?: string };
    }>(`/orders/${orderId}`, {
      method: "GET",
    });

    return {
      id: order.id || "",
      status: order.status || "",
      code: order.code || null,
      customerEmail: order.customer?.email || null,
    };
  },
};
