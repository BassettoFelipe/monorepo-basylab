import { PendingPaymentNotFoundError, PlanNotFoundError } from "@/errors";
import type { IPendingPaymentRepository } from "@/repositories/contracts/pending-payment.repository";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";

type GetPendingPaymentInput = {
  pendingPaymentId: string;
};

type GetPendingPaymentOutput = {
  id: string;
  email: string;
  name: string;
  planId: string;
  plan: {
    id: string;
    name: string;
    price: number;
  };
  status: string;
  expiresAt: string;
  pagarmeOrderId?: string;
  pagarmeChargeId?: string;
};

export class GetPendingPaymentUseCase {
  constructor(
    private readonly pendingPaymentRepository: IPendingPaymentRepository,
    private readonly planRepository: IPlanRepository,
  ) {}

  async execute(input: GetPendingPaymentInput): Promise<GetPendingPaymentOutput> {
    const pendingPayment = await this.pendingPaymentRepository.findById(input.pendingPaymentId);

    if (!pendingPayment) {
      throw new PendingPaymentNotFoundError();
    }

    const plan = await this.planRepository.findById(pendingPayment.planId);
    if (!plan) {
      throw new PlanNotFoundError();
    }

    const result: GetPendingPaymentOutput = {
      id: pendingPayment.id,
      email: pendingPayment.email,
      name: pendingPayment.name,
      planId: pendingPayment.planId,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
      },
      status: pendingPayment.status,
      expiresAt: pendingPayment.expiresAt.toISOString(),
    };

    if (pendingPayment.pagarmeOrderId) {
      result.pagarmeOrderId = pendingPayment.pagarmeOrderId;
    }

    if (pendingPayment.pagarmeChargeId) {
      result.pagarmeChargeId = pendingPayment.pagarmeChargeId;
    }

    return result;
  }
}
