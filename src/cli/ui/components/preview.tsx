import { Box, Spacer, Text } from 'ink';
import Image, { TerminalInfoProvider } from 'ink-picture';
import React from 'react';
import type { CoomerFile } from '../../../services/file';

interface PreviewProps {
  file: CoomerFile;
}

export function Preview({ file }: PreviewProps) {
  return (
    <Box paddingX={1}>
      <TerminalInfoProvider>
        <Box width={30} height={15}>
          <Image src={file.filepath as string} alt="Preview" />
        </Box>
      </TerminalInfoProvider>
    </Box>
  );
}
