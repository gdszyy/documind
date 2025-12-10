import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;

// 初始化Redis客户端
export async function initRedisClient(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = createClient({ url });

  redisClient.on("error", (err) => {
    console.error("[Redis] Client error:", err);
  });

  redisClient.on("connect", () => {
    console.log("[Redis] Client connected");
  });

  await redisClient.connect();

  console.log("[Redis] Client initialized");
  return redisClient;
}

// 关闭Redis连接
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("[Redis] Client closed");
  }
}

// 获取缓存
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!redisClient) {
      await initRedisClient();
    }

    const value = await redisClient!.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[Redis] Failed to get cache for key: ${key}`, error);
    return null;
  }
}

// 设置缓存
export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    if (!redisClient) {
      await initRedisClient();
    }

    const serialized = JSON.stringify(value);
    await redisClient!.setEx(key, ttlSeconds, serialized);

    console.log(`[Redis] Set cache: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`[Redis] Failed to set cache for key: ${key}`, error);
  }
}

// 删除缓存
export async function deleteCache(key: string): Promise<void> {
  try {
    if (!redisClient) {
      await initRedisClient();
    }

    await redisClient!.del(key);
    console.log(`[Redis] Deleted cache: ${key}`);
  } catch (error) {
    console.error(`[Redis] Failed to delete cache for key: ${key}`, error);
  }
}

// 批量删除缓存（支持通配符）
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    if (!redisClient) {
      await initRedisClient();
    }

    const keys = await redisClient!.keys(pattern);

    if (keys.length > 0) {
      await redisClient!.del(keys);
      console.log(`[Redis] Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`[Redis] Failed to delete cache pattern: ${pattern}`, error);
  }
}

// 健康检查
export async function healthCheck(): Promise<boolean> {
  try {
    if (!redisClient) {
      await initRedisClient();
    }

    const pong = await redisClient!.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("[Redis] Health check failed:", error);
    return false;
  }
}

// 缓存Key生成器
export const CacheKeys = {
  // 实体列表缓存
  entitiesList: (search: string, page: number, limit: number, sortBy: string, order: string) =>
    `entities:list:${search}:${page}:${limit}:${sortBy}:${order}`,

  // 单个实体缓存
  entity: (id: number) => `entity:${id}`,

  // 图谱数据缓存
  graph: (types?: string[], statuses?: string[]) =>
    `graph:${(types || []).join(",")}:${(statuses || []).join(",")}`,

  // 实体关系缓存
  entityRelationships: (id: number) => `entity:${id}:relationships`,
};

// 缓存TTL配置（秒）
export const CacheTTL = {
  ENTITIES_LIST: 300, // 5分钟
  ENTITY: 600, // 10分钟
  GRAPH: 180, // 3分钟
  RELATIONSHIPS: 300, // 5分钟
};
