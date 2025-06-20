import Redis from 'ioredis';

let redis: Redis | null = null;
const inMemoryCache: Record<string, { data: any; expires: number }> = {};

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('error', (err) => {
      console.error('[cache] Redis error, falling back to memory:', err.message);
      redis?.disconnect();
      redis = null;
    });
  } catch (err: any) {
    console.error('[cache] Failed to connect to Redis, falling back to memory:', err.message);
    redis = null;
  }
} else {
  console.warn('[cache] No REDIS_URL set. Using in-memory cache only.');
}

export { redis };

export async function getCachedVideoInfo(videoId: string) {
  if (redis) {
    const data = await redis.get(`video:${videoId}`);
    return data ? JSON.parse(data) : null;
  }
  const entry = inMemoryCache[videoId];
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  return null;
}

export async function setCachedVideoInfo(videoId: string, info: any, ttlSeconds = 3600) {
  if (redis) {
    await redis.set(`video:${videoId}`, JSON.stringify(info), 'EX', ttlSeconds);
  } else {
    inMemoryCache[videoId] = { data: info, expires: Date.now() + ttlSeconds * 1000 };
  }
}
