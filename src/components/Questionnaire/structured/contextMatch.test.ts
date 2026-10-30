import assert from "node:assert/strict";
import { test } from "node:test";

import { ResponseContext } from "@/types/questionnaire/form";

import { diffResponseContext, mergeRecoveredValues } from "./contextMatch";

const rec = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, code: { display: id }, ...extra }) as unknown as ResponseContext;

test("equal sets match", () => {
  const a = [rec("1"), rec("2")];
  const b = [rec("2"), rec("1")]; // order-independent
  const d = diffResponseContext(a, b);
  assert.equal(d.matches, true);
  assert.equal(d.added.length + d.removed.length + d.changed.length, 0);
});

test("added / removed land in the right bucket", () => {
  const d = diffResponseContext([rec("1")], [rec("1"), rec("2")]);
  assert.equal(d.matches, false);
  assert.deepEqual(
    d.added.map((r) => r.id),
    ["2"],
  );
  assert.equal(d.removed.length, 0);

  const d2 = diffResponseContext([rec("1"), rec("2")], [rec("1")]);
  assert.deepEqual(
    d2.removed.map((r) => r.id),
    ["2"],
  );
});

test("field change surfaces as changed", () => {
  const d = diffResponseContext(
    [rec("1", { severity: "mild" })],
    [rec("1", { severity: "severe" })],
  );
  assert.equal(d.changed.length, 1);
  assert.equal(d.changed[0].id, "1");
});

test("volatile-only differences do not count as changed", () => {
  const d = diffResponseContext(
    [rec("1", { modified_date: "2020" })],
    [rec("1", { modified_date: "2026" })],
  );
  assert.equal(d.matches, true);
});

test("audit fields (who last touched it) do not count as changed", () => {
  const d = diffResponseContext(
    [
      rec("1", {
        updated_by: { username: "a" },
        created_by: { username: "a" },
      }),
    ],
    [
      rec("1", {
        updated_by: { username: "b" },
        created_by: { username: "a" },
      }),
    ],
  );
  assert.equal(d.matches, true);
});

test("absent draft snapshot matches (no baseline)", () => {
  assert.equal(diffResponseContext(undefined, [rec("1")]).matches, true);
});

test("preserves draft edits to existing rows, keeps new, drops server-removed", () => {
  const draft = [
    { id: "1", severity: "edited" }, // existing, user edited the value
    { id: undefined, severity: "new" }, // newly added by the user
    { id: "9", severity: "old" }, // existing, deleted on the server
  ];
  const fresh = [
    { id: "1", severity: "server" }, // still on the server
    { id: "2", severity: "added" }, // added on the server since save
  ];
  const merged = mergeRecoveredValues(draft, fresh, new Set(["1", "2"]));
  assert.deepEqual(
    merged.map((r) => r.id),
    ["1", undefined, "2"],
  );
  assert.equal(merged[0].severity, "edited"); // edit preserved, NOT "server"
});

test("scales to 100 large records well under a frame", () => {
  const big = (id: string) =>
    rec(id, {
      code: { display: id, system: "http://x", code: id },
      created_by: { id: "u", username: "u", first_name: "a", last_name: "b" },
      created_date: "2020",
      modified_date: "2020",
      onset: { onset_datetime: "2020", note: "x".repeat(50) },
      nested: { a: [1, 2, 3], b: { c: { d: id } } },
    });
  const draft = Array.from({ length: 100 }, (_, i) => big(String(i)));
  const fresh = Array.from({ length: 100 }, (_, i) => big(String(i)));
  const start = performance.now();
  const d = diffResponseContext(draft, fresh);
  const ms = performance.now() - start;
  assert.equal(d.matches, true);
  assert.ok(ms < 16, `diff took ${ms.toFixed(2)}ms (expected < 16ms)`);
});

test("does not duplicate when fresh already holds draft-new rows (no re-seed)", () => {
  // medication_request without a prescription: values are not re-seeded, so
  // freshValues still holds the draft's new (no-id) rows, and context is empty.
  const draft = [
    { id: undefined, dirty: true },
    { id: undefined, dirty: true },
  ];
  const merged = mergeRecoveredValues(draft, draft, new Set<string>());
  assert.equal(merged.length, 2); // not 4
  assert.ok(merged.every((r) => !r.id));
});
