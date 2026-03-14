import { useInput } from 'ink';
import { useInkStore } from '../store/index.ts';

export const useInputHook = () => {
  const downloader = useInkStore((state) => state.downloader);
  const switchPreview = useInkStore((state) => state.switchPreview);

  useInput((input) => {
    if (input === 's') {
      downloader?.skip();
    }
    if (input === 'p') {
      switchPreview();
    }
  });
};
