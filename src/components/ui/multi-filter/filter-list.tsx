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
  FilterValues,
  createFilterConfig,
} from "./utils/utils";

export const encounterStatusFilter = createFilterConfig(
  "encounter_status",
  "status",
  "command",
  Object.entries(ENCOUNTER_STATUS).map(([key, value]) => ({
    value: key,
    label: value,
    color: ENCOUNTER_STATUS_COLORS[key as keyof typeof ENCOUNTER_STATUS_COLORS],
  })),
  undefined,
  (selected: FilterValues) => {
    const selectedStatus = selected as string[];
    if (typeof selectedStatus[0] === "string") {
      const option = ENCOUNTER_STATUS[
        selectedStatus[0] as keyof typeof ENCOUNTER_STATUS
      ] as string;
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
);
export const encounterClassFilter = createFilterConfig(
  "encounter_class",
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
      const option = ENCOUNTER_CLASS[
        selectedClass[0] as keyof typeof ENCOUNTER_CLASS
      ] as string;
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
);
export const startedDateFilter = createFilterConfig(
  "started_date",
  "started_date",
  "date",
  [],
  undefined,
  (selected: FilterValues) => {
    return <SelectedDateBadge selected={selected as FilterDateRange} />;
  },
  (selected: FilterValues) => getDateOperations(selected as FilterDateRange),
);
export const completedDateFilter = createFilterConfig(
  "completed_date",
  "completed_date",
  "date",
  [],
  undefined,
  (selected: FilterValues) => {
    return <SelectedDateBadge selected={selected as FilterDateRange} />;
  },
  (selected: FilterValues) => getDateOperations(selected as FilterDateRange),
);
export const tagFilter = createFilterConfig(
  "tags",
  "tags",
  "tag",
  [],
  TagResource.ENCOUNTER,
  (selected: FilterValues) => {
    return <SelectedTagBadge selected={selected as TagConfig[]} />;
  },
  (selected: FilterValues) => {
    const selectedTags = selected as TagConfig[];
    if (selectedTags.length === 1) return ["includes", "does_not_include"];
    return ["has_all_of", "has_any_of", "exclude_if_any", "exclude_if_all"];
  },
);
