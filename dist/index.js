#!/usr/bin/env node

// src/utils/downloader.ts
import fs2 from 'node:fs';
// src/index.ts
import os from 'node:os';
import path2 from 'node:path';
import path from 'node:path';
import process2 from 'node:process';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
// src/api/bunkr.ts
import * as cheerio from 'cheerio';
import { Subject } from 'rxjs';
import { fetch as fetch2 } from 'undici';

// src/api/coomer-api.ts
async function getUserProfileAPI(user) {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/profile`;
  const result = await fetch_(url).then((r) => r.json());
  return result;
}
async function getUserPostsAPI(user, offset) {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/posts?o=${offset}`;
  const posts = await fetch_(url).then((r) => r.json());
  return posts;
}
async function getUserFiles(user, mediaType) {
  const userPosts = [];
  const offset = 50;
  for (let i = 0; i < 1e3; i++) {
    const posts = await getUserPostsAPI(user, i * offset);
    userPosts.push(...posts);
    if (posts.length < 50) break;
  }
  const files = [];
  for (const p of userPosts) {
    const title = p.title.match(/\w+/g)?.join(' ') || '';
    const content = p.content;
    const date = p.published.replace(/T/, ' ');
    const datentitle = `${date} ${title}`.trim();
    const postFiles = [...p.attachments, p.file]
      .filter((f) => f.path)
      .filter((f) => testMediaType(f.name, mediaType))
      .map((f, i) => {
        const ext = f.name.split('.').pop();
        const name = `${datentitle} ${i + 1}.${ext}`;
        const url = `${user.domain}/${f.path}`;
        return { name, url, content };
      });
    files.push(...postFiles);
  }
  return files;
}
async function parseUser(url) {
  const [_, domain, service, id] = url.match(/(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|.|-]+)/);
  if (!domain || !service || !id) console.error('Invalid URL', url);
  const { name } = await getUserProfileAPI({ domain, service, id });
  return { domain, service, id, name };
}
async function getCoomerData(url, mediaType) {
  setGlobalHeaders({ accept: 'text/css' });
  const user = await parseUser(url);
  const dirName = `${user.name}-${user.service}`;
  const files = await getUserFiles(user, mediaType);
  return { dirName, files };
}

// src/utils/files.ts
import fs from 'node:fs';

async function getFileSize(filepath) {
  let size = 0;
  if (fs.existsSync(filepath)) {
    size = (await fs.promises.stat(filepath)).size || 0;
  }
  return size;
}
function mkdir(filepath) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }
}

// src/utils/promise.ts
async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
async function promiseRetry(fn, callbackVerify, retries = 3, delay = 1e3) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    if (callbackVerify?.()) {
      retries = 1e3;
    }
    return promiseRetry(fn, callbackVerify, retries - 1, delay);
  }
}

// src/utils/requests.ts
import { CookieAgent } from 'http-cookie-agent/undici';
import { CookieJar } from 'tough-cookie';
import { fetch, getGlobalDispatcher, interceptors, setGlobalDispatcher } from 'undici';

function setCookieJarDispatcher() {
  const jar = new CookieJar();
  const agent = new CookieAgent({ cookies: { jar } })
    .compose(interceptors.retry())
    .compose(interceptors.redirect({ maxRedirections: 3 }));
  setGlobalDispatcher(agent);
}
setCookieJarDispatcher();
var HeadersDefault = new Headers({
  accept: 'application/json, text/css',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});
function setGlobalHeaders(headers) {
  Object.keys(headers).forEach((k) => {
    HeadersDefault.set(k, headers[k]);
  });
}
function fetch_(url) {
  const requestHeaders = new Headers(HeadersDefault);
  return fetch(url, { headers: requestHeaders });
}
function fetchByteRange(url, downloadedSize) {
  const requestHeaders = new Headers(HeadersDefault);
  requestHeaders.set('Range', `bytes=${downloadedSize}-`);
  return fetch(url, { headers: requestHeaders });
}

