#!/usr/bin/env tsx
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { apiHandler } from './api';
import { argumentHander } from './args-handler';
import type { ApiResult, MediaType } from './types';
import { createMultibar, downloadFiles, filterKeywords, setGlobalHeaders } from './utils';

async function run() {
  const { url, dir, media, include, exclude, skip } = argumentHander();

  const { dirName, files } = (await apiHandler(url, media as MediaType)) as ApiResult;

  const downloadDir =
    dir === './' ? path.resolve(dir, dirName) : path.join(os.homedir(), path.join(dir, dirName));

  const filteredFiles = filterKeywords(files, include, exclude).slice(skip);

  console.table([
    {
      found: files.length,
      skip,
      filtered: files.length - filteredFiles.length - skip,
      folder: downloadDir,
    },
  ]);

  setGlobalHeaders({ Referer: url });

  createMultibar();
  await downloadFiles(filteredFiles, downloadDir);

  process.kill(process.pid, 'SIGINT');
}

run();
