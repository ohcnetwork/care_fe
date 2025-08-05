import { useState } from "react";

import { FilterConfig, FilterState, FilterValues } from "./utils";

export default function useFilterState(filters: FilterConfig[]) {
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

  const handleFilterChange = (filterKey: string, values: FilterValues) => {
    const filter = selectedFilters[filterKey]?.filter;
    const operations = filter?.getOperations?.(values) ?? [];
    const currentSelectedOperation =
      selectedFilters[filterKey]?.operation.selectedOperation;
    const selectedOperation =
      currentSelectedOperation && operations.includes(currentSelectedOperation)
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
    }
  };

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
  };

  return {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  };
}
