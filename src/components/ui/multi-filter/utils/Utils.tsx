import React from "react";

import { addDays, subDays, subMonths, subWeeks, subYears } from "date-fns";

import { ActivityDefinitionFilterValue } from "@/components/ui/multi-filter/activityDefinitionFilter";
import { GenericSelectedBadge } from "@/components/ui/multi-filter/genericFilter";

import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";

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
export const getColorForOption = (index: number) => {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
};

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export type FilterValues =
  | string[]
  | TagConfig[]
  | FilterDateRange
  | FacilityOrganizationRead[]
  | LocationRead[]
  | ActivityDefinitionFilterValue[]
  | UserReadMinimal[];

export type FilterMode = "single" | "multi";

export type DateFilterMeta = {
  presetOptions?: DateRangeOption[];
};
export type TagFilterMeta = {
  resource: TagResource;
};
export type DepartmentFilterMeta = {
  facilityId?: string;
};

export type LocationFilterMeta = {
  facilityId?: string;
};
export type ActivityDefinitionFilterMeta = {
  facilityId?: string;
};

export type FacilityUserFilterMeta = {
  facilityId?: string;
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
  disableClear?: boolean;
  showColorIndicators?: boolean;
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

export interface DepartmentFilterConfig extends BaseFilterConfig {
  type: "department";
  meta: DepartmentFilterMeta;
}

export interface LocationFilterConfig extends BaseFilterConfig {
  type: "location";
  meta: LocationFilterMeta;
}
export interface ActivityDefinitionFilterConfig extends BaseFilterConfig {
  type: "activity_definition";
  meta: ActivityDefinitionFilterMeta;
}

export interface CareTeamFilterConfig extends BaseFilterConfig {
  type: "care_team";
  meta: FacilityUserFilterMeta;
}

export interface FacilityUserFilterConfig extends BaseFilterConfig {
  type: "facility_user";
  meta: FacilityUserFilterMeta;
}

export type FilterConfig =
  | CommandFilterConfig
  | TagFilterConfig
  | DateFilterConfig
  | DepartmentFilterConfig
  | LocationFilterConfig
  | ActivityDefinitionFilterConfig
  | CareTeamFilterConfig
  | FacilityUserFilterConfig;

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

function defaultRenderSelected(selected: FilterValues) {
  const selectedValues = selected as string[];
  if (typeof selectedValues[0] === "string") {
    const option = selectedValues[0];
    return (
      <GenericSelectedBadge
        selectedValue={option}
        selectedLength={selectedValues.length}
      />
    );
  }
  return <></>;
}

function defaultGetOperations(_selected: FilterValues) {
  return [{ label: "is" }];
}

export function createFilterConfig(
  key: string,
  label: string,
  type:
    | "command"
    | "tag"
    | "date"
    | "department"
    | "location"
    | "activity_definition"
    | "care_team"
    | "facility_user",
  options: FilterOption[],
  meta?: {
    resource?: TagResource;
    renderSelected?: (
      selected: FilterValues,
      filter?: FilterConfig,
      onFilterChange?: (filterKey: string, values: FilterValues) => void,
    ) => React.ReactNode;
    getOperations?: (selected: FilterValues) => Operation[];
    mode?: FilterMode;
    icon?: React.ReactNode;
    dateRangeOptions?: DateRangeOption[];
    operationKey?: string;
    disableClear?: boolean;
    showColorIndicators?: boolean;
    facilityId?: string;
  },
): FilterConfig {
  const {
    resource,
    renderSelected,
    getOperations,
    mode,
    icon,
    dateRangeOptions,
    operationKey,
    disableClear,
    showColorIndicators,
    facilityId,
  } = meta || {};
  const baseConfig: BaseFilterConfig = {
    key,
    label,
    options,
    renderSelected: renderSelected || defaultRenderSelected,
    getOperations: getOperations || defaultGetOperations,
    mode: mode || "single",
    icon,
    operationKey,
    disableClear,
    showColorIndicators,
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
    case "department":
      return {
        ...baseConfig,
        type: "department",
        meta: {},
      } as DepartmentFilterConfig;
    case "location":
      return {
        ...baseConfig,
        type: "location",
        meta: {},
      } as LocationFilterConfig;
    case "activity_definition":
      return {
        ...baseConfig,
        type: "activity_definition",
        meta: { facilityId },
      } as ActivityDefinitionFilterConfig;
    case "facility_user":
      return {
        ...baseConfig,
        type: "facility_user",
        meta: { facilityId },
      } as FacilityUserFilterConfig;
    case "care_team":
      return {
        ...baseConfig,
        type: "care_team",
        meta: { facilityId },
      } as CareTeamFilterConfig;
    case "command":
      return {
        ...baseConfig,
        type: "command",
      } as CommandFilterConfig;
  }
}

export const longDateRangeOptions: DateRangeOption[] = [
  {
    label: "today",
    getDateRange: () => ({
      from: new Date(),
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

export const getVariantColorClasses = (variant: string) => {
  const variantMap: Record<string, string> = {
    primary: "border-primary-300 bg-primary-100 text-primary-900",
    secondary: "border-gray-300 bg-gray-100 text-gray-900",
    destructive: "border-red-300 bg-red-100 text-red-900",
    blue: "border-blue-300 bg-blue-100 text-blue-900",
    green: "border-green-300 bg-green-100 text-green-900",
    yellow: "border-yellow-300 bg-yellow-100/80 text-yellow-900",
    orange: "border-orange-300 bg-orange-100 text-orange-900",
    purple: "border-purple-300 bg-purple-100 text-purple-900",
  };
  return variantMap[variant] || variantMap.secondary;
};
