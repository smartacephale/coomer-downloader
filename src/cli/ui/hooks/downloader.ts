import { useEffect, useState } from 'react';
import type { Downloader } from '../../../services/downloader';

export const useDownloaderHook = (downloader: Downloader) => {
  const filelist = downloader?.filelist;
  const [_, setHelper] = useState(0);

  useEffect(() => {
    downloader?.subject.subscribe(({ type }) => {
      if (
        type === 'FILE_DOWNLOADING_START' ||
        type === 'FILE_DOWNLOADING_END' ||
        type === 'CHUNK_DOWNLOADING_UPDATE'
      ) {
        setHelper(Date.now());
      }
    });
  });

  return { filelist };
};
