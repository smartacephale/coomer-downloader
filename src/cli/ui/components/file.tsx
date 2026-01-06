import { Box, Spacer, Text } from 'ink';
import React from 'react';
import type { CoomerFile } from '../../../core';
import { b2mb } from '../../../utils/strings';
import { useDownloaderHook } from '../hooks/downloader';
import { Preview } from './preview';
import { Spinner } from './spinner';

interface FileBoxProps {
  file: CoomerFile;
}

export const FileBox = React.memo(({ file }: FileBoxProps) => {
  useDownloaderHook(['CHUNK_DOWNLOADING_UPDATE']);

  const percentage = Number((file.downloaded / (file.size as number)) * 100).toFixed(2);

  return (
    <>
      <Box
        borderStyle="single"
        borderColor="magentaBright"
        borderDimColor
        paddingX={1}
        flexDirection="column"
      >
        <Box>
          <Text color="blue" dimColor wrap="truncate-middle">
            {file.name}
          </Text>
        </Box>
        <Box flexDirection="row-reverse">
          <Text color="cyan" dimColor>
            {b2mb(file.downloaded)}/{file.size ? b2mb(file.size) : '∞'} MB
          </Text>
          <Text color="redBright" dimColor>
            {file.size ? `  ${percentage}% ` : ''}
          </Text>
          <Spacer />
          <Text color={'green'} dimColor>
            <Spinner></Spinner>
          </Text>
        </Box>
      </Box>
      <Preview file={file} />
    </>
  );
});
