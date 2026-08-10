import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DiagnosisRequest } from "@/types/emr/diagnosis/diagnosis";
import type { SymptomRequest } from "@/types/emr/symptom/symptom";

import { findOrphanRowIds, projectRows, pruneOrphanEdits } from "./projectRows";
import { SINGLETON_ROW_ID } from "./rowIds";
import {
  add,
  baselineEntry,
  makeDiagnosisRow,
  makeSymptomRow,
  remove,
  update,
} from "./testFixtures";
import type { BaselineRow, EditLog, SoftDeleteDescriptor } from "./types";

/**
 * A small, deliberately generic row shape for the structural cases
 * (position, hiding, collision, purity) — contrast `testFixtures.ts`'s
 * Symptom/Diagnosis builders, used where the edge case is shape-sensitive
 * (the soft-delete marker field, the Diagnosis onset-sort bug).
 */
interface TestRow {
  id: string;
  label: string;
}

function row(id: string, label: string): TestRow {
  return { id, label };
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

  it("BASELINE COMPLETENESS CONTRACT: baseline===undefined (loading/errored) renders a restored `update` instead of silently hiding it", () => {
    // A restored draft log `[update("server-1"), add("local-1")]`
    // projected against `[]` (the WRONG "server confirmed zero rows"
    // signal) renders only "local-1". Projected against `undefined` (the
    // CORRECT "not yet known" signal), both must render.
    const log: EditLog<TestRow> = [
      update("server-1", row("server-1", "restored update")),
      add("local-1", row("local-1", "restored add")),
    ];

    // Order: step 2 (adds) always runs before step 3 (undefined-baseline
    // presumed rows), so "local-1" (the add) precedes "server-1" (the
    // presumed update) here — the load-bearing fact is that BOTH appear,
    // not their relative order.
    const withUndefinedBaseline = projectRows(undefined, log);
    assert.deepEqual([...withUndefinedBaseline.map((r) => r.rowId)].sort(), [
      "local-1",
      "server-1",
    ]);
    const serverRow = withUndefinedBaseline.find((r) => r.rowId === "server-1");
    assert.equal(serverRow?.origin, "baseline");
    assert.equal(serverRow?.edited, true);

    // Contrast: the WRONG signal ([]) reproduces the hazard — only the add
    // survives, exactly the bug this test guards against regressing.
    const withEmptyBaseline = projectRows([], log);
    assert.deepEqual(
      withEmptyBaseline.map((r) => r.rowId),
      ["local-1"],
    );
  });

  it("baseline===undefined: a pending `remove` has nothing to render (no content to show for deleting an unknown row)", () => {
    const log: EditLog<TestRow> = [remove("ghost", row("ghost", "gone"))];

    const result = projectRows(undefined, log);

    assert.deepEqual(result, []);
  });

  it("baseline===undefined: an `add` is unaffected — already handled by step 2 regardless of baseline state", () => {
    const log: EditLog<TestRow> = [add("new-1", row("new-1", "brand new"))];

    const result = projectRows(undefined, log);

    assert.equal(result.length, 1);
    assert.equal(result[0].origin, "added");
  });

  it("baseline===undefined: displayOrder still sorts the presumed rows (step 3) alongside adds", () => {
    const log: EditLog<TestRow> = [
      update("b", row("b", "B")),
      add("a", row("a", "A")),
    ];

    const result = projectRows(undefined, log, {
      displayOrder: (x, y) => x.label.localeCompare(y.label),
    });

    assert.deepEqual(
      result.map((r) => r.rowId),
      ["a", "b"],
    );
  });

  it("findOrphanRowIds: undefined baseline is conservative — never reports an orphan while the baseline query is loading/errored", () => {
    const log: EditLog<TestRow> = [
      update("server-1", row("server-1", "x")),
      remove("server-2", row("server-2", "y")),
      add("local-1", row("local-1", "z")),
    ];

    assert.deepEqual(findOrphanRowIds(undefined, log), []);
  });

  it("findOrphanRowIds: an `update`/`remove` whose rowId the (complete) baseline lacks is an orphan; an `add` never is", () => {
    const baseline: BaselineRow<TestRow>[] = [
      { rowId: "survives", row: row("survives", "still here") },
    ];
    const log: EditLog<TestRow> = [
      update("vanished-update", row("vanished-update", "stale intent")),
      remove("vanished-remove", row("vanished-remove", "stale intent")),
      add("brand-new", row("brand-new", "genuinely new")),
      update("survives", row("survives", "edited")),
    ];

    const orphans = findOrphanRowIds(baseline, log);

    assert.deepEqual([...orphans].sort(), [
      "vanished-remove",
      "vanished-update",
    ]);
  });

  it("findOrphanRowIds: does NOT flag the clinician's own removal of a row the baseline still has — the naive `!renderedIds.has` derivation would", () => {
    // The subtle case: a `remove` against a rowId baseline DOES have is
    // not shown by projectRows (hard removal), but it is not an orphan
    // either — the row didn't vanish server-side, the clinician removed
    // it.
    const baseline: BaselineRow<TestRow>[] = [
      { rowId: "r1", row: row("r1", "server value") },
    ];
    const log: EditLog<TestRow> = [remove("r1", row("r1", "server value"))];

    assert.deepEqual(findOrphanRowIds(baseline, log), []);
  });

  it("findOrphanRowIds: an empty (but KNOWN) baseline still reports orphans — only `undefined` suppresses the check", () => {
    const log: EditLog<TestRow> = [
      update("gone", row("gone", "restored intent")),
    ];

    assert.deepEqual(findOrphanRowIds([], log), ["gone"]);
  });

  it("findOrphanRowIds: purity — neither baseline nor log is mutated", () => {
    const baseline = Object.freeze([
      Object.freeze(baselineEntry("r1", Object.freeze(row("r1", "A")))),
    ]);
    const log = Object.freeze([
      Object.freeze(update("vanished", row("vanished", "x"))),
    ]);

    const result = findOrphanRowIds(baseline, log);

    assert.deepEqual(result, ["vanished"]);
  });

  describe("pruneOrphanEdits — a confirmed orphan must never survive into what commit() persists as `edits`", () => {
    it("drops exactly the rowIds findOrphanRowIds names, keeping everything else (adds, live updates, the clinician's own remove) untouched", () => {
      const baseline: BaselineRow<TestRow>[] = [
        { rowId: "survives", row: row("survives", "still here") },
      ];
      // "survives" appears once, as a `remove` — the shape a real, deduped
      // log (`applyEditToLog`'s one-entry-per-rowId invariant) would
      // already have resolved it to had the clinician updated then removed
      // it in the same session, written pre-resolved here rather than
      // relying on `pruneOrphanEdits` to do that resolution itself
      // (`findOrphanRowIds` already does, via its own last-write-wins map —
      // this test only needs to prove PRUNING, not resolution).
      const deduped: EditLog<TestRow> = [
        update("vanished-update", row("vanished-update", "stale intent")),
        remove("vanished-remove", row("vanished-remove", "stale intent")),
        add("brand-new", row("brand-new", "genuinely new")),
        remove("survives", row("survives", "edited")),
      ];

      const result = pruneOrphanEdits(baseline, deduped);

      assert.deepEqual(
        result.map((e) => e.rowId),
        ["brand-new", "survives"],
      );
    });

    it("baseline===undefined: never prunes — unresolved is not confirmed-gone, matching findOrphanRowIds's own conservatism", () => {
      const log: EditLog<TestRow> = [
        update("server-1", row("server-1", "restored update")),
        remove("server-2", row("server-2", "restored remove")),
        add("local-1", row("local-1", "restored add")),
      ];

      const result = pruneOrphanEdits(undefined, log);

      assert.equal(result, log); // same reference — nothing to drop
    });

    it("no orphans: returns the SAME log reference, so a caller can skip a write when the result is unchanged", () => {
      const baseline: BaselineRow<TestRow>[] = [
        { rowId: "r1", row: row("r1", "A") },
      ];
      const log: EditLog<TestRow> = [update("r1", row("r1", "A-edited"))];

      assert.equal(pruneOrphanEdits(baseline, log), log);
    });

    it("an `add` is never pruned, even though its rowId is (by definition) absent from baseline", () => {
      const log: EditLog<TestRow> = [add("new-1", row("new-1", "brand new"))];

      const result = pruneOrphanEdits([], log);

      assert.deepEqual(
        result.map((e) => e.rowId),
        ["new-1"],
      );
    });

    it("purity — neither baseline nor log is mutated", () => {
      const baseline = Object.freeze([
        Object.freeze(
          baselineEntry("survives", Object.freeze(row("survives", "x"))),
        ),
      ]);
      const log = Object.freeze([
        Object.freeze(update("vanished", row("vanished", "stale"))),
        Object.freeze(update("survives", row("survives", "edited"))),
      ]);
      // `Object.freeze` would make a mutation attempt throw synchronously
      // (strict-mode ESM), but that alone only proves "didn't throw" — not
      // "didn't change". Snapshot BEFORE the call and assert equality
      // AFTER, the same pattern `projectRows`' own "Diagnosis bug" purity
      // case above uses, so this test has a real, asserted claim rather
      // than an implicit one resting on the frozen inputs alone.
      const baselineSnapshot = structuredClone(baseline);
      const logSnapshot = structuredClone(log);

      const result = pruneOrphanEdits(baseline, log);

      assert.deepEqual(
        result.map((e) => e.rowId),
        ["survives"],
      );
      assert.deepEqual(baseline, baselineSnapshot);
      assert.deepEqual(log, logSnapshot);
    });

    it("a restored draft's `update` for a rowId the NOW-resolved baseline confirms gone, with no other action taken, must not survive to what would reach toRequests", () => {
      // Mirrors what useStructuredRows.commit() will do: baseline arrives
      // (a known, empty array — the server confirms zero rows), pruning
      // must remove the stale intent entirely so `structuredEditsOf`
      // (fill/submit/composeStructured.ts) never sees it.
      const restoredLog: EditLog<TestRow> = [
        update(
          "deleted-server-side",
          row("deleted-server-side", "edited pre-vanish"),
        ),
      ];

      const pruned = pruneOrphanEdits([], restoredLog);

      assert.deepEqual(pruned, []);
      assert.deepEqual(findOrphanRowIds([], pruned), []); // nothing left to name as orphan either
    });
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
