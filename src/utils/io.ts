import fs from 'node:fs';
import { access, constants, unlink } from 'node:fs/promises';

export async function getFileSize(filepath: string) {
  let size = 0;
  if (fs.existsSync(filepath)) {
    size = (await fs.promises.stat(filepath)).size || 0;
  }
  return size;
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

export function saveJSON(value: any, filename: string) {
  fs.writeFileSync(filename, JSON.stringify(value));
}
