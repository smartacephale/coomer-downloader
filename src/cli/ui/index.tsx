import { render } from 'ink';
import React from 'react';
import { App } from './app';

export function createReactInk() {
  return render(<App />);
}
