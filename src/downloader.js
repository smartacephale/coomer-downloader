import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import fetch from 'node-fetch';
import stream from 'node:stream';
import { isImage, b2mb } from './utils.js';
import { MultiBar } from 'cli-progress';

const pipeline = util.promisify(stream.pipeline);

const multibar = new MultiBar(
  {
    clearOnComplete: true,
    autopadding: true,
    hideCursor: true,
    format: '{percentage}% | {filename} | {value}/{total}{size}',
  }
);

async function downloadFile(url, outputFile, attempts = 2) {
  try {
    let existingFileSize = 0;
    if (fs.existsSync(outputFile)) {
      if (isImage(outputFile)) return;
      existingFileSize = (await fs.promises.stat(outputFile)).size || 0;
    }

    const headers = { Range: `bytes=${existingFileSize}-` };
    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 416) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.headers.get('Content-Range')) {
      throw new Error('Server does not support byte ranges.');
    }

    const fileStream = fs.createWriteStream(outputFile, { flags: 'a' });
    const totalBytes =
      parseInt(response.headers.get('Content-Length')) + existingFileSize;

    if (totalBytes > existingFileSize) {
      const bar = multibar.create(b2mb(totalBytes), b2mb(existingFileSize));
      const filename = outputFile.slice(-40);

      const progressStream = new stream.Transform({
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
      console.error(`${error}`);
    } else {
      await downloadFile(url, outputFile, attempts - 1);
    }
  }
}

export async function downloadFiles(data, downloadDir) {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const bar = multibar.create(data.length, 0);

  for (const [index, { name, src }] of data.entries()) {
    const filePath = path.join(downloadDir, name);
    try {
      bar.update(index + 1, { filename: 'Downloaded files', size: '' });
      await downloadFile(src, filePath);
    } catch (error) {
      console.error(`\nError downloading ${name}:`, error.message);
    }
  }
  bar.stop();
}
