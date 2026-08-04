import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { projectRows } from "./projectRows";
import {
  decideInitialEditsSeed,
  mergePatch,
  resolveRemoveIntent,
  resolveSetRow,
} from "./rowMutations";
import type {
  EditLog,
  ProjectedRow,
  RowEdit,
  SoftDeleteDescriptor,
} from "./types";

interface TestRow {
  id: string;
  note: string;
  status?: string;
}

function projected(
  rowId: string,
  row: TestRow,
  overrides: Partial<ProjectedRow<TestRow>> = {},
): ProjectedRow<TestRow> {
  return {
    rowId,
    row,
    origin: "baseline",
    edited: false,
    softDeleted: false,
    ...overrides,
  };
}

function update(rowId: string, patch: TestRow): RowEdit<TestRow> {
  return { rowId, op: "update", patch };
}

describe("mergePatch", () => {
  it("with no normalizePatch, merges the patch directly onto the current row", () => {
    const current: TestRow = { id: "r1", note: "old" };
    const result = mergePatch(current, { note: "new" });
    assert.deepEqual(result, { id: "r1", note: "new" });
  });

  it("with normalizePatch, uses ITS return value, not the incoming patch, as the merge source", () => {
    const current: TestRow = { id: "r1", note: "old", status: "active" };
    const normalizePatch = (row: TestRow, patch: Partial<TestRow>) => ({
      ...patch,
      status: row.status === "active" ? "derived-active" : "derived-other",
    });
    const result = mergePatch(current, { note: "new" }, normalizePatch);
    assert.deepEqual(result, {
      id: "r1",
      note: "new",
      status: "derived-active",
    });
  });

  it("CONTRACT PIN: a normalizePatch that returns ONLY its derived fields (omitting the incoming patch) silently drops the clinician's edit", () => {
    const current: TestRow = { id: "r1", note: "old", status: "active" };
    // Badly-behaved: forgets to spread `patch` in, returns only the
    // derived field. Documents the exact failure mode the option's doc
    // comment warns about — not asserting this is desirable, pinning that
    // it is real.
    const badNormalizePatch = () => ({ status: "derived" });
    const result = mergePatch(
      current,
      { note: "clinician typed this" },
      badNormalizePatch,
    );
    assert.deepEqual(result, { id: "r1", note: "old", status: "derived" });
    assert.notEqual(result.note, "clinician typed this");
  });
});

describe("resolveRemoveIntent — annex §7's three-outcome dispatch", () => {
  it("a baseline row with softDelete configured becomes an ordinary update carrying the merged marker", () => {
    const softDelete: SoftDeleteDescriptor<TestRow> = {
      patch: { status: "entered_in_error" },
      isDeleted: (r) => r.status === "entered_in_error",
    };
    const entry = projected(
      "r1",
      { id: "r1", note: "x" },
      { origin: "baseline" },
    );

    const result = resolveRemoveIntent(entry, softDelete);

    assert.deepEqual(result, {
      rowId: "r1",
      op: "update",
      patch: { id: "r1", note: "x", status: "entered_in_error" },
    });
  });

  it("a baseline row with NO softDelete configured becomes a hard remove carrying the row's last-known content", () => {
    const entry = projected(
      "r1",
      { id: "r1", note: "x" },
      { origin: "baseline" },
    );

    const result = resolveRemoveIntent(entry, undefined);

    assert.deepEqual(result, {
      rowId: "r1",
      op: "remove",
      patch: { id: "r1", note: "x" },
    });
  });

  it("an ADDED row becomes a hard remove even when softDelete IS configured — the row never reached the server, nothing to mark", () => {
    const softDelete: SoftDeleteDescriptor<TestRow> = {
      patch: { status: "entered_in_error" },
      isDeleted: (r) => r.status === "entered_in_error",
    };
    const entry = projected(
      "local-1",
      { id: "local-1", note: "x" },
      {
        origin: "added",
      },
    );

    const result = resolveRemoveIntent(entry, softDelete);

    assert.deepEqual(result, {
      rowId: "local-1",
      op: "remove",
      patch: { id: "local-1", note: "x" },
    });
  });

  it("LOADING WINDOW: a presumed row from projectRows' step 3 (baseline===undefined) carries origin:'baseline', so removeRow on it soft-deletes rather than hard-removes — a deliberate divergence from the annex, pinned end-to-end", () => {
    const softDelete: SoftDeleteDescriptor<TestRow> = {
      patch: { status: "entered_in_error" },
      isDeleted: (r) => r.status === "entered_in_error",
    };
    const log: EditLog<TestRow> = [
      update("server-1", { id: "server-1", note: "restored update" }),
    ];

    // baseline is undefined — the query hasn't resolved yet — so this row
    // is `projectRows`' step-3 "presumed" render, not a genuine fetched
    // baseline row.
    const rows = projectRows(undefined, log);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].origin, "baseline");

    const result = resolveRemoveIntent(rows[0], softDelete);

    assert.deepEqual(result, {
      rowId: "server-1",
      op: "update",
      patch: {
        id: "server-1",
        note: "restored update",
        status: "entered_in_error",
      },
    });
  });
});

