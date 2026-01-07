#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

// src/index.ts
import process2 from "node:process";

// src/api/providers/bunkr.ts
import * as cheerio from "cheerio";
import { fetch } from "undici";

// src/utils/io.ts
import { createHash } from "node:crypto";
import fs from "node:fs";
import { access, constants, unlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
async function getFileSize(filepath) {
  let size = 0;
  if (fs.existsSync(filepath)) {
    size = (await fs.promises.stat(filepath)).size || 0;
  }
  return size;
}
async function getFileHash(filepath) {
  const hash = createHash("sha256");
  const filestream = fs.createReadStream(filepath);
  await pipeline(filestream, hash);
  return hash.digest("hex");
}
function mkdir(filepath) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }
}
async function deleteFile(path2) {
  await access(path2, constants.F_OK);
  await unlink(path2);
}
function sanitizeFilename(name) {
  if (!name) return name;
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

// src/core/file.ts
var CoomerFile = class _CoomerFile {
  constructor(name, url, filepath = "", size, downloaded = 0, content) {
    this.name = name;
    this.url = url;
    this.filepath = filepath;
    this.size = size;
    this.downloaded = downloaded;
    this.content = content;
  }
  active = false;
  hash;
  async calcDownloadedSize() {
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

// src/core/filelist.ts
import os from "node:os";
import path from "node:path";

// src/utils/duplicates.ts
function collectUniquesAndDuplicatesBy(xs, k) {
  const seen = /* @__PURE__ */ new Set();
  return xs.reduce(
    (acc, item) => {
      if (seen.has(item[k])) {
        acc.duplicates.push(item);
      } else {
        seen.add(item[k]);
        acc.uniques.push(item);
      }
      return acc;
    },
    { uniques: [], duplicates: [] }
  );
}
function removeDuplicatesBy(xs, k) {
  return [...new Map(xs.map((x) => [x[k], x])).values()];
}

// src/utils/filters.ts
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
function parseSizeValue(s) {
  if (!s) return NaN;
  const m = s.match(/^([0-9]+(?:\.[0-9]+)?)(b|kb|mb|gb)?$/i);
  if (!m) return NaN;
  const val = parseFloat(m[1]);
  const unit = (m[2] || "b").toLowerCase();
  const mult = unit === "kb" ? 1024 : unit === "mb" ? 1024 ** 2 : unit === "gb" ? 1024 ** 3 : 1;
  return Math.floor(val * mult);
}

// src/utils/mediatypes.ts
function isImage(name) {
  return /\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i.test(name);
}
function isVideo(name) {
  return /\.(mp4|m4v|avi|mov|mkv|webm|flv|wmv|mpeg|mpg|3gp)$/i.test(name);
}
function testMediaType(name, type) {
  return type === "image" ? isImage(name) : isVideo(name);
}

// src/core/filelist.ts
var CoomerFileList = class {
  constructor(files = []) {
    this.files = files;
  }
  dirPath;
  dirName;
  provider;
  setDirPath(dir, dirName) {
    dirName = dirName || this.dirName;
    if (dir === "./") {
      this.dirPath = path.resolve(dir, dirName);
    } else {
      this.dirPath = path.join(os.homedir(), path.join(dir, dirName));
    }
    this.files.forEach((file) => {
      const safeName = sanitizeFilename(file.name) || file.name;
      file.filepath = path.join(this.dirPath, safeName);
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
      await file.calcDownloadedSize();
    }
    return this;
  }
  getActiveFiles() {
    return this.files.filter((f) => f.active);
  }
  getDownloaded() {
    return this.files.filter((f) => f.size && f.size <= f.downloaded);
  }
  async removeDuplicatesByHash() {
    for (const file of this.files) {
      file.hash = await getFileHash(file.filepath);
    }
    const { duplicates } = collectUniquesAndDuplicatesBy(this.files, "hash");
    duplicates.forEach((f) => {
      deleteFile(f.filepath);
    });
  }
  removeURLDuplicates() {
    this.files = removeDuplicatesBy(this.files, "url");
    return this;
  }
};

// src/api/providers/bunkr.ts
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
  return Array.from(encryptedUrlBuffer).map(
    (byte, i) => String.fromCharCode(byte ^ secretKeyBuffer[i % secretKeyBuffer.length])
  ).join("");
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
var BunkrAPI = class {
  testURL(url) {
    return /bunkr/.test(url.origin);
  }
  async getData(url) {
    const filelist = await getGalleryFiles(url);
    return filelist;
  }
};

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
function fetchByteRange(url, downloadedSize, signal) {
  const requestHeaders = new Headers(HeadersDefault);
  requestHeaders.set("Range", `bytes=${downloadedSize}-`);
  return fetch2(url, { headers: requestHeaders, signal });
}

// src/api/providers/coomer.ts
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
  for (let i = 0; i < 1e4; i++) {
    const posts = await getUserPostsAPI(user, i * offset);
    userPosts.push(...posts);
    if (posts.length < offset) break;
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
      const url = getUrl(f, user);
      return CoomerFile.from({ name, url, content });
    });
    filelist.files.push(...postFiles);
  }
  return filelist;
}
function getUrl(f, user) {
  const normalizedPath = f.path.replace(/^\/+/, "/");
  let url = "";
  try {
    url = new URL(normalizedPath, user.domain).toString();
  } catch (_) {
    url = `${user.domain}/${normalizedPath.replace(/^\//, "")}`;
  }
  return url;
}
async function parseUser(url) {
  const [_, domain, service, id] = url.match(
    /(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|.|-]+)/
  );
  if (!domain || !service || !id) console.error("Invalid URL", url);
  const { name } = await getUserProfileData({ domain, service, id });
  return { domain, service, id, name };
}
var CoomerAPI = class _CoomerAPI {
  static SERVERS = ["n1", "n2", "n3", "n4"];
  fixURL(url, retries) {
    if (retries < 2 && isImage(url)) {
      return url.replace(/\/data\//, "/thumbnail/data/").replace(/n\d\./, "img.");
    }
    const server = url.match(/n\d\./)?.[0].slice(0, 2);
    const i = _CoomerAPI.SERVERS.indexOf(server);
    if (i !== -1) {
      const newServer = _CoomerAPI.SERVERS[(i + 1) % _CoomerAPI.SERVERS.length];
      return url.replace(/n\d./, `${newServer}.`);
    }
    return url;
  }
  testURL(url) {
    return /coomer|kemono/.test(url.origin);
  }
  async getData(url) {
    setGlobalHeaders({ accept: "text/css" });
    const user = await parseUser(url);
    const filelist = await getUserFiles(user);
    filelist.dirName = `${user.name}-${user.service}`;
    return filelist;
  }
};

// src/api/providers/gofile.ts
import { fetch as fetch3 } from "undici";
async function getToken() {
  const response = await fetch3("https://api.gofile.io/accounts", {
    method: "POST"
  });
  const data = await response.json();
  if (data.status === "ok") {
    return data.data.token;
  }
  throw new Error("Token Not Found");
}
async function getWebsiteToken() {
  const config = await fetch3("https://gofile.io/dist/js/config.js").then((r) => r.text());
  const wt = config.match(/appdata\.wt = "([^"]+)"/)?.[1];
  if (wt) return wt;
  throw new Error("Token Not Found");
}
async function getFolderFiles(id, token, websiteToken) {
  const url = `https://api.gofile.io/contents/${id}?wt=${websiteToken}&cache=true}`;
  const response = await fetch3(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      referrer: "https://gofile.io",
      "x-website-token": websiteToken
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
var GofileAPI = class {
  testURL(url) {
    return /gofile\.io/.test(url.origin);
  }
  async getData(url) {
    const id = url.match(/gofile.io\/d\/(\w+)/)?.[1];
    const token = await getToken();
    const websiteToken = await getWebsiteToken();
    setGlobalHeaders({ Cookie: `accountToken=${token}` });
    const filelist = await getFolderFiles(id, token, websiteToken);
    filelist.dirName = `gofile-${id}`;
    return filelist;
  }
};

// src/api/providers/plainfile.ts
var PlainFileAPI = class {
  testURL(url) {
    return /\.\w+/.test(url.pathname);
  }
  async getData(url) {
    const name = url.split("/").pop();
    const file = CoomerFile.from({ name, url });
    const filelist = new CoomerFileList([file]);
    filelist.dirName = "";
    return filelist;
  }
};

// src/api/providers/reddit.ts
import { fetch as fetch4 } from "undici";

// src/core/downloader.ts
import fs2 from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline as pipeline2 } from "node:stream/promises";
import { Subject } from "rxjs";

// src/utils/error.ts
function printError(err, options = {}) {
  const e = err;
  const status = Number(
    e?.response?.status || e?.status || e?.message?.match(/\d{3}/)?.[0] || 500
  );
  const type = e?.code || e?.name || "Error";
  const message = e?.message || "No details";
  const quietList = options.quiet ?? [403, 404];
  const isQuiet = quietList.includes(status);
  console.error(
    `\x1B[31m[ERROR]\x1B[0m \x1B[33m${status}\x1B[0m | \x1B[36m${type}\x1B[0m: ${message}`
  );
  if (options.context) {
    console.error("\x1B[90mContext:\x1B[0m", options.context);
  }
  if (!isQuiet && e?.stack) {
    console.error(`
\x1B[90mStack Trace:
${e.stack}\x1B[0m`);
  }
}

// src/utils/promise.ts
async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// src/utils/timer.ts
var Timer = class _Timer {
  constructor(timeout = 1e4, timeoutCallback) {
    this.timeout = timeout;
    this.timeoutCallback = timeoutCallback;
    this.timeout = timeout;
  }
  timer;
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
  static withAbortController(timeout, abortControllerSubject, message = "TIMEOUT") {
    const callback = () => {
      abortControllerSubject.next(message);
    };
    const timer = new _Timer(timeout, callback).start();
    return { timer };
  }
};

// src/core/downloader.ts
var Downloader = class {
  constructor(filelist, minSize, maxSize, chunkTimeout = 3e4, chunkFetchRetries = 5, fetchRetries = 7) {
    this.filelist = filelist;
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.chunkTimeout = chunkTimeout;
    this.chunkFetchRetries = chunkFetchRetries;
    this.fetchRetries = fetchRetries;
    this.setAbortControllerListener();
  }
  subject = new Subject();
  abortController = new AbortController();
  abortControllerSubject = new Subject();
  setAbortControllerListener() {
    this.abortControllerSubject.subscribe((type) => {
      this.abortController.abort(type);
      this.abortController = new AbortController();
    });
  }
  async fetchStream(file, stream, sizeOld = 0, retries = this.chunkFetchRetries) {
    const signal = this.abortController.signal;
    const subject = this.subject;
    const { timer } = Timer.withAbortController(
      this.chunkTimeout,
      this.abortControllerSubject
    );
    try {
      const fileStream = fs2.createWriteStream(file.filepath, { flags: "a" });
      const progressStream = new Transform({
        transform(chunk, _encoding, callback) {
          this.push(chunk);
          file.downloaded += chunk.length;
          timer.reset();
          subject.next({ type: "CHUNK_DOWNLOADING_UPDATE" });
          callback();
        }
      });
      subject.next({ type: "CHUNK_DOWNLOADING_START" });
      await pipeline2(stream, progressStream, fileStream, { signal });
    } catch (error) {
      if (signal.aborted) {
        if (signal.reason === "FILE_SKIP") return;
        if (signal.reason === "TIMEOUT") {
          if (retries === 0 && sizeOld < file.downloaded) {
            retries += this.chunkFetchRetries;
            sizeOld = file.downloaded;
          }
          if (retries === 0) return;
          return await this.fetchStream(file, stream, sizeOld, retries - 1);
        }
      }
      throw error;
    } finally {
      subject.next({ type: "CHUNK_DOWNLOADING_END" });
      timer.stop();
    }
  }
  skip() {
    this.abortControllerSubject.next("FILE_SKIP");
  }
  filterFileSize(file) {
    if (!file.size) return;
    if (this.minSize && file.size < this.minSize || this.maxSize && file.size > this.maxSize) {
      try {
        deleteFile(file.filepath);
      } catch {
      }
      this.skip();
      return;
    }
  }
  async downloadFile(file, retries = this.fetchRetries) {
    const signal = this.abortController.signal;
    try {
      file.downloaded = await getFileSize(file.filepath);
      const response = await fetchByteRange(file.url, file.downloaded, signal);
      if (!response?.ok && response?.status !== 416) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }
      const contentLength = response.headers.get("Content-Length");
      if (!contentLength && file.downloaded > 0) return;
      const restFileSize = parseInt(contentLength);
      file.size = restFileSize + file.downloaded;
      this.filterFileSize(file);
      if (file.size > file.downloaded && response.body) {
        const stream = Readable.fromWeb(response.body);
        stream.setMaxListeners(20);
        await this.fetchStream(file, stream, file.downloaded);
      }
    } catch (error) {
      if (signal.aborted) {
        if (signal.reason === "FILE_SKIP") return;
      }
      if (retries > 0) {
        if (this.filelist.provider?.fixURL) {
          file.url = this.filelist.provider.fixURL(file.url, retries);
        }
        await sleep(1e3);
        return await this.downloadFile(file, retries - 1);
      }
      throw error;
    }
  }
  async downloadFiles() {
    mkdir(this.filelist.dirPath);
    this.subject.next({ type: "FILES_DOWNLOADING_START" });
    for (const file of this.filelist.files) {
      file.active = true;
      this.subject.next({ type: "FILE_DOWNLOADING_START" });
      try {
        await this.downloadFile(file);
      } catch (e) {
        printError(e, { quiet: [403], context: file.url });
      }
      file.active = false;
      this.subject.next({ type: "FILE_DOWNLOADING_END" });
    }
    this.subject.next({ type: "FILES_DOWNLOADING_END" });
  }
};

