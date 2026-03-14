import { render } from 'ink';
import React from 'react';
import { App } from './app.tsx';

export function createReactInk() {
  return render(<App />);
}
