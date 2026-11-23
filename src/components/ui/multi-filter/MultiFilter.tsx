import { ListFilter } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/ui/filters";
import { cn } from "@/lib/utils";

import {
  toCareValues,
  toDomainValues,
  type CareFilterValue,
} from "./careuiAdapter";
import { DomainFilterValue } from "./domainFilterValue";
import { useFilterI18n } from "./useFilterI18n";
import { FilterState, FilterValues } from "./utils/Utils";

interface MultiFilterProps {
  selectedFilters: Record<string, FilterState>;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  onOperationChange: (filterKey: string, operation: string) => void;
  onClearAll: () => void;
  onClearFilter: (filterKey: string) => void;
  placeholder?: string;
  className?: string;
  triggerButtonClassName?: string;
  clearAllButtonClassName?: string;
  selectedBarClassName?: string;
  selectedValueClassName?: string;
  facilityId?: string;
  disabled?: boolean;
  align?: "start" | "end";
}

/** Adapts CARE query filters and clinical pickers to the CareUI filter framework. */
export default function MultiFilter({
  selectedFilters,
  onFilterChange,
  onOperationChange,
  onClearAll,
  onClearFilter,
  placeholder,
  className,
  triggerButtonClassName,
  clearAllButtonClassName,
  selectedBarClassName,
  selectedValueClassName,
  facilityId,
  disabled = false,
  align = "start",
}: MultiFilterProps) {
  const { t } = useTranslation();
  const i18n = useFilterI18n();
  const [draftFilters, setDraftFilters] = useState<Filter<CareFilterValue>[]>(
    [],
  );
  const [filterIds, setFilterIds] = useState<Record<string, string>>({});

  const activeFilters = Object.entries(selectedFilters).flatMap(
    ([key, state]) => {
      const values = toCareValues(state.selected);
      return values.length
        ? [
            {
              id: filterIds[key] ?? key,
              field: key,
              operator:
                state.operation.selectedOperation?.value ??
                state.operation.selectedOperation?.label ??
                "is",
              values,
            },
          ]
        : [];
    },
  );
  const activeKeys = new Set(activeFilters.map((filter) => filter.field));
  const filters = [
    ...activeFilters,
    ...draftFilters.filter((filter) => !activeKeys.has(filter.field)),
  ];

  const fields: FilterFieldConfig<CareFilterValue>[] = Object.entries(
    selectedFilters,
  ).map(([key, state]) => {
    const { filter, selected, operation } = state;
    const operations =
      filter.getOperations?.(selected) ?? operation.availableOperations;
    const field: FilterFieldConfig<CareFilterValue> = {
      key,
      label: t(filter.label),
      icon: filter.icon,
      type:
        filter.type === "command"
          ? filter.mode === "single"
            ? "select"
            : "multiselect"
          : "custom",
      operators: operations.length
        ? operations.map((operation) => ({
            value: operation.value ?? operation.label,
            label: t(operation.label),
            supportsMultiple: filter.mode !== "single",
          }))
        : [{ value: "is", label: t("is") }],
      defaultOperator:
        operation.selectedOperation?.value ??
        operation.selectedOperation?.label ??
        operations[0]?.value ??
        operations[0]?.label ??
        "is",
      options: filter.options.map((option) => ({
        ...option,
        label: t(option.label),
        icon:
          filter.showColorIndicators === false ? undefined : (
            <span
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0 rounded-full border",
                option.color,
              )}
            />
          ),
      })),
      disableClear: filter.disableClear,
      disableOperatorUntilSelected: true,
      chipClassName: selectedBarClassName,
      valueClassName: cn(
        "md:max-w-64 lg:max-w-80 xl:max-w-96",
        selectedValueClassName,
      ),
      customValueRenderer: (values) =>
        values.length
          ? filter.renderSelected?.(
              toDomainValues(state, values),
              filter,
              onFilterChange,
            )
          : t("select"),
    };

    if (filter.type !== "command") {
      field.customRenderer = ({ values, onChange, open, onOpenChange }) => (
        <DomainFilterValue
          state={state}
          values={values}
          selectedFilters={selectedFilters}
          onChange={onChange}
          open={open}
          onOpenChange={onOpenChange}
          facilityId={facilityId}
          className={field.valueClassName}
        />
      );
    }
    return field;
  });

  const handleChange = (nextFilters: Filter<CareFilterValue>[]) => {
    setFilterIds(
      Object.fromEntries(
        nextFilters.map((filter) => [filter.field, filter.id]),
      ),
    );
    setDraftFilters(nextFilters.filter((filter) => filter.values.length === 0));

    for (const next of nextFilters) {
      const state = selectedFilters[next.field];
      if (!state) continue;
      const previous = filters.find((filter) => filter.field === next.field);
      if (
        JSON.stringify(previous?.values ?? []) !== JSON.stringify(next.values)
      ) {
        onFilterChange(next.field, toDomainValues(state, next.values));
      } else if (previous && previous.operator !== next.operator) {
        onOperationChange(next.field, next.operator);
      }
    }
    for (const previous of activeFilters) {
      if (
        !nextFilters.some((filter) => filter.field === previous.field) &&
        !selectedFilters[previous.field].filter.disableClear
      ) {
        onClearFilter(previous.field);
      }
    }
  };

  return (
    <fieldset disabled={disabled} className="min-w-0 border-0 p-0">
      <Filters
        filters={filters}
        fields={fields}
        onChange={handleChange}
        onClearAll={() => {
          setDraftFilters([]);
          onClearAll();
        }}
        i18n={i18n}
        align={align}
        className={className}
        clearAllButtonClassName={clearAllButtonClassName}
        trigger={
          <Button
            type="button"
            variant="outline"
            className={cn("shadow-sm", triggerButtonClassName)}
            disabled={disabled}
          >
            <ListFilter aria-hidden="true" />
            {placeholder ?? t("filter")}
          </Button>
        }
      />
    </fieldset>
  );
}
