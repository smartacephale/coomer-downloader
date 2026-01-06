import React from 'react';
import type { CoomerFile } from '../../../core';
import { useDownloaderHook } from '../hooks/downloader';
import { FileBox } from './file';

export function FileListBox() {
  const filelist = useDownloaderHook(['FILE_DOWNLOADING_START', 'FILE_DOWNLOADING_END']);

  return (
    <>
      {filelist?.getActiveFiles().map((file: CoomerFile) => {
        return <FileBox file={file} key={file.name} />;
      })}
    </>
  );
}
