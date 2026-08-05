import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import {
  displayObjectSchema,
  nonEmptyString,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import { CodeSchema } from "@/types/base/code/code";
import {
  ActivityDefinitionReadSpec,
  Classification,
} from "@/types/emr/activityDefinition/activityDefinition";
import {
  Intent,
  Priority,
  ServiceRequestApplyActivityDefinitionForm,
  ServiceRequestApplyActivityDefinitionSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import { ActivityDefinitionTemplateSpec } from "@/types/questionnaire/questionnaireResponseTemplate";
import type { StructuredEdit } from "@/types/questionnaire/structured";
import { UserReadMinimal } from "@/types/user/user";

/**
 * What the v2 editor edits. `ServiceRequestApplyActivityDefinitionForm`
 * (`@/types/emr/serviceRequest/serviceRequest`) already widens `requester`
 * to a full `UserReadMinimal` — no local re-widening needed here, unlike
 * `ChargeItemRow`/`AllergyRow`'s own arms of this same decision.
 *
 * `activity_definition_object` is required, added here for the identical
 * reason `ChargeItemRow.charge_item_definition_object` is (see that type's
 * own doc comment, `chargeItem/model.ts`): every row this editor creates —
 * from a direct pick OR a resolved template — carries the full
 * `ActivityDefinitionReadSpec` it was built from, so price/title repaint
 * correctly from a restored draft or a background refetch instead of living
 * only in a component `useState` no reload can restore. That component
 * `useState` — `ServiceRequestQuestion.tsx`'s `activityDefinitionsMap` — is
 * this port's OTHER defect to close (the first is the dual-state
 * `serviceRequests`/`questionnaireResponse.values` pair the port brief
 * names directly): both disappear because `useStructuredRows` becomes the
 * single source of truth and this object rides on the row itself.
 */
export type ServiceRequestRow = ServiceRequestApplyActivityDefinitionForm & {
  activity_definition_object: ActivityDefinitionReadSpec;
};

/**
 * The assistant write guard (spec §6 A2 — see `timeOfDeath/model.ts`'s
 * `rowSchema` for the full contract). `activity_definition_object` is
 * `displayObjectSchema` (passthrough, id/slug/title-keyed only — see that
 * helper's own doc comment): an assistant would only ever copy this
 * verbatim from a prior pick (`ResourceDefinitionCategoryPicker`), never
 * author the full `ActivityDefinitionReadSpec` shape by hand. `requester`
 * is `userDisplaySchema` for the identical reason. Every OTHER field is
 * `.strict()`, matching `BaseServiceRequestSpec` exactly (minus `id`, which
 * this form omits, matching `ServiceRequestApplyActivityDefinitionForm`'s
 * own `Omit<BaseServiceRequestSpec, "id">`).
 */
const serviceRequestSpecSchema = z
  .object({
    title: nonEmptyString,
    status: z.enum(Status),
    intent: z.enum(Intent),
    priority: z.enum(Priority),
    category: z.enum(Classification),
    do_not_perform: z.boolean(),
    note: z.string().nullable(),
    code: CodeSchema,
    body_site: CodeSchema.nullable(),
    occurance: z.string().nullable(),
    patient_instruction: z.string().nullable(),
    locations: z.array(z.string()),
    requester: userDisplaySchema,
  })
  .strict();

export const rowSchema = z
  .object({
    encounter: nonEmptyString,
    activity_definition: nonEmptyString,
    service_request: serviceRequestSpecSchema,
    activity_definition_object: displayObjectSchema(["slug", "title"]),
  })
  .strict();

/**
 * A service-request section is a LIST whose rows are born whole the moment
 * `newServiceRequestRow`/`serviceRequestRowFromTemplate` creates one from a
 * picked (or template-resolved) activity definition — identical reasoning
 * to `charge_item`'s own `projectValues` doc comment: there is no "half
 * filled" row shape to reconcile, so no separate `isEmptyRow` predicate
 * exists to desync from a submission filter (Lesson 2, binding "Lessons
 * from the first ports").
 */
export const projectValues: ProjectValues<ServiceRequestRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "service_request", value: [...rows] }];

// `activityDefinitionPrice` (the sum of every linked charge-item
// definition's base price, mirroring `ServiceRequestQuestion.tsx:229-236`)
// deliberately does NOT live here. `@/Utils/decimal` (and transitively
// `@/types/base/monetaryComponent/monetaryComponent`) reads
// `care.config.ts`, which reads `import.meta.env` — populated by Vite at
// runtime, but `undefined` under this repo's `node:test` unit harness
// (`npm run test:unit` is plain `node --import tsx --test`, not Vite). This
// is a genuine, pre-existing gap in the harness, not something this port
// introduces — no other `model.ts` in `structured/types/*` imports either
// module today, and this one must not become the first, or every test
// importing it (this file's own `model.test.ts` included) crashes before a
// single assertion runs. Kept instead as a small, UI-adjacent helper in
// `ServiceRequestEditor.tsx`, which `node:test` never imports.
//
/**
 * A freshly picked activity definition, seeded exactly the way
 * `ServiceRequestQuestion.tsx`'s selection effect did (`:629-668`):
 * `status`/`intent`/`priority` default to active/order/routine,
 * `category`/`code`/`body_site`/`locations` come straight off the
 * definition, and `requester` defaults to the current user (editable
 * afterward via the `requester` column).
 */
