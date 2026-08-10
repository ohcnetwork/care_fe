import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";

import { format } from "date-fns";

import { findDuplicateCandidates } from "@/components/QuestionnaireV2/structured/core/duplicates";
import {
  applyEditToLog,
  toBaselineMap,
} from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import type { Symptom } from "@/types/emr/symptom/symptom";
import type { StructuredEdit } from "@/types/questionnaire/structured";

import type { SymptomRow } from "./model";
import {
  SYMPTOM_SOFT_DELETE,
  newSymptomRow,
  projectValues,
  symptomDuplicateKey,
  toBaselineRows,
  toRequests,
  toReusedSymptomRow,
  toSymptomRow,
} from "./model";

const CTX = {
  patientId: "pat-1",
  encounterId: "enc-1",
  questionId: "q-1",
} as const;

function serverSymptom(overrides: Partial<Symptom> = {}): Symptom {
  return {
    id: "symptom-1",
    code: { code: "1", display: "Headache", system: "sys" },
    clinical_status: "active",
    verification_status: "confirmed",
    severity: "moderate",
    onset: { onset_datetime: "2026-01-15T10:00:00+05:30" },
    recorded_date: "2026-01-15T10:00:00+05:30",
    note: "throbbing",
    created_by: {} as Symptom["created_by"],
    updated_by: {} as Symptom["updated_by"],
    category: "problem_list_item",
    encounter: "enc-0",
    created_date: "2026-01-01T00:00:00Z",
    updated_date: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function add(rowId: string, patch: SymptomRow): StructuredEdit<SymptomRow> {
  return { rowId, op: "add", patch };
}
function update(rowId: string, patch: SymptomRow): StructuredEdit<SymptomRow> {
  return { rowId, op: "update", patch };
}

describe("symptom model", () => {
  describe("toSymptomRow", () => {
    it("converts the read shape to the wire shape, reformatting onset.onset_datetime to a bare date", () => {
      const symptom = serverSymptom();
      assert.deepEqual(toSymptomRow(symptom), {
        id: "symptom-1",
        code: symptom.code,
        clinical_status: "active",
        verification_status: "confirmed",
        severity: "moderate",
        onset: { onset_datetime: "2026-01-15" },
        recorded_date: "2026-01-15T10:00:00+05:30",
        note: "throbbing",
        category: "problem_list_item",
        encounter: "enc-0",
        created_date: "2026-01-01T00:00:00Z",
        updated_date: "2026-01-01T00:00:00Z",
        created_by: symptom.created_by,
      });
    });

    it("omits onset entirely when the server never recorded one", () => {
      const symptom = serverSymptom({ onset: undefined });
      assert.equal(toSymptomRow(symptom).onset, undefined);
    });

    it("drops onset_datetime entirely when the server recorded none", () => {
      const symptom = serverSymptom({ onset: { note: "vague" } });
      assert.deepEqual(toSymptomRow(symptom).onset, { note: "vague" });
    });

    it("reads the same onset day in every browser timezone", () => {
      // This suite's own process runs in whatever TZ the machine/CI sets
      // (UTC or IST in practice), and both hide the shift: an onset stored
      // at the server's offset renders a day early west of it, and because
      // a patch is the complete row, editing any other field writes that
      // shifted onset back. `TZ` is read once at process start, so it can
      // only be pinned in a CHILD process.
      const modelUrl = new URL("./model.ts", import.meta.url).href;
      const script = `
        const assert = (await import("node:assert/strict")).default;
        const { toSymptomRow } = await import(${JSON.stringify(modelUrl)});
        const cases = [
          ["2026-01-15T10:00:00+05:30", "2026-01-15"],
          ["2026-01-15T00:00:00+05:30", "2026-01-15"],
          ["2026-08-01T00:00:00.000Z", "2026-08-01"],
        ];
        for (const [recorded, day] of cases) {
          const row = toSymptomRow({ onset: { onset_datetime: recorded } });
          assert.equal(row.onset.onset_datetime, day);
        }
      `;
      for (const tz of ["America/New_York", "Pacific/Kiritimati"]) {
        execFileSync(
          process.execPath,
          ["--import", "tsx", "--input-type=module", "-e", script],
          { env: { ...process.env, TZ: tz }, stdio: "pipe" },
        );
      }
    });
  });

  describe("toBaselineRows", () => {
    it("keys each row by the server id", () => {
      const a = serverSymptom({ id: "a" });
      const b = serverSymptom({ id: "b" });
      const rows = toBaselineRows([a, b]);
      assert.deepEqual(
        rows.map((r) => r.rowId),
        ["a", "b"],
      );
      assert.deepEqual(rows[0].row, toSymptomRow(a));
    });

    it("an empty fetch is an honest, complete empty baseline", () => {
      assert.deepEqual(toBaselineRows([]), []);
    });
  });

  describe("newSymptomRow", () => {
    it("seeds the legacy SYMPTOM_INITIAL_VALUE defaults, today's onset, plus the current encounter", () => {
      const code = { code: "9", display: "Nausea", system: "sys" };
      const today = format(new Date(), "yyyy-MM-dd");
      const row = newSymptomRow(code, "enc-9");
      assert.deepEqual(row, {
        code,
        clinical_status: "active",
        verification_status: "confirmed",
        severity: "moderate",
        category: "problem_list_item",
        onset: { onset_datetime: today },
        encounter: "enc-9",
      });
    });
  });

  describe("symptomDuplicateKey", () => {
    it("keys on the code, not the whole row", () => {
      const rowA = newSymptomRow(
        { code: "44B", display: "Cough", system: "s" },
        "enc-1",
      );
      const rowB = {
        ...newSymptomRow(
          { code: "44B", display: "Cough", system: "s" },
          "enc-1",
        ),
        severity: "severe" as const,
      };
      assert.equal(symptomDuplicateKey(rowA), "44B");
      assert.equal(symptomDuplicateKey(rowA), symptomDuplicateKey(rowB));
    });

    it("returns undefined for an empty code, excluding the row from duplicate matching", () => {
      const row = newSymptomRow(
        { code: "", display: "A", system: "s" },
        "enc-1",
      );
      assert.equal(symptomDuplicateKey(row), undefined);
    });

    it("wired through core/duplicates.ts reproduces the legacy exclusion of entered_in_error rows", () => {
      // A symptom already marked entered_in_error no longer blocks a
      // fresh add of the same code.
      const existing = {
        ...newSymptomRow({ code: "1", display: "A", system: "s" }, "enc-1"),
        verification_status: "entered_in_error" as const,
      };
      const baseline = toBaselineRows([
        { ...serverSymptom({ id: "row-a" }), code: existing.code },
      ]);
      const log: StructuredEdit<SymptomRow>[] = [update("row-a", existing)];
      const rows = projectRows(baseline, log, {
        softDelete: SYMPTOM_SOFT_DELETE,
      });
      const candidate = newSymptomRow(existing.code, "enc-1");
      assert.deepEqual(
        findDuplicateCandidates(rows, symptomDuplicateKey, [candidate]),
        [false],
      );
    });
  });

  describe("toReusedSymptomRow", () => {
    it("strips the server id and re-stamps the current encounter, keeping every other field", () => {
      const historical = {
        ...toSymptomRow(serverSymptom({ id: "old-id", encounter: "enc-0" })),
      };
      const reused = toReusedSymptomRow(historical, "enc-9");
      assert.equal(reused.id, undefined);
      assert.equal(reused.encounter, "enc-9");
      assert.equal(reused.code, historical.code);
      assert.equal(reused.severity, historical.severity);
      assert.equal(reused.note, historical.note);
    });
  });

  describe("projectValues", () => {
    it("projects an empty row set to NO values, so the section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects rows as one symptom entry, without aliasing the input array", () => {
      const rowA = newSymptomRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      const rowB = newSymptomRow(
        { code: "2", display: "B", system: "s" },
        "enc-1",
      );
      const rows = [rowA, rowB];

      const projected = projectValues(rows);

      assert.deepEqual(projected, [{ type: "symptom", value: [rowA, rowB] }]);
      assert.notEqual(
        (projected[0] as { type: "symptom"; value: SymptomRow[] }).value,
        rows,
      );
    });
  });

  describe("toRequests", () => {
    it("an empty edit log produces zero requests", async () => {
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("an untouched baseline (several existing symptoms, nothing edited) still produces zero requests", async () => {
      // Simulates a real mount: `SymptomEditor` seeds `useStructuredRows`
      // with three fetched symptoms as baseline; the clinician submits the
      // form without ever opening this section. `edits` stays `[]`
      // regardless of how much baseline exists.
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("editing ONE of several baseline rows sends ONLY that row — not every prefetched symptom", async () => {
      const rowB = {
        ...toSymptomRow(serverSymptom({ id: "b" })),
        severity: "severe" as const,
      };
      const edits = [update("b", rowB)];

      const requests = await toRequests(edits, CTX);

      assert.equal(requests.length, 1);
      const datapoints = (requests[0].body as { datapoints: SymptomRow[] })
        .datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "b");
    });

    it("a fresh add compiles ONE POST with the row in `datapoints`, note trimmed", async () => {
      const created = {
        ...newSymptomRow(
          { code: "1", display: "Headache", system: "s" },
          "enc-1",
        ),
        note: "  throbbing  ",
      };
      const edits = [add("row-a", created)];

      assert.deepEqual(await toRequests(edits, CTX), [
        {
          url: "/api/v1/patient/pat-1/symptom/upsert/",
          method: "POST",
          body: {
            datapoints: [{ ...created, note: "throbbing", encounter: "enc-1" }],
          },
          reference_id: "structured:symptom:q-1",
        },
      ]);
    });

    it("sends nothing without a patient in context", async () => {
      const created = newSymptomRow(
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
      const created = newSymptomRow(
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
      const created = newSymptomRow(
        { code: "1", display: "A", system: "s" },
        "enc-1",
      );
      let log = applyEditToLog<SymptomRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      assert.equal(log.length, 1);

      log = applyEditToLog<SymptomRow>(
        log,
        { rowId: "row-a", op: "remove", patch: created },
        { baseline: undefined },
      );
      assert.deepEqual(log, []);
      assert.deepEqual(await toRequests(log, CTX), []);
    });

    it("removing a BASELINE row soft-deletes it — flips verification_status to entered_in_error and keeps it in the request", async () => {
      const server = serverSymptom({
        id: "row-a",
        verification_status: "confirmed",
      });
      const baseline: readonly BaselineRow<SymptomRow>[] = toBaselineRows([
        server,
      ]);
      const baselineMap = toBaselineMap(baseline);

      // Mirrors `useStructuredRows.removeRow` -> `resolveRemoveIntent` ->
      // `applyEditToLog`, through the REAL functions, not a hand-written
      // edit.
      const entry = projectRows(baseline, [], {
        softDelete: SYMPTOM_SOFT_DELETE,
      })[0];
      assert.ok(entry);
      const removeEdit: StructuredEdit<SymptomRow> = {
        rowId: entry.rowId,
        op: "update",
        patch: { ...entry.row, ...SYMPTOM_SOFT_DELETE.patch },
      };
      const log = applyEditToLog<SymptomRow>([], removeEdit, {
        baseline: baselineMap,
      });

      const requests = await toRequests(log, CTX);
      assert.equal(requests.length, 1);
      const datapoints = (requests[0].body as { datapoints: SymptomRow[] })
        .datapoints;
      assert.equal(datapoints.length, 1);
      assert.equal(datapoints[0].id, "row-a");
      assert.equal(datapoints[0].verification_status, "entered_in_error");
    });

    it("PROJECTION AND SUBMIT AGREE: what the clinician sees editing a baseline row is exactly what gets submitted", async () => {
      const server = serverSymptom({ id: "row-a", severity: "mild" });
      const baseline = toBaselineRows([server]);
      const baselineMap = toBaselineMap(baseline);

      const edited = { ...toSymptomRow(server), severity: "severe" as const };
      const log = applyEditToLog<SymptomRow>(
        [],
        { rowId: "row-a", op: "update", patch: edited },
        { baseline: baselineMap },
      );

      const projectedRows = projectRows(baseline, log, {}).map((r) => r.row);
      const projection = projectValues(projectedRows);
      const requests = await toRequests(log, CTX);

      const projectedSeverity = (
        projection[0] as { type: "symptom"; value: SymptomRow[] }
      ).value[0].severity;
      const submittedSeverity = (
        requests[0].body as { datapoints: SymptomRow[] }
      ).datapoints[0].severity;

      assert.equal(projectedSeverity, "severe");
      assert.equal(submittedSeverity, "severe");
    });
  });
});
