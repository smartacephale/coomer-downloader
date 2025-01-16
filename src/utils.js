import nodeFetch from 'node-fetch';
import makeFetchCookie from 'fetch-cookie';

export const fetch = makeFetchCookie(nodeFetch);

export const isImage = (name) =>
  /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);

export const isVideo = (name) =>
  /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);

export const testMediaType = (name, type) =>
  type === 'all' ? true : type === 'image' ? isImage(name) : isVideo(name);

export const b2mb = (b) => Number.parseFloat((b / 1048576).toFixed(2));

export const UA = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};
