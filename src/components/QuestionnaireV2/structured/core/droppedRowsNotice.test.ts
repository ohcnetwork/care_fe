import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EditLog } from "./types";

import { droppedRowLabels } from "./droppedRowsNotice";

interface FixtureRow {
  name: string;
}

describe("droppedRowLabels", () => {
  it("labels each dropped edit using the caller's rowLabel", () => {
    const droppedEdits: EditLog<FixtureRow> = [
      { rowId: "row-a", op: "update", patch: { name: "Paracetamol" } },
      { rowId: "row-b", op: "add", patch: { name: "Ibuprofen" } },
    ];
    assert.deepEqual(
      droppedRowLabels(droppedEdits, (row) => row.name),
      [
        { rowId: "row-a", label: "Paracetamol" },
        { rowId: "row-b", label: "Ibuprofen" },
      ],
    );
  });

  it("preserves order — the order the prune effect encountered them", () => {
    const droppedEdits: EditLog<FixtureRow> = [
      { rowId: "row-c", op: "remove", patch: { name: "Third" } },
      { rowId: "row-a", op: "update", patch: { name: "First" } },
      { rowId: "row-b", op: "add", patch: { name: "Second" } },
    ];
    assert.deepEqual(
      droppedRowLabels(droppedEdits, (row) => row.name).map((e) => e.label),
      ["Third", "First", "Second"],
    );
  });

  it("a remove op's patch is still fully labeled — patch is always complete, per every op", () => {
    const droppedEdits: EditLog<FixtureRow> = [
      { rowId: "row-a", op: "remove", patch: { name: "Removed medication" } },
    ];
    assert.deepEqual(
      droppedRowLabels(droppedEdits, (row) => row.name),
      [{ rowId: "row-a", label: "Removed medication" }],
    );
  });

  it("falls back to the rowId when rowLabel returns a blank string", () => {
    const droppedEdits: EditLog<FixtureRow> = [
      { rowId: "row-a", op: "update", patch: { name: "" } },
      { rowId: "row-b", op: "update", patch: { name: "   " } },
    ];
    assert.deepEqual(
      droppedRowLabels(droppedEdits, (row) => row.name),
      [
        { rowId: "row-a", label: "row-a" },
        { rowId: "row-b", label: "row-b" },
      ],
    );
  });

  it("an empty droppedEdits log produces an empty list", () => {
    assert.deepEqual(
      droppedRowLabels([], (row: FixtureRow) => row.name),
      [],
    );
  });
});
