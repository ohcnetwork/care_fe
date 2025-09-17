import { FilterState } from "./Utils";

export default function useMultiFilter(
  key: string,
  selectedFilters: Record<string, FilterState>,
) {
  const filterState = selectedFilters[key];
  const filter = filterState.filter;
  const selected = filterState.selected;
  const { selectedOperation, availableOperations } = filterState.operation;

  return {
    filter,
    selected,
    selectedOperation,
    availableOperations,
  };
}
