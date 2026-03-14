export function collectUniquesAndDuplicatesBy<T extends {}, K extends keyof T>(
  xs: T[],
  k: K,
): { uniques: T[]; duplicates: T[] } {
  const xg = Map.groupBy(xs, (x) => x[k])
    .values()
    .toArray();

  const uniques = xg.flatMap((x) => x[0]);
  const duplicates = xg.flatMap((x) => x.slice(1));

  return { uniques, duplicates };
}

export function removeDuplicatesBy<T extends {}, K extends keyof T>(xs: T[], k: K) {
  return [...new Map(xs.map((x) => [x[k], x])).values()];
}
