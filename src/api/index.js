import { getBunkrData } from './bunkr.js';
import { getCoomerData } from './coomer-api.js';
import { getRedditData } from './nsfw.xxx.js';
import { getPlainFileData } from './plain-curl.js';

export async function apiHandler(url, mediaType) {
  if (/^u\/\w+$/.test(url.trim())) {
    return getRedditData(url, mediaType);
  }
  if (/coomer|kemono/.test(url)) {
    return getCoomerData(url, mediaType);
  }
  if (/bunkr/.test(url)) {
    return getBunkrData(url, mediaType);
  }
  if (/\.\w+/.test(url.split('/').pop())) {
    return getPlainFileData(url);
  }
  console.error('Wrong URL.');
}
