import { Module } from '@nestjs/common';
import { RedisRepository } from './redis.repository';
import { redisClient } from '../../common/config/redis.config'
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useValue: redisClient,
    },
    RedisRepository],
  exports: [RedisRepository],
})
export class RedisModule {}
