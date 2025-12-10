import { QdrantClient } from '@qdrant/js-client-rest';

let client = null;

export async function connectQdrant() {
  const url = process.env.QDRANT_URL || process.env.QDRANT_HOST;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url) {
    console.warn('⚠️  Qdrant connection details not provided. Skipping Qdrant connection.');
    return null;
  }

  try {
    client = new QdrantClient({
      url: url,
      apiKey: apiKey,
    });

    // 验证连接
    await client.getCollections();
    
    return client;
  } catch (error) {
    console.error('Failed to connect to Qdrant:', error);
    throw error;
  }
}

export function getClient() {
  if (!client) {
    throw new Error('Qdrant client not initialized. Call connectQdrant() first.');
  }
  return client;
}

export async function createCollection(collectionName, vectorSize) {
  try {
    await client.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });
    console.log(`Collection "${collectionName}" created successfully`);
  } catch (error) {
    console.error(`Failed to create collection "${collectionName}":`, error);
    throw error;
  }
}

export async function searchVectors(collectionName, vector, limit = 10) {
  try {
    const result = await client.search(collectionName, {
      vector: vector,
      limit: limit,
    });
    return result;
  } catch (error) {
    console.error('Failed to search vectors:', error);
    throw error;
  }
}
