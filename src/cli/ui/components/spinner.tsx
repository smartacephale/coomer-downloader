import type { SpinnerName } from 'cli-spinners';
import spinners from 'cli-spinners';
import { Text } from 'ink';
import React, { useEffect, useState } from 'react';

interface SpinnerProps {
  type?: SpinnerName;
}

export function Spinner({ type = 'dots' }: SpinnerProps) {
  const spinner = spinners[type];
  const randomFrame = (spinner.frames.length * Math.random()) | 0;
  const [frame, setFrame] = useState(randomFrame);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        return (previousFrame + 1) % spinner.frames.length;
      });
    }, spinner.interval);

    return () => {
      clearInterval(timer);
    };
  }, [spinner]);

  return <Text>{spinner.frames[frame]}</Text>;
}
