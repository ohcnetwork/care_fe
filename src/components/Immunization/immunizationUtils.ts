import { addDays, format } from "date-fns";
import { TFunction } from "i18next";

import {
  ImmunizationPolicyCoding,
  ImmunizationPolicyTemplate,
} from "@/types/emr/immunizationPolicy/immunizationPolicy";
import {
  ImmunizationForecastDisplayStatus,
  ImmunizationRecommendationFields,
  ImmunizationRecommendationRead,
} from "@/types/emr/immunizationRecommendation/immunizationRecommendation";

export function todayDateString() {
  return format(new Date(), "yyyy-MM-dd");
}

export function codingsLabel(codes?: ImmunizationPolicyCoding[] | null) {
  return (codes ?? []).map((code) => code.display || code.code).join(", ");
}

/**
 * The API stores only due, complete, immune and contraindicated. A due
 * recommendation is shown as upcoming before its earliest date and as overdue
 * from its overdue date (or, without one, after its due date).
 */
export function forecastDisplayStatus(
  recommendation: ImmunizationRecommendationRead,
  today = todayDateString(),
): ImmunizationForecastDisplayStatus {
  if (recommendation.forecast_status !== "due") {
    return recommendation.forecast_status;
  }
  const { earliest_date, due_date, overdue_date } = recommendation;
  if (overdue_date ? today >= overdue_date : !!due_date && today > due_date) {
    return "overdue";
  }
  if (earliest_date && today < earliest_date) return "upcoming";
  return "due";
}

export function doseLabel(
  t: TFunction,
  recommendation: {
    dose_number?: string | null;
    series_number?: string | null;
  },
) {
  if (!recommendation.dose_number) return undefined;
  return t(
    recommendation.series_number
      ? "immunization_dose_in_series"
      : "immunization_dose_label",
    {
      number: recommendation.dose_number,
      total: recommendation.series_number,
    },
  );
}

/** Sort by due date (then earliest date), keeping undated items last. */
export function compareRecommendations(
  a: ImmunizationRecommendationRead,
  b: ImmunizationRecommendationRead,
) {
  const key = (item: ImmunizationRecommendationRead) =>
    item.due_date ?? item.earliest_date ?? item.overdue_date ?? "9999-12-31";
  return key(a).localeCompare(key(b));
}

export interface MaterializedRecommendation extends ImmunizationRecommendationFields {
  is_group: boolean;
  children: MaterializedRecommendation[];
}

function offsetDate(reference: Date, offset?: number | null) {
  if (offset === undefined || offset === null) return undefined;
  return format(addDays(reference, offset), "yyyy-MM-dd");
}

function textField(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Turns a policy template into patient recommendations by resolving its
 * whole-day offsets against a reference date (usually the date of birth).
 */
export function materializePolicyTemplate(
  template: ImmunizationPolicyTemplate,
  reference: Date,
): MaterializedRecommendation {
  // Codings keep their system versions, as in the policy.
  const codes = (template.codes ?? []).map((coding) => ({ ...coding }));
  const diseases = (template.diseases ?? []).map((coding) => ({ ...coding }));
  return {
    is_group: template.is_group,
    codes: codes.length ? codes : undefined,
    diseases: diseases.length ? diseases : undefined,
    earliest_date: offsetDate(reference, template.earliest_date),
    due_date: offsetDate(reference, template.due_date),
    overdue_date: offsetDate(reference, template.overdue_date),
    description: textField(template.description),
    series: textField(template.series),
    dose_number: textField(template.dose_number),
    series_number: textField(template.series_number),
    children: (template.children ?? []).map((child) =>
      materializePolicyTemplate(child, reference),
    ),
  };
}

/**
 * Depth-first list of the recommendations (not groups) in a materialized
 * tree, keyed by their position in the template.
 */
export function flattenRecommendations(
  node: MaterializedRecommendation,
  path = "0",
): { path: string; node: MaterializedRecommendation }[] {
  return [
    ...(node.is_group ? [] : [{ path, node }]),
    ...node.children.flatMap((child, index) =>
      flattenRecommendations(child, `${path}.${index}`),
    ),
  ];
}

export function countNodes(node: MaterializedRecommendation): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
