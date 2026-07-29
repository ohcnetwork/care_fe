import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";

import RenderFacilityUserFilter from "@/components/ui/multi-filter/facilityUserFilter";
import RenderActivityDefinitionFilter, {
  ActivityDefinitionFilterValue,
} from "./activityDefinitionFilter";
import RenderCareTeamFilter from "./careTeamFilter";
import RenderDateFilter from "./dateFilter";
import RenderDepartmentFilter from "./departmentFilter";
import {
  FilterPresentation,
  FilterPresentationProvider,
} from "./filterPresentation";
import GenericFilter from "./genericFilter";
import RenderLocationFilter from "./locationFilter";
import RenderTagFilter from "./tagFilter";
import NavigationHelper from "./utils/navigation-helper";
import { FilterDateRange, FilterState, FilterValues } from "./utils/Utils";

export default function FilterRenderer({
  activeFilter,
  selectedFilters,
  facilityId,
  onFilterChange,
  handleBack,
  presentation = "menu",
}: {
  activeFilter: string;
  selectedFilters: Record<string, FilterState>;
  facilityId?: string;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
  presentation?: FilterPresentation;
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
  const showNavigationHelper = presentation === "menu";

  const content = (() => {
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
            {showNavigationHelper && <NavigationHelper isActiveFilter={true} />}
          </>
        );
      case "department":
        return (
          <>
            <RenderDepartmentFilter
              {...commonProps}
              selectedOrgs={selected as FacilityOrganizationRead[]}
            />
            {showNavigationHelper && <NavigationHelper isActiveFilter={true} />}
          </>
        );
      case "location":
        return (
          <>
            <RenderLocationFilter
              filter={filter}
              selectedLocations={selected as LocationRead[]}
              onFilterChange={onFilterChange}
              handleBack={handleBack}
              facilityId={facilityId}
            />
            {showNavigationHelper && <NavigationHelper isActiveFilter={true} />}
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
            {showNavigationHelper && <NavigationHelper isActiveFilter={true} />}
          </>
        );
      case "care_team":
        return (
          <>
            <RenderCareTeamFilter
              {...commonProps}
              selectedUsers={selected as UserReadMinimal[]}
            />
            {showNavigationHelper && <NavigationHelper isActiveFilter={true} />}
          </>
        );
      case "facility_user":
        return (
          <>
            <RenderFacilityUserFilter
              {...commonProps}
              selectedUsers={selected as UserReadMinimal[]}
            />
            {showNavigationHelper && <NavigationHelper isActiveFilter={true} />}
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
            {showNavigationHelper && <NavigationHelper isActiveFilter={true} />}
          </>
        );
    }
  })();

  return (
    <FilterPresentationProvider presentation={presentation}>
      {content}
    </FilterPresentationProvider>
  );
}
