export function b2mb(bytes: number) {
  return Number.parseFloat((bytes / 1048576).toFixed(2));
}

export function sanitizeString(str: string) {
  return (
    str
      .match(/(\w| |-)/g)
      ?.join('')
      .replace(/ +/g, ' ') || ''
  );
}

export function formatNameStdout(pathname: string) {
  const name = pathname.split('/').pop() || '';
  const consoleWidth = process.stdout.columns;
  const width = Math.max((consoleWidth / 2) | 0, 40);
  if (name.length < width) return name.trim();
  const result = `${name.slice(0, width - 15)} ... ${name.slice(-10)}`.replace(/ +/g, ' ');
  return result;
}
