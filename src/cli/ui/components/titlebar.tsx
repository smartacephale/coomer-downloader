import { Box, Spacer, Text } from 'ink';
import React from 'react';
import packageJson from '../../../../package.json' with { type: 'json' };

const { version } = packageJson;

export function TitleBar() {
  return (
    <Box>
      <Spacer></Spacer>
      <Box borderColor={'magenta'} borderStyle={'arrow'}>
        <Text color={'cyanBright'}>Coomer-Downloader {version}</Text>
      </Box>
      <Spacer></Spacer>
    </Box>
  );
}
