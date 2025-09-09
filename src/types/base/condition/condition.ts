import { z } from "zod";

export enum ConditionOperation {
  equality = "equality",
  in_range = "in_range",
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
]) as z.ZodType<Condition>;
