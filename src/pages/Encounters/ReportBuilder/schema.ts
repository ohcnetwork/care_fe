import { z } from "zod";

import {
  ALIGNMENT_OPTIONS,
  REPORT_TEMPLATE_TYPE,
} from "@/types/reportTemplate/reportTemplate";

// Zod schema for the report template configuration
export const reportTemplateSchema = z.object({
  id: z.string(),
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
        align: z.enum(
          ALIGNMENT_OPTIONS.map((opt) => opt.id) as [string, ...string[]],
        ),
      }),
      text: z.object({
        font: z.string(),
        size: z.string(),
      }),
    }),
    header: z.object({
      facility_name: z.string(),
      facility_heading: z.object({
        align: z.enum(["left", "center", "right"]),
        size: z.string(),
        weight: z.string(),
      }),
      divider: z.object({
        length: z.string(),
        stroke: z.string(),
      }),
      title: z.object({
        text: z.string(),
        size: z.string(),
      }),
      logo: z.object({
        file_name: z.string(),
      }),
      created_on: z.object({
        label: z.string(),
        style: z.object({
          fill: z.string(),
          weight: z.string(),
        }),
        date_format: z.string(),
      }),
    }),
    sections: z.array(
      z.object({
        source: z.string(),
        is_table: z.boolean(),
        enabled: z.boolean(),
        options: z.object({
          title: z.string().optional(),
          fields: z.array(z.string()).optional(),
          columns: z.array(z.string()).optional(),
          style: z.enum(["list", "text"]),
          filters: z.record(z.array(z.string())).optional(),
        }),
      }),
    ),
  }),
});

export type ReportTemplateFormData = z.infer<typeof reportTemplateSchema>;
