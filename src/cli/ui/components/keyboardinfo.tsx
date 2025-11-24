import { Box, Text } from 'ink';
import React from 'react';

const info = {
  's ': 'skip current file',
  p: 'on/off image preview',
};

export function KeyboardControlsInfo() {
  const infoRender = Object.entries(info).map(([key, value]) => {
    return (
      <Box key={key}>
        <Box marginRight={2}>
          <Text color={'red'} dimColor bold>
            {key}
          </Text>
        </Box>
        <Text dimColor bold={false}>
          {value}
        </Text>
      </Box>
    );
  });

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
      {infoRender}
    </Box>
  );
}
