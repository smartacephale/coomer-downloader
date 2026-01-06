import { CoomerFile } from '../../core/file';
import { CoomerFileList } from '../../core/filelist';
import type { ProviderAPI } from '../provider';

export class PlainFileAPI implements ProviderAPI {
  public testURL(url: URL) {
    return /\.\w+/.test(url.pathname);
  }

  public async getData(url: string): Promise<CoomerFileList> {
    const name = url.split('/').pop() as string;
    const file = CoomerFile.from({ name, url });
    const filelist = new CoomerFileList([file]);
    filelist.dirName = '';
    return filelist;
  }
}
