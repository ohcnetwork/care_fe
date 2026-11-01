import { z } from "zod";

import { EncounterStatus } from "@/types/emr/encounter/encounter";
import type { WorkspaceTemplate } from "@/types/workspace/workspace";

export const SYSTEM_PAGE_KEYS = [
  "updates",
  "responses",
  "observations",
  "medicines",
  "immunizations",
  "service_requests",
  "referrals",
  "diagnostic_reports",
  "plots",
  "files",
  "notes",
  "devices",
  "consents",
];

export const RESERVED_ROUTE_KEYS = [
  "prescriptions",
  "questionnaire",
  "questionnaire_response",
  "type",
  "report",
];

export const MAX_ENCOUNTER_WORKSPACE_COLUMNS = 4;

export { ENCOUNTER_WIDGET_TYPES } from "./widgetConfigSchemas";

/** Screens one workspace configures; each keeps its own ordered tabs. */
export const WORKSPACE_SURFACES = ["encounter", "patient_history"] as const;
export type WorkspaceSurface = (typeof WORKSPACE_SURFACES)[number];

/** Template key holding each surface's tabs. */
export const WORKSPACE_SURFACE_PAGES_KEY = {
  encounter: "pages",
  patient_history: "history_pages",
} as const satisfies Record<WorkspaceSurface, string>;

/** Migrates pre-unification templates while preserving their configured tabs. */
export function normalizeWorkspaceTemplate(
  template: WorkspaceTemplate,
): WorkspaceTemplate {
  // Stored templates are untrusted; leave malformed ones for the parser to reject.
  if (typeof template !== "object" || template === null) return template;
  const { surface, ...workspace } = template;
  if (surface === "patient_history") {
    return Object.hasOwn(template, "history_pages")
      ? { ...workspace, schema_version: 2 }
      : {
          ...workspace,
          schema_version: 2,
          pages: SYSTEM_PAGE_KEYS.map((key) => ({ key, kind: "system" })),
          history_pages: workspace.pages,
        };
  }
  if (surface === "encounter") return workspace;
  return template;
}

export const HISTORY_PAGE_KEYS = [
  "responses",
  "diagnostic_reports",
  "symptoms",
  "diagnoses",
  "procedures",
  "allergies",
  "medications",
  "immunizations",
];

export const PLUGIN_ENCOUNTER_WIDGET_TYPE_PATTERN =
  /^[a-z0-9][a-z0-9_-]{0,63}\.[a-z][a-z0-9_]{0,63}$/;

export const systemPageKeySchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/)
  .refine((key) => !RESERVED_ROUTE_KEYS.includes(key));

// Shared by custom page keys and questionnaire return links.
export const encounterPageKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9_-]{0,63}$/)
  .refine((key) => !RESERVED_ROUTE_KEYS.includes(key));

export const titleSchema = z.string().trim().min(1).max(120);
export const widgetSchema = z.strictObject({
  type: z
    .string()
    .refine(
      (type) =>
        /^[a-z][a-z0-9_]{0,63}$/.test(type) ||
        PLUGIN_ENCOUNTER_WIDGET_TYPE_PATTERN.test(type),
    ),
  title: titleSchema.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  visible_when: z
    .strictObject({
      "encounter.status": z
        .array(z.enum(EncounterStatus))
        .min(1)
        .max(Object.values(EncounterStatus).length),
    })
    .optional(),
});

const customPageSchema = z.strictObject({
  key: encounterPageKeySchema,
  kind: z.literal("custom"),
  title: titleSchema,
  icon: z.string().min(1).max(64).optional(),
  hidden: z.boolean().optional(),
  columns: z
    .array(
      z.strictObject({
        span: z.number().int().min(1).max(12),
        widgets: z.array(widgetSchema).max(50),
      }),
    )
    .min(1)
    .max(MAX_ENCOUNTER_WORKSPACE_COLUMNS)
    .refine((columns) => columns.reduce((sum, col) => sum + col.span, 0) <= 12),
});

const systemPageSchema = z.strictObject({
  key: systemPageKeySchema,
  kind: z.literal("system"),
  hidden: z.boolean().optional(),
});

const pagesSchema = z
  .array(z.discriminatedUnion("kind", [customPageSchema, systemPageSchema]))
  .min(1)
  .max(50)
  .refine(
    (pages) => new Set(pages.map((page) => page.key)).size === pages.length,
    {
      message: "Page keys must be unique",
    },
  );

const countWidgets = (pages: z.infer<typeof pagesSchema> = []) =>
  pages.reduce(
    (count, page) =>
      count +
      (page.kind === "custom"
        ? page.columns.reduce((sum, column) => sum + column.widgets.length, 0)
        : 0),
    0,
  );

const workspaceSchema = z
  .strictObject({
    schema_version: z.union([z.literal(1), z.literal(2)]),
    pages: pagesSchema,
    /** Absent means clinical history keeps its standard tabs. */
    history_pages: pagesSchema.optional(),
  })
  .refine(
    ({ schema_version, history_pages }) =>
      schema_version === 2 || history_pages === undefined,
    { message: "Clinical history pages require schema version 2" },
  )
  .refine(
    ({ pages, history_pages }) =>
      countWidgets(pages) + countWidgets(history_pages) <= 200,
    { message: "A workspace can contain at most 200 widgets" },
  );

export type EncounterWorkspaceWidget = z.infer<typeof widgetSchema>;
export type EncounterWorkspaceCustomPage = z.infer<typeof customPageSchema>;
export type EncounterWorkspaceTemplate = z.infer<typeof workspaceSchema>;
export const workspaceStructureSchema = workspaceSchema;

export function hasHistoryPages(template: unknown): boolean {
  return (
    template !== null &&
    typeof template === "object" &&
    Object.hasOwn(template, "history_pages")
  );
}

function savedSystemKeys(pages: { kind: string; key: string }[] = []) {
  return new Set(
    pages.filter((page) => page.kind === "system").map((page) => page.key),
  );
}

/** Widget availability is a rendering concern; unknown widget types remain valid. */
export function createEncounterWorkspaceSchema(
  additionalSystemPageKeys: readonly string[] = [],
  savedTemplate?: unknown,
) {
  const saved = workspaceSchema.safeParse(savedTemplate);
  const savedEncounterKeys = savedSystemKeys(saved.data?.pages);
  const savedHistoryKeys = savedSystemKeys(saved.data?.history_pages);
  const encounterKeys = new Set([
    ...SYSTEM_PAGE_KEYS,
    ...additionalSystemPageKeys,
  ]);
  const historyKeys = new Set(HISTORY_PAGE_KEYS);
  return workspaceSchema.refine(
    (template) =>
      template.pages.every((page) =>
        page.kind === "system"
          ? encounterKeys.has(page.key) || savedEncounterKeys.has(page.key)
          : template.schema_version === 2 || !encounterKeys.has(page.key),
      ) &&
      (template.history_pages ?? []).every(
        (page) =>
          page.kind !== "system" ||
          historyKeys.has(page.key) ||
          savedHistoryKeys.has(page.key),
      ),
    { message: "Invalid system page or reserved legacy custom page" },
  );
}
