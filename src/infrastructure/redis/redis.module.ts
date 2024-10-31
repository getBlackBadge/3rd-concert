import { Module } from '@nestjs/common';
import { RedisRepository } from './redis.repository';
// import { redisProvider } from '../../common/config/redis.config'
@Module({
  providers: [RedisRepository],
  exports: [RedisRepository],
})
export class RedisModule {}
