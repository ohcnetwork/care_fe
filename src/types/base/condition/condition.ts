import { z } from "zod";

export enum ConditionOperation {
  equality = "equality",
  in_range = "in_range",
  intersects_any = "intersects_any",
}

export interface ConditionBase {
  metric: string;
}

export interface ConditionOperationInRangeValue {
  min: number;
  max: number;
}

export type Condition = ConditionBase &
  (
    | {
        operation: ConditionOperation.equality;
        value: string;
      }
    | {
        operation: ConditionOperation.in_range;
        value: ConditionOperationInRangeValue;
      }
    | {
        operation: ConditionOperation.intersects_any;
        values: string[];
      }
  );

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

export const conditionSchema = z.discriminatedUnion("operation", [
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
    operation: z.literal(ConditionOperation.intersects_any),
    values: z.array(z.string().min(1, "Values are required")),
  }),
]) as z.ZodType<Condition>;

export const getConditionValue = (condition: Condition) => {
  switch (condition.operation) {
    case ConditionOperation.equality:
      return condition.value;
    case ConditionOperation.in_range:
      return `${condition.value.min} - ${condition.value.max}`;
    case ConditionOperation.intersects_any:
      return condition.values;
  }
};
export const getConditionOperationSummary = (
  condition: Condition,
  conditionName: string,
) => {
  switch (condition.operation) {
    case ConditionOperation.equality:
      return `${conditionName} is equal to ${condition.value}`;
    case ConditionOperation.in_range:
      return `${conditionName} is in range ${condition.value.min} to ${condition.value.max}`;
    case ConditionOperation.intersects_any:
      return `${conditionName} intersects any of ${condition.values.join(", ")}`;
  }
};
