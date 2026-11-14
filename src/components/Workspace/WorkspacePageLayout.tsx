import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type {
  RenderColumn,
  RenderWidget,
} from "@/pages/Encounters/workspace/parseEncounterWorkspace";

export function WorkspacePageLayout({
  columns,
  renderWidget,
  renderColumnError,
}: {
  columns: RenderColumn[];
  renderWidget: (widget: RenderWidget, index: number) => ReactNode;
  renderColumnError?: () => ReactNode;
}) {
  return (
    <div className="@container">
      <div
        className={cn(
          "grid min-w-0 grid-cols-1 items-start gap-3 @4xl:grid-cols-[var(--workspace-columns)]",
          columns.length > 1 && "@xl:grid-cols-2",
        )}
        style={
          {
            "--workspace-columns": columns
              .map(({ span }) => `minmax(0, ${span}fr)`)
              .join(" "),
          } as React.CSSProperties
        }
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="min-w-0 space-y-3">
            {column.invalid && renderColumnError?.()}
            {column.widgets.map(renderWidget)}
          </div>
        ))}
      </div>
    </div>
  );
}
