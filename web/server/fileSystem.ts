import fs from 'fs/promises';
import path from 'path';
import simpleGit from 'simple-git';
import matter from 'gray-matter';

const DOCUMIND_REPO_PATH = '/home/ubuntu/documind';

export interface FileNode {
  name: string;
  displayName: string; // Chinese title from Front Matter
  path: string;
  type: 'file' | 'directory';
  assetType?: 'module' | 'page' | 'component' | 'api'; // Four-layer asset type
  children?: FileNode[];
}

/**
 * Extract Chinese title from markdown Front Matter
 */
async function extractTitle(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    return data.title || null;
  } catch (error) {
    return null;
  }
}

/**
 * Determine asset type based on directory structure
 */
function getAssetType(relativePath: string): 'module' | 'page' | 'component' | 'api' | null {
  const parts = relativePath.split('/');
  
  // Must be under docs/modules
  if (parts[0] !== 'docs' || parts[1] !== 'modules') return null;
  
  // docs/modules/[module-name]/README.md -> module
  if (parts.length === 4 && parts[3] === 'README.md') return 'module';
  
  // docs/modules/[module-name]/pages/*.md -> page
  if (parts.length === 5 && parts[3] === 'pages') return 'page';
  
  // docs/modules/[module-name]/components/*.md -> component
  if (parts.length === 5 && parts[3] === 'components') return 'component';
  
  // docs/modules/[module-name]/apis/*.md -> api
  if (parts.length === 5 && parts[3] === 'apis') return 'api';
  
  return null;
}

/**
 * Build file tree structure focusing on four-layer assets
 */
export async function buildFileTree(dirPath: string = DOCUMIND_REPO_PATH): Promise<FileNode[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      // Skip .git directory and other hidden files
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(DOCUMIND_REPO_PATH, fullPath);

      // Only process docs/modules directory
      if (dirPath === DOCUMIND_REPO_PATH) {
        if (entry.name !== 'docs') continue;
      } else if (dirPath === path.join(DOCUMIND_REPO_PATH, 'docs')) {
        if (entry.name !== 'modules') continue;
      }

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath);
        // Skip empty directories
        if (children.length === 0) continue;
        
        nodes.push({
          name: entry.name,
          displayName: entry.name,
          path: relativePath,
          type: 'directory',
          children,
        });
      } else if (entry.name.endsWith('.md')) {
        const assetType = getAssetType(relativePath);
        // Only include four-layer assets
        if (!assetType) continue;
        
        const title = await extractTitle(fullPath);
        nodes.push({
          name: entry.name,
          displayName: title || entry.name.replace('.md', ''),
          path: relativePath,
          type: 'file',
          assetType,
        });
      }
    }

    return nodes.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('[FileSystem] Error building file tree:', error);
    throw error;
  }
}

/**
 * Read file content from documind repository
 */
export async function readFileContent(relativePath: string): Promise<string> {
  try {
    const fullPath = path.join(DOCUMIND_REPO_PATH, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('[FileSystem] Error reading file:', error);
    throw error;
  }
}

/**
 * Write file content to documind repository
 */
export async function writeFileContent(relativePath: string, content: string): Promise<void> {
  try {
    const fullPath = path.join(DOCUMIND_REPO_PATH, relativePath);
    await fs.writeFile(fullPath, content, 'utf-8');
  } catch (error) {
    console.error('[FileSystem] Error writing file:', error);
    throw error;
  }
}

/**
 * Check if documind repository exists and is a git repo
 */
export async function checkDocumindRepo(): Promise<boolean> {
  try {
    const git = simpleGit(DOCUMIND_REPO_PATH);
    const isRepo = await git.checkIsRepo();
    return isRepo;
  } catch (error) {
    return false;
  }
}

/**
 * Get git status of documind repository
 */
export async function getGitStatus() {
  try {
    const git = simpleGit(DOCUMIND_REPO_PATH);
    const status = await git.status();
    return status;
  } catch (error) {
    console.error('[FileSystem] Error getting git status:', error);
    throw error;
  }
}

/**
 * Commit changes to documind repository
 */
export async function commitChanges(message: string, author: { name: string; email: string }) {
  try {
    const git = simpleGit(DOCUMIND_REPO_PATH);
    await git.addConfig('user.name', author.name);
    await git.addConfig('user.email', author.email);
    await git.add('.');
    await git.commit(message);
  } catch (error) {
    console.error('[FileSystem] Error committing changes:', error);
    throw error;
  }
}
