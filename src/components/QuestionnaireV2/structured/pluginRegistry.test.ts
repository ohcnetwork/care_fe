import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getPluginStructuredType,
  registerPluginStructuredType,
  type PluginStructuredTypeDefinition,
  type PluginStructuredTypeDefinitionV1,
  type PluginStructuredTypeDefinitionV2,
} from "./pluginRegistry";

// ponytail: every registration in this file needs a full definition, so a
// tiny factory keeps each test's `type`/component identity the only thing
// that varies. Always produces a v1 arm (`contract` absent) — every case
// in this file exercises registration/lookup mechanics that are identical
// across contracts, so there is no need for a v2 fixture here.
//
// `overrides` is deliberately typed against the V1 arm alone, not the
// `PluginStructuredTypeDefinition` union: `Partial` distributes over a
// union (`Partial<V1> | Partial<V2>`), which would let the spread below
// synthesize a shape whose `contract` reads as `2 | undefined` — not
// assignable to either arm's `contract` — even though this factory is
// value-level always v1.
function makeDefinition(
  type: string,
  overrides: Partial<PluginStructuredTypeDefinitionV1> = {},
): PluginStructuredTypeDefinition {
  return {
    type,
    // Never rendered in these assertions — only its identity matters, and
    // a distinct function per call keeps that identity from accidentally
    // colliding across definitions in the same test.
    component: (() => null) as PluginStructuredTypeDefinition["component"],
    requires: [],
    subjects: ["encounter"],
    draftPolicy: "serialize",
    label: type,
    buildRequests: async () => [],
    ...overrides,
  };
}

// A v2 fixture, honestly typed as `PluginStructuredTypeDefinitionV2` — the
// shape a real Phase-2+ remote would ship. Deliberately a SEPARATE small
// factory rather than folded into `makeDefinition` (which stays v1-only):
// a shared `overrides` parameter spanning both arms would reintroduce the
// exact `Partial<union>` distribution problem `makeDefinition`'s own
// comment documents.
function makeV2Definition(type: string): PluginStructuredTypeDefinitionV2 {
  return {
    type,
    component: (() => null) as PluginStructuredTypeDefinitionV2["component"],
    requires: [],
    subjects: ["encounter"],
    draftPolicy: "serialize",
    label: type,
    contract: 2,
    toRequests: async () => [],
  };
}

// ---------------------------------------------------------------------------
// PHASE-1 GATE — LIFTED (Task 8). Registration used to refuse any
// `contract: 2` definition outright (see `registerPluginStructuredType`'s
// doc comment for why, and for why removing it is now safe):
// `composeBatch.ts`/`validateStructured.ts` genuinely fork on
// `definition.contract` as of this task, so a registered v2 type's data no
// longer vanishes silently. A v2 definition now registers exactly like a
// v1 one. The end-to-end proof that its `toRequests` actually reaches the
// submit batch lives in `fill/submit/composeStructured.test.ts` (this file
// deliberately stays light on imports — see the "stable across repeated
// calls" test's comment above for why `registry.ts` is out of bounds
// here).
// ---------------------------------------------------------------------------

test("a contract-v2 plugin definition registers successfully — the Phase-1 gate no longer refuses it", () => {
  const definition = makeV2Definition("plugin_g.v2_widget");
  const cleanup = registerPluginStructuredType(definition, "plugin_g");

  assert.equal(getPluginStructuredType("plugin_g.v2_widget"), definition);
  cleanup();
  assert.equal(getPluginStructuredType("plugin_g.v2_widget"), undefined);
});

test("a v2 and a v1 registration under the same owner coexist", () => {
  const v1 = makeDefinition("plugin_h.v1_widget");
  const v2 = makeV2Definition("plugin_h.v2_widget");

  registerPluginStructuredType(v2, "plugin_h");
  registerPluginStructuredType(v1, "plugin_h");

  assert.equal(getPluginStructuredType("plugin_h.v2_widget"), v2);
  assert.equal(getPluginStructuredType("plugin_h.v1_widget"), v1);
});

