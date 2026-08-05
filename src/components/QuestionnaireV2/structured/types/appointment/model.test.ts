import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyEditToLog } from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import { SINGLETON_ROW_ID } from "@/components/QuestionnaireV2/structured/core/rowIds";
import { resolveSetRow } from "@/components/QuestionnaireV2/structured/core/rowMutations";
import type {
  BaselineRow,
  EditLog,
} from "@/components/QuestionnaireV2/structured/core/types";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import { sanitizeStructuredEditLog } from "@/types/questionnaire/structured";

import type { AppointmentRow } from "./model";
import {
  createSeed,
  isEmptyRow,
  needsSlot,
  projectValues,
  rowSchema,
  toRequests,
} from "./model";

const CTX = {
  patientId: "pat-1",
  facilityId: "fac-1",
  questionId: "q-1",
} as const;

const row = (over: Partial<AppointmentRow> = {}): AppointmentRow => ({
  note: "",
  slot_id: "",
  tags: [],
  ...over,
});

const add = (
  over: Partial<AppointmentRow> = {},
): StructuredEdit<AppointmentRow> => ({
  rowId: SINGLETON_ROW_ID,
  op: "add",
  patch: row(over),
});

/**
 * Drives the REAL reducer seam (`resolveSetRow` + `applyEditToLog`) through
 * a sequence of `setRow(patch)` calls, the way `useStructuredRows`'s own
 * `setRow` callback does (`useStructuredRows.ts:583-609`) — not a
 * hand-built `StructuredEdit` literal. `baseline: []`/`new Map()` matches
 * what Task 4 wires for this type (`useStructuredRows.ts`'s own doc comment
 * on `StructuredRowsOptions.baseline` names `appointment` explicitly as a
 * type whose baseline is always `[]`, never `undefined`).
 *
 * READS THE CURRENT ROW THROUGH THE REAL `projectRows` (review finding),
 * not `log[0]` directly: the hook's own `setRow` callback consults
 * `rows[0]` (`rows = projectRows(baseline, edits, projectOpts)` —
 * `useStructuredRows.ts:341-344,586`), not the raw edit log. Equivalent to
 * indexing `log[0]` for every sequence this helper actually drives (a
 * well-formed, single-rowId log has its one entry at both positions), but
 * would diverge on a corrupted or orphan-leading log — exactly the
 * territory the rest of this file cares about — so this reads through the
 * same function the hook does, not a shortcut that happens to match today.
 */
function simulateSetRowSequence(
  patches: readonly Partial<AppointmentRow>[],
): EditLog<AppointmentRow> {
  let log: EditLog<AppointmentRow> = [];
  const baselineArray: readonly BaselineRow<AppointmentRow>[] = [];
  const baselineMap = new Map<string, AppointmentRow>();
  for (const patch of patches) {
    const current = projectRows(baselineArray, log, {})[0];
    const edit = resolveSetRow<AppointmentRow>({
      currentRow: current?.row,
      currentRowId: current?.rowId,
      patch,
      createSeed,
      singletonRowId: SINGLETON_ROW_ID,
      questionId: CTX.questionId,
    });
    log = applyEditToLog(log, edit, { baseline: baselineMap, isEmptyRow });
  }
  return log;
}

