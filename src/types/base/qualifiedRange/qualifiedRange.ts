import { Code } from "@/types/base/code/code";
import { Condition, conditionSchema } from "@/types/base/condition/condition";
import { round, zodDecimal } from "@/Utils/decimal";
import { t } from "i18next";
import { z } from "zod";

export interface Interpretation {
  display: string;
  highlight?: boolean;
  code?: Code;
}

export interface NumericRange {
  interpretation: Interpretation;
  min?: string;
  max?: string;
}

export interface CustomValueSet {
  interpretation: Interpretation;
  valueset: string;
}

export enum InterpretationType {
  ranges = "ranges",
  valuesets = "valuesets",
}

export interface QualifiedRange {
  // used for local state management
  id?: number;
  title?: string;
  default_interpretation?: Interpretation;
  conditions?: Condition[];
  ranges: NumericRange[];
  normal_coded_value_set?: string;
  critical_coded_value_set?: string;
  abnormal_coded_value_set?: string;
  valueset_interpretation?: CustomValueSet[];
  _interpretation_type: InterpretationType;
}
//To do: Translations not being loaded for playwright tests, need to debug and fix
const interpretationSchema = z.object({
  display: z.string().min(1, "Display is required"),
  highlight: z.boolean().optional(),
  code: z.object({ code: z.string(), display: z.string() }).optional(),
});

const defaultInterpretationSchema = z.object({
  display: z.string(),
  highlight: z.boolean().optional(),
  code: z.object({ code: z.string(), display: z.string() }).optional(),
});
export const qualifiedRangeSchema = z.array(
  z
    .object({
      title: z.string().optional(),
      default_interpretation: defaultInterpretationSchema.optional(),
      conditions: z.array(conditionSchema).optional(),
      ranges: z.array(
        z
          .object({
            interpretation: interpretationSchema,
            min: zodDecimal().optional(),
            max: zodDecimal().optional(),
          })
          .refine(
            (data) => {
              if (data.min !== undefined || data.max !== undefined) return true;
              return false;
            },
            {
              message: "Either min or max value is required",
              path: ["min"],
            },
          )
          .refine(
            (data) => {
              // Only validate if both min and max exist
              if (data.min === undefined || data.max === undefined) return true;
              return Number(data.min) <= Number(data.max);
            },
            {
              message: t("min_less_max_error"),
              path: ["max"],
            },
          ),
      ),
      normal_coded_value_set: z.string().optional(),
      critical_coded_value_set: z.string().optional(),
      abnormal_coded_value_set: z.string().optional(),
      valueset_interpretation: z
        .array(
          z.object({
            interpretation: interpretationSchema,
            valueset: z.string().min(1, t("required")),
          }),
        )
        .optional(),
      _interpretation_type: z.enum([
        InterpretationType.ranges,
        InterpretationType.valuesets,
      ]),
    })
    .superRefine((data, ctx) => {
      if (
        data.ranges?.length &&
        data.ranges.length > 0 &&
        data.valueset_interpretation?.length &&
        data.valueset_interpretation.length > 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("ranges_valueset_conflict_error"),
          path: ["_interpretation_type"],
        });
      }
      if (
        data._interpretation_type === InterpretationType.ranges &&
        (!data.ranges || data.ranges.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("required"),
          path: ["ranges"],
        });
      }
      if (
        data._interpretation_type === InterpretationType.valuesets &&
        (!data.valueset_interpretation ||
          data.valueset_interpretation.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("required"),
          path: ["valueset_interpretation"],
        });
      }
    }),
) as z.ZodType<QualifiedRange[]>;

export const getRangeSummary = (range: NumericRange) => {
  if (!range.min && !range.max) {
    return "";
  }
  if (!range.min) {
    return t("observation_interpretation_range_max_only", {
      display: range.interpretation.display,
      max: round(range.max!),
    });
  }
  if (!range.max) {
    return t("observation_interpretation_range_min_only", {
      display: range.interpretation.display,
      min: round(range.min),
    });
  }
  return t("observation_interpretation_range_between", {
    display: range.interpretation.display,
    min: range.min,
    max: range.max,
  });
};

export const getValuesetSummary = (valueset: CustomValueSet) => {
  return t("observation_interpretation_valueset_summary", {
    display: valueset.interpretation.display,
    valueset: valueset.valueset,
  });
};
