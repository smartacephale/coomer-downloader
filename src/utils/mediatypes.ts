import type { MediaType } from '../types';

export function isImage(name: string) {
  return /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);
}

export function isVideo(name: string) {
  return /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);
}

export function testMediaType(name: string, type: MediaType) {
  return type === 'image' ? isImage(name) : isVideo(name);
}
