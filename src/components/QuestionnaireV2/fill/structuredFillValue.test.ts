import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ResolvedStructuredType } from "@/components/QuestionnaireV2/structured/registry";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { coerceStructuredFillValue } from "./structuredFillValue";
import { structuredRecordSchemas } from "./structuredRecordSchema";
import type { FillSubject } from "./subject";

const subject: FillSubject = {
  type: "encounter",
  patientId: "patient-1",
  encounterId: "encounter-1",
  facilityId: "facility-1",
};

const code = {
  code: "386661006",
  system: "http://snomed.info/sct",
  display: "Fever",
};
const structuredRows = {
  allergy_intolerance: {
    code,
    clinical_status: "active",
    verification_status: "confirmed",
    category: "food",
    criticality: "low",
  },
  medication_statement: {
    medication: code,
    status: "active",
    information_source: "patient",
    dosage_text: "Once daily",
  },
  medication_request: {
    medication: code,
    dosage_instruction: [],
    authored_on: "2026-09-08",
    do_not_perform: false,
    requester: { id: "clinician" },
  },
  encounter: {
    status: "in_progress",
    priority: "routine",
    period: { start: "2026-09-08T10:00:00Z" },
  },
  appointment: { slot_id: "slot" },
  charge_item: { charge_item_definition: "consultation", quantity: "1" },
  service_request: {
    activity_definition: "blood-count",
    service_request: {
      title: "Blood count",
      code,
      status: "active",
      intent: "order",
      priority: "routine",
      category: "laboratory",
      do_not_perform: false,
      locations: [],
      requester: { id: "clinician" },
    },
  },
};

function clinicalRecord(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    code: {
      code: "386661006",
      system: "http://snomed.info/sct",
      display: "Fever",
    },
    clinical_status: "active",
    verification_status: "confirmed",
    severity: "moderate",
    category: "encounter_diagnosis",
    ...overrides,
  };
}

function coerce(
  type: NonNullable<Question["structured_type"]>,
  values: unknown[],
  currentRows: unknown[] = [],
  overrides: Partial<ResolvedStructuredType> = {},
) {
  const question: Question = {
    id: "question",
    link_id: "question",
    text: "Clinical data",
    type: "structured",
    structured_type: type,
    required: true,
  };
  const current: QuestionnaireResponse = {
    question_id: question.id,
    link_id: question.link_id,
    structured_type: type,
    values: [{ type, value: currentRows } as ResponseValue],
  };
  const definition = {
    type,
    component: () => null,
    requires: [],
    subjects: ["encounter"],
    draftPolicy: "serialize",
    source: "core",
    persistence: "batch",
    buildRequests: async () => [],
    ...overrides,
  } as ResolvedStructuredType;
  return coerceStructuredFillValue(
    question,
    values,
    current,
    definition,
    subject,
  );
}

