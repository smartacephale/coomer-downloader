import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { access, constants, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export async function getFileSize(filepath: string) {
  let size = 0;
  if (fs.existsSync(filepath)) {
    size = (await fs.promises.stat(filepath)).size || 0;
  }
  return size;
}

export async function getFileHash(filepath: string) {
  const hash = createHash('sha256');
  const filestream = fs.createReadStream(filepath);
  await pipeline(filestream, hash);
  return hash.digest('hex');
}

export function mkdir(filepath: string) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }
}

export async function deleteFile(path: string) {
  await access(path, constants.F_OK);
  await unlink(path);
}

export function sanitizeFilename(name: string) {
  if (!name) return name;

  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-') // Newlines (\r \n) are caught here
    .replace(/\s+/g, ' ')                  // Turn tabs/multiple spaces into one space
    .trim()
    .replace(/[.]+$/, '');                 // Remove trailing dots
}
