import Image, { TerminalInfoProvider } from '@violent-orangutan/ink-picture';
import { Box } from 'ink';
import React from 'react';
import type { CoomerFile } from '../../../core/index.ts';
import { isImage } from '../../../utils/mediatypes.ts';
import { useDownloaderHook } from '../hooks/downloader.ts';
import { useInkStore } from '../store/index.ts';

interface PreviewProps {
  file: CoomerFile;
}

export function Preview({ file }: PreviewProps) {
  useDownloaderHook(['CHUNK_UPDATED']);
  const previewEnabled = useInkStore((state) => state.preview);
  const shouldShow = previewEnabled && isImage(file.filepath as string);

  return (
    shouldShow && (
      <Box key={`box-${file.downloaded}`} width={30} height={15}>
        <TerminalInfoProvider>
          <Box width={30} height={15} padding={1}>
            <Image protocol={'halfBlock'} src={file.filepath as string} alt={file.name} />
          </Box>
        </TerminalInfoProvider>
      </Box>
    )
  );
}
