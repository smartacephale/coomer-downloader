import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import fetch from 'node-fetch';
import stream from 'node:stream';
import { isImage } from './utils.js';

const pipeline = util.promisify(stream.pipeline);

async function resumeDownload(url, outputFile, attempts = 2) {
  try {
    const existingFileSize = (await fs.promises.stat(outputFile)).size || 0;

    const headers = { Range: `bytes=${existingFileSize}-` };
    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 416) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.headers.get('Content-Range')) {
      throw new Error('Server does not support byte ranges.');
    }

    const fileStream = fs.createWriteStream(outputFile, { flags: 'a' });
    const totalBytes = parseInt(response.headers.get('Content-Length'));

    if (existingFileSize < totalBytes) {
      const progress = (existingFileSize / (totalBytes / 100)) | 0;
      process.stdout.write(`\rResumed download: ${progress}% of ${outputFile}`);
    }

    await pipeline(response.body, fileStream);
  } catch (error) {
    if (attempts < 1) {
      console.error(`Error resuming download: ${error}`);
    } else {
      await resumeDownload(url, outputFile, attempts - 1);
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

      if (fs.existsSync(filePath)) {
        if (!isImage(name)) {
          await resumeDownload(src, filePath);
        }
        continue;
      }

      const response = await fetch(src);
      if (!response.ok) {
        console.error(`\nFailed to download ${src}: ${response.statusText}`);
        continue;
      }

      const fileStream = fs.createWriteStream(filePath);

      await pipeline(response.body, fileStream);
    } catch (error) {
      console.error(`\nError downloading ${name}:`, error.message);
    }
  }
  console.log('\n');
}
