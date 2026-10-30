import type { TFunction } from "i18next";
import type { z } from "zod";

import type { CareAppEncounterWidget } from "@/hooks/useCareAppEncounterWidgets";
import {
  getWorkspaceSurface,
  type EncounterWorkspaceTemplate,
} from "@/types/workspace/encounterWorkspace";
import { getWidgetRequirements } from "@/types/workspace/widgetAvailability";
import { getCoreWidgetConfigSchema } from "@/types/workspace/widgetConfigSchemas";

import { workspaceWidgetLabel } from "./workspaceEditorCatalog";
import { prepareWidgetConfigSchema } from "./workspaceWidgetSchema";

/**
 * Rules the JSON-schema form cannot express, reported as Zod issues so the
 * settings drawer and save-time validation show the same message.
 */
export function widgetConfigConsistencyIssues(
  config: Record<string, unknown>,
  t: TFunction,
): z.core.$ZodIssue[] {
  const { tabs, default_tab: defaultTab } = config;
  if (
    Array.isArray(tabs) &&
    typeof defaultTab === "string" &&
    !tabs.includes(defaultTab)
  ) {
    return [
      {
        code: "custom",
        path: ["default_tab"],
        message: t("workspace_config_default_tab_not_selected"),
        input: defaultTab,
      },
    ];
  }
  return [];
}

export function workspaceWidgetIssues(
  template: EncounterWorkspaceTemplate,
  plugins: ReadonlyMap<string, CareAppEncounterWidget>,
  t: TFunction,
) {
  const issues: string[] = [];
  for (const page of template.pages) {
    if (page.kind !== "custom") continue;
    for (const column of page.columns) {
      for (const widget of column.widgets) {
        const plugin = plugins.get(widget.type);
        const schema =
          getCoreWidgetConfigSchema(widget.type, t) ?? plugin?.configSchema;
        const name = `${page.title}: ${widget.title ?? workspaceWidgetLabel(widget.type, t)}`;
        if (getWorkspaceSurface(template) === "patient_history") {
          if (
            getWidgetRequirements(widget.type, plugin?.requiresActiveEncounter)
              .encounter !== "none"
          ) {
            issues.push(t("workspace_incompatible_widget", { name }));
          }
          // History screens have no encounter, so a status filter would hide
          // the section for everyone.
          if (widget.visible_when) {
            issues.push(t("workspace_history_status_filter", { name }));
          }
        }
        const validator =
          schema && prepareWidgetConfigSchema(schema, t)?.validator;
        const config = widget.config ?? {};
        if (
          (validator && !validator.safeParse(config).success) ||
          (validator && widgetConfigConsistencyIssues(config, t).length)
        ) {
          issues.push(t("workspace_invalid_widget_settings", { name }));
        }
      }
    }
  }
  return issues;
}
