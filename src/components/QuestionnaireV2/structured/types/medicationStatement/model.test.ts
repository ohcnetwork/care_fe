import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyEditToLog,
  toBaselineMap,
} from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import type { MedicationStatementRead } from "@/types/emr/medicationStatement";
import { MedicationStatementInformationSourceType } from "@/types/emr/medicationStatement";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { MedicationStatementRow } from "./model";
import {
  MEDICATION_STATEMENT_FIELD_KEYS,
  MEDICATION_STATEMENT_SOFT_DELETE,
  fromHistoricalMedicationRequest,
  fromHistoricalMedicationStatement,
  isDosageMissing,
  isPeriodRangeInvalid,
  isPeriodStartMissing,
  medicationStatementValidationIssues,
  needsMedicationValidation,
  newMedicationStatementRow,
  periodDateForInput,
  periodDateFromInput,
  projectValues,
  rowSchema,
  toBaselineRows,
  toMedicationStatementRow,
  toRequests,
} from "./model";

const CTX = {
  patientId: "pat-1",
  encounterId: "enc-1",
  questionId: "q-1",
} as const;

function serverMedication(
  overrides: Partial<MedicationStatementRead> = {},
): MedicationStatementRead {
  return {
    id: "med-1",
    status: "active",
    reason: "pain",
    medication: { code: "1", display: "Paracetamol", system: "sys" },
    dosage_text: "500mg twice daily",
    effective_period: { start: "2026-01-01", end: "2026-01-10" },
    encounter: "enc-0",
    information_source: MedicationStatementInformationSourceType.PATIENT,
    note: "taken as needed",
    created_date: "2026-01-01T00:00:00Z",
    modified_date: "2026-01-01T00:00:00Z",
    created_by: {} as MedicationStatementRead["created_by"],
    updated_by: {} as MedicationStatementRead["updated_by"],
    ...overrides,
  };
}

function add(
  rowId: string,
  patch: MedicationStatementRow,
): StructuredEdit<MedicationStatementRow> {
  return { rowId, op: "add", patch };
}
function update(
  rowId: string,
  patch: MedicationStatementRow,
): StructuredEdit<MedicationStatementRow> {
  return { rowId, op: "update", patch };
}
function remove(
  rowId: string,
  patch: MedicationStatementRow,
): StructuredEdit<MedicationStatementRow> {
  return { rowId, op: "remove", patch };
}

