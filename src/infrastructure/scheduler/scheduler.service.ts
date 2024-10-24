import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class SchedulerService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  addCronJob(name: string, job) {
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    console.log(`Cron job ${name} has been deleted.`);
  }

  getCronJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key) => {
      console.log(`Job: ${key}`);
    });
  }

}