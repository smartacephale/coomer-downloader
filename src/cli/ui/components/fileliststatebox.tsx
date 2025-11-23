import { Box, Text } from 'ink';
import React from 'react';
import type { CoomerFileList } from '../../../services/file';

interface FileListStateBoxProps {
  filelist: CoomerFileList;
}

export function FileListStateBox({ filelist }: FileListStateBoxProps) {
  return (
    <Box
      paddingX={1}
      flexDirection="column"
      borderStyle={'single'}
      borderColor={'magenta'}
      borderDimColor
    >
      <Box>
        <Box marginRight={1}>
          <Text color="cyanBright" dimColor>
            Found:
          </Text>
        </Box>
        <Text color="blue" dimColor wrap="wrap">
          {filelist.files.length}
        </Text>
      </Box>
      <Box>
        <Box marginRight={1}>
          <Text color="cyanBright" dimColor>
            Downloaded:
          </Text>
        </Box>
        <Text color="blue" dimColor wrap="wrap">
          {filelist.getDownloaded().length}
        </Text>
      </Box>
      <Box>
        <Box width={9}>
          <Text color="cyanBright" dimColor>
            Folder:
          </Text>
        </Box>
        <Box flexGrow={1}>
          <Text color="blue" dimColor wrap="truncate-middle">
            {filelist.dirPath}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
