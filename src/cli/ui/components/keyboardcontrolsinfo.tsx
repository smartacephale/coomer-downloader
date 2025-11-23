import { Box, Text } from 'ink';
import React from 'react';

export function KeyboardControlsInfo() {
  return (
    <Box
      flexDirection="column"
      paddingX={1}
      borderStyle={'single'}
      borderColor={'gray'}
      borderDimColor
    >
      <Box>
        <Text color={'red'} dimColor bold>
          Keyboard controls:
        </Text>
      </Box>
      <Box>
        <Box marginRight={2}>
          <Text color={'red'} dimColor bold>
            s
          </Text>
        </Box>
        <Text dimColor bold={false}>
          skip current file
        </Text>
      </Box>
    </Box>
  );
}
