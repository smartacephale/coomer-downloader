import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { getFileSize } from './io';

type KindOfFile = { downloaded: number; filepath: string };

export async function calcHash(filepath: string) {
  const hash = createHash('sha256');
  const filestream = fs.createReadStream(filepath);
  await pipeline(filestream, hash);
  return hash.digest('hex');
}

export async function collectDuplicatesBy<
  T extends Record<K, string | number>,
  K extends keyof T,
>(files: T[], by: K | ((file: T) => Promise<string | number>)) {
  const dict: Map<string, T[]> = new Map();

  for (const f of files) {
    const key = (typeof by === 'function' ? await by(f) : f[by]).toString();
    if (!key || key === '0') continue;
    const files = dict.get(key) || [];
    dict.set(key, [f, ...files]);
  }

  dict.forEach((v, k) => {
    if (v.length < 2) {
      dict.delete(k);
    }
  });

  return dict;
}

export async function findDuplicatedFiles(files: KindOfFile[]) {
  const duplicatesBySize = await collectDuplicatesBy(files, (f) => getFileSize(f.filepath));
  const duplicatesBySize_ = Array.from(duplicatesBySize.values()).flat();
  const duplicatesByHash = await collectDuplicatesBy(duplicatesBySize_, (f) =>
    calcHash(f.filepath),
  );
  return duplicatesByHash;
}
