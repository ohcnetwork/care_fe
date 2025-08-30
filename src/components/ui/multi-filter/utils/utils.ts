import React from "react";

import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { addDays, subDays, subMonths, subWeeks, subYears } from "date-fns";

// Generic color palette for cycling through options
export const COLOR_PALETTE = [
  "bg-blue-100 border-blue-300",
  "bg-green-100 border-green-300",
  "bg-yellow-100 border-yellow-300",
  "bg-orange-100 border-orange-300",
  "bg-red-100 border-red-300",
  "bg-purple-100 border-purple-300",
  "bg-pink-100 border-pink-300",
  "bg-indigo-100 border-indigo-300",
  "bg-teal-100 border-teal-300",
  "bg-cyan-100 border-cyan-300",
  "bg-emerald-100 border-emerald-300",
  "bg-violet-100 border-violet-300",
] as const;

export const ENCOUNTER_STATUS_FILTER_COLORS = {
  planned: "bg-blue-100 text-blue-900 border-blue-300",
  in_progress: "bg-yellow-100/80 text-yellow-900 border-yellow-300",
  on_hold: "bg-orange-100 text-orange-900 border-orange-300",
  discharged: "bg-primary-100 text-primary-900 border-primary-300",
  completed: "bg-green-100 text-green-900 border-green-300",
  cancelled: "bg-red-100 text-red-900 border-red-300",
  discontinued: "bg-red-100 text-red-900 border-red-300",
  entered_in_error: "bg-red-100 text-red-900 border-red-300",
  unknown: "bg-gray-100 text-gray-900 border-gray-300",
} as const;

export const ENCOUNTER_CLASS_FILTER_COLORS = {
  imp: "bg-indigo-100 text-indigo-900 border-indigo-300",
  emer: "bg-red-100 text-red-900 border-red-300",
  amb: "bg-green-100 text-green-900 border-green-300",
  obsenc: "border-gray-300 bg-gray-100 text-gray-900",
  vr: "border-gray-300 bg-gray-100 text-gray-900",
  hh: "bg-teal-100 text-teal-900 border-teal-300",
} as const;

export const ENCOUNTER_PRIORITY_FILTER_COLORS = {
  stat: "bg-red-100 text-red-900 border-red-300",
  ASAP: "bg-yellow-100/80 text-yellow-900 border-yellow-300",
  emergency: "bg-red-100 text-red-900 border-red-300",
  urgent: "bg-orange-100 text-orange-900 border-orange-300",
  routine: "bg-blue-100 text-blue-900 border-blue-300",
  elective: "bg-indigo-100 text-indigo-900 border-indigo-300",
  rush_reporting: "bg-orange-100 text-orange-900 border-orange-300",
  timing_critical: "bg-yellow-100/80 text-yellow-900 border-yellow-300",
  callback_results: "bg-green-100 text-green-900 border-green-300",
  callback_for_scheduling: "bg-purple-100 text-purple-900 border-purple-300",
  preop: "bg-pink-100 text-pink-900 border-pink-300",
  as_needed: "bg-teal-100 text-teal-900 border-teal-300",
  use_as_directed: "bg-indigo-100 text-indigo-900 border-indigo-300",
} as const;

export const getColorForOption = (index: number) => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export type FilterValues = string[] | TagConfig[] | FilterDateRange;

export type FilterMode = "single" | "multi";

export type DateFilterMeta = {
  presetOptions?: DateRangeOption[];
};
export type TagFilterMeta = {
  resource: TagResource;
};

export interface BaseFilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  operationKey?: string;
  renderSelected?: (
    selected: FilterValues,
    filter?: FilterConfig,
    onFilterChange?: (filterKey: string, values: FilterValues) => void,
  ) => React.ReactNode;
  getOperations?: (selected: FilterValues) => Operation[];
  mode?: FilterMode;
}

export interface CommandFilterConfig extends BaseFilterConfig {
  type: "command";
  meta?: undefined;
}

export interface TagFilterConfig extends BaseFilterConfig {
  type: "tag";
  meta: TagFilterMeta;
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: "date";
  meta: DateFilterMeta;
}

export type FilterConfig =
  | CommandFilterConfig
  | TagFilterConfig
  | DateFilterConfig;

export interface OperationConfig {
  selectedOperation: Operation | null;
  availableOperations: Operation[];
}

export interface FilterState {
  filter: FilterConfig;
  operation: OperationConfig;
  selected: FilterValues;
}

export interface FilterDateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangeOption {
  label: string;
  getDateRange: () => { from: Date; to: Date };
  count?: number;
}

export type Operation = {
  value?: string;
  label: string;
};

export function createFilterConfig(
  key: string,
  label: string,
  type: "command" | "tag" | "date",
  options: FilterOption[],
  resource?: TagResource,
  renderSelected?: (
    selected: FilterValues,
    filter?: FilterConfig,
    onFilterChange?: (filterKey: string, values: FilterValues) => void,
  ) => React.ReactNode,
  getOperations?: (selected: FilterValues) => Operation[],
  mode: FilterMode = "single",
  icon?: React.ReactNode,
  dateRangeOptions?: DateRangeOption[],
  operationKey?: string,
): FilterConfig {
  const baseConfig: BaseFilterConfig = {
    key,
    label,
    options,
    renderSelected,
    getOperations,
    mode,
    icon,
    operationKey,
  };
  switch (type) {
    case "date":
      return {
        ...baseConfig,
        type: "date",
        meta: { presetOptions: dateRangeOptions },
      } as DateFilterConfig;
    case "tag":
      if (!resource) {
        throw new Error("Resource is required for tag filters");
      }
      return {
        ...baseConfig,
        type: "tag",
        meta: { resource },
      } as TagFilterConfig;
    case "command":
      return {
        ...baseConfig,
        type: "command",
      } as CommandFilterConfig;
  }
}

export const longDateRangeOptions: DateRangeOption[] = [
  {
    label: "last_count_days",
    getDateRange: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
    count: 7,
  },
  {
    label: "last_count_weeks",
    getDateRange: () => ({
      from: subWeeks(new Date(), 3),
      to: new Date(),
    }),
    count: 3,
  },
  {
    label: "last_month",
    getDateRange: () => ({
      from: subMonths(new Date(), 1),
      to: new Date(),
    }),
  },
  {
    label: "last_count_months",
    getDateRange: () => ({
      from: subMonths(new Date(), 3),
      to: new Date(),
    }),
    count: 3,
  },
  {
    label: "last_count_months",
    getDateRange: () => ({
      from: subMonths(new Date(), 6),
      to: new Date(),
    }),
    count: 6,
  },
  {
    label: "last_year",
    getDateRange: () => ({
      from: subYears(new Date(), 1),
      to: new Date(),
    }),
  },
];

export const shortDateRangeOptions: DateRangeOption[] = [
  {
    label: "last_week",
    getDateRange: () => ({
      from: subDays(new Date(), 7),
      to: new Date(),
    }),
  },
  {
    label: "yesterday",
    getDateRange: () => ({
      from: subDays(new Date(), 1),
      to: subDays(new Date(), 1),
    }),
  },
  {
    label: "today",
    getDateRange: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "tomorrow",
    getDateRange: () => ({
      from: addDays(new Date(), 1),
      to: addDays(new Date(), 1),
    }),
  },
  {
    label: "next_week",
    getDateRange: () => ({
      from: new Date(),
      to: addDays(new Date(), 7),
    }),
  },
  {
    label: "next_month",
    getDateRange: () => ({
      from: new Date(),
      to: addDays(new Date(), 30),
    }),
  },
];
