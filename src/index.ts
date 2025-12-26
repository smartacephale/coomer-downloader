#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

import process from 'node:process';
import { apiHandler } from './api';
import { argumentHander } from './cli/args-handler';
import { createReactInk } from './cli/ui';
import { useInkStore } from './cli/ui/store';
import { Downloader } from './services/downloader';
import { setGlobalHeaders } from './utils/requests';
import { parseSizeValue } from './utils/filters';

async function run() {
  createReactInk();

  const { url, dir, media, include, exclude, minSize, skip } = argumentHander();

  const filelist = await apiHandler(url);

  filelist.setDirPath(dir).skip(skip).filterByText(include, exclude).filterByMediaType(media);

  const minSizeBytes = minSize ? parseSizeValue(minSize) : undefined;

  await filelist.calculateFileSizes();

  setGlobalHeaders({ Referer: url });

  const downloader = new Downloader(filelist, undefined, undefined, undefined, minSizeBytes);
  useInkStore.getState().setDownloader(downloader);

  await downloader.downloadFiles();
}

(async () => {
  try {
    await run();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
})();
