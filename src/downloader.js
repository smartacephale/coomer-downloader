import fs from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { b2mb, fetchByteRange, DEFAULT_HEADERS, getFileSize } from './utils/index.js';
import { MultiBar } from 'cli-progress';
import { tryFixCoomerUrl } from './api/coomer-api.js';

const multibar = new MultiBar({
  clearOnComplete: true,
  gracefulExit: true,
  autopadding: true,
  hideCursor: true,
  format: '{percentage}% | {filename} | {value}/{total}{size}',
});

async function downloadFile(url, outputFile, attempts = 7) {
  let response;

  try {
    let existingFileSize = await getFileSize(outputFile);

    response = await fetchByteRange(url, existingFileSize);

    if (!response.ok && response.status !== 416) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = parseInt(response.headers.get('Content-Length'));

    if (!response.headers.get('Content-Range') && existingFileSize > 0) {
      return;
    }

    const fileStream = fs.createWriteStream(outputFile, { flags: 'a' });

    const restFileSize = contentLength;
    const totalFileSize = restFileSize + existingFileSize;

    if (totalFileSize > existingFileSize) {
      const bar = multibar.create(b2mb(totalFileSize), b2mb(existingFileSize));
      const filename = outputFile.slice(-40);

      const progressStream = new Transform({
        transform(chunk, _encoding, callback) {
          this.push(chunk);
          existingFileSize += chunk.length;
          bar.update(b2mb(existingFileSize), { filename, size: 'mb' });
          callback();
        },
      });

      await pipeline(response.body, progressStream, fileStream);
      multibar.remove(bar);
    }
  } catch (error) {
    if (attempts < 1) {
      console.error(url);
      console.error(error);
    } else {
      let newUrl = url;
      if (/coomer|kemono/.test(response.url)) {
        newUrl = tryFixCoomerUrl(response.url, attempts);
      }
      await downloadFile(newUrl, outputFile, attempts - 1);
    }
  }
}

export async function downloadFiles(data, downloadDir, headers) {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  Object.keys(headers).forEach((k) => DEFAULT_HEADERS.set(k, headers[k]));

  const bar = multibar.create(data.length, 0);

  for (const [index, { name, src }] of data.entries()) {
    const filePath = path.join(downloadDir, name);
    try {
      bar.update(index + 1, { filename: 'Downloaded files', size: '' });
      await downloadFile(src.replace(/[\/]+/g, '/'), filePath);
    } catch (error) {
      console.error(`\nError downloading ${name}:`, error.message);
      console.error(src);
    }
  }

  bar.stop();
}
