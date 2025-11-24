import { useEffect, useState } from 'react';
import { useInkStore } from '../store';

export const useDownloaderHook = () => {
  const downloader = useInkStore((state) => state.downloader);
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
};
