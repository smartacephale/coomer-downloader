import fs from 'node:fs';
import nodeFetch from 'node-fetch';
import makeFetchCookie from 'fetch-cookie';
export { TransformWithTimeout } from './streams.js';

export const fetch = makeFetchCookie(nodeFetch);

export const DEFAULT_HEADERS = new Headers({
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});

export function fetchByteRange(url, existingFileSize) {
  const requestHeaders = new Headers(DEFAULT_HEADERS);

  requestHeaders.set('Range', `bytes=${existingFileSize}-`);

  const headers = Object.fromEntries(requestHeaders.entries());

  return fetch(url, { headers });
}

export const isImage = (name) =>
  /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);

export const isVideo = (name) =>
  /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);

export const testMediaType = (name, type) =>
  type === 'all' ? true : type === 'image' ? isImage(name) : isVideo(name);

export const b2mb = (b) => Number.parseFloat((b / 1048576).toFixed(2));

export function filterKeywords(files, include, exclude) {
  const incl = include.split(',').map((x) => x.toLowerCase().trim());
  const excl = exclude.split(',').map((x) => x.toLowerCase().trim());

  const isValid = text => incl.some(e => text.includes(e)) && 
    (!exclude.trim().length || excl.every((e) => !text.includes(e)));

  return files
    .filter(f => { 
      const text = `${f.name || ""} ${f.content || ""}`.toLowerCase();
      return isValid(text);
    });
}

export async function getFileSize(file) {
  let size = 0;
  if (fs.existsSync(file)) {
    size = (await fs.promises.stat(file)).size || 0;
  }
  return size;
}
