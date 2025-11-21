#!/usr/bin/env node
import process from 'node:process';
import { apiHandler } from './api';
import { argumentHander } from './cli/args-handler';
import { createMultibar } from './cli/multibar';
import { Downloader } from './utils/downloader';
import { setGlobalHeaders } from './utils/requests';

async function run() {
  const { url, dir, media, include, exclude, skip } = argumentHander();

  const filelist = await apiHandler(url);

  const found = filelist.files.length;
  filelist.setDirPath(dir);
  filelist.skip(skip);
  filelist.filterByText(include, exclude);
  filelist.filterByMediaType(media);
  // await filelist.calculateFileSizes();

  console.table([
    {
      found,
      skip,
      filtered: found - filelist.files.length,
      folder: filelist.dirPath,
    },
  ]);

  setGlobalHeaders({ Referer: url });

  const downloader = new Downloader();
  createMultibar(downloader);
  await downloader.downloadFiles(filelist);

  process.kill(process.pid, 'SIGINT');
}

run();