describe("medication_statement model", () => {
  describe("toMedicationStatementRow", () => {
    it("converts the read shape to the wire shape", () => {
      const medication = serverMedication();
      assert.deepEqual(toMedicationStatementRow(medication), {
        id: "med-1",
        status: "active",
        reason: "pain",
        medication: medication.medication,
        dosage_text: "500mg twice daily",
        effective_period: { start: "2026-01-01", end: "2026-01-10" },
        encounter: "enc-0",
        information_source: MedicationStatementInformationSourceType.PATIENT,
        note: "taken as needed",
      });
    });
  });

  describe("toBaselineRows", () => {
    it("keys each row by the server id", () => {
      const a = serverMedication({ id: "a" });
      const b = serverMedication({ id: "b" });
      const rows = toBaselineRows([a, b]);
      assert.deepEqual(
        rows.map((r) => r.rowId),
        ["a", "b"],
      );
      assert.deepEqual(rows[0].row, toMedicationStatementRow(a));
    });

    it("an empty fetch is an honest, complete empty baseline", () => {
      assert.deepEqual(toBaselineRows([]), []);
    });
  });

  describe("newMedicationStatementRow", () => {
    it("seeds the legacy MEDICATION_STATEMENT_INITIAL_VALUE defaults plus the current encounter", () => {
      const code = { code: "9", display: "Ibuprofen", system: "sys" };
      assert.deepEqual(newMedicationStatementRow(code, "enc-9"), {
        status: "active",
        medication: code,
        dosage_text: "",
        information_source: MedicationStatementInformationSourceType.PATIENT,
        encounter: "enc-9",
      });
    });
  });

  describe("fromHistoricalMedicationRequest", () => {
    it("resets to defaults, keeping only the medication and note", () => {
      const code = { code: "3", display: "Amoxicillin", system: "sys" };
      assert.deepEqual(
        fromHistoricalMedicationRequest(
          { medication: code, note: "from prescription" },
          "enc-2",
        ),
        {
          status: "active",
          medication: code,
          dosage_text: "",
          information_source: MedicationStatementInformationSourceType.PATIENT,
          encounter: "enc-2",
          note: "from prescription",
        },
      );
    });
  });

  describe("fromHistoricalMedicationStatement", () => {
    it("strips the server id and re-stamps the CURRENT encounter, keeping everything else", () => {
      const historical = serverMedication({
        id: "old-id",
        encounter: "enc-old",
      });
      const row = fromHistoricalMedicationStatement(historical, "enc-current");
      assert.equal("id" in row, false);
      assert.deepEqual(row, {
        status: "active",
        reason: "pain",
        medication: historical.medication,
        dosage_text: "500mg twice daily",
        effective_period: { start: "2026-01-01", end: "2026-01-10" },
        information_source: MedicationStatementInformationSourceType.PATIENT,
        note: "taken as needed",
        encounter: "enc-current",
      });
    });
  });

  describe("projectValues", () => {
    it("projects an empty row set to NO values, so the section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects rows as one medication_statement entry, without aliasing the input array", () => {
      const rowA = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      const rowB = newMedicationStatementRow(
        { code: "2", display: "B", system: "s" },
        "enc-1",
      );
      const rows = [rowA, rowB];

      const projected = projectValues(rows);

      assert.deepEqual(projected, [
        { type: "medication_statement", value: [rowA, rowB] },
      ]);
      assert.notEqual(
        (
          projected[0] as {
            type: "medication_statement";
            value: MedicationStatementRow[];
          }
        ).value,
        rows,
      );
    });
  });

  describe("toRequests", () => {
    it("P1-14: an empty edit log produces ZERO requests", async () => {
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("P1-14: an untouched baseline (several existing medications, nothing edited) still produces ZERO requests — the whole point of this port", async () => {
      // Simulates a real mount: the editor seeds `useStructuredRows` with
      // three fetched medication statements as baseline; the clinician
      // submits the form without ever opening this section. `edits` stays
      // `[]` regardless of how much baseline exists.
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("editing ONE of several baseline rows sends ONLY that row — not every prefetched medication", async () => {
      // P1-14's failure mode made concrete: today's `buildRequests` maps
      // over the whole projection, so touching row B would resend row A and
      // row C too — an unrelated concurrent edit to either could be
      // silently overwritten. The v2 differ only ever sees `edits`.
      const rowB = {
        ...toMedicationStatementRow(serverMedication({ id: "b" })),
        dosage_text: "1000mg once daily",
      };
      const edits = [update("b", rowB)];

      const requests = await toRequests(edits, CTX);

      assert.equal(requests.length, 1);
      const datapoints = (
        requests[0].body as { datapoints: MedicationStatementRow[] }
      ).datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "b");
    });

    it("a fresh add compiles ONE POST with the row in `datapoints`, note trimmed, patient+encounter stamped", async () => {
      const created = {
        ...newMedicationStatementRow(
          { code: "1", display: "Paracetamol", system: "s" },
          "enc-origin",
        ),
        note: "  taken with food  ",
      };
      const edits = [add("row-a", created)];

      assert.deepEqual(await toRequests(edits, CTX), [
        {
          url: "/api/v1/patient/pat-1/medication/statement/upsert/",
          method: "POST",
          body: {
            datapoints: [
              {
                ...created,
                note: "taken with food",
                encounter: "enc-1",
                patient: "pat-1",
              },
            ],
          },
          reference_id: "structured:medication_statement:q-1",
        },
      ]);
    });

    it("sends nothing without a patient in context", async () => {
      const created = newMedicationStatementRow(
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
      const created = newMedicationStatementRow(
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
      const created = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      let log = applyEditToLog<MedicationStatementRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      assert.equal(log.length, 1);

      log = applyEditToLog<MedicationStatementRow>(
        log,
        { rowId: "row-a", op: "remove", patch: created },
        { baseline: undefined },
      );
      assert.deepEqual(log, []);
      assert.deepEqual(await toRequests(log, CTX), []);
    });

    it("removing a BASELINE row soft-deletes it — flips status to entered_in_error and keeps it in the request", async () => {
      const server = serverMedication({ id: "row-a", status: "active" });
      const baseline: readonly BaselineRow<MedicationStatementRow>[] =
        toBaselineRows([server]);
      const baselineMap = toBaselineMap(baseline);

      // Mirrors `useStructuredRows.removeRow` -> `resolveRemoveIntent` ->
      // `applyEditToLog`, through the REAL functions, not a hand-written
      // edit — the entered-in-error split is core's job, not this differ's,
      // and this proves the wiring end to end.
      const entry = projectRows(baseline, [], {
        softDelete: MEDICATION_STATEMENT_SOFT_DELETE,
      })[0];
      assert.ok(entry);
      const removeEdit: StructuredEdit<MedicationStatementRow> = {
        rowId: entry.rowId,
        op: "update",
        patch: { ...entry.row, ...MEDICATION_STATEMENT_SOFT_DELETE.patch },
      };
      const log = applyEditToLog<MedicationStatementRow>([], removeEdit, {
        baseline: baselineMap,
      });

      const requests = await toRequests(log, CTX);
      assert.equal(requests.length, 1);
      const datapoints = (
        requests[0].body as { datapoints: MedicationStatementRow[] }
      ).datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "row-a");
      assert.equal(datapoints[0].status, "entered_in_error");
    });

    it("PROJECTION AND SUBMIT AGREE: what the clinician sees editing a baseline row is exactly what gets submitted", async () => {
      const server = serverMedication({ id: "row-a", dosage_text: "250mg" });
      const baseline = toBaselineRows([server]);
      const baselineMap = toBaselineMap(baseline);

      const edited = {
        ...toMedicationStatementRow(server),
        dosage_text: "500mg",
      };
      const log = applyEditToLog<MedicationStatementRow>(
        [],
        { rowId: "row-a", op: "update", patch: edited },
        { baseline: baselineMap },
      );

      const projectedRows = projectRows(baseline, log, {}).map((r) => r.row);
      const projection = projectValues(projectedRows);
      const requests = await toRequests(log, CTX);

      const projectedDosage = (
        projection[0] as {
          type: "medication_statement";
          value: MedicationStatementRow[];
        }
      ).value[0].dosage_text;
      const submittedDosage = (
        requests[0].body as { datapoints: MedicationStatementRow[] }
      ).datapoints[0].dosage_text;

      assert.equal(projectedDosage, "500mg");
      assert.equal(submittedDosage, "500mg");
    });

    it("PROJECTION AND SUBMIT AGREE: removing a row's soft-delete is reflected identically in both", async () => {
      const server = serverMedication({ id: "row-a", status: "active" });
      const baseline = toBaselineRows([server]);
      const baselineMap = toBaselineMap(baseline);

      const entry = projectRows(baseline, [], {
        softDelete: MEDICATION_STATEMENT_SOFT_DELETE,
      })[0];
      const removeEdit: StructuredEdit<MedicationStatementRow> = {
        rowId: entry.rowId,
        op: "update",
        patch: { ...entry.row, ...MEDICATION_STATEMENT_SOFT_DELETE.patch },
      };
      const log = applyEditToLog<MedicationStatementRow>([], removeEdit, {
        baseline: baselineMap,
      });

      const projectedRows = projectRows(baseline, log, {
        softDelete: MEDICATION_STATEMENT_SOFT_DELETE,
      });
      const projection = projectValues(projectedRows.map((r) => r.row));
      const requests = await toRequests(log, CTX);

      const projectedStatus = (
        projection[0] as {
          type: "medication_statement";
          value: MedicationStatementRow[];
        }
      ).value[0].status;
      const submittedStatus = (
        requests[0].body as { datapoints: MedicationStatementRow[] }
      ).datapoints[0].status;

      assert.equal(projectedStatus, "entered_in_error");
      assert.equal(submittedStatus, "entered_in_error");
      assert.equal(projectedRows[0].softDeleted, true);
    });
  });

  describe("periodDateForInput / periodDateFromInput", () => {
    it("periodDateForInput renders a bare yyyy-MM-dd for the native input", () => {
      assert.equal(
        periodDateForInput("2026-08-01T00:00:00.000Z"),
        "2026-08-01",
      );
    });

    it("periodDateForInput is empty for an undefined period boundary", () => {
      assert.equal(periodDateForInput(undefined), "");
    });

    it("periodDateFromInput emits a timezone-aware ISO instant the backend's PeriodSpec accepts", () => {
      // FOUND BY MOUNT-TESTING: `care/emr/resources/base.py`'s
      // `validate_period` rejects a naive datetime ("Start Date must be
      // timezone aware") — a bare "2026-08-01" round-tripped straight
      // through 400'd on save. The produced string must parse to a
      // non-naive instant.
      const iso = periodDateFromInput("2026-08-01");
      assert.match(iso!, /Z$/);
      assert.equal(new Date(iso!).getTime(), Date.UTC(2026, 7, 1));
    });

    it("periodDateFromInput returns undefined for an emptied input", () => {
      assert.equal(periodDateFromInput(""), undefined);
    });

    it("round-trips through both directions", () => {
      const iso = periodDateFromInput("2026-03-15");
      assert.equal(periodDateForInput(iso), "2026-03-15");
    });
  });

  describe("validation predicates", () => {
    it("needsMedicationValidation is false only for entered_in_error", () => {
      const row = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      assert.equal(needsMedicationValidation(row), true);
      assert.equal(
        needsMedicationValidation({ ...row, status: "entered_in_error" }),
        false,
      );
    });

    it("isDosageMissing is true for blank/whitespace-only dosage", () => {
      const row = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      assert.equal(isDosageMissing(row), true);
      assert.equal(isDosageMissing({ ...row, dosage_text: "   " }), true);
      assert.equal(isDosageMissing({ ...row, dosage_text: "500mg" }), false);
    });

    it("isPeriodStartMissing is true when there is no period or no start", () => {
      const row = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      assert.equal(isPeriodStartMissing(row), true);
      assert.equal(
        isPeriodStartMissing({
          ...row,
          effective_period: { end: "2026-01-10" },
        }),
        true,
      );
      assert.equal(
        isPeriodStartMissing({
          ...row,
          effective_period: { start: "2026-01-01" },
        }),
        false,
      );
    });

    it("isPeriodRangeInvalid is true only when both dates exist and end precedes start", () => {
      const row = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      assert.equal(isPeriodRangeInvalid(row), false); // no dates at all
      assert.equal(
        isPeriodRangeInvalid({
          ...row,
          effective_period: { start: "2026-01-10" },
        }),
        false,
      ); // no end yet
      assert.equal(
        isPeriodRangeInvalid({
          ...row,
          effective_period: { start: "2026-01-10", end: "2026-01-01" },
        }),
        true,
      );
      assert.equal(
        isPeriodRangeInvalid({
          ...row,
          effective_period: { start: "2026-01-01", end: "2026-01-10" },
        }),
        false,
      );
      assert.equal(
        isPeriodRangeInvalid({
          ...row,
          effective_period: { start: "2026-01-01", end: "2026-01-01" },
        }),
        false,
      ); // same day is not "before"
    });
  });

  describe("medicationStatementValidationIssues", () => {
    it("no issues for an empty edit log", () => {
      assert.deepEqual(medicationStatementValidationIssues([]), []);
    });

    it("flags a fresh add with no dosage and no period start", () => {
      const row = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      const issues = medicationStatementValidationIssues([add("row-a", row)]);
      assert.deepEqual(issues, [
        {
          rowId: "row-a",
          fieldKey: MEDICATION_STATEMENT_FIELD_KEYS.DOSAGE,
          reason: "missing_dosage",
        },
        {
          rowId: "row-a",
          fieldKey: MEDICATION_STATEMENT_FIELD_KEYS.PERIOD,
          reason: "missing_period_start",
        },
      ]);
    });

    it("flags an invalid period range distinctly from a missing start", () => {
      const row = {
        ...newMedicationStatementRow(
          { code: "1", display: "A", system: "s" },
          "enc-1",
        ),
        dosage_text: "500mg",
        effective_period: { start: "2026-01-10", end: "2026-01-01" },
      };
      const issues = medicationStatementValidationIssues([add("row-a", row)]);
      assert.deepEqual(issues, [
        {
          rowId: "row-a",
          fieldKey: MEDICATION_STATEMENT_FIELD_KEYS.PERIOD,
          reason: "invalid_period_range",
        },
      ]);
    });

    it("a complete row produces no issues", () => {
      const row = {
        ...newMedicationStatementRow(
          { code: "1", display: "A", system: "s" },
          "enc-1",
        ),
        dosage_text: "500mg",
        effective_period: { start: "2026-01-01", end: "2026-01-10" },
      };
      assert.deepEqual(
        medicationStatementValidationIssues([add("row-a", row)]),
        [],
      );
    });

    it("an entered_in_error row is exempt regardless of completeness", () => {
      const row = {
        ...newMedicationStatementRow(
          { code: "1", display: "A", system: "s" },
          "enc-1",
        ),
        status: "entered_in_error" as const,
      };
      assert.deepEqual(
        medicationStatementValidationIssues([update("row-a", row)]),
        [],
      );
    });

    it("a `remove` edit is never reported, even when its last-known content is incomplete", () => {
      const row = newMedicationStatementRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      assert.deepEqual(
        medicationStatementValidationIssues([remove("row-a", row)]),
        [],
      );
    });

    it("VALIDATION-SIDE P1-14: an untouched baseline row is never validated, however incomplete — only edits gate submit", () => {
      // A historical record with a missing dosage that the clinician never
      // opened this session must not hard-block an unrelated submit. Since
      // `validate` only ever sees `edits` (never the projection) for
      // row-scoped errors (N5), an empty edit log is trivially issue-free
      // regardless of how incomplete the (untouched) baseline is.
      assert.deepEqual(medicationStatementValidationIssues([]), []);
    });

    it("only the TOUCHED row is validated when several rows exist", () => {
      const complete = {
        ...newMedicationStatementRow(
          { code: "1", display: "A", system: "s" },
          "enc-1",
        ),
        dosage_text: "500mg",
        effective_period: { start: "2026-01-01", end: "2026-01-10" },
      };
      // "incomplete" (an untouched second baseline row, missing dosage and
      // period) never appears in `edits` at all — only "complete-row" was
      // touched this session — so it can never surface an issue no matter
      // how invalid it would be in isolation.
      const issues = medicationStatementValidationIssues([
        update("complete-row", complete),
      ]);
      assert.deepEqual(issues, []);
    });
  });
});

describe("rowSchema — the assistant write guard (spec A2)", () => {
  const code = { code: "1", display: "Paracetamol", system: "sys" };

  it("accepts a real row", () => {
    assert.equal(
      rowSchema.safeParse(newMedicationStatementRow(code, "enc-1")).success,
      true,
    );
  });

  it("accepts a row with an empty dosage_text — the schema is not the completeness gate", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newMedicationStatementRow(code, "enc-1"),
        dosage_text: "",
      }).success,
      true,
    );
  });

  it("accepts a baseline row converted via toMedicationStatementRow", () => {
    assert.equal(
      rowSchema.safeParse(toMedicationStatementRow(serverMedication())).success,
      true,
    );
  });

  it("rejects an unknown field", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newMedicationStatementRow(code, "enc-1"),
        route: "hallucinated field",
      }).success,
      false,
    );
  });

  it("rejects an invalid status enum value", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newMedicationStatementRow(code, "enc-1"),
        status: "not_a_real_status",
      }).success,
      false,
    );
  });

  it("rejects an invalid information_source enum value", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newMedicationStatementRow(code, "enc-1"),
        information_source: "self",
      }).success,
      false,
    );
  });

  it("rejects a period with an unparseable start", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newMedicationStatementRow(code, "enc-1"),
        effective_period: { start: "not-a-date" },
      }).success,
      false,
    );
  });

  it("rejects a missing medication code", () => {
    const { medication: _drop, ...withoutMedication } =
      newMedicationStatementRow(code, "enc-1");
    assert.equal(rowSchema.safeParse(withoutMedication).success, false);
  });
});
