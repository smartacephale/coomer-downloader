import pino from 'pino';

// tail -f debug.log | jq -C .
const logger = pino(
  {
    level: 'debug',
  },
  pino.destination({
    dest: './debug.log',
    append: false,
    sync: true,
  }),
);

export default logger;
