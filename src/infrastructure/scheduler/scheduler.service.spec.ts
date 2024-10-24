import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;
  let schedulerRegistry: SchedulerRegistry;

  beforeEach(async () => {
    const mockSchedulerRegistry = {
      addCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
      getCronJobs: jest.fn(() => new Map<string, CronJob>()), // 반환 타입을 맞춤
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
      ],
    }).compile();

    schedulerService = module.get<SchedulerService>(SchedulerService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  it('정의되어 있어야 한다', () => {
    expect(schedulerService).toBeDefined();
  });

  describe('addCronJob', () => {
    it('cronjob을 추가하고 시작해야 한다', () => {
      const mockJob = { start: jest.fn() } as unknown as CronJob;
      const jobName = 'testJob';

      schedulerService.addCronJob(jobName, mockJob);

      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(jobName, mockJob);
      expect(mockJob.start).toHaveBeenCalled();
    });
  });

  describe('deleteCronJob', () => {
    it('cronjob을 삭제해야 한다', () => {
      const jobName = 'testJob';
      
      schedulerService.deleteCronJob(jobName);
      
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(jobName);
    });
  });

  describe('getCronJobs', () => {
    it('cronjob을 로그로 출력해야 한다', () => {
      const mockJobs = new Map<string, CronJob>();
      mockJobs.set('testJob', {} as CronJob);
      jest.spyOn(schedulerRegistry, 'getCronJobs').mockReturnValue(mockJobs);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      schedulerService.getCronJobs();

      expect(schedulerRegistry.getCronJobs).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Job: testJob');

      consoleSpy.mockRestore();
    });
  });
});
