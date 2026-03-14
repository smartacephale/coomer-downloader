import { useRef, useSyncExternalStore } from 'react';
import { auditTime, filter } from 'rxjs';
import type { DownloaderEvent } from '../../../types/index.ts';
import { useInkStore } from '../store/index.ts';

export const useDownloaderHook = (subjectEvents: DownloaderEvent['type'][]) => {
  const downloader = useInkStore((state) => state.downloader);

  const versionRef = useRef(0);

  useSyncExternalStore(
    (onStoreChange) => {
      if (!downloader) return () => {};

      const sub = downloader.subject$
        .pipe(
          filter((e) => subjectEvents.includes(e.type)),
          auditTime(500),
        )
        .subscribe(() => {
          versionRef.current++;
          onStoreChange();
        });

      return () => sub.unsubscribe();
    },
    () => versionRef.current,
  );

  return downloader?.filelist;
};
