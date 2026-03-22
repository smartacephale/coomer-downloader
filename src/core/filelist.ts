import path from 'node:path';
import type { ProviderAPI } from '../api/provider.ts';
import type { MediaType } from '../types/index.ts';
import {
  collectUniquesAndDuplicatesBy,
  removeDuplicatesBy,
} from '../utils/duplicates.ts';
import {
  deleteFile,
  getFileHash,
  readFileData,
  resolvePath,
  sanitizeFilename,
  saveFileData,
} from '../utils/io.ts';
import { testMediaType } from '../utils/mediatypes.ts';
import { filterString } from '../utils/strings.ts';
import type { CoomerFile } from './file.ts';

export class CoomerFileList {
  public dirPath?: string;
  public dirName?: string;
  public provider?: ProviderAPI;

  constructor(public files: CoomerFile[] = []) {}

  public setDirPath(dir: string, dirName?: string) {
    dirName = dirName || (this.dirName as string);

    this.dirPath = resolvePath(dir, dirName);

    this.files.forEach((file) => {
      const safeName = sanitizeFilename(file.name) || file.name;
      file.filepath = path.join(this.dirPath as string, safeName);
    });

    return this;
  }

  public get stateFilePath() {
    return path.resolve(this.dirPath as string, '.coomer.json');
  }

  public async saveState() {
    const state = this.finished.map((f) => ({
      finished: f.finished,
      url: f.url,
      name: f.name,
    }));

    const str = JSON.stringify(state, null, ' ');
    await saveFileData(this.stateFilePath, str);

    return this;
  }

  public async readState() {
    const savedStateStr = await readFileData(this.stateFilePath);
    if (!savedStateStr) return this;

    const savedState = JSON.parse(savedStateStr as string) as CoomerFile[];

    this.files.forEach((f) => {
      const savedFileState = savedState.find((s) => s.url === f.url);
      if (savedFileState) {
        Object.assign(f, savedFileState);
      }
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

  public get active() {
    return this.files.filter((f) => f.active);
  }

  public get finished() {
    return this.files.filter((f) => f.finished);
  }

  public get downloadedCount() {
    return this.finished.length;
  }

  public async removeDuplicatesByHash(should: boolean) {
    if (!should) return this;

    this.files = this.files.filter((f) => f.finished || f.downloaded > 0);

    for (const file of this.files) {
      file.hash = await getFileHash(file.filepath);
    }

    const { duplicates } = collectUniquesAndDuplicatesBy(this.files, 'hash');

    for (const f of duplicates) {
      await deleteFile(f.filepath);
    }

    return this;
  }

  public removeDuplicatesByUrl(should: boolean) {
    if (!should) return this;
    this.files = removeDuplicatesBy(this.files, 'url');
    return this;
  }
}
