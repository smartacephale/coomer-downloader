import fs from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Subject } from 'rxjs';
import { tryFixCoomerUrl } from '../api/coomer-api';
import type { DownloaderSubject, File } from '../types';
import { getFileSize, mkdir } from './files';
import { PromiseRetry } from './promise';
import { fetchByteRange } from './requests';
import { Timer } from './timer';

export const subject = new Subject<DownloaderSubject>();

const CHUNK_TIMEOUT = 30_000;
const CHUNK_FETCH_RETRIES = 5;
const FETCH_RETRIES = 7;

async function fetchStream(file: File, stream: Readable): Promise<void> {
  const { timer, signal } = Timer.withSignal(CHUNK_TIMEOUT, 'CHUNK_TIMEOUT');

  const fileStream = fs.createWriteStream(file.filepath as string, { flags: 'a' });

  const progressStream = new Transform({
    transform(chunk, _encoding, callback) {
      this.push(chunk);
      file.downloaded += chunk.length;
      timer.reset();
      subject.next({ type: 'CHUNK_DOWNLOADING_UPDATE', file });
      callback();
    },
  });

  try {
    subject.next({ type: 'CHUNK_DOWNLOADING_START', file });
    await pipeline(stream, progressStream, fileStream, { signal });
  } catch (error) {
    console.error((error as Error).name === 'AbortError' ? signal.reason : error);
  } finally {
    subject.next({ type: 'CHUNK_DOWNLOADING_END', file });
  }
}

async function downloadFile(file: File): Promise<void> {
  file.downloaded = await getFileSize(file.filepath as string);

  const response = await fetchByteRange(file.url, file.downloaded);

  if (!response?.ok && response?.status !== 416) {
    throw new Error(`HTTP error! status: ${response?.status}`);
  }

  const contentLength = response.headers.get('Content-Length') as string;

  if (!contentLength && file.downloaded > 0) {
    return;
  }

  const restFileSize = parseInt(contentLength);
  file.size = restFileSize + file.downloaded;

  if (file.size > file.downloaded && response.body) {
    const stream = Readable.fromWeb(response.body);
    const sizeOld = file.downloaded;

    await PromiseRetry.create({
      retries: CHUNK_FETCH_RETRIES,
      callback: () => {
        if (sizeOld !== file.downloaded) {
          return { newRetries: 5 };
        }
      },
    }).execute(async () => await fetchStream(file, stream));
  }

  subject.next({ type: 'FILE_DOWNLOADING_END' });
}

export async function downloadFiles(data: File[], downloadDir: string): Promise<void> {
  mkdir(downloadDir);

  subject.next({ type: 'FILES_DOWNLOADING_START', filesCount: data.length });

  for (const [_, file] of data.entries()) {
    file.filepath = path.join(downloadDir, file.name);

    subject.next({ type: 'FILE_DOWNLOADING_START' });

    await PromiseRetry.create({
      retries: FETCH_RETRIES,
      callback: (retries) => {
        if (/coomer|kemono/.test(file.url)) {
          file.url = tryFixCoomerUrl(file.url, retries);
        }
      },
    }).execute(async () => await downloadFile(file));

    subject.next({ type: 'FILE_DOWNLOADING_END' });
  }

  subject.next({ type: 'FILES_DOWNLOADING_END' });
}
