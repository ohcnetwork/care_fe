import careConfig from "@careConfig";

import { GENDER_TYPES, GENDERS } from "@/common/constants";
import { QualifiedRange } from "@/types/base/qualifiedRange/qualifiedRange";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export enum ConditionOperation {
  equality = "equality",
  in_range = "in_range",
  has_tag = "has_tag",
}

export interface ConditionBase {
  metric: string;
}

export interface ConditionOperationInRangeValue {
  min?: number;
  max?: number;
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

export interface TagOperationValue {
  value: string;
  value_type: TagResource;
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
      value: TagOperationValue;
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

export type ConditionForm = Condition & {
  _conditionType: string;
};

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

export const CONDITION_AGE_VALUE_TYPES = ["years", "months", "days"] as const;

export const conditionSchema = z.discriminatedUnion("_conditionType", [
  z.object({
    metric: z.literal("patient_age"),
    operation: z.literal(ConditionOperation.equality),
    value: z.object({
      value: z.number().min(0, "Value must be >= 0"),
      value_type: z.enum(CONDITION_AGE_VALUE_TYPES),
    }),
    _conditionType: z.literal("patient_age_equality"),
  }),
  z.object({
    metric: z.literal("patient_age"),
    operation: z.literal(ConditionOperation.in_range),
    value: z
      .object({
        min: z.number().min(0, "Min value must be >= 0"),
        max: z.number().min(0, "Max value must be >= 0"),
        value_type: z.enum(CONDITION_AGE_VALUE_TYPES),
      })
      .refine((data) => data.min <= data.max, {
        message: "Min value must be <= max value",
        path: ["max"],
      }),
    _conditionType: z.literal("patient_age_in_range"),
  }),
  z.object({
    metric: z.literal("patient_gender"),
    operation: z.literal(ConditionOperation.equality),
    value: z.enum(GENDERS),
    _conditionType: z.literal("patient_gender_equality"),
  }),
  z.object({
    metric: z.literal("encounter_tag"),
    operation: z.literal(ConditionOperation.has_tag),
    value: z.object({
      value: z.string().trim().min(1, "Tags are required"),
      value_type: z.enum([TagResource.ENCOUNTER, TagResource.PATIENT]),
    }),
    _conditionType: z.literal("encounter_tag_has_tag"),
  }),
  z.object({
    metric: z.literal("patient_tag"),
    operation: z.literal(ConditionOperation.has_tag),
    value: z.object({
      value: z.string().trim().min(1, "Tags are required"),
      value_type: z.enum([TagResource.PATIENT]),
    }),
    _conditionType: z.literal("patient_tag_has_tag"),
  }),
  z.object({
    metric: z.literal("encounter_class"),
    operation: z.literal(ConditionOperation.equality),
    value: z.enum(careConfig.encounterClasses),
    _conditionType: z.literal("encounter_class_equality"),
  }),
]) as z.ZodType<ConditionForm>;

export function getConditionDiscriminatorValue(
  metric: string,
  operation: ConditionOperation,
) {
  return `${metric}_${operation}`;
}

export function ConditionOperationSummary({
  condition,
}: {
  condition: Condition;
}) {
  const { t } = useTranslation();
  const conditionName = t(`condition_metric__${condition.metric}`);
  const { tagIds, tagResource } = extractTagInformation(
    condition.value,
    condition.metric,
  );
  const tags = useTagConfigs({
    ids: tagIds,
    disabled:
      condition.operation !== ConditionOperation.has_tag || tagIds.length === 0,
  })
    .map(({ data }) => data)
    .filter(Boolean) as TagConfig[];
  switch (condition.operation) {
    case ConditionOperation.equality: {
      const value =
        typeof condition.value === "object" && "value" in condition.value
          ? condition.value.value
          : condition.value;
      let valueDisplay = String(value);
      if (condition.metric === "patient_gender") {
        valueDisplay = t(`GENDER__${value}`);
      } else if (condition.metric === "encounter_class") {
        valueDisplay = t(`encounter_class__${value}`);
      }
      const valueType =
        typeof condition.value === "object" && "value_type" in condition.value
          ? condition?.value.value_type
          : "";
      return `${conditionName} is equal to ${valueDisplay} ${valueType}`;
    }
    case ConditionOperation.in_range: {
      const valueType =
        "value_type" in condition.value ? condition?.value.value_type : "";
      return `${conditionName} is in range ${condition.value.min} to ${condition.value.max} ${valueType}`;
    }
    case ConditionOperation.has_tag: {
      const tagDisplay = tags.map((tag) => tag.display).join(", ");
      return `Has any of the following ${tagResource} tag(s): ${tagDisplay}`;
    }
  }
}

export function getConditionValue(
  metric: string,
  operation: ConditionOperation,
):
  | string
  | TagOperationValue
  | ConditionOperationInRangeValue
  | AgeOperationEqualityValue
  | AgeOperationInRangeValue {
  let conditionValue = {};
  switch (operation) {
    case ConditionOperation.equality:
      if (metric === "patient_age") {
        conditionValue = { value: 0, value_type: "years" };
        break;
      } else if (metric === "patient_gender") {
        conditionValue = GENDER_TYPES[0].id;
        break;
      } else if (metric === "encounter_class") {
        conditionValue = careConfig.encounterClasses[0];
        break;
      }
      conditionValue = "";
      break;
    case ConditionOperation.in_range:
      conditionValue = { min: undefined, max: undefined };
      if (metric === "patient_age") {
        conditionValue = { ...conditionValue, value_type: "years" };
      }
      break;
    case ConditionOperation.has_tag: {
      const tagResource =
        metric === "encounter_tag"
          ? TagResource.ENCOUNTER
          : TagResource.PATIENT;
      conditionValue = { value: "", value_type: tagResource };
      break;
    }
  }
  return conditionValue;
}

export const getDefaultCondition = (metrics: Metrics[]) => {
  if (!metrics || metrics.length === 0) return {} as ConditionForm;
  const firstOperation = metrics?.[0]
    ?.allowed_operations?.[0] as ConditionOperation;
  const metricName = metrics?.[0].name || "";
  const value = getConditionValue(metrics?.[0].name, firstOperation);
  const newCondition = {
    metric: metricName,
    operation: firstOperation,
    value: value as any,
    _conditionType: `${metricName}_${firstOperation}`,
  };
  return newCondition as ConditionForm;
};

export const extractTagInformation = (
  value:
    | string
    | TagOperationValue
    | ConditionOperationInRangeValue
    | AgeOperationEqualityValue
    | AgeOperationInRangeValue,
  metric?: string,
) => {
  const tagIds =
    typeof value === "object" &&
    "value" in value &&
    typeof value.value === "string"
      ? value.value.split(",")
      : [];
  const tagResource =
    metric === "encounter_tag" ? TagResource.ENCOUNTER : TagResource.PATIENT;
  return { tagIds, tagResource };
};

const stripConditionType = (condition: ConditionForm): Condition => {
  const { _conditionType, ...rest } = condition;
  return rest;
};

export const removeConditionType = (
  qualifiedRanges: QualifiedRange[],
): QualifiedRange[] => {
  return qualifiedRanges.map((range) => ({
    ...range,
    conditions: range.conditions?.map((condition) => ({
      ...stripConditionType(condition as ConditionForm),
    })),
  }));
};
