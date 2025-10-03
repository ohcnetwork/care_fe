import {
  ENCOUNTER_CLASS,
  ENCOUNTER_PRIORITY,
  ENCOUNTER_STATUS,
  EncounterClass,
  EncounterPriority,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CalendarFold,
  CheckCircle,
  CircleDashed,
  Clock,
  Tag,
  Users,
  Zap,
} from "lucide-react";

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

// ENHANCED STATUS FILTER WITH COMPREHENSIVE ICON SUPPORT
export const encounterStatusFilter = (
  key: string = "encounter_status",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    "status",
    "command",
    Array.from(ENCOUNTER_STATUS).map((value) => {
      // COMPREHENSIVE ICON MAPPING FOR ALL STATUS VALUES
      const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
          case "active":
          case "in-progress":
          case "ongoing":
            return <CheckCircle className="h-4 w-4 text-green-600" />;
          case "planned":
          case "scheduled":
          case "booked":
            return <Clock className="h-4 w-4 text-blue-600" />;
          case "cancelled":
          case "canceled":
          case "aborted":
            return <AlertCircle className="h-4 w-4 text-red-600" />;
          case "completed":
          case "finished":
          case "ended":
            return <CheckCircle className="h-4 w-4 text-green-800" />;
          case "suspended":
          case "paused":
            return <AlertTriangle className="h-4 w-4 text-orange-600" />;
          case "pending":
          case "waiting":
            return <Clock className="h-4 w-4 text-yellow-600" />;
          default:
            return <CircleDashed className="h-4 w-4 text-gray-600" />;
        }
      };

      return {
        value: value,
        label: t(value),
        color: ENCOUNTER_STATUS_FILTER_COLORS[value],
        icon: getStatusIcon(value),
      };
    }),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedStatus = selected as string[];
        if (typeof selectedStatus[0] === "string") {
          const option = selectedStatus[0];
          const color =
            ENCOUNTER_STATUS_FILTER_COLORS[option as EncounterStatus];

          // SAME ICON LOGIC FOR SELECTED BADGES
          const getStatusIcon = (status: string) => {
            switch (status.toLowerCase()) {
              case "active":
              case "in-progress":
              case "ongoing":
                return <CheckCircle className="h-3 w-3 text-green-600" />;
              case "planned":
              case "scheduled":
              case "booked":
                return <Clock className="h-3 w-3 text-blue-600" />;
              case "cancelled":
              case "canceled":
              case "aborted":
                return <AlertCircle className="h-3 w-3 text-red-600" />;
              case "completed":
              case "finished":
              case "ended":
                return <CheckCircle className="h-3 w-3 text-green-800" />;
              case "suspended":
              case "paused":
                return <AlertTriangle className="h-3 w-3 text-orange-600" />;
              case "pending":
              case "waiting":
                return <Clock className="h-3 w-3 text-yellow-600" />;
              default:
                return <CircleDashed className="h-3 w-3 text-gray-600" />;
            }
          };

          return (
            <GenericSelectedBadge
              selectedValue={option}
              selectedLength={selectedStatus.length}
              className={color}
              icon={getStatusIcon(option)}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
      icon: <CircleDashed className="w-4 h-4" />,
    },
  );