// src/utils/timer.ts
var Timer = class _Timer {
  constructor(timeout = 1e4, timeoutCallback) {
    this.timeout = timeout;
    this.timeoutCallback = timeoutCallback;
    this.timeout = timeout;
  }
  timer = void 0;
  start() {
    this.timer = setTimeout(this.timeoutCallback, this.timeout);
    return this;
  }
  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = void 0;
    }
    return this;
  }
  reset() {
    this.stop();
    this.start();
    return this;
  }
  static withSignal(timeout) {
    const controller = new AbortController();
    const callback = () => {
      controller.abort();
    };
    const timer = new _Timer(timeout, callback).start();
    return {
      timer,
      signal: controller.signal,
    };
  }
};

// src/utils/downloader.ts
var subject = new Subject();
var CHUNK_TIMEOUT = 30;
var CHUNK_FETCH_RETRIES = 5;
async function fetchStream(file, stream) {
  subject.next({ type: 'CHUNK_DOWNLOADING_STARTED', file });
  const { timer, signal } = Timer.withSignal(CHUNK_TIMEOUT);
  const fileStream = fs2.createWriteStream(file.filepath, { flags: 'a' });
  const progressStream = new Transform({
    transform(chunk, _encoding, callback) {
      this.push(chunk);
      file.downloaded += chunk.length;
      timer.reset();
      subject.next({ type: 'CHUNK_DOWNLOADING_UPDATE', file });
      callback();
    },
  });
  await pipeline(stream, progressStream, fileStream, { signal }).catch((reason) => {
    fileStream.close();
    throw reason;
  });
  timer.stop();
  subject.next({ type: 'FILE_DOWNLOADING_FINISHED' });
}
async function downloadFile(file) {
  file.downloaded = await getFileSize(file.filepath);
  const response = await fetchByteRange(file.url, file.downloaded);
  if (!response?.ok && response?.status !== 416) {
    throw new Error(`HTTP error! status: ${response?.status}`);
  }
  const contentLength = response.headers.get('Content-Length');
  if (!contentLength && file.downloaded > 0) {
    return;
  }
  const restFileSize = parseInt(contentLength);
  file.size = restFileSize + file.downloaded;
  if (file.size > file.downloaded && response.body) {
    const stream = Readable.fromWeb(response.body);
    const sizeOld = file.downloaded;
    promiseRetry(
      async () => {
        await fetchStream(file, stream);
      },
      () => sizeOld === file.downloaded,
      CHUNK_FETCH_RETRIES,
    );
  }
}
async function downloadFiles(data, downloadDir) {
  mkdir(downloadDir);
  subject.next({ type: 'FILES_DOWNLOADING_STARTED', filesCount: data.length });
  for (const [index, file] of data.entries()) {
    file.filepath = path.join(downloadDir, file.name);
    subject.next({ type: 'FILE_DOWNLOADING_STARTED', index });
    await downloadFile(file);
  }
  subject.next({ type: 'FILES_DOWNLOADING_STARTED' });
}

// src/utils/filters.ts
var isImage = (name) => /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);
var isVideo = (name) => /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);
var testMediaType = (name, type) =>
  type === 'all' ? true : type === 'image' ? isImage(name) : isVideo(name);
function filterKeywords(files, include, exclude) {
  const incl = include.split(',').map((x) => x.toLowerCase().trim());
  const excl = exclude.split(',').map((x) => x.toLowerCase().trim());
  const isValid = (text) =>
    incl.some((e) => text.includes(e)) &&
    (!exclude.trim().length || excl.every((e) => !text.includes(e)));
  return files.filter((f) => {
    const text = `${f.name || ''} ${f.content || ''}`.toLowerCase();
    return isValid(text);
  });
}

// src/utils/multibar.ts
import { MultiBar } from 'cli-progress';

// src/utils/strings.ts
function b2mb(bytes) {
  return Number.parseFloat((bytes / 1048576).toFixed(2));
}
function formatNameStdout(pathname) {
  const name = pathname.split('/').pop() || '';
  const consoleWidth = process.stdout.columns;
  const width = Math.max((consoleWidth / 2) | 0, 40);
  if (name.length < width) return name.trim();
  const result = `${name.slice(0, width - 15)} ... ${name.slice(-10)}`.replace(/ +/g, ' ');
  return result;
}

