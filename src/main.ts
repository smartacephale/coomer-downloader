import { resolveAPI } from './api';
import { parseArgs } from './cli/parse-args';
import { createReactInk } from './cli/ui';
import { useInkStore } from './cli/ui/store';
import { Downloader } from './core';
import { parseSizeValue } from './utils/filters';
import { setGlobalHeaders } from './utils/requests';

export async function main() {
  createReactInk();

  const { url, dir, media, include, exclude, minSize, maxSize, skip, removeDupilicates } =
    parseArgs();

  const filelist = await resolveAPI(url);

  filelist
    .setDirPath(dir)
    .skip(skip)
    .filterByText(include, exclude)
    .filterByMediaType(media);

  if (removeDupilicates) {
    filelist.removeURLDuplicates();
  }

  if (filelist.files.length === 0) {
    throw Error('Found No Files');
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
