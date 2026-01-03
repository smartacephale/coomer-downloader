import os from 'node:os';
import path from 'node:path';
import type { MediaType } from '../types';
import { collectDuplicatesBy, findDuplicatedFiles } from '../utils/duplicates';
import { filterString } from '../utils/filters';
import { getFileSize } from '../utils/io';
import { testMediaType } from '../utils/mediatypes';

export class CoomerFile {
  public active = false;

  constructor(
    public name: string,
    public url: string,
    public filepath = '',
    public size?: number,
    public downloaded = 0,
    public content?: string,
  ) {}

  public async getDownloadedSize() {
    this.downloaded = await getFileSize(this.filepath as string);
    return this;
  }

  public get textContent() {
    const text = `${this.name || ''} ${this.content || ''}`.toLowerCase();
    return text;
  }

  public static from(f: Pick<CoomerFile, 'name' | 'url'> & Partial<CoomerFile>) {
    return new CoomerFile(f.name, f.url, f.filepath, f.size, f.downloaded, f.content);
  }
}

export class CoomerFileList {
  public dirPath?: string;
  public dirName?: string;

  constructor(public files: CoomerFile[] = []) {}

  public setDirPath(dir: string, dirName?: string) {
    dirName = dirName || (this.dirName as string);

    if (dir === './') {
      this.dirPath = path.resolve(dir, dirName);
    } else {
      this.dirPath = path.join(os.homedir(), path.join(dir, dirName));
    }

    this.files.forEach((file) => {
      file.filepath = path.join(this.dirPath as string, file.name);
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
      await file.getDownloadedSize();
    }
    return this;
  }

  public getActiveFiles() {
    return this.files.filter((f) => f.active);
  }

  public getDownloaded() {
    return this.files.filter((f) => f.size && f.size <= f.downloaded);
  }

  public async findDuplicates() {
    // console.log(collectDuplicatesBy(this.files, 'url'));
    // return await findDuplicatedFiles(this.files);
    // slice(1).forEach remove
    return collectDuplicatesBy(this.files, 'url');
  }
}
