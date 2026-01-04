export function collectUniquesAndDuplicatesBy<T extends {}, K extends keyof T>(
  xs: T[],
  k: K,
): { uniques: T[]; duplicates: T[] } {
  const seen = new Set<T[K]>();

  return xs.reduce(
    (acc, item) => {
      if (seen.has(item[k])) {
        acc.duplicates.push(item);
      } else {
        seen.add(item[k]);
        acc.uniques.push(item);
      }
      return acc;
    },
    { uniques: [] as T[], duplicates: [] as T[] },
  );
}

export function removeDuplicatesBy<T extends {}, K extends keyof T>(xs: T[], k: K) {
  return [...new Map(xs.map((x) => [x[k], x])).values()];
}
