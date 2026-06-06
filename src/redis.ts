import { Redis } from 'ioredis';

async function createRedisConnection(): Promise<Redis> {
    return new Redis({
        port: 6379,
        host: 'localhost'
    });
}

const publisher = await createRedisConnection();
const subscriber = await createRedisConnection();
export { publisher, subscriber };
