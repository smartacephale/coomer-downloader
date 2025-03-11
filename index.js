#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { downloadFiles } from './src/downloader.js';
import { apiHandler } from './src/api/index.js';
import { argumentHander } from './src/args-handler.js';
import { filterKeywords } from './src/utils.js';

async function run() {
  const { url, dir, media, include, exclude } = argumentHander();

  const { dirName, files, headerData = {} } = await apiHandler(url, media);

  console.log(' ', files.length, 'files found');

  const downloadDir =
    dir === './'
      ? path.resolve(dir, dirName)
      : path.join(os.homedir(), path.join(dir, dirName));

  const filteredFiles = filterKeywords(files, include, exclude);

  await downloadFiles(filteredFiles, downloadDir, {
    Referer: url,
    ...headerData,
  });

  process.kill(process.pid, 'SIGINT');
}

run();
