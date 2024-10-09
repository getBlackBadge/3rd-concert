import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { IMemoryDB } from './redis.interface';

@Injectable()
export class RedisRepository implements IMemoryDB {
    private readonly defaultTTL = 30000; // 30 seconds
    private redisClient: RedisClientType;

    constructor() {
        this.redisClient = createClient();
        this.redisClient.connect();
    }

    async set(key: string, value: string, ttl: number | null): Promise<boolean> {
        if (ttl === null) {
            await this.redisClient.set(key, value);
        } else {
            await this.redisClient.set(key, value, { EX: ttl });
        }
        return true;
    }

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
        await this.redisClient.subscribe(channel, (message) => {
            console.log(`Received message on channel ${channel}: ${message}`);
            callback(message);
        });
    }

    public async createSubscriber(channel: string): Promise<RedisClientType> {
        const subscriber = createClient();
        await subscriber.connect();
        await subscriber.subscribe(channel, (message) => {
            console.log(`Received message on channel ${channel}: ${message}`);
        });
        return subscriber as unknown as RedisClientType;
    }
}
