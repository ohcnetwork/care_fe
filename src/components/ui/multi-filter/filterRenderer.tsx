import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";

import RenderActivityDefinitionFilter, {
  ActivityDefinitionFilterValue,
} from "./activityDefinitionFilter";
import RenderDateFilter from "./dateFilter";
import RenderDepartmentFilter from "./departmentFilter";
import GenericFilter from "./genericFilter";
import RenderTagFilter from "./tagFilter";
import NavigationHelper from "./utils/navigation-helper";
import { FilterDateRange, FilterState, FilterValues } from "./utils/Utils";

export default function FilterRenderer({
  activeFilter,
  selectedFilters,
  facilityId,
  onFilterChange,
  handleBack,
}: {
  activeFilter: string;
  selectedFilters: Record<string, FilterState>;
  facilityId?: string;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
}) {
  const filterState = selectedFilters[activeFilter];
  const filter = filterState?.filter;
  if (!filter) return null;

  const selected = selectedFilters[filter.key].selected || [];
  const commonProps = {
    filter,
    facilityId,
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
    case "department":
      return (
        <>
          <RenderDepartmentFilter
            {...commonProps}
            selectedOrgs={selected as FacilityOrganizationRead[]}
          />
          <NavigationHelper isActiveFilter={true} />
        </>
      );
    case "activity_definition":
      return (
        <>
          <RenderActivityDefinitionFilter
            {...commonProps}
            facilityId={facilityId || ""}
            selectedDefinitions={selected as ActivityDefinitionFilterValue[]}
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
            showColorIndicators={filter.showColorIndicators ?? true}
          />
          <NavigationHelper isActiveFilter={true} />
        </>
      );
  }
}
