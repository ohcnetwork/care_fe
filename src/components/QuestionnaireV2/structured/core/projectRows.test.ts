import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import type { SymptomRequest } from "@/types/emr/symptom/symptom";

import { projectRows } from "./projectRows";
import { SINGLETON_ROW_ID } from "./rowIds";
import type {
  BaselineRow,
  EditLog,
  RowEdit,
  RowId,
  SoftDeleteDescriptor,
} from "./types";

/**
 * A small, deliberately generic row shape for the structural cases
 * (position, hiding, collision, purity) — contrast the Symptom/Diagnosis
 * fixtures below, used where the edge case is shape-sensitive (the
 * soft-delete marker field, the Diagnosis onset-sort bug).
 */
interface TestRow {
  id: string;
  label: string;
}

function row(id: string, label: string): TestRow {
  return { id, label };
}

function baselineEntry(rowId: RowId, r: TestRow): BaselineRow<TestRow> {
  return { rowId, row: r };
}

function add<TRow extends object>(rowId: RowId, patch: TRow): RowEdit<TRow> {
  return { rowId, op: "add", patch };
}
function update<TRow extends object>(rowId: RowId, patch: TRow): RowEdit<TRow> {
  return { rowId, op: "update", patch };
}
function remove<TRow extends object>(rowId: RowId, patch: TRow): RowEdit<TRow> {
  return { rowId, op: "remove", patch };
}

// Realistic row fixtures, per the task brief — see
// src/types/emr/symptom/symptom.ts and src/types/emr/diagnosis/diagnosis.ts.
// Mirrors the fixture style in `deepEqual.test.ts`.
function makeSymptomRow(
  overrides: Partial<SymptomRequest> = {},
): SymptomRequest {
  return {
    id: "symptom-1",
    clinical_status: "active",
    verification_status: "confirmed",
    code: { system: "system-condition-code", code: "R05", display: "Cough" },
    severity: "moderate",
    onset: { onset_datetime: "2026-01-01" },
    recorded_date: "2026-01-01",
    note: "worse at night",
    encounter: "encounter-1",
    category: "problem_list_item",
    ...overrides,
  };
}

function makeDiagnosisRow(
  overrides: Partial<DiagnosisRequest> = {},
): DiagnosisRequest {
  return {
    id: "diagnosis-1",
    clinical_status: "active",
    verification_status: "confirmed",
    code: { system: "system-condition-code", code: "J45", display: "Asthma" },
    severity: "mild",
    onset: { onset_datetime: "2025-06-01" },
    recorded_date: "2025-06-01",
    note: undefined,
    category: "chronic_condition",
    encounter: "encounter-1",
    dirty: false,
    ...overrides,
  };
}

