import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkSessionEditable } from "./sessionPhase";

describe("checkSessionEditable — the assistant's half of the submit freeze", () => {
  it("allows a write while the session is being edited", () => {
    assert.equal(checkSessionEditable("editing").ok, true);
  });

  it("refuses a write while the batch is being composed", () => {
    // Compose has already read `responsesAtom`: a write landing now
    // paints on screen, is acknowledged as ok, and is absent from the
    // batch the page navigates away on.
    assert.equal(checkSessionEditable("composing").ok, false);
  });

  it("refuses a write while the submission is in flight", () => {
    assert.equal(checkSessionEditable("submitting").ok, false);
  });

  it("says why, so the caller can retry rather than guess", () => {
    const result = checkSessionEditable("submitting");
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error : "", /submitted/);
  });
});
