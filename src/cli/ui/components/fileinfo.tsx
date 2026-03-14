import { Text } from 'ink';
import React from 'react';
import type { CoomerFile } from '../../../core/index.ts';
import { b2mb } from '../../../utils/strings.ts';
import { useDownloaderHook } from '../hooks/downloader.ts';

interface FileInfoProps {
  file: CoomerFile;
}

export const FileInfo = React.memo(({ file }: FileInfoProps) => {
  useDownloaderHook(['CHUNK_UPDATED']);
  const percentage = Number((file.downloaded / (file.size as number)) * 100).toFixed(2);

  return (
    <>
      <Text color="redBright" dimColor>
        {file.size ? `  ${percentage}% ` : ''}
      </Text>
      <Text color="cyan" dimColor>
        {b2mb(file.downloaded)}/{file.size ? b2mb(file.size) : '∞'} MB
      </Text>
    </>
  );
});
