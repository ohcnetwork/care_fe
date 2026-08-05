import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SoftDeleteDescriptor } from "@/components/QuestionnaireV2/structured/core/types";
import { makeUpsertToRequests } from "@/components/QuestionnaireV2/structured/shared/upsertToRequests";

import type { StructuredEdit } from "@/types/questionnaire/structured";

/** A minimal stand-in for the four real upsert row shapes — the factory only
 *  ever reads `note`; everything else rides along untouched. */
interface TestRow {
  id?: string;
  label: string;
  status: "active" | "entered_in_error";
  note?: string;
}

const SOFT_DELETE: SoftDeleteDescriptor<TestRow> = {
  patch: { status: "entered_in_error" },
  isDeleted: (row) => row.status === "entered_in_error",
};

const CTX = {
  patientId: "pat-1",
  encounterId: "enc-1",
  questionId: "q-1",
} as const;

const toRequests = makeUpsertToRequests<TestRow>({
  type: "symptom",
  resource: "symptom",
  softDelete: SOFT_DELETE,
});

function row(overrides: Partial<TestRow> = {}): TestRow {
  return { label: "A", status: "active", ...overrides };
}

function edit(
  op: StructuredEdit<TestRow>["op"],
  rowId: string,
  patch: TestRow,
): StructuredEdit<TestRow> {
  return { rowId, op, patch };
}

function datapointsOf(body: unknown): Record<string, unknown>[] {
  return (body as { datapoints: Record<string, unknown>[] }).datapoints;
}

describe("makeUpsertToRequests", () => {
  it("an empty edit log produces zero requests", async () => {
    assert.deepEqual(await toRequests([], CTX), []);
  });

  it("compiles creates, updates and soft-deletes into ONE POST, in log order", async () => {
    const requests = await toRequests(
      [
        edit("add", "a", row({ label: "added" })),
        edit("update", "b", row({ id: "b", label: "updated" })),
        edit("remove", "c", row({ id: "c", label: "removed" })),
      ],
      CTX,
    );

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "/api/v1/patient/pat-1/symptom/upsert/");
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].reference_id, "structured:symptom:q-1");
    assert.deepEqual(
      datapointsOf(requests[0].body).map((datapoint) => datapoint.label),
      ["added", "updated", "removed"],
    );
  });

  it("a removed row carries the type's soft-delete marker", async () => {
    const requests = await toRequests(
      [edit("remove", "c", row({ id: "c" }))],
      CTX,
    );
    assert.equal(datapointsOf(requests[0].body)[0].status, "entered_in_error");
  });

  it("trims the note and drops a blank one, and re-stamps the CURRENT encounter", async () => {
    const requests = await toRequests(
      [
        edit("add", "a", row({ note: "  swelling  " })),
        edit("add", "b", row({ note: "   " })),
      ],
      CTX,
    );

    assert.deepEqual(datapointsOf(requests[0].body), [
      { label: "A", status: "active", note: "swelling", encounter: "enc-1" },
      { label: "A", status: "active", note: undefined, encounter: "enc-1" },
    ]);
  });

  it("`resource` may span several path segments", async () => {
    const statementRequests = await makeUpsertToRequests<TestRow>({
      type: "medication_statement",
      resource: "medication/statement",
      softDelete: SOFT_DELETE,
    })([edit("add", "a", row())], CTX);

    assert.equal(
      statementRequests[0].url,
      "/api/v1/patient/pat-1/medication/statement/upsert/",
    );
  });

  it("`decorateRow` stamps extra wire fields onto every datapoint", async () => {
    const requests = await makeUpsertToRequests<TestRow>({
      type: "medication_statement",
      resource: "medication/statement",
      softDelete: SOFT_DELETE,
      decorateRow: (_row, { patientId }) => ({ patient: patientId }),
    })([edit("add", "a", row()), edit("add", "b", row())], CTX);

    for (const datapoint of datapointsOf(requests[0].body)) {
      assert.equal(datapoint.patient, "pat-1");
    }
  });

  it("sends nothing without a patient in context", async () => {
    assert.deepEqual(
      await toRequests([edit("add", "a", row())], {
        encounterId: "enc-1",
        questionId: "q-1",
      }),
      [],
    );
  });

  it("sends nothing without an encounter in context", async () => {
    assert.deepEqual(
      await toRequests([edit("add", "a", row())], {
        patientId: "pat-1",
        questionId: "q-1",
      }),
      [],
    );
  });
});