// src/api/providers/reddit.ts
async function getUserPage(user, offset) {
  const url = `https://nsfw.xxx/api/v1/user/${user}/newest?page=${offset}&types[]=image&types[]=video&types[]=gallery&nsfw[]=0&nsfw[]=1&nsfw[]=2&nsfw[]=3&nsfw[]=4`;
  const res = await fetch4(url).then((r) => r.json());
  return res;
}
async function getUserPostsData(user) {
  const filelist = new CoomerFileList();
  for (let i = 1; i < 1e4; i++) {
    const { data } = await getUserPage(user, i);
    if (data.posts.length < 1) break;
    data.posts.forEach((post) => {
      const date = post.publishedAt;
      const title = post.content.title;
      const name = `${date} ${title}`;
      const preview = post.data.url;
      const files = (post.data.videos_v2 || []).filter((f) => !f.url.includes("imgur"));
      if (files?.length === 0 && preview) {
        files.push({ format: "jpg", url: preview });
      }
      files.forEach(({ format, url }, i2) => {
        const index = i2 > 0 ? ` ${i2}` : "";
        const _name = `${name}${index}.${format}`;
        filelist.files.push(CoomerFile.from({ name: _name, url }));
      });
    });
  }
  return filelist;
}
var RedditAPI = class {
  testURL(url) {
    return /^\/user\/[\w-]+$/.test(url.pathname);
  }
  async getData(url) {
    const user = url.match(/\/user\/([\w-]+)/)?.[1];
    const filelist = await getUserPostsData(user);
    filelist.dirName = `${user}-reddit`;
    return filelist;
  }
};

