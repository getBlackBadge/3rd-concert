import { Injectable } from '@nestjs/common';
import { ILockManager } from './interface/lock.manager.interface';
import { RedisRepository } from '../../../infrastructure/redis/redis.repository';
import { v4 as uuidv4 } from 'uuid';
import { loggers } from 'winston';

@Injectable()
export class RedisNoWaitLockManager implements ILockManager {
    private readonly lockPrefix = 'lock:';
    private readonly defaultTTL = 30000; // 30 seconds

    constructor(private readonly redisRepository: RedisRepository) {}

    async withLockBySrc<T>(resourceId: string, resourceType: string, operation: () => Promise<T>): Promise<T> {
        const lockResourceId = this.getLockKey(resourceType, resourceId);
        const requestId = this.generateUniqueRequestId();
        

        const lockAcquired = await this.redisRepository.setnx(lockResourceId, requestId, this.defaultTTL);
        
        if (lockAcquired) {
            try {
                return await operation();
            } catch (error) {
                throw new Error(`Operation failed: ${error.message}`);
            }
            finally {
                await this.releaseLock(lockResourceId, requestId);
            }
        } else {
            throw new Error(`Failed to acquire lock`);
        }
    }

    private async releaseLock(lockKey: string, requestId: string): Promise<void> {
        const currentValue = await this.redisRepository.get(lockKey);
        if (currentValue === requestId) {
            await this.redisRepository.del(lockKey);
        }
    }
    private generateUniqueRequestId(): string {
        return uuidv4();
    }

    private getLockKey(resourceType: string, resourceId: string): string {
        return `${this.lockPrefix}${resourceType}:${resourceId}`;
    }
}
