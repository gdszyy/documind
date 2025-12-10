import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not configured");
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("✅ Connected to database");
  console.log("🔄 Creating tables...");

  try {
    // 创建 documind_entities 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`documind_entities\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`entityId\` varchar(255) NOT NULL UNIQUE,
        \`type\` varchar(50) NOT NULL,
        \`title\` varchar(500) NOT NULL,
        \`status\` varchar(50) NOT NULL DEFAULT 'active',
        \`documentUrl\` varchar(1000),
        \`metadata\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deletedAt\` timestamp NULL,
        INDEX \`idx_entityId\` (\`entityId\`),
        INDEX \`idx_type\` (\`type\`),
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_deletedAt\` (\`deletedAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Created documind_entities table");

    // 创建 documind_relationships 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`documind_relationships\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`relationshipId\` varchar(255) NOT NULL UNIQUE,
        \`sourceId\` varchar(255) NOT NULL,
        \`targetId\` varchar(255) NOT NULL,
        \`relationshipType\` varchar(50) NOT NULL,
        \`metadata\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_relationshipId\` (\`relationshipId\`),
        INDEX \`idx_sourceId\` (\`sourceId\`),
        INDEX \`idx_targetId\` (\`targetId\`),
        INDEX \`idx_relationshipType\` (\`relationshipType\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Created documind_relationships table");

    // 检查表是否存在
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'documind_%'
    `);

    console.log("\n📊 Database tables:");
    console.log(tables);

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
