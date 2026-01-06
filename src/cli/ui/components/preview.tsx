import { Box } from 'ink';
import Image, { TerminalInfoProvider } from 'ink-picture';
import React from 'react';
import type { CoomerFile } from '../../../core';
import { isImage } from '../../../utils/mediatypes';
import { useInkStore } from '../store';

interface PreviewProps {
  file: CoomerFile;
}

export function Preview({ file }: PreviewProps) {
  const previewEnabled = useInkStore((state) => state.preview);
  const bigEnough = file.downloaded > 50 * 1024;
  const shouldShow = previewEnabled && bigEnough && isImage(file.filepath as string);
  const imgInfo = `
    can't read partial images yet...
    actual size: ${file.size}}
    downloaded: ${file.downloaded}}
  `;
  return (
    shouldShow && (
      <Box paddingX={1}>
        <TerminalInfoProvider>
          <Box width={30} height={15}>
            <Image src={file.filepath as string} alt={imgInfo} />
          </Box>
        </TerminalInfoProvider>
      </Box>
    )
  );
}
