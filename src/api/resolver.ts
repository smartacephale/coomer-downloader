import type { CoomerFileList } from '../core/index.ts';
import { BunkrAPI } from './providers/bunkr.ts';
import { CoomerAPI } from './providers/coomer.ts';
import { GofileAPI } from './providers/gofile.ts';
import { PlainFileAPI } from './providers/plainfile.ts';
import { RedditAPI } from './providers/reddit.ts';

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
