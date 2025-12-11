import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
// 使用any类型，因为Entity类型已经在db.ts中转换
type Entity = any;

let qdrantClient: QdrantClient | null = null;
let openaiClient: OpenAI | null = null;

const COLLECTION_NAME = "documind_entities";
const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small dimension

// 初始化Qdrant客户端
export function initQdrantClient(): QdrantClient {
  if (qdrantClient) {
    return qdrantClient;
  }

  const url = process.env.QDRANT_URL || "http://localhost:6333";
  qdrantClient = new QdrantClient({ url });

  console.log("[Qdrant] Client initialized");
  return qdrantClient;
}

// 初始化OpenAI客户端
function initOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("[OpenAI] Client initialized");
  return openaiClient;
}

// 创建collection
export async function createCollection(): Promise<void> {
  const client = initQdrantClient();

  try {
    // 检查collection是否存在
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Created collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`[Qdrant] Collection already exists: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error("[Qdrant] Failed to create collection:", error);
    throw error;
  }
}

// 文本向量化
export async function embedText(text: string): Promise<number[]> {
  const client = initOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("[OpenAI] Failed to embed text:", error);
    throw error;
  }
}

// 插入/更新实体向量
export async function upsertEntityVector(entity: Entity): Promise<void> {
  const client = initQdrantClient();

  try {
    // 构建向量化文本
    const textToEmbed = `${entity.name} ${entity.description || ""}`.trim();

    if (!textToEmbed) {
      console.log(`[Qdrant] Skipping entity ${entity.id}: no text to embed`);
      return;
    }

    // 生成向量
    const vector = await embedText(textToEmbed);

    // 插入到Qdrant
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: entity.id,
          vector: vector,
          payload: {
            entityId: entity.id,
            name: entity.name,
            type: entity.type,
            description: entity.description || "",
            uniqueId: entity.uniqueId,
            owner: entity.owner,
            status: entity.status,
          },
        },
      ],
    });

    console.log(`[Qdrant] Upserted entity vector: ${entity.name} (ID: ${entity.id})`);
  } catch (error) {
    console.error("[Qdrant] Failed to upsert entity vector:", error);
    // 不抛出错误，避免阻塞主流程
  }
}

// 删除实体向量
export async function deleteEntityVector(id: number): Promise<void> {
  const client = initQdrantClient();

  try {
    await client.delete(COLLECTION_NAME, {
      wait: true,
      points: [id],
    });

    console.log(`[Qdrant] Deleted entity vector: ID ${id}`);
  } catch (error) {
    console.error("[Qdrant] Failed to delete entity vector:", error);
    // 不抛出错误，避免阻塞主流程
  }
}

// 向量相似度搜索
export async function searchSimilarEntities(
  query: string,
  limit: number = 10
): Promise<
  Array<{
    entityId: number;
    name: string;
    type: string;
    description: string;
    score: number;
  }>
> {
  const client = initQdrantClient();

  try {
    // 向量化查询文本
    const queryVector = await embedText(query);

    // 搜索相似向量
    const searchResult = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: limit,
      with_payload: true,
    });

    const results = searchResult.map(result => ({
      entityId: result.payload?.entityId as number,
      name: result.payload?.name as string,
      type: result.payload?.type as string,
      description: result.payload?.description as string,
      score: result.score,
    }));

    console.log(`[Qdrant] Found ${results.length} similar entities for query: "${query}"`);
    return results;
  } catch (error) {
    console.error("[Qdrant] Failed to search similar entities:", error);
    return [];
  }
}

// 健康检查
export async function healthCheck(): Promise<boolean> {
  try {
    const client = initQdrantClient();
    await client.getCollections();
    return true;
  } catch (error) {
    console.error("[Qdrant] Health check failed:", error);
    return false;
  }
}

// 初始化（创建collection）
export async function initialize(): Promise<void> {
  try {
    initQdrantClient();
    await createCollection();
  } catch (error) {
    console.error("[Qdrant] Initialization failed:", error);
  }
}
