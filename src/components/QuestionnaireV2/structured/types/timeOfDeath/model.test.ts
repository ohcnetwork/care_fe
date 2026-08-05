import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SINGLETON_ROW_ID } from "@/components/QuestionnaireV2/structured/core/rowIds";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";
import {
  createSeed,
  isEmptyRow,
  projectValues,
  rowSchema,
  toRequests,
} from "./model";

const CTX = { patientId: "pat-1", questionId: "q-1" } as const;
const add = (deceased_datetime: string): StructuredEdit<TimeOfDeathRow> => ({
  rowId: SINGLETON_ROW_ID,
  op: "add",
  patch: { deceased_datetime },
});

describe("time_of_death model", () => {
  it("projects an empty row set to NO values, so the question reads unanswered", () => {
    // entryHasContent (form/engine/store.ts:372-376) treats an empty array
    // as unanswered; anything else would light the outline tick for a
    // section the clinician cleared.
    assert.deepEqual(projectValues([]), []);
  });

  it("projects one row as a single time_of_death entry", () => {
    assert.deepEqual(
      projectValues([{ deceased_datetime: "2026-08-04T10:00:00+05:30" }]),
      [
        {
          type: "time_of_death",
          value: [{ deceased_datetime: "2026-08-04T10:00:00+05:30" }],
        },
      ],
    );
  });

  it("seeds an empty row, and recognises it as empty", () => {
    assert.equal(isEmptyRow(createSeed()), true);
    assert.equal(
      isEmptyRow({ deceased_datetime: "2026-08-04T10:00:00+05:30" }),
      false,
    );
  });

  it("REGRESSION (post-review): a blank row projects as unanswered, matching the differ", () => {
    // Before the fix, this projected as ONE answered entry while
    // toRequests sent nothing for the same row — entryHasContent read
    // true, the outline tick lit, required validation passed, and Save
    // silently recorded no time of death. projectValues and toRequests
    // must agree on "empty" via the same isEmptyRow.
    assert.deepEqual(projectValues([{ deceased_datetime: "" }]), []);
  });

  it("P1-14: an empty edit log produces ZERO requests", async () => {
    assert.deepEqual(await toRequests([], CTX), []);
  });

  it("compiles one PUT against the patient", async () => {
    assert.deepEqual(
      await toRequests([add("2026-08-04T10:00:00+05:30")], CTX),
      [
        {
          url: "/api/v1/patient/pat-1/",
          method: "PUT",
          body: { deceased_datetime: "2026-08-04T10:00:00+05:30" },
          reference_id: "structured:time_of_death:q-1",
        },
      ],
    );
  });

  it("sends nothing when the datetime is blank", async () => {
    // isEmptyRow annihilates the add in the reducer, but a hand-edited
    // draft can still carry one; the differ must not PUT a blank.
    assert.deepEqual(await toRequests([add("")], CTX), []);
  });

  it("sends nothing without a patient in context", async () => {
    assert.deepEqual(
      await toRequests([add("2026-08-04T10:00:00+05:30")], {
        questionId: "q-1",
      }),
      [],
    );
  });

  it("REGRESSION (post-review): a malformed log with two rowIds collapses to the LAST row — never two PUTs to one endpoint", async () => {
    const edits: StructuredEdit<TimeOfDeathRow>[] = [
      {
        rowId: "a",
        op: "add",
        patch: { deceased_datetime: "2026-08-04T10:00:00+05:30" },
      },
      {
        rowId: "b",
        op: "add",
        patch: { deceased_datetime: "2026-08-05T09:00:00+05:30" },
      },
    ];
    assert.deepEqual(await toRequests(edits, CTX), [
      {
        url: "/api/v1/patient/pat-1/",
        method: "PUT",
        body: { deceased_datetime: "2026-08-05T09:00:00+05:30" },
        reference_id: "structured:time_of_death:q-1",
      },
    ]);
  });

  it("REGRESSION (post-review): a malformed two-rowId log whose LAST row is blank still sends the answered one, matching the projection", async () => {
    // The first dedupe cut took `.at(-1)` THEN checked emptiness, so this
    // exact shape reproduced item 1's bug in miniature: the projection
    // shows "a" as answered (its blank sibling is filtered out the same
    // way projectValues filters), while the differ picked "b", saw it was
    // blank, and sent nothing. Filtering blanks out BEFORE taking the last
    // entry fixes it: the differ now agrees with what the projection shows.
    const edits: StructuredEdit<TimeOfDeathRow>[] = [
      {
        rowId: "a",
        op: "add",
        patch: { deceased_datetime: "2026-08-04T04:30:00.000Z" },
      },
      { rowId: "b", op: "add", patch: { deceased_datetime: "" } },
    ];
    assert.deepEqual(await toRequests(edits, CTX), [
      {
        url: "/api/v1/patient/pat-1/",
        method: "PUT",
        body: { deceased_datetime: "2026-08-04T04:30:00.000Z" },
        reference_id: "structured:time_of_death:q-1",
      },
    ]);
  });
});

describe("rowSchema — the assistant write guard (spec A2)", () => {
  it("accepts a real row", () => {
    const result = rowSchema.safeParse({
      deceased_datetime: "2026-08-04T10:00:00Z",
    });
    assert.equal(result.success, true);
  });

  it("rejects an unknown field", () => {
    const result = rowSchema.safeParse({
      deceased_datetime: "2026-08-04T10:00:00Z",
      cause_of_death: "hallucinated field",
    });
    assert.equal(result.success, false);
  });

  it("rejects a missing deceased_datetime", () => {
    assert.equal(rowSchema.safeParse({}).success, false);
  });

  it("rejects an empty deceased_datetime", () => {
    assert.equal(rowSchema.safeParse({ deceased_datetime: "" }).success, false);
  });

  it("rejects a non-string deceased_datetime", () => {
    assert.equal(
      rowSchema.safeParse({ deceased_datetime: 12345 }).success,
      false,
    );
  });
});
