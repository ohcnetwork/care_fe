import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { collectActionOutcomes, outcomeMessage } from "./actionOutcomes";

const notify = {
  slug: "logging",
  instruction_type: "NOTIFY",
  results: { message: "fever with temp 39.2" },
};

describe("collectActionOutcomes", () => {
  it("reads _actions only from the questionnaire submit results", () => {
    const outcomes = collectActionOutcomes(
      [
        { reference_id: "qn-1", data: { id: "r1", _actions: [notify] } },
        {
          reference_id: "structured:symptom:q9",
          data: { _actions: [{ ...notify, slug: "not-mine" }] },
        },
        { reference_id: "qn-2", data: { id: "r2" } },
        { reference_id: "qn-3", data: { _actions: "garbage" } },
        { reference_id: "qn-3", data: { _actions: [{ nope: true }, notify] } },
        { data: { _actions: [notify] } },
      ],
      new Set(["qn-1", "qn-2", "qn-3"]),
    );
    assert.deepEqual(outcomes, [notify, notify]);
  });
});

describe("outcomeMessage", () => {
  it("uses the {message} convention or a bare string, else nothing", () => {
    assert.equal(outcomeMessage(notify), "fever with temp 39.2");
    assert.equal(outcomeMessage({ ...notify, results: "plain" }), "plain");
    assert.equal(outcomeMessage({ ...notify, results: "  " }), undefined);
    assert.equal(
      outcomeMessage({ ...notify, results: { message: "  " } }),
      undefined,
    );
    assert.equal(
      outcomeMessage({ ...notify, results: { other: 1 } }),
      undefined,
    );
    assert.equal(outcomeMessage({ ...notify, results: null }), undefined);
  });
});
