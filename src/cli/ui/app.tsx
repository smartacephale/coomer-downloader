import { Box } from 'ink';
import React from 'react';
import { CoomerFileList } from '../../services/filelist';
import {
  FileBox,
  FileListStateBox,
  KeyboardControlsInfo,
  Loading,
  TitleBar,
} from './components';
import { useDownloaderHook } from './hooks/downloader';
import { useInputHook } from './hooks/input';

export function App() {
  useInputHook();
  const filelist = useDownloaderHook();

  return (
    <Box borderStyle="single" flexDirection="column" borderColor="blue" width={80}>
      <TitleBar />
      {!(filelist instanceof CoomerFileList) ? (
        <Loading />
      ) : (
        <>
          <Box>
            <Box>
              <FileListStateBox filelist={filelist} />
            </Box>
            <Box flexBasis={30}>
              <KeyboardControlsInfo />
            </Box>
          </Box>

          {filelist?.getActiveFiles().map((file) => {
            return <FileBox file={file} key={file.name} />;
          })}
        </>
      )}
    </Box>
  );
}
