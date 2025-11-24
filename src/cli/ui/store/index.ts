import { create } from 'zustand';
import type { Downloader } from '../../../services/downloader';

interface InkState {
  preview: boolean;
  switchPreview: () => void;
  downloader?: Downloader;
  setDownloader: (downloader: Downloader) => void;
}

export const useInkStore = create<InkState>((set) => ({
  preview: true,
  switchPreview: () =>
    set((state) => ({
      preview: !state.preview,
    })),
  downloader: undefined,
  setDownloader: (downloader: Downloader) => set({ downloader }),
}));
