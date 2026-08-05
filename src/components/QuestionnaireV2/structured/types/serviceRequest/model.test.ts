import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyEditToLog } from "@/components/QuestionnaireV2/structured/core/editLog";
import { projectRows } from "@/components/QuestionnaireV2/structured/core/projectRows";
import { selectStructuredFieldErrors } from "@/components/QuestionnaireV2/structured/core/structuredFieldErrors";
import type { ResourceCategoryRead } from "@/types/base/resourceCategory/resourceCategory";
import type { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import {
  Status as ActivityDefinitionStatus,
  Classification,
  Kind,
} from "@/types/emr/activityDefinition/activityDefinition";
import {
  Intent,
  Priority,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import type { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import type { LocationRead } from "@/types/location/location";
import type { ActivityDefinitionTemplateSpec } from "@/types/questionnaire/questionnaireResponseTemplate";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import type { UserReadMinimal } from "@/types/user/user";

import type { ServiceRequestRow } from "./model";
import {
  buildServiceRequestForTemplate,
  newServiceRequestRow,
  projectValues,
  requiredServiceRequestFieldMisses,
  rowSchema,
  serviceRequestRowFromTemplate,
  stripDisplay,
  toRequests,
} from "./model";

const CTX = { facilityId: "fac-1", questionId: "q-1" } as const;

function fixtureUser(
  overrides: Partial<UserReadMinimal> = {},
): UserReadMinimal {
  return {
    id: "user-1",
    username: "care-doctor",
    first_name: "Care",
    last_name: "Doctor",
    phone_number: "+911234567890",
    user_type: "doctor",
    gender: "male",
    last_login: "",
    profile_picture_url: "",
    mfa_enabled: false,
    deleted: false,
    is_service_account: false,
    ...overrides,
  };
}

function fixtureActivityDefinition(
  overrides: Partial<ActivityDefinitionReadSpec> = {},
): ActivityDefinitionReadSpec {
  return {
    id: "ad-1",
    slug: "cbc-test",
    title: "Complete Blood Count",
    derived_from_uri: null,
    status: ActivityDefinitionStatus.active,
    description: "",
    usage: "",
    classification: Classification.laboratory,
    kind: Kind.service_request,
    code: { system: "system-ad", code: "cbc", display: "CBC" },
    body_site: null,
    diagnostic_report_codes: [],
    slug_config: { slug_value: "cbc-test" },
    tags: [],
    specimen_requirements: [],
    charge_item_definitions: [],
    observation_result_requirements: [],
    locations: [],
    // Deep read-only shapes this module never reads — stubbed, not built.
    category: {} as ResourceCategoryRead,
    healthcare_service: {} as HealthcareServiceReadSpec,
    ...overrides,
  };
}

function fixtureRow(
  overrides: Partial<ServiceRequestRow> = {},
): ServiceRequestRow {
  return {
    ...newServiceRequestRow(
      fixtureActivityDefinition(),
      "enc-1",
      fixtureUser(),
    ),
    ...overrides,
  };
}

function add(
  rowId: string,
  patch: ServiceRequestRow,
): StructuredEdit<ServiceRequestRow> {
  return { rowId, op: "add", patch };
}

describe("service_request model", () => {
  describe("newServiceRequestRow", () => {
    it("seeds active/order/routine, the definition's own fields, and carries the definition object for display", () => {
      const requester = fixtureUser({ id: "user-9" });
      const activityDefinition = fixtureActivityDefinition({
        slug: "xray-chest",
        title: "Chest X-Ray",
        classification: Classification.imaging,
        locations: [{ id: "loc-1" }, { id: "loc-2" }] as LocationRead[],
      });

      const row = newServiceRequestRow(activityDefinition, "enc-42", requester);

      assert.deepEqual(row, {
        encounter: "enc-42",
        activity_definition: "xray-chest",
        activity_definition_object: activityDefinition,
        service_request: {
          title: "Chest X-Ray",
          status: Status.active,
          intent: Intent.order,
          priority: Priority.routine,
          category: Classification.imaging,
          do_not_perform: false,
          note: null,
          code: activityDefinition.code,
          body_site: null,
          occurance: null,
          patient_instruction: null,
          requester,
          locations: ["loc-1", "loc-2"],
        },
      });
    });

    it("defaults locations to [] when the definition has none", () => {
      const row = newServiceRequestRow(
        fixtureActivityDefinition({ locations: undefined }),
        "enc-1",
        fixtureUser(),
      );
      assert.deepEqual(row.service_request.locations, []);
    });
  });

  describe("serviceRequestRowFromTemplate", () => {
    const activityDefinition = fixtureActivityDefinition({
      slug: "cbc-test",
      title: "Complete Blood Count",
    });

    it("falls back to the activity definition's own fields when the template stored none", () => {
      const templateSR: ActivityDefinitionTemplateSpec = {
        slug: "cbc-test",
        service_request:
          {} as ActivityDefinitionTemplateSpec["service_request"],
      };
      const requester = fixtureUser();

      const row = serviceRequestRowFromTemplate(
        templateSR,
        activityDefinition,
        "enc-1",
        requester,
      );

      assert.equal(row.service_request.title, "Complete Blood Count");
      assert.equal(row.service_request.status, Status.active);
      assert.equal(row.service_request.intent, Intent.order);
      assert.equal(row.service_request.priority, Priority.routine);
      assert.equal(row.service_request.category, Classification.laboratory);
      assert.equal(row.service_request.requester, requester);
      assert.deepEqual(row.service_request.locations, []);
    });

    it("prefers the template's own stored values over the activity definition's current ones", () => {
      const templateSR: ActivityDefinitionTemplateSpec = {
        slug: "cbc-test",
        service_request: {
          title: "Stored Title",
          status: Status.draft,
          intent: Intent.plan,
          priority: Priority.stat,
          category: Classification.surgical_procedure,
          do_not_perform: true,
          note: "stored note",
          code: { system: "sys", code: "stored", display: "Stored" },
          body_site: { system: "sys", code: "site", display: "Site" },
          occurance: "2024-01-01",
          patient_instruction: "stored instruction",
          locations: ["loc-a"],
        },
      };

      const row = serviceRequestRowFromTemplate(
        templateSR,
        activityDefinition,
        "enc-1",
        fixtureUser(),
      );

      assert.equal(row.service_request.title, "Stored Title");
      assert.equal(row.service_request.status, Status.draft);
      assert.equal(row.service_request.intent, Intent.plan);
      assert.equal(row.service_request.priority, Priority.stat);
      assert.equal(
        row.service_request.category,
        Classification.surgical_procedure,
      );
      assert.equal(row.service_request.do_not_perform, true);
      assert.equal(row.service_request.note, "stored note");
      assert.equal(row.service_request.occurance, "2024-01-01");
      assert.equal(
        row.service_request.patient_instruction,
        "stored instruction",
      );
      assert.deepEqual(row.service_request.locations, ["loc-a"]);
    });

    it("always resolves requester to the applying clinician, never a template field", () => {
      const requester = fixtureUser({ id: "applying-user" });
      const row = serviceRequestRowFromTemplate(
        {
          slug: "cbc-test",
          service_request:
            {} as ActivityDefinitionTemplateSpec["service_request"],
        },
        activityDefinition,
        "enc-1",
        requester,
      );
      assert.equal(row.service_request.requester, requester);
    });
  });

  describe("buildServiceRequestForTemplate / serviceRequestRowFromTemplate round-trip", () => {
    it("a row built for a template, then resolved back through it (with the SAME activity definition), reproduces every service_request field", () => {
      const activityDefinition = fixtureActivityDefinition();
      const original = newServiceRequestRow(
        activityDefinition,
        "enc-1",
        fixtureUser(),
      );
      const templateSR = buildServiceRequestForTemplate(original);

      const resolved = serviceRequestRowFromTemplate(
        templateSR,
        activityDefinition,
        "enc-2",
        fixtureUser({ id: "someone-else" }),
      );

      const { requester: _r1, ...originalRest } = original.service_request;
      const { requester: _r2, ...resolvedRest } = resolved.service_request;
      assert.deepEqual(resolvedRest, originalRest);
    });
  });

  describe("stripDisplay", () => {
    it("removes the display object and narrows requester to its id, and nothing else", () => {
      const requester = fixtureUser({ id: "user-77" });
      const row = newServiceRequestRow(
        fixtureActivityDefinition(),
        "enc-1",
        requester,
      );

      const stripped = stripDisplay(row);

      assert.deepEqual(Object.keys(stripped).sort(), [
        "activity_definition",
        "encounter",
        "service_request",
      ]);
      assert.equal(stripped.service_request.requester, "user-77");
      assert.deepEqual(
        { ...stripped.service_request, requester: undefined },
        { ...row.service_request, requester: undefined },
      );
    });
  });

  describe("projectValues", () => {
    it("projects an empty row set to NO values, so the section reads unanswered", () => {
      assert.deepEqual(projectValues([]), []);
    });

    it("projects rows as one service_request entry, in order, without aliasing the input array", () => {
      const rowA = newServiceRequestRow(
        fixtureActivityDefinition({ slug: "a" }),
        "enc-1",
        fixtureUser(),
      );
      const rowB = newServiceRequestRow(
        fixtureActivityDefinition({ slug: "b" }),
        "enc-1",
        fixtureUser(),
      );
      const rows = [rowA, rowB];

      const projected = projectValues(rows);

      assert.deepEqual(projected, [
        { type: "service_request", value: [rowA, rowB] },
      ]);
      assert.notEqual(
        (
          projected[0] as {
            type: "service_request";
            value: ServiceRequestRow[];
          }
        ).value,
        rows,
      );
    });
  });

  // `activityDefinitionPrice` (the price sum) is NOT tested here — it lives
  // in `ServiceRequestEditor.tsx`, not this module, specifically so this
  // test file never imports `@/Utils/decimal`/`monetaryComponent.ts` (see
  // `model.ts`'s own comment at that boundary for the `care.config.ts`/
  // `import.meta.env` crash this avoids under `node:test`).

  describe("toRequests", () => {
    it("an empty edit log produces zero requests", async () => {
      assert.deepEqual(await toRequests([], CTX), []);
    });

    it("two adds compile TWO separate POSTs (one service request per call), sharing one reference_id", async () => {
      const rowA = newServiceRequestRow(
        fixtureActivityDefinition({ slug: "cbc" }),
        "enc-1",
        fixtureUser(),
      );
      const rowB = newServiceRequestRow(
        fixtureActivityDefinition({ slug: "xray" }),
        "enc-1",
        fixtureUser(),
      );
      const edits = [add("row-a", rowA), add("row-b", rowB)];

      assert.deepEqual(await toRequests(edits, CTX), [
        {
          url: "/api/v1/facility/fac-1/service_request/apply_activity_definition/",
          method: "POST",
          body: stripDisplay(rowA),
          reference_id: "structured:service_request:q-1",
        },
        {
          url: "/api/v1/facility/fac-1/service_request/apply_activity_definition/",
          method: "POST",
          body: stripDisplay(rowB),
          reference_id: "structured:service_request:q-1",
        },
      ]);
    });

    it("sends nothing without a facility in context", async () => {
      const created = newServiceRequestRow(
        fixtureActivityDefinition(),
        "enc-1",
        fixtureUser(),
      );
      assert.deepEqual(
        await toRequests([add("row-a", created)], { questionId: "q-1" }),
        [],
      );
    });

    it("a removed row does not reach requests — built through the REAL reducer, not a hand-written log", async () => {
      const created = newServiceRequestRow(
        fixtureActivityDefinition(),
        "enc-1",
        fixtureUser(),
      );
      let log = applyEditToLog<ServiceRequestRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      assert.equal(log.length, 1);

      log = applyEditToLog<ServiceRequestRow>(log, {
        rowId: "row-a",
        op: "remove",
        patch: created,
      });
      assert.deepEqual(log, []);
      assert.deepEqual(await toRequests(log, CTX), []);
    });

    it("ignores a stray remove op with no matching add", async () => {
      const stray: StructuredEdit<ServiceRequestRow> = {
        rowId: "row-a",
        op: "remove",
        patch: newServiceRequestRow(
          fixtureActivityDefinition(),
          "enc-1",
          fixtureUser(),
        ),
      };
      assert.deepEqual(await toRequests([stray], CTX), []);
    });

    it("a corrupted 'update' op — never legitimate for this create-only type — never reaches the request body", async () => {
      const corrupted: StructuredEdit<ServiceRequestRow> = {
        rowId: "row-a",
        op: "update",
        patch: newServiceRequestRow(
          fixtureActivityDefinition(),
          "enc-1",
          fixtureUser(),
        ),
      };
      assert.deepEqual(await toRequests([corrupted], CTX), []);
    });

    it("PROJECTION AND SUBMIT AGREE for an edited row", async () => {
      const created = newServiceRequestRow(
        fixtureActivityDefinition(),
        "enc-1",
        fixtureUser(),
      );
      let log = applyEditToLog<ServiceRequestRow>([], {
        rowId: "row-a",
        op: "add",
        patch: created,
      });
      const updated: ServiceRequestRow = {
        ...created,
        service_request: {
          ...created.service_request,
          priority: Priority.stat,
        },
      };
      log = applyEditToLog<ServiceRequestRow>(log, {
        rowId: "row-a",
        op: "update",
        patch: updated,
      });

      const projectedRows = projectRows(undefined, log, {}).map(
        (entry) => entry.row,
      );
      const projection = projectValues(projectedRows);
      const requests = await toRequests(log, CTX);

      const projectedPriority = (
        projection[0] as { type: "service_request"; value: ServiceRequestRow[] }
      ).value[0].service_request.priority;
      const submittedPriority = (
        requests[0].body as { service_request: { priority: Priority } }
      ).service_request.priority;

      assert.equal(projectedPriority, Priority.stat);
      assert.equal(submittedPriority, Priority.stat);
    });
  });

  describe("requiredServiceRequestFieldMisses", () => {
    for (const fieldKey of [
      "title",
      "status",
      "intent",
      "priority",
      "category",
      "code",
    ] as const) {
      it(`flags a blank ${fieldKey}`, () => {
        const serviceRequest: Record<string, unknown> = {
          ...fixtureRow().service_request,
          [fieldKey]: "",
        };
        const row = fixtureRow({
          service_request:
            serviceRequest as unknown as ServiceRequestRow["service_request"],
        });
        assert.deepEqual(
          requiredServiceRequestFieldMisses([add("row-a", row)]),
          [{ rowId: "row-a", fieldKey }],
        );
      });
    }

    it("reports nothing for a row built by newServiceRequestRow", () => {
      const row = newServiceRequestRow(
        fixtureActivityDefinition(),
        "enc-1",
        fixtureUser(),
      );
      assert.deepEqual(
        requiredServiceRequestFieldMisses([add("row-a", row)]),
        [],
      );
    });

    it("never reports a remove edit, regardless of its content", () => {
      const removed: StructuredEdit<ServiceRequestRow> = {
        rowId: "row-a",
        op: "remove",
        patch: fixtureRow({
          service_request: { ...fixtureRow().service_request, title: "" },
        }),
      };
      assert.deepEqual(requiredServiceRequestFieldMisses([removed]), []);
    });

    it("reports every missing field for one row, in field order", () => {
      const row = fixtureRow({
        service_request: {
          ...fixtureRow().service_request,
          title: "",
          code: undefined as unknown as ServiceRequestRow["service_request"]["code"],
        },
      });
      assert.deepEqual(requiredServiceRequestFieldMisses([add("row-a", row)]), [
        { rowId: "row-a", fieldKey: "title" },
        { rowId: "row-a", fieldKey: "code" },
      ]);
    });

    it("returns rowIds in log order across multiple rows", () => {
      const bad = fixtureRow({
        service_request: { ...fixtureRow().service_request, title: "" },
      });
      const good = newServiceRequestRow(
        fixtureActivityDefinition(),
        "enc-1",
        fixtureUser(),
      );
      const edits = [add("row-a", bad), add("row-b", good), add("row-c", bad)];
      assert.deepEqual(requiredServiceRequestFieldMisses(edits), [
        { rowId: "row-a", fieldKey: "title" },
        { rowId: "row-c", fieldKey: "title" },
      ]);
    });

    it("renders through the StructuredList matcher: 'priority'/'category' bind to a real column, 'title'/'status'/'intent'/'code' hit the unmatched fallback", () => {
      // Exercises the SAME matcher StructuredFieldError/StructuredList use
      // (`selectStructuredFieldErrors`), not a re-implementation — proving
      // this validator's output is genuinely reachable by the shell,
      // regardless of whether today's UI can produce an invalid row.
      const misses = requiredServiceRequestFieldMisses([
        add(
          "row-a",
          fixtureRow({
            service_request: {
              ...fixtureRow().service_request,
              title: "",
              priority: "" as unknown as Priority,
            },
          }),
        ),
      ]);
      const errors = misses.map((miss) => ({
        question_id: "q-1",
        field_key: miss.fieldKey,
        row_id: miss.rowId,
        error: "This field is required",
      }));

      const priorityMatch = selectStructuredFieldErrors(errors, {
        questionId: "q-1",
        rowId: "row-a",
        fieldKeys: ["priority"],
      });
      assert.equal(priorityMatch.length, 1);

      const titleMatch = selectStructuredFieldErrors(errors, {
        questionId: "q-1",
        rowId: "row-a",
        fieldKeys: ["title"],
      });
      assert.equal(titleMatch.length, 1);
    });
  });
});

describe("rowSchema — the assistant write guard", () => {
  it("accepts a real row", () => {
    assert.equal(rowSchema.safeParse(fixtureRow()).success, true);
  });

  it("accepts null body_site/note/occurance/patient_instruction", () => {
    assert.equal(
      rowSchema.safeParse(
        fixtureRow({
          service_request: {
            ...fixtureRow().service_request,
            note: null,
            body_site: null,
            occurance: null,
            patient_instruction: null,
          },
        }),
      ).success,
      true,
    );
  });

  it("rejects an unknown top-level field", () => {
    assert.equal(
      rowSchema.safeParse({ ...fixtureRow(), extra_field: "hallucinated" })
        .success,
      false,
    );
  });

  it("rejects an unknown field nested inside service_request", () => {
    const row = fixtureRow();
    assert.equal(
      rowSchema.safeParse({
        ...row,
        service_request: { ...row.service_request, made_up: true },
      }).success,
      false,
    );
  });

  it("rejects an invalid priority enum value", () => {
    const row = fixtureRow();
    assert.equal(
      rowSchema.safeParse({
        ...row,
        service_request: { ...row.service_request, priority: "not_a_priority" },
      }).success,
      false,
    );
  });

  it("rejects an activity_definition_object missing its slug", () => {
    const row = fixtureRow();
    const { slug: _slug, ...withoutSlug } = row.activity_definition_object;
    assert.equal(
      rowSchema.safeParse({
        ...row,
        activity_definition_object: withoutSlug,
      }).success,
      false,
    );
  });

  it("rejects a requester missing its username", () => {
    const row = fixtureRow();
    const { username: _username, ...userWithoutUsername } =
      row.service_request.requester;
    assert.equal(
      rowSchema.safeParse({
        ...row,
        service_request: {
          ...row.service_request,
          requester: userWithoutUsername,
        },
      }).success,
      false,
    );
  });

  it("rejects an empty title", () => {
    const row = fixtureRow();
    assert.equal(
      rowSchema.safeParse({
        ...row,
        service_request: { ...row.service_request, title: "" },
      }).success,
      false,
    );
  });
});
