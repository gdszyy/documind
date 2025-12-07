import fs from 'fs/promises';
import path from 'path';

const DOCUMIND_REPO_PATH = '/home/ubuntu/documind';
const TEMPLATES_PATH = path.join(DOCUMIND_REPO_PATH, 'docs/templates');

type AssetType = 'module' | 'page' | 'component' | 'api';

const TEMPLATE_MAP: Record<AssetType, string> = {
  module: 'module-template.md',
  page: 'page-template.md',
  component: 'component-template-v6.md',
  api: 'api-template.md',
};

/**
 * Get the directory path for an asset type within a module
 */
function getAssetDirectory(moduleName: string, assetType: AssetType): string {
  const basePath = path.join(DOCUMIND_REPO_PATH, 'docs/modules', moduleName);
  
  switch (assetType) {
    case 'module':
      return basePath;
    case 'page':
      return path.join(basePath, 'pages');
    case 'component':
      return path.join(basePath, 'components');
    case 'api':
      return path.join(basePath, 'apis');
  }
}

/**
 * Create a new asset from template
 */
export async function createAsset(
  moduleName: string,
  assetType: AssetType,
  fileName: string,
  title: string
): Promise<string> {
  try {
    // Read template
    const templatePath = path.join(TEMPLATES_PATH, TEMPLATE_MAP[assetType]);
    let template = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders with actual values
    const now = new Date().toISOString().split('T')[0];
    template = template
      .replace(/\[module-id\]/g, moduleName)
      .replace(/\[模块标题\]/g, title)
      .replace(/\[页面标题\]/g, title)
      .replace(/\[组件标题\]/g, title)
      .replace(/\[API标题\]/g, title)
      .replace(/\[YYYY-MM-DD\]/g, now)
      .replace(/title: \[.*?\]/g, `title: ${title}`);

    // Ensure directory exists
    const targetDir = getAssetDirectory(moduleName, assetType);
    await fs.mkdir(targetDir, { recursive: true });

    // Determine file name
    let targetFileName = fileName;
    if (!targetFileName.endsWith('.md')) {
      targetFileName += '.md';
    }
    
    // For module type, use README.md
    if (assetType === 'module') {
      targetFileName = 'README.md';
    }

    const targetPath = path.join(targetDir, targetFileName);
    
    // Check if file already exists
    try {
      await fs.access(targetPath);
      throw new Error(`File already exists: ${targetFileName}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Write file
    await fs.writeFile(targetPath, template, 'utf-8');

    // Return relative path
    return path.relative(DOCUMIND_REPO_PATH, targetPath);
  } catch (error) {
    console.error('[AssetOperations] Error creating asset:', error);
    throw error;
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(relativePath: string): Promise<void> {
  try {
    const fullPath = path.join(DOCUMIND_REPO_PATH, relativePath);
    
    // Security check: ensure path is within documind repo
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(DOCUMIND_REPO_PATH)) {
      throw new Error('Invalid path: outside of documind repository');
    }

    // Delete file
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('[AssetOperations] Error deleting asset:', error);
    throw error;
  }
}

/**
 * Get list of available templates
 */
export async function getTemplates(): Promise<{ type: AssetType; name: string }[]> {
  return Object.entries(TEMPLATE_MAP).map(([type, name]) => ({
    type: type as AssetType,
    name,
  }));
}
