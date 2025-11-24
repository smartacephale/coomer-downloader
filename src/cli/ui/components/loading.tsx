import { Box, Text } from 'ink';
import React from 'react';
import { Spinner } from './spinner';

export function Loading() {
  return (
    <Box paddingX={1} borderDimColor flexDirection="column">
      <Box alignSelf="center">
        <Text dimColor color={'redBright'}>
          Fetching Data
        </Text>
      </Box>
      <Box alignSelf="center">
        <Text color={'blueBright'} dimColor>
          <Spinner type="grenade"></Spinner>
        </Text>
      </Box>
    </Box>
  );
}
