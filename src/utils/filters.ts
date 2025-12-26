import type { MediaType } from '../types';

export function isImage(name: string) {
  return /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);
}

export function isVideo(name: string) {
  return /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);
}

export function testMediaType(name: string, type: MediaType) {
  return type === 'all' ? true : type === 'image' ? isImage(name) : isVideo(name);
}

function includesAllWords(str: string, words: string[]) {
  if (!words.length) return true;
  return words.every((w) => str.includes(w));
}

function includesNoWords(str: string, words: string[]) {
  if (!words.length) return true;
  return words.every((w) => !str.includes(w));
}

function parseQuery(query: string) {
  return query
    .split(',')
    .map((x) => x.toLowerCase().trim())
    .filter((_) => _);
}

export function filterString(text: string, include: string, exclude: string): boolean {
  return includesAllWords(text, parseQuery(include)) && includesNoWords(text, parseQuery(exclude));
}

export function parseSizeValue(s: string) {
  if (!s) return NaN;
  const m = s.match(/^([0-9]+(?:\.[0-9]+)?)(b|kb|mb|gb)?$/i);
  if (!m) return NaN;
  const val = parseFloat(m[1]);
  const unit = (m[2] || 'b').toLowerCase();
  const mult = unit === 'kb' ? 1024 : unit === 'mb' ? 1024 ** 2 : unit === 'gb' ? 1024 ** 3 : 1;
  return Math.floor(val * mult);
}