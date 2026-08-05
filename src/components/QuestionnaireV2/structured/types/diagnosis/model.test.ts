import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findDuplicateCandidates } from "@/components/QuestionnaireV2/structured/core/duplicates";
import {
  applyEditToLog,
  toBaselineMap,
} from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import type { Diagnosis } from "@/types/emr/diagnosis/diagnosis";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { DiagnosisRow } from "./model";
import {
  DIAGNOSIS_SOFT_DELETE,
  diagnosisDisplayOrder,
  diagnosisDuplicateKey,
  isOnsetFrozen,
  newDiagnosisRow,
  projectValues,
  rowSchema,
  toBaselineRows,
  toDiagnosisRow,
  toRequests,
  toReusedDiagnosisRow,
} from "./model";

const CTX = {
  patientId: "pat-1",
  encounterId: "enc-1",
  questionId: "q-1",
} as const;

function serverDiagnosis(overrides: Partial<Diagnosis> = {}): Diagnosis {
  return {
    id: "diag-1",
    code: { code: "1", display: "Hypertension", system: "sys" },
    clinical_status: "active",
    verification_status: "confirmed",
    severity: "moderate",
    onset: { onset_datetime: "2026-01-15T10:00:00+05:30" },
    category: "encounter_diagnosis",
    note: "stable",
    created_by: {} as Diagnosis["created_by"],
    updated_by: {} as Diagnosis["updated_by"],
    encounter: "enc-0",
    created_date: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function add(rowId: string, patch: DiagnosisRow): StructuredEdit<DiagnosisRow> {
  return { rowId, op: "add", patch };
}
function update(
  rowId: string,
  patch: DiagnosisRow,
): StructuredEdit<DiagnosisRow> {
  return { rowId, op: "update", patch };
}

describe("diagnosis model", () => {
  describe("toDiagnosisRow", () => {
    it("converts the read shape to the wire shape, reformatting onset_datetime to a bare date, and never writes dirty", () => {
      const diagnosis = serverDiagnosis();
      const row = toDiagnosisRow(diagnosis);
      assert.deepEqual(row, {
        id: "diag-1",
        code: diagnosis.code,
        clinical_status: "active",
        verification_status: "confirmed",
        severity: "moderate",
        onset: { onset_datetime: "2026-01-15" },
        recorded_date: undefined,
        category: "encounter_diagnosis",
        note: "stable",
        encounter: "enc-0",
        created_by: diagnosis.created_by,
        created_date: "2026-01-01T00:00:00Z",
      });
      assert.equal("dirty" in row, false);
    });

    it("omits onset entirely when the server never recorded one", () => {
      const diagnosis = serverDiagnosis({ onset: undefined });
      assert.equal(toDiagnosisRow(diagnosis).onset, undefined);
    });

    it("keeps onset_datetime as an empty string when onset exists but carries no datetime (legacy parity)", () => {
      const diagnosis = serverDiagnosis({ onset: { note: "vague" } });
      assert.deepEqual(toDiagnosisRow(diagnosis).onset, {
        note: "vague",
        onset_datetime: "",
      });
    });
  });

  describe("toBaselineRows", () => {
    it("keys each row by the server id", () => {
      const a = serverDiagnosis({ id: "a" });
      const b = serverDiagnosis({ id: "b" });
      const rows = toBaselineRows([a, b]);
      assert.deepEqual(
        rows.map((r) => r.rowId),
        ["a", "b"],
      );
      assert.deepEqual(rows[0].row, toDiagnosisRow(a));
    });

    it("an empty fetch is an honest, complete empty baseline", () => {
      assert.deepEqual(toBaselineRows([]), []);
    });
  });

  describe("newDiagnosisRow", () => {
    it("seeds the legacy DIAGNOSIS_INITIAL_VALUE defaults plus the current encounter, without dirty", () => {
      const code = { code: "9", display: "Diabetes", system: "sys" };
      const row = newDiagnosisRow(code, "enc-9");
      assert.equal(row.code, code);
      assert.equal(row.clinical_status, "active");
      assert.equal(row.verification_status, "confirmed");
      assert.equal(row.severity, "moderate");
      assert.equal(row.category, "encounter_diagnosis");
      assert.equal(row.encounter, "enc-9");
      assert.ok(row.onset?.onset_datetime);
      assert.equal("dirty" in row, false);
    });
  });

  describe("projectValues", () => {
    it("projects an empty row set to NO values, so the section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects rows as one diagnosis entry, without aliasing the input array", () => {
      const rowA = newDiagnosisRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      const rowB = newDiagnosisRow(
        { code: "2", display: "B", system: "s" },
        "enc-1",
      );
      const rows = [rowA, rowB];

      const projected = projectValues(rows);

      assert.deepEqual(projected, [{ type: "diagnosis", value: [rowA, rowB] }]);
      assert.notEqual(
        (projected[0] as { type: "diagnosis"; value: DiagnosisRow[] }).value,
        rows,
      );
    });
  });

  describe("diagnosisDuplicateKey + findDuplicateCandidates (the duplicate-code guard)", () => {
    it("flags a second candidate carrying the same code as the first", () => {
      const rowA = newDiagnosisRow(
        { code: "E11", display: "Diabetes", system: "s" },
        "enc-1",
      );
      const rowB = newDiagnosisRow(
        { code: "E11", display: "Diabetes", system: "s" },
        "enc-1",
      );
      const flags = findDuplicateCandidates([], diagnosisDuplicateKey, [
        rowA,
        rowB,
      ]);
      assert.deepEqual(flags, [false, true]);
    });

    it("does NOT flag a code already on an entered_in_error (soft-deleted) row — reproduces checkForDuplicateDiagnosis's own exclusion", () => {
      const baseline = toBaselineRows([
        serverDiagnosis({
          id: "d1",
          code: { code: "E11", display: "Diabetes", system: "s" },
          verification_status: "entered_in_error",
        }),
      ]);
      const projected = projectRows(baseline, [], {
        softDelete: DIAGNOSIS_SOFT_DELETE,
      });
      const candidate = newDiagnosisRow(
        { code: "E11", display: "Diabetes", system: "s" },
        "enc-1",
      );
      const flags = findDuplicateCandidates(projected, diagnosisDuplicateKey, [
        candidate,
      ]);
      assert.deepEqual(flags, [false]);
    });

    it("DOES flag a code already on an active (non-error) baseline row", () => {
      const baseline = toBaselineRows([
        serverDiagnosis({
          id: "d1",
          code: { code: "E11", display: "Diabetes", system: "s" },
        }),
      ]);
      const projected = projectRows(baseline, []);
      const candidate = newDiagnosisRow(
        { code: "E11", display: "Diabetes", system: "s" },
        "enc-1",
      );
      const flags = findDuplicateCandidates(projected, diagnosisDuplicateKey, [
        candidate,
      ]);
      assert.deepEqual(flags, [true]);
    });
  });

  describe("toReusedDiagnosisRow", () => {
    it("strips the server id and re-stamps the current encounter, keeping every other field", () => {
      const historical = toDiagnosisRow(
        serverDiagnosis({ id: "old-id", encounter: "enc-0" }),
      );
      const reused = toReusedDiagnosisRow(historical, "enc-9");
      assert.equal(reused.id, undefined);
      assert.equal(reused.encounter, "enc-9");
      assert.equal(reused.code, historical.code);
      assert.equal(reused.severity, historical.severity);
      assert.equal(reused.note, historical.note);
    });

    it("defaults a null severity to moderate", () => {
      const historical = toDiagnosisRow(serverDiagnosis({ severity: null }));
      assert.equal(
        toReusedDiagnosisRow(historical, "enc-9").severity,
        "moderate",
      );
    });
  });

  describe("isOnsetFrozen", () => {
    it("freezes onset editing for a baseline (server-known) row", () => {
      assert.equal(isOnsetFrozen("baseline"), true);
    });

    it("leaves onset editable for a freshly added row", () => {
      assert.equal(isOnsetFrozen("added"), false);
    });
  });

  describe("diagnosisDisplayOrder — DISPLAY-ONLY SORT (the Diagnosis bug)", () => {
    it("sorts the projection by onset ascending WITHOUT mutating baseline or the edit log", () => {
      const d1 = toDiagnosisRow(
        serverDiagnosis({ id: "d1", onset: { onset_datetime: "2026-03-01" } }),
      );
      const d2 = toDiagnosisRow(
        serverDiagnosis({ id: "d2", onset: { onset_datetime: "2026-01-01" } }),
      );
      const d3 = toDiagnosisRow(
        serverDiagnosis({ id: "d3", onset: { onset_datetime: "2026-02-01" } }),
      );
      const baseline: BaselineRow<DiagnosisRow>[] = [
        { rowId: "d1", row: d1 },
        { rowId: "d2", row: d2 },
        { rowId: "d3", row: d3 },
      ];
      // A non-empty log that moves d3's onset PAST d1's, so the sort key
      // the comparator reads comes from the EDITED content, not the stale
      // baseline value — an empty log would prove nothing about the log
      // being left untouched.
      const d3Updated: DiagnosisRow = {
        ...d3,
        onset: { onset_datetime: "2026-04-01" },
      };
      const log = [update("d3", d3Updated)];
      const baselineSnapshot = structuredClone(baseline);
      const logSnapshot = structuredClone(log);

      const result = projectRows(baseline, log, {
        displayOrder: diagnosisDisplayOrder,
      });

      // d2 (Jan) < d1 (Mar) < d3-as-edited (Apr) — d3 moved from the middle
      // to last, proving the sort used the post-edit onset date.
      assert.deepEqual(
        result.map((r) => r.rowId),
        ["d2", "d1", "d3"],
      );
      // THE BUG THIS RETIRES: the sorted view must never be what's written
      // back as the canonical order.
      assert.deepEqual(baseline, baselineSnapshot);
      assert.deepEqual(log, logSnapshot);
    });

    it("sorts a row with no onset date LAST, deterministically", () => {
      const withOnset = newDiagnosisRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      const noOnset: DiagnosisRow = { ...withOnset, onset: undefined };
      const sorted = [noOnset, withOnset].sort(diagnosisDisplayOrder);
      assert.deepEqual(sorted, [withOnset, noOnset]);
    });
  });

  describe("toRequests", () => {
    it("an empty edit log produces zero requests", async () => {
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("an untouched baseline (several existing diagnoses, nothing edited) still produces zero requests", async () => {
      // Simulates a real mount: `DiagnosisEditor` seeds `useStructuredRows`
      // with three fetched diagnoses as baseline; the clinician submits the
      // form without ever opening this section. `edits` stays `[]`
      // regardless of how much baseline exists.
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("editing ONE of several baseline rows sends ONLY that row — not every prefetched diagnosis", async () => {
      const rowB = {
        ...toDiagnosisRow(serverDiagnosis({ id: "b" })),
        severity: "severe" as const,
      };
      const edits = [update("b", rowB)];

      const requests = await toRequests(edits, CTX);

      assert.equal(requests.length, 1);
      const datapoints = (requests[0].body as { datapoints: DiagnosisRow[] })
        .datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "b");
    });

    it("a fresh add compiles ONE POST with the row in `datapoints`, note trimmed, encounter re-stamped, and no dirty key sent", async () => {
      const created = {
        ...newDiagnosisRow(
          { code: "1", display: "Hypertension", system: "s" },
          "enc-OLD",
        ),
        note: "  reviewed  ",
      };
      const edits = [add("row-a", created)];

      const requests = await toRequests(edits, CTX);
      assert.deepEqual(requests, [
        {
          url: "/api/v1/patient/pat-1/diagnosis/upsert/",
          method: "POST",
          body: {
            datapoints: [{ ...created, note: "reviewed", encounter: "enc-1" }],
          },
          reference_id: "structured:diagnosis:q-1",
        },
      ]);
      const sent = (requests[0].body as { datapoints: DiagnosisRow[] })
        .datapoints[0];
      assert.equal("dirty" in sent, false);
    });

    it("sends nothing without a patient in context", async () => {
      const created = newDiagnosisRow(
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
      const created = newDiagnosisRow(
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
      const created = newDiagnosisRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      let log = applyEditToLog<DiagnosisRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      assert.equal(log.length, 1);

      log = applyEditToLog<DiagnosisRow>(
        log,
        { rowId: "row-a", op: "remove", patch: created },
        { baseline: undefined },
      );
      assert.deepEqual(log, []);
      assert.deepEqual(await toRequests(log, CTX), []);
    });

    it("removing a BASELINE row soft-deletes it — flips verification_status to entered_in_error and keeps it in the request", async () => {
      const server = serverDiagnosis({
        id: "row-a",
        verification_status: "confirmed",
      });
      const baseline: readonly BaselineRow<DiagnosisRow>[] = toBaselineRows([
        server,
      ]);
      const baselineMap = toBaselineMap(baseline);

      // Mirrors `useStructuredRows.removeRow` -> `resolveRemoveIntent` ->
      // `applyEditToLog`, through the REAL functions, not a hand-written
      // edit — the entered-in-error split is core's job, not this differ's,
      // and this proves the wiring end to end.
      const entry = projectRows(baseline, [], {
        softDelete: DIAGNOSIS_SOFT_DELETE,
      })[0];
      assert.ok(entry);
      const removeEdit: StructuredEdit<DiagnosisRow> = {
        rowId: entry.rowId,
        op: "update",
        patch: { ...entry.row, ...DIAGNOSIS_SOFT_DELETE.patch },
      };
      const log = applyEditToLog<DiagnosisRow>([], removeEdit, {
        baseline: baselineMap,
      });

      const requests = await toRequests(log, CTX);
      assert.equal(requests.length, 1);
      const datapoints = (requests[0].body as { datapoints: DiagnosisRow[] })
        .datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "row-a");
      assert.equal(datapoints[0].verification_status, "entered_in_error");
    });

    it("PROJECTION AND SUBMIT AGREE: what the clinician sees editing a baseline row is exactly what gets submitted", async () => {
      const server = serverDiagnosis({ id: "row-a", severity: "mild" });
      const baseline = toBaselineRows([server]);
      const baselineMap = toBaselineMap(baseline);

      const edited = { ...toDiagnosisRow(server), severity: "severe" as const };
      const log = applyEditToLog<DiagnosisRow>(
        [],
        { rowId: "row-a", op: "update", patch: edited },
        { baseline: baselineMap },
      );

      const projectedRows = projectRows(baseline, log, {}).map((r) => r.row);
      const projection = projectValues(projectedRows);
      const requests = await toRequests(log, CTX);

      const projectedSeverity = (
        projection[0] as { type: "diagnosis"; value: DiagnosisRow[] }
      ).value[0].severity;
      const submittedSeverity = (
        requests[0].body as { datapoints: DiagnosisRow[] }
      ).datapoints[0].severity;

      assert.equal(projectedSeverity, "severe");
      assert.equal(submittedSeverity, "severe");
    });

    it("PROJECTION AND SUBMIT AGREE across a displayOrder sort: the sorted view must not change what submits", async () => {
      const d1 = serverDiagnosis({
        id: "d1",
        onset: { onset_datetime: "2026-03-01" },
      });
      const d2 = serverDiagnosis({
        id: "d2",
        onset: { onset_datetime: "2026-01-01" },
      });
      const baseline = toBaselineRows([d1, d2]);
      const baselineMap = toBaselineMap(baseline);

      const editedD1 = { ...toDiagnosisRow(d1), severity: "severe" as const };
      const log = applyEditToLog<DiagnosisRow>(
        [],
        { rowId: "d1", op: "update", patch: editedD1 },
        { baseline: baselineMap },
      );

      // Sorted view: d2 (Jan) before d1 (Mar).
      const sortedProjection = projectRows(baseline, log, {
        displayOrder: diagnosisDisplayOrder,
      });
      assert.deepEqual(
        sortedProjection.map((r) => r.rowId),
        ["d2", "d1"],
      );

      // Submit reads ONLY the edit log — never the sorted projection — so
      // it must still carry exactly the one touched row, regardless of
      // where the display sort placed it.
      const requests = await toRequests(log, CTX);
      const datapoints = (requests[0].body as { datapoints: DiagnosisRow[] })
        .datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "d1");
      assert.equal(datapoints[0].severity, "severe");
    });
  });
});

describe("rowSchema — the assistant write guard", () => {
  const code = { code: "1", display: "Hypertension", system: "sys" };

  it("accepts a real row", () => {
    assert.equal(
      rowSchema.safeParse(newDiagnosisRow(code, "enc-1")).success,
      true,
    );
  });

  it("accepts a null severity", () => {
    assert.equal(
      rowSchema.safeParse({ ...newDiagnosisRow(code, "enc-1"), severity: null })
        .success,
      true,
    );
  });

  it("accepts a baseline row converted via toDiagnosisRow", () => {
    const server = serverDiagnosis({
      created_by: {
        id: "user-1",
        username: "care-doctor",
      } as Diagnosis["created_by"],
    });
    const result = rowSchema.safeParse(toDiagnosisRow(server));
    assert.equal(result.success, true, JSON.stringify(result));
  });

  it("rejects an unknown field, including the legacy dirty flag", () => {
    assert.equal(
      rowSchema.safeParse({ ...newDiagnosisRow(code, "enc-1"), dirty: true })
        .success,
      false,
    );
  });

  it("rejects an invalid category enum value", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newDiagnosisRow(code, "enc-1"),
        category: "made_up_category",
      }).success,
      false,
    );
  });

  it("rejects an invalid severity string", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newDiagnosisRow(code, "enc-1"),
        severity: "extreme",
      }).success,
      false,
    );
  });

  it("rejects a malformed onset_datetime", () => {
    assert.equal(
      rowSchema.safeParse({
        ...newDiagnosisRow(code, "enc-1"),
        onset: { onset_datetime: "2024-02-31" },
      }).success,
      false,
    );
  });
});
