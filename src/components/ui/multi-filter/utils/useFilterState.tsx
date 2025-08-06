import { useCallback, useState } from "react";

import { FilterConfig, FilterState, FilterValues } from "./utils";

export default function useFilterState(
  filters: FilterConfig[],
  onFilterUpdate?: (query: Record<string, unknown>) => void,
) {
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, FilterState>
  >(
    filters.reduce(
      (acc, filter) => ({
        ...acc,
        [filter.key]: {
          filter,
          selected: [],
          operation: { selectedOperation: null, availableOperations: [] },
        },
      }),
      {},
    ),
  );

  const handleFilterChange = useCallback(
    (filterKey: string, values: FilterValues) => {
      const filter = selectedFilters[filterKey]?.filter;
      const operations = filter?.getOperations?.(values) ?? [];
      const currentSelectedOperation =
        selectedFilters[filterKey]?.operation.selectedOperation;
      const selectedOperation =
        currentSelectedOperation &&
        operations.includes(currentSelectedOperation)
          ? currentSelectedOperation
          : operations?.[0];
      if (filter) {
        setSelectedFilters((prev) => ({
          ...prev,
          [filterKey]: {
            ...(selectedFilters[filterKey] ?? { filter }),
            selected: values,
            operation: {
              selectedOperation,
              availableOperations: operations,
            },
          },
        }));
        onFilterUpdate?.({
          [filterKey]:
            filter.mode === "single" && Array.isArray(values)
              ? values[0]
              : values,
        });
      }
    },
    [selectedFilters, onFilterUpdate],
  );

  const handleOperationChange = (filterKey: string, operation: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        operation: {
          ...prev[filterKey].operation,
          selectedOperation: operation,
        },
      },
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key].selected = [];
        newState[key].operation.selectedOperation = null;
        newState[key].operation.availableOperations = [];
      });
      return newState;
    });
  };

  const handleClearFilter = (filterKey: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterKey]: { ...prev[filterKey], selected: [] },
    }));
    onFilterUpdate?.({
      [filterKey]: null,
    });
  };

  return {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  };
}
