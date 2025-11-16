import type { File, MediaType } from '../types';

export const isImage = (name: string) => /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);

export const isVideo = (name: string) =>
  /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);

export const testMediaType = (name: string, type: MediaType) =>
  type === 'all' ? true : type === 'image' ? isImage(name) : isVideo(name);

export function filterKeywords(files: File[], include: string, exclude: string) {
  const incl = include.split(',').map((x) => x.toLowerCase().trim());
  const excl = exclude.split(',').map((x) => x.toLowerCase().trim());

  const isValid = (text: string) =>
    incl.some((e) => text.includes(e)) &&
    (!exclude.trim().length || excl.every((e) => !text.includes(e)));

  return files.filter((f) => {
    const text = `${f.name || ''} ${f.content || ''}`.toLowerCase();
    return isValid(text);
  });
}
