export class CoomerFile {
  public active = false;
  public finished = false;
  public hash?: string;

  constructor(
    public name: string,
    public url: string,
    public filepath = '',
    public size?: number,
    public downloaded = 0,
    public content?: string,
  ) {}

  public get textContent() {
    return `${this.name || ''} ${this.content || ''}`.toLowerCase();
  }

  public static from(f: Pick<CoomerFile, 'name' | 'url'> & Partial<CoomerFile>) {
    return new CoomerFile(f.name, f.url, f.filepath, f.size, f.downloaded, f.content);
  }
}
