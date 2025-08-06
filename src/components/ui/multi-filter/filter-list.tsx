import {
  ENCOUNTER_CLASS,
  ENCOUNTER_PRIORITY,
  ENCOUNTER_STATUS,
  EncounterClass,
  EncounterPriority,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";

import { SelectedDateBadge, getDateOperations } from "./date-filter";
import { GenericSelectedBadge } from "./generic-filter";
import { SelectedTagBadge } from "./tag-filter";
import {
  ENCOUNTER_CLASS_FILTER_COLORS,
  ENCOUNTER_PRIORITY_FILTER_COLORS,
  ENCOUNTER_STATUS_FILTER_COLORS,
  FilterDateRange,
  FilterMode,
  FilterValues,
  createFilterConfig,
} from "./utils/utils";

export const encounterStatusFilter = (
  key: string = "encounter_status",
  mode: FilterMode = "single",
) =>
  createFilterConfig(
    key,
    "status",
    "command",
    Array.from(ENCOUNTER_STATUS).map((value) => ({
      value: value,
      label: value,
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
    () => ["is", "is_not"],
    mode,
  );
export const encounterClassFilter = (
  key: string = "encounter_class",
  mode: FilterMode = "single",
) =>
  createFilterConfig(
    key,
    "class",
    "command",
    Array.from(ENCOUNTER_CLASS).map((value) => ({
      value: value,
      label: `encounter_class__${value}`,
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
    () => ["is", "is_not"],
    mode,
  );

export const encounterPriorityFilter = (
  key: string = "encounter_priority",
  mode: FilterMode = "single",
) =>
  createFilterConfig(
    key,
    "priority",
    "command",
    Array.from(ENCOUNTER_PRIORITY).map((value) => ({
      value: value.toLowerCase(),
      label: `encounter_priority__${value}`,
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
    () => ["is", "is_not"],
    mode,
  );

export const startedDateFilter = (key: string = "started_date") =>
  createFilterConfig(
    key,
    "started_date",
    "date",
    [],
    undefined,
    (selected: FilterValues) => {
      return <SelectedDateBadge selected={selected as FilterDateRange} />;
    },
    (selected: FilterValues) => getDateOperations(selected as FilterDateRange),
  );
export const completedDateFilter = (key: string = "completed_date") =>
  createFilterConfig(
    key,
    "completed_date",
    "date",
    [],
    undefined,
    (selected: FilterValues) => {
      return <SelectedDateBadge selected={selected as FilterDateRange} />;
    },
    (selected: FilterValues) => getDateOperations(selected as FilterDateRange),
  );
export const tagFilter = (
  key: string = "tags",
  resource: TagResource = TagResource.ENCOUNTER,
  mode: FilterMode = "multi",
) =>
  createFilterConfig(
    key,
    "tags",
    "tag",
    [],
    resource,
    (selected: FilterValues) => {
      return <SelectedTagBadge selected={selected as TagConfig[]} />;
    },
    (selected: FilterValues) => {
      const selectedTags = selected as TagConfig[];
      if (selectedTags.length === 1) return ["includes", "does_not_include"];
      return ["has_all_of", "has_any_of", "exclude_if_any", "exclude_if_all"];
    },
    mode,
  );
