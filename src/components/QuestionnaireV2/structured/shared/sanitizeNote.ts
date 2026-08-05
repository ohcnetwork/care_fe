/** Normalizes a row's free-text note for the wire: trims whitespace and
 *  collapses an empty result to `undefined`, so an untouched or cleared
 *  note field never sends `""`. React-free so `model.ts` modules stay
 *  importable by the node:test harness. */
export function sanitizeNote(note: string | undefined): string | undefined {
  return note?.trim() || undefined;
}
