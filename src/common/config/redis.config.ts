import { createClient, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

export function createRedisClient(): RedisClient {
  const client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  })

  client.connect();

  return client;
}

export const redisClient = createRedisClient();
