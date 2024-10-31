import { Injectable } from '@nestjs/common';
import { ILockManager } from './interface/lock.manager.interface';
import { RedisRepository } from '../../../infrastructure/redis/redis.repository';
import { v4 as uuidv4 } from 'uuid';
import { loggers } from 'winston';

@Injectable()
export class RedisLockManager implements ILockManager {
    private readonly lockPrefix = 'lock:';
    private readonly defaultTTL = 30000; // 30 seconds
    private readonly maxRetries = 5;
    private readonly retryDelay = 100; // 100ms 재시도 간격

    constructor(private readonly redisRepository: RedisRepository) {}

    async withLockBySrc<T>(resourceId: string, resourceType: string, operation: () => Promise<T>): Promise<T> {
        const lockResourceId = this.getLockKey(resourceType, resourceId);
        const requestId = this.generateUniqueRequestId();
        
        let retryCount = 0;

        while (retryCount < this.maxRetries) {
            const lockAcquired = await this.redisRepository.setnx(lockResourceId, requestId, this.defaultTTL);
            
            if (lockAcquired) {
                try {
                    return await operation();
                } finally {
                    await this.releaseLock(lockResourceId, requestId);
                }
            } else {
                retryCount++;
                if (retryCount >= this.maxRetries) {
                    throw new Error(`Failed to acquire lock after ${this.maxRetries} retries`);
                }
                await this.delay(this.retryDelay);
            }
        }
    }

    private async releaseLock(lockKey: string, requestId: string): Promise<void> {
        const currentValue = await this.redisRepository.get(lockKey);
        if (currentValue === requestId) {
            await this.redisRepository.del(lockKey);
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateUniqueRequestId(): string {
        return uuidv4();
    }

    private getLockKey(resourceType: string, resourceId: string): string {
        return `${this.lockPrefix}${resourceType}:${resourceId}`;
    }
}