export function newServiceRequestRow(
  activityDefinition: ActivityDefinitionReadSpec,
  encounterId: string,
  requester: UserReadMinimal,
): ServiceRequestRow {
  return {
    encounter: encounterId,
    activity_definition: activityDefinition.slug,
    activity_definition_object: activityDefinition,
    service_request: {
      title: activityDefinition.title,
      status: Status.active,
      intent: Intent.order,
      priority: Priority.routine,
      category: activityDefinition.classification,
      do_not_perform: false,
      note: null,
      code: activityDefinition.code,
      body_site: activityDefinition.body_site,
      occurance: null,
      patient_instruction: null,
      requester,
      locations:
        activityDefinition.locations?.map((location) => location.id) ?? [],
    },
  };
}

/**
 * A row resolved from a template's `ActivityDefinitionTemplateSpec` plus
 * the FULL activity definition fetched by its slug (a template only ever
 * stores the slug — see `resolveTemplateServiceRequest` in
 * `ServiceRequestEditor.tsx`, the one caller that does the fetching). Merges
 * the template's own stored field values over the activity definition's
 * current ones, field by field — mirrors
 * `ServiceRequestQuestion.tsx`'s `handleAddSingleServiceRequest` AND
 * `handleApplyTemplate`, which duplicated this exact merge; here it is
 * written once; `requester` is never read off the template (legacy never
 * stored it either — a template's `service_request` shape has no
 * `requester` field) and always resolves to the applying clinician.
 */
export function serviceRequestRowFromTemplate(
  templateServiceRequest: ActivityDefinitionTemplateSpec,
  activityDefinition: ActivityDefinitionReadSpec,
  encounterId: string,
  requester: UserReadMinimal,
): ServiceRequestRow {
  const templated = templateServiceRequest.service_request;
  return {
    encounter: encounterId,
    activity_definition: templateServiceRequest.slug,
    activity_definition_object: activityDefinition,
    service_request: {
      title: templated?.title || activityDefinition.title,
      status: templated?.status || Status.active,
      intent: templated?.intent || Intent.order,
      priority: templated?.priority || Priority.routine,
      category: templated?.category || activityDefinition.classification,
      do_not_perform: templated?.do_not_perform ?? false,
      note: templated?.note || null,
      code: templated?.code || activityDefinition.code,
      body_site: templated?.body_site || activityDefinition.body_site,
      occurance: templated?.occurance || null,
      patient_instruction: templated?.patient_instruction || null,
      requester,
      locations:
        templated?.locations ||
        activityDefinition.locations?.map((location) => location.id) ||
        [],
    },
  };
}

/**
 * The inverse of `serviceRequestRowFromTemplate` — a row → the plain data a
 * template stores, dropping the row's own `encounter`/`activity_definition_
 * object` (instance-specific; re-derived on apply) the same way
 * `ServiceRequestQuestion.tsx`'s exported `buildServiceRequestForTemplate`
 * did. Kept here, not re-derived inline at each of this port's two call
 * sites (the `useAddToTemplate` `toTemplateSpec` option and the "current
 * activity definitions" list handed to `ManageResponseTemplatesSheet`) —
 * legacy itself built this shape TWICE, once via the function and once
 * inlined by hand at the `currentActivityDefinitions` prop
 * (`ServiceRequestQuestion.tsx:1039-1055`); one function, two callers here.
 */
export function buildServiceRequestForTemplate(
  row: ServiceRequestRow,
): ActivityDefinitionTemplateSpec {
  return {
    slug: row.activity_definition,
    service_request: {
      title: row.service_request.title,
      status: row.service_request.status,
      intent: row.service_request.intent,
      priority: row.service_request.priority,
      category: row.service_request.category,
      code: row.service_request.code,
      do_not_perform: row.service_request.do_not_perform,
      body_site: row.service_request.body_site,
      note: row.service_request.note,
      patient_instruction: row.service_request.patient_instruction,
      occurance: row.service_request.occurance,
      locations: row.service_request.locations,
    },
  };
}

/**
 * The ONE strip, mirroring `chargeItem/model.ts`'s `stripDisplay` doc
 * comment: `activity_definition_object` never reaches the wire, and
 * `requester` narrows from the display-carrying `UserReadMinimal` to the
 * plain id the `apply_activity_definition/` endpoint's
 * `ServiceRequestApplyActivityDefinitionSpec` expects. Exported for
 * `model.test.ts` to pin the exact remaining key set, not inferred from
 * this comment.
 */
export function stripDisplay(
  row: ServiceRequestRow,
): ServiceRequestApplyActivityDefinitionSpec {
  const { activity_definition_object: _display, ...rest } = row;
  return {
    ...rest,
    service_request: {
      ...rest.service_request,
      requester: rest.service_request.requester.id,
    },
  };
}

