import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getFormAssistantsVersion,
  listFormAssistants,
  registerFormAssistant,
  type FormAssistantDefinition,
} from "./formAssistantRegistry";

function makeDefinition(label: string): FormAssistantDefinition {
  return {
    component: (() => null) as FormAssistantDefinition["component"],
    label,
  };
}

describe("formAssistantRegistry", () => {
  it("registers under the given owner slug and lists it back", () => {
    const cleanup = registerFormAssistant(
      makeDefinition("Scribe"),
      "care_scribe",
    );
    try {
      const found = listFormAssistants().find((a) => a.slug === "care_scribe");
      assert.ok(found);
      assert.equal(found?.label, "Scribe");
    } finally {
      cleanup();
    }
  });

  it("two different plugin slugs coexist independently", () => {
    const cleanupA = registerFormAssistant(makeDefinition("A"), "plugin_a");
    const cleanupB = registerFormAssistant(makeDefinition("B"), "plugin_b");
    try {
      const slugs = listFormAssistants().map((a) => a.slug);
      assert.ok(slugs.includes("plugin_a"));
      assert.ok(slugs.includes("plugin_b"));
    } finally {
      cleanupA();
      cleanupB();
    }
  });

  it("cleanup only removes the registration it installed (stale cleanup is a no-op)", () => {
    const cleanupFirst = registerFormAssistant(
      makeDefinition("first"),
      "plugin_x",
    );
    const cleanupSecond = registerFormAssistant(
      makeDefinition("second"),
      "plugin_x",
    );
    // The first cleanup fires AFTER a re-register superseded it — must not
    // delete the second registration out from under it.
    cleanupFirst();
    const stillThere = listFormAssistants().find((a) => a.slug === "plugin_x");
    assert.equal(stillThere?.label, "second");
    cleanupSecond();
    assert.equal(
      listFormAssistants().some((a) => a.slug === "plugin_x"),
      false,
    );
  });

  it("bumps the version counter on every register/unregister", () => {
    const before = getFormAssistantsVersion();
    const cleanup = registerFormAssistant(makeDefinition("v"), "plugin_v");
    assert.ok(getFormAssistantsVersion() > before);
    const afterRegister = getFormAssistantsVersion();
    cleanup();
    assert.ok(getFormAssistantsVersion() > afterRegister);
  });
});
