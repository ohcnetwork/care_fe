import { Condition, conditionSchema } from "@/types/base/condition/condition";
import { z } from "zod";

export interface Interpretation {
  display: string;
  icon?: string;
  color?: string;
}

export interface NumericRange {
  interpretation: Interpretation;
  min?: number;
  max?: number;
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
  conditions: Condition[];
  ranges: NumericRange[];
  normal_coded_value_set?: string;
  critical_coded_value_set?: string;
  abnormal_coded_value_set?: string;
  valueset_interpretation?: CustomValueSet[];
  _interpretation_type: InterpretationType;
}

const interpretationSchema = z.object({
  display: z.string().min(1, "Display is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
});
export const qualifiedRangeSchema = z.array(
  z
    .object({
      conditions: z.array(conditionSchema),
      ranges: z.array(
        z.object({
          interpretation: interpretationSchema,
          min: z.number().optional(),
          max: z.number().optional(),
        }),
      ),
      normal_coded_value_set: z.string().optional(),
      critical_coded_value_set: z.string().optional(),
      abnormal_coded_value_set: z.string().optional(),
      valueset_interpretation: z
        .array(
          z.object({
            interpretation: interpretationSchema,
            valueset: z.string().min(1, "Value set is required"),
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
          message: "Ranges and value sets cannot be used together",
        });
      }
      if (
        data._interpretation_type === InterpretationType.ranges &&
        (!data.ranges || data.ranges.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ranges are required",
        });
      }
      if (
        data._interpretation_type === InterpretationType.valuesets &&
        (!data.valueset_interpretation ||
          data.valueset_interpretation.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Value sets are required",
        });
      }
    }),
) as z.ZodType<QualifiedRange[]>;

export const getRangeSummary = (range: NumericRange) => {
  if (!range.min && !range.max) {
    return "";
  }
  if (!range.min) {
    return `${range.interpretation.display} when value is less than ${range.max}`;
  }
  if (!range.max) {
    return `${range.interpretation.display} when value is greater than ${range.min}`;
  }
  return `${range.interpretation.display} when value is between ${range.min} and ${range.max}`;
};

export const getValuesetSummary = (valueset: CustomValueSet) => {
  return `${valueset.interpretation.display} when value is in ${valueset.valueset}`;
};

export const COLOR_OPTIONS = {
  primary: {
    label: "Primary",
    class: "bg-primary-100",
    hex: "#def7ec",
  },
  secondary: {
    label: "Secondary",
    class: "bg-gray-100",
    hex: "#f3f4f6",
  },
  outline: {
    label: "Outline",
    class: "bg-gray-300",
    hex: "#d1d5db",
  },
  danger: {
    label: "Danger",
    class: "bg-red-600",
    hex: "#dc2626",
  },
  destructive: {
    label: "Destructive",
    class: "bg-red-100",
    hex: "#fee2e2",
  },
  indigo: {
    label: "Indigo",
    class: "bg-indigo-100",
    hex: "#e0e7ff",
  },
  purple: {
    label: "Purple",
    class: "bg-purple-100",
    hex: "#f3e8ff",
  },
  blue: {
    label: "Blue",
    class: "bg-blue-100",
    hex: "#dbeafe",
  },
  sky: {
    label: "Sky",
    class: "bg-sky-100",
    hex: "#e0f2fe",
  },
  cyan: {
    label: "Cyan",
    class: "bg-cyan-100",
    hex: "#cffafe",
  },
  teal: {
    label: "Teal",
    class: "bg-teal-100",
    hex: "#ccfbf1",
  },
  green: {
    label: "Green",
    class: "bg-green-100",
    hex: "#dcfce7",
  },
  yellow: {
    label: "Yellow",
    class: "bg-yellow-100/80",
    hex: "#fef3c7",
  },
  orange: {
    label: "Orange",
    class: "bg-orange-100",
    hex: "#fed7aa",
  },
  pink: {
    label: "Pink",
    class: "bg-pink-100",
    hex: "#fce7f3",
  },
};
