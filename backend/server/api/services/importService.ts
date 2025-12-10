import { createEntity } from "./entityService";

/**
 * CSV 行数据接口
 */
interface CsvRow {
  original_path?: string;
  entity_id?: string;
  entity_title?: string;
  lark_doc_url?: string;
  migration_status?: string;
  error_message?: string;
  [key: string]: any;
}

/**
 * 从 CSV 数据导入实体
 */
export async function importFromCsv(csvData: CsvRow[], mapping?: Record<string, string>) {
  const results: Array<{
    row: number;
    status: "success" | "failed";
    entity_id?: string;
    error?: string;
  }> = [];

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];

    try {
      // 应用字段映射
      const entityId = mapping?.entity_id ? row[mapping.entity_id] : row.entity_id;
      const title = mapping?.entity_title ? row[mapping.entity_title] : row.entity_title;
      const documentUrl = mapping?.lark_doc_url ? row[mapping.lark_doc_url] : row.lark_doc_url;

      if (!title) {
        throw new Error("Title is required");
      }

      // 构建 metadata
      const metadata: Record<string, any> = {};
      
      if (row.original_path) {
        metadata.original_path = row.original_path;
      }
      
      if (row.migration_status) {
        metadata.migration_status = row.migration_status;
      }

      // 创建实体
      const entity = await createEntity({
        id: entityId || undefined,
        type: "document",
        title: title,
        status: row.migration_status === "Success" ? "active" : "draft",
        documentUrl: documentUrl || undefined,
        metadata,
      });

      results.push({
        row: i + 1,
        status: "success",
        entity_id: entity!.entityId,
      });

      successCount++;
    } catch (error: any) {
      results.push({
        row: i + 1,
        status: "failed",
        error: error.message,
      });

      failedCount++;
    }
  }

  return {
    total_rows: csvData.length,
    success_count: successCount,
    failed_count: failedCount,
    errors: results.filter((r) => r.status === "failed"),
  };
}

/**
 * 解析 CSV 文本
 */
export function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.trim().split("\n");
  
  if (lines.length === 0) {
    return [];
  }

  // 解析表头
  const headers = lines[0].split(",").map((h) => h.trim());

  // 解析数据行
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row);
  }

  return rows;
}
