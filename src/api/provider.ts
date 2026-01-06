import type { CoomerFileList } from '../core/filelist';

export interface ProviderAPI {
  fixURL?(url: string, retries: number): string;
  testURL(url: URL): boolean;
  getData(url: string): Promise<CoomerFileList>;
}
