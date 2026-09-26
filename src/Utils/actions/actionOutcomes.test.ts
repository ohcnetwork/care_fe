import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { collectActionOutcomes, outcomeMessage } from "./actionOutcomes";

const notify = {
  slug: "show_message",
  instruction_type: "NOTIFY",
  results: { message: "fever with temp 39.2" },
};

describe("collectActionOutcomes", () => {
  it("reads _actions off a plain response body", () => {
    assert.deepEqual(
      collectActionOutcomes({ id: "r1", _actions: [notify, { nope: true }] }),
      [notify],
    );
  });

  it("flattens the one-list-per-configuration shape appointments return", () => {
    assert.deepEqual(
      collectActionOutcomes({
        id: "booking",
        _actions: [[notify], [], [notify, { nope: true }]],
      }),
      [notify, notify],
    );
  });

  it("tolerates the no-actions shapes and non-objects", () => {
    assert.deepEqual(collectActionOutcomes({ id: "r1", _actions: {} }), []);
    assert.deepEqual(collectActionOutcomes({ id: "r1", _actions: [] }), []);
    assert.deepEqual(collectActionOutcomes({ id: "r1" }), []);
    assert.deepEqual(collectActionOutcomes(null), []);
    assert.deepEqual(collectActionOutcomes("garbage"), []);
    assert.deepEqual(collectActionOutcomes(undefined), []);
  });

  it("unwraps every sub-result of a batch response", () => {
    assert.deepEqual(
      collectActionOutcomes({
        results: [
          {
            reference_id: "qn-1",
            status_code: 200,
            data: { _actions: [notify] },
          },
          { reference_id: "structured", status_code: 200, data: { id: "x" } },
          {
            reference_id: "qn-2",
            status_code: 200,
            data: { _actions: "garbage" },
          },
          { reference_id: "qn-3", status_code: 200 },
          {
            reference_id: "qn-4",
            status_code: 200,
            data: { _actions: [notify] },
          },
        ],
      }),
      [notify, notify],
    );
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