/**
 * Service requests are applied via `apply_activity_definition/`, never
 * prefetched or amended in place — there is no server row a v2
 * service-request section could ever have fetched, so (mirrors
 * `chargeItem/model.ts`'s identical reasoning, restated here rather than
 * only cross-referenced per that module's own "state directly" lesson) the
 * baseline this differ resolves against is GENUINELY, PERMANENTLY empty, an
 * explicit `new Map()` rather than the bare `{}` that defaults `baseline`
 * to `undefined` ("still loading or errored"). `updates`/`removes` are
 * never read: an `update` would mean a rowId the server already has, and
 * this create-only endpoint has no verb for that; a `remove` for a rowId
 * that never reached the server carries nothing worth sending (the
 * ordinary add-then-remove path annihilates the pair inside the reducer
 * before it ever reaches a log this function sees).
 *
 * UNLIKE `charge_item`'s single grouped POST (`{ requests: [...] }`), the
 * `apply_activity_definition/` endpoint takes exactly ONE service request
 * per call — mirrors the legacy v1 `buildRequests`
 * (`definitions/serviceRequest.tsx`'s now-superseded contract-1 arm,
 * `serviceRequests.map((serviceRequest) => ({ url, method, body, ... }))`),
 * so this returns one `StructuredBatchEntry` PER created row, all sharing
 * the same `reference_id` (per-question, not per-row — `composeBatch`
 * dispatches every entry in the returned array as its own request
 * regardless of how many share a reference id).
 */
export async function toRequests(
  edits: readonly StructuredEdit<ServiceRequestRow>[],
  { facilityId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!facilityId) return [];
  const { creates } = resolveChanges(edits, { baseline: new Map() });
  return creates.map((row) => ({
    url: `/api/v1/facility/${facilityId}/service_request/apply_activity_definition/`,
    method: "POST" as const,
    body: stripDisplay(row),
    reference_id: structuredReferenceId("service_request", questionId),
  }));
}

/**
 * The exact field set legacy's exported (but never wired —
 * `definitions/serviceRequest.tsx`'s own comment names the reason: the
 * validator expected these fields FLAT while the recorded data nests them
 * under `service_request`) `validateServiceRequestQuestion` checked
 * (`SERVICE_REQUEST_FIELDS`, `ServiceRequestQuestion.tsx:114-139`),
 * corrected to read the real, nested shape.
 *
 * REACHABILITY, STATED HONESTLY (matching Batch A/B's own precedent for
 * allergy/symptom, which shipped with NO client `validate()` at all for the
 * identical reason): every field this checks is populated BY CONSTRUCTION
 * the moment a row is created — `newServiceRequestRow`/
 * `serviceRequestRowFromTemplate` above always fill `title`/`status`/
 * `intent`/`priority`/`category`/`code` from the picked activity definition
 * (never optional there) or its own `||` defaults, and today's UI exposes
 * no control that can clear any of them back to falsy. This predicate is
 * therefore NOT independently forced with a live invalid row in this
 * port's mount session; it is exercised directly by `model.test.ts` (which
 * constructs edits with a blank required field the real UI cannot produce)
 * and, unlike allergy/symptom, IS wired into `validate` — the port brief
 * asks specifically for "a correct one," not for parity with legacy's
 * broken-and-silent original, and a defensive check that could never fire
 * costs nothing to keep wired: it stands ready for a malformed template, a
 * migrated pre-v2 draft, or a future editable title/code field, and its
 * render path is real (`priority`/`category` bind to real columns;
 * `title`/`status`/`intent`/`code` bind to nothing and exercise the
 * `StructuredList` unmatched-`field_key` fallback instead — both paths
 * covered by `model.test.ts` wiring these field keys through the real
 * `StructuredList` matcher, `structuredFieldErrors.ts`).
 */
const REQUIRED_SERVICE_REQUEST_FIELDS = [
  "title",
  "status",
  "intent",
  "priority",
  "category",
  "code",
] as const;

export type RequiredServiceRequestField =
  (typeof REQUIRED_SERVICE_REQUEST_FIELDS)[number];

export interface RequiredFieldMiss {
  rowId: string;
  fieldKey: RequiredServiceRequestField;
}

/** Pure predicate — never touches i18next (mirrors `chargeItem/model.ts`'s
 *  `invalidQuantityRowIds`, "the only place it becomes a translated,
 *  row_id-keyed `QuestionValidationError` is `definitions/
 *  serviceRequest.tsx`"). A `remove` edit is never reported — the row is on
 *  its way out, not something the clinician still needs to fix (same
 *  exclusion `invalidQuantityRowIds` applies). */
export function requiredServiceRequestFieldMisses(
  edits: readonly StructuredEdit<ServiceRequestRow>[],
): RequiredFieldMiss[] {
  const misses: RequiredFieldMiss[] = [];
  for (const edit of edits) {
    if (edit.op === "remove") continue;
    for (const fieldKey of REQUIRED_SERVICE_REQUEST_FIELDS) {
      if (!edit.patch.service_request[fieldKey]) {
        misses.push({ rowId: edit.rowId, fieldKey });
      }
    }
  }
  return misses;
}