// src/api/resolver.ts
var providers = [RedditAPI, CoomerAPI, BunkrAPI, GofileAPI, PlainFileAPI];
async function resolveAPI(url_) {
  const url = new URL(url_);
  for (const p of providers) {
    const provider = new p();
    if (provider.testURL(url)) {
      const filelist = await provider.getData(url.toString());
      filelist.provider = provider;
      return filelist;
    }
  }
  throw Error("Invalid URL");
}

// src/cli/parse-args.ts
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
function parseArgs() {
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
    choices: ["video", "image"],
    description: "The type of media to download: 'video', 'image', or 'all'. 'all' is the default."
  }).option("include", {
    type: "string",
    default: "",
    description: "Filter file names by a comma-separated list of keywords to include"
  }).option("exclude", {
    type: "string",
    default: "",
    description: "Filter file names by a comma-separated list of keywords to exclude"
  }).option("min-size", {
    type: "string",
    default: "",
    description: 'Minimum file size to download. Example: "1mb" or "500kb"'
  }).option("max-size", {
    type: "string",
    default: "",
    description: 'Maximum file size to download. Example: "1mb" or "500kb"'
  }).option("skip", {
    type: "number",
    default: 0,
    description: "Skips the first N files in the download queue"
  }).option("remove-dupilicates", {
    type: "boolean",
    default: true,
    description: "removes duplicates by url and file hash"
  }).help().alias("help", "h").parseSync();
}

