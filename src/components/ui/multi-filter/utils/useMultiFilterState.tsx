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
  const getInitialValues = (): Record<string, FilterValues> => {
    if (!queryParams) return {};

    const initialValues: Record<string, FilterValues> = {};

    filters.forEach((filter) => {
      const queryValue = queryParams[filter.key];
      if (queryValue) {
        if (Array.isArray(queryValue)) {
          initialValues[filter.key] = queryValue;
        } else if (typeof queryValue === "string") {
          initialValues[filter.key] = [queryValue];
        } else if (queryValue !== null && queryValue !== undefined) {
          initialValues[filter.key] = [String(queryValue)];
        }
      }
    });

    return initialValues;
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

    const initialValues = getInitialValues();
    const hasValues = Object.keys(initialValues).length > 0;

    if (hasValues) {
      lastQueryParams.current = queryParams;

      setSelectedFilters((prev) => {
        const newState = { ...prev };

        Object.entries(initialValues).forEach(([key, value]) => {
          if (newState[key]) {
            const filter = newState[key].filter;
            const operations = filter.getOperations?.(value) ?? [];

            newState[key] = {
              ...newState[key],
              selected: value,
              operation: {
                selectedOperation: operations[0] || null,
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

        // Only call onFilterUpdate if we're initialized
        if (isInitialized.current) {
          onFilterUpdate?.({
            [filterKey]:
              filter.mode === "single" && Array.isArray(values)
                ? values[0]
                : values,
          });
        }
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
    const newState = { ...selectedFilters };
    Object.keys(newState).forEach((key) => {
      newState[key].selected = [];
      newState[key].operation.selectedOperation = null;
      newState[key].operation.availableOperations = [];
    });
    setSelectedFilters(newState);
    onFilterUpdate?.(
      Object.keys(newState).reduce(
        (acc, key) => {
          acc[key] = undefined;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    );
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
