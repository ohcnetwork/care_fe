import type { TFunction } from "i18next";
import { z } from "zod";

import { Classification } from "@/types/emr/activityDefinition/activityDefinition";
import {
  ENCOUNTER_CLASS,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import { REFERRAL_STATUSES } from "@/types/emr/referral/referral";
import { Status } from "@/types/emr/serviceRequest/serviceRequest";
import type { JSONSchema2020, JSONSchemaProperty } from "@/Utils/schema/types";

const widgetLimitSchema = z.number().int().min(1).max(100).optional();

export const CLINICAL_HISTORY_TABS = [
  "responses",
  "diagnostic_reports",
  "symptoms",
  "diagnoses",
  "allergies",
  "medications",
] as const;
export const MEDICATION_TABS = [
  "prescriptions",
  "statements",
  "administration",
  "dispense_history",
] as const;
export const ENCOUNTER_SUMMARY_TABS = [
  "details",
  "actions",
  "reports",
] as const;

/** A subset of tabs plus the one that opens first. */
function tabsSchema<const T extends readonly [string, ...string[]]>(tabs: T) {
  return z.strictObject({
    tabs: z.array(z.enum(tabs)).min(1).max(tabs.length).optional(),
    default_tab: z.enum(tabs).optional(),
  });
}

/** The observation analyse endpoint accepts at most 20 codes per request. */
export const VITALS_MAX_CODES = 20;

const observationCodeSchema = z.strictObject({
  system: z.string().trim().min(1).meta({ pattern: "\\S" }),
  code: z.string().trim().min(1).meta({ pattern: "\\S" }),
  display: z.string().trim().min(1).meta({ pattern: "\\S" }),
});

export const vitalsConfigSchema = z.strictObject({
  codes: z.array(observationCodeSchema).min(1).max(VITALS_MAX_CODES).optional(),
});

export const outstandingOrdersConfigSchema = z.strictObject({
  category: z.enum(Classification).optional(),
  include_completed: z.boolean().optional(),
  include_on_hold: z.boolean().optional(),
  limit: widgetLimitSchema,
});

export const currentMedicationsConfigSchema = z.strictObject({
  sources: z.enum(["both", "prescriptions", "statements"]).optional(),
  limit: widgetLimitSchema,
});

export const recentEncountersConfigSchema = z.strictObject({
  care_team: z.enum(["all", "mine"]).optional(),
  care_team_user: z.string().trim().min(1).meta({ pattern: "\\S" }).optional(),
  encounter_class: z.enum(ENCOUNTER_CLASS).optional(),
  status: z.enum(EncounterStatus).optional(),
  exclude_current: z.boolean().optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export const observationsConfigSchema = z.strictObject({
  limit: widgetLimitSchema,
});

export const plotsConfigSchema = z.strictObject({
  plot: z.string().trim().min(1).meta({ pattern: "\\S" }).optional(),
});

export const observationChartConfigSchema = z.strictObject({
  plot: z.string().trim().min(1).meta({ pattern: "\\S" }).optional(),
  groups: z
    .array(z.string().trim().min(1).meta({ pattern: "\\S" }))
    .min(1)
    .max(20)
    .optional(),
  height: z.number().int().min(120).max(600).optional(),
  columns: z.number().int().min(1).max(2).optional(),
});

export const clinicalHistoryConfigSchema = tabsSchema(CLINICAL_HISTORY_TABS);
export const medicationsConfigSchema = tabsSchema(MEDICATION_TABS);
export const encounterSummaryConfigSchema = tabsSchema(ENCOUNTER_SUMMARY_TABS);

export const responsesConfigSchema = z.strictObject({
  questionnaire_slug: z
    .string()
    .trim()
    .min(1)
    // JSON Schema cannot express trimming; require a non-whitespace character.
    .meta({ pattern: "\\S" })
    .optional(),
  only_unstructured: z.boolean().optional(),
  role: z.uuid().optional(),
  limit: widgetLimitSchema,
});

export const serviceRequestsConfigSchema = z.strictObject({
  status: z.enum(Status).exclude([Status.unknown]).optional(),
  limit: widgetLimitSchema,
});

export const referralsConfigSchema = z.strictObject({
  status: z.enum(REFERRAL_STATUSES).optional(),
  assigned_to_me: z.boolean().optional(),
  limit: widgetLimitSchema,
});

// These validators use only object, string, boolean, integer, array, and enum
// keywords, all supported by CARE's JSON Schema form contract.
function toJsonSchema(schema: z.ZodType): JSONSchema2020 {
  return z.toJSONSchema(schema, {
    target: "draft-2020-12",
    io: "input",
  }) as JSONSchema2020;
}
const responsesJsonSchema = toJsonSchema(responsesConfigSchema);
const serviceRequestsJsonSchema = toJsonSchema(serviceRequestsConfigSchema);
const referralsJsonSchema = toJsonSchema(referralsConfigSchema);
const vitalsJsonSchema = toJsonSchema(vitalsConfigSchema);
const outstandingOrdersJsonSchema = toJsonSchema(outstandingOrdersConfigSchema);
const currentMedicationsJsonSchema = toJsonSchema(
  currentMedicationsConfigSchema,
);
const recentEncountersJsonSchema = toJsonSchema(recentEncountersConfigSchema);
const observationsJsonSchema = toJsonSchema(observationsConfigSchema);
const plotsJsonSchema = toJsonSchema(plotsConfigSchema);
const observationChartJsonSchema = toJsonSchema(observationChartConfigSchema);
const clinicalHistoryJsonSchema = toJsonSchema(clinicalHistoryConfigSchema);
const medicationsJsonSchema = toJsonSchema(medicationsConfigSchema);
const encounterSummaryJsonSchema = toJsonSchema(encounterSummaryConfigSchema);

/** Replace a bare enum with titled options so the form shows labels. */
function titledEnum(
  property: JSONSchemaProperty,
  label: (value: string) => string,
): JSONSchemaProperty {
  const { enum: values, ...rest } = property;
  return {
    ...rest,
    oneOf: values!.map((value) => ({
      const: value,
      title: label(String(value)),
    })),
  };
}

function tabsProperties(
  schema: JSONSchema2020,
  t: TFunction,
  label: (value: string) => string,
): JSONSchema2020["properties"] {
  const properties = schema.properties!;
  return {
    tabs: {
      ...properties.tabs,
      items: titledEnum(properties.tabs.items!, label),
      title: t("workspace_widget_tabs"),
      description: t("workspace_widget_tabs_hint"),
    },
    default_tab: {
      ...titledEnum(properties.default_tab, label),
      title: t("workspace_widget_default_tab"),
      description: t("workspace_widget_default_tab_hint"),
    },
  };
}

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
      role: {
        ...properties.role,
        title: t("author_role"),
        description: t("author_role_filter_hint"),
      },
      limit: limitProperty(properties.limit, t),
    },
  };
}

