import { getFileSize } from '../utils/io';

export class CoomerFile {
  public active = false;
  public hash?: string;

  constructor(
    public name: string,
    public url: string,
    public filepath = '',
    public size?: number,
    public downloaded = 0,
    public content?: string,
  ) {}

  public async calcDownloadedSize() {
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