describe("appointment model", () => {
  describe("projectValues", () => {
    it("projects an empty row set to NO values, so an emptied section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects one row as a single appointment entry", () => {
      const filled = row({
        note: "follow-up",
        slot_id: "slot-9",
        tags: ["t1"],
      });
      assert.deepEqual(projectValues([filled]), [
        { type: "appointment", value: [filled] },
      ]);
    });

    it("projects a note-only row (no slot) so the clinician can see what they typed", () => {
      // The projection half of the three-way reconciliation: a note with
      // no slot is real content, not corruption — it must stay visible
      // even though `toRequests` will submit nothing for it and
      // `needsSlot` will flag it.
      const partial = row({ note: "follow-up" });
      assert.deepEqual(projectValues([partial]), [
        { type: "appointment", value: [partial] },
      ]);
    });

    it("does NOT project a wholly blank row, even though the array itself is non-empty", () => {
      // REGRESSION PIN for the defect class Task 2 shipped and is fixing
      // for time_of_death: a row with content is never annihilated by the
      // live reducer (editLog.ts's isEmptyRow wiring), but a restored or
      // hand-edited draft can still carry one (isStructuredEditRecord
      // validates only rowId/op, never patch content). Projecting it
      // as-is would make entryHasContent (form/engine/store.ts:372-376)
      // read the section as ANSWERED while toRequests submits nothing —
      // the exact silent-drop shape this whole phase exists to eliminate.
      assert.deepEqual(projectValues([row()]), []);
    });

    it("does NOT project a row whose only content is a garbage slot_id string", () => {
      // hasValidSlot rejects "undefined"/"null" literals (finding #3); a
      // row that is otherwise blank except for one of these strings is
      // still, honestly, nothing the clinician typed.
      assert.deepEqual(projectValues([row({ slot_id: "undefined" })]), []);
    });

    it("collapses a corrupted multi-row projection to the first row only", () => {
      // A singleton has exactly one identity in the ordinary case
      // (SINGLETON_ROW_ID). A restored draft with a second, bogus rowId
      // could make `rows` (already resolved by core's projectRows) carry
      // more than one entry; `SingleRowController.row`
      // (useStructuredRows.ts:616) only ever shows `rows[0]` to the
      // editor, so the projection must show exactly that row too, not
      // fold every entry into the array.
      const first = row({ note: "first", slot_id: "slot-9" });
      const second = row({ note: "second", slot_id: "slot-x" });
      assert.deepEqual(projectValues([first, second]), [
        { type: "appointment", value: [first] },
      ]);
    });
  });

  describe("createSeed / isEmptyRow", () => {
    it("seeds an empty row, and recognises it as empty", () => {
      assert.equal(isEmptyRow(createSeed()), true);
    });

    it("recognises a note-only row as non-empty", () => {
      assert.equal(isEmptyRow(row({ note: "reason for visit" })), false);
    });

    it("recognises a slot-only row as non-empty", () => {
      assert.equal(isEmptyRow(row({ slot_id: "slot-9" })), false);
    });

    it("recognises a tags-only row as non-empty", () => {
      assert.equal(isEmptyRow(row({ tags: ["t1"] })), false);
    });

    it("treats a whitespace-only note as empty (clear-to-empty behavior)", () => {
      // Reproduces AppointmentQuestion.tsx:144-153: clearing every field
      // (a note of just spaces counts as cleared) annihilates the row
      // rather than leaving an empty-but-present row that keeps the
      // section dirty forever.
      assert.equal(isEmptyRow(row({ note: "   " })), true);
    });

    it("treats a garbage 'undefined' slot_id string as NOT a slot, so an otherwise-blank row is still empty", () => {
      // Shares hasValidSlot with toRequests/needsSlot (finding #3) —
      // isEmptyRow must not be fooled by the same stringified-missing-id
      // bug either.
      assert.equal(isEmptyRow(row({ slot_id: "undefined" })), true);
    });
  });

  describe("toRequests", () => {
    it("P1-14: an empty edit log produces ZERO requests", async () => {
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("compiles ONE POST for a complete appointment", async () => {
      const filled = add({
        note: "follow-up",
        slot_id: "slot-9",
        tags: ["t1", "t2"],
      });
      assert.deepEqual(await toRequests([filled], CTX), [
        {
          url: "/api/v1/facility/fac-1/slots/slot-9/create_appointment/",
          method: "POST",
          body: { note: "follow-up", patient: "pat-1", tags: ["t1", "t2"] },
          reference_id: "structured:appointment:q-1",
        },
      ]);
    });

    it("P1-16: a reason typed but NO slot picked produces ZERO requests", async () => {
      // Today `definitions/appointment.tsx:47` would interpolate
      // `undefined` into `/slots/undefined/create_appointment/`; that 404s
      // and the atomic batch rolls back every other answer in the submit.
      const partial = add({ note: "follow-up", slot_id: "" });
      assert.deepEqual(await toRequests([partial], CTX), []);
    });

    it("P1-16: tags picked but no slot produces ZERO requests", async () => {
      const partial = add({ tags: ["t1"], slot_id: "" });
      assert.deepEqual(await toRequests([partial], CTX), []);
    });

    it("a slot_id of the literal string 'undefined' produces ZERO requests, not a request to /slots/undefined/", async () => {
      // Review finding #3, reproduced directly: a caller that stringifies
      // a missing id (`String(slot?.id)`) hands us a truthy, non-blank
      // string that is still not an address.
      const stringified = add({ note: "follow-up", slot_id: "undefined" });
      assert.deepEqual(await toRequests([stringified], CTX), []);
    });

    it("a whitespace-only slot_id produces ZERO requests", async () => {
      const whitespace = add({ note: "follow-up", slot_id: "   " });
      assert.deepEqual(await toRequests([whitespace], CTX), []);
    });

    it("trims a slot_id with incidental whitespace before composing the URL", async () => {
      const padded = add({ note: "follow-up", slot_id: "  slot-9  " });
      const requests = await toRequests([padded], CTX);
      assert.equal(
        requests[0]?.url,
        "/api/v1/facility/fac-1/slots/slot-9/create_appointment/",
      );
    });

    it("PROJECTION AND SUBMIT AGREE: a note-only row PROJECTS (visible) but does NOT submit (no slot) — needsSlot is what tells the clinician why", async () => {
      // Rewritten per review finding #5: the original version of this
      // test handed the SAME row object to both projectValues and
      // toRequests, which cannot fail for any implementation that reads
      // `patch` at all — it never exercised the direction that actually
      // breaks. This one does: content that is visibly answered but
      // silently unsubmittable is exactly the P1-16 shape, and the third
      // leg (needsSlot) is what keeps it from being a SILENT drop.
      const partial = row({ note: "follow-up", tags: ["t1"] });
      const edits = [add({ note: "follow-up", tags: ["t1"] })];

      assert.deepEqual(projectValues([partial]), [
        { type: "appointment", value: [partial] },
      ]);
      assert.deepEqual(await toRequests(edits, CTX), []);
      assert.equal(needsSlot([partial], edits, false), true);
    });

    it("ignores a stray remove op instead of erroring — there is no delete endpoint and no baseline row to remove", async () => {
      // A same-session add-then-clear is already annihilated by the
      // reducer before it reaches here; a standalone `remove` surviving
      // in a restored draft (changes.ts's documented `appendFresh`
      // counter-sequence) is an orphan against appointment's permanently
      // empty baseline — resolveSingletonRow's explicit `baseline: new
      // Map()` drops it the same way projectRows would.
      const stray: StructuredEdit<AppointmentRow> = {
        rowId: SINGLETON_ROW_ID,
        op: "remove",
        patch: row({ note: "was here", slot_id: "slot-9" }),
      };
      assert.deepEqual(await toRequests([stray], CTX), []);
    });

    it("a corrupted draft recording the singleton as 'update' (never a legitimate op for a create-only type) is an orphan — ZERO requests, matching what the projection would also show", async () => {
      // A well-formed log never produces this (resolveSetRow's very first
      // call always returns "add"; every later call coalesces onto that
      // SAME entry and editLog.ts never reclassifies it away from "add"
      // without a baseline that already has the rowId — appointment's
      // baseline never does). Reachable only via the raw `applyEdit` seam
      // or a hand-edited draft. Because appointment's baseline is ALWAYS
      // empty, this is an orphan by the SAME rule projectRows/
      // findOrphanRowIds apply — dropped, not defensively resurrected.
      const corrupted: StructuredEdit<AppointmentRow> = {
        rowId: SINGLETON_ROW_ID,
        op: "update",
        patch: row({ note: "follow-up", slot_id: "slot-9" }),
      };
      assert.deepEqual(await toRequests([corrupted], CTX), []);
    });

    it("SINGLETON COLLAPSE: a corrupted log with two distinct add-op rowIds still emits exactly ONE request — for whatever row projectValues ALSO shows", async () => {
      // Neither toRequests nor projectValues can filter a corrupted
      // multi-rowId log by identity (resolveChanges' output and
      // projectValues' `rows` parameter both strip rowId entirely) — so
      // both fall back to the SAME signal instead: first-occurrence order
      // in the log, over the identical (empty) baseline. This is what
      // makes them agree BY CONSTRUCTION rather than by which one happens
      // to guess the "real" identity right.
      const first = row({ note: "first", slot_id: "slot-9" });
      const second = row({ note: "second", slot_id: "slot-x" });
      const edits: StructuredEdit<AppointmentRow>[] = [
        { rowId: "rowid-a", op: "add", patch: first },
        { rowId: "rowid-b", op: "add", patch: second },
      ];

      const projected = projectValues([first, second]);
      const requests = await toRequests(edits, CTX);

      assert.equal(requests.length, 1);
      assert.equal(requests[0].url.includes(first.slot_id), true);
      assert.deepEqual(requests[0].body, {
        note: first.note,
        patient: CTX.patientId,
        tags: first.tags,
      });
      // Same row on both sides — the actual invariant, not "picked the
      // rowId this test decided was the true one".
      assert.deepEqual(
        (projected[0] as { type: "appointment"; value: AppointmentRow[] })
          .value[0],
        first,
      );
    });

    it("CLOSED GAP (formerly KNOWN GAP): fed RAW, a doubly-malformed log still makes projectRows and resolveChanges (via toRequests) pick DIFFERENT rows...", async () => {
      // ...which is exactly why neither loop is the fix. `resolveChanges`
      // dispatches "a" at its FIRST occurrence (index 0) but resolves its
      // CONTENT from the last-write-wins map (`aLast`), while `projectRows`'
      // add loop pushes "a" at its LAST occurrence (index 2) — so `rows[0]`
      // is "b"'s entry (pushed at index 1, before "a"'s last occurrence at
      // index 2) while `resolveChanges().creates[0]` is "a"'s LATEST
      // content. This part of the test is UNCHANGED from the original
      // "KNOWN GAP" case — it still demonstrates the raw disagreement,
      // because `projectRows`/`resolveChanges` themselves were deliberately
      // left untouched by the fix (see the next case).
      const aFirst = row({ note: "a-first", slot_id: "sA1" });
      const bOnly = row({ note: "b-only", slot_id: "sB" });
      const aLast = row({ note: "a-last", slot_id: "sA2" });
      const edits: StructuredEdit<AppointmentRow>[] = [
        { rowId: "a", op: "add", patch: aFirst },
        { rowId: "b", op: "add", patch: bOnly },
        { rowId: "a", op: "add", patch: aLast },
      ];

      const rows = projectRows([], edits, {});
      const projected = projectValues(rows.map((entry) => entry.row));
      const requests = await toRequests(edits, CTX);

      assert.deepEqual(
        (projected[0] as { type: "appointment"; value: AppointmentRow[] })
          .value[0],
        bOnly,
      );
      assert.equal(
        requests[0]?.url,
        "/api/v1/facility/fac-1/slots/sA2/create_appointment/",
      );
      assert.deepEqual(requests[0]?.body, {
        note: "a-last",
        patient: CTX.patientId,
        tags: aLast.tags,
      });
    });

    it("CLOSED GAP: once the SAME doubly-malformed log passes through sanitizeStructuredEditLog (the real ingestion boundary), projectRows and toRequests AGREE", async () => {
      // Master plan "Carry-forwards out of Phase 1" item 1's actual fix:
      // `structured/core/useStructuredRows.ts`'s `edits` derivation and
      // `fill/submit/composeStructured.ts`'s `structuredEditsOf` both run
      // `response.edits` through `sanitizeStructuredEditLog`
      // (`types/questionnaire/structured.ts`) before it ever reaches
      // `projectRows`/`resolveChanges` — so through any REAL app pathway,
      // the raw log the previous case feeds directly to those two
      // functions can never arrive un-deduplicated in the first place.
      // Sanitizing collapses rowId "a" to ONE entry — last content
      // (`aLast`), first position — which is exactly what makes the two
      // loops land on the SAME row: `projectRows`' add loop has nothing
      // left to disagree about once each rowId appears at most once, and
      // `resolveChanges` was already resolving "a"'s content this way.
      const aFirst = row({ note: "a-first", slot_id: "sA1" });
      const bOnly = row({ note: "b-only", slot_id: "sB" });
      const aLast = row({ note: "a-last", slot_id: "sA2" });
      const raw: StructuredEdit<AppointmentRow>[] = [
        { rowId: "a", op: "add", patch: aFirst },
        { rowId: "b", op: "add", patch: bOnly },
        { rowId: "a", op: "add", patch: aLast },
      ];

      const sanitized = sanitizeStructuredEditLog(
        raw,
      ) as EditLog<AppointmentRow>;

      const rows = projectRows([], sanitized, {});
      const projected = projectValues(rows.map((entry) => entry.row));
      const requests = await toRequests(sanitized, CTX);

      // Both sides now agree: "a"'s LAST content, in BOTH the projection's
      // first row and the first compiled request.
      assert.deepEqual(
        (projected[0] as { type: "appointment"; value: AppointmentRow[] })
          .value[0],
        aLast,
      );
      assert.equal(
        requests[0]?.url,
        "/api/v1/facility/fac-1/slots/sA2/create_appointment/",
      );
      assert.deepEqual(requests[0]?.body, {
        note: "a-last",
        patient: CTX.patientId,
        tags: aLast.tags,
      });
    });

    it("sends nothing without a facility in context", async () => {
      const filled = add({ note: "follow-up", slot_id: "slot-9" });
      assert.deepEqual(
        await toRequests([filled], { patientId: "pat-1", questionId: "q-1" }),
        [],
      );
    });

    it("sends nothing without a patient in context", async () => {
      const filled = add({ note: "follow-up", slot_id: "slot-9" });
      assert.deepEqual(
        await toRequests([filled], { facilityId: "fac-1", questionId: "q-1" }),
        [],
      );
    });
  });

  describe("needsSlot", () => {
    it("required + no slot => true", () => {
      assert.equal(needsSlot([row()], [add()], true), true);
    });

    it("required + slot picked => false", () => {
      assert.equal(
        needsSlot(
          [row({ slot_id: "slot-9" })],
          [add({ slot_id: "slot-9" })],
          true,
        ),
        false,
      );
    });

    it("required + a garbage 'undefined' slot_id still counts as missing", () => {
      assert.equal(
        needsSlot(
          [row({ slot_id: "undefined" })],
          [add({ slot_id: "undefined" })],
          true,
        ),
        true,
      );
    });

    it("not required, untouched => false (nothing to complain about)", () => {
      assert.equal(needsSlot([], [], false), false);
    });

    it("not required, note typed only => true (the P1-16 UI half)", () => {
      assert.equal(
        needsSlot(
          [row({ note: "follow-up" })],
          [add({ note: "follow-up" })],
          false,
        ),
        true,
      );
    });

    it("not required, tags only => true", () => {
      assert.equal(
        needsSlot([row({ tags: ["t1"] })], [add({ tags: ["t1"] })], false),
        true,
      );
    });

    it("not required, slot only => false", () => {
      assert.equal(
        needsSlot(
          [row({ slot_id: "slot-9" })],
          [add({ slot_id: "slot-9" })],
          false,
        ),
        false,
      );
    });

    it("not required, edits exist but nothing projects (e.g. an orphaned or unrelated entry) => false", () => {
      // `partiallyFilled` depends on `projection[0]`, not `edits.length`
      // alone — an edit that resolved to nothing visible (orphan-dropped,
      // or simply for a different row) must not trip validation on
      // content nobody can see.
      const unrelatedEdit: StructuredEdit<AppointmentRow> = {
        rowId: "some-other-uuid",
        op: "update",
        patch: row({ note: "unrelated" }),
      };
      assert.equal(needsSlot([], [unrelatedEdit], false), false);
    });
  });

  describe("reducer-driven (applyEditToLog + resolveSetRow, not hand-built edits)", () => {
    it("a real setRow sequence with a note but no slot reproduces P1-16: ZERO requests, and needsSlot flags it", async () => {
      const log = simulateSetRowSequence([{ note: "follow-up" }]);
      assert.equal(log.length, 1);
      assert.equal(log[0].op, "add");

      assert.deepEqual(await toRequests(log, CTX), []);

      // Valid substitute for projectRows' own output here: exactly one
      // "add" entry, no baseline — projectRows would show precisely
      // `[log[0].patch]` in that specific, narrow case.
      const projection = log.map((edit) => edit.patch);
      assert.equal(needsSlot(projection, log, false), true);
      assert.deepEqual(projectValues(projection), [
        { type: "appointment", value: [log[0].patch] },
      ]);
    });

    it("three setRow calls coalesce to ONE 'add' entry, never 'update' — why toRequests treats a raw 'update' as garbage", () => {
      const log = simulateSetRowSequence([
        { note: "follow-up" },
        { slot_id: "slot-9" },
        { tags: ["t1"] },
      ]);
      assert.equal(log.length, 1);
      assert.equal(log[0].op, "add");
      assert.deepEqual(log[0].patch, {
        note: "follow-up",
        slot_id: "slot-9",
        tags: ["t1"],
      });
    });

    it("clearing every field through the REAL reducer annihilates the row (AppointmentQuestion.tsx:144-153-style), not just the hand-built patch case", () => {
      const filledOnly = simulateSetRowSequence([
        { note: "follow-up", slot_id: "slot-9", tags: ["t1"] },
      ]);
      assert.equal(filledOnly.length, 1);

      const clearedAfter = simulateSetRowSequence([
        { note: "follow-up", slot_id: "slot-9", tags: ["t1"] },
        { note: "", slot_id: "", tags: [] },
      ]);
      assert.deepEqual(clearedAfter, []);
    });
  });
});

describe("rowSchema — the assistant write guard (spec A2)", () => {
  it("accepts a real row", () => {
    assert.equal(
      rowSchema.safeParse({
        note: "fever follow-up",
        slot_id: "slot-1",
        tags: ["urgent"],
      }).success,
      true,
    );
  });

  it("accepts a partially-filled row (note only, no slot) — this schema is not the completeness gate", () => {
    assert.equal(
      rowSchema.safeParse({ note: "fever follow-up", slot_id: "", tags: [] })
        .success,
      true,
    );
  });

  it("rejects an unknown field", () => {
    assert.equal(
      rowSchema.safeParse({
        note: "",
        slot_id: "",
        tags: [],
        reason: "hallucinated field",
      }).success,
      false,
    );
  });

  it("rejects a non-array tags", () => {
    assert.equal(
      rowSchema.safeParse({ note: "", slot_id: "", tags: "urgent" }).success,
      false,
    );
  });

  it("rejects a missing field", () => {
    assert.equal(rowSchema.safeParse({ note: "", slot_id: "" }).success, false);
  });
});
