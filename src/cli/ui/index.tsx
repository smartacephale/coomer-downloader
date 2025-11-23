import { render } from 'ink';
import React from 'react';
import type { Downloader } from '../../services/downloader';
import { App } from './app';

export function createReactInk(downloader: Downloader) {
  return render(<App downloader={downloader} />);
}
