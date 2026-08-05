import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { StructuredEditRecord } from "@/types/questionnaire/structured";

import { resolveRowAddressing } from "./rowAddressing";

describe("resolveRowAddressing — the rows an assistant edit may name", () => {
  it("recovers a server row's id from the projection content", () => {
    // Every upsert type keys its baseline row by the server id and echoes
    // that id in the row (`toBaselineRows` + `toMedicationRow`), so the
    // projection alone proves the row exists.
    const addressing = resolveRowAddressing({
      type: "medication_request",
      projection: [{ id: "med-1" }, { id: "med-2" }],
      pendingEdits: [],
      encounterId: undefined,
    });
    assert.deepEqual(addressing.rowIds, ["med-1", "med-2"]);
    assert.equal(addressing.requiredRowId, undefined);
    assert.equal(addressing.ops, undefined);
  });

  it("carries pending edit rowIds alongside, deduplicated", () => {
    const pendingEdits: StructuredEditRecord[] = [
      { rowId: "allergy-1", op: "update", patch: { id: "allergy-1" } },
      { rowId: "fresh-uuid", op: "add", patch: { code: { code: "x" } } },
    ];
    const addressing = resolveRowAddressing({
      type: "allergy_intolerance",
      projection: [{ id: "allergy-1" }],
      pendingEdits,
      encounterId: undefined,
    });
    assert.deepEqual(addressing.rowIds, ["allergy-1", "fresh-uuid"]);
  });

  it("ignores rows with no server id — a row added this session has none", () => {
    const addressing = resolveRowAddressing({
      type: "symptom",
      projection: [{ code: { code: "x" } }, null, "not a row", { id: "" }],
      pendingEdits: [],
      encounterId: undefined,
    });
    assert.deepEqual(addressing.rowIds, []);
  });

  it("ignores a non-string id rather than stringifying it", () => {
    const addressing = resolveRowAddressing({
      type: "acme.assessment",
      projection: [{ id: 7 }],
      pendingEdits: [],
      encounterId: undefined,
    });
    assert.deepEqual(addressing.rowIds, []);
  });

  it("does not let an id a row was ADDED with pass for a server row", () => {
    // The projection is not purely baseline-derived: `projectRows` renders
    // an add's patch verbatim, and every upsert row schema declares `id`
    // as optional — so an id that arrived on an add patch would otherwise
    // become addressable, and the follow-up update an orphan the prune
    // excises behind a "rows were dropped" notice.
    const addressing = resolveRowAddressing({
      type: "medication_request",
      projection: [{ id: "ghost" }, { id: "med-1" }],
      pendingEdits: [{ rowId: "uuid-A", op: "add", patch: { id: "ghost" } }],
      encounterId: undefined,
    });
    assert.deepEqual(addressing.rowIds, ["med-1", "uuid-A"]);
  });

  it("keeps a baseline row addressable when an add reuses its rowId", () => {
    // The excluded id comes back through the pending edit's own rowId, so
    // the subtraction above can never cost a real server row its identity.
    const addressing = resolveRowAddressing({
      type: "medication_request",
      projection: [{ id: "med-1" }],
      pendingEdits: [{ rowId: "med-1", op: "add", patch: { id: "med-1" } }],
      encounterId: undefined,
    });
    assert.deepEqual(addressing.rowIds, ["med-1"]);
  });

  describe("encounter — one row, keyed by the encounter id", () => {
    it("addresses the encounter id and refuses any other rowId", () => {
      const addressing = resolveRowAddressing({
        type: "encounter",
        projection: [{ status: "in_progress" }],
        pendingEdits: [],
        encounterId: "enc-1",
      });
      assert.deepEqual(addressing.rowIds, ["enc-1"]);
      assert.equal(addressing.requiredRowId, "enc-1");
    });

    it("compiles no remove — its toRequests never reads the removes set", () => {
      const addressing = resolveRowAddressing({
        type: "encounter",
        projection: [{ status: "in_progress" }],
        pendingEdits: [],
        encounterId: "enc-1",
      });
      assert.deepEqual(addressing.ops, ["add", "update"]);
    });

    it("stays addressable before the baseline has loaded — the row exists regardless", () => {
      const addressing = resolveRowAddressing({
        type: "encounter",
        projection: [],
        pendingEdits: [],
        encounterId: "enc-1",
      });
      assert.deepEqual(addressing.rowIds, ["enc-1"]);
    });

    it("compiles nothing at all without an encounter id, rather than falling back to the row content", () => {
      const addressing = resolveRowAddressing({
        type: "encounter",
        projection: [{ id: "not-the-row-key" }],
        pendingEdits: [{ rowId: "stale", op: "update", patch: {} }],
        encounterId: undefined,
      });
      assert.deepEqual(addressing.rowIds, []);
      assert.deepEqual(addressing.ops, []);
      assert.equal(addressing.requiredRowId, undefined);
    });
  });
});
