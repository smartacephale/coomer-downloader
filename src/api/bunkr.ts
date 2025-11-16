import * as cheerio from 'cheerio';
import { fetch } from 'undici';
import type { ApiResult, MediaType } from '../types/index.js';
import { testMediaType } from '../utils/index.js';

type EncData = { url: string; timestamp: number };

async function getEncryptionData(slug: string): Promise<EncData> {
  const response = await fetch('https://bunkr.cr/api/vs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: slug }),
  });
  return (await response.json()) as EncData;
}

function decryptEncryptedUrl(encryptionData: EncData) {
  const secretKey = `SECRET_KEY_${Math.floor(encryptionData.timestamp / 3600)}`;
  const encryptedUrlBuffer = Buffer.from(encryptionData.url, 'base64');
  const secretKeyBuffer = Buffer.from(secretKey, 'utf-8');
  return Array.from(encryptedUrlBuffer)
    .map((byte, i) => String.fromCharCode(byte ^ secretKeyBuffer[i % secretKeyBuffer.length]))
    .join('');
}

async function getFileData(url: string, name: string) {
  const slug = url.split('/').pop() as string;
  const encryptionData = await getEncryptionData(slug);
  const src = decryptEncryptedUrl(encryptionData);
  return { name, url: src };
}

async function getGalleryFiles(url: string, mediaType: MediaType) {
  const data = [];
  const page = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(page);
  const title = $('title').text();
  const url_ = new URL(url);

  if (url_.pathname.startsWith('/f/')) {
    const fileName = $('h1').text();
    const singleFile = await getFileData(url, fileName);
    data.push(singleFile);
    return { title, files: data.filter((f) => testMediaType(f.name, mediaType)) };
  }

  const fileNames = Array.from($('div[title]').map((_, e) => $(e).attr('title')));

  const files = Array.from($('a').map((_, e) => $(e).attr('href')))
    .filter((a) => /\/f\/\w+/.test(a))
    .map((a, i) => ({
      url: `${url_.origin}${a}`,
      name: fileNames[i] || (url.split('/').pop() as string),
    }));

  for (const { name, url } of files) {
    const res = await getFileData(url, name);
    data.push(res);
  }

  return { title, files: data.filter((f) => testMediaType(f.name, mediaType)) };
}

export async function getBunkrData(url: string, mediaType: MediaType): Promise<ApiResult> {
  const { files, title } = await getGalleryFiles(url, mediaType);
  const dirName = `${title.split('|')[0].trim()}-bunkr`;
  return { dirName, files };
}
