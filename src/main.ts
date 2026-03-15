import bytes from 'bytes';
import { resolveAPI } from './api/index.ts';
import { parseArgs } from './cli/parse-args.ts';
import { createReactInk } from './cli/ui/index.tsx';
import { useInkStore } from './cli/ui/store/index.ts';
import { type CoomerFileList, Downloader } from './core/index.ts';
import { setGlobalHeaders } from './utils/requests.ts';

export async function main() {
  createReactInk();

  const { url, dir, media, include, exclude, minSize, maxSize, skip, removeDupilicates } =
    parseArgs();

  const filelist: CoomerFileList = await resolveAPI(url);

  await filelist
    .setDirPath(dir)
    .skip(skip)
    .filterByText(include, exclude)
    .filterByMediaType(media)
    .removeDuplicatesByUrl(removeDupilicates)
    .readState();

  if (filelist.files.length === 0) {
    throw Error('Found No Files');
  }

  const minSizeBytes = minSize ? (bytes(minSize) as number) : undefined;
  const maxSizeBytes = maxSize ? (bytes(maxSize) as number) : undefined;

  setGlobalHeaders({ Referer: url });

  const downloader = new Downloader(filelist, minSizeBytes, maxSizeBytes);
  useInkStore.getState().setDownloader(downloader);

  await downloader.downloadFiles();

  await filelist.removeDuplicatesByHash(removeDupilicates);
}
