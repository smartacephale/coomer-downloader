export function b2mb(bytes: number) {
  return (bytes / 1048576).toFixed(2);
}

export function filterString(text: string, include: string, exclude: string) {
  try {
    const includes = !include || new RegExp(include.replace(/,/g, '|'), 'gi').test(text);
    const excludes = !exclude || !new RegExp(exclude.replace(/,/g, '|'), 'gi').test(text);
    return includes && excludes;
  } catch (e) {
    console.error(e);
    return true;
  }
}
