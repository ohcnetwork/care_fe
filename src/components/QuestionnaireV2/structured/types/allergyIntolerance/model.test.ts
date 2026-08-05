import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyEditToLog,
  toBaselineMap,
} from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import type { AllergyIntolerance } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { AllergyRow } from "./model";
import {
  ALLERGY_SOFT_DELETE,
  newAllergyRow,
  projectValues,
  rowSchema,
  toAllergyRow,
  toBaselineRows,
  toRequests,
} from "./model";

const CTX = {
  patientId: "pat-1",
  encounterId: "enc-1",
  questionId: "q-1",
} as const;

function serverAllergy(
  overrides: Partial<AllergyIntolerance> = {},
): AllergyIntolerance {
  return {
    id: "allergy-1",
    code: { code: "1", display: "Peanuts", system: "sys" },
    clinical_status: "active",
    verification_status: "confirmed",
    category: "food",
    criticality: "high",
    last_occurrence: "2026-01-15T10:00:00+05:30",
    note: "swelling",
    created_by: {} as AllergyIntolerance["created_by"],
    encounter: "enc-0",
    created_date: "2026-01-01T00:00:00Z",
    modified_date: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function add(rowId: string, patch: AllergyRow): StructuredEdit<AllergyRow> {
  return { rowId, op: "add", patch };
}
function update(rowId: string, patch: AllergyRow): StructuredEdit<AllergyRow> {
  return { rowId, op: "update", patch };
}

describe("allergy_intolerance model", () => {
  describe("toAllergyRow", () => {
    it("converts the read shape to the wire shape, reformatting last_occurrence to a bare date", () => {
      const allergy = serverAllergy();
      assert.deepEqual(toAllergyRow(allergy), {
        id: "allergy-1",
        code: allergy.code,
        clinical_status: "active",
        verification_status: "confirmed",
        category: "food",
        criticality: "high",
        last_occurrence: "2026-01-15",
        note: "swelling",
        encounter: "enc-0",
      });
    });

    it("omits last_occurrence when the server never recorded one", () => {
      const allergy = serverAllergy({ last_occurrence: undefined });
      assert.equal(toAllergyRow(allergy).last_occurrence, undefined);
    });
  });

  describe("toBaselineRows", () => {
    it("keys each row by the server id", () => {
      const a = serverAllergy({ id: "a" });
      const b = serverAllergy({ id: "b" });
      const rows = toBaselineRows([a, b]);
      assert.deepEqual(
        rows.map((r) => r.rowId),
        ["a", "b"],
      );
      assert.deepEqual(rows[0].row, toAllergyRow(a));
    });

    it("an empty fetch is an honest, complete empty baseline", () => {
      assert.deepEqual(toBaselineRows([]), []);
    });
  });

  describe("newAllergyRow", () => {
    it("seeds the legacy ALLERGY_INITIAL_VALUE defaults plus the current encounter", () => {
      const code = { code: "9", display: "Shellfish", system: "sys" };
      assert.deepEqual(newAllergyRow(code, "enc-9"), {
        code,
        clinical_status: "active",
        verification_status: "confirmed",
        category: "medication",
        criticality: "low",
        encounter: "enc-9",
      });
    });
  });

  describe("projectValues", () => {
    it("projects an empty row set to NO values, so the section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects rows as one allergy_intolerance entry, without aliasing the input array", () => {
      const rowA = newAllergyRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      const rowB = newAllergyRow(
        { code: "2", display: "B", system: "s" },
        "enc-1",
      );
      const rows = [rowA, rowB];

      const projected = projectValues(rows);

      assert.deepEqual(projected, [
        { type: "allergy_intolerance", value: [rowA, rowB] },
      ]);
      assert.notEqual(
        (projected[0] as { type: "allergy_intolerance"; value: AllergyRow[] })
          .value,
        rows,
      );
    });
  });

  describe("toRequests", () => {
    it("an empty edit log produces zero requests", async () => {
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("an untouched baseline (several existing allergies, nothing edited) still produces zero requests", async () => {
      // Simulates a real mount: `AllergyEditor` seeds `useStructuredRows`
      // with three fetched allergies as baseline; the clinician submits the
      // form without ever opening this section. `edits` stays `[]`
      // regardless of how much baseline exists.
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("editing ONE of several baseline rows sends ONLY that row — not every prefetched allergy", async () => {
      // Touching row B must not resend rows A and C — an unrelated
      // concurrent edit to either could be silently overwritten.
      const rowB = {
        ...toAllergyRow(serverAllergy({ id: "b" })),
        criticality: "high",
      };
      const edits = [update("b", rowB)];

      const requests = await toRequests(edits, CTX);

      assert.equal(requests.length, 1);
      const datapoints = (requests[0].body as { datapoints: AllergyRow[] })
        .datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "b");
    });

    it("a fresh add compiles ONE POST with the row in `datapoints`, note trimmed", async () => {
      const created = {
        ...newAllergyRow(
          { code: "1", display: "Peanuts", system: "s" },
          "enc-1",
        ),
        note: "  mild rash  ",
      };
      const edits = [add("row-a", created)];

      assert.deepEqual(await toRequests(edits, CTX), [
        {
          url: "/api/v1/patient/pat-1/allergy_intolerance/upsert/",
          method: "POST",
          body: {
            datapoints: [{ ...created, note: "mild rash", encounter: "enc-1" }],
          },
          reference_id: "structured:allergy_intolerance:q-1",
        },
      ]);
    });

    it("sends nothing without a patient in context", async () => {
      const created = newAllergyRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      assert.deepEqual(
        await toRequests([add("row-a", created)], {
          encounterId: "enc-1",
          questionId: "q-1",
        }),
        [],
      );
    });

    it("sends nothing without an encounter in context", async () => {
      const created = newAllergyRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      assert.deepEqual(
        await toRequests([add("row-a", created)], {
          patientId: "pat-1",
          questionId: "q-1",
        }),
        [],
      );
    });

    it("an added-then-removed row is annihilated by the REAL reducer — never reaches the request body (no server id to soft-delete)", async () => {
      const created = newAllergyRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      let log = applyEditToLog<AllergyRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      assert.equal(log.length, 1);

      log = applyEditToLog<AllergyRow>(
        log,
        { rowId: "row-a", op: "remove", patch: created },
        { baseline: undefined },
      );
      assert.deepEqual(log, []);
      assert.deepEqual(await toRequests(log, CTX), []);
    });

    it("removing a BASELINE row soft-deletes it — flips verification_status to entered_in_error and keeps it in the request", async () => {
      const server = serverAllergy({
        id: "row-a",
        verification_status: "confirmed",
      });
      const baseline: readonly BaselineRow<AllergyRow>[] = toBaselineRows([
        server,
      ]);
      const baselineMap = toBaselineMap(baseline);

      // Mirrors `useStructuredRows.removeRow` -> `resolveRemoveIntent` ->
      // `applyEditToLog`, through the REAL functions, not a hand-written
      // edit — the entered-in-error split is core's job, not this
      // differ's, and this proves the wiring end to end.
      const entry = projectRows(baseline, [], {
        softDelete: ALLERGY_SOFT_DELETE,
      })[0];
      assert.ok(entry);
      const removeEdit: StructuredEdit<AllergyRow> = {
        rowId: entry.rowId,
        op: "update",
        patch: { ...entry.row, ...ALLERGY_SOFT_DELETE.patch },
      };
      const log = applyEditToLog<AllergyRow>([], removeEdit, {
        baseline: baselineMap,
      });

      const requests = await toRequests(log, CTX);
      assert.equal(requests.length, 1);
      const datapoints = (requests[0].body as { datapoints: AllergyRow[] })
        .datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "row-a");
      assert.equal(datapoints[0].verification_status, "entered_in_error");
    });

    it("PROJECTION AND SUBMIT AGREE: what the clinician sees editing a baseline row is exactly what gets submitted", async () => {
      const server = serverAllergy({ id: "row-a", criticality: "low" });
      const baseline = toBaselineRows([server]);
      const baselineMap = toBaselineMap(baseline);

      const edited = { ...toAllergyRow(server), criticality: "high" };
      const log = applyEditToLog<AllergyRow>(
        [],
        { rowId: "row-a", op: "update", patch: edited },
        { baseline: baselineMap },
      );

      const projectedRows = projectRows(baseline, log, {}).map((r) => r.row);
      const projection = projectValues(projectedRows);
      const requests = await toRequests(log, CTX);

      const projectedCriticality = (
        projection[0] as { type: "allergy_intolerance"; value: AllergyRow[] }
      ).value[0].criticality;
      const submittedCriticality = (
        requests[0].body as { datapoints: AllergyRow[] }
      ).datapoints[0].criticality;

      assert.equal(projectedCriticality, "high");
      assert.equal(submittedCriticality, "high");
    });
  });
});

describe("rowSchema — the assistant write guard", () => {
  const code = { code: "9", display: "Shellfish", system: "sys" };

  it("accepts a real row", () => {
    assert.equal(
      rowSchema.safeParse(newAllergyRow(code, "enc-1")).success,
      true,
    );
  });

  it("accepts an existing (baseline) row with an id", () => {
    assert.equal(
      rowSchema.safeParse({ ...newAllergyRow(code, "enc-1"), id: "a-1" })
        .success,
      true,
    );
  });

  it("rejects an unknown field", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newAllergyRow(code, "enc-1"),
        allergen: "hallucinated field",
      }).success,
      false,
    );
  });

  it("rejects an invalid clinical_status enum value", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newAllergyRow(code, "enc-1"),
        clinical_status: "not_a_real_status",
      }).success,
      false,
    );
  });

  it("rejects an invalid criticality value, even though the TS type widens it to string", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newAllergyRow(code, "enc-1"),
        criticality: "extremely dangerous",
      }).success,
      false,
    );
  });

  it("rejects a malformed code (missing display)", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newAllergyRow(code, "enc-1"),
        code: { code: "9", system: "sys" },
      }).success,
      false,
    );
  });

  it("rejects a malformed last_occurrence date", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newAllergyRow(code, "enc-1"),
        last_occurrence: "2024-02-31",
      }).success,
      false,
    );
  });

  it("rejects a missing encounter", () => {
    const { encounter: _drop, ...withoutEncounter } = newAllergyRow(
      code,
      "enc-1",
    );
    assert.equal(rowSchema.safeParse(withoutEncounter).success, false);
  });
});
