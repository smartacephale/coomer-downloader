import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
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

export function sanitizeFilename(name: string) {
  if (!name) return name;

  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-') // Newlines (\r \n) are caught here
    .replace(/\s+/g, ' ') // Turn tabs/multiple spaces into one space
    .trim()
    .replace(/[.]+$/, ''); // Remove trailing dots
}
