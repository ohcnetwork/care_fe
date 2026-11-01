import type { TFunction } from "i18next";

import {
  HISTORY_PAGE_KEYS,
  SYSTEM_PAGE_KEYS,
  type EncounterWorkspaceTemplate,
  type WorkspaceSurface,
} from "@/types/workspace/encounterWorkspace";
import type { CoreWidgetConfigType } from "@/types/workspace/widgetConfigSchemas";

import { systemPageLabel } from "./workspaceEditorUtils";

export function standardWorkspaceTemplate(
  surface: WorkspaceSurface,
  t: TFunction,
  pluginPageKeys: string[] = [],
): EncounterWorkspaceTemplate {
  const pageKeys =
    surface === "patient_history"
      ? HISTORY_PAGE_KEYS
      : [...new Set([...SYSTEM_PAGE_KEYS, ...pluginPageKeys])];
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
                "referrals",
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
      return { key, kind: "system" };
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
        { key: "medicines", kind: "system" },
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
                section("current_medications"),
              ],
            },
          ],
        },
        { key: "service_requests", kind: "system" },
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
    id: "my_forms",
    surface: "patient_history",
    titleKey: "workspace_starter_my_forms",
    descriptionKey: "workspace_starter_my_forms_description",
    build: (t) => ({
      schema_version: 2,
      surface: "patient_history",
      pages: [
        {
          key: "my_forms",
          kind: "custom",
          title: t("workspace_starter_my_forms"),
          icon: "clipboard-list",
          columns: [
            {
              span: 8,
              widgets: [
                {
                  type: "questionnaire_responses",
                  title: t("workspace_starter_my_forms"),
                  config: { authored_by: "me" },
                },
              ],
            },
            {
              span: 4,
              widgets: [
                section("current_medications"),
                section("recent_encounters"),
              ],
            },
          ],
        },
        ...HISTORY_PAGE_KEYS.map((key) => ({ key, kind: "system" as const })),
      ],
    }),
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
