// import { Test, TestingModule } from '@nestjs/testing';
// import { RedisRepository } from './redis.repository';
// import { createClient, RedisClientType } from 'redis';

// jest.mock('redis');

// describe('RedisRepository', () => {
//   let redisRepository: RedisRepository;
//   let mockRedisClient: jest.Mocked<RedisClientType>;

//   beforeEach(async () => {
//     mockRedisClient = {
//       connect: jest.fn(),
//       set: jest.fn(),
//       get: jest.fn(),
//       del: jest.fn(),
//       lRange: jest.fn(),
//       rPush: jest.fn(),
//       lPop: jest.fn(),
//       incr: jest.fn(),
//       lRem: jest.fn(),
//       expire: jest.fn(),
//       publish: jest.fn(),
//       subscribe: jest.fn(),
//     } as any;

//     (createClient as jest.Mock).mockReturnValue(mockRedisClient);

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [RedisRepository],
//     }).compile();

//     redisRepository = module.get<RedisRepository>(RedisRepository);
//   });

//   it('should be defined', () => {
//     expect(redisRepository).toBeDefined();
//   });

//   describe('set', () => {
//     it('should set a value with TTL', async () => {
//       mockRedisClient.set.mockResolvedValue('OK');
//       const result = await redisRepository.set('key', 'value', 60);
//       expect(result).toBe(true);
//       expect(mockRedisClient.set).toHaveBeenCalledWith('key', 'value', { EX: 60 });
//     });

//     it('유효한 ttl로 설정하면 성공해야 한다.', async () => {
//       mockRedisClient.set.mockResolvedValue('OK');
//       const result = await redisRepository.set('key', 'value', null);
//       expect(result).toBe(true);
//       expect(mockRedisClient.set).toHaveBeenCalledWith('key', 'value');
//     });
//   });

//   describe('get', () => {
//     it('유효한 키로 조회하면 성공해야 한다.', async () => {
//       mockRedisClient.get.mockResolvedValue('value');
//       const result = await redisRepository.get('key');
//       expect(result).toBe('value');
//       expect(mockRedisClient.get).toHaveBeenCalledWith('key');
//     });
//   });

//   describe('del', () => {
//     it('유효한 키로 삭제하면 성공해야 한다.', async () => {
//       mockRedisClient.del.mockResolvedValue(1);
//       const result = await redisRepository.del('key');
//       expect(result).toBe(1);
//       expect(mockRedisClient.del).toHaveBeenCalledWith('key');
//     });
//   });

//   // 나머지 메서드들에 대한 테스트도 유사한 방식으로 작성할 수 있습니다.

//   describe('publish', () => {
//     it('유효한 채널로 메시지를 발행하면 성공해야 한다.', async () => {
//       mockRedisClient.publish.mockResolvedValue(1);
//       const result = await redisRepository.publish('channel', 'message');
//       expect(result).toBe(1);
//       expect(mockRedisClient.publish).toHaveBeenCalledWith('channel', 'message');
//     });
//   });

//   describe('subscribe', () => {
//     it('유효한 채널로 구독하면 성공해야 한다.', async () => {
//         const mockCallback = jest.fn();
//         await redisRepository.subscribe('channel', mockCallback);
//         expect(mockRedisClient.subscribe).toHaveBeenCalledWith('channel', expect.any(Function));
//     }); 
//   });
// });