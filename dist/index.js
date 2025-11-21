#!/usr/bin/env node

// src/index.ts
import process2 from "node:process";

// src/api/bunkr.ts
import * as cheerio from "cheerio";
import { fetch } from "undici";

// src/utils/file.ts
import os from "node:os";
import path from "node:path";

// src/utils/filters.ts
function isImage(name) {
  return /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);
}
function isVideo(name) {
  return /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);
}
function testMediaType(name, type) {
  return type === "all" ? true : type === "image" ? isImage(name) : isVideo(name);
}
function includesAllWords(str, words) {
  if (!words.length) return true;
  return words.every((w) => str.includes(w));
}
function includesNoWords(str, words) {
  if (!words.length) return true;
  return words.every((w) => !str.includes(w));
}
function parseQuery(query) {
  return query.split(",").map((x) => x.toLowerCase().trim()).filter((_) => _);
}
function filterString(text, include, exclude) {
  return includesAllWords(text, parseQuery(include)) && includesNoWords(text, parseQuery(exclude));
}

// src/utils/io.ts
import fs from "node:fs";
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

// src/utils/file.ts
var CoomerFile = class _CoomerFile {
  constructor(name, url, filepath, size, downloaded = 0, content) {
    this.name = name;
    this.url = url;
    this.filepath = filepath;
    this.size = size;
    this.downloaded = downloaded;
    this.content = content;
  }
  state = "pause";
  async getDownloadedSize() {
    this.downloaded = await getFileSize(this.filepath);
    return this;
  }
  get textContent() {
    const text = `${this.name || ""} ${this.content || ""}`.toLowerCase();
    return text;
  }
  static from(f) {
    return new _CoomerFile(f.name, f.url, f.filepath, f.size, f.downloaded, f.content);
  }
};
var CoomerFileList = class {
  constructor(files = []) {
    this.files = files;
  }
  dirPath;
  dirName;
  setDirPath(dir, dirName) {
    dirName = dirName || this.dirName;
    if (dir === "./") {
      this.dirPath = path.resolve(dir, dirName);
    } else {
      this.dirPath = path.join(os.homedir(), path.join(dir, dirName));
    }
    this.files.forEach((file) => {
      file.filepath = path.join(this.dirPath, file.name);
    });
    return this;
  }
  filterByText(include, exclude) {
    this.files = this.files.filter((f) => filterString(f.textContent, include, exclude));
    return this;
  }
  filterByMediaType(media) {
    if (media) {
      this.files = this.files.filter((f) => testMediaType(f.name, media));
    }
    return this;
  }
  skip(n) {
    this.files = this.files.slice(n);
    return this;
  }
  async calculateFileSizes() {
    for (const file of this.files) {
      await file.getDownloadedSize();
    }
  }
};

// src/api/bunkr.ts
async function getEncryptionData(slug) {
  const response = await fetch("https://bunkr.cr/api/vs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug })
  });
  return await response.json();
}
function decryptEncryptedUrl(encryptionData) {
  const secretKey = `SECRET_KEY_${Math.floor(encryptionData.timestamp / 3600)}`;
  const encryptedUrlBuffer = Buffer.from(encryptionData.url, "base64");
  const secretKeyBuffer = Buffer.from(secretKey, "utf-8");
  return Array.from(encryptedUrlBuffer).map((byte, i) => String.fromCharCode(byte ^ secretKeyBuffer[i % secretKeyBuffer.length])).join("");
}
async function getFileData(url, name) {
  const slug = url.split("/").pop();
  const encryptionData = await getEncryptionData(slug);
  const src = decryptEncryptedUrl(encryptionData);
  return CoomerFile.from({ name, url: src });
}
async function getGalleryFiles(url) {
  const filelist = new CoomerFileList();
  const page = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(page);
  const dirName = $("title").text();
  filelist.dirName = `${dirName.split("|")[0].trim()}-bunkr`;
  const url_ = new URL(url);
  if (url_.pathname.startsWith("/f/")) {
    const fileName = $("h1").text();
    const singleFile = await getFileData(url, fileName);
    filelist.files.push(singleFile);
    return filelist;
  }
  const fileNames = Array.from($("div[title]").map((_, e) => $(e).attr("title")));
  const data = Array.from($("a").map((_, e) => $(e).attr("href"))).filter((a) => /\/f\/\w+/.test(a)).map((a, i) => ({
    url: `${url_.origin}${a}`,
    name: fileNames[i] || url.split("/").pop()
  }));
  for (const { name, url: url2 } of data) {
    const res = await getFileData(url2, name);
    filelist.files.push(res);
  }
  return filelist;
}
async function getBunkrData(url) {
  const filelist = await getGalleryFiles(url);
  return filelist;
}

