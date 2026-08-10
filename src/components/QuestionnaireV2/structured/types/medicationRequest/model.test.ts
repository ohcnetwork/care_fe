import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Code } from "@/types/base/code/code";
import type {
  MedicationRequestDispenseStatus,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import type { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { ProductKnowledgeType } from "@/types/inventory/productKnowledge/productKnowledge";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import type { UserReadMinimal } from "@/types/user/user";

import type { MedicationRequestRow } from "./model";
import {
  buildMedicationRequestForTemplate,
  dosageInstructionFieldKeys,
  invalidDosageFieldErrors,
  maxDosageInstructionCount,
  MEDICATION_REQUEST_SOFT_DELETE,
  medicationRowFromTemplate,
  newMedicationRowFromCode,
  newMedicationRowFromProduct,
  projectValues,
  toBaselineRows,
  toMedicationRow,
  toRequests,
} from "./model";

const CTX = {
  patientId: "pat-1",
  encounterId: "enc-1",
  questionId: "q-1",
} as const;

const CURRENT_USER = {
  id: "user-1",
  username: "care-doctor",
} as UserReadMinimal;
const OTHER_USER = { id: "user-2", username: "care-nurse" } as UserReadMinimal;

const CODE: Code = { code: "1", display: "Paracetamol", system: "sys" };

function dose(value = "1"): MedicationRequestDosageInstruction {
  return {
    as_needed_boolean: false,
    dose_and_rate: {
      type: "ordered",
      dose_quantity: {
        value,
        unit: { code: "{tbl}", display: "tablets", system: "u" },
      },
    },
    timing: {
      repeat: { frequency: 1, period: "1", period_unit: "d" },
      code: { code: "QD", display: "Once a day", system: "sys" },
    },
  };
}

function serverMedication(
  overrides: Partial<MedicationRequestRead> = {},
): MedicationRequestRead {
  return {
    id: "med-1",
    status: "active",
    intent: "order",
    category: "inpatient",
    priority: "routine" as MedicationRequestRead["priority"],
    do_not_perform: false,
    medication: CODE,
    encounter: "enc-0",
    dosage_instruction: [dose()],
    created_date: "2026-01-01T00:00:00Z",
    modified_date: "2026-01-01T00:00:00Z",
    created_by: CURRENT_USER,
    updated_by: CURRENT_USER,
    authored_on: "2026-01-01T00:00:00Z",
    requester: CURRENT_USER,
    ...overrides,
  };
}

function add(
  rowId: string,
  patch: MedicationRequestRow,
): StructuredEdit<MedicationRequestRow> {
  return { rowId, op: "add", patch };
}
function update(
  rowId: string,
  patch: MedicationRequestRow,
): StructuredEdit<MedicationRequestRow> {
  return { rowId, op: "update", patch };
}
function remove(
  rowId: string,
  patch: MedicationRequestRow,
): StructuredEdit<MedicationRequestRow> {
  return { rowId, op: "remove", patch };
}

describe("medication_request model", () => {
  describe("toMedicationRow", () => {
    it("splits requested_product into id + internal object, and never writes dirty", () => {
      const product = { id: "prod-1", name: "Widget" } as ProductKnowledgeBase;
      const medication = serverMedication({ requested_product: product });
      const row = toMedicationRow(medication, CURRENT_USER);
      assert.equal(row.requested_product, "prod-1");
      assert.equal(row.requested_product_internal, product);
      assert.equal("dirty" in row, false);
    });

    it("defaults requester to the current user when the server row has none", () => {
      const medication = serverMedication({ requester: undefined });
      const row = toMedicationRow(medication, CURRENT_USER);
      assert.equal(row.requester, CURRENT_USER);
    });

    it("keeps the server's own requester when present", () => {
      const medication = serverMedication({ requester: OTHER_USER });
      const row = toMedicationRow(medication, CURRENT_USER);
      assert.equal(row.requester, OTHER_USER);
    });

    it("leaves the read shape's audit and expansion fields behind", () => {
      const row = toMedicationRow(
        serverMedication({
          prescription: {
            id: "presc-1",
          } as MedicationRequestRead["prescription"],
          inventory_items_internal: [],
        }),
        CURRENT_USER,
      );
      for (const key of [
        "created_date",
        "modified_date",
        "updated_by",
        "prescription",
        "inventory_items_internal",
      ]) {
        assert.equal(key in row, false, `${key} rode into the row`);
      }
    });
  });

  describe("toBaselineRows", () => {
    it("keys each row by the server id", () => {
      const a = serverMedication({ id: "a" });
      const b = serverMedication({ id: "b" });
      const rows = toBaselineRows([a, b], CURRENT_USER);
      assert.deepEqual(
        rows.map((r) => r.rowId),
        ["a", "b"],
      );
      assert.deepEqual(rows[0].row, toMedicationRow(a, CURRENT_USER));
    });

    it("an empty fetch is an honest, complete empty baseline", () => {
      assert.deepEqual(toBaselineRows([], CURRENT_USER), []);
    });
  });

  describe("newMedicationRowFromCode", () => {
    it("seeds an active/order/routine/inpatient request with one PRN-off instruction, without dirty", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      assert.equal(row.medication, CODE);
      assert.equal(row.status, "active");
      assert.equal(row.intent, "order");
      assert.equal(row.dosage_instruction.length, 1);
      assert.equal(row.dosage_instruction[0].as_needed_boolean, false);
      assert.equal(row.requester, CURRENT_USER);
      assert.equal(row.create_prescription?.alternate_identifier, "");
      assert.equal("dirty" in row, false);
    });
  });

  describe("newMedicationRowFromProduct", () => {
    const product = {
      id: "prod-1",
      name: "Bandage",
      product_type: "medication",
      base_unit: { code: "{tbl}", display: "tablets", system: "u" },
    } as unknown as ProductKnowledgeBase;

    it("carries the product id and internal object", () => {
      const row = newMedicationRowFromProduct(product, CURRENT_USER);
      assert.equal(row.requested_product, "prod-1");
      assert.equal(row.requested_product_internal, product);
      assert.equal(row.dosage_instruction[0].as_needed_boolean, false);
    });

    it("overrides the first instruction to PRN for a consumable product", () => {
      const consumable = {
        ...product,
        product_type: "consumable",
      } as unknown as ProductKnowledgeBase;
      const row = newMedicationRowFromProduct(consumable, CURRENT_USER);
      assert.equal(row.dosage_instruction.length, 1);
      assert.equal(row.dosage_instruction[0].as_needed_boolean, true);
      assert.equal(row.dosage_instruction[0].timing, undefined);
    });
  });

  describe("MEDICATION_REQUEST_SOFT_DELETE", () => {
    it("marks entered_in_error and recognizes it back", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      const patched = { ...row, ...MEDICATION_REQUEST_SOFT_DELETE.patch };
      assert.equal(patched.status, "entered_in_error");
      assert.equal(MEDICATION_REQUEST_SOFT_DELETE.isDeleted(patched), true);
      assert.equal(MEDICATION_REQUEST_SOFT_DELETE.isDeleted(row), false);
    });
  });

  describe("projectValues", () => {
    it("empty rows project to []", () => {
      assert.deepEqual(projectValues([]), []);
    });
    it("non-empty rows project to one medication_request entry carrying every row", () => {
      const rows = [newMedicationRowFromCode(CODE, CURRENT_USER)];
      assert.deepEqual(projectValues(rows), [
        { type: "medication_request", value: rows },
      ]);
    });
  });

  describe("toRequests", () => {
    it("an empty edit log produces ZERO requests, however many medications are on record", async () => {
      const requests = await toRequests([], CTX);
      assert.deepEqual(requests, []);
    });

    it("no patientId => []", async () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      const requests = await toRequests([add("m1", row)], {
        ...CTX,
        patientId: undefined,
      });
      assert.deepEqual(requests, []);
    });

    it("a single new medication posts to the upsert endpoint with a generated prescription", async () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      const requests = await toRequests([add("m1", row)], CTX);
      assert.equal(requests.length, 1);
      const [request] = requests;
      assert.equal(
        request.url,
        "/api/v1/patient/pat-1/medication/request/upsert/",
      );
      assert.equal(request.method, "POST");
      assert.equal(request.reference_id, "structured:medication_request:q-1");
      const body = request.body as { datapoints: Record<string, unknown>[] };
      assert.equal(body.datapoints.length, 1);
      const [datapoint] = body.datapoints;
      assert.equal(datapoint.encounter, "enc-1");
      assert.equal(datapoint.patient, "pat-1");
      assert.equal(datapoint.requester, "user-1");
      const createPrescription = datapoint.create_prescription as {
        status: string;
        alternate_identifier: string;
      };
      assert.equal(createPrescription.status, "active");
      assert.ok(createPrescription.alternate_identifier.startsWith("enc-1-"));
    });

    it("two new medications in the SAME submission share one prescription identifier", async () => {
      const rowA = newMedicationRowFromCode(CODE, CURRENT_USER);
      const rowB = newMedicationRowFromCode(
        { code: "2", display: "Ibuprofen", system: "sys" },
        CURRENT_USER,
      );
      const requests = await toRequests(
        [add("m1", rowA), add("m2", rowB)],
        CTX,
      );
      const body = requests[0].body as {
        datapoints: { create_prescription: { alternate_identifier: string } }[];
      };
      assert.equal(body.datapoints.length, 2);
      assert.equal(
        body.datapoints[0].create_prescription.alternate_identifier,
        body.datapoints[1].create_prescription.alternate_identifier,
      );
    });

    it("the prescription note typed on one new row reaches EVERY new row", async () => {
      // The editor can only write the note onto one row (add A, type the
      // note, add B), so ordering must not decide which datapoint the
      // server reads it from.
      const rowA = newMedicationRowFromCode(CODE, CURRENT_USER);
      const rowB = newMedicationRowFromCode(
        { code: "2", display: "Ibuprofen", system: "sys" },
        CURRENT_USER,
      );
      const noted = {
        ...rowA,
        create_prescription: {
          ...rowA.create_prescription!,
          note: "morning round",
        },
      };
      const requests = await toRequests(
        [add("m1", noted), add("m2", rowB)],
        CTX,
      );
      const body = requests[0].body as {
        datapoints: { create_prescription: { note?: string } }[];
      };
      assert.equal(
        body.datapoints[0].create_prescription.note,
        "morning round",
      );
      assert.equal(
        body.datapoints[1].create_prescription.note,
        "morning round",
      );
    });

    it("fans the note out even when the row carrying it is not the first create", async () => {
      const rowA = newMedicationRowFromCode(CODE, CURRENT_USER);
      const rowB = newMedicationRowFromCode(
        { code: "2", display: "Ibuprofen", system: "sys" },
        CURRENT_USER,
      );
      const noted = {
        ...rowB,
        create_prescription: {
          ...rowB.create_prescription!,
          note: "after food",
        },
      };
      const requests = await toRequests(
        [add("m1", rowA), add("m2", noted)],
        CTX,
      );
      const body = requests[0].body as {
        datapoints: { create_prescription: { note?: string } }[];
      };
      assert.equal(body.datapoints[0].create_prescription.note, "after food");
      assert.equal(body.datapoints[1].create_prescription.note, "after food");
    });

    it("an existing medication never picks up the new rows' prescription note", async () => {
      const server = serverMedication({ id: "med-1" });
      const existing = toMedicationRow(server, CURRENT_USER);
      const fresh = newMedicationRowFromCode(CODE, CURRENT_USER);
      const noted = {
        ...fresh,
        create_prescription: {
          ...fresh.create_prescription!,
          note: "morning round",
        },
      };
      const requests = await toRequests(
        [update("med-1", existing), add("m1", noted)],
        CTX,
      );
      const body = requests[0].body as {
        datapoints: Record<string, unknown>[];
      };
      const existingDatapoint = body.datapoints.find(
        (datapoint) => datapoint.id === "med-1",
      )!;
      assert.equal("create_prescription" in existingDatapoint, false);
    });

    it("an update to an existing medication carries no create_prescription", async () => {
      const server = serverMedication({ id: "med-1" });
      const row = toMedicationRow(server, CURRENT_USER);
      const edited = { ...row, note: "take with food" };
      const requests = await toRequests([update("med-1", edited)], CTX);
      const body = requests[0].body as {
        datapoints: Record<string, unknown>[];
      };
      assert.equal(body.datapoints[0].id, "med-1");
      assert.equal("create_prescription" in body.datapoints[0], false);
      assert.equal(body.datapoints[0].note, "take with food");
    });

    it("sanitizes a blank/whitespace note to undefined", async () => {
      const row = {
        ...newMedicationRowFromCode(CODE, CURRENT_USER),
        note: "   ",
      };
      const requests = await toRequests([add("m1", row)], CTX);
      const body = requests[0].body as {
        datapoints: Record<string, unknown>[];
      };
      assert.equal(body.datapoints[0].note, undefined);
    });

    it("a soft-deleted (entered_in_error) baseline row is sent with its marker", async () => {
      const server = serverMedication({ id: "med-1" });
      const row = toMedicationRow(server, CURRENT_USER);
      const requests = await toRequests(
        [
          {
            rowId: "med-1",
            op: "update",
            patch: { ...row, status: "entered_in_error" },
          },
        ],
        CTX,
      );
      const body = requests[0].body as {
        datapoints: Record<string, unknown>[];
      };
      assert.equal(body.datapoints[0].status, "entered_in_error");
      assert.equal(body.datapoints[0].id, "med-1");
    });

    it("a bare remove edit for a row with no server id still submits as a soft-delete (entered_in_error) datapoint", async () => {
      // An add-then-remove pair is annihilated by editLog.ts before this
      // function ever sees it; this pins that a bare `remove` edit for a
      // row with no server id still resolves (soft-delete body), matching
      // resolveChanges' own documented contract.
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      const requests = await toRequests([remove("m1", row)], CTX);
      const body = requests[0].body as {
        datapoints: Record<string, unknown>[];
      };
      assert.equal(body.datapoints[0].status, "entered_in_error");
    });

    it("PROJECTION AND SUBMIT AGREE: editing one field of a baseline row projects and submits the identical content", async () => {
      const server = serverMedication({ id: "med-1" });
      const baseline = toMedicationRow(server, CURRENT_USER);
      const edited = { ...baseline, note: "twice daily" };
      const edits = [update("med-1", edited)];

      const projected = projectValues([edited]);
      const requests = await toRequests(edits, CTX);
      const body = requests[0].body as {
        datapoints: Record<string, unknown>[];
      };

      const projectedRow = (
        projected[0] as { type: string; value: MedicationRequestRow[] }
      ).value[0];
      assert.equal(projectedRow.note, "twice daily");
      assert.equal(body.datapoints[0].note, "twice daily");
    });
  });

  describe("maxDosageInstructionCount / dosageInstructionFieldKeys", () => {
    it("is 1 when there are no rows yet", () => {
      assert.equal(maxDosageInstructionCount([]), 1);
    });

    it("is the largest instruction count across rows", () => {
      const rows = [
        { row: { dosage_instruction: [dose()] } as MedicationRequestRow },
        {
          row: {
            dosage_instruction: [dose(), dose(), dose()],
          } as MedicationRequestRow,
        },
      ];
      assert.equal(maxDosageInstructionCount(rows), 3);
    });

    it("builds one field key per index", () => {
      assert.deepEqual(dosageInstructionFieldKeys(3, "dose"), [
        "dosage_instruction[0].dose",
        "dosage_instruction[1].dose",
        "dosage_instruction[2].dose",
      ]);
    });
  });

  describe("invalidDosageFieldErrors", () => {
    it("a fully valid single instruction produces no errors", () => {
      const row = { ...newMedicationRowFromCode(CODE, CURRENT_USER) };
      row.dosage_instruction = [dose()];
      assert.deepEqual(invalidDosageFieldErrors([add("m1", row)]), []);
    });

    it("a missing dose quantity is reported at index 0", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [{ as_needed_boolean: false }];
      const errors = invalidDosageFieldErrors([add("m1", row)]);
      assert.deepEqual(errors, [
        {
          rowId: "m1",
          fieldKey: "dosage_instruction[0].dose",
          kind: "required",
        },
        {
          rowId: "m1",
          fieldKey: "dosage_instruction[0].frequency",
          kind: "required",
        },
      ]);
    });

    it("a zero or negative dose quantity is invalid", () => {
      const zero = dose("0");
      const negative = dose("-1");
      for (const instruction of [zero, negative]) {
        const row = newMedicationRowFromCode(CODE, CURRENT_USER);
        row.dosage_instruction = [instruction];
        const errors = invalidDosageFieldErrors([add("m1", row)]);
        assert.ok(
          errors.some((e) => e.fieldKey === "dosage_instruction[0].dose"),
        );
      }
    });

    it("a dose range with both bounds positive is valid", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [
        {
          as_needed_boolean: false,
          dose_and_rate: {
            type: "ordered",
            dose_range: {
              low: {
                value: "1",
                unit: { code: "{tbl}", display: "tablets", system: "u" },
              },
              high: {
                value: "2",
                unit: { code: "{tbl}", display: "tablets", system: "u" },
              },
            },
          },
          timing: {
            repeat: { frequency: 1, period: "1", period_unit: "d" },
            code: { code: "QD", display: "Once a day", system: "sys" },
          },
        },
      ];
      assert.deepEqual(invalidDosageFieldErrors([add("m1", row)]), []);
    });

    it("a dose range with a non-positive bound is invalid", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [
        {
          as_needed_boolean: false,
          dose_and_rate: {
            type: "ordered",
            dose_range: {
              low: {
                value: "0",
                unit: { code: "{tbl}", display: "tablets", system: "u" },
              },
              high: {
                value: "2",
                unit: { code: "{tbl}", display: "tablets", system: "u" },
              },
            },
          },
        },
      ];
      const errors = invalidDosageFieldErrors([add("m1", row)]);
      assert.ok(
        errors.some((e) => e.fieldKey === "dosage_instruction[0].dose"),
      );
    });

    it("as_needed_boolean alone satisfies frequency with no dose set required separately", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [
        {
          as_needed_boolean: true,
          dose_and_rate: {
            type: "ordered",
            dose_quantity: {
              value: "1",
              unit: { code: "{tbl}", display: "tablets", system: "u" },
            },
          },
        },
      ];
      const errors = invalidDosageFieldErrors([add("m1", row)]);
      assert.deepEqual(
        errors.filter((e) => e.fieldKey.endsWith(".frequency")),
        [],
      );
    });

    it("free text frequency satisfies the frequency check", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [
        {
          as_needed_boolean: false,
          text: "1-0-1",
          dose_and_rate: {
            type: "ordered",
            dose_quantity: {
              value: "1",
              unit: { code: "{tbl}", display: "tablets", system: "u" },
            },
          },
        },
      ];
      assert.deepEqual(invalidDosageFieldErrors([add("m1", row)]), []);
    });

    it("a bare timing with no code and not as-needed fails frequency (setting duration alone must not satisfy it)", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [
        {
          as_needed_boolean: false,
          dose_and_rate: {
            type: "ordered",
            dose_quantity: {
              value: "1",
              unit: { code: "{tbl}", display: "tablets", system: "u" },
            },
          },
          timing: {
            repeat: {
              frequency: 1,
              period: "1",
              period_unit: "d",
              bounds_duration: { value: "5", unit: "d" },
            },
          },
        },
      ];
      const errors = invalidDosageFieldErrors([add("m1", row)]);
      assert.ok(
        errors.some((e) => e.fieldKey === "dosage_instruction[0].frequency"),
      );
    });

    it("an invalid duration range (low > high) is reported with the duration kind", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [
        {
          ...dose(),
          timing: {
            repeat: {
              frequency: 1,
              period: "1",
              period_unit: "d",
              bounds_range: {
                low: { value: "10", unit: "d" },
                high: { value: "5", unit: "d" },
              },
            },
            code: { code: "QD", display: "Once a day", system: "sys" },
          },
        },
      ];
      const errors = invalidDosageFieldErrors([add("m1", row)]);
      const durationError = errors.find((e) =>
        e.fieldKey.endsWith(".duration"),
      );
      assert.ok(durationError);
      assert.equal(durationError!.kind, "duration");
      assert.equal(durationError!.durationError, "invalid_day_range");
    });

    it("no scheduling bound at all is not a duration error (duration is optional)", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [dose()];
      const errors = invalidDosageFieldErrors([add("m1", row)]);
      assert.deepEqual(
        errors.filter((e) => e.fieldKey.endsWith(".duration")),
        [],
      );
    });

    it("multiple dosage instructions each get their own indexed errors", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [
        { as_needed_boolean: false }, // invalid dose + frequency at [0]
        dose(), // valid at [1]
      ];
      const errors = invalidDosageFieldErrors([add("m1", row)]);
      assert.deepEqual(
        errors.map((e) => e.fieldKey).sort(),
        [
          "dosage_instruction[0].dose",
          "dosage_instruction[0].frequency",
        ].sort(),
      );
    });

    it("an entered_in_error row is skipped entirely, however invalid its dosage", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.status = "entered_in_error";
      row.dosage_instruction = [{ as_needed_boolean: false }];
      assert.deepEqual(invalidDosageFieldErrors([update("m1", row)]), []);
    });

    it("a remove op is skipped — the row is on its way out, not something to still fix", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [{ as_needed_boolean: false }];
      assert.deepEqual(invalidDosageFieldErrors([remove("m1", row)]), []);
    });

    it("an empty dosage_instruction array is a row-level required error, not per-index", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.dosage_instruction = [];
      assert.deepEqual(invalidDosageFieldErrors([add("m1", row)]), [
        { rowId: "m1", fieldKey: "dosage_instruction", kind: "required" },
      ]);
    });

    it("an untouched baseline medication (no edit at all) is never validated", () => {
      // Nothing to pass — invalidDosageFieldErrors only ever sees `edits`,
      // and an untouched row contributes none.
      assert.deepEqual(invalidDosageFieldErrors([]), []);
    });
  });

  describe("buildMedicationRequestForTemplate", () => {
    it("a product-based row stores the PRODUCT'S SLUG, not its id, and omits medication", () => {
      const product = {
        id: "prod-1",
        slug: "paracetamol-500mg",
        name: "Paracetamol 500mg",
      } as ProductKnowledgeBase;
      const row = newMedicationRowFromProduct(product, CURRENT_USER);
      const spec = buildMedicationRequestForTemplate(row);
      assert.equal(spec.requested_product, "paracetamol-500mg");
      assert.equal("medication" in spec, false);
    });

    it("a code-based row keeps medication and omits requested_product", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      const spec = buildMedicationRequestForTemplate(row);
      assert.deepEqual(spec.medication, CODE);
      assert.equal("requested_product" in spec, false);
    });

    it("strips every instance-specific field a template must not remember", () => {
      const row = {
        ...newMedicationRowFromCode(CODE, CURRENT_USER),
        id: "med-1",
        encounter: "enc-1",
        created_by: CURRENT_USER,
        dispense_status: "complete" as MedicationRequestDispenseStatus,
      };
      const spec = buildMedicationRequestForTemplate(row);
      for (const key of [
        "id",
        "encounter",
        "requester",
        "created_by",
        "dispense_status",
        "create_prescription",
        "dirty",
      ]) {
        assert.equal(
          key in spec,
          false,
          `${key} must not survive into a template spec`,
        );
      }
    });

    it("carries authored_on along — a backend-required field on the template create serializer, found live (FIELD REQUIRED: template_data.medication_request.0.authored_on)", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      const spec = buildMedicationRequestForTemplate(row);
      assert.equal(spec.authored_on, row.authored_on);
    });

    it("carries dosage_instruction/status/intent/category/priority/note through unchanged", () => {
      const row = newMedicationRowFromCode(CODE, CURRENT_USER);
      row.note = "take with food";
      const spec = buildMedicationRequestForTemplate(row);
      assert.equal(spec.status, row.status);
      assert.equal(spec.intent, row.intent);
      assert.equal(spec.category, row.category);
      assert.equal(spec.priority, row.priority);
      assert.equal(spec.note, "take with food");
      assert.deepEqual(spec.dosage_instruction, row.dosage_instruction);
    });
  });

  describe("medicationRowFromTemplate", () => {
    it("resolves a code-based template spec into a fresh row: new authored_on, applying clinician as requester, a fresh create_prescription", () => {
      const spec = buildMedicationRequestForTemplate(
        newMedicationRowFromCode(CODE, OTHER_USER),
      );
      const row = medicationRowFromTemplate(spec, undefined, CURRENT_USER);
      assert.deepEqual(row.medication, CODE);
      assert.equal(row.requester, CURRENT_USER);
      assert.ok(row.create_prescription);
      assert.equal(row.requested_product, undefined);
      assert.equal(row.requested_product_internal, undefined);
      assert.equal("dirty" in row, false);
    });

    it("resolves a product-based template spec, threading the FETCHED product knowledge onto the row", () => {
      const product = {
        id: "prod-2",
        slug: "amoxicillin-250mg",
        name: "Amoxicillin 250mg",
        base_unit: { code: "{tbl}", display: "tablets", system: "u" },
        product_type: ProductKnowledgeType.medication,
      } as ProductKnowledgeBase;
      const spec = buildMedicationRequestForTemplate(
        newMedicationRowFromProduct(product, OTHER_USER),
      );
      assert.equal(spec.requested_product, "amoxicillin-250mg");
      const row = medicationRowFromTemplate(spec, product, CURRENT_USER);
      assert.equal(row.requested_product, "prod-2");
      assert.equal(row.requested_product_internal, product);
      assert.equal(row.requester, CURRENT_USER);
    });

    it("a product template resolved with NO product knowledge (fetch failed/absent) still resolves to a row, just without one", () => {
      const spec = buildMedicationRequestForTemplate(
        newMedicationRowFromProduct(
          { id: "prod-3", slug: "some-slug" } as ProductKnowledgeBase,
          OTHER_USER,
        ),
      );
      const row = medicationRowFromTemplate(spec, undefined, CURRENT_USER);
      assert.equal(row.requested_product, undefined);
      assert.equal(row.requested_product_internal, undefined);
    });

    it("defaults to one PRN-off dosage instruction when the template stored none", () => {
      const spec = buildMedicationRequestForTemplate(
        newMedicationRowFromCode(CODE, OTHER_USER),
      );
      spec.dosage_instruction = [];
      const row = medicationRowFromTemplate(spec, undefined, CURRENT_USER);
      assert.deepEqual(row.dosage_instruction, [{ as_needed_boolean: false }]);
    });

    it("PROJECTION AND SUBMIT AGREE — a template-resolved row differs onto the wire exactly like a directly picked one", async () => {
      const spec = buildMedicationRequestForTemplate(
        newMedicationRowFromCode(CODE, OTHER_USER),
      );
      const row = medicationRowFromTemplate(spec, undefined, CURRENT_USER);
      const edits = [add("m1", row)];
      assert.deepEqual(projectValues([row]), [
        { type: "medication_request", value: [row] },
      ]);
      const requests = await toRequests(edits, CTX);
      assert.equal(requests.length, 1);
      const body = requests[0].body as {
        datapoints: { medication?: Code }[];
      };
      assert.deepEqual(body.datapoints[0].medication, CODE);
    });
  });
});
