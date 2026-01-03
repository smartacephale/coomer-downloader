function includesAllWords(str: string, words: string[]) {
  if (!words.length) return true;
  return words.every((w) => str.includes(w));
}

function includesNoWords(str: string, words: string[]) {
  if (!words.length) return true;
  return words.every((w) => !str.includes(w));
}

function parseQuery(query: string) {
  return query
    .split(',')
    .map((x) => x.toLowerCase().trim())
    .filter((_) => _);
}

export function filterString(text: string, include: string, exclude: string): boolean {
  return includesAllWords(text, parseQuery(include)) && includesNoWords(text, parseQuery(exclude));
}