// src/utils/requests.ts
import { CookieAgent } from "http-cookie-agent/undici";
import { CookieJar } from "tough-cookie";
import { fetch as fetch2, interceptors, setGlobalDispatcher } from "undici";
function setCookieJarDispatcher() {
  const jar = new CookieJar();
  const agent = new CookieAgent({ cookies: { jar } }).compose(interceptors.retry()).compose(interceptors.redirect({ maxRedirections: 3 }));
  setGlobalDispatcher(agent);
}
setCookieJarDispatcher();
var HeadersDefault = new Headers({
  accept: "application/json, text/css",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
});
function setGlobalHeaders(headers) {
  Object.keys(headers).forEach((k) => {
    HeadersDefault.set(k, headers[k]);
  });
}
function fetchWithGlobalHeader(url) {
  const requestHeaders = new Headers(HeadersDefault);
  return fetch2(url, { headers: requestHeaders });
}
function fetchByteRange(url, downloadedSize) {
  const requestHeaders = new Headers(HeadersDefault);
  requestHeaders.set("Range", `bytes=${downloadedSize}-`);
  return fetch2(url, { headers: requestHeaders });
}

// src/api/coomer-api.ts
var SERVERS = ["n1", "n2", "n3", "n4"];
function tryFixCoomerUrl(url, attempts) {
  if (attempts < 2 && isImage(url)) {
    return url.replace(/\/data\//, "/thumbnail/data/").replace(/n\d\./, "img.");
  }
  const server = url.match(/n\d\./)?.[0].slice(0, 2);
  const i = SERVERS.indexOf(server);
  if (i !== -1) {
    const newServer = SERVERS[(i + 1) % SERVERS.length];
    return url.replace(/n\d./, `${newServer}.`);
  }
  return url;
}
async function getUserProfileData(user) {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/profile`;
  const result = await fetchWithGlobalHeader(url).then((r) => r.json());
  return result;
}
async function getUserPostsAPI(user, offset) {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/posts?o=${offset}`;
  const posts = await fetchWithGlobalHeader(url).then((r) => r.json());
  return posts;
}
async function getUserFiles(user) {
  const userPosts = [];
  const offset = 50;
  for (let i = 0; i < 1e3; i++) {
    const posts = await getUserPostsAPI(user, i * offset);
    userPosts.push(...posts);
    if (posts.length < 50) break;
  }
  const filelist = new CoomerFileList();
  for (const p of userPosts) {
    const title = p.title.match(/\w+/g)?.join(" ") || "";
    const content = p.content;
    const date = p.published.replace(/T/, " ");
    const datentitle = `${date} ${title}`.trim();
    const postFiles = [...p.attachments, p.file].filter((f) => f.path).map((f, i) => {
      const ext = f.name.split(".").pop();
      const name = `${datentitle} ${i + 1}.${ext}`;
      const url = `${user.domain}/${f.path}`;
      return CoomerFile.from({ name, url, content });
    });
    filelist.files.push(...postFiles);
  }
  return filelist;
}
async function parseUser(url) {
  const [_, domain, service, id] = url.match(
    /(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|.|-]+)/
  );
  if (!domain || !service || !id) console.error("Invalid URL", url);
  const { name } = await getUserProfileData({ domain, service, id });
  return { domain, service, id, name };
}
async function getCoomerData(url) {
  setGlobalHeaders({ accept: "text/css" });
  const user = await parseUser(url);
  const filelist = await getUserFiles(user);
  filelist.dirName = `${user.name}-${user.service}`;
  return filelist;
}

