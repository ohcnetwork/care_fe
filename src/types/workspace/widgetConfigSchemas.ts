import type { TFunction } from "i18next";
import { z } from "zod";

import { Status } from "@/types/emr/serviceRequest/serviceRequest";
import type { JSONSchema2020, JSONSchemaProperty } from "@/Utils/schema/types";

const widgetLimitSchema = z.number().int().min(1).max(100).optional();

export const responsesConfigSchema = z.strictObject({
  questionnaire_slug: z
    .string()
    .trim()
    .min(1)
    // JSON Schema cannot express trimming; require a non-whitespace character.
    .meta({ pattern: "\\S" })
    .optional(),
  only_unstructured: z.boolean().optional(),
  limit: widgetLimitSchema,
});

export const serviceRequestsConfigSchema = z.strictObject({
  status: z.enum(Status).exclude([Status.unknown]).optional(),
  limit: widgetLimitSchema,
});

// These validators use only object, string, boolean, integer, and enum keywords,
// all supported by CARE's JSON Schema form contract.
const responsesJsonSchema = z.toJSONSchema(responsesConfigSchema, {
  target: "draft-2020-12",
  io: "input",
}) as JSONSchema2020;
const serviceRequestsJsonSchema = z.toJSONSchema(serviceRequestsConfigSchema, {
  target: "draft-2020-12",
  io: "input",
}) as JSONSchema2020;

function limitProperty(
  property: JSONSchemaProperty,
  t: TFunction,
): JSONSchemaProperty {
  return {
    ...property,
    title: t("workspace_widget_recent_limit"),
    description: t("workspace_widget_limit_hint", {
      minimum: property.minimum,
      maximum: property.maximum,
    }),
  };
}

function responsesSchema(t: TFunction): JSONSchema2020 {
  const properties = responsesJsonSchema.properties!;
  return {
    ...responsesJsonSchema,
    title: t("questionnaire_responses"),
    properties: {
      questionnaire_slug: {
        ...properties.questionnaire_slug,
        title: t("workspace_widget_form_slug"),
        description: t("workspace_widget_form_slug_hint"),
      },
      only_unstructured: {
        ...properties.only_unstructured,
        title: t("workspace_widget_unstructured"),
        description: t("workspace_widget_unstructured_hint"),
      },
      limit: limitProperty(properties.limit, t),
    },
  };
}

function serviceRequestsSchema(t: TFunction): JSONSchema2020 {
  const properties = serviceRequestsJsonSchema.properties!;
  const { enum: statuses, ...statusProperty } = properties.status;
  return {
    ...serviceRequestsJsonSchema,
    title: t("service_requests"),
    properties: {
      status: {
        ...statusProperty,
        oneOf: statuses!.map((status) => ({
          const: status,
          title: t(String(status)),
        })),
        title: t("workspace_widget_request_status"),
        description: t("workspace_widget_request_status_hint"),
      },
      limit: limitProperty(properties.limit, t),
    },
  };
}

function noConfigSchema(t: TFunction): JSONSchema2020 {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    title: t("workspace_config_title"),
    description: t("workspace_widget_no_config_options"),
    properties: {},
    // These widgets ignore config today. Preserve opaque saved keys unchanged.
    additionalProperties: true,
  };
}

const coreConfigSchemas = {
  allergies: noConfigSchema,
  symptoms: noConfigSchema,
  diagnosis: noConfigSchema,
  vitals: noConfigSchema,
  questionnaire_responses: responsesSchema,
  service_requests: serviceRequestsSchema,
  quick_actions: noConfigSchema,
  favorite_forms: noConfigSchema,
  draft_forms: noConfigSchema,
  encounter_tags: noConfigSchema,
  locations: noConfigSchema,
  care_team: noConfigSchema,
  departments: noConfigSchema,
  hospitalization: noConfigSchema,
  discharge: noConfigSchema,
  audit_logs: noConfigSchema,
  encounter_actions: noConfigSchema,
  reports: noConfigSchema,
} satisfies Record<string, (t: TFunction) => JSONSchema2020>;

export type CoreWidgetConfigType = keyof typeof coreConfigSchemas;
export const ENCOUNTER_WIDGET_TYPES: readonly string[] =
  Object.keys(coreConfigSchemas);

/** Unknown and plugin widgets obtain their schemas from their own definitions. */
export function getCoreWidgetConfigSchema(
  type: string,
  t: TFunction,
): JSONSchema2020 | undefined {
  if (!Object.hasOwn(coreConfigSchemas, type)) return undefined;
  return coreConfigSchemas[type as CoreWidgetConfigType](t);
}
