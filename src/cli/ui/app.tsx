import { Box } from 'ink';
import React from 'react';
import type { Downloader } from '../../services/downloader';
import { FileBox, FileListStateBox, KeyboardControlsInfo, TitleBar } from './components';
import { useDownloaderHook } from './hooks/downloader';
import { useInputHook } from './hooks/input';

interface AppProps {
  downloader: Downloader;
}

export function App({ downloader }: AppProps) {
  const { filelist } = useDownloaderHook(downloader);
  useInputHook(downloader);

  return (
    <Box borderStyle="single" flexDirection="column" borderColor="blue" width={80}>
      <TitleBar />
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
    </Box>
  );
}
