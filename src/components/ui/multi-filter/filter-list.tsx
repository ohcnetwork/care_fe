import {
  ENCOUNTER_CLASS,
  ENCOUNTER_STATUS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";

import { SelectedDateBadge, getDateOperations } from "./date-filter";
import { GenericSelectedBadge } from "./generic-filter";
import { SelectedTagBadge } from "./tag-filter";
import {
  BADGE_BORDER_COLORS,
  BADGE_TEXT_COLORS,
  COLOR_PALETTE,
  FilterDateRange,
  FilterMode,
  FilterValues,
  createFilterConfig,
} from "./utils/utils";

export const encounterStatusFilter = (
  key: string = "encounter_status",
  mode: FilterMode = "multi",
) =>
  createFilterConfig(
    key,
    "status",
    "command",
    Array.from(ENCOUNTER_STATUS).map((value) => ({
      value: value,
      label: value,
      color: ENCOUNTER_STATUS_COLORS[value],
    })),
    undefined,
    (selected: FilterValues) => {
      const selectedStatus = selected as string[];
      if (typeof selectedStatus[0] === "string") {
        const option = selectedStatus[0];
        const firstSelectedIndex = Object.values(ENCOUNTER_STATUS).findIndex(
          (o) => o === option,
        );
        const color = COLOR_PALETTE[firstSelectedIndex % COLOR_PALETTE.length];
        const borderColor =
          BADGE_BORDER_COLORS[firstSelectedIndex % BADGE_BORDER_COLORS.length];
        const textColor =
          BADGE_TEXT_COLORS[firstSelectedIndex % BADGE_TEXT_COLORS.length];
        return (
          <GenericSelectedBadge
            selectedValue={option}
            selectedLength={selectedStatus.length}
            color={color}
            borderColor={borderColor}
            textColor={textColor}
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
  mode: FilterMode = "multi",
) =>
  createFilterConfig(
    key,
    "class",
    "command",
    Object.entries(ENCOUNTER_CLASS).map(([key, value]) => ({
      value: key,
      label: `encounter_class__${value}`,
    })),
    undefined,
    (selected: FilterValues) => {
      const selectedClass = selected as string[];
      if (typeof selectedClass[0] === "string") {
        const option = selectedClass[0];
        const firstSelectedIndex = Object.values(ENCOUNTER_CLASS).findIndex(
          (o) => o === option,
        );
        const color = COLOR_PALETTE[firstSelectedIndex % COLOR_PALETTE.length];
        const borderColor =
          BADGE_BORDER_COLORS[firstSelectedIndex % BADGE_BORDER_COLORS.length];
        const textColor =
          BADGE_TEXT_COLORS[firstSelectedIndex % BADGE_TEXT_COLORS.length];
        return (
          <GenericSelectedBadge
            selectedValue={`encounter_class__${option}`}
            selectedLength={selectedClass.length}
            color={color}
            borderColor={borderColor}
            textColor={textColor}
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
  );
