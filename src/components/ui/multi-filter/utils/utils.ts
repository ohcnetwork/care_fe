import React from "react";

import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";

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

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
  type?: "command" | "tag" | "date";
  resource?: TagResource;
  icon?: React.ReactNode;
  renderSelected?: (selected: FilterValues) => React.ReactNode;
  getOperations?: (selected: FilterValues) => string[];
  mode?: FilterMode;
}

export interface OperationConfig {
  selectedOperation: string | null;
  availableOperations: string[];
}

export interface FilterState {
  filter: FilterConfig;
  operation: OperationConfig;
  selected: FilterValues;
}

export interface FilterDateRange {
  from: Date;
  to: Date;
}

export interface DateRangeOption {
  label: string;
  getDateRange: () => { from: Date; to: Date };
}

export function createFilterConfig(
  key: string,
  label: string,
  type: "command" | "tag" | "date",
  options: FilterOption[],
  resource?: TagResource,
  renderSelected?: (selected: FilterValues) => React.ReactNode,
  getOperations?: (selected: FilterValues) => string[],
  mode: FilterMode = "single",
  icon?: React.ReactNode,
): FilterConfig {
  return {
    key,
    label,
    type,
    options,
    resource,
    renderSelected,
    getOperations,
    mode,
    icon,
  };
}
