#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

import process from 'node:process';
import { main } from './main';

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
