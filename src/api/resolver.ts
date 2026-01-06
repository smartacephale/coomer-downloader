import type { CoomerFileList } from '../core/filelist';
import { BunkrAPI } from './providers/bunkr';
import { CoomerAPI } from './providers/coomer';
import { GofileAPI } from './providers/gofile';
import { PlainFileAPI } from './providers/plainfile';
import { RedditAPI } from './providers/reddit';

const providers = [RedditAPI, CoomerAPI, BunkrAPI, GofileAPI, PlainFileAPI];

export async function resolveAPI(url_: string): Promise<CoomerFileList> {
  const url = new URL(url_);

  for (const p of providers) {
    const provider = new p();
    if (provider.testURL(url)) {
      const filelist = await provider.getData(url.toString());
      filelist.provider = provider;
      return filelist;
    }
  }

  throw Error('Invalid URL');
}
