import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isV2Definition, normalizeContract } from "./contract";

describe("normalizeContract", () => {
  it("treats an absent contract as v1 — the fail-safe direction for an already-published plugin manifest predating `contract` (a v1 plugin mistaken for v2 would have its untouched rows silently dropped from the batch)", () => {
    assert.equal(normalizeContract(undefined), 1);
  });

  it("passes 1 through unchanged", () => {
    assert.equal(normalizeContract(1), 1);
  });

  it("passes 2 through unchanged", () => {
    assert.equal(normalizeContract(2), 2);
  });
});

describe("isV2Definition — narrows a contract-discriminated union to its v2 arm", () => {
  // A minimal stand-in for the real two-arm unions (core
  // `StructuredTypeDefinition`, `ResolvedStructuredType`,
  // `PluginStructuredTypeDefinition`) — this file deliberately does not
  // import any of them, matching `contract.ts` itself, which must not pull
  // in `registry.ts` (component trees) to stay runnable under plain
  // `node --test`.
  interface V1Arm {
    contract: 1;
    buildRequests: () => string;
  }
  interface V2Arm {
    contract: 2;
    toRequests: () => string;
  }
  type CoreLike = V1Arm | V2Arm;

  it("returns false for the v1 arm and keeps it narrowed to buildRequests", () => {
    const definition: CoreLike = { contract: 1, buildRequests: () => "v1" };

    assert.equal(isV2Definition(definition), false);
    if (!isV2Definition(definition)) {
      // Only compiles if TS still sees `buildRequests` here — the point of
      // the negative narrow, not just the positive one.
      assert.equal(definition.buildRequests(), "v1");
    } else {
      assert.fail("v1 arm must not narrow to v2");
    }
  });

  it("returns true for the v2 arm and narrows to toRequests", () => {
    const definition: CoreLike = { contract: 2, toRequests: () => "v2" };

    assert.equal(isV2Definition(definition), true);
    if (isV2Definition(definition)) {
      // Only compiles if TS narrowed away `buildRequests`'s arm here.
      assert.equal(definition.toRequests(), "v2");
    } else {
      assert.fail("v2 arm must narrow to v2");
    }
  });

  it("narrows a plugin-shaped union where `contract` is OPTIONAL on the v1 arm and genuinely absent (not just 1) on an already-published manifest", () => {
    interface PluginV1Arm {
      contract?: 1;
      buildRequests: () => string;
    }
    interface PluginV2Arm {
      contract: 2;
      toRequests: () => string;
    }
    type PluginLike = PluginV1Arm | PluginV2Arm;

    const publishedBeforeContractExisted: PluginLike = {
      buildRequests: () => "legacy",
    };

    assert.equal(isV2Definition(publishedBeforeContractExisted), false);

    const pluginV2: PluginLike = { contract: 2, toRequests: () => "v2" };
    assert.equal(isV2Definition(pluginV2), true);
  });
});