describe("structured fill values", () => {
  it("preserves clinical fields, binds context, and marks diagnoses for submission", () => {
    const row = clinicalRecord({
      note: "Persistent fever",
      encounter: "other",
      dirty: false,
    });
    const result = coerce("diagnosis", [row]);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.value, {
      type: "diagnosis",
      value: [{ ...row, encounter: subject.encounterId, dirty: true }],
    });
    assert.equal(row.encounter, "other");
  });

  it("requires valid clinical codes and complete clinical request fields", () => {
    assert.equal(coerce("diagnosis", [{}]).ok, false);
    assert.equal(
      coerce("diagnosis", [clinicalRecord({ code: { code: "fever" } })]).ok,
      false,
    );
    assert.equal(
      coerce("symptom", [clinicalRecord({ severity: null })]).ok,
      false,
    );
    assert.equal(
      coerce("diagnosis", [clinicalRecord({ clinical_status: "unknown" })]).ok,
      false,
    );
  });

  it("rejects malformed optional clinical fields and accepts date-only onset values", () => {
    for (const type of ["diagnosis", "symptom"] as const) {
      for (const fields of [
        { note: 123 },
        { onset: "yesterday" },
        { onset: { onset_datetime: 123 } },
        { onset: { onset_age: 12 } },
        { onset: { onset_string: false } },
        { onset: { note: [] } },
        { recorded_date: 123 },
      ]) {
        assert.equal(coerce(type, [clinicalRecord(fields)]).ok, false);
      }
      assert.equal(
        coerce(type, [
          clinicalRecord({
            note: null,
            onset: { onset_datetime: "2026-09-08" },
            recorded_date: "2026-09-08",
          }),
        ]).ok,
        true,
      );
    }
  });

  it("rejects duplicate batch rows and updates matching saved clinical records", () => {
    for (const type of ["diagnosis", "symptom"] as const) {
      assert.equal(
        coerce(type, [clinicalRecord(), clinicalRecord()]).ok,
        false,
      );
      assert.equal(
        coerce(type, [clinicalRecord()], [clinicalRecord({ id: "saved" })]).ok,
        true,
      );
      assert.equal(
        coerce(
          type,
          [clinicalRecord({ id: "saved", severity: "severe" })],
          [clinicalRecord({ id: "saved" })],
        ).ok,
        true,
      );
      assert.equal(
        coerce(
          type,
          [clinicalRecord()],
          [
            clinicalRecord({
              id: "saved",
              verification_status: "entered_in_error",
            }),
          ],
        ).ok,
        true,
      );
    }
  });

  it("allows a replacement after an entered-in-error row inside the submitted array", () => {
    assert.equal(
      coerce("diagnosis", [
        clinicalRecord({ verification_status: "entered_in_error" }),
        clinicalRecord(),
      ]).ok,
      true,
    );
  });

  it("accepts repeating existing unsaved rows without adding duplicates", () => {
    for (const type of ["diagnosis", "symptom"] as const) {
      const first = clinicalRecord();
      const second = clinicalRecord({
        code: {
          code: "49727002",
          system: "http://snomed.info/sct",
          display: "Cough",
        },
      });
      assert.equal(coerce(type, [first]).ok, true);
      assert.equal(coerce(type, [first, second], [first]).ok, true);
      assert.equal(coerce(type, [first, second], [first, second]).ok, true);
    }
  });

  for (const type of ["diagnosis", "symptom", "allergy_intolerance"] as const) {
    const record = (
      overrides: Record<string, unknown> = {},
    ): Record<string, unknown> => ({
      ...(type === "allergy_intolerance"
        ? structuredRows.allergy_intolerance
        : clinicalRecord()),
      ...overrides,
    });
    const rowsOf = (result: ReturnType<typeof coerce>) => {
      if (!result.ok) assert.fail(result.error);
      return result.value.value as Record<string, unknown>[];
    };

    it(`${type}: appends rows while preserving invalid legacy and unsaved rows unchanged`, () => {
      const legacy = record({
        id: "legacy",
        code: { code: "legacy" },
        note: 123,
        dirty: false,
      });
      const unsaved = record({ code: { ...code, code: "unsaved" } });
      const incoming = record();
      let validations = 0;
      const rows = rowsOf(
        coerce(type, [incoming], [legacy, unsaved], {
          validate: (data, questionId, required) => {
            validations++;
            assert.equal(data.length, 1);
            assert.equal(
              (data[0] as { code: typeof code }).code.code,
              code.code,
            );
            assert.equal(questionId, "question");
            assert.equal(required, true);
            return [];
          },
        }),
      );
      assert.equal(validations, 1);
      assert.equal(rows.length, 3);
      assert.equal(rows[0], legacy);
      assert.equal(rows[1], unsaved);
      assert.deepEqual(rows[2].code, code);
    });

    it(`${type}: updates by code or id in place, retaining saved ids and unrelated rows`, () => {
      const saved = record({ id: "saved" });
      const unrelated = record({ code: { ...code, code: "unrelated" } });
      const update = record({ note: "Updated" });
      const rows = rowsOf(coerce(type, [update], [saved, unrelated]));
      assert.equal(rows.length, 2);
      assert.equal(rows[0].id, "saved");
      assert.equal(rows[0].note, "Updated");
      assert.equal(rows[1], unrelated);
      assert.equal(saved.note, undefined);

      const newCode = { ...code, code: "corrected" };
      const updated = rowsOf(
        coerce(type, [record({ id: "saved", code: newCode })], rows),
      );
      assert.equal(updated.length, 2);
      assert.equal(updated[0].id, "saved");
      assert.deepEqual(updated[0].code, newCode);
      assert.equal(updated[1], unrelated);

      const unsaved = rowsOf(coerce(type, [update], [record(), unrelated]));
      assert.equal(unsaved.length, 2);
      assert.equal(unsaved[0].note, "Updated");
      assert.equal(unsaved[1], unrelated);
    });

    it(`${type}: leaves rows alone for empty input and validates changed rows`, () => {
      const saved = record({ id: "saved" });
      const rows = rowsOf(
        coerce(type, [], [saved], {
          validate: () => {
            assert.fail("No changed rows to validate");
          },
        }),
      );
      assert.deepEqual(rows, [saved]);
      assert.equal(rows[0], saved);
      assert.equal(
        coerce(type, [record({ id: "saved", code: {} })], [saved]).ok,
        false,
      );
      for (const id of [123, "", null]) {
        assert.equal(coerce(type, [record({ id })], [saved]).ok, false);
      }
      assert.equal(
        coerce(type, [record({ id: "saved" })], [saved], {
          validate: () => [
            { question_id: "question", error: "Invalid update" },
          ],
        }).ok,
        false,
      );
    });

    it(`${type}: rejects conflicting ids, repeated ids, and code collisions atomically`, () => {
      const saved = record({ id: "saved" });
      const other = record({ id: "other", code: { ...code, code: "other" } });
      for (const incoming of [
        [record(), record()],
        [record({ id: "saved" }), record({ id: "saved", code: other.code })],
        [record({ id: "new-id" })],
        [record({ id: "other" })],
      ]) {
        const existing = structuredClone([saved, other]);
        assert.equal(coerce(type, incoming, existing).ok, false);
        assert.deepEqual(existing, [saved, other]);
      }
    });

    it(`${type}: preserves entered-in-error records when adding the same code again`, () => {
      const saved = record({
        id: "saved",
        verification_status: "entered_in_error",
      });
      const rows = rowsOf(coerce(type, [record()], [saved]));
      assert.equal(rows.length, 2);
      assert.equal(rows[0], saved);
      assert.equal(rows[1].id, undefined);
    });

    it(`${type}: updates a saved row to entered-in-error by code idempotently`, () => {
      const saved = record({ id: "saved" });
      const update = record({ verification_status: "entered_in_error" });
      const rows = rowsOf(coerce(type, [update], [saved]));
      assert.equal(rows.length, 1);
      assert.equal(rows[0].id, "saved");
      assert.equal(rows[0].verification_status, "entered_in_error");
      assert.deepEqual(rowsOf(coerce(type, [update], rows)), rows);

      const historical = record({
        id: "historical",
        verification_status: "entered_in_error",
      });
      const withHistory = rowsOf(coerce(type, [update], [historical, saved]));
      assert.equal(withHistory.length, 2);
      assert.equal(withHistory[0], historical);
      assert.equal(withHistory[1].id, "saved");
      assert.equal(withHistory[1].verification_status, "entered_in_error");
      // Several historical records with the same code require an explicit
      // id; never guess which to update or append another duplicate.
      assert.equal(coerce(type, [update], withHistory).ok, false);
    });
  }

  it("retains replacement and clearing behavior for other structured types", () => {
    const old = { ...structuredRows.medication_statement, id: "saved" };
    const replacement = {
      ...structuredRows.medication_statement,
      dosage_text: "Updated",
    };
    const result = coerce("medication_statement", [replacement], [old]);
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value.value, [replacement]);
    const cleared = coerce("medication_statement", [], [old]);
    assert.equal(cleared.ok, true);
    if (cleared.ok) assert.deepEqual(cleared.value.value, []);
  });

  it("uses the proposed status when replacing a saved row marked in error", () => {
    const saved = clinicalRecord({ id: "saved" });
    assert.equal(
      coerce(
        "diagnosis",
        [
          clinicalRecord(),
          { ...saved, verification_status: "entered_in_error" },
        ],
        [saved],
      ).ok,
      true,
    );
  });

  it("runs existing validators with the normalized rows, question id, and required flag", () => {
    const medication = { ...structuredRows.medication_request, dirty: false };
    const result = coerce("medication_request", [medication], [], {
      validate: (data, questionId, required) => {
        assert.deepEqual(data, [
          { ...medication, dirty: true, encounter: subject.encounterId },
        ]);
        assert.equal(questionId, "question");
        assert.equal(required, true);
        return [{ question_id: questionId, error: "Dosage is required" }];
      },
    });
    assert.deepEqual(result, { ok: false, error: "Dosage is required" });
    assert.equal(
      coerce("medication_request", [medication], [], {
        validate: () => {
          throw new TypeError("Missing dosage");
        },
      }).ok,
      false,
    );
  });

  it("binds service requests and charge items to the current patient and encounter", () => {
    const service = coerce("service_request", [
      {
        ...structuredRows.service_request,
        encounter: "other",
        service_request: {
          ...structuredRows.service_request.service_request,
          patient: "other",
          encounter: "other",
        },
      },
    ]);
    assert.equal(service.ok, true);
    if (service.ok)
      assert.deepEqual(service.value.value, [
        {
          ...structuredRows.service_request,
          encounter: subject.encounterId,
          service_request: {
            ...structuredRows.service_request.service_request,
            patient: subject.patientId,
            encounter: subject.encounterId,
          },
        },
      ]);
    const charge = coerce("charge_item", [
      { ...structuredRows.charge_item, patient: "other", encounter: "other" },
    ]);
    assert.equal(charge.ok, true);
    if (charge.ok)
      assert.deepEqual(charge.value.value, [
        {
          ...structuredRows.charge_item,
          patient: subject.patientId,
          encounter: subject.encounterId,
        },
      ]);
  });

  it("rejects empty core records and preserves complete records with display fields", () => {
    assert.deepEqual(
      Object.keys(structuredRows).sort(),
      Object.keys(structuredRecordSchemas).sort(),
    );
    for (const type of Object.keys(
      structuredRows,
    ) as (keyof typeof structuredRows)[]) {
      assert.equal(coerce(type, [{}]).ok, false, type);
      const result = coerce(type, [
        { ...structuredRows[type], display_label: "Retained detail" },
      ]);
      assert.equal(result.ok, true, type);
      if (!result.ok) continue;
      const row = (result.value.value as Record<string, unknown>[])[0];
      assert.equal(row.display_label, "Retained detail", type);
    }
  });

  it("accepts one zoned time of death and rejects date-only, invalid calendar dates, or multiple records", () => {
    assert.equal(
      coerce("time_of_death", ["2026-09-08T10:30:00+05:30"]).ok,
      true,
    );
    for (const value of [
      "2026-09-08",
      "10:30",
      "2026-02-30T10:30:00Z",
      "2026-09-08T10:30:00",
    ]) {
      assert.equal(coerce("time_of_death", [value]).ok, false, value);
    }
    assert.equal(
      coerce("time_of_death", ["2026-09-08T10:30:00Z", "2026-09-08T10:30:00Z"])
        .ok,
      false,
    );
  });

  it("rejects file payloads, invalid object rows, and multiple singleton records", () => {
    assert.equal(coerce("files", []).ok, false);
    assert.equal(
      coerce("demo.custom", [{}], [], { draftPolicy: "exclude" }).ok,
      false,
    );
    assert.equal(coerce("diagnosis", ["Fever"]).ok, false);
    assert.equal(coerce("encounter", [{}, {}]).ok, false);
    assert.equal(coerce("appointment", [{}, {}]).ok, false);
    assert.equal(coerce("demo.custom", [{ answer: "value" }]).ok, true);
  });
});
