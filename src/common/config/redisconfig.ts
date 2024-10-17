// To be implemented
// import { FactoryProvider } from '@nestjs/common';
// import { createClient, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';

// export const redisProvider: FactoryProvider = {
//   provide: 'REDIS_CLIENT',
//   useFactory: async (): Promise<RedisClientType<RedisModules, RedisFunctions, RedisScripts>> => {
//     const client = createClient({
//       url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || '6379'}`,
//     }) as RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

//     client.on('error', (err) => console.error('Redis Client Error', err));
//     await client.connect();
//     return client;
//   },
// };