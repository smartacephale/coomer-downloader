import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import fetch from 'node-fetch';
import stream from 'node:stream';
import { isImage } from './utils.js';

const pipeline = util.promisify(stream.pipeline);

async function downloadFile(url, outputFile, attempts = 2) {
  try {
    let existingFileSize = 0;
    if (fs.existsSync(outputFile)) {
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
      const progress = (n) => (n / (totalBytes / 100)).toFixed(2);
      const fname = outputFile.slice(outputFile.length - 70, outputFile.length);

      const progressStream = new stream.Transform({
        transform(chunk, _encoding, callback) {
          this.push(chunk);
          existingFileSize += chunk.length;
          process.stdout.write(`\r${progress(existingFileSize)}% of ${fname}`);
          callback();
        },
      });

      await pipeline(response.body, progressStream, fileStream);
    }
  } catch (error) {
    if (attempts < 1) {
      console.error(`Error resuming download: ${error}`);
    } else {
      await downloadFile(url, outputFile, attempts - 1);
    }
  }
}

export async function downloadFiles(data, downloadDir) {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  for (const [index, { name, src }] of data.entries()) {
    const filePath = path.join(downloadDir, name);
    try {
      process.stdout.write(`\rDownloading files: ${index + 1}/${data.length}`);

      if (fs.existsSync(filePath) && isImage(name)) continue;

      await downloadFile(src, filePath);
    } catch (error) {
      console.error(`\nError downloading ${name}:`, error.message);
    }
  }
}
