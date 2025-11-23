import { Box, Spacer, Text } from 'ink';
import React from 'react';
import { version } from '../../../../package.json';

export function TitleBar() {
  return (
    <Box >
      <Spacer></Spacer>
      <Box borderColor={'magenta'} borderStyle={'arrow'}>
        <Text color={'cyanBright'}>Coomer-Downloader {version}</Text>
      </Box>
      <Spacer></Spacer>
    </Box>
  );
}
