import type { TFunction } from "i18next";

import {
  HISTORY_PAGE_KEYS,
  SYSTEM_PAGE_KEYS,
  type EncounterWorkspaceTemplate,
  type WorkspaceSurface,
} from "@/types/workspace/encounterWorkspace";
import type { CoreWidgetConfigType } from "@/types/workspace/widgetConfigSchemas";

import { workspaceWidgetLabel } from "./workspaceEditorCatalog";
import { systemPageLabel } from "./workspaceEditorUtils";

const ENCOUNTER_PAGE_WIDGETS: Partial<Record<string, CoreWidgetConfigType>> = {
  responses: "responses",
  observations: "observations",
  medicines: "medications",
  service_requests: "service_request_management",
  diagnostic_reports: "diagnostic_reports",
  plots: "plots",
  consents: "consents",
};

const HISTORY_PAGE_WIDGETS: Partial<Record<string, CoreWidgetConfigType>> = {
  responses: "history_responses",
  diagnostic_reports: "history_diagnostic_reports",
  symptoms: "history_symptoms",
  diagnoses: "history_diagnoses",
  allergies: "history_allergies",
  medications: "history_medications",
};

export function standardWorkspaceTemplate(
  surface: WorkspaceSurface,
  t: TFunction,
  pluginPageKeys: string[] = [],
): EncounterWorkspaceTemplate {
  const pageKeys =
    surface === "patient_history"
      ? HISTORY_PAGE_KEYS
      : [...new Set([...SYSTEM_PAGE_KEYS, ...pluginPageKeys])];
  const types =
    surface === "patient_history"
      ? HISTORY_PAGE_WIDGETS
      : ENCOUNTER_PAGE_WIDGETS;
  return {
    schema_version: 2,
    surface,
    pages: pageKeys.map((key) => {
      if (surface === "encounter" && key === "updates") {
        return {
          key,
          kind: "custom",
          title: systemPageLabel(key, t),
          columns: [
            {
              span: 8,
              widgets: [
                "quick_actions",
                "favorite_forms",
                "encounter_extensions",
                "draft_forms",
                "allergies",
                "symptoms",
                "diagnosis",
                "vitals",
                "questionnaire_responses",
              ].map((type) => ({ type })),
            },
            { span: 4, widgets: [{ type: "encounter_summary" }] },
          ],
        };
      }
      const type = types[key];
      return type
        ? {
            key,
            kind: "custom",
            title:
              surface === "patient_history"
                ? workspaceWidgetLabel(type, t)
                : systemPageLabel(key, t),
            columns: [{ span: 12, widgets: [{ type }] }],
          }
        : { key, kind: "system" };
    }),
  };
}

export interface WorkspaceStarter {
  id: string;
  surface: WorkspaceSurface;
  titleKey: string;
  descriptionKey: string;
  recommended?: boolean;
  build: (t: TFunction, pluginPageKeys: string[]) => EncounterWorkspaceTemplate;
}

const section = (type: CoreWidgetConfigType, title?: string) =>
  title ? { type, title } : { type };

/** Starters give authors a working screen to adjust instead of an empty grid. */
export const WORKSPACE_STARTERS: WorkspaceStarter[] = [
  {
    id: "standard_encounter",
    surface: "encounter",
    titleKey: "workspace_starter_standard_encounter",
    descriptionKey: "workspace_starter_standard_encounter_description",
    recommended: true,
    build: (t, pluginPageKeys) =>
      standardWorkspaceTemplate("encounter", t, pluginPageKeys),
  },
  {
    id: "ward_rounds",
    surface: "encounter",
    titleKey: "workspace_starter_ward_rounds",
    descriptionKey: "workspace_starter_ward_rounds_description",
    build: (t) => ({
      schema_version: 2,
      surface: "encounter",
      pages: [
        {
          key: "rounds",
          kind: "custom",
          title: t("workspace_starter_ward_rounds"),
          icon: "stethoscope",
          columns: [
            {
              span: 8,
              widgets: [
                section("vitals"),
                section("diagnosis"),
                section("symptoms"),
                section("questionnaire_responses"),
                section("service_requests"),
              ],
            },
            {
              span: 4,
              widgets: [
                section("quick_actions"),
                section("draft_forms"),
                section("care_team"),
                section("locations"),
                section("encounter_actions"),
              ],
            },
          ],
        },
        {
          key: "medicines",
          kind: "custom",
          title: systemPageLabel("medicines", t),
          columns: [{ span: 12, widgets: [section("medications")] }],
        },
        {
          key: "history",
          kind: "custom",
          title: t("clinical_history"),
          icon: "clipboard-list",
          columns: [{ span: 12, widgets: [section("clinical_history")] }],
        },
        { key: "notes", kind: "system" },
        { key: "files", kind: "system" },
      ],
    }),
  },
  {
    id: "outpatient_visit",
    surface: "encounter",
    titleKey: "workspace_starter_outpatient",
    descriptionKey: "workspace_starter_outpatient_description",
    build: (t) => ({
      schema_version: 2,
      surface: "encounter",
      pages: [
        {
          key: "visit",
          kind: "custom",
          title: t("workspace_starter_outpatient"),
          icon: "heart-pulse",
          columns: [
            {
              span: 12,
              widgets: [
                section("quick_actions"),
                section("favorite_forms"),
                section("vitals"),
                section("diagnosis"),
                section("questionnaire_responses"),
                section("history_medications"),
              ],
            },
          ],
        },
        {
          key: "orders",
          kind: "custom",
          title: systemPageLabel("service_requests", t),
          columns: [
            { span: 12, widgets: [section("service_request_management")] },
          ],
        },
        { key: "notes", kind: "system" },
      ],
    }),
  },
  {
    id: "blank_encounter",
    surface: "encounter",
    titleKey: "workspace_starter_blank",
    descriptionKey: "workspace_starter_blank_encounter_description",
    build: (t) => ({
      schema_version: 2,
      surface: "encounter",
      pages: [
        {
          key: "overview",
          kind: "custom",
          title: t("workspace_starter_blank_tab"),
          columns: [{ span: 12, widgets: [] }],
        },
      ],
    }),
  },
  {
    id: "standard_history",
    surface: "patient_history",
    titleKey: "workspace_starter_standard_history",
    descriptionKey: "workspace_starter_standard_history_description",
    recommended: true,
    build: (t) => standardWorkspaceTemplate("patient_history", t),
  },
  {
    id: "blank_history",
    surface: "patient_history",
    titleKey: "workspace_starter_blank",
    descriptionKey: "workspace_starter_blank_history_description",
    build: (t) => ({
      schema_version: 2,
      surface: "patient_history",
      pages: [
        {
          key: "overview",
          kind: "custom",
          title: t("workspace_starter_blank_tab"),
          columns: [{ span: 12, widgets: [] }],
        },
      ],
    }),
  },
];
