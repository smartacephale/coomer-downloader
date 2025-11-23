import { useInput } from 'ink';
import type { Downloader } from '../../../services/downloader';

// problems with tsx watch
export const useInputHook = (downloader: Downloader) => {
  useInput((input) => {
    if (input === 's') {
      downloader.skip();
    }
  });
};
