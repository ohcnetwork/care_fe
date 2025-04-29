import { z } from "zod";

import { REPORT_TEMPLATE_TYPE } from "@/types/reportTemplate/reportTemplate";

// Zod schema for the report template configuration
export const reportTemplateSchema = z.object({
  id: z.string().optional(),
  type: z.enum(
    REPORT_TEMPLATE_TYPE.map((type) => type.id) as [string, ...string[]],
  ),
  config: z.object({
    layout: z.object({
      page_size: z.string(),
      page_margin: z.object({
        mode: z.enum(["uniform", "custom"]),
        value: z.string(),
      }),
      page_numbering: z.object({
        enabled: z.boolean(),
        format: z.string(),
        align: z.string(),
      }),
      text: z.object({
        font: z.string(),
        size: z.string(),
      }),
    }),
    header: z.object({
      rows: z.array(
        z.array(
          z.object({
            type: z.string(),
            text: z.string().optional(),
            size: z.string().optional(),
            weight: z.number().optional(),
            align: z.string().optional(),
            length: z.string().optional(),
            stroke: z.string().optional(),
            file_name: z.string().optional(),
            url: z.string().optional(),
            width: z.string().optional(),
            label: z.string().optional(),
            format: z.string().optional(),
            style: z
              .object({
                fill: z.string().optional(),
                weight: z.number().optional(),
              })
              .optional(),
          }),
        ),
      ),
    }),
    sections: z.array(
      z.object({
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
      }),
    ),
  }),
});

export type ReportTemplateFormData = z.infer<typeof reportTemplateSchema>;
