import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getPluginStructuredType,
  registerPluginStructuredType,
  type PluginStructuredTypeDefinition,
} from "./pluginRegistry";

// ponytail: every registration in this file needs a full definition, so a
// tiny factory keeps each test's `type`/component identity the only thing
// that varies.
function makeDefinition(
  type: string,
  // The persistence half is a discriminated union; overriding it would
  // make the spread below ambiguous, and no test here needs to.
  overrides: Partial<
    Omit<PluginStructuredTypeDefinition, "persistence" | "buildRequests">
  > = {},
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

// ---------------------------------------------------------------------------
// Persistence: a plugin may opt out of `buildRequests` entirely by declaring
// `persistence: "response"` — the entries then ride the questionnaire
// submit as the question's own values. The registry stores the definition
// as declared; `resolveStructuredType` (registry.ts) reads the
// discriminator, so what matters here is that the shape registers and
// round-trips untouched.
// ---------------------------------------------------------------------------

test("a response-persisted definition registers without buildRequests", () => {
  const { buildRequests: _batchOnly, ...base } =
    makeDefinition("plugin_d.chart");
  const definition: PluginStructuredTypeDefinition = {
    ...base,
    persistence: "response",
  };
  const cleanup = registerPluginStructuredType(definition, "plugin_d");
  try {
    const registered = getPluginStructuredType("plugin_d.chart");
    assert.equal(registered, definition);
    assert.equal(registered?.persistence, "response");
    assert.equal(registered?.buildRequests, undefined);
  } finally {
    cleanup();
  }
  assert.equal(getPluginStructuredType("plugin_d.chart"), undefined);
});
