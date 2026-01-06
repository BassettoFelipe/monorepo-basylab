import { logger } from "@/config/logger";

type JobFunction = () => Promise<void>;

interface Job {
  name: string;
  fn: JobFunction;
  intervalMs: number;
  timeoutId?: Timer;
}

export class JobScheduler {
  private jobs: Job[] = [];
  private isRunning = false;

  register(name: string, fn: JobFunction, intervalMs: number): void {
    this.jobs.push({ name, fn, intervalMs });
  }

  start(): void {
    if (this.isRunning) {
      logger.warn("Job scheduler is already running");
      return;
    }

    this.isRunning = true;
    logger.info("Starting job scheduler");

    for (const job of this.jobs) {
      this.scheduleJob(job);
    }
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info("Stopping job scheduler");

    for (const job of this.jobs) {
      if (job.timeoutId) {
        clearTimeout(job.timeoutId);
      }
    }
  }

  private scheduleJob(job: Job): void {
    const runJob = async () => {
      try {
        logger.info(`Running job: ${job.name}`);
        await job.fn();
      } catch (error) {
        logger.error({
          msg: `Error running job: ${job.name}`,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (this.isRunning) {
          job.timeoutId = setTimeout(runJob, job.intervalMs);
        }
      }
    };

    runJob();
  }
}

export const jobScheduler = new JobScheduler();
