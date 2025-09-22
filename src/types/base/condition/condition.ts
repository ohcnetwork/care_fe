import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export enum ConditionOperation {
  equality = "equality",
  in_range = "in_range",
  intersects_any = "intersects_any",
  has_tag = "has_tag",
}

export interface ConditionBase {
  metric: string;
}

export interface ConditionOperationInRangeValue {
  min: number;
  max: number;
}

export interface AgeOperationEqualityValue {
  value: number;
  value_type: string;
}

export interface AgeOperationInRangeValue {
  min: number;
  max: number;
  value_type: string;
}

export type Condition =
  | (ConditionBase & {
      operation: ConditionOperation.equality;
      value: string;
    })
  | (ConditionBase & {
      operation: ConditionOperation.in_range;
      value: ConditionOperationInRangeValue;
    })
  | (ConditionBase & {
      operation: ConditionOperation.has_tag;
      value: string;
    })
  | (ConditionBase & {
      metric: "patient_age";
      operation: ConditionOperation.equality;
      value: AgeOperationEqualityValue;
    })
  | (ConditionBase & {
      metric: "patient_age";
      operation: ConditionOperation.in_range;
      value: AgeOperationInRangeValue;
    });

export interface MetricsContext {
  patient: "patient";
  encounter: "encounter";
}

export interface Metrics {
  name: string;
  verbose_name: string;
  context: MetricsContext;
  allowed_operations: ConditionOperation[];
}

export const conditionSchema = z.union([
  z.object({
    metric: z.literal("patient_age"),
    operation: z.literal(ConditionOperation.equality),
    value: z.object({
      value: z.number().min(0, "Value must be >= 0"),
      value_type: z.enum(["years", "months", "days"]),
    }),
  }),
  z.object({
    metric: z.literal("patient_age"),
    operation: z.literal(ConditionOperation.in_range),
    value: z
      .object({
        min: z.number().min(0, "Min value must be >= 0"),
        max: z.number().min(0, "Max value must be >= 0"),
        value_type: z.enum(["years", "months", "days"]),
      })
      .refine((data) => data.min <= data.max, {
        message: "Min value must be <= max value",
      }),
  }),
  z.object({
    metric: z.string().min(1, "Metric is required"),
    operation: z.literal(ConditionOperation.equality),
    value: z.string().min(1, "Value is required"),
  }),
  z.object({
    metric: z.string().min(1, "Metric is required"),
    operation: z.literal(ConditionOperation.in_range),
    value: z
      .object({
        min: z.number().min(0, "Min value must be >= 0"),
        max: z.number().min(0, "Max value must be >= 0"),
      })
      .refine((data) => data.min <= data.max, {
        message: "Min value must be <= max value",
      }),
  }),
  z.object({
    metric: z.string().min(1, "Metric is required"),
    operation: z.literal(ConditionOperation.has_tag),
    value: z.string().min(1, "Value is required"),
  }),
]) as z.ZodType<Condition>;

export const getConditionValue = (condition: Condition) => {
  switch (condition.operation) {
    case ConditionOperation.equality:
      return `${condition.value} ${typeof condition.value === "object" && "value_type" in condition.value ? `${condition?.value.value_type}` : ""}`;
    case ConditionOperation.in_range:
      return `${condition.value.min} ${"value_type" in condition.value ? `${condition?.value.value_type}` : ""} - ${condition.value.max} ${typeof condition.value === "object" && "value_type" in condition.value ? `${condition?.value.value_type}` : ""}`;
    case ConditionOperation.has_tag:
      return condition.value;
  }
};
export function ConditionOperationSummary({
  condition,
}: {
  condition: Condition;
}) {
  const { t } = useTranslation();
  const conditionName = t(`observation_metric__${condition.metric}`);
  const tags = useTagConfigs({
    ids: typeof condition.value === "string" ? [condition.value] : [],
    disabled: condition.operation !== ConditionOperation.has_tag,
  })
    .map(({ data }) => data)
    .filter(Boolean) as TagConfig[];
  switch (condition.operation) {
    case ConditionOperation.equality:
      return `${conditionName} is equal to ${condition.value} ${typeof condition.value === "object" && "value_type" in condition.value ? `(${condition?.value.value_type})` : ""}`;
    case ConditionOperation.in_range:
      return `${conditionName} is in range ${condition.value.min} ${"value_type" in condition.value ? `${condition?.value.value_type}` : ""} to ${condition.value.max} ${"value_type" in condition.value ? `${condition?.value.value_type}` : ""}`;
    case ConditionOperation.has_tag:
      return `${conditionName} has following tag: ${tags.map((tag) => tag.display).join(", ")}`;
  }
}
