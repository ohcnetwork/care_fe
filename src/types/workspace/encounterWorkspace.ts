import { z } from "zod";

import { EncounterStatus } from "@/types/emr/encounter/encounter";

export const SYSTEM_PAGE_KEYS = [
  "updates",
  "responses",
  "observations",
  "medicines",
  "service_requests",
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

export const PLUGIN_ENCOUNTER_WIDGET_TYPE_PATTERN =
  /^[a-z0-9][a-z0-9_-]{0,63}\.[a-z][a-z0-9_]{0,63}$/;

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
  key: z.string().min(1).max(64),
  kind: z.literal("system"),
  hidden: z.boolean().optional(),
});

const workspaceSchema = z
  .strictObject({
    schema_version: z.literal(1),
    pages: z
      .array(z.discriminatedUnion("kind", [customPageSchema, systemPageSchema]))
      .min(1)
      .max(50),
  })
  .refine(
    ({ pages }) => new Set(pages.map((page) => page.key)).size === pages.length,
    { message: "Page keys must be unique" },
  )
  .refine(
    ({ pages }) =>
      pages.reduce(
        (count, page) =>
          count +
          (page.kind === "custom"
            ? page.columns.reduce(
                (sum, column) => sum + column.widgets.length,
                0,
              )
            : 0),
        0,
      ) <= 200,
    { message: "A workspace can contain at most 200 widgets" },
  );

export type EncounterWorkspaceWidget = z.infer<typeof widgetSchema>;
export type EncounterWorkspaceCustomPage = z.infer<typeof customPageSchema>;
export type EncounterWorkspaceTemplate = z.infer<typeof workspaceSchema>;

/** Widget availability is a rendering concern; unknown widget types remain valid. */
export function createEncounterWorkspaceSchema(
  additionalSystemPageKeys: readonly string[] = [],
) {
  const systemKeys = new Set([
    ...SYSTEM_PAGE_KEYS,
    ...additionalSystemPageKeys,
  ]);
  return workspaceSchema.refine(
    ({ pages }) =>
      pages.every((page) =>
        page.kind === "system"
          ? systemKeys.has(page.key)
          : !systemKeys.has(page.key),
      ),
    { message: "System pages must exist and custom pages cannot replace them" },
  );
}
