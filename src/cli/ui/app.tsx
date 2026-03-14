import { Box } from 'ink';
import React from 'react';
import { CoomerFileList } from '../../core/filelist.ts';
import {
  FileListBox,
  FileListStateBox,
  KeyboardControlsInfo,
  Loading,
  TitleBar,
} from './components/index.ts';
import { useDownloaderHook } from './hooks/downloader.ts';
import { useInputHook } from './hooks/input.ts';

export function App() {
  useInputHook();
  const filelist = useDownloaderHook(['DOWNLOAD_STARTED']);

  return (
    <Box
      borderStyle="single"
      flexDirection="column"
      borderColor="blue"
      backgroundColor={'black'}
      width={80}
    >
      <TitleBar />
      {!(filelist instanceof CoomerFileList) ? (
        <Loading />
      ) : (
        <>
          <Box>
            <Box>
              <FileListStateBox />
            </Box>
            <Box flexBasis={30}>
              <KeyboardControlsInfo />
            </Box>
          </Box>
          <FileListBox />
        </>
      )}
    </Box>
  );
}
