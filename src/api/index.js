import { getBunkrData } from './bunkr.js';
import { getCoomerData } from './coomer-api.js';
import { getRedditData } from './nsfw.xxx.js';

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
  console.error('Wrong URL.');
}
