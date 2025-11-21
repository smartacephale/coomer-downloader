import type { CoomerFileList } from '../utils/file';
import { getBunkrData } from './bunkr';
import { getCoomerData } from './coomer-api';
import { getGofileData } from './gofile';
import { getRedditData } from './nsfw.xxx';
import { getPlainFileData } from './plain-curl';

export async function apiHandler(url_: string): Promise<CoomerFileList> {
  const url = new URL(url_);

  if (/^u\/\w+$/.test(url.origin)) {
    return getRedditData(url.href);
  }

  if (/coomer|kemono/.test(url.origin)) {
    return getCoomerData(url.href);
  }

  if (/bunkr/.test(url.origin)) {
    return getBunkrData(url.href);
  }

  if (/gofile\.io/.test(url.origin)) {
    return getGofileData(url.href);
  }

  if (/\.\w+/.test(url.pathname)) {
    return getPlainFileData(url.href);
  }

  throw Error('Invalid URL');
}
