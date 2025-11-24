import { Box } from 'ink';
import React from 'react';
import { CoomerFileList } from '../../services/file';
import { FileBox, FileListStateBox, KeyboardControlsInfo, Loading, TitleBar } from './components';
import { useDownloaderHook } from './hooks/downloader';
import { useInputHook } from './hooks/input';
import { useInkStore } from './store';

export function App() {
  useInputHook();
  useDownloaderHook();

  const downloader = useInkStore((state) => state.downloader);
  const filelist = downloader?.filelist;
  const isFilelist = filelist instanceof CoomerFileList;

  return (
    <Box borderStyle="single" flexDirection="column" borderColor="blue" width={80}>
      <TitleBar />
      {!isFilelist ? (
        <Loading />
      ) : (
        <>
          <Box>
            <Box>
              <FileListStateBox filelist={filelist} />
            </Box>
            <Box flexBasis={29}>
              <KeyboardControlsInfo />
            </Box>
          </Box>

          {filelist.getActiveFiles().map((file) => {
            return <FileBox file={file} key={file.name} />;
          })}
        </>
      )}
    </Box>
  );
}
