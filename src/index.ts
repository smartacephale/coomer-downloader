#!/usr/bin/env node

import process from 'node:process';
import { apiHandler } from './api';
import { argumentHander } from './cli/args-handler';
import { createReactInk } from './cli/ui';
import { Downloader } from './services/downloader';
import { setGlobalHeaders } from './utils/requests';

async function run() {
  const { url, dir, media, include, exclude, skip } = argumentHander();

  const filelist = await apiHandler(url);

  filelist.setDirPath(dir);
  filelist.skip(skip);
  filelist.filterByText(include, exclude);
  filelist.filterByMediaType(media);

  await filelist.calculateFileSizes();

  setGlobalHeaders({ Referer: url });

  const downloader = new Downloader(filelist);
  createReactInk(downloader);
  await downloader.downloadFiles();

  process.kill(process.pid, 'SIGINT');
}

run();
