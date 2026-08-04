import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SINGLETON_ROW_ID } from "@/components/QuestionnaireV2/structured/core/rowIds";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { AppointmentRow } from "./model";
import {
  createSeed,
  isEmptyRow,
  needsSlot,
  projectValues,
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

    it("PROJECTION AND SUBMIT AGREE: the request body is built from exactly the row the projection shows", async () => {
      const filled = row({
        note: "follow-up",
        slot_id: "slot-9",
        tags: ["t1", "t2"],
      });
      const projected = projectValues([filled]);
      const requests = await toRequests(
        [{ rowId: SINGLETON_ROW_ID, op: "add", patch: filled }],
        CTX,
      );
      assert.equal(projected.length, 1);
      assert.equal(requests.length, 1);
      const projectedRow = (
        projected[0] as { type: "appointment"; value: AppointmentRow[] }
      ).value[0];
      assert.deepEqual(requests[0].body, {
        note: projectedRow.note,
        patient: CTX.patientId,
        tags: projectedRow.tags,
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
  });
});