describe("resolveSetRow — annex §9's three-route dispatch", () => {
  it("a current row present ⇒ an ordinary update against ITS rowId", () => {
    const result = resolveSetRow<TestRow>({
      currentRow: { id: "singleton", note: "old" },
      currentRowId: "singleton",
      patch: { note: "new" },
      createSeed: undefined,
      singletonRowId: "singleton",
      questionId: "q1",
    });

    assert.deepEqual(result, {
      rowId: "singleton",
      op: "update",
      patch: { id: "singleton", note: "new" },
    });
  });

  it("a current row present, with normalizePatch configured, runs it before merging", () => {
    const result = resolveSetRow<TestRow>({
      currentRow: { id: "singleton", note: "old", status: "active" },
      currentRowId: "singleton",
      patch: { note: "new" },
      createSeed: undefined,
      singletonRowId: "singleton",
      normalizePatch: (row, patch) => ({
        ...patch,
        status: `derived-${row.status}`,
      }),
      questionId: "q1",
    });

    assert.deepEqual(result, {
      rowId: "singleton",
      op: "update",
      patch: { id: "singleton", note: "new", status: "derived-active" },
    });
  });

  it("no current row, createSeed configured ⇒ an add seeded with createSeed() merged with the patch", () => {
    const result = resolveSetRow<TestRow>({
      currentRow: undefined,
      currentRowId: undefined,
      patch: { note: "first note" },
      createSeed: () => ({ id: "singleton", note: "" }),
      singletonRowId: "singleton",
      questionId: "q1",
    });

    assert.deepEqual(result, {
      rowId: "singleton",
      op: "add",
      patch: { id: "singleton", note: "first note" },
    });
  });

  it("no current row, no createSeed ⇒ throws, naming the question", () => {
    assert.throws(
      () =>
        resolveSetRow<TestRow>({
          currentRow: undefined,
          currentRowId: undefined,
          patch: { note: "x" },
          createSeed: undefined,
          singletonRowId: "singleton",
          questionId: "q-appointment",
        }),
      /q-appointment.*createSeed/,
    );
  });
});

describe("decideInitialEditsSeed — the one-shot latch's decision, fixed post-3b41fe4fd", () => {
  it("edits already has content ⇒ skip, regardless of initialEdits — a restored draft always wins", () => {
    const edits: EditLog<TestRow> = [update("r1", { id: "r1", note: "x" })];
    assert.equal(decideInitialEditsSeed(edits, undefined), "skip");
    assert.equal(
      decideInitialEditsSeed(edits, [update("r2", { id: "r2", note: "y" })]),
      "skip",
    );
  });

  it("edits empty, initialEdits not yet available ⇒ wait — must NOT latch (the bug: the old code latched here forever)", () => {
    assert.equal(decideInitialEditsSeed([], undefined), "wait");
    assert.equal(decideInitialEditsSeed([], []), "wait");
  });

  it("edits empty, initialEdits has content ⇒ seed", () => {
    const initialEdits: EditLog<TestRow> = [
      update("encounter-1", { id: "encounter-1", note: "discharged" }),
    ];
    assert.equal(decideInitialEditsSeed([], initialEdits), "seed");
  });

  it("REGRESSION shape: initialEdits arrives on a LATER render than the first (the encounter ?toDischarge case) — must still 'seed' once it does, having correctly 'wait'-ed before", () => {
    // First render: baseline hasn't loaded, caller cannot construct the
    // full-row patch yet, so initialEdits is undefined.
    const firstRender = decideInitialEditsSeed([], undefined);
    assert.equal(firstRender, "wait");

    // A later render: baseline resolved, the caller now supplies the real
    // initialEdits. Nothing else changed `edits` in between.
    const laterRender = decideInitialEditsSeed(
      [],
      [update("encounter-1", { id: "encounter-1", note: "discharged" })],
    );
    assert.equal(laterRender, "seed");
  });
});
