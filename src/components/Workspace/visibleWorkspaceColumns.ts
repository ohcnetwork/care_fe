import type { RenderColumn } from "@/pages/Encounters/workspace/parseEncounterWorkspace";
import {
  getWidgetAvailability,
  type WorkspaceAvailabilityContext,
} from "@/types/workspace/widgetAvailability";

/** Drop hidden widgets and the columns they leave empty before allocating grid tracks. */
export function visibleWorkspaceColumns(
  columns: RenderColumn[],
  context: WorkspaceAvailabilityContext,
  requiresActiveEncounter: (type: string) => boolean = () => false,
) {
  return columns
    .map((column) => ({
      ...column,
      widgets: column.widgets.filter(
        (widget) =>
          "error" in widget ||
          getWidgetAvailability(
            widget,
            context,
            requiresActiveEncounter(widget.type),
          ).state !== "hidden",
      ),
    }))
    .filter((column) => column.invalid || column.widgets.length > 0);
}