// src/cli/ui/index.tsx
import { render } from "ink";
import React10 from "react";

// src/cli/ui/app.tsx
import { Box as Box7 } from "ink";
import React9 from "react";

// src/cli/ui/components/file.tsx
import { Box as Box2, Spacer, Text as Text2 } from "ink";
import React3 from "react";

// src/utils/strings.ts
function b2mb(bytes) {
  return (bytes / 1048576).toFixed(2);
}

// src/cli/ui/hooks/downloader.ts
import { useRef, useSyncExternalStore } from "react";

// src/cli/ui/store/index.ts
import { create } from "zustand";
var useInkStore = create((set) => ({
  preview: false,
  switchPreview: () => set((state) => ({
    preview: !state.preview
  })),
  downloader: void 0,
  setDownloader: (downloader) => set({ downloader })
}));

// src/cli/ui/hooks/downloader.ts
var useDownloaderHook = (subjectEvents) => {
  const downloader = useInkStore((state) => state.downloader);
  const versionRef = useRef(0);
  useSyncExternalStore(
    (onStoreChange) => {
      if (!downloader) return () => {
      };
      const sub = downloader.subject.subscribe(({ type }) => {
        if (subjectEvents.includes(type)) {
          versionRef.current++;
          onStoreChange();
        }
      });
      return () => sub.unsubscribe();
    },
    () => versionRef.current
  );
  return downloader?.filelist;
};

