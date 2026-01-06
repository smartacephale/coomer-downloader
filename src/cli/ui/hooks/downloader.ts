import { useRef, useSyncExternalStore } from 'react';
import type { DownloaderSubject, DownloaderSubjectSignal } from '../../../types';
import { useInkStore } from '../store';

export const useDownloaderHook = (subjectEvents: DownloaderSubjectSignal[]) => {
  const downloader = useInkStore((state) => state.downloader);

  const versionRef = useRef(0);

  useSyncExternalStore(
    (onStoreChange) => {
      if (!downloader) return () => {};

      const sub = downloader.subject.subscribe(({ type }: DownloaderSubject) => {
        if (subjectEvents.includes(type)) {
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
