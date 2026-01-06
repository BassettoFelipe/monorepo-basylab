import { CleanupExpiredPaymentsJob } from "@/jobs/cleanup-expired-payments.job";
import { repositories } from "./repositories";

export function createJobs() {
  return {
    cleanupExpiredPayments: new CleanupExpiredPaymentsJob(repositories.pendingPaymentRepository),
  };
}
