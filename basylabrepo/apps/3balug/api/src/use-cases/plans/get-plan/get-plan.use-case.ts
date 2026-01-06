import { PlanNotFoundError } from "@basylab/core/errors";
import type { Plan } from "@/db/schema/plans";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";

type GetPlanInput = {
  planId: string;
};

export class GetPlanUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(input: GetPlanInput): Promise<Plan> {
    const plan = await this.planRepository.findById(input.planId);
    if (!plan) {
      throw new PlanNotFoundError();
    }

    return plan;
  }
}
