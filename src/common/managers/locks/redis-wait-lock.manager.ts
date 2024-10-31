import { Injectable } from '@nestjs/common';
import { ILockManager } from './interface/lock.manager.interface';
import { RedisRepository } from '../../../infrastructure/redis/redis.repository';
import { v4 as uuidv4 } from 'uuid';
import { loggers } from 'winston';

@Injectable()
export class RedisLockManager implements ILockManager {
    private readonly lockPrefix = 'lock:';
    private readonly queuePrefix = 'queue:';
    private readonly channelPrefix = 'channel:';
    private readonly defaultTTL = 30000; // 30 seconds
    private readonly maxRetries = 1000;

    constructor(private readonly redisRepository: RedisRepository) {}
    async withLockBySrc<T>(resourceId: string, resourceType: string, operation: () => Promise<T>): Promise<T> {
        const lockResourceId = `lock:${resourceType}:${resourceId}`;
        const lockKey = this.getLockKey(lockResourceId);
        const queueKey = this.getQueueKey(lockResourceId);
        const requestId = this.generateUniqueRequestId();
        const channelKey = this.getChannelKey(lockResourceId, requestId);
        
        
        try {
            await this.joinQueue(queueKey, requestId);
            console.log(`Joined queue for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            await this.waitForTurn(queueKey, channelKey, requestId);
            console.log(`Turn arrived for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            const lockResult = await this.acquireLock(lockKey, requestId);
            console.log(`Lock acquired for resource: ${lockResourceId}, requestId: ${requestId}`);
            if (!lockResult) {
                throw new Error('Failed to acquire lock');
            }
            
            const result = await operation();
            console.log(`Operation completed for resource: ${lockResourceId}, requestId: ${requestId}`);
            return result;
        } catch (error) {
            console.log(`Error in withLock for resource: ${lockResourceId}, requestId: ${requestId}`, error.message);
            throw error;
        } finally {
            await this.releaseLock(lockKey, requestId);
            console.log(`Lock released for resource: ${lockResourceId}, requestId: ${requestId}`);
            
            await this.leaveQueue(queueKey, requestId);
            console.log(`Left queue for resource: ${lockResourceId}, requestId: ${requestId}`);

            const nextId = await this.getNextReqId(queueKey)
            if (!nextId) {
                return
            }

            const  nextChannelKey = this.getChannelKey(lockResourceId, nextId);
            
            await this.notifyNext(nextChannelKey);
            console.log(`Notified next in queue for resource: ${lockResourceId}, next: ${nextId}`);
        }
    }

    private async joinQueue(queueKey: string, requestId: string): Promise<void> {
        const timestamp = Date.now();
        await this.redisRepository.zadd(queueKey, timestamp, requestId);
    }

    private generateUniqueRequestId(): string {
        return uuidv4();
    }

    private async waitForTurn(queueKey: string, channelKey: string, requestId: string): Promise<void> {
        const queueFirst = await this.redisRepository.zrange(queueKey, 0, 0);

        if (queueFirst[0] === requestId) {
            console.log(`Turn arrived for requestId: ${requestId}`);
            return;
        }
        // while (true) {
        console.log(`Waiting for turn, requestId: ${requestId}`);
        await this.waitForNotification(channelKey);
        console.log(`it's your turn, requestId: ${requestId}`);

        return

    }
    private async getNextReqId(queueKey: string): Promise<string | null> {
        const nextRequestId = await this.redisRepository.zrange(queueKey, 0, 0);
        return nextRequestId.length > 0 ? nextRequestId[0] : null;
    }

    private async waitForNotification(channelKey: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                // Redis 채널에 subscribe
                this.redisRepository.subscribe(channelKey, (message) => {
                    console.log(`Subscribed to ${channelKey}. Currently subscribed to channels.`);
                    
                    if (message === "next") {
                        console.log(`got message next`);
                        resolve()
                    }
                });
            } catch (error) {
                reject(error); // 일반 오류 처리
            }
        });
    }

    private async leaveQueue(queueKey: string, requestId: string): Promise<void> {
        await this.redisRepository.zrem(queueKey, requestId);
    }

    private async acquireLock(lockKey: string, requestId: string): Promise<boolean> {
        console.log("acquire Queue")
        const acquired = await this.redisRepository.setnx(lockKey, requestId, this.defaultTTL);
        if (acquired) {
            console.log(`Lock acquired for requestId: ${requestId}`);
            return true
        }
        return false

    }

    private async releaseLock(lockKey: string, requestId: string): Promise<void> {
        const currentLockHolder = await this.redisRepository.get(lockKey);
        if (currentLockHolder === requestId) {
            await this.redisRepository.del(lockKey);
        }
    }

    private async notifyNext(channelKey: string): Promise<void> {
        console.log("notifyNext")
        const result = await this.redisRepository.publish(channelKey, 'next');
        console.log(result)
    }

    private getLockKey(resourceId: string): string {
        return `${this.lockPrefix}:${resourceId}`;
    }

    private getQueueKey(resourceId: string): string {
        return `${this.queuePrefix}:${resourceId}`;
    }

    private getChannelKey(resourceId: string, requestId: string): string {
        return `${this.channelPrefix}:${resourceId}:${requestId}`;
    }
}