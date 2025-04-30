import { z } from "zod";

import {
  ALIGNMENT_OPTIONS,
  HEADER_ALIGNMENT_OPTIONS,
  REPORT_TEMPLATE_TYPE,
} from "@/types/reportTemplate/reportTemplate";

// Zod schema for the report template configuration
export const reportTemplateSchema = z.object({
  id: z.string().optional(),
  type: z.enum(
    REPORT_TEMPLATE_TYPE.map((type) => type.id) as [string, ...string[]],
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
          ALIGNMENT_OPTIONS.map((option) => option.id) as [string, ...string[]],
        ),
      }),
      text: z.object({
        font: z.string(),
        size: z.string(),
      }),
    }),
    header: z.object({
      rows: z.array(
        z.array(
          z
            .object({
              type: z.enum(["text", "rule", "image", "datetime"]),
              text: z.string().optional(),
              size: z.string().optional(),
              weight: z.number().optional(),
              align: z
                .enum(
                  HEADER_ALIGNMENT_OPTIONS.map((option) => option.id) as [
                    string,
                    ...string[],
                  ],
                )
                .optional(),
              length: z.string().optional(),
              stroke: z.string().optional(),
              file_name: z.string().optional(),
              url: z.string().url().optional(),
              width: z.string().optional(),
              label: z.string().optional(),
              format: z.string().optional(),
              style: z
                .object({
                  fill: z.string().optional(),
                  weight: z.number().optional(),
                })
                .optional(),
            })
            .refine(
              (data) => {
                if (data.type === "text") {
                  return data.weight !== undefined;
                }
                return true;
              },
              {
                message: "Weight is required for text elements",
                path: ["weight"],
              },
            )
            .refine(
              (data) => {
                if (data.type === "image") {
                  return data.width !== undefined;
                }
                return true;
              },
              {
                message: "Width is required for images",
                path: ["width"],
              },
            )
            .refine(
              (data) => {
                if (data.type === "datetime") {
                  return data.format !== undefined;
                }
                return true;
              },
              {
                message: "Format is required for datetime elements",
                path: ["format"],
              },
            )
            .refine(
              (data) => {
                if (data.type === "datetime") {
                  return data.label !== undefined;
                }
                return true;
              },
              {
                message: "Label is required for datetime elements",
                path: ["label"],
              },
            ),
        ),
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
