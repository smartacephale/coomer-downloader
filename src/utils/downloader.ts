import fs from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Subject } from 'rxjs';
import { tryFixCoomerUrl } from '../api/coomer-api';
import type { DownloaderSubject, File } from '../types';
import { getFileSize, mkdir } from './files';
import { fetchByteRange } from './requests';
import { Timer } from './timer';

export const subject = new Subject<DownloaderSubject>();

const CHUNK_TIMEOUT = 30_000;
const DOWNLOAD_ATTEMPTS = 7;

async function downloadStream(file: File, stream: Readable): Promise<void> {
  subject.next({ type: 'CHUNK_DOWNLOADING_STARTED', file });

  const fileStream = fs.createWriteStream(file.filepath as string, { flags: 'a' });

  const controller = new AbortController();
  const timer = new Timer(CHUNK_TIMEOUT, () => {
    controller.abort('Stream is stuck.');
  }).start();

  const progressStream = new Transform({
    transform(chunk, _encoding, callback) {
      this.push(chunk);
      file.downloaded += chunk.length;
      timer.reset();
      subject.next({ type: 'CHUNK_DOWNLOADING_UPDATE', file });
      callback();
    },
  });

  await pipeline(stream, progressStream, fileStream, { signal: controller.signal });
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

async function downloadFile(file: File, attempts = DOWNLOAD_ATTEMPTS): Promise<void> {
  const downloadedOld = file.downloaded || 0;
  try {
    file.downloaded = await getFileSize(file.filepath as string);

    const response = await fetchByteRange(file.url, file.downloaded).catch((error) =>
      handleFetchError(error, file, --attempts),
    );

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
      await downloadStream(file, stream);
    }
  } catch (error) {
    if (downloadedOld < (file.downloaded || 0)) {
      attempts = DOWNLOAD_ATTEMPTS;
    }
    if (attempts < 1) {
      console.error(file.url);
      console.error(error);
    } else {
      await downloadFile(file, attempts - 1);
    }
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
