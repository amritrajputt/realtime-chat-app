import { Redis } from 'ioredis';

async function createRedisConnection(): Promise<Redis> {
    if (process.env.REDIS_URL) {
        return new Redis(process.env.REDIS_URL);
    }
    return new Redis({
        port: 6379,
        host: 'localhost'
    });
}

const publisher = await createRedisConnection();
const subscriber = await createRedisConnection();
export { publisher, subscriber };