function serviceRequestsSchema(t: TFunction): JSONSchema2020 {
  const properties = serviceRequestsJsonSchema.properties!;
  return {
    ...serviceRequestsJsonSchema,
    title: t("service_requests"),
    properties: {
      status: {
        ...titledEnum(properties.status, (status) => t(status)),
        title: t("workspace_widget_request_status"),
        description: t("workspace_widget_request_status_hint"),
      },
      limit: limitProperty(properties.limit, t),
    },
  };
}

function vitalsSchema(t: TFunction): JSONSchema2020 {
  const properties = vitalsJsonSchema.properties!;
  const codeProperties = properties.codes.items!.properties!;
  return {
    ...vitalsJsonSchema,
    title: t("vitals"),
    properties: {
      codes: {
        ...properties.codes,
        title: t("workspace_widget_vital_codes"),
        description: t("workspace_widget_vital_codes_hint", {
          maximum: VITALS_MAX_CODES,
        }),
        items: {
          ...properties.codes.items,
          title: t("observation_code"),
          properties: {
            system: { ...codeProperties.system, title: t("system") },
            code: { ...codeProperties.code, title: t("code") },
            display: { ...codeProperties.display, title: t("display") },
          },
        },
      },
    },
  };
}

function outstandingOrdersSchema(t: TFunction): JSONSchema2020 {
  const properties = outstandingOrdersJsonSchema.properties!;
  return {
    ...outstandingOrdersJsonSchema,
    title: t("workspace_outstanding_orders"),
    properties: {
      category: {
        ...titledEnum(properties.category, (category) => t(category)),
        title: t("category"),
        description: t("workspace_widget_order_category_hint"),
      },
      include_completed: {
        ...properties.include_completed,
        title: t("workspace_widget_include_completed"),
        description: t("workspace_widget_include_completed_hint"),
      },
      include_on_hold: {
        ...properties.include_on_hold,
        title: t("workspace_widget_include_on_hold"),
        description: t("workspace_widget_include_on_hold_hint"),
      },
      limit: limitProperty(properties.limit, t),
    },
  };
}

