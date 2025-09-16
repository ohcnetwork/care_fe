import { TagConfig } from "@/types/emr/tagConfig/tagConfig";

import RenderDateFilter from "./dateFilter";
import GenericFilter from "./genericFilter";
import RenderTagFilter from "./tagFilter";
import NavigationHelper from "./utils/navigation-helper";
import { FilterDateRange, FilterState, FilterValues } from "./utils/Utils";

export default function FilterRenderer({
  activeFilter,
  selectedFilters,
  onFilterChange,
  handleBack,
}: {
  activeFilter: string;
  selectedFilters: Record<string, FilterState>;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
}) {
  const filterState = selectedFilters[activeFilter];
  const filter = filterState?.filter;
  if (!filter) return null;

  const selected = selectedFilters[filter.key].selected || [];
  const commonProps = {
    filter,
    handleBack,
    onFilterChange,
  };

  switch (filter.type) {
    case "date":
      return (
        <RenderDateFilter
          {...commonProps}
          selected={selected as FilterDateRange}
        />
      );
    case "tag":
      return (
        <>
          <RenderTagFilter
            {...commonProps}
            selectedTags={selected as TagConfig[]}
          />
          <NavigationHelper isActiveFilter={true} />
        </>
      );
    default:
      return (
        <>
          <GenericFilter
            {...commonProps}
            selectedValues={selected as string[]}
            showColorIndicators={true}
          />
          <NavigationHelper isActiveFilter={true} />
        </>
      );
  }
}
