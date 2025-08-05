import { TagResource } from "@/types/emr/tagConfig/tagConfig";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

// Generic color palette for cycling through options
export const COLOR_PALETTE = [
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-orange-100",
  "bg-red-100",
  "bg-purple-100",
  "bg-pink-100",
  "bg-indigo-100",
  "bg-teal-100",
  "bg-cyan-100",
  "bg-emerald-100",
  "bg-violet-100",
] as const;

export const BADGE_BORDER_COLORS = [
  "border-blue-300",
  "border-green-300",
  "border-yellow-300",
  "border-orange-300",
  "border-red-300",
  "border-purple-300",
  "border-pink-300",
  "border-indigo-300",
  "border-teal-300",
  "border-cyan-300",
  "border-emerald-300",
  "border-violet-300",
] as const;

export const BADGE_TEXT_COLORS = [
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-orange-500",
  "text-red-500",
  "text-purple-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
  "text-cyan-500",
  "text-emerald-500",
  "text-violet-500",
] as const;

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
  mode: FilterMode = "multi",
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
  };
}
