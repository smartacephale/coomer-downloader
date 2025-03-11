import * as cheerio from 'cheerio';
import { testMediaType, fetch } from './../utils.js';

async function getEncryptionData(slug) {
  const response = await fetch('https://bunkr.cr/api/vs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: slug }),
  });
  return await response.json();
}

function decryptEncryptedUrl(encryptionData) {
  const secretKey = `SECRET_KEY_${Math.floor(encryptionData.timestamp / 3600)}`;
  const encryptedUrlBuffer = Buffer.from(encryptionData.url, 'base64');
  const secretKeyBuffer = Buffer.from(secretKey, 'utf-8');
  return Array.from(encryptedUrlBuffer)
    .map((byte, i) =>
      String.fromCharCode(byte ^ secretKeyBuffer[i % secretKeyBuffer.length]),
    )
    .join('');
}

async function getFileData(url, name) {
  const slug = url.split('/').pop();
  const encryptionData = await getEncryptionData(slug);
  const src = decryptEncryptedUrl(encryptionData);
  return { name, src };
}

async function getGalleryFiles(url, mediaType) {
  const data = [];
  const page = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(page);
  const title = $('title').text();
  const url_ = new URL(url);

  const fileNames = Array.from(
    $('div[title]').map((_, e) => $(e).attr('title')),
  );

  const files = Array.from($('a').map((_, e) => $(e).attr('href')))
    .filter((a) => /\/f\/\w+/.test(a))
    .map((a, i) => ({
      src: `${url_.origin}${a}`,
      name: fileNames[i] || src.split('/').pop(),
    }));

  for (const { name, src } of files) {
    const res = await getFileData(src, name);
    data.push(res);
  }

  return { title, data: data.filter((f) => testMediaType(f.name, mediaType)) };
}

export async function getBunkrData(url, mediaType) {
  const { data: files, title } = await getGalleryFiles(url, mediaType);
  const dirName = `${title.split('|')[0].trim()}-bunkr`;
  return { dirName, files };
}