// ENHANCED CLASS FILTER WITH COMPREHENSIVE ICON SUPPORT
export const encounterClassFilter = (
  key: string = "encounter_class",
  mode: FilterMode = "single",
  customOperations?: Operation[],
) =>
  createFilterConfig(
    key,
    t("class"),
    "command",
    Array.from(ENCOUNTER_CLASS).map((value) => {
      // COMPREHENSIVE ICON MAPPING FOR ALL CLASS VALUES
      const getClassIcon = (className: string) => {
        switch (className.toLowerCase()) {
          case "inpatient":
          case "imp":
          case "hospitalization":
            return <Users className="h-4 w-4 text-blue-600" />;
          case "outpatient":
          case "ambulatory":
          case "op":
            return <Activity className="h-4 w-4 text-green-600" />;
          case "emergency":
          case "urgent":
          case "er":
            return <AlertCircle className="h-4 w-4 text-red-600" />;
          case "virtual":
          case "telemedicine":
          case "remote":
            return <CircleDashed className="h-4 w-4 text-purple-600" />;
          default:
            return <Activity className="h-4 w-4 text-gray-600" />;
        }
      };

      return {
        value: value,
        label: t(`encounter_class__${value}`),
        color: ENCOUNTER_CLASS_FILTER_COLORS[value as EncounterClass],
        icon: getClassIcon(value),
      };
    }),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedClass = selected as string[];
        if (typeof selectedClass[0] === "string") {
          const option = selectedClass[0];
          const color = ENCOUNTER_CLASS_FILTER_COLORS[option as EncounterClass];

          // SAME ICON LOGIC FOR SELECTED BADGES
          const getClassIcon = (className: string) => {
            switch (className.toLowerCase()) {
              case "inpatient":
              case "imp":
              case "hospitalization":
                return <Users className="h-3 w-3 text-blue-600" />;
              case "outpatient":
              case "ambulatory":
              case "op":
                return <Activity className="h-3 w-3 text-green-600" />;
              case "emergency":
              case "urgent":
              case "er":
                return <AlertCircle className="h-3 w-3 text-red-600" />;
              case "virtual":
              case "telemedicine":
              case "remote":
                return <CircleDashed className="h-3 w-3 text-purple-600" />;
              default:
                return <Activity className="h-3 w-3 text-gray-600" />;
            }
          };

          return (
            <GenericSelectedBadge
              selectedValue={`encounter_class__${option}`}
              selectedLength={selectedClass.length}
              className={color}
              icon={getClassIcon(option)}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
    },
  );

// ENHANCED PRIORITY FILTER WITH COMPREHENSIVE ICON SUPPORT
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
    Array.from(ENCOUNTER_PRIORITY).map((value) => {
      // COMPREHENSIVE ICON MAPPING FOR ALL PRIORITY VALUES
      const getPriorityIcon = (priority: string) => {
        const p = priority.toLowerCase();
        switch (p) {
          case "stat":
          case "emergency":
          case "urgent":
          case "high":
          case "critical":
            return <Zap className="h-4 w-4 text-red-600" />;
          case "asap":
          case "timing_critical":
          case "timing-critical":
          case "medium":
            return <AlertTriangle className="h-4 w-4 text-orange-600" />;
          case "routine":
          case "normal":
          case "low":
          case "standard":
            return <CheckCircle className="h-4 w-4 text-green-600" />;
          case "deferred":
          case "postponed":
            return <Clock className="h-4 w-4 text-blue-600" />;
          default:
            return <CircleDashed className="h-4 w-4 text-gray-600" />;
        }
      };

      return {
        value: value, // Keep original case for consistency
        label: t(`encounter_priority__${value}`),
        color: ENCOUNTER_PRIORITY_FILTER_COLORS[value as EncounterPriority],
        icon: getPriorityIcon(value),
      };
    }),
    {
      renderSelected: (selected: FilterValues) => {
        const selectedPriority = selected as string[];
        if (typeof selectedPriority[0] === "string") {
          const option = selectedPriority[0];
          const color =
            ENCOUNTER_PRIORITY_FILTER_COLORS[option as EncounterPriority];

          // SAME ICON LOGIC FOR SELECTED BADGES
          const getPriorityIcon = (priority: string) => {
            const p = priority.toLowerCase();
            switch (p) {
              case "stat":
              case "emergency":
              case "urgent":
              case "high":
              case "critical":
                return <Zap className="h-3 w-3 text-red-600" />;
              case "asap":
              case "timing_critical":
              case "timing-critical":
              case "medium":
                return <AlertTriangle className="h-3 w-3 text-orange-600" />;
              case "routine":
              case "normal":
              case "low":
              case "standard":
                return <CheckCircle className="h-3 w-3 text-green-600" />;
              case "deferred":
              case "postponed":
                return <Clock className="h-3 w-3 text-blue-600" />;
              default:
                return <CircleDashed className="h-3 w-3 text-gray-600" />;
            }
          };

          return (
            <GenericSelectedBadge
              selectedValue={`encounter_priority__${option}`}
              selectedLength={selectedPriority.length}
              className={color}
              icon={getPriorityIcon(option)}
            />
          );
        }
        return <></>;
      },
      getOperations: () => customOperations || [{ label: "is" }],
      mode,
    },
  );

// DATE FILTER WITH ICON
export const dateFilter = (
  key: string = "started_date",
  label?: string,
  dateRangeOptions?: DateRangeOption[],
  disableClear?: boolean,
) =>
  createFilterConfig(key, label || t("started_date"), "date", [], {
    renderSelected: (
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
    getOperations: (selected: FilterValues) =>
      getDateOperations(selected as FilterDateRange),
    mode: "single",
    icon: <CalendarFold className="w-4 h-4" />,
    dateRangeOptions,
    disableClear,
  });

// TAG FILTER WITH ICON
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
    {
      resource: resource,
      renderSelected: (selected: FilterValues) => {
        return <SelectedTagBadge selected={selected as TagConfig[]} />;
      },
      getOperations: (selected: FilterValues) => {
        const selectedTags = selected as TagConfig[];
        if (selectedTags.length === 1)
          return [{ label: "includes", value: "all" }];
        return [
          { label: "has_all_of", value: "all" },
          { label: "has_any_of", value: "any" },
        ];
      },
      mode,
      icon: <Tag className="w-4 h-4" />,
      operationKey: "tags_behavior",
    },
  );
