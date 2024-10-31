import { Test, TestingModule } from '@nestjs/testing';
import { RedisLockManager } from '../redis-nowait-lock.manager';
import { RedisRepository } from '../../../../infrastructure/redis/redis.repository';
import { GenericContainer } from 'testcontainers';
import { createClient, RedisClientType } from 'redis';

describe('RedisLockManager', () => {
    let redisLockManager: RedisLockManager;
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
        .on('error', err => console.log('Redis Client Error', err))
        .connect() as RedisClientType;


        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RedisLockManager,
                RedisRepository,
                {
                    provide: 'redisClient', // redisClient 주입 설정
                    useValue: redisClient,
                },
            ],
        }).compile();

        redisLockManager = module.get<RedisLockManager>(RedisLockManager);
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
        it('should acquire lock and increment a shared counter sequentially for 100 requests', async () => {
            const resourceId = 'testResourceId';
            const resourceType = 'testResourceType';
            const counterKey = 'sharedCounter';
    
            // Initialize the shared counter in Redis to 0
            await redisClient.set(counterKey, 0);
    
            // Mock operation to increment the counter
            const mockOperation = jest.fn(async () => {
                // Get the current counter value
                const currentCount = await redisClient.get(counterKey);
                const newCount = Number(currentCount) + 1;
    
                // Set the incremented value back in Redis
                await redisClient.set(counterKey, newCount);
                return newCount;
            });
            const results = await Promise.allSettled(Array.from({ length: 100 }, () => redisLockManager.withLockBySrc(resourceId, resourceType, mockOperation)));
            
            // Count the number of successful operations
            const successfulCalls = results.filter(result => result.status === 'fulfilled').length;
            console.log('Successful Calls:', successfulCalls);
            expect(mockOperation).toHaveBeenCalledTimes(successfulCalls);
    
            // Retrieve the final counter value from Redis and expect it to be equal to the number of successful calls
            const finalCounterValue = await redisClient.get(counterKey);
            console.log('Final Counter Value:', Number(finalCounterValue));
            expect(Number(finalCounterValue)).toBe(successfulCalls);
    
            // Clean up the counter key in Redis
            await redisClient.del(counterKey);
        }, 30000);

        // describe('withoutLock', () => {
        //     it('should fail to increment the shared counter sequentially for 00 requests without lock', async () => {
        //         const counterKey = 'sharedCounter';
        
        //         // Initialize the shared counter in Redis to 0
        //         await redisClient.set(counterKey, 0);
        
        //         // Mock operation to increment the counter manually (simulate non-atomic operation)
        //         const mockOperation = jest.fn(async () => {
        //             // Get the current counter value
        //             const currentCount = await redisClient.get(counterKey);
        //             const newCount = Number(currentCount) + 1;
        
        //             // Set the incremented value back in Redis
        //             await redisClient.set(counterKey, newCount);
        //             return newCount;
        //         });
        
        //         // Run the mock operation 00 times in parallel without a lock
        //         await Promise.allSettled(Array.from({ length: 100 }, () => mockOperation()));
        
        //         // Expect the mock operation to be called 100 times
        //         expect(mockOperation).toHaveBeenCalledTimes(100);
        
        //         // Retrieve the final counter value from Redis
        //         const finalCounterValue = await redisClient.get(counterKey);
        
        //         // Expect the final counter value to NOT be 100, indicating race conditions without the lock
        //         expect(Number(finalCounterValue)).not.toBe(100);
        
        //         // Clean up the counter key in Redis
        //         await redisClient.del(counterKey);
        //     }, 30000);
        // });
        
    });


});
