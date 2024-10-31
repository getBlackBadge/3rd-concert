import { Inject, Injectable } from '@nestjs/common';
import { createClient, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import { IMemoryDB } from './redis.interface';

type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

@Injectable()
export class RedisRepository implements IMemoryDB {
    private readonly defaultTTL = 30000; // 30 seconds
    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: RedisClient) {
        this.redisClient.setMaxListeners(200)
    }

    async set(key: string, value: string, ttl: number | null): Promise<boolean> {
        if (ttl === null) {
            await this.redisClient.set(key, value);
        } else {
            await this.redisClient.set(key, value, { EX: ttl });
        }
        return true;
    }

    // on(channelKey: string, callback: (channel: string, message: string) => void): void {
    //     this.redisClient.on('message', (channel, message) => {
    //         if (channel === channelKey) {
    //             callback(channel, message);
    //         }
    //     });
    // }

    async get(key: string): Promise<string | null> {
        return this.redisClient.get(key);
    }

    async del(key: string): Promise<number> {
        return this.redisClient.del(key);
    }

    getDefaultTTL(): number {
        return this.defaultTTL;
    }

    async lrange(key: string, start: number, end: number): Promise<string[]> {
        return this.redisClient.lRange(key, start, end);
    }

    async rpush(key: string, value: string): Promise<number> {
        return this.redisClient.rPush(key, value);
    }

    async lpop(key: string): Promise<string | null> {
        return this.redisClient.lPop(key);
    }

    async setnx(key: string, value: string, ttl: number): Promise<boolean> {
        const result = await this.redisClient.set(key, value, { NX: true, EX: ttl });
        return result === 'OK';
    }

    async increment(key: string): Promise<number> {
        return this.redisClient.incr(key);
    }

    async lrem(key: string, count: number, value: string): Promise<number> {
        return this.redisClient.lRem(key, count, value);
    }

    async expire(key: string, ttl: number): Promise<number> {
        const result = await this.redisClient.expire(key, ttl);
        return result ? 1 : 0;
    }

    public async publish(channel: string, message: string): Promise<number> {
        return this.redisClient.publish(channel, message);
    }

    public async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
        const channel1Sub = this.redisClient.duplicate();
        await channel1Sub.connect();
        await channel1Sub.subscribe(channel, (message) => {
            console.log(`Received message on channel ${channel}: ${message}`);
            callback(message);
        });
    }
    // Sorted Set에 요소를 추가하는 메서드입니다.
    async zadd(key: string, score: number, value: string): Promise<number> {
        return this.redisClient.zAdd(key, { score, value });
    }

    // Sorted Set에서 지정된 범위의 요소를 가져오는 메서드입니다.
    async zrange(key: string, start: number, stop: number): Promise<string[]> {
        return this.redisClient.zRange(key, start, stop);
    }

    // Sorted Set에서 지정된 값을 제거하는 메서드입니다.
    async zrem(key: string, value: string): Promise<number> {
        return this.redisClient.zRem(key, value);
    }

    // Sorted Set에서 지정된 값의 점수를 가져오는 메서드입니다.
    async zscore(key: string, value: string): Promise<number | null> {
        return this.redisClient.zScore(key, value);
    }

    // public async createSubscriber(channel: string): Promise<RedisClientType> {
    //     const subscriber = createClient();
    //     await subscriber.connect();
    //     await subscriber.subscribe(channel, (message) => {
    //         console.log(`Received message on channel ${channel}: ${message}`);
    //     });
    //     return subscriber as unknown as RedisClientType;
    // }
}
