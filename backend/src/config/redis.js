import { createClient } from 'redis';

let client = null;

export async function connectRedis() {
  const url = process.env.REDIS_URL || process.env.REDIS_HOST;

  if (!url) {
    console.warn('⚠️  Redis connection details not provided. Skipping Redis connection.');
    return null;
  }

  try {
    client = createClient({
      url: url,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis client connected');
    });

    await client.connect();
    
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export async function disconnectRedis() {
  if (client) {
    await client.quit();
    console.log('Redis connection closed');
  }
}

export function getClient() {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return client;
}

export async function setCache(key, value, expirationInSeconds = 3600) {
  try {
    await client.set(key, JSON.stringify(value), {
      EX: expirationInSeconds,
    });
  } catch (error) {
    console.error('Failed to set cache:', error);
    throw error;
  }
}

export async function getCache(key) {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to get cache:', error);
    throw error;
  }
}

export async function deleteCache(key) {
  try {
    await client.del(key);
  } catch (error) {
    console.error('Failed to delete cache:', error);
    throw error;
  }
}
