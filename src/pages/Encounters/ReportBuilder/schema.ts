import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
  ALIGNMENT_OPTIONS,
  AlignmentOptions,
  HEADER_ALIGNMENT_OPTIONS,
  HeaderAlignment,
  REPORT_TEMPLATE_TYPE,
  ReportTemplateType,
} from "@/types/reportTemplate/reportTemplate";

export const useReportTemplateSchema = () => {
  const { t } = useTranslation();
  return z.object({
    id: z.string().optional(),
    slug: z
      .string()
      .trim()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 }))
      .regex(/^[-\w]+$/, {
        message: t("slug_format_message"),
      }),
    type: z.enum(
      REPORT_TEMPLATE_TYPE.map((type) => type.id) as [
        ReportTemplateType,
        ...ReportTemplateType[],
      ],
    ),
    config: z.object({
      layout: z.object({
        page_size: z.string(),
        page_margin: z.discriminatedUnion("mode", [
          z.object({
            mode: z.literal("uniform"),
            value: z.string().refine(
              (val) => {
                const numVal = parseFloat(val);
                return !isNaN(numVal) && numVal >= 0 && numVal <= 144;
              },
              {
                message: t("out_of_range_error", {
                  start: 0,
                  end: 144,
                }),
              },
            ),
          }),
          z.object({
            mode: z.literal("custom"),
            values: z.object({
              top: z.string().refine(
                (val) => {
                  const numVal = parseFloat(val);
                  return !isNaN(numVal) && numVal >= 0 && numVal <= 144;
                },
                {
                  message: t("out_of_range_error", {
                    start: 0,
                    end: 144,
                  }),
                },
              ),
              right: z.string().refine(
                (val) => {
                  const numVal = parseFloat(val);
                  return !isNaN(numVal) && numVal >= 0 && numVal <= 144;
                },
                {
                  message: t("out_of_range_error", {
                    start: 0,
                    end: 144,
                  }),
                },
              ),
              bottom: z.string().refine(
                (val) => {
                  const numVal = parseFloat(val);
                  return !isNaN(numVal) && numVal >= 0 && numVal <= 144;
                },
                {
                  message: t("out_of_range_error", {
                    start: 0,
                    end: 144,
                  }),
                },
              ),
              left: z.string().refine(
                (val) => {
                  const numVal = parseFloat(val);
                  return !isNaN(numVal) && numVal >= 0 && numVal <= 144;
                },
                {
                  message: t("out_of_range_error", {
                    start: 0,
                    end: 144,
                  }),
                },
              ),
            }),
          }),
        ]),
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
            size_ratio: z.array(z.number()).default([1]).optional(),
            columns: z
              .array(
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
                    length: z.number().min(1).max(100),
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
              )
              .min(1, t("at_least_one_item_required")),
          }),
        ),
      }),
      sections: z.array(
        z
          .object({
            source: z.string().min(1, t("field_required")),
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
              text: z.array(z.string()).optional(),
              rows: z.array(z.array(z.string())).optional(),
            }),
          })
          .refine(
            (data) => {
              if (
                !data.is_table &&
                data.source === "custom_section" &&
                data.options.style === "text"
              ) {
                return (
                  data.options.text !== undefined &&
                  data.options.text.length > 0
                );
              }
              return true;
            },
            {
              message: t("text_required_for_custom_sections"),
              path: ["options", "text"],
            },
          )
          .refine(
            (data) => {
              if (!data.is_table && data.options.style === "list") {
                return (
                  data.options.fields !== undefined &&
                  data.options.fields.length > 0
                );
              }
              return true;
            },
            {
              message: t("fields_required_for_custom_sections"),
              path: ["options", "fields"],
            },
          )
          .refine(
            (data) => {
              if (data.is_table && data.source === "custom_section") {
                return (
                  data.options.fields !== undefined &&
                  data.options.fields.length > 0
                );
              }
              return true;
            },
            {
              message: t("fields_required_for_custom_sections"),
              path: ["options", "fields"],
            },
          )
          .refine(
            (data) => {
              if (!data.is_table && data.source !== "custom_section") {
                return (
                  data.options.fields !== undefined &&
                  data.options.fields.length > 0
                );
              }
              return true;
            },
            {
              message: t("fields_required_for_structured_sections"),
              path: ["options", "fields"],
            },
          )
          .refine(
            (data) => {
              if (data.is_table && data.source !== "custom_section") {
                return (
                  data.options.columns !== undefined &&
                  data.options.columns.length > 0
                );
              }
              return true;
            },
            {
              message: t("columns_required_for_table_sections"),
              path: ["options", "columns"],
            },
          ),
      ),
    }),
  });
};

export type ReportTemplateFormData = z.infer<
  ReturnType<typeof useReportTemplateSchema>
>;
