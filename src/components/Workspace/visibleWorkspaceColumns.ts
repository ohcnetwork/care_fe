import type { RenderColumn } from "@/pages/Encounters/workspace/parseEncounterWorkspace";
import {
  getWidgetAvailability,
  type WidgetCapabilities,
  type WorkspaceAvailabilityContext,
} from "@/types/workspace/widgetAvailability";

/** Drop hidden widgets and the columns they leave empty before allocating grid tracks. */
export function visibleWorkspaceColumns(
  columns: RenderColumn[],
  context: WorkspaceAvailabilityContext,
  capabilities: (type: string) => WidgetCapabilities | undefined = () =>
    undefined,
) {
  return columns
    .map((column) => ({
      ...column,
      widgets: column.widgets.filter(
        (widget) =>
          "error" in widget ||
          getWidgetAvailability(widget, context, capabilities(widget.type))
            .state !== "hidden",
      ),
    }))
    .filter((column) => column.invalid || column.widgets.length > 0);
}
