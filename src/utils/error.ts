interface PrintOptions {
  quiet?: number[];
  context?: any;
}

export function printError(err: unknown, options: PrintOptions = {}): void {
  const e = err as any;

  const status = Number(
    e?.response?.status || e?.status || e?.message?.match(/\d{3}/)?.[0] || 500,
  );

  const type = e?.code || e?.name || 'Error';
  const message = e?.message || 'No details';

  const quietList = options.quiet ?? [403, 404];
  const isQuiet = quietList.includes(status);

  console.error(
    `\x1b[31m[ERROR]\x1b[0m \x1b[33m${status}\x1b[0m | \x1b[36m${type}\x1b[0m: ${message}`,
  );

  if (options.context) {
    console.error('\x1b[90mContext:\x1b[0m', options.context);
  }

  if (!isQuiet && e?.stack) {
    console.error(`\n\x1b[90mStack Trace:\n${e.stack}\x1b[0m`);
  }
}
