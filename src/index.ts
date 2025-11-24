#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

import process from 'node:process';
import { apiHandler } from './api';
import { argumentHander } from './cli/args-handler';
import { createReactInk } from './cli/ui';
import { useInkStore } from './cli/ui/store';
import { Downloader } from './services/downloader';
import { setGlobalHeaders } from './utils/requests';

async function run() {
  createReactInk();

  const { url, dir, media, include, exclude, skip } = argumentHander();

  const filelist = await apiHandler(url);

  filelist.setDirPath(dir).skip(skip).filterByText(include, exclude).filterByMediaType(media);

  await filelist.calculateFileSizes();

  setGlobalHeaders({ Referer: url });

  const downloader = new Downloader(filelist);
  useInkStore.getState().setDownloader(downloader);

  await downloader.downloadFiles();

  process.kill(process.pid, 'SIGINT');
}

run();
