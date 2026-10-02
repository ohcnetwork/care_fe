import { ImmunizationPolicyCoding } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const IMMUNIZATION_FORECAST_STATUS = [
  "due",
  "complete",
  "immune",
  "contraindicated",
] as const;

export type ImmunizationForecastStatus =
  (typeof IMMUNIZATION_FORECAST_STATUS)[number];

/** Overdue is not stored: it is derived from a due forecast and its dates. */
export type ImmunizationForecastDisplayStatus =
  ImmunizationForecastStatus | "upcoming" | "overdue";

export const IMMUNIZATION_FORECAST_STATUS_COLORS = {
  upcoming: "secondary",
  due: "blue",
  overdue: "destructive",
  complete: "green",
  immune: "teal",
  contraindicated: "orange",
} as const satisfies Record<ImmunizationForecastDisplayStatus, string>;

export interface ImmunizationRecommendationFields {
  codes?: ImmunizationPolicyCoding[];
  diseases?: ImmunizationPolicyCoding[];
  /** Dates are calendar dates (YYYY-MM-DD). */
  earliest_date?: string;
  due_date?: string;
  overdue_date?: string;
  description?: string;
  series?: string;
  dose_number?: string;
  series_number?: string;
}

/** Optional database fields may arrive as null. */
export interface ImmunizationRecommendationRead {
  id: string;
  forecast_status: ImmunizationForecastStatus;
  is_group: boolean;
  codes?: ImmunizationPolicyCoding[] | null;
  diseases?: ImmunizationPolicyCoding[] | null;
  earliest_date?: string | null;
  due_date?: string | null;
  overdue_date?: string | null;
  description?: string | null;
  series?: string | null;
  dose_number?: string | null;
  series_number?: string | null;
}

export interface ImmunizationRecommendationCreate extends ImmunizationRecommendationFields {
  patient: string;
  encounter?: string | null;
  parent?: string | null;
  is_group: boolean;
  forecast_status: ImmunizationForecastStatus;
}

export interface ImmunizationRecommendationUpdate extends ImmunizationRecommendationFields {
  forecast_status: ImmunizationForecastStatus;
}
