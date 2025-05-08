import { z } from "zod";

import {
  ALIGNMENT_OPTIONS,
  AlignmentOptions,
  HEADER_ALIGNMENT_OPTIONS,
  HeaderAlignment,
  REPORT_TEMPLATE_TYPE,
  ReportTemplateType,
} from "@/types/reportTemplate/reportTemplate";

// Zod schema for the report template configuration
export const reportTemplateSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  type: z.enum(
    REPORT_TEMPLATE_TYPE.map((type) => type.id) as [
      ReportTemplateType,
      ...ReportTemplateType[],
    ],
  ),
  config: z.object({
    layout: z.object({
      page_size: z.string(),
      page_margin: z
        .object({
          mode: z.enum(["uniform", "custom"]),
          value: z.string().optional(),
          values: z
            .object({
              top: z.string(),
              right: z.string(),
              bottom: z.string(),
              left: z.string(),
            })
            .optional(),
        })
        .refine(
          (data) => {
            if (data.mode === "custom") {
              return data.values !== undefined;
            }
            return true;
          },
          {
            message: "Values are required for custom mode",
            path: ["values"],
          },
        )
        .refine(
          (data) => {
            if (data.mode === "uniform") {
              return data.value !== undefined;
            }
            return true;
          },
          {
            message: "Value is required for uniform mode",
            path: ["value"],
          },
        ),
      page_numbering: z.object({
        enabled: z.boolean(),
        format: z.string(),
        align: z.enum(
          ALIGNMENT_OPTIONS.map((opt) => opt.id) as [
            AlignmentOptions,
            ...AlignmentOptions[],
          ],
        ),
      }),
      text: z.object({
        font: z.string(),
        size: z.string(),
      }),
    }),
    header: z.object({
      rows: z.array(
        z.object({
          size_ratio: z.array(z.number()).optional(),
          columns: z.array(
            z.discriminatedUnion("type", [
              z.object({
                type: z.literal("text"),
                text: z.string(),
                size: z.string(),
                weight: z.number(),
                align: z
                  .enum(
                    HEADER_ALIGNMENT_OPTIONS.map((option) => option.id) as [
                      HeaderAlignment,
                      ...HeaderAlignment[],
                    ],
                  )
                  .optional(),
              }),
              z.object({
                type: z.literal("image"),
                file_name: z.string(),
                url: z.string().url(),
                width: z.string(),
                align: z
                  .enum(
                    HEADER_ALIGNMENT_OPTIONS.map((option) => option.id) as [
                      HeaderAlignment,
                      ...HeaderAlignment[],
                    ],
                  )
                  .optional(),
              }),
              z.object({
                type: z.literal("rule"),
                length: z.string(),
                stroke: z.string(),
                align: z
                  .enum(
                    HEADER_ALIGNMENT_OPTIONS.map((option) => option.id) as [
                      HeaderAlignment,
                      ...HeaderAlignment[],
                    ],
                  )
                  .optional(),
              }),
              z.object({
                type: z.literal("datetime"),
                label: z.string(),
                format: z.string(),
                style: z.object({
                  fill: z.string().optional(),
                  weight: z.number().optional(),
                }),
                align: z
                  .enum(
                    HEADER_ALIGNMENT_OPTIONS.map((option) => option.id) as [
                      HeaderAlignment,
                      ...HeaderAlignment[],
                    ],
                  )
                  .optional(),
              }),
            ]),
          ),
        }),
      ),
    }),
    sections: z.array(
      z
        .object({
          source: z.string(),
          is_table: z.boolean(),
          enabled: z.boolean(),
          options: z.object({
            title: z.string().optional(),
            fields: z
              .union([
                z.array(z.string()),
                z.array(
                  z.object({
                    label: z.string(),
                    value: z.string(),
                  }),
                ),
              ])
              .optional(),
            columns: z.array(z.string()).optional(),
            style: z.enum(["list", "text"]).optional(),
            filters: z.record(z.array(z.string())).optional(),
            text: z.string().optional(),
            rows: z.array(z.array(z.string())).optional(),
          }),
        })
        .refine(
          (data) => {
            if (data.is_table) {
              return (
                data.options.rows !== undefined ||
                data.options.columns !== undefined
              );
            }
            return true;
          },
          {
            message: "Rows are required for table sections",
            path: ["options", "rows"],
          },
        )
        .refine(
          (data) => {
            if (!data.is_table) {
              return (
                data.options.text !== undefined ||
                data.options.fields !== undefined
              );
            }
            return true;
          },
          {
            message: "Text or fields are required for non-table sections",
            path: ["options", "text", "fields"],
          },
        ),
    ),
  }),
});

export type ReportTemplateFormData = z.infer<typeof reportTemplateSchema>;
