import { FilterDateRange, FilterState, FilterValues } from "./utils/Utils";

type ArrayValue<T> = T extends (infer Value)[] ? Value : T;
export type CareFilterValue = ArrayValue<FilterValues>;

export function toCareValues(selected: FilterValues): CareFilterValue[] {
  if (Array.isArray(selected)) return selected;
  return selected.from || selected.to ? [selected] : [];
}

export function toDomainValues(
  state: FilterState,
  values: CareFilterValue[],
): FilterValues {
  return state.filter.type === "date"
    ? ((values[0] ?? {}) as FilterDateRange)
    : (values as Exclude<FilterValues, FilterDateRange>);
}
