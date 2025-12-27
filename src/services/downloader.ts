import fs from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Subject } from 'rxjs';
import { tryFixCoomerUrl } from '../api/coomer-api';
import type { DownloaderSubject } from '../types';
import { getFileSize, mkdir } from '../utils/io';
import { sleep } from '../utils/promise';
import { fetchByteRange } from '../utils/requests';
import { Timer } from '../utils/timer';
import type { CoomerFile, CoomerFileList } from './file';

export class Downloader {
  public subject = new Subject<DownloaderSubject>();

  private abortController = new AbortController();
  public abortControllerSubject = new Subject<string>();

  setAbortControllerListener() {
    this.abortControllerSubject.subscribe((type) => {
      this.abortController.abort(type);
      this.abortController = new AbortController();
    });
  }

  constructor(
    public filelist: CoomerFileList,
    public chunkTimeout = 30_000,
    public chunkFetchRetries = 5,
    public fetchRetries = 7,
    public minSize?: number,
  ) {
    this.setAbortControllerListener();
  }

  async fetchStream(
    file: CoomerFile,
    stream: Readable,
    sizeOld = 0,
    retries = this.chunkFetchRetries,
  ): Promise<void> {
    const signal = this.abortController.signal;
    const subject = this.subject;
    const { timer } = Timer.withAbortController(this.chunkTimeout, this.abortControllerSubject);
    let i: NodeJS.Timeout | undefined;

    try {
      const fileStream = fs.createWriteStream(file.filepath as string, { flags: 'a' });

      const progressStream = new Transform({
        transform(chunk, _encoding, callback) {
          this.push(chunk);
          file.downloaded += chunk.length;
          timer.reset();
          subject.next({ type: 'CHUNK_DOWNLOADING_UPDATE' });
          callback();
        },
      });

      subject.next({ type: 'CHUNK_DOWNLOADING_START' });
      await pipeline(stream, progressStream, fileStream, { signal });
    } catch (error) {
      if (signal.aborted) {
        if (signal.reason === 'FILE_SKIP') return;
        if (signal.reason === 'TIMEOUT') {
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
      subject.next({ type: 'CHUNK_DOWNLOADING_END' });
      timer.stop();
      clearInterval(i);
    }
  }

  public skip() {
    this.abortControllerSubject.next('FILE_SKIP');
  }

  async downloadFile(file: CoomerFile, retries = this.fetchRetries): Promise<void> {
    const signal = this.abortController.signal;
    try {
      file.downloaded = await getFileSize(file.filepath as string);

      const response = await fetchByteRange(file.url, file.downloaded, signal);

      if (!response?.ok && response?.status !== 416) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const contentLength = response.headers.get('Content-Length') as string;

      if (!contentLength && file.downloaded > 0) return;

      const restFileSize = parseInt(contentLength);
      file.size = restFileSize + file.downloaded;

      // If a minimum size is configured and the discovered file size is smaller, remove any
      // partial file (even if empty) and skip downloading.
      if (this.minSize && file.size < this.minSize) {
        try {
          if (file.filepath) {
            await fs.promises.unlink(file.filepath as string).catch(() => null);
          }
        } catch {
          // ignore errors when attempting to delete
        }
        this.subject.next({ type: 'FILE_SKIP' });
        return;
      }

      if (file.size > file.downloaded && response.body) {
        const stream = Readable.fromWeb(response.body);
        stream.setMaxListeners(20);
        await this.fetchStream(file, stream, file.downloaded);
      }
    } catch (error) {
      if (signal.aborted) {
        if (signal.reason === 'FILE_SKIP') return;
      }
      if (retries > 0) {
        if (/coomer|kemono/.test(file.url)) {
          file.url = tryFixCoomerUrl(file.url, retries);
        }
        await sleep(1000);
        return await this.downloadFile(file, retries - 1);
      }
      throw error;
    }
  }

  async downloadFiles(): Promise<void> {
    mkdir(this.filelist.dirPath as string);

    this.subject.next({ type: 'FILES_DOWNLOADING_START' });
    for (const file of this.filelist.files) {
      file.active = true;

      this.subject.next({ type: 'FILE_DOWNLOADING_START' });

      await this.downloadFile(file);

      file.active = false;

      this.subject.next({ type: 'FILE_DOWNLOADING_END' });
    }

    this.subject.next({ type: 'FILES_DOWNLOADING_END' });
  }
}