// src/utils/multibar.ts
var config = {
  clearOnComplete: true,
  gracefulExit: true,
  autopadding: true,
  hideCursor: true,
  format: '{percentage}% | {filename} | {value}/{total}{size}',
};
function createMultibar() {
  const multibar = new MultiBar(config);
  let bar;
  let minibar;
  let filename;
  subject.subscribe({
    next: ({ type, filesCount, index, file }) => {
      switch (type) {
        case 'FILES_DOWNLOADING_STARTED':
          bar?.stop();
          bar = multibar.create(filesCount, 0);
          break;
        case 'FILES_DOWNLOADING_FINISHED':
          bar?.stop();
          break;
        case 'FILE_DOWNLOADING_STARTED':
          bar?.update(index + 1, { filename: 'Downloaded files', size: '' });
          break;
        case 'CHUNK_DOWNLOADING_STARTED':
          multibar?.remove(minibar);
          filename = formatNameStdout(file?.filepath);
          minibar = multibar.create(b2mb(file?.size), b2mb(file?.downloaded));
          break;
        case 'FILE_DOWNLOADING_FINISHED':
          multibar.remove(minibar);
          break;
        case 'CHUNK_DOWNLOADING_UPDATE':
          minibar?.update(b2mb(file?.downloaded), {
            filename,
            size: 'mb',
          });
          break;
        default:
          break;
      }
    },
  });
}

// src/api/bunkr.ts
async function getEncryptionData(slug) {
  const response = await fetch2('https://bunkr.cr/api/vs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  return await response.json();
}
function decryptEncryptedUrl(encryptionData) {
  const secretKey = `SECRET_KEY_${Math.floor(encryptionData.timestamp / 3600)}`;
  const encryptedUrlBuffer = Buffer.from(encryptionData.url, 'base64');
  const secretKeyBuffer = Buffer.from(secretKey, 'utf-8');
  return Array.from(encryptedUrlBuffer)
    .map((byte, i) => String.fromCharCode(byte ^ secretKeyBuffer[i % secretKeyBuffer.length]))
    .join('');
}
async function getFileData(url, name) {
  const slug = url.split('/').pop();
  const encryptionData = await getEncryptionData(slug);
  const src = decryptEncryptedUrl(encryptionData);
  return { name, url: src };
}
async function getGalleryFiles(url, mediaType) {
  const data = [];
  const page = await fetch2(url).then((r) => r.text());
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
      name: fileNames[i] || url.split('/').pop(),
    }));
  for (const { name, url: url2 } of files) {
    const res = await getFileData(url2, name);
    data.push(res);
  }
  return { title, files: data.filter((f) => testMediaType(f.name, mediaType)) };
}
async function getBunkrData(url, mediaType) {
  const { files, title } = await getGalleryFiles(url, mediaType);
  const dirName = `${title.split('|')[0].trim()}-bunkr`;
  return { dirName, files };
}

// src/api/gofile.ts
import { fetch as fetch3 } from 'undici';

