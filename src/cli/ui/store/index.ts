import { create } from 'zustand';
import type { Downloader } from '../../../core';

interface InkState {
  preview: boolean;
  switchPreview: () => void;
  downloader?: Downloader;
  setDownloader: (downloader: Downloader) => void;
}

export const useInkStore = create<InkState>((set) => ({
  preview: false,
  switchPreview: () =>
    set((state) => ({
      preview: !state.preview,
    })),
  downloader: undefined,
  setDownloader: (downloader: Downloader) => set({ downloader }),
}));