// ---------------------------------------------------------------------------
// Ownership refusal (P2-8: the namespace half of the type id must match the
// registering plugin's slug — a plugin cannot register into another's
// namespace by claiming a different `ownerSlug`).
// ---------------------------------------------------------------------------

test("registration is refused when ownerSlug does not match the type's namespace", () => {
  const definition = makeDefinition("plugin_a.stolen_type");
  const cleanup = registerPluginStructuredType(definition, "plugin_b");

  // Refused: nothing is registered under the contested type.
  assert.equal(getPluginStructuredType("plugin_a.stolen_type"), undefined);
  // The refusal's cleanup is a no-op — calling it must not throw or affect
  // any other registration.
  assert.doesNotThrow(() => cleanup());
});

test("registration succeeds when ownerSlug matches the type's namespace", () => {
  const definition = makeDefinition("plugin_c.honest_type");
  registerPluginStructuredType(definition, "plugin_c");

  assert.equal(getPluginStructuredType("plugin_c.honest_type"), definition);
});

test("a non-namespaced type throws regardless of ownerSlug", () => {
  const definition = makeDefinition("not_namespaced");
  assert.throws(() =>
    registerPluginStructuredType(definition, "not_namespaced"),
  );
});

// ---------------------------------------------------------------------------
// Re-register replaces the definition (P2-7's recovery moment: a plugin
// shipping a fixed component re-registers the same type, and anything
// keying off the resolved definition's identity — PluginErrorBoundary's
// resetKey via StructuredSlot — must see that as a change).
// ---------------------------------------------------------------------------

test("re-registering the same type replaces the stored definition", () => {
  const broken = makeDefinition("plugin_d.widget");
  const fixed = makeDefinition("plugin_d.widget");
  assert.notEqual(
    broken,
    fixed,
    "sanity: the two definitions must be distinct objects",
  );

  registerPluginStructuredType(broken, "plugin_d");
  assert.equal(getPluginStructuredType("plugin_d.widget"), broken);

  registerPluginStructuredType(fixed, "plugin_d");
  assert.equal(getPluginStructuredType("plugin_d.widget"), fixed);
});

test("getPluginStructuredType is stable across repeated calls for an unchanged registration", () => {
  const definition = makeDefinition("plugin_e.stable");
  registerPluginStructuredType(definition, "plugin_e");

  const first = getPluginStructuredType("plugin_e.stable");
  const second = getPluginStructuredType("plugin_e.stable");

  // Same underlying registration, read twice (simulating two renders of a
  // consumer that did not just re-register). `resolveStructuredType`
  // (structured/registry.ts) memoizes its wrapper keyed on exactly this
  // reference, so a resetKey wired to its output must NOT see a change
  // here — only `pluginRegistry.test.ts`'s lightweight imports let this
  // run under plain `node --test`; `registry.ts` pulls in every structured
  // definition's real component tree (CSS, UI libs) and is exercised via
  // the questionnaire fill/structured Playwright specs instead.
  assert.equal(first, definition);
  assert.equal(first, second);
});

test("getPluginStructuredType returns a new identity after a re-register", () => {
  const broken = makeDefinition("plugin_f.widget");
  registerPluginStructuredType(broken, "plugin_f");
  const beforeFix = getPluginStructuredType("plugin_f.widget");

  // The plugin re-registers the same type with a fixed component — the
  // scenario PluginErrorBoundary's resetKey (via StructuredSlot's
  // `resetKey={definition}`, itself sourced from this same Map through
  // `resolveStructuredType`'s memoized wrapper) exists to catch.
  const fixed = makeDefinition("plugin_f.widget");
  registerPluginStructuredType(fixed, "plugin_f");
  const afterFix = getPluginStructuredType("plugin_f.widget");

  assert.equal(beforeFix, broken);
  assert.equal(afterFix, fixed);
  assert.notEqual(
    beforeFix,
    afterFix,
    "a boundary keyed on this identity must see a change on re-register",
  );
});
