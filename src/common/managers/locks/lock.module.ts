import { Module } from '@nestjs/common';
import { RedisNoWaitLockManager } from './redis-nowait-lock.manager';
import { RedisLockManager } from './redis-wait-lock.manager';
import { RedisModule } from '../../../infrastructure/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [RedisNoWaitLockManager, RedisLockManager],
  exports: [RedisNoWaitLockManager, RedisLockManager],
})
export class LockModule {}