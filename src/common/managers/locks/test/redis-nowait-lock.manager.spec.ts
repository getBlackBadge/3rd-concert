import { Test, TestingModule } from '@nestjs/testing';
import { RedisNoWaitLockManager } from '../redis-nowait-lock.manager';
import { RedisRepository } from '../../../../infrastructure/redis/redis.repository';
import { GenericContainer } from 'testcontainers';
import { createClient, RedisClientType } from 'redis';

describe('RedisLockManager', () => {
    let redisLockManager: RedisNoWaitLockManager;
    let redisRepository: RedisRepository;
    let container: GenericContainer;
    let redisClient: RedisClientType;

    beforeAll(() => {
        jest.setTimeout(20000); // 전체 테스트 스위트에 대한 타임아웃을 20초로 설정
    });

    beforeEach(async () => {
        const container = await new GenericContainer('redis')
        .withExposedPorts(6379)
        .start();
  
        const redisHost = container.getHost();
        const redisPort = container.getMappedPort(6379);
  
        redisClient = await createClient(
            {
                url: `redis://${redisHost}:${redisPort}`
            }
        )
        .on('error', err => console.log('Redis 클라이언트 오류', err))
        .connect() as RedisClientType;


        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RedisNoWaitLockManager,
                RedisRepository,
                {
                    provide: 'redisClient', // redisClient 주입 설정
                    useValue: redisClient,
                },
            ],
        }).compile();

        redisLockManager = module.get<RedisNoWaitLockManager>(RedisNoWaitLockManager);
        redisRepository = module.get<RedisRepository>(RedisRepository);
    });

    afterEach(async () => {
        try{
            jest.clearAllMocks();
            await redisClient.quit();
            // await container.stop();
        } catch {
        }
      });

      describe('withLockBySrc', () => {
        it('잠금을 획득하고 100개의 요청에 대해 공유 카운터를 순차적으로 증가시켜야 합니다', async () => {
            const resourceId = 'testResourceId';
            const resourceType = 'testResourceType';
            const counterKey = 'sharedCounter';
    
            // Redis에서 공유 카운터를 0으로 초기화합니다
            await redisClient.set(counterKey, 0);
    
            // 카운터를 증가시키기 위한 모의 작업
            const mockOperation = jest.fn(async () => {
                // 현재 카운터 값을 가져옵니다
                const currentCount = await redisClient.get(counterKey);
                const newCount = Number(currentCount) + 1;
    
                // 증가된 값을 Redis에 다시 설정합니다
                await redisClient.set(counterKey, newCount);
                return newCount;
            });
            const results = await Promise.allSettled(Array.from({ length: 100 }, () => redisLockManager.withLockBySrc(resourceId, resourceType, mockOperation)));
            
            // 성공적인 작업의 수를 계산합니다
            const successfulCalls = results.filter(result => result.status === 'fulfilled').length;
            console.log('성공적인 호출 수:', successfulCalls);
            expect(mockOperation).toHaveBeenCalledTimes(successfulCalls);
    
            // Redis에서 최종 카운터 값을 가져오고 성공적인 호출 수와 같아야 합니다
            const finalCounterValue = await redisClient.get(counterKey);
            console.log('최종 카운터 값:', Number(finalCounterValue));
            expect(Number(finalCounterValue)).toBe(successfulCalls);
    
            // Redis에서 카운터 키를 정리합니다
            await redisClient.del(counterKey);
        }, 30000);
    });


});
