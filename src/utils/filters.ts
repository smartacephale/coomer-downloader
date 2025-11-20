import type { File, MediaType } from '../types';

export const isImage = (name: string) => /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);

export const isVideo = (name: string) =>
  /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);

export const testMediaType = (name: string, type: MediaType) =>
  type === 'all' ? true : type === 'image' ? isImage(name) : isVideo(name);

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

function filterString(text: string, include: string, exclude: string): boolean {
  return includesAllWords(text, parseQuery(include)) && includesNoWords(text, parseQuery(exclude));
}

export function filterKeywords(files: File[], include: string, exclude: string) {
  return files.filter((f) => {
    const text = `${f.name || ''} ${f.content || ''}`.toLowerCase();
    return filterString(text, include, exclude);
  });
}