function currentMedicationsSchema(t: TFunction): JSONSchema2020 {
  const properties = currentMedicationsJsonSchema.properties!;
  return {
    ...currentMedicationsJsonSchema,
    title: t("workspace_current_medications"),
    properties: {
      sources: {
        ...titledEnum(properties.sources, (source) =>
          t(`workspace_widget_medication_sources_${source}`),
        ),
        title: t("workspace_widget_medication_sources"),
        description: t("workspace_widget_medication_sources_hint"),
      },
      limit: limitProperty(properties.limit, t),
    },
  };
}

function recentEncountersSchema(t: TFunction): JSONSchema2020 {
  const properties = recentEncountersJsonSchema.properties!;
  return {
    ...recentEncountersJsonSchema,
    title: t("workspace_recent_encounters"),
    properties: {
      care_team: {
        ...titledEnum(properties.care_team, (option) =>
          t(`workspace_widget_care_team_${option}`),
        ),
        title: t("workspace_widget_care_team_filter"),
        description: t("workspace_widget_care_team_filter_hint"),
      },
      care_team_user: {
        ...properties.care_team_user,
        title: t("workspace_widget_care_team_user"),
        description: t("workspace_widget_care_team_user_hint"),
      },
      encounter_class: {
        ...titledEnum(properties.encounter_class, (value) =>
          t(`encounter_class__${value}`),
        ),
        title: t("encounter_class"),
        description: t("workspace_widget_encounter_class_hint"),
      },
      status: {
        ...titledEnum(properties.status, (value) =>
          t(`encounter_status__${value}`),
        ),
        title: t("status"),
        description: t("workspace_widget_encounter_status_hint"),
      },
      exclude_current: {
        ...properties.exclude_current,
        title: t("workspace_widget_exclude_current"),
        description: t("workspace_widget_exclude_current_hint"),
      },
      limit: limitProperty(properties.limit, t),
    },
  };
}

function observationsSchema(t: TFunction): JSONSchema2020 {
  const properties = observationsJsonSchema.properties!;
  return {
    ...observationsJsonSchema,
    title: t("observations"),
    properties: {
      limit: {
        ...properties.limit,
        title: t("workspace_widget_recent_limit"),
        description: t("workspace_widget_observations_limit_hint", {
          minimum: properties.limit.minimum,
          maximum: properties.limit.maximum,
        }),
      },
    },
  };
}

function plotsSchema(t: TFunction): JSONSchema2020 {
  const properties = plotsJsonSchema.properties!;
  return {
    ...plotsJsonSchema,
    title: t("ENCOUNTER_TAB__plots"),
    properties: {
      plot: {
        ...properties.plot,
        title: t("workspace_widget_default_plot"),
        description: t("workspace_widget_default_plot_hint"),
      },
    },
  };
}

