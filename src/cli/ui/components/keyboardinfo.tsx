import { Box, Text } from 'ink';
import React from 'react';
import { useInkStore } from '../store';

const Info = {
  's ': 'skip current file',
  p: 'on/off image preview',
} as const;

export function KeyboardControlsInfo() {
  const previewEnabled = useInkStore((state) => state.preview);

  const infoRender = Object.entries(Info).map(([key, value]) => {
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
      borderColor={previewEnabled ? 'gray' : 'magenta'}
      borderDimColor
    >
      <Box>
        <Text color={!previewEnabled ? 'red' : 'cyanBright'} dimColor bold>
          Keyboard controls:
        </Text>
      </Box>
      {infoRender}
    </Box>
  );
}
