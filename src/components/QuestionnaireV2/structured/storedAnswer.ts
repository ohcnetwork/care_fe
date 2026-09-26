/**
 * The wire format of a response-persisted structured answer, decoded.
 *
 * `composeBatch` submits such an answer as one string value — the entries
 * array as JSON — because the backend's submit value is `str | None`. The
 * stored response therefore carries `values[0].value` as that string, and
 * this is the inverse: back to the entries array the type's component
 * reads. Tolerant on purpose — an already-decoded array passes through
 * (a local shape, or a future backend that stores JSON natively), and
 * anything else decodes to no entries rather than throwing inside a
 * viewer.
 *
 * Registry-free so `node --test` can load it.
 */
export function parseStoredStructuredValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const decoded: unknown = JSON.parse(value);
    return Array.isArray(decoded) ? decoded : [];
  } catch {
    return [];
  }
}
