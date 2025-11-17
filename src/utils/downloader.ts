import fs from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Subject } from 'rxjs';
import { tryFixCoomerUrl } from '../api/coomer-api';
import type { DownloaderSubject, File } from '../types';
import { getFileSize, mkdir } from './files';
import { promiseRetry } from './promise';
import { fetchByteRange, setRetryDispatcher } from './requests';
import { Timer } from './timer';

export const subject = new Subject<DownloaderSubject>();

const CHUNK_TIMEOUT = 30;
const CHUNK_FETCH_RETRIES = 5;
const FETCH_RETRIES = 7;

async function fetchStream(file: File, stream: Readable): Promise<void> {
  subject.next({ type: 'CHUNK_DOWNLOADING_STARTED', file });

  const { timer, signal } = Timer.withSignal(CHUNK_TIMEOUT);

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

  await pipeline(stream, progressStream, fileStream, { signal }).catch((reason) => {
    fileStream.close();
    throw reason;
  });
  timer.stop();
  subject.next({ type: 'FILE_DOWNLOADING_FINISHED' });
}

function handleFetchError(error: Error, file: File, attempts: number): void {
  const url = file?.url as string;
  if (/coomer|kemono/.test(url)) {
    file.url = tryFixCoomerUrl(url, attempts);
  }
  throw error;
}

async function downloadFile(file: File): Promise<void> {
  file.downloaded = await getFileSize(file.filepath as string);

  // setRetryDispatcher({
  //   maxRetries: 100,
  //   minTimeout: 2_000,
  //   maxTimeout: 10_000,
  //   retry: (...args) => {
  //     console.log('opapa');
  //     console.log('\n\n', { ...args });
  //   },
  // });
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

    promiseRetry(
      async () => {
        await fetchStream(file, stream);
      },
      () => sizeOld === file.downloaded,
      CHUNK_FETCH_RETRIES,
    );
  }
}

export async function downloadFiles(data: File[], downloadDir: string): Promise<void> {
  mkdir(downloadDir);

  subject.next({ type: 'FILES_DOWNLOADING_STARTED', filesCount: data.length });

  for (const [index, file] of data.entries()) {
    file.filepath = path.join(downloadDir, file.name);
    subject.next({ type: 'FILE_DOWNLOADING_STARTED', index });
    await downloadFile(file);
  }

  subject.next({ type: 'FILES_DOWNLOADING_STARTED' });
}
