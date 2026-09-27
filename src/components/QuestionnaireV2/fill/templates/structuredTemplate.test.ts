import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { test } from "node:test";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import type { QuestionnaireAnswer } from "@/types/questionnaire/questionnaireResponseTemplate";
import type { UserReadMinimal } from "@/types/user/user";

test("form order templates carry reusable configurations into the current encounter", async (t) => {
  const require = createRequire(import.meta.url);
  const configPath = require.resolve("@careConfig");
  const previousConfig = require.cache[configPath];
  const configModule = new Module(configPath);
  configModule.exports = {
    apiUrl: "http://localhost:9000",
    decimal: { precision: 20, rounding: 4, accountingPrecision: 2 },
  };
  configModule.loaded = true;
  require.cache[configPath] = configModule;
  const previousStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null },
  });
  const previousFetch = globalThis.fetch;
  const {
    serializeStructuredTemplateResponse,
    hydrateStructuredTemplateEntries,
  } = await import("./structuredTemplate");
  const code = { system: "test", code: "test", display: "Test" };
  const question: Question = {
    id: "medications",
    link_id: "medications",
    text: "Medications",
    type: "structured",
    structured_type: "medication_request",
  };
  const serviceQuestion: Question = {
    id: "services",
    link_id: "services",
    text: "Services",
    type: "structured",
    structured_type: "service_request",
  };
  const questionnaire = {
    questions: [question, serviceQuestion],
  } as QuestionnaireRead;
  const context = {
    subject: {
      patientId: "new-patient",
      encounterId: "new-encounter",
      facilityId: "new-facility",
      resourceId: "new-encounter",
    },
    currentUser: { id: "new-clinician" } as UserReadMinimal,
  };
  const dosage = {
    as_needed_boolean: false,
    dose_and_rate: {
      type: "ordered",
      dose_quantity: { value: "1", unit: code },
    },
    timing: {
      repeat: {
        frequency: 2,
        period: "1",
        period_unit: "d",
        bounds_duration: { value: "5", unit: "d" },
      },
    },
  };
  const original = {
    question_id: question.id,
    link_id: question.link_id,
    structured_type: "medication_request",
    values: [
      {
        type: "medication_request",
        value: [
          {
            id: "old-order",
            encounter: "old-encounter",
            requester: { id: "old-clinician" },
            authored_on: "2025-01-01",
            created_by: { id: "old-clinician" },
            requested_product: "old-product-id",
            requested_product_internal: {
              id: "old-product-id",
              slug: "medicine",
              name: "Medicine 500 mg",
            },
            do_not_perform: false,
            dosage_instruction: [dosage],
            status: "active",
            dirty: false,
            create_prescription: {
              alternate_identifier: "old-prescription",
              note: "Review after five days",
            },
          },
        ],
      },
    ],
    draft_context: [{ type: "medication_request", value: [] }],
    taken_at: "2025-01-01",
  } as unknown as QuestionnaireResponse;
  const serviceOriginal = {
    question_id: serviceQuestion.id,
    link_id: serviceQuestion.link_id,
    structured_type: "service_request",
    values: [
      {
        type: "service_request",
        value: [
          {
            encounter: "old-encounter",
            activity_definition: "blood-count",
            service_request: {
              id: "old-service",
              title: "Blood count",
              status: "active",
              intent: "order",
              priority: "routine",
              category: "laboratory",
              do_not_perform: false,
              code,
              body_site: null,
              note: "Review result",
              patient_instruction: null,
              occurance: null,
              requester: { id: "old-clinician" },
              locations: ["old-location"],
            },
          },
        ],
      },
    ],
  } as unknown as QuestionnaireResponse;
  const entry = (
    response: NonNullable<
      ReturnType<typeof serializeStructuredTemplateResponse>
    >,
  ): QuestionnaireAnswer => ({
    question_id: response.question_id,
    answer: { ...response },
    meta: { type: "structured" },
  });
  try {
    await t.test(
      "save and apply remove patient context while preserving dosage and resolving current catalog IDs",
      async () => {
        const savedMedication = serializeStructuredTemplateResponse(
          question,
          original,
        );
        const savedService = serializeStructuredTemplateResponse(
          serviceQuestion,
          serviceOriginal,
        );
        assert.ok(savedMedication && savedService);
        const persisted = JSON.stringify([savedMedication, savedService]);
        assert.equal(persisted.includes("old-"), false);
        assert.equal(persisted.includes("draft_context"), false);
        assert.equal(persisted.includes("2025-01-01"), false);
        const savedValue = savedMedication.values[0];
        assert.ok(savedValue.type === "medication_request");
        const savedOrder = savedValue.value?.[0];
        assert.ok(savedOrder && "requested_product_name" in savedOrder);
        assert.equal(savedOrder.requested_product_name, "Medicine 500 mg");
        assert.deepEqual(savedOrder.create_prescription, {
          note: "Review after five days",
        });
        const requests: { path: string; method: string | undefined }[] = [];
        globalThis.fetch = async (input, options) => {
          const path = new URL(String(input)).pathname;
          requests.push({ path, method: options?.method });
          return Response.json(
            path.includes("product_knowledge")
              ? {
                  id: "current-product-id",
                  slug: "medicine",
                  status: "active",
                  name: "Medicine",
                }
              : {
                  slug: "blood-count",
                  status: "active",
                  title: "Current blood count",
                  classification: "laboratory",
                  code,
                  locations: [{ id: "current-location" }],
                },
          );
        };
        const hydrated = await hydrateStructuredTemplateEntries(
          questionnaire,
          [entry(savedMedication), entry(savedService)],
          context,
        );
        assert.deepEqual(hydrated.unavailable, []);
        const med = hydrated.responses[question.id].values[0];
        assert.equal(med.type, "medication_request");
        if (med.type !== "medication_request") return;
        assert.equal(med.value?.[0].requested_product, "current-product-id");
        assert.equal(med.value?.[0].encounter, "new-encounter");
        assert.equal(med.value?.[0].requester.id, "new-clinician");
        assert.equal(med.value?.[0].dirty, true);
        assert.deepEqual(med.value?.[0].create_prescription, {
          note: "Review after five days",
          status: "active",
          alternate_identifier: "",
        });
        assert.equal(
          Object.hasOwn(med.value?.[0] ?? {}, "requested_product_name"),
          false,
        );
        assert.deepEqual(med.value?.[0].dosage_instruction, [dosage]);
        const service = hydrated.responses[serviceQuestion.id].values[0];
        assert.equal(service.type, "service_request");
        if (service.type !== "service_request") return;
        assert.deepEqual(service.value?.[0].service_request.locations, [
          "current-location",
        ]);
        assert.equal(
          service.value?.[0].service_request.requester.id,
          "new-clinician",
        );
        assert.equal(service.value?.[0].encounter, "new-encounter");
        assert.equal(service.value?.[0].service_request.note, "Review result");
        assert.ok(requests.every((request) => request.method === "GET"));
        assert.ok(
          requests.some((request) =>
            request.path.includes("/facility/new-facility/"),
          ),
        );
      },
    );
    await t.test(
      "absolute medication courses are excluded without changing their dose semantics",
      () => {
        const scheduled = structuredClone(original);
        const med = scheduled.values[0];
        assert.equal(med.type, "medication_request");
        if (med.type !== "medication_request" || !med.value?.[0]) return;
        med.value[0].dosage_instruction[0].timing!.repeat.bounds_period = {
          start: "2025-01-01T00:00:00Z",
          end: "2025-01-05T23:59:59Z",
        };
        assert.equal(
          serializeStructuredTemplateResponse(question, scheduled),
          null,
        );
      },
    );
    await t.test(
      "unavailable catalog items do not produce incomplete live orders",
      async () => {
        const saved = serializeStructuredTemplateResponse(question, original);
        assert.ok(saved);
        globalThis.fetch = async () =>
          Response.json({ detail: "Not found" }, { status: 404 });
        const hydrated = await hydrateStructuredTemplateEntries(
          questionnaire,
          [entry(saved)],
          context,
        );
        assert.deepEqual(hydrated.responses, {});
        assert.deepEqual(hydrated.unavailable, ["Medications"]);
      },
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousStorage)
      Object.defineProperty(globalThis, "localStorage", previousStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
    if (previousConfig) require.cache[configPath] = previousConfig;
    else delete require.cache[configPath];
  }
});
