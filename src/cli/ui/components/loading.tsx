import { Box, Text } from 'ink';
import React from 'react';
import { Spinner } from './spinner.tsx';

export function Loading() {
  return (
    <Box padding={1} borderDimColor flexDirection="column">
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
