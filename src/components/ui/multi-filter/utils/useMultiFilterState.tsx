import { useCallback, useEffect, useRef, useState } from "react";

import { FilterConfig, FilterState, FilterValues } from "./utils";

export default function useMultiFilterState(
  filters: FilterConfig[],
  onFilterUpdate?: (query: Record<string, unknown>) => void,
  queryParams?: Record<string, unknown>,
) {
  const isInitialized = useRef(false);
  const lastQueryParams = useRef<Record<string, unknown> | undefined>(
    undefined,
  );

  // Extract initial values from query params
  const getInitialValues = (): {
    filterValues: Record<string, FilterValues>;
    operationValues: Record<string, string>;
  } => {
    if (!queryParams) return { filterValues: {}, operationValues: {} };

    const filterValues: Record<string, FilterValues> = {};
    const operationValues: Record<string, string> = {};

    filters.forEach((filter) => {
      const queryValue = queryParams[filter.key];
      if (queryValue) {
        if (Array.isArray(queryValue)) {
          filterValues[filter.key] = queryValue;
        } else if (typeof queryValue === "string") {
          filterValues[filter.key] = [queryValue];
        } else if (typeof queryValue === "object") {
          filterValues[filter.key] = queryValue as FilterValues;
        } else if (queryValue !== null && queryValue !== undefined) {
          filterValues[filter.key] = [String(queryValue)];
        }
      }

      // Extract operation values
      if (filter.operationKey) {
        const operationValue = queryParams[filter.operationKey];
        if (operationValue && typeof operationValue === "string") {
          operationValues[filter.key] = operationValue;
        }
      }
    });

    return { filterValues, operationValues };
  };

  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, FilterState>
  >(() => {
    const initialState = filters.reduce((acc, filter) => {
      return {
        ...acc,
        [filter.key]: {
          filter,
          selected: [],
          operation: {
            selectedOperation: null,
            availableOperations: [],
          },
        },
      };
    }, {});

    isInitialized.current = true;
    return initialState;
  });

  // Initialize filters from query params
  useEffect(() => {
    if (!queryParams || !isInitialized.current) return;

    // Check if queryParams have actually changed
    const paramsChanged =
      JSON.stringify(queryParams) !== JSON.stringify(lastQueryParams.current);
    if (!paramsChanged) return;

    const { filterValues, operationValues } = getInitialValues();
    const hasValues = Object.keys(filterValues).length > 0;

    if (hasValues) {
      lastQueryParams.current = queryParams;

      setSelectedFilters((prev) => {
        const newState = { ...prev };

        // Initialize filters with values
        Object.entries(filterValues).forEach(([key, value]) => {
          if (newState[key]) {
            const filter = newState[key].filter;
            const operations = filter.getOperations?.(value) ?? [];

            let selectedOperation = null;
            if (operationValues[key]) {
              selectedOperation = operations.find(
                (op) =>
                  op.value === operationValues[key] ||
                  op.label === operationValues[key],
              );
            }
            selectedOperation = selectedOperation || operations[0] || null;

            newState[key] = {
              ...newState[key],
              selected: value,
              operation: {
                selectedOperation,
                availableOperations: operations,
              },
            };
          }
        });

        return newState;
      });
    }
  }, [queryParams, filters]);

  const handleFilterChange = useCallback(
    (filterKey: string, values: FilterValues) => {
      const filter = selectedFilters[filterKey]?.filter;
      const operations = filter?.getOperations?.(values) ?? [];
      const currentSelectedOperation =
        selectedFilters[filterKey]?.operation.selectedOperation;

      // Find the current operation or default to first available
      const currentOperation = operations.find(
        (op) =>
          op.value === currentSelectedOperation?.value ||
          op.label === currentSelectedOperation?.label,
      );
      const selectedOperation = currentOperation || operations[0];

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

        // Only call onFilterUpdate if we're initialized
        if (isInitialized.current) {
          const updateData: Record<string, unknown> = {
            [filterKey]:
              filter.mode === "single" && Array.isArray(values)
                ? values[0]
                : values,
          };

          // Add operation to update if operationKey is specified
          if (filter.operationKey && selectedOperation) {
            updateData[filter.operationKey] =
              selectedOperation.value || selectedOperation.label;
          }

          onFilterUpdate?.(updateData);
        }
      }
    },
    [selectedFilters, onFilterUpdate],
  );

  const handleOperationChange = (filterKey: string, operationLabel: string) => {
    const operation =
      selectedFilters[filterKey]?.operation.availableOperations.find(
        (op) => op.value === operationLabel || op.label === operationLabel,
      ) || selectedFilters[filterKey]?.operation.availableOperations[0];

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

    // Update the query params with the new operation
    if (operation && selectedFilters[filterKey]?.filter.operationKey) {
      const operationValue = operation.value || operation.label;
      onFilterUpdate?.({
        [selectedFilters[filterKey].filter.operationKey]: operationValue,
      });
    }
  };

  const handleClearAll = () => {
    const newState = { ...selectedFilters };
    Object.keys(newState).forEach((key) => {
      newState[key].selected = [];
      newState[key].operation.selectedOperation = null;
      newState[key].operation.availableOperations = [];
    });
    setSelectedFilters(newState);
    const clearData: Record<string, unknown> = {};
    Object.keys(newState).forEach((key) => {
      clearData[key] = undefined;
      // Clear operation if operationKey is specified
      if (newState[key].filter.operationKey) {
        clearData[newState[key].filter.operationKey] = undefined;
      }
    });

    onFilterUpdate?.(clearData);
  };

  const handleClearFilter = (filterKey: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterKey]: { ...prev[filterKey], selected: [] },
    }));

    const filter = selectedFilters[filterKey]?.filter;
    const updateData: Record<string, unknown> = {
      [filterKey]: null,
    };

    // Clear operation if operationKey is specified
    if (filter?.operationKey) {
      updateData[filter.operationKey] = null;
    }

    onFilterUpdate?.(updateData);
  };

  return {
    selectedFilters,
    handleFilterChange,
    handleOperationChange,
    handleClearAll,
    handleClearFilter,
  };
}
