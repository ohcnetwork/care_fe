import {
  ENCOUNTER_CLASS,
  ENCOUNTER_PRIORITY,
  ENCOUNTER_STATUS,
  EncounterClass,
  EncounterPriority,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import { CalendarFold, CircleDashed, Tag } from "lucide-react";

import { t } from "i18next";
import { SelectedDateBadge, getDateOperations } from "./dateFilter";
import { GenericSelectedBadge } from "./genericFilter";
import { SelectedTagBadge } from "./tagFilter";
import {
  DateRangeOption,
  FilterConfig,
  FilterDateRange,
  FilterMode,
  FilterValues,
  Operation,
  createFilterConfig,
} from "./utils/Utils";

import {
  ENCOUNTER_CLASS_FILTER_COLORS,
  ENCOUNTER_PRIORITY_FILTER_COLORS,
  ENCOUNTER_STATUS_FILTER_COLORS,
} from "@/types/emr/encounter/encounter";
export const encounterStatusFilter = (
  key: string = "encounter_status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    "status",
    "command",
    Array.from(ENCOUNTER_STATUS).map((value) => ({
      value: value,
      label: t(value),
      color: ENCOUNTER_STATUS_FILTER_COLORS[value],
    })),
    undefined,
    (selected: FilterValues) => {
      const selectedStatus = selected as string[];
      if (typeof selectedStatus[0] === "string") {
        const option = selectedStatus[0];
        const color = ENCOUNTER_STATUS_FILTER_COLORS[option as EncounterStatus];
        return (
          <GenericSelectedBadge
            selectedValue={option}
            selectedLength={selectedStatus.length}
            className={color}
          />
        );
      }
      return <></>;
    },
    () => customOperations || [{ label: "is" }],
    mode,
    <CircleDashed className="w-4 h-4" />,
  );
export const encounterClassFilter = (
  key: string = "encounter_class",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("class"),
    "command",
    Array.from(ENCOUNTER_CLASS).map((value) => ({
      value: value,
      label: t(`encounter_class__${value}`),
      color: ENCOUNTER_CLASS_FILTER_COLORS[value as EncounterClass],
    })),
    undefined,
    (selected: FilterValues) => {
      const selectedClass = selected as string[];
      if (typeof selectedClass[0] === "string") {
        const option = selectedClass[0];
        const color = ENCOUNTER_CLASS_FILTER_COLORS[option as EncounterClass];
        return (
          <GenericSelectedBadge
            selectedValue={`encounter_class__${option}`}
            selectedLength={selectedClass.length}
            className={color}
          />
        );
      }
      return <></>;
    },
    () => customOperations || [{ label: "is" }],
    mode,
  );

export const encounterPriorityFilter = (
  key: string = "encounter_priority",
  mode: FilterMode = "single",
  customOperations?: Operation[],
  label?: string,
) =>
  createFilterConfig(
    key,
    label ? t(label) : t("priority"),
    "command",
    Array.from(ENCOUNTER_PRIORITY).map((value) => ({
      value: value.toLowerCase(),
      label: t(`encounter_priority__${value}`),
      color: ENCOUNTER_PRIORITY_FILTER_COLORS[value as EncounterPriority],
    })),
    undefined,
    (selected: FilterValues) => {
      const selectedPriority = selected as string[];
      if (typeof selectedPriority[0] === "string") {
        const option = selectedPriority[0];
        const color =
          ENCOUNTER_PRIORITY_FILTER_COLORS[option as EncounterPriority];
        return (
          <GenericSelectedBadge
            selectedValue={`encounter_priority__${option}`}
            selectedLength={selectedPriority.length}
            className={color}
          />
        );
      }
      return <></>;
    },
    () => customOperations || [{ label: "is" }],
    mode,
  );
export const dateFilter = (
  key: string = "started_date",
  label?: string,
  dateRangeOptions?: DateRangeOption[],
) =>
  createFilterConfig(
    key,
    label || t("started_date"),
    "date",
    [],
    undefined,
    (
      selected: FilterValues,
      filter?: FilterConfig,
      onFilterChange?: (filterKey: string, values: FilterValues) => void,
    ) => {
      return (
        <SelectedDateBadge
          selected={selected as FilterDateRange}
          filter={filter!}
          onFilterChange={onFilterChange!}
        />
      );
    },
    (selected: FilterValues) => getDateOperations(selected as FilterDateRange),
    "single",
    <CalendarFold className="w-4 h-4" />,
    dateRangeOptions,
  );
export const tagFilter = (
  key: string = "tags",
  resource: TagResource = TagResource.ENCOUNTER,
  mode: FilterMode = "multi",
  label?: string,
) =>
  createFilterConfig(
    key,
    label ? t(label) : t("tags", { count: 2 }),
    "tag",
    [],
    resource,
    (selected: FilterValues) => {
      return <SelectedTagBadge selected={selected as TagConfig[]} />;
    },
    (selected: FilterValues) => {
      const selectedTags = selected as TagConfig[];
      if (selectedTags.length === 1)
        return [{ label: "includes", value: "all" }];
      return [
        { label: "has_all_of", value: "all" },
        { label: "has_any_of", value: "any" },
      ];
    },
    mode,
    <Tag className="w-4 h-4" />,
    undefined,
    "tags_behavior",
  );
