import { Box, Text } from 'ink';
import React from 'react';
import type { CoomerFile } from '../../../core/index.ts';
import { FileInfo } from './fileinfo.tsx';
import { Preview } from './preview.tsx';
import { Spinner } from './spinner.tsx';

interface FileBoxProps {
  file: CoomerFile;
}

export const FileBox = React.memo(({ file }: FileBoxProps) => {
  return (
    <>
      <Box
        borderStyle="single"
        borderColor="magentaBright"
        borderDimColor
        padding={1}
        flexDirection="row"
      >
        <Box flexGrow={1} flexBasis={0}>
          <Text color="blue" dimColor>
            {file.name}
          </Text>
        </Box>
        <Box flexGrow={1} flexBasis={0} justifyContent="flex-end">
          <Text color={'green'} dimColor>
            <Spinner></Spinner>
          </Text>
          <FileInfo file={file} />
        </Box>
      </Box>
      <Preview file={file} />
    </>
  );
});
