import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getPluginStructuredType,
  registerPluginStructuredType,
  type PluginStructuredTypeDefinition,
} from "./pluginRegistry";

// Every registration in this file needs a full definition; this factory
// keeps each test's `type`/component identity the only thing that varies.
// Registration/lookup mechanics do not depend on what
// `toRequests`/`validate` actually do — the end-to-end proof that a
// registered type's `toRequests` reaches the submit batch lives in
// `fill/submit/composeStructured.test.ts`. This file deliberately stays
// light on imports — see the "stable across repeated calls" test's comment
// below for why `registry.ts` is out of bounds here.
function makeDefinition(
  type: string,
  overrides: Partial<PluginStructuredTypeDefinition> = {},
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
    contract: 2,
    toRequests: async () => [],
    ...overrides,
  };
}

test("a plugin structured type definition registers successfully", () => {
  const definition = makeDefinition("plugin_g.widget");
  const cleanup = registerPluginStructuredType(definition, "plugin_g");

  assert.equal(getPluginStructuredType("plugin_g.widget"), definition);
  cleanup();
  assert.equal(getPluginStructuredType("plugin_g.widget"), undefined);
});

test("two registrations under the same owner coexist", () => {
  const a = makeDefinition("plugin_h.widget_a");
  const b = makeDefinition("plugin_h.widget_b");

  const cleanupA = registerPluginStructuredType(a, "plugin_h");
  const cleanupB = registerPluginStructuredType(b, "plugin_h");

  assert.equal(getPluginStructuredType("plugin_h.widget_a"), a);
  assert.equal(getPluginStructuredType("plugin_h.widget_b"), b);

  cleanupA();
  cleanupB();
  assert.equal(getPluginStructuredType("plugin_h.widget_a"), undefined);
  assert.equal(getPluginStructuredType("plugin_h.widget_b"), undefined);
});

// ---------------------------------------------------------------------------
// Ownership refusal: the namespace half of the type id must match the
// registering plugin's slug — a plugin cannot register into another's
// namespace by claiming a different `ownerSlug`.
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
// Re-register replaces the definition: a plugin shipping a fixed component
// re-registers the same type, and anything keying off the resolved
// definition's identity — PluginErrorBoundary's resetKey via
// StructuredSlot — must see that as a change.
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
