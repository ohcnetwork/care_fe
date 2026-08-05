import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import { listProjectValues } from "@/components/QuestionnaireV2/structured/shared/listProjectValues";
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
 * already widens `requester` to a full `UserReadMinimal`.
 * `activity_definition_object` is required: every row is created from a
 * direct pick or a resolved template, and carrying the full
 * `ActivityDefinitionReadSpec` on the row lets price/title repaint from a
 * restored draft or a background refetch instead of living in component
 * state that drafts cannot restore.
 */
export type ServiceRequestRow = ServiceRequestApplyActivityDefinitionForm & {
  activity_definition_object: ActivityDefinitionReadSpec;
};

/**
 * Assistant write guard. `activity_definition_object` is
 * `displayObjectSchema` (loose, slug/title-keyed): an assistant only ever
 * copies it verbatim from a prior pick, never authors the full
 * `ActivityDefinitionReadSpec` by hand; `requester` is `userDisplaySchema`
 * for the same reason. Every other field is `.strict()`, matching
 * `ServiceRequestApplyActivityDefinitionForm`'s `service_request` shape
 * (`BaseServiceRequestSpec` minus `id`, plus `locations`).
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

/** Rows are born whole from a picked or template-resolved activity
 *  definition (see {@link listProjectValues}). */
export const projectValues: ProjectValues<ServiceRequestRow> =
  listProjectValues("service_request");

// `activityDefinitionPrice` deliberately lives in `ServiceRequestEditor.tsx`,
// not here: `@/Utils/decimal` reads `care.config.ts`'s `import.meta.env`,
// which is `undefined` under the plain node:test unit harness — importing it
// here would crash every test importing this module.

/**
 * A freshly picked activity definition: `status`/`intent`/`priority` default
 * to active/order/routine, `category`/`code`/`body_site`/`locations` come
 * off the definition, and `requester` defaults to the current user (editable
 * via the requester column).
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
 * A row resolved from a template entry plus the FULL activity definition
 * fetched by its slug (a template only stores the slug). Template-stored
 * values win over the definition's current ones, field by field. `requester`
 * is never read off the template — its shape has no such field — and always
 * resolves to the applying clinician.
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
 * Inverse of `serviceRequestRowFromTemplate`: row → the plain data a
 * template stores, dropping `encounter`/`activity_definition_object`
 * (instance-specific; re-derived on apply).
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
 * `activity_definition_object` never reaches the wire, and `requester`
 * narrows from the display-carrying `UserReadMinimal` to the plain id
 * `ServiceRequestApplyActivityDefinitionSpec` expects.
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
 * prefetched or amended in place, so the baseline is genuinely, permanently
 * empty — an explicit `new Map()`, not the `undefined` that means "still
 * loading or errored". `updates`/`removes` are never read: this create-only
 * endpoint has no verb for them, and an add-then-remove pair annihilates
 * inside the reducer before reaching this function.
 *
 * The endpoint takes exactly ONE service request per call, so this returns
 * one `StructuredBatchEntry` per created row, all sharing the per-question
 * `reference_id` (`composeBatch` dispatches each entry as its own request).
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
 * Every field here is populated by construction: the row factories never
 * leave them falsy and the UI exposes no control that can clear them. This
 * check defends against malformed templates, restored drafts, or future
 * editable fields. `priority`/`category` bind to real columns; the rest
 * surface via `StructuredList`'s unmatched-`field_key` fallback.
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

/** Pure predicate — `definitions/serviceRequest.tsx` is the only place a
 *  miss becomes a translated, row_id-keyed error. A `remove` edit is never
 *  reported: the row is on its way out, not something left to fix. */
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
