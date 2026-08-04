/**
 * Structural equality over JSON-safe values — the sole judge of whether an
 * `update` edit has collapsed back to its baseline row, so that section can
 * honestly report zero pending intent (an untouched section must produce
 * zero upsert requests). Two rules make it match `JSON.stringify` rather
 * than a naive recursive `===`:
 *
 *  1. Object key order is irrelevant: `{a:1,b:2}` deepEqualJson `{b:2,a:1}`.
 *  2. An object key whose value is `undefined` is treated as ABSENT on both
 *     sides — `JSON.stringify` drops such keys, so `{a: undefined}`
 *     deepEqualJson `{}`. This is what lets a patch built as
 *     `{ ...baselineRow, someField: undefined }` compare equal to a row
 *     that was never patched at all.
 *
 * Everything below is a DELIBERATE, DOCUMENTED decision for an edge case
 * the annex leaves implicit — not left as undefined behavior:
 *
 *  - `null` and `undefined` are DISTINCT values, always. `{a: null}` is
 *    NOT deepEqualJson to `{}` or to `{a: undefined}` — rule 2 only makes
 *    an `undefined`-valued key equivalent to an ABSENT key, never to a key
 *    holding a real `null`. (`JSON.stringify({a:null})` prints a real
 *    `"a":null` member; `JSON.stringify({a:undefined})` prints nothing.)
 *
 *  - `NaN` is equal to `NaN` (unlike `===`). Two fields that both hold
 *    "not a number" is not a change a clinician made. This does NOT extend
 *    to treating `NaN` as equal to `null`, even though
 *    `JSON.stringify(NaN) === "null"` — that coincidence of the wire
 *    format is not given semantic weight here; `NaN` compares equal only
 *    to another `NaN`.
 *
 *  - `-0` is equal to `0` (both serialize to the JSON literal `0`). Plain
 *    `===` already agrees (`-0 === 0` is `true` in JS), so no special case
 *    is needed — noted here so a future refactor doesn't "fix" it away.
 *
 *  - Array elements are compared positionally with NO undefined-as-absent
 *    normalization (unlike object keys): `[undefined]` is NOT deepEqualJson
 *    to `[null]`. `JSON.stringify` does coerce an array's `undefined`
 *    element to the literal `null` on the wire, but no row shape in this
 *    codebase carries an optional ARRAY SLOT — rows have optional KEYS.
 *    Adopting the array coercion too would add a second "which values
 *    count as absent" rule for a case nothing here produces; keeping array
 *    comparison a straightforward recursive check is the simpler, safer
 *    choice.
 *
 *  - Arrays are order-sensitive: `[1,2]` is NOT deepEqualJson to `[2,1]`.
 *    A row's array fields are meaningful sequences, not sets.
 *
 *  - Anything that is not a plain object or an array — `Date`, `Map`,
 *    `Set`, `RegExp`, a class instance, or a `File` (the one non-JSON
 *    value that actually reaches this function, inside a `files` row's
 *    `add` patch — `update`/`remove` on a `files` row never carry one) —
 *    falls back to REFERENCE equality (`===`). None of these are JSON-safe
 *    to begin with (`JSON.stringify` on a `Map`/`Set` yields `"{}"`), so no
 *    attempt is made to compare their contents structurally: two distinct
 *    instances with identical-looking content are DIFFERENT unless they
 *    are the same reference.
 */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // NaN carve-out: `NaN === NaN` is `false` in JS, but two NaN-valued
  // fields represent no change. See the decision above.
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
    return (
      a.length === b.length &&
      a.every((value, index) => deepEqualJson(value, b[index]))
    );
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

  // Reached when neither side matched above: either exactly one side is a
  // plain object (the other an array, primitive, or non-plain object), or
  // neither is a plain object/array at all (Date, Map, Set, class
  // instance, File, or two unequal primitives). `a === b` already failed,
  // so this is not equal — the documented reference-fallback behavior.
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