async function getToken() {
  const response = await fetch3('https://api.gofile.io/accounts', {
    method: 'POST',
  });
  const data = await response.json();
  if (data.status === 'ok') {
    return data.data.token;
  }
  throw new Error('cannot get token');
}
async function getWebsiteToken() {
  const response = await fetch3('https://gofile.io/dist/js/global.js');
  const alljs = await response.text();
  const match = alljs.match(/appdata\.wt = "([^"]+)"/);
  if (match?.[1]) {
    return match[1];
  }
  throw new Error('cannot get wt');
}
async function getFolderFiles(id, token, websiteToken) {
  const url = `https://api.gofile.io/contents/${id}?wt=${websiteToken}&cache=true}`;
  const response = await fetch3(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  const files = Object.values(data.data.children).map((f) => ({
    url: f.link,
    name: f.name,
  }));
  return files;
}
async function getGofileData(url, mediaType) {
  const id = url.match(/gofile.io\/d\/(\w+)/)?.[1];
  const dirName = `gofile-${id}`;
  const token = await getToken();
  const websiteToken = await getWebsiteToken();
  const files = (await getFolderFiles(id, token, websiteToken)).filter((f) =>
    testMediaType(f.name, mediaType),
  );
  setGlobalHeaders({ Cookie: `accountToken=${token}` });
  return { dirName, files };
}

// src/api/nsfw.xxx.ts
import * as cheerio2 from 'cheerio';
import { fetch as fetch4 } from 'undici';

async function getUserPage(user, offset) {
  const url = `https://nsfw.xxx/page/${offset}?nsfw[]=0&types[]=image&types[]=video&types[]=gallery&slider=1&jsload=1&user=${user}&_=${Date.now()}`;
  return fetch4(url).then((r) => r.text());
}
async function getUserPosts(user) {
  console.log('Fetching user posts...');
  const posts = [];
  for (let i = 1; i < 1e5; i++) {
    const page = await getUserPage(user, i);
    if (page.length < 1) break;
    const $ = cheerio2.load(page);
    const newPosts = $('a')
      .map((_, a) => $(a).attr('href'))
      .get()
      .filter((href) => href?.startsWith('https://nsfw.xxx/post'));
    posts.push(...newPosts);
  }
  return posts;
}
async function getPostsData(posts, mediaType) {
  console.log('Fetching posts data...');
  const data = [];
  for (const post of posts) {
    const page = await fetch4(post).then((r) => r.text());
    const $ = cheerio2.load(page);
    const src =
      $('.sh-section .sh-section__image img').attr('src') ||
      $('.sh-section .sh-section__image video source').attr('src') ||
      null;
    if (!src) continue;
    const slug = post.split('post/')[1].split('?')[0];
    const date = $('.sh-section .sh-section__passed').first().text().replace(/ /g, '-') || '';
    const ext = src.split('.').pop();
    const name = `${slug}-${date}.${ext}`;
    data.push({ name, url: src });
  }
  return data.filter((f) => testMediaType(f.name, mediaType));
}
async function getRedditData(url, mediaType) {
  const user = url.match(/u\/(\w+)/)?.[1];
  const posts = await getUserPosts(user);
  const files = await getPostsData(posts, mediaType);
  const dirName = `${user}-reddit`;
  return { dirName, files };
}

// src/api/plain-curl.ts
async function getPlainFileData(url) {
  return {
    dirName: '',
    files: [
      {
        name: url.split('/').pop(),
        url,
      },
    ],
  };
}

// src/api/index.ts
async function apiHandler(url, mediaType) {
  if (/^u\/\w+$/.test(url.trim())) {
    return getRedditData(url, mediaType);
  }
  if (/coomer|kemono/.test(url)) {
    return getCoomerData(url, mediaType);
  }
  if (/bunkr/.test(url)) {
    return getBunkrData(url, mediaType);
  }
  if (/gofile\.io/.test(url)) {
    return getGofileData(url, mediaType);
  }
  if (/\.\w+/.test(url.split('/').pop())) {
    return getPlainFileData(url);
  }
  console.error('Wrong URL.');
}

// src/args-handler.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

function argumentHander() {
  return yargs(hideBin(process.argv))
    .option('url', {
      alias: 'u',
      type: 'string',
      description:
        'A URL from Coomer/Kemono/Bunkr/GoFile, a Reddit user (u/<username>), or a direct file link',
      demandOption: true,
    })
    .option('dir', {
      type: 'string',
      description: 'The directory where files will be downloaded',
      default: './',
    })
    .option('media', {
      type: 'string',
      choices: ['video', 'image', 'all'],
      default: 'all',
      description:
        "The type of media to download: 'video', 'image', or 'all'. 'all' is the default.",
    })
    .option('include', {
      type: 'string',
      default: '',
      description: 'Filter file names by a comma-separated list of keywords to include',
    })
    .option('exclude', {
      type: 'string',
      default: '',
      description: 'Filter file names by a comma-separated list of keywords to exclude',
    })
    .option('skip', {
      type: 'number',
      default: 0,
      description: 'Skips the first N files in the download queue',
    })
    .help()
    .alias('help', 'h')
    .parseSync();
}

// src/index.ts
async function run() {
  const { url, dir, media, include, exclude, skip } = argumentHander();
  const { dirName, files } = await apiHandler(url, media);
  const downloadDir =
    dir === './' ? path2.resolve(dir, dirName) : path2.join(os.homedir(), path2.join(dir, dirName));
  const filteredFiles = filterKeywords(files, include, exclude).slice(skip);
  console.table([
    {
      found: files.length,
      skip,
      filtered: files.length - filteredFiles.length - skip,
      folder: downloadDir,
    },
  ]);
  setGlobalHeaders({ Referer: url });
  createMultibar();
  await downloadFiles(filteredFiles, downloadDir);
  process2.kill(process2.pid, 'SIGINT');
}
run();
