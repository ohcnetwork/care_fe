import { Condition, conditionSchema } from "@/types/base/condition/condition";
import { round, zodDecimal } from "@/Utils/decimal";
import { t } from "i18next";
import { z } from "zod";

export interface Interpretation {
  display: string;
  icon?: string;
  color?: string;
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
  icon: z.string().optional(),
  color: z.string().optional(),
});
export const qualifiedRangeSchema = z.array(
  z
    .object({
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

export const COLOR_OPTIONS = {
  primary: {
    label: "Primary",
    class: "bg-primary-400",
    hex: "#4ad80e",
  },
  secondary: {
    label: "Secondary",
    class: "bg-gray-100",
    hex: "#f9fafb",
  },
  outline: {
    label: "Outline",
    class: "bg-gray-300",
    hex: "#e5e7eb",
  },
  danger: {
    label: "Danger",
    class: "bg-red-600",
    hex: "#dc2626",
  },
  destructive: {
    label: "Destructive",
    class: "bg-red-300",
    hex: "#fca5a5",
  },
  indigo: {
    label: "Indigo",
    class: "bg-indigo-300",
    hex: "#c7d2fe",
  },
  purple: {
    label: "Purple",
    class: "bg-purple-300",
    hex: "#e9d5ff",
  },
  blue: {
    label: "Blue",
    class: "bg-blue-300",
    hex: "#bfdbfe",
  },
  sky: {
    label: "Sky",
    class: "bg-sky-300",
    hex: "#bae6fd",
  },
  cyan: {
    label: "Cyan",
    class: "bg-cyan-300",
    hex: "#a5f3fc",
  },
  teal: {
    label: "Teal",
    class: "bg-teal-300",
    hex: "#99f6e4",
  },
  green: {
    label: "Green",
    class: "bg-green-300",
    hex: "#bbf7d0",
  },
  yellow: {
    label: "Yellow",
    class: "bg-yellow-300",
    hex: "#fef08a",
  },
  orange: {
    label: "Orange",
    class: "bg-orange-300",
    hex: "#fed7aa",
  },
  pink: {
    label: "Pink",
    class: "bg-pink-300",
    hex: "#fbcfe8",
  },
};
