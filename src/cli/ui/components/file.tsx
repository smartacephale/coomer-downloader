import { Box, Spacer, Text } from 'ink';
import React from 'react';
import type { CoomerFile } from '../../../services/file';
import { isImage } from '../../../utils/filters';
import { b2mb } from '../../../utils/strings';
import { useInkStore } from '../store';
import { Preview } from './preview';
import { Spinner } from './spinner';

interface FileBoxProps {
  file: CoomerFile;
}

export function FileBox({ file }: FileBoxProps) {
  const percentage = Number((file.downloaded / (file.size as number)) * 100).toFixed(2);

  const previewEnabled = useInkStore((state) => state.preview);
  const preview = previewEnabled && isImage(file.filepath as string) && <Preview file={file} />;

  return (
    <>
      <Box
        borderStyle="single"
        borderColor="magentaBright"
        borderDimColor
        paddingX={1}
        flexDirection="column"
      >
        <Box>
          <Text color="blue" dimColor wrap="truncate-middle">
            {file.name}
          </Text>
        </Box>
        <Box flexDirection="row-reverse">
          <Text color="cyan" dimColor>
            {b2mb(file.downloaded)}/{file.size ? b2mb(file.size) : '∞'} MB
          </Text>
          <Text color="redBright" dimColor>
            {file.size ? `  ${percentage}% ` : ''}
          </Text>
          <Spacer />
          <Text color={'green'} dimColor>
            <Spinner></Spinner>
          </Text>
        </Box>
      </Box>
      {preview}
    </>
  );
}
