#!/usr/bin/env node
import process from 'node:process';
import { apiHandler } from './api';
import { argumentHander } from './args-handler';
import { createMultibar, Downloader, setGlobalHeaders } from './utils';

async function run() {
  const { url, dir, media, include, exclude, skip } = argumentHander();

  const filelist = await apiHandler(url);

  const found = filelist.files.length;
  filelist.setDirPath(dir);
  filelist.skip(skip);
  filelist.filterByText(include, exclude);
  filelist.filterByMediaType(media);

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
