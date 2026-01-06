import { Box } from 'ink';
import React from 'react';
import { CoomerFileList } from '../../core';
import {
  FileListBox,
  FileListStateBox,
  KeyboardControlsInfo,
  Loading,
  TitleBar,
} from './components';
import { useDownloaderHook } from './hooks/downloader';
import { useInputHook } from './hooks/input';

export function App() {
  useInputHook();
  const filelist = useDownloaderHook(['FILES_DOWNLOADING_START']);

  return (
    <Box borderStyle="single" flexDirection="column" borderColor="blue" width={80}>
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
