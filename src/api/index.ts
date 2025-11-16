import type { ApiResult, MediaType } from '../types';
import { getBunkrData } from './bunkr';
import { getCoomerData } from './coomer-api';
import { getGofileData } from './gofile';
import { getRedditData } from './nsfw.xxx';
import { getPlainFileData } from './plain-curl';

export async function apiHandler(
  url: string,
  mediaType: MediaType,
): Promise<ApiResult | undefined> {
  if (/^u\/\w+$/.test(url.trim())) {
    return getRedditData(url, mediaType);
  }
  if (/coomer|kemono/.test(url)) {
    return getCoomerData(url, mediaType);
  }
  if (/bunkr/.test(url)) {
    return getBunkrData(url, mediaType);
  }
  if (/gofile\.io/.test(url)) {
    return getGofileData(url, mediaType);
  }
  if (/\.\w+/.test(url.split('/').pop() as string)) {
    return getPlainFileData(url);
  }
  console.error('Wrong URL.');
}
