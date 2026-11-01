export function swapElements<T>(arr: T[], idx1: number, idx2: number): T[] {
  if (idx1 < 0 || idx1 >= arr.length || idx2 < 0 || idx2 >= arr.length) {
    return arr;
  }
  const next = [...arr];
  [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
  return next;
}
