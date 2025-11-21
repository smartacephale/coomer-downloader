import fs from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Subject } from 'rxjs';
import { tryFixCoomerUrl } from '../api/coomer-api';
import type { CoomerFile, CoomerFileList } from './file';
import { getFileSize, mkdir } from './io';
import { PromiseRetry } from './promise';
import { fetchByteRange } from './requests';
import { Timer } from './timer';

type DownloaderSubject = {
  type: string;
  file?: CoomerFile;
  filesCount?: number;
};

export class Downloader {
  public subject = new Subject<DownloaderSubject>();

  constructor(
    public chunkTimeout = 30_000,
    public chunkFetchRetries = 5,
    public fetchRetries = 7,
  ) {}

  async fetchStream(file: CoomerFile, stream: Readable): Promise<void> {
    const { subject, chunkTimeout } = this;
    const { timer, signal } = Timer.withSignal(chunkTimeout, 'chunkTimeout');

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

  async downloadFile(file: CoomerFile): Promise<void> {
    file.downloaded = await getFileSize(file.filepath as string);

    const response = await fetchByteRange(file.url, file.downloaded);

    if (!response?.ok && response?.status !== 416) {
      throw new Error(`HTTP error! status: ${response?.status}`);
    }

    const contentLength = response.headers.get('Content-Length') as string;

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
        },
      }).execute(async () => await this.fetchStream(file, stream));
    }

    this.subject.next({ type: 'FILE_DOWNLOADING_END' });
  }

  async downloadFiles(filelist: CoomerFileList): Promise<void> {
    mkdir(filelist.dirPath as string);

    this.subject.next({ type: 'FILES_DOWNLOADING_START', filesCount: filelist.files.length });

    for (const file of filelist.files) {
      this.subject.next({ type: 'FILE_DOWNLOADING_START' });

      await PromiseRetry.create({
        retries: this.fetchRetries,
        callback: (retries) => {
          if (/coomer|kemono/.test(file.url)) {
            file.url = tryFixCoomerUrl(file.url, retries);
          }
        },
      }).execute(async () => await this.downloadFile(file));

      this.subject.next({ type: 'FILE_DOWNLOADING_END' });
    }

    this.subject.next({ type: 'FILES_DOWNLOADING_END' });
  }
}
