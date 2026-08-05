/**
 * Client-only React keys for the rows of a repeating question.
 *
 * Entries are addressed POSITIONALLY in the store, so removing one shifts
 * every later entry down an index — keyed by index, React would hand the
 * removed row's transient DOM state (an open date-picker popover, an
 * uncommitted number buffer) to its successor. These keys travel with the
 * row instead; they are never persisted and never leave the renderer.
 */
export interface RowKeys {
  keys: number[];
  /** Next unused key. Monotonic, so a removed row's key is never reused
   *  while a live row still holds it. */
  next: number;
}

export const EMPTY_ROW_KEYS: RowKeys = { keys: [], next: 0 };

/**
 * Keys for rows that appeared since the last render (an added entry, a
 * restored draft, an assistant write) — existing rows keep theirs. Returns
 * the same object when nothing was missing, so callers can use identity to
 * decide whether state needs updating.
 */
export function growRowKeys(state: RowKeys, count: number): RowKeys {
  if (state.keys.length >= count) return state;
  const keys = [...state.keys];
  let next = state.next;
  while (keys.length < count) keys.push(next++);
  return { keys, next };
}

/** Drops one row's key so every survivor keeps its own. */
export function dropRowKey(
  state: RowKeys,
  count: number,
  index: number,
): RowKeys {
  const grown = growRowKeys(state, count);
  return {
    keys: grown.keys.filter((_, i) => i !== index),
    next: grown.next,
  };
}
