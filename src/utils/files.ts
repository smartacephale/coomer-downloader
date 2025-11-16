import fs from 'node:fs';

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
