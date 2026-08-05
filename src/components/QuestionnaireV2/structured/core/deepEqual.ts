/**
 * Structural equality over JSON-safe values — the sole judge of whether an
 * `update` edit has collapsed back to its baseline row, so a section can
 * honestly report zero pending intent. Matches `JSON.stringify` semantics
 * rather than a naive recursive `===`:
 *
 *  1. Object key order is irrelevant.
 *  2. An object key whose value is `undefined` is treated as ABSENT on
 *     both sides (`JSON.stringify` drops such keys), so a patch built as
 *     `{ ...baselineRow, someField: undefined }` compares equal to a row
 *     that was never patched.
 *
 * Deliberate edge-case decisions:
 *
 *  - `null` and `undefined` are DISTINCT: rule 2 makes an
 *    `undefined`-valued key equivalent to an absent key, never to `null`.
 *  - `NaN` equals `NaN` (two "not a number" fields are not a clinician's
 *    change) but never equals `null`, despite `JSON.stringify(NaN)`
 *    printing `null`.
 *  - Array elements are compared positionally and order-sensitively, with
 *    no undefined-as-absent normalization — rows have optional KEYS, not
 *    optional array slots, and array fields are meaningful sequences.
 *  - Non-plain objects (`Date`, `Map`, `Set`, `RegExp`, class instances,
 *    `File` — which reaches this function inside a `files` row's `add`
 *    patch) fall back to reference equality; none are JSON-safe to begin
 *    with.
 *  - Cyclic inputs are NOT guarded: every row shape here is a plain API
 *    request object and cannot become cyclic, so a stack overflow on a
 *    cycle is a loud caller bug, not a case to silently "succeed" on.
 */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // `NaN === NaN` is false in JS, but two NaN-valued fields represent no
  // change.
  if (
    typeof a === "number" &&
    typeof b === "number" &&
    Number.isNaN(a) &&
    Number.isNaN(b)
  ) {
    return true;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    // A plain index loop, not `every` — `every` skips holes in a sparse
    // array; indexing reads `undefined` for a hole and compares it like
    // any other value.
    for (let i = 0; i < a.length; i++) {
      if (!deepEqualJson(a[i], b[i])) return false;
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    // Rule 2: an `undefined`-valued key is dropped before comparison,
    // matching `JSON.stringify`'s key-omission — never treated as
    // equivalent to a key holding a real `null`.
    const aKeys = Object.keys(a).filter((key) => a[key] !== undefined);
    const bKeys = Object.keys(b).filter((key) => b[key] !== undefined);
    if (aKeys.length !== bKeys.length) return false;
    const bKeySet = new Set(bKeys);
    return aKeys.every(
      (key) => bKeySet.has(key) && deepEqualJson(a[key], b[key]),
    );
  }

  // Neither side matched above: mismatched shapes, two unequal
  // primitives, or two non-plain objects — `a === b` already failed, so
  // this is the documented reference-fallback.
  return false;
}

/**
 * A "JSON-shaped" object: an object literal, or one created with
 * `Object.create(null)`. Excludes arrays (handled separately above), and
 * excludes `Date`/`Map`/`Set`/`RegExp`/class instances/`File` — anything
 * whose prototype isn't `Object.prototype` or `null` — which is exactly
 * the set of values `JSON.stringify` does not round-trip faithfully
 * either.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
