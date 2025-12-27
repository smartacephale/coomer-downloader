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

export function sanitizeFilename(name: string) {
  if (!name) return name;
  // Remove control characters and replace characters invalid on Windows
  // < > : " / \ | ? * and newline/carriage returns
  const invalid = /[<>:\"/\\|?*\x00-\x1F]/g;
  const cleaned = name.replace(invalid, '-').replace(/\r|\n/g, '');
  // Collapse multiple spaces and trim
  return cleaned.replace(/\s+/g, ' ').trim();
}
