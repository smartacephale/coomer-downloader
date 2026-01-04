#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

import process from 'node:process';
import { apiHandler } from './api';
import { argumentHander } from './cli/args-handler';
import { createReactInk } from './cli/ui';
import { useInkStore } from './cli/ui/store';
import { Downloader } from './services/downloader';
import { parseSizeValue } from './utils/filters';
import { setGlobalHeaders } from './utils/requests';

async function run() {
  createReactInk();

  const { url, dir, media, include, exclude, minSize, maxSize, skip, removeDupilicates } =
    argumentHander();

  const filelist = await apiHandler(url);

  filelist
    .setDirPath(dir)
    .skip(skip)
    .filterByText(include, exclude)
    .filterByMediaType(media);

  if (removeDupilicates) {
    filelist.removeURLDuplicates();
  }

  const minSizeBytes = minSize ? parseSizeValue(minSize) : undefined;
  const maxSizeBytes = maxSize ? parseSizeValue(maxSize) : undefined;

  await filelist.calculateFileSizes();

  setGlobalHeaders({ Referer: url });

  const downloader = new Downloader(filelist, minSizeBytes, maxSizeBytes);
  useInkStore.getState().setDownloader(downloader);

  await downloader.downloadFiles();

  if (removeDupilicates) {
    await filelist.removeDuplicatesByHash();
  }
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
