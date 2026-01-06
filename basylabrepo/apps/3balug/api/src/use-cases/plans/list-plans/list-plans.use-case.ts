import type { Plan } from "@/db/schema/plans";
import type { IPlanRepository } from "@/repositories/contracts/plan.repository";

export class ListPlansUseCase {
  constructor(private readonly planRepository: IPlanRepository) {}

  async execute(): Promise<Plan[]> {
    return await this.planRepository.findAll();
  }
}
