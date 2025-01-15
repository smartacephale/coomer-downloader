import * as cheerio from 'cheerio';
import { testMediaType, fetch } from './../utils.js';

async function getPageFile(url) {
  const page = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(page);
  const name = $('title').text().split('|')[0].trim();

  const src0 = Array.from($('a').map((_, e) => $(e).attr('href')))
    .filter((a) => /\/file\/\w+/.test(a))
    .pop();

  const page2 = await fetch(src0).then((r) => r.text());
  const $2 = cheerio.load(page2);
  const src = $2('a').first().attr('href');

  return { name, src };
}

async function getGalleryFiles(url, mediaType) {
  const data = [];

  const page = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(page);
  const title = $('title').text();

  const url_ = new URL(url);

  const fileLinks = Array.from($('a').map((_, e) => $(e).attr('href')))
    .filter((a) => /\/f\/\w+/.test(a))
    .map((a) => `${url_.origin}${a}`);

  for (const fileLink of fileLinks) {
    const res = await getPageFile(fileLink);
    data.push(res);
  }

  return {
    title,
    data: data.filter((f) => testMediaType(f.name, mediaType)),
  };
}

export async function getBunkrData(url, mediaType) {
  const { data: files, title } = await getGalleryFiles(url, mediaType);
  const dirName = `${title.split('|')[0].trim()}-bunkr`;
  return { dirName, files };
}