// src/cli/ui/components/preview.tsx
import { Box } from "ink";
import Image, { TerminalInfoProvider } from "ink-picture";
import React from "react";
function Preview({ file }) {
  const previewEnabled = useInkStore((state) => state.preview);
  const bigEnough = file.downloaded > 50 * 1024;
  const shouldShow = previewEnabled && bigEnough && isImage(file.filepath);
  const imgInfo = `
    can't read partial images yet...
    actual size: ${file.size}}
    downloaded: ${file.downloaded}}
  `;
  return shouldShow && /* @__PURE__ */ React.createElement(Box, { paddingX: 1 }, /* @__PURE__ */ React.createElement(TerminalInfoProvider, null, /* @__PURE__ */ React.createElement(Box, { width: 30, height: 15 }, /* @__PURE__ */ React.createElement(Image, { src: file.filepath, alt: imgInfo }))));
}

// src/cli/ui/components/spinner.tsx
import spinners from "cli-spinners";
import { Text } from "ink";
import React2, { useEffect, useState } from "react";
function Spinner({ type = "dots" }) {
  const spinner = spinners[type];
  const randomFrame = spinner.frames.length * Math.random() | 0;
  const [frame, setFrame] = useState(randomFrame);
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        return (previousFrame + 1) % spinner.frames.length;
      });
    }, spinner.interval);
    return () => {
      clearInterval(timer);
    };
  }, [spinner]);
  return /* @__PURE__ */ React2.createElement(Text, null, spinner.frames[frame]);
}