function observationChartSchema(t: TFunction): JSONSchema2020 {
  const properties = observationChartJsonSchema.properties!;
  return {
    ...observationChartJsonSchema,
    title: t("workspace_observation_chart"),
    properties: {
      plot: {
        ...properties.plot,
        title: t("workspace_widget_chart_plot"),
        description: t("workspace_widget_chart_plot_hint"),
      },
      groups: {
        ...properties.groups,
        items: {
          ...properties.groups.items,
          title: t("workspace_widget_chart_group"),
        },
        title: t("workspace_widget_chart_groups"),
        description: t("workspace_widget_chart_groups_hint"),
      },
      height: {
        ...properties.height,
        title: t("workspace_widget_chart_height"),
        description: t("workspace_widget_chart_height_hint", {
          minimum: properties.height.minimum,
          maximum: properties.height.maximum,
        }),
      },
      columns: {
        ...properties.columns,
        title: t("workspace_widget_chart_columns"),
        description: t("workspace_widget_chart_columns_hint"),
      },
    },
  };
}

function clinicalHistorySchema(t: TFunction): JSONSchema2020 {
  const labels: Record<string, string> = {
    responses: t("responses"),
    diagnostic_reports: t("diagnostic_report_other", { count: 2 }),
    symptoms: t("past_symptoms"),
    diagnoses: t("past_diagnoses"),
    allergies: t("allergies"),
    medications: t("past_medications"),
  };
  return {
    ...clinicalHistoryJsonSchema,
    title: t("clinical_history"),
    properties: tabsProperties(
      clinicalHistoryJsonSchema,
      t,
      (value) => labels[value] ?? value,
    ),
  };
}

function medicationsSchema(t: TFunction): JSONSchema2020 {
  const labels: Record<string, string> = {
    prescriptions: t("prescriptions"),
    statements: t("medication_statements"),
    administration: t("medicine_administration"),
    dispense_history: t("dispense_history"),
  };
  return {
    ...medicationsJsonSchema,
    title: t("medications"),
    properties: tabsProperties(
      medicationsJsonSchema,
      t,
      (value) => labels[value] ?? value,
    ),
  };
}

function encounterSummarySchema(t: TFunction): JSONSchema2020 {
  return {
    ...encounterSummaryJsonSchema,
    title: t("workspace_encounter_summary"),
    properties: tabsProperties(encounterSummaryJsonSchema, t, (value) =>
      t(value),
    ),
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

function referralsSchema(t: TFunction): JSONSchema2020 {
  const properties = referralsJsonSchema.properties!;
  const { enum: statuses, ...statusProperty } = properties.status;
  return {
    ...referralsJsonSchema,
    title: t("referrals"),
    properties: {
      status: {
        ...statusProperty,
        oneOf: statuses!.map((status) => ({
          const: status,
          title: t(`referral_status_${status}`),
        })),
        title: t("referral_filter_status"),
        description: t("workspace_widget_referral_status_hint"),
      },
      assigned_to_me: {
        ...properties.assigned_to_me,
        title: t("assigned_to_me"),
      },
      limit: {
        ...limitProperty(properties.limit, t),
        description: t("workspace_widget_referral_limit_hint"),
      },
    },
  };
}

const coreConfigSchemas = {
  allergies: noConfigSchema,
  symptoms: noConfigSchema,
  diagnosis: noConfigSchema,
  vitals: vitalsSchema,
  questionnaire_responses: responsesSchema,
  service_requests: serviceRequestsSchema,
  outstanding_orders: outstandingOrdersSchema,
  current_medications: currentMedicationsSchema,
  recent_encounters: recentEncountersSchema,
  referrals: referralsSchema,
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
  responses: noConfigSchema,
  observations: observationsSchema,
  medications: medicationsSchema,
  service_request_management: noConfigSchema,
  diagnostic_reports: noConfigSchema,
  plots: plotsSchema,
  observation_chart: observationChartSchema,
  consents: noConfigSchema,
  account: noConfigSchema,
  encounter_summary: encounterSummarySchema,
  encounter_extensions: noConfigSchema,
  clinical_history: clinicalHistorySchema,
  history_responses: noConfigSchema,
  history_diagnostic_reports: noConfigSchema,
  history_symptoms: noConfigSchema,
  history_diagnoses: noConfigSchema,
  history_allergies: noConfigSchema,
  history_medications: noConfigSchema,
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
