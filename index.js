#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { downloadFiles } from './src/downloader.js';
import { apiHandler } from './src/api/index.js';
import { argumentHander } from './src/args-handler.js';

async function run() {
  const { url, dir, media } = argumentHander();

  const { dirName, files } = await apiHandler(url, media);

  console.log(' ', files.length, 'files found');

  const downloadDir =
    dir === './'
      ? path.resolve(dir, userDir)
      : path.join(os.homedir(), path.join(dir, dirName));

  await downloadFiles(files, downloadDir);

  console.log('\n');
}

run();
