import fs from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { type AsyncIterableX, from, throwError } from 'ix/asynciterable';
import { catchError, finalize, tap, timeout } from 'ix/asynciterable/operators';
import { Subject } from 'rxjs';
import type { Response } from 'undici';
import type { AbortControllerEvent, DownloaderEvent } from '../types/index.ts';
import { printError } from '../utils/error.ts';
import { deleteFile, getFileSize, makeDir } from '../utils/io.ts';
import { wait } from '../utils/promise.ts';
import { fetchByteRange } from '../utils/requests.ts';
import type { CoomerFile } from './file.ts';
import type { CoomerFileList } from './filelist.ts';

export class Downloader {
  public subject$ = new Subject<DownloaderEvent>();

  private abortController = new AbortController();
  public AbortControllerEvent$ = new Subject<AbortControllerEvent>();

  setAbortControllerListener() {
    this.AbortControllerEvent$.subscribe((type) => {
      this.abortController.abort(type);
      this.abortController = new AbortController();
    });
  }

  public skip() {
    this.AbortControllerEvent$.next('FILE_SKIP');
  }

  constructor(
    public filelist: CoomerFileList,
    public minSize?: number,
    public maxSize?: number,
    public chunkTimeout = 30_000,
    public chunkFetchRetries = 5,
    public fetchRetries = 7,
  ) {
    this.setAbortControllerListener();
  }

  private async fetchStream(file: CoomerFile, stream: Readable): Promise<void> {
    const { signal } = this.abortController;
    const { chunkFetchRetries, chunkTimeout, subject$ } = this;

    let sizeOld = file.downloaded;
    let retriesLeft = chunkFetchRetries;

    const download$: AsyncIterableX<Buffer> = from(stream).pipe(
      timeout(chunkTimeout),
      tap((chunk: Buffer) => {
        file.downloaded += chunk.length;
        subject$.next({ type: 'CHUNK_UPDATED' });
      }),
      catchError((err: Error): AsyncIterableX<Buffer> => {
        if (signal.aborted && signal.reason === 'FILE_SKIP') return from([]);

        if (file.downloaded > sizeOld) {
          sizeOld = file.downloaded;
          retriesLeft = chunkFetchRetries;
        }

        if (retriesLeft > 0) {
          retriesLeft--;
          return download$;
        }

        return throwError(() => err);
      }),
      finalize(() => subject$.next({ type: 'CHUNK_FINISHED' })),
    );

    try {
      const fileStream = fs.createWriteStream(file.filepath as string, { flags: 'a' });
      subject$.next({ type: 'CHUNK_STARTED' });
      await pipeline(download$, fileStream, { signal });
    } catch (err) {
      if (signal.aborted && signal.reason === 'FILE_SKIP') return;
      throw err;
    }
  }

  private async filterFileSize(file: CoomerFile) {
    if (!file.size) return;
    if (
      (this.minSize && file.size < this.minSize) ||
      (this.maxSize && file.size > this.maxSize)
    ) {
      await deleteFile(file.filepath);
      this.skip();
      return;
    }
  }

  private parseFileSize(response: Response, downloadedSize: number) {
    let size = 0;
    const contentRange = response.headers.get('Content-Range');
    const contentLength = response.headers.get('Content-Length');

    if (contentRange) {
      const totalSize = parseInt(contentRange.split('/').pop() as string);
      size = totalSize;
    } else if (contentLength) {
      const restFileSize = parseInt(contentLength);
      size = restFileSize + downloadedSize;
    }

    return size;
  }

  public async downloadFile(
    file: CoomerFile,
    retries = this.fetchRetries,
  ): Promise<void> {
    const signal = this.abortController.signal;
    try {
      file.downloaded = await getFileSize(file.filepath as string);

      const response = await fetchByteRange(file.url, file.downloaded, signal);

      if (!response?.ok && response?.status !== 416) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      file.size = this.parseFileSize(response, file.downloaded);

      if (!file.size && file.downloaded > 0) return;

      await this.filterFileSize(file);

      if (file.size > file.downloaded && response.body) {
        const stream = Readable.fromWeb(response.body);
        stream.setMaxListeners(20);
        await this.fetchStream(file, stream);
      }

      file.finished = file.downloaded >= file.size;
    } catch (error) {
      if (signal.aborted) {
        if (signal.reason === 'FILE_SKIP') return;
      }
      if (retries > 0) {
        if (this.filelist.provider?.fixURL) {
          file.url = this.filelist.provider.fixURL(file.url, retries);
        }
        await wait(1000);
        return await this.downloadFile(file, retries - 1);
      }
      throw error;
    }
  }

  public async downloadFiles(): Promise<void> {
    makeDir(this.filelist.dirPath as string);

    this.subject$.next({ type: 'DOWNLOAD_STARTED' });

    for (const file of this.filelist.files) {
      if (file.finished) {
        continue;
      }

      file.active = true;

      this.subject$.next({ type: 'FILE_STARTED' });

      try {
        await this.downloadFile(file);
      } catch (e) {
        printError(e, { quiet: [403], context: file.url });
      }

      file.active = false;

      await this.filelist.saveState();

      this.subject$.next({ type: 'FILE_FINISHED' });
    }

    this.subject$.next({ type: 'DOWNLOAD_FINISHED' });
  }
}
