import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

export async function readFileData(filePath: string) {
  try {
    const data = await readFile(filePath, 'utf8');
    return data;
  } catch (e) {
    console.error(e);
  }
}

export async function saveFileData(filePath: string, content: string) {
  try {
    await writeFile(filePath, content, 'utf8');
  } catch (e) {
    console.error(e);
  }
}

export async function getFileSize(filepath: string): Promise<number> {
  try {
    return (await stat(filepath)).size;
  } catch (_) {
    return 0;
  }
}

export async function getFileHash(filepath: string) {
  const hash = createHash('sha256');
  const filestream = fs.createReadStream(filepath);
  await pipeline(filestream, hash);
  return hash.digest('hex');
}

export async function makeDir(filepath: string): Promise<void> {
  try {
    await mkdir(filepath, { recursive: true });
  } catch (e) {
    console.error(e);
  }
}

export async function deleteFile(path: string) {
  try {
    await unlink(path);
  } catch (e) {
    console.error(e);
  }
}

export function resolvePath(dir: string, dirName: string) {
  let normalizedDir = dir;

  if (dir.startsWith('~')) {
    normalizedDir = path.join(os.homedir(), dir.slice(1));
  } else if (path.isAbsolute(dir)) {
    const { root } = path.parse(dir);
    normalizedDir = path.join(os.homedir(), dir.substring(root.length));
  }

  return path.resolve(normalizedDir, dirName);
}

export function sanitizeFilename(name: string) {
  if (!name) return name;

  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-') // Newlines (\r \n) are caught here
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.]+$/, '');
}
