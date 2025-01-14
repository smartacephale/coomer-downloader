#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { downloadFiles } from './src/downloader.js';
import { getUserFiles, parseUser } from './src/coomer-api.js';
import { argumentHander } from './src/args-handler.js';

async function run() {
  const { url, dir, media } = argumentHander();
  const user = await parseUser(url);
  const userDir = `${user.name}-${user.service}`;
  const downloadDir =
    dir === './'
      ? path.resolve(dir, userDir)
      : path.join(os.homedir(), path.join(dir, userDir));
  const files = await getUserFiles(user, media);
  console.log(files.length, 'files found');
  await downloadFiles(files, downloadDir);
}

run();
