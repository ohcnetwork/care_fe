import {
  EncounterWorkspaceWidget,
  RESERVED_ROUTE_KEYS,
  SYSTEM_PAGE_KEYS,
  encounterPageKeySchema,
  titleSchema,
  widgetSchema,
} from "@/types/workspace/encounterWorkspace";

export type RenderWidget =
  EncounterWorkspaceWidget | { error: true; title?: string };

export interface RenderColumn {
  span: number;
  widgets: RenderWidget[];
  invalid: boolean;
}

export type RenderPage =
  | {
      kind: "custom";
      key: string;
      title: string;
      icon?: string;
      columns: RenderColumn[];
      invalid: boolean;
    }
  | { kind: "system"; key: string; hidden?: boolean }
  | { kind: "invalid"; key: string; title: string; hidden?: boolean };

interface RenderWorkspace {
  pages: RenderPage[];
  unsupportedVersion: boolean;
  invalid: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExtraFields(value: Record<string, unknown>, fields: string[]) {
  return Object.keys(value).some((key) => !fields.includes(key));
}

/** Keep malformed configuration local while preserving safe configured routes. */
export function parseEncounterWorkspace(
  template: unknown,
  systemPageKeys: readonly string[],
): RenderWorkspace {
  const result: RenderWorkspace = {
    pages: [],
    unsupportedVersion: false,
    invalid: false,
  };
  if (!isRecord(template)) return { ...result, invalid: true };

  result.unsupportedVersion =
    Object.hasOwn(template, "schema_version") && template.schema_version !== 1;
  result.invalid =
    !Object.hasOwn(template, "schema_version") ||
    hasExtraFields(template, ["schema_version", "pages"]);
  if (!Array.isArray(template.pages)) return { ...result, invalid: true };
  if (template.pages.length > 50) result.invalid = true;

  const availableSystemKeys = new Set(systemPageKeys);
  const reservedSystemKeys = new Set([...SYSTEM_PAGE_KEYS, ...systemPageKeys]);
  const pageKeys = new Set<string>();
  let widgetCount = 0;

  const parseColumn = (value: unknown): RenderColumn => {
    const column: RenderColumn = { span: 1, widgets: [], invalid: false };
    if (!isRecord(value)) return { ...column, invalid: true };

    column.invalid = hasExtraFields(value, ["span", "widgets"]);
    if (
      typeof value.span === "number" &&
      Number.isInteger(value.span) &&
      value.span >= 1 &&
      value.span <= 12
    ) {
      column.span = value.span;
    } else {
      column.invalid = true;
    }
    if (!Array.isArray(value.widgets)) return { ...column, invalid: true };

    const remaining = Math.min(50, 200 - widgetCount);
    if (value.widgets.length > remaining) {
      column.invalid = true;
      result.invalid = true;
    }
    for (const rawWidget of value.widgets.slice(0, remaining)) {
      widgetCount += 1;
      const parsed = widgetSchema.safeParse(rawWidget);
      column.widgets.push(
        parsed.success
          ? parsed.data
          : {
              error: true,
              title: isRecord(rawWidget)
                ? titleSchema.safeParse(rawWidget.title).data
                : undefined,
            },
      );
    }
    return column;
  };

  for (const value of template.pages.slice(0, 50)) {
    if (!isRecord(value)) {
      result.invalid = true;
      continue;
    }
    // Keep safe configured routes while their plugin is still loading or absent.
    const configuredSystemKey =
      value.kind === "system" &&
      typeof value.key === "string" &&
      /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value.key) &&
      !RESERVED_ROUTE_KEYS.includes(value.key)
        ? value.key
        : undefined;
    const key =
      configuredSystemKey ?? encounterPageKeySchema.safeParse(value.key).data;
    if (
      key === undefined ||
      pageKeys.has(key) ||
      (value.kind === "custom" && reservedSystemKeys.has(key))
    ) {
      result.invalid = true;
      continue;
    }
    pageKeys.add(key);
    const title = titleSchema.safeParse(value.title).data;

    if (value.kind === "system" && availableSystemKeys.has(key)) {
      if (value.hidden !== undefined && typeof value.hidden !== "boolean") {
        result.pages.push({ kind: "invalid", key, title: title ?? key });
      } else {
        if (hasExtraFields(value, ["key", "kind", "hidden"]))
          result.invalid = true;
        result.pages.push({ kind: "system", key, hidden: value.hidden });
      }
      continue;
    }
    if (value.kind !== "custom") {
      result.pages.push({
        kind: "invalid",
        key,
        title: title ?? key,
        hidden: value.kind === "system" && value.hidden === true,
      });
      continue;
    }

    const page: Extract<RenderPage, { kind: "custom" }> = {
      kind: "custom",
      key,
      title: title ?? key,
      columns: [],
      invalid:
        title === undefined ||
        hasExtraFields(value, ["key", "kind", "title", "icon", "columns"]),
    };
    if (value.icon !== undefined) {
      if (
        typeof value.icon === "string" &&
        value.icon.length > 0 &&
        value.icon.length <= 64
      )
        page.icon = value.icon;
      else page.invalid = true;
    }
    if (Array.isArray(value.columns)) {
      if (!value.columns.length || value.columns.length > 12)
        page.invalid = true;
      if (value.columns.length > 12) result.invalid = true;
      page.columns = value.columns.slice(0, 12).map(parseColumn);
      // Bounded positive fractions remain usable even if their sum exceeds 12.
      if (page.columns.reduce((sum, column) => sum + column.span, 0) > 12)
        page.invalid = true;
    } else {
      page.invalid = true;
    }
    result.pages.push(page);
  }
  return result;
}
