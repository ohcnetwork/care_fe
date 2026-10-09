import type { TFunction } from "i18next";

import type { EncounterWorkspaceTemplate } from "@/types/workspace/encounterWorkspace";

export type WorkspacePage = EncounterWorkspaceTemplate["pages"][number];
export interface WidgetSelection {
  column: number;
  widget: number;
}

/** Reject values that JSON.stringify would silently replace with null. */
export function parseWorkspaceJson(text: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(text, (_key, value: unknown) => {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("Expected a finite JSON number");
    }
    return value;
  });
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }
  return parsed as Record<string, unknown>;
}

export function systemPageLabel(key: string, t: TFunction) {
  if (key === "medicines") return t("medications");
  if (key === "responses") return t("ENCOUNTER_TAB__qnr_responses");
  return t("ENCOUNTER_TAB__" + key, { defaultValue: key });
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function pageWidgetCount(page: WorkspacePage) {
  return page.kind === "custom"
    ? page.columns.reduce((count, column) => count + column.widgets.length, 0)
    : 0;
}