describe("projectRows — baseline+edits projection", () => {
  it("empty baseline + empty log projects to [] (so an untouched section reads UNANSWERED)", () => {
    assert.deepEqual(projectRows([], []), []);
  });

  it("baseline passes through untouched when the log is empty", () => {
    const baseline = [
      baselineEntry("r1", row("r1", "A")),
      baselineEntry("r2", row("r2", "B")),
    ];

    const result = projectRows(baseline, []);

    assert.deepEqual(result, [
      {
        rowId: "r1",
        row: row("r1", "A"),
        origin: "baseline",
        edited: false,
        softDeleted: false,
      },
      {
        rowId: "r2",
        row: row("r2", "B"),
        origin: "baseline",
        edited: false,
        softDeleted: false,
      },
    ]);
  });

  it("adds are appended after every baseline row, in edit-log order", () => {
    const baseline = [
      baselineEntry("r1", row("r1", "A")),
      baselineEntry("r2", row("r2", "B")),
    ];
    const log: EditLog<TestRow> = [
      add("new-1", row("new-1", "first added")),
      add("new-2", row("new-2", "second added")),
    ];

    const result = projectRows(baseline, log);

    assert.deepEqual(
      result.map((r) => r.rowId),
      ["r1", "r2", "new-1", "new-2"],
    );
    assert.equal(result[2].origin, "added");
    assert.equal(result[2].edited, true);
    assert.equal(result[3].origin, "added");
  });

  it("an update REPLACES its baseline row's content in the baseline's position — not moved to the end", () => {
    const baseline = [
      baselineEntry("r1", row("r1", "A")),
      baselineEntry("r2", row("r2", "B-old")),
      baselineEntry("r3", row("r3", "C")),
    ];
    const patch = row("r2", "B-new");
    const log: EditLog<TestRow> = [update("r2", patch)];

    const result = projectRows(baseline, log);

    assert.deepEqual(
      result.map((r) => r.rowId),
      ["r1", "r2", "r3"],
    );
    assert.deepEqual(result[1], {
      rowId: "r2",
      row: patch,
      origin: "baseline",
      edited: true,
      softDeleted: false,
    });
  });

  it("an update's patch is a full replace, not a field-level merge — a field the patch omits does not leak in from the baseline row", () => {
    interface WideRow {
      id: string;
      a: string;
      b: string;
    }
    const baseline: BaselineRow<WideRow>[] = [
      { rowId: "r1", row: { id: "r1", a: "baseline-a", b: "baseline-b" } },
    ];
    // Under the canonical vocabulary `patch` must always be the complete
    // row; this patch is deliberately missing `b` to prove the
    // implementation doesn't paper over that with baseline's value.
    const patch = { id: "r1", a: "edited-a" } as WideRow;
    const log: EditLog<WideRow> = [{ rowId: "r1", op: "update", patch }];

    const result = projectRows(baseline, log);

    assert.deepEqual(result[0].row, patch);
    assert.equal((result[0].row as WideRow).b, undefined);
  });

  it("a remove hides a baseline row outright (hard removal)", () => {
    const baseline = [
      baselineEntry("r1", row("r1", "A")),
      baselineEntry("r2", row("r2", "B")),
    ];
    const log: EditLog<TestRow> = [remove("r1", row("r1", "A"))];

    const result = projectRows(baseline, log);

    assert.deepEqual(
      result.map((r) => r.rowId),
      ["r2"],
    );
  });

  it("a remove hides a baseline row even when a softDelete descriptor is configured — `remove` always means gone, never greyed out", () => {
    const baseline = [baselineEntry("r1", row("r1", "A"))];
    const log: EditLog<TestRow> = [remove("r1", row("r1", "A"))];
    const softDelete: SoftDeleteDescriptor<TestRow> = {
      patch: {},
      isDeleted: () => false,
    };

    const result = projectRows(baseline, log, { softDelete });

    assert.deepEqual(result, []);
  });

  it("removes a client-only row entirely — nothing renders for a rowId that is neither in baseline nor an add", () => {
    // In production `editLog.ts`'s add+remove coalescing already
    // annihilates this pair before it ever reaches a log (see
    // editLog.test.ts's "ANNIHILATES" case). This exercises projectRows
    // defensively on the same shape of input, on its own.
    const baseline = [baselineEntry("r1", row("r1", "A"))];
    const log: EditLog<TestRow> = [
      remove("ghost", row("ghost", "never existed")),
    ];

    const result = projectRows(baseline, log);

    assert.deepEqual(
      result.map((r) => r.rowId),
      ["r1"],
    );
  });

  it("JUDGMENT CALL: a baseline row that disappeared server-side while a restored update still targets it is dropped from the projection — not shown, not crashed on", () => {
    const baseline = [baselineEntry("other", row("other", "survives"))];
    const log: EditLog<TestRow> = [
      update("vanished-1", row("vanished-1", "stale restored intent")),
    ];

    const result = projectRows(baseline, log);

    assert.deepEqual(
      result.map((r) => r.rowId),
      ["other"],
    );
  });

  it("a soft-deleted server row is shown IN PLACE, greyed — not hidden — because the marker is an ordinary `update`", () => {
    const s1 = makeSymptomRow({ id: "s1", verification_status: "confirmed" });
    const s2 = makeSymptomRow({ id: "s2", verification_status: "confirmed" });
    const baseline: BaselineRow<SymptomRequest>[] = [
      { rowId: "s1", row: s1 },
      { rowId: "s2", row: s2 },
    ];
    const markedPatch: SymptomRequest = {
      ...s1,
      verification_status: "entered_in_error",
    };
    const log: EditLog<SymptomRequest> = [update("s1", markedPatch)];
    const softDelete: SoftDeleteDescriptor<SymptomRequest> = {
      patch: { verification_status: "entered_in_error" },
      isDeleted: (r) => r.verification_status === "entered_in_error",
    };

    const result = projectRows(baseline, log, { softDelete });

    assert.deepEqual(
      result.map((r) => r.rowId),
      ["s1", "s2"],
    );
    assert.equal(result[0].softDeleted, true);
    assert.equal(result[0].row.verification_status, "entered_in_error");
    assert.equal(result[1].softDeleted, false);
  });

  it("an added row whose own patch already carries the soft-delete marker is flagged softDeleted too", () => {
    const patch = makeSymptomRow({
      id: "new-1",
      verification_status: "entered_in_error",
    });
    const log: EditLog<SymptomRequest> = [add("new-1", patch)];
    const softDelete: SoftDeleteDescriptor<SymptomRequest> = {
      patch: { verification_status: "entered_in_error" },
      isDeleted: (r) => r.verification_status === "entered_in_error",
    };

    const result = projectRows([], log, { softDelete });

    assert.equal(result[0].origin, "added");
    assert.equal(result[0].softDeleted, true);
  });

  it("JUDGMENT CALL: an `add` edit colliding with a rowId the baseline already has is treated as that baseline row's update, not duplicated (the singleton-draft-outrun-by-baseline case)", () => {
    const freshRow = row(SINGLETON_ROW_ID, "server-fresh");
    const draftPatch = row(SINGLETON_ROW_ID, "restored-draft-intent");
    const baseline: BaselineRow<TestRow>[] = [
      { rowId: SINGLETON_ROW_ID, row: freshRow },
    ];
    const log: EditLog<TestRow> = [add(SINGLETON_ROW_ID, draftPatch)];

    const result = projectRows(baseline, log);

    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      rowId: SINGLETON_ROW_ID,
      row: draftPatch,
      origin: "baseline",
      edited: true,
      softDeleted: false,
    });
  });

  it("FIX: a malformed log carrying two `add` edits for the same rowId resolves to the LAST one only — loop 2 must agree with loop 1's per-rowId resolution, not double-emit", () => {
    // Reachable only if Task 3's one-edit-per-rowId invariant is broken
    // upstream (`applyEditToLog` never produces this on its own — see
    // `editLog.test.ts`), but a restored draft's per-record
    // `isStructuredEditRecord` gate validates each entry independently
    // and would happily accept both. `projectRows` must not compound that
    // corruption into two rendered rows for one identity.
    const first = row("dup", "first add");
    const second = row("dup", "second add");
    const log: EditLog<TestRow> = [add("dup", first), add("dup", second)];

    const result = projectRows([], log);

    assert.equal(result.length, 1);
    assert.deepEqual(result[0].row, second);
  });

  it("FIX: an `add` superseded by a later `update` for the same rowId in a malformed log resolves via the same last-write map loop 1 uses, in both directions", () => {
    const stale = row("z", "stale add");
    const fresh = row("z", "fresh update");
    const log: EditLog<TestRow> = [add("z", stale), update("z", fresh)];

    // Baseline absent "z" — the last edit for "z" is an `update`, and an
    // `update` against a rowId the baseline doesn't have is the orphan
    // rule (dropped), not a fallback to the stale `add`.
    const withoutBaseline = projectRows([], log);
    assert.deepEqual(
      withoutBaseline.map((r) => r.rowId),
      [],
    );

    // Baseline present "z" — loop 1 resolves via `editByRowId` (last
    // write wins) and shows FRESH; loop 2 must not ALSO emit STALE as a
    // second "added" row for the same rowId.
    const baseline: BaselineRow<TestRow>[] = [
      { rowId: "z", row: row("z", "original baseline") },
    ];
    const withBaseline = projectRows(baseline, log);
    assert.equal(withBaseline.length, 1);
    assert.deepEqual(withBaseline[0].row, fresh);
  });

  it("displayOrder sorts the projection only — the Diagnosis bug: baseline and log order must survive projecting untouched", () => {
    const d1 = makeDiagnosisRow({
      id: "d1",
      onset: { onset_datetime: "2026-03-01" },
    });
    const d2 = makeDiagnosisRow({
      id: "d2",
      onset: { onset_datetime: "2026-01-01" },
    });
    const d3 = makeDiagnosisRow({
      id: "d3",
      onset: { onset_datetime: "2026-02-01" },
    });
    const baseline: BaselineRow<DiagnosisRequest>[] = [
      { rowId: "d1", row: d1 },
      { rowId: "d2", row: d2 },
      { rowId: "d3", row: d3 },
    ];
    // Deliberately NON-EMPTY: an update that moves d3's onset date past
    // d1's, so the sort key the comparator reads comes from the EDITED
    // content (`edit.patch`), not the stale baseline value — an empty log
    // here would prove nothing about the log being left untouched.
    const d3Updated: DiagnosisRequest = {
      ...d3,
      onset: { onset_datetime: "2026-04-01" },
    };
    const log: EditLog<DiagnosisRequest> = [update("d3", d3Updated)];
    const baselineSnapshot = structuredClone(baseline);
    const logSnapshot = structuredClone(log);

    const result = projectRows(baseline, log, {
      displayOrder: (a, b) =>
        (a.onset?.onset_datetime ?? "").localeCompare(
          b.onset?.onset_datetime ?? "",
        ),
    });

    // d2 (01) < d1 (03) < d3-as-edited (04) — d3 moved from the middle to
    // last, proving the sort used the post-edit onset date.
    assert.deepEqual(
      result.map((r) => r.rowId),
      ["d2", "d1", "d3"],
    );
    // The Diagnosis bug this option exists to retire: the SORTED display
    // order must never be what's written back as the canonical order.
    assert.deepEqual(baseline, baselineSnapshot);
    assert.deepEqual(log, logSnapshot);
  });

  it("purity — neither the baseline array/rows nor the log array/edits are mutated (frozen inputs survive)", () => {
    const baseline = Object.freeze([
      Object.freeze(baselineEntry("r1", Object.freeze(row("r1", "A")))),
      Object.freeze(baselineEntry("r2", Object.freeze(row("r2", "B")))),
    ]);
    const log = Object.freeze([
      Object.freeze(update("r2", row("r2", "B-edited"))),
    ]);

    // Would throw synchronously in strict-mode ESM if projectRows tried to
    // mutate a frozen object/array anywhere along the way.
    const result = projectRows(baseline, log, {
      displayOrder: (a, b) => a.label.localeCompare(b.label),
    });

    assert.equal(result.length, 2);
  });

  it("a removed baseline row does not resurrect across a baseline refetch — the edit log, not a cached baseline snapshot, decides visibility", () => {
    const log: EditLog<TestRow> = [remove("r1", row("r1", "A"))];

    const original = [
      baselineEntry("r1", row("r1", "A")),
      baselineEntry("r2", row("r2", "B")),
    ];
    const firstPass = projectRows(original, log);
    assert.deepEqual(
      firstPass.map((r) => r.rowId),
      ["r2"],
    );

    // A "refetch": a brand-new baseline array/objects carrying the SAME
    // server content (the server hasn't actually applied the pending
    // removal yet — that lives only in the client edit log until
    // submitted), projected again against the same still-pending log.
    const refetched = [
      baselineEntry("r1", row("r1", "A")),
      baselineEntry("r2", row("r2", "B")),
    ];
    const secondPass = projectRows(refetched, log);
    assert.deepEqual(
      secondPass.map((r) => r.rowId),
      ["r2"],
    );
  });
});
