import {
  EncounterStatus,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import type {
  EncounterWorkspaceCustomPage,
  EncounterWorkspaceWidget,
} from "@/types/workspace/encounterWorkspace";

export const WORKSPACE_LAYOUTS = [
  { id: "single", spans: [12] },
  { id: "main_side", spans: [8, 4] },
  { id: "side_main", spans: [4, 8] },
  { id: "halves", spans: [6, 6] },
  { id: "thirds", spans: [4, 4, 4] },
] as const;

export type WorkspaceLayoutId = (typeof WORKSPACE_LAYOUTS)[number]["id"];

const MAX_COLUMN_WIDGETS = 50;

export function detectLayout(
  columns: EncounterWorkspaceCustomPage["columns"],
): WorkspaceLayoutId | "custom" {
  const spans = columns.map((column) => column.span);
  return (
    WORKSPACE_LAYOUTS.find(
      (layout) =>
        layout.spans.length === spans.length &&
        layout.spans.every((span, index) => span === spans[index]),
    )?.id ?? "custom"
  );
}

/** Keep every section when a layout has fewer columns by merging the overflow into the last one. */
export function applyLayout(
  page: EncounterWorkspaceCustomPage,
  spans: readonly number[],
): EncounterWorkspaceCustomPage {
  const columns = spans.map((span, index) => ({
    span,
    widgets: [...(page.columns[index]?.widgets ?? [])],
  }));
  for (const column of page.columns.slice(spans.length)) {
    columns[columns.length - 1].widgets.push(...column.widgets);
  }
  return { ...page, columns };
}

export function canApplyLayout(
  page: EncounterWorkspaceCustomPage,
  spans: readonly number[],
) {
  return applyLayout(page, spans).columns.every(
    (column) => column.widgets.length <= MAX_COLUMN_WIDGETS,
  );
}

/** Column names follow the preset so authors think in "main" and "side", not spans. */
export function layoutColumnLabelKeys(layout: WorkspaceLayoutId | "custom") {
  switch (layout) {
    case "single":
      return ["workspace_studio_column_main"];
    case "main_side":
      return ["workspace_studio_column_main", "workspace_studio_column_side"];
    case "side_main":
      return ["workspace_studio_column_side", "workspace_studio_column_main"];
    case "halves":
      return ["workspace_studio_column_left", "workspace_studio_column_right"];
    case "thirds":
      return [
        "workspace_studio_column_left",
        "workspace_studio_column_middle",
        "workspace_studio_column_right",
      ];
    default:
      return [];
  }
}

const INACTIVE_ENCOUNTER_STATUSES = new Set<string>(inactiveEncounterStatus);
export const ACTIVE_ENCOUNTER_STATUSES = Object.values(EncounterStatus).filter(
  (status) => !INACTIVE_ENCOUNTER_STATUSES.has(status),
);
export const CLOSED_ENCOUNTER_STATUSES = Object.values(EncounterStatus).filter(
  (status) => INACTIVE_ENCOUNTER_STATUSES.has(status),
);

export type SectionVisibilityMode = "always" | "active" | "closed" | "custom";

export function sectionVisibilityMode(
  widget: EncounterWorkspaceWidget,
): SectionVisibilityMode {
  const statuses = widget.visible_when?.["encounter.status"];
  if (!statuses) return "always";
  const selected = new Set(statuses);
  const matches = (expected: EncounterStatus[]) =>
    statuses.length === expected.length &&
    expected.every((status) => selected.has(status));
  if (matches(ACTIVE_ENCOUNTER_STATUSES)) return "active";
  if (matches(CLOSED_ENCOUNTER_STATUSES)) return "closed";
  return "custom";
}

export function applySectionVisibilityMode(
  widget: EncounterWorkspaceWidget,
  mode: SectionVisibilityMode,
): EncounterWorkspaceWidget {
  const next = { ...widget };
  switch (mode) {
    case "always":
      delete next.visible_when;
      return next;
    case "active":
      return {
        ...next,
        visible_when: { "encounter.status": [...ACTIVE_ENCOUNTER_STATUSES] },
      };
    case "closed":
      return {
        ...next,
        visible_when: { "encounter.status": [...CLOSED_ENCOUNTER_STATUSES] },
      };
    case "custom":
      return {
        ...next,
        visible_when: widget.visible_when ?? {
          "encounter.status": [EncounterStatus.IN_PROGRESS],
        },
      };
  }
}
