import type { CoomerFileList } from '../core/index.ts';

export interface ProviderAPI {
  fixURL?(url: string, retries: number): string;
  testURL(url: URL): boolean;
  getData(url: string): Promise<CoomerFileList>;
}
