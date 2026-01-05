import { useRef, useSyncExternalStore } from 'react';
import { useInkStore } from '../store';

export const useDownloaderHook = () => {
  const downloader = useInkStore((state) => state.downloader);

  const versionRef = useRef(0);

  useSyncExternalStore(
    (onStoreChange) => {
      if (!downloader) return () => {};

      const sub = downloader.subject.subscribe(({ type }) => {
        const targets = [
          'FILE_DOWNLOADING_START',
          'FILE_DOWNLOADING_END',
          'CHUNK_DOWNLOADING_UPDATE',
        ];

        if (targets.includes(type)) {
          versionRef.current++;
          onStoreChange();
        }
      });
      return () => sub.unsubscribe();
    },
    () => versionRef.current,
  );

  return downloader?.filelist;
};
