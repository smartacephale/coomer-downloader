import React from 'react';
import type { CoomerFile } from '../../../core/index.ts';
import { useDownloaderHook } from '../hooks/downloader.ts';
import { FileBox } from './file.tsx';

export function FileListBox() {
  const filelist = useDownloaderHook(['FILE_STARTED', 'FILE_FINISHED']);

  return (
    <>
      {filelist?.active.map((file: CoomerFile) => {
        return <FileBox file={file} key={file.name} />;
      })}
    </>
  );
}