// src/cli/ui/components/file.tsx
var FileBox = React3.memo(({ file }) => {
  useDownloaderHook(["CHUNK_DOWNLOADING_UPDATE"]);
  const percentage = Number(file.downloaded / file.size * 100).toFixed(2);
  return /* @__PURE__ */ React3.createElement(React3.Fragment, null, /* @__PURE__ */ React3.createElement(
    Box2,
    {
      borderStyle: "single",
      borderColor: "magentaBright",
      borderDimColor: true,
      paddingX: 1,
      flexDirection: "column"
    },
    /* @__PURE__ */ React3.createElement(Box2, null, /* @__PURE__ */ React3.createElement(Text2, { color: "blue", dimColor: true, wrap: "truncate-middle" }, file.name)),
    /* @__PURE__ */ React3.createElement(Box2, { flexDirection: "row-reverse" }, /* @__PURE__ */ React3.createElement(Text2, { color: "cyan", dimColor: true }, b2mb(file.downloaded), "/", file.size ? b2mb(file.size) : "\u221E", " MB"), /* @__PURE__ */ React3.createElement(Text2, { color: "redBright", dimColor: true }, file.size ? `  ${percentage}% ` : ""), /* @__PURE__ */ React3.createElement(Spacer, null), /* @__PURE__ */ React3.createElement(Text2, { color: "green", dimColor: true }, /* @__PURE__ */ React3.createElement(Spinner, null)))
  ), /* @__PURE__ */ React3.createElement(Preview, { file }));
});

// src/cli/ui/components/filelist.tsx
import React4 from "react";
function FileListBox() {
  const filelist = useDownloaderHook(["FILE_DOWNLOADING_START", "FILE_DOWNLOADING_END"]);
  return /* @__PURE__ */ React4.createElement(React4.Fragment, null, filelist?.getActiveFiles().map((file) => {
    return /* @__PURE__ */ React4.createElement(FileBox, { file, key: file.name });
  }));
}

// src/cli/ui/components/filelist-state.tsx
import { Box as Box3, Text as Text3 } from "ink";
import React5 from "react";
function FileListStateBox() {
  const filelist = useDownloaderHook(["FILE_DOWNLOADING_START", "FILE_DOWNLOADING_END"]);
  return /* @__PURE__ */ React5.createElement(
    Box3,
    {
      paddingX: 1,
      flexDirection: "column",
      borderStyle: "single",
      borderColor: "magenta",
      borderDimColor: true
    },
    /* @__PURE__ */ React5.createElement(Box3, null, /* @__PURE__ */ React5.createElement(Box3, { marginRight: 1 }, /* @__PURE__ */ React5.createElement(Text3, { color: "cyanBright", dimColor: true }, "Found:")), /* @__PURE__ */ React5.createElement(Text3, { color: "blue", dimColor: true, wrap: "wrap" }, filelist?.files.length)),
    /* @__PURE__ */ React5.createElement(Box3, null, /* @__PURE__ */ React5.createElement(Box3, { marginRight: 1 }, /* @__PURE__ */ React5.createElement(Text3, { color: "cyanBright", dimColor: true }, "Downloaded:")), /* @__PURE__ */ React5.createElement(Text3, { color: "blue", dimColor: true, wrap: "wrap" })),
    /* @__PURE__ */ React5.createElement(Box3, null, /* @__PURE__ */ React5.createElement(Box3, { width: 9 }, /* @__PURE__ */ React5.createElement(Text3, { color: "cyanBright", dimColor: true }, "Folder:")), /* @__PURE__ */ React5.createElement(Box3, { flexGrow: 1 }, /* @__PURE__ */ React5.createElement(Text3, { color: "blue", dimColor: true, wrap: "truncate-middle" }, filelist?.dirPath)))
  );
}

// src/cli/ui/components/keyboardinfo.tsx
import { Box as Box4, Text as Text4 } from "ink";
import React6 from "react";
var info = {
  "s ": "skip current file",
  p: "on/off image preview"
};
function KeyboardControlsInfo() {
  const infoRender = Object.entries(info).map(([key, value]) => {
    return /* @__PURE__ */ React6.createElement(Box4, { key }, /* @__PURE__ */ React6.createElement(Box4, { marginRight: 2 }, /* @__PURE__ */ React6.createElement(Text4, { color: "red", dimColor: true, bold: true }, key)), /* @__PURE__ */ React6.createElement(Text4, { dimColor: true, bold: false }, value));
  });
  return /* @__PURE__ */ React6.createElement(
    Box4,
    {
      flexDirection: "column",
      paddingX: 1,
      borderStyle: "single",
      borderColor: "gray",
      borderDimColor: true
    },
    /* @__PURE__ */ React6.createElement(Box4, null, /* @__PURE__ */ React6.createElement(Text4, { color: "red", dimColor: true, bold: true }, "Keyboard controls:")),
    infoRender
  );
}

