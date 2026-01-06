import os from 'node:os';
import path from 'node:path';
import type { ProviderAPI } from '../api/provider';
import type { MediaType } from '../types';
import { collectUniquesAndDuplicatesBy, removeDuplicatesBy } from '../utils/duplicates';
import { filterString } from '../utils/filters';
import { deleteFile, getFileHash, sanitizeFilename } from '../utils/io';
import { testMediaType } from '../utils/mediatypes';
import type { CoomerFile } from './file';

export class CoomerFileList {
  public dirPath?: string;
  public dirName?: string;
  public provider?: ProviderAPI;

  constructor(public files: CoomerFile[] = []) {}

  public setDirPath(dir: string, dirName?: string) {
    dirName = dirName || (this.dirName as string);

    if (dir === './') {
      this.dirPath = path.resolve(dir, dirName);
    } else {
      this.dirPath = path.join(os.homedir(), path.join(dir, dirName));
    }

    this.files.forEach((file) => {
      const safeName = sanitizeFilename(file.name) || file.name;
      file.filepath = path.join(this.dirPath as string, safeName);
    });

    return this;
  }

  public filterByText(include: string, exclude: string) {
    this.files = this.files.filter((f) => filterString(f.textContent, include, exclude));
    return this;
  }

  public filterByMediaType(media?: string) {
    if (media) {
      this.files = this.files.filter((f) => testMediaType(f.name, media as MediaType));
    }
    return this;
  }

  public skip(n: number) {
    this.files = this.files.slice(n);
    return this;
  }

  public async calculateFileSizes() {
    for (const file of this.files) {
      await file.calcDownloadedSize();
    }
    return this;
  }

  public getActiveFiles() {
    return this.files.filter((f) => f.active);
  }

  public getDownloaded() {
    return this.files.filter((f) => f.size && f.size <= f.downloaded);
  }

  public async removeDuplicatesByHash() {
    for (const file of this.files) {
      file.hash = await getFileHash(file.filepath);
    }

    const { duplicates } = collectUniquesAndDuplicatesBy(this.files, 'hash');

    // console.log({ duplicates });

    // logger.debug(`duplicates: ${JSON.stringify(duplicates)}`);

    duplicates.forEach((f) => {
      deleteFile(f.filepath);
    });
  }

  public removeURLDuplicates() {
    this.files = removeDuplicatesBy(this.files, 'url');
    return this;
  }
}