// src/api/gofile.ts
import { fetch as fetch3 } from "undici";
async function getToken() {
  const response = await fetch3("https://api.gofile.io/accounts", {
    method: "POST"
  });
  const data = await response.json();
  if (data.status === "ok") {
    return data.data.token;
  }
  throw new Error("cannot get token");
}
async function getWebsiteToken() {
  const response = await fetch3("https://gofile.io/dist/js/global.js");
  const alljs = await response.text();
  const match = alljs.match(/appdata\.wt = "([^"]+)"/);
  if (match?.[1]) {
    return match[1];
  }
  throw new Error("cannot get wt");
}
async function getFolderFiles(id, token, websiteToken) {
  const url = `https://api.gofile.io/contents/${id}?wt=${websiteToken}&cache=true}`;
  const response = await fetch3(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  const files = Object.values(data.data.children).map(
    (f) => CoomerFile.from({
      url: f.link,
      name: f.name
    })
  );
  return new CoomerFileList(files);
}
async function getGofileData(url) {
  const id = url.match(/gofile.io\/d\/(\w+)/)?.[1];
  const token = await getToken();
  const websiteToken = await getWebsiteToken();
  const filelist = await getFolderFiles(id, token, websiteToken);
  filelist.dirName = `gofile-${id}`;
  setGlobalHeaders({ Cookie: `accountToken=${token}` });
  return filelist;
}

// src/api/nsfw.xxx.ts
import * as cheerio2 from "cheerio";
import { fetch as fetch4 } from "undici";
async function getUserPage(user, offset) {
  const url = `https://nsfw.xxx/page/${offset}?nsfw[]=0&types[]=image&types[]=video&types[]=gallery&slider=1&jsload=1&user=${user}&_=${Date.now()}`;
  return fetch4(url).then((r) => r.text());
}
async function getUserPosts(user) {
  console.log("Fetching user posts...");
  const posts = [];
  for (let i = 1; i < 1e5; i++) {
    const page = await getUserPage(user, i);
    if (page.length < 1) break;
    const $ = cheerio2.load(page);
    const newPosts = $("a").map((_, a) => $(a).attr("href")).get().filter((href) => href?.startsWith("https://nsfw.xxx/post"));
    posts.push(...newPosts);
  }
  return posts;
}
async function getPostsData(posts) {
  console.log("Fetching posts data...");
  const filelist = new CoomerFileList();
  for (const post of posts) {
    const page = await fetch4(post).then((r) => r.text());
    const $ = cheerio2.load(page);
    const src = $(".sh-section .sh-section__image img").attr("src") || $(".sh-section .sh-section__image video source").attr("src") || null;
    if (!src) continue;
    const slug = post.split("post/")[1].split("?")[0];
    const date = $(".sh-section .sh-section__passed").first().text().replace(/ /g, "-") || "";
    const ext = src.split(".").pop();
    const name = `${slug}-${date}.${ext}`;
    filelist.files.push(CoomerFile.from({ name, url: src }));
  }
  return filelist;
}
async function getRedditData(url) {
  const user = url.match(/u\/(\w+)/)?.[1];
  const posts = await getUserPosts(user);
  const filelist = await getPostsData(posts);
  filelist.dirName = `${user}-reddit`;
  return filelist;
}

// src/api/plain-curl.ts
async function getPlainFileData(url) {
  const name = url.split("/").pop();
  const file = CoomerFile.from({ name, url });
  const filelist = new CoomerFileList([file]);
  filelist.dirName = "";
  return filelist;
}

// src/api/index.ts
async function apiHandler(url_) {
  const url = new URL(url_);
  if (/^u\/\w+$/.test(url.origin)) {
    return getRedditData(url.href);
  }
  if (/coomer|kemono/.test(url.origin)) {
    return getCoomerData(url.href);
  }
  if (/bunkr/.test(url.origin)) {
    return getBunkrData(url.href);
  }
  if (/gofile\.io/.test(url.origin)) {
    return getGofileData(url.href);
  }
  if (/\.\w+/.test(url.pathname)) {
    return getPlainFileData(url.href);
  }
  throw Error("Invalid URL");
}

// src/cli/args-handler.ts
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
function argumentHander() {
  return yargs(hideBin(process.argv)).option("url", {
    alias: "u",
    type: "string",
    description: "A URL from Coomer/Kemono/Bunkr/GoFile, a Reddit user (u/<username>), or a direct file link",
    demandOption: true
  }).option("dir", {
    type: "string",
    description: "The directory where files will be downloaded",
    default: "./"
  }).option("media", {
    type: "string",
    choices: ["video", "image", "all"],
    default: "all",
    description: "The type of media to download: 'video', 'image', or 'all'. 'all' is the default."
  }).option("include", {
    type: "string",
    default: "",
    description: "Filter file names by a comma-separated list of keywords to include"
  }).option("exclude", {
    type: "string",
    default: "",
    description: "Filter file names by a comma-separated list of keywords to exclude"
  }).option("skip", {
    type: "number",
    default: 0,
    description: "Skips the first N files in the download queue"
  }).help().alias("help", "h").parseSync();
}

// src/cli/multibar.ts
import { MultiBar } from "cli-progress";

// src/utils/strings.ts
function b2mb(bytes) {
  return Number.parseFloat((bytes / 1048576).toFixed(2));
}
function formatNameStdout(pathname) {
  const name = pathname.split("/").pop() || "";
  const consoleWidth = process.stdout.columns;
  const width = Math.max(consoleWidth / 2 | 0, 40);
  if (name.length < width) return name.trim();
  const result = `${name.slice(0, width - 15)} ... ${name.slice(-10)}`.replace(/ +/g, " ");
  return result;
}

// src/cli/multibar.ts
var config = {
  clearOnComplete: true,
  gracefulExit: true,
  autopadding: true,
  hideCursor: true,
  format: "{percentage}% | {filename} | {value}/{total}{size}"
};
function createMultibar(downloader) {
  const multibar = new MultiBar(config);
  let bar;
  let minibar;
  let filename;
  let index = 0;
  downloader.subject.subscribe({
    next: ({ type, filesCount, file }) => {
      switch (type) {
        case "FILES_DOWNLOADING_START":
          bar?.stop();
          bar = multibar.create(filesCount, 0);
          break;
        case "FILES_DOWNLOADING_END":
          bar?.stop();
          break;
        case "FILE_DOWNLOADING_START":
          bar?.update(++index, { filename: "Downloaded files", size: "" });
          break;
        case "FILE_DOWNLOADING_END":
          multibar.remove(minibar);
          break;
        case "CHUNK_DOWNLOADING_START":
          multibar?.remove(minibar);
          filename = formatNameStdout(file?.filepath);
          minibar = multibar.create(b2mb(file?.size), b2mb(file?.downloaded));
          break;
        case "CHUNK_DOWNLOADING_UPDATE":
          minibar?.update(b2mb(file?.downloaded), {
            filename,
            size: "mb"
          });
          break;
        case "CHUNK_DOWNLOADING_END":
          multibar?.remove(minibar);
          break;
        default:
          break;
      }
    }
  });
}

// src/utils/downloader.ts
import fs2 from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Subject } from "rxjs";