// src/cli/ui/components/loading.tsx
import { Box as Box5, Text as Text5 } from "ink";
import React7 from "react";
function Loading() {
  return /* @__PURE__ */ React7.createElement(Box5, { paddingX: 1, borderDimColor: true, flexDirection: "column" }, /* @__PURE__ */ React7.createElement(Box5, { alignSelf: "center" }, /* @__PURE__ */ React7.createElement(Text5, { dimColor: true, color: "redBright" }, "Fetching Data")), /* @__PURE__ */ React7.createElement(Box5, { alignSelf: "center" }, /* @__PURE__ */ React7.createElement(Text5, { color: "blueBright", dimColor: true }, /* @__PURE__ */ React7.createElement(Spinner, { type: "grenade" }))));
}

// src/cli/ui/components/titlebar.tsx
import { Box as Box6, Spacer as Spacer2, Text as Text6 } from "ink";
import React8 from "react";

// package.json
var version = "3.4.3";

// src/cli/ui/components/titlebar.tsx
function TitleBar() {
  return /* @__PURE__ */ React8.createElement(Box6, null, /* @__PURE__ */ React8.createElement(Spacer2, null), /* @__PURE__ */ React8.createElement(Box6, { borderColor: "magenta", borderStyle: "arrow" }, /* @__PURE__ */ React8.createElement(Text6, { color: "cyanBright" }, "Coomer-Downloader ", version)), /* @__PURE__ */ React8.createElement(Spacer2, null));
}

// src/cli/ui/hooks/input.ts
import { useInput } from "ink";
var useInputHook = () => {
  const downloader = useInkStore((state) => state.downloader);
  const switchPreview = useInkStore((state) => state.switchPreview);
  useInput((input) => {
    if (input === "s") {
      downloader?.skip();
    }
    if (input === "p") {
      switchPreview();
    }
  });
};

// src/cli/ui/app.tsx
function App() {
  useInputHook();
  const filelist = useDownloaderHook(["FILES_DOWNLOADING_START"]);
  return /* @__PURE__ */ React9.createElement(Box7, { borderStyle: "single", flexDirection: "column", borderColor: "blue", width: 80 }, /* @__PURE__ */ React9.createElement(TitleBar, null), !(filelist instanceof CoomerFileList) ? /* @__PURE__ */ React9.createElement(Loading, null) : /* @__PURE__ */ React9.createElement(React9.Fragment, null, /* @__PURE__ */ React9.createElement(Box7, null, /* @__PURE__ */ React9.createElement(Box7, null, /* @__PURE__ */ React9.createElement(FileListStateBox, null)), /* @__PURE__ */ React9.createElement(Box7, { flexBasis: 30 }, /* @__PURE__ */ React9.createElement(KeyboardControlsInfo, null))), /* @__PURE__ */ React9.createElement(FileListBox, null)));
}

// src/cli/ui/index.tsx
function createReactInk() {
  return render(/* @__PURE__ */ React10.createElement(App, null));
}

// src/main.ts
async function main() {
  createReactInk();
  const { url, dir, media, include, exclude, minSize, maxSize, skip, removeDupilicates } = parseArgs();
  const filelist = await resolveAPI(url);
  filelist.setDirPath(dir).skip(skip).filterByText(include, exclude).filterByMediaType(media);
  if (removeDupilicates) {
    filelist.removeURLDuplicates();
  }
  const minSizeBytes = minSize ? parseSizeValue(minSize) : void 0;
  const maxSizeBytes = maxSize ? parseSizeValue(maxSize) : void 0;
  await filelist.calculateFileSizes();
  setGlobalHeaders({ Referer: url });
  const downloader = new Downloader(filelist, minSizeBytes, maxSizeBytes);
  useInkStore.getState().setDownloader(downloader);
  await downloader.downloadFiles();
  if (removeDupilicates) {
    await filelist.removeDuplicatesByHash();
  }
}

// src/index.ts
main().then(() => process2.exit(0)).catch((err) => {
  console.error(err);
  process2.exit(1);
});
