/**
 * The dual-contract discriminator, isolated in its own pure module.
 *
 * Deliberately imports NOTHING. `normalizeContract`/`isV2Definition` are
 * consumed by `registry.ts` (core + plugin resolution), `pluginRegistry.ts`
 * and, later, every fork site Task 8 adds (`composeBatch.ts`,
 * `validateStructured.ts`, the draft partition). If this file imported the
 * real union types from `./types` or `./registry` to type its predicates
 * precisely, a chain from `registry.ts` — which pulls in all eleven
 * structured definitions' real component trees (CSS, UI libs, `react-*`
 * packages) — would make this module unrunnable under the plain
 * `node --test` harness (`npm run test:unit` = `node --import tsx --test
 * "src/**\/*.test.ts"`, no DOM/React). Staying fully generic keeps this file
 * a leaf: no import edge to `./types` or `./registry` at all, so nothing it
 * is transitively responsible for can reintroduce that break.
 * (`pluginRegistry.test.ts`'s docstring notes the identical constraint for
 * the same reason.)
 */

/**
 * An already-published plugin manifest predates `contract` and ships
 * without it. Absent must normalize to 1 — the FAIL-SAFE direction: a v1
 * plugin mistaken for v2 would have its untouched rows silently dropped
 * from the batch by a v2-shaped compose (v2 only ever sends what the edit
 * log names), whereas a v2 plugin mistaken for v1 cannot happen at all
 * (v2 is a newly-required literal, never absent).
 *
 * This is the ONE place "absent means 1" is derived. Every consumer
 * downstream — `resolveStructuredType`'s plugin branch, and every Task 8
 * fork site — reads the NORMALIZED, required `contract` field instead of
 * re-deriving this rule from an optional one.
 *
 * (Not overloaded per input literal: this project's ESLint config applies
 * the base `no-redeclare` rule, which does not understand TS function
 * overload signatures and flags them as redeclarations. A single call
 * site that needs the narrower literal return — `resolveStructuredType`'s
 * plugin branch — gets it for free by branching on `isV2Definition` first
 * and using the literal `1` there, exactly as this function's own body
 * does; see that call site's comment.)
 */
export function normalizeContract(contract: 1 | 2 | undefined): 1 | 2 {
  return contract === 2 ? 2 : 1;
}

/**
 * Narrows ANY two-arm union that discriminates on a `contract` field to its
 * v2 arm — the core `StructuredTypeDefinition`, the resolved
 * `ResolvedStructuredType`, and the plugin `PluginStructuredTypeDefinition`
 * unions (design annex `p1-shim.md` §a.3/§a.5/§a.6) all share this exact
 * shape, so one generic predicate serves every fork site instead of three
 * near-duplicate ones. Generic over `D` (rather than hardcoded to one of
 * those three types) is also what lets this module stay import-free — see
 * the file-level doc comment.
 *
 * Works identically whether `contract` is REQUIRED on both arms (core,
 * resolved) or OPTIONAL on the v1 arm only (plugin): `Extract<D, {contract:
 * 2}>` keeps exactly the member(s) whose `contract` property type is
 * assignable to the literal `2`, which is only ever the v2 arm in every one
 * of these unions.
 */
export function isV2Definition<D extends { contract?: 1 | 2 }>(
  definition: D,
): definition is Extract<D, { contract: 2 }> {
  return definition.contract === 2;
}
