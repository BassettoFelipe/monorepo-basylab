import { CleanupExpiredPaymentsJob } from "@/jobs/cleanup-expired-payments.job";
import { pendingPaymentRepository } from "./repositories";

export function createJobs() {
  return {
    cleanupExpiredPayments: new CleanupExpiredPaymentsJob(pendingPaymentRepository),
  };
}