// src/utils/promise.ts
async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
var PromiseRetry = class _PromiseRetry {
  retries;
  delay;
  callback;
  constructor(options) {
    this.retries = options.retries || 3;
    this.delay = options.delay || 1e3;
    this.callback = options.callback;
  }
  async execute(fn) {
    let retries = this.retries;
    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (retries <= 0) {
          throw error;
        }
        if (this.callback) {
          const res = this.callback(retries, error);
          if (res) {
            const { newRetries } = res;
            if (newRetries === 0) throw error;
            this.retries = newRetries || retries;
          }
        }
        await sleep(this.delay);
        retries--;
      }
    }
  }
  static create(options) {
    return new _PromiseRetry(options);
  }
};

// src/utils/timer.ts
var Timer = class _Timer {
  constructor(timeout = 1e4, timeoutCallback) {
    this.timeout = timeout;
    this.timeoutCallback = timeoutCallback;
    this.timeout = timeout;
  }
  timer = void 0;
  start() {
    this.timer = setTimeout(() => {
      this.stop();
      this.timeoutCallback();
    }, this.timeout);
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
  static withSignal(timeout, message) {
    const controller = new AbortController();
    const callback = () => {
      controller.abort(message);
    };
    const timer = new _Timer(timeout, callback).start();
    return {
      timer,
      signal: controller.signal
    };
  }
};

// src/utils/downloader.ts
var Downloader = class {
  constructor(chunkTimeout = 3e4, chunkFetchRetries = 5, fetchRetries = 7) {
    this.chunkTimeout = chunkTimeout;
    this.chunkFetchRetries = chunkFetchRetries;
    this.fetchRetries = fetchRetries;
  }
  subject = new Subject();
  async fetchStream(file, stream) {
    const { subject, chunkTimeout } = this;
    const { timer, signal } = Timer.withSignal(chunkTimeout, "chunkTimeout");
    const fileStream = fs2.createWriteStream(file.filepath, { flags: "a" });
    const progressStream = new Transform({
      transform(chunk, _encoding, callback) {
        this.push(chunk);
        file.downloaded += chunk.length;
        timer.reset();
        subject.next({ type: "CHUNK_DOWNLOADING_UPDATE", file });
        callback();
      }
    });
    try {
      subject.next({ type: "CHUNK_DOWNLOADING_START", file });
      await pipeline(stream, progressStream, fileStream, { signal });
    } catch (error) {
      console.error(error.name === "AbortError" ? signal.reason : error);
    } finally {
      subject.next({ type: "CHUNK_DOWNLOADING_END", file });
    }
  }
  async downloadFile(file) {
    file.downloaded = await getFileSize(file.filepath);
    const response = await fetchByteRange(file.url, file.downloaded);
    if (!response?.ok && response?.status !== 416) {
      throw new Error(`HTTP error! status: ${response?.status}`);
    }
    const contentLength = response.headers.get("Content-Length");
    if (!contentLength && file.downloaded > 0) return;
    const restFileSize = parseInt(contentLength);
    file.size = restFileSize + file.downloaded;
    if (file.size > file.downloaded && response.body) {
      const stream = Readable.fromWeb(response.body);
      const sizeOld = file.downloaded;
      await PromiseRetry.create({
        retries: this.chunkFetchRetries,
        callback: () => {
          if (sizeOld !== file.downloaded) {
            return { newRetries: 5 };
          }
        }
      }).execute(async () => await this.fetchStream(file, stream));
    }
    this.subject.next({ type: "FILE_DOWNLOADING_END" });
  }
  async downloadFiles(filelist) {
    mkdir(filelist.dirPath);
    this.subject.next({ type: "FILES_DOWNLOADING_START", filesCount: filelist.files.length });
    for (const file of filelist.files) {
      this.subject.next({ type: "FILE_DOWNLOADING_START" });
      await PromiseRetry.create({
        retries: this.fetchRetries,
        callback: (retries) => {
          if (/coomer|kemono/.test(file.url)) {
            file.url = tryFixCoomerUrl(file.url, retries);
          }
        }
      }).execute(async () => await this.downloadFile(file));
      this.subject.next({ type: "FILE_DOWNLOADING_END" });
    }
    this.subject.next({ type: "FILES_DOWNLOADING_END" });
  }
};

// src/index.ts
async function run() {
  const { url, dir, media, include, exclude, skip } = argumentHander();
  const filelist = await apiHandler(url);
  const found = filelist.files.length;
  filelist.setDirPath(dir);
  filelist.skip(skip);
  filelist.filterByText(include, exclude);
  filelist.filterByMediaType(media);
  console.table([
    {
      found,
      skip,
      filtered: found - filelist.files.length,
      folder: filelist.dirPath
    }
  ]);
  setGlobalHeaders({ Referer: url });
  const downloader = new Downloader();
  createMultibar(downloader);
  await downloader.downloadFiles(filelist);
  process2.kill(process2.pid, "SIGINT");
}
run();
