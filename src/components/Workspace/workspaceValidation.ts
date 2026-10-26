import type { TFunction } from "i18next";

import type { CareAppEncounterWidget } from "@/hooks/useCareAppEncounterWidgets";
import {
  getWorkspaceSurface,
  type EncounterWorkspaceTemplate,
} from "@/types/workspace/encounterWorkspace";
import { getWidgetRequirements } from "@/types/workspace/widgetAvailability";
import { getCoreWidgetConfigSchema } from "@/types/workspace/widgetConfigSchemas";

import { workspaceWidgetLabel } from "./workspaceEditorCatalog";
import { prepareWidgetConfigSchema } from "./workspaceWidgetSchema";

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
        if (
          getWorkspaceSurface(template) === "patient_history" &&
          getWidgetRequirements(widget.type, plugin?.requiresActiveEncounter)
            .encounter !== "none"
        ) {
          issues.push(t("workspace_incompatible_widget", { name }));
        }
        const validator =
          schema && prepareWidgetConfigSchema(schema, t)?.validator;
        if (validator && !validator.safeParse(widget.config ?? {}).success) {
          issues.push(t("workspace_invalid_widget_settings", { name }));
        }
      }
    }
  }
  return issues;
}
