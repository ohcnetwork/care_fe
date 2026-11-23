import { type ReactNode, type Ref } from "react";

import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";

import RenderFacilityUserFilter from "@/components/ui/multi-filter/facilityUserFilter";
import RenderActivityDefinitionFilter, {
  ActivityDefinitionFilterValue,
} from "./activityDefinitionFilter";
import RenderCommandFilter from "./commandFilter";
import RenderDateFilter, { type DateFilterHandle } from "./dateFilter";
import RenderDepartmentFilter from "./departmentFilter";
import FilterFooter from "./filterFooter";
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
  handleClose,
  dateDraftRef,
}: {
  activeFilter: string;
  selectedFilters: Record<string, FilterState>;
  facilityId?: string;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
  handleClose?: () => void;
  /** Lets the hosting menu apply an unapplied custom date range on close. */
  dateDraftRef?: Ref<DateFilterHandle>;
}) {
  const filterState = selectedFilters[activeFilter];
  const filter = filterState?.filter;
  if (!filter) return null;

  const selected = selectedFilters[filter.key].selected || [];
  const commonProps = {
    filter,
    facilityId,
    handleBack,
    handleClose,
    onFilterChange,
  };
  // Pickers opened from "Add filter" (which can close) get Clear/Done; inline
  // value pickers keep the keyboard hints.
  const footer = (
    multiple: boolean,
    hints: ReactNode = (
      <NavigationHelper isActiveFilter enterToSelect canGoBack={!!handleBack} />
    ),
  ) =>
    handleClose ? (
      <FilterFooter
        multiple={multiple}
        hasSelection={Array.isArray(selected) && selected.length > 0}
        onClear={
          filter.disableClear ? undefined : () => onFilterChange(filter.key, [])
        }
        onDone={handleClose}
      />
    ) : (
      hints
    );

  switch (filter.type) {
    case "command":
      return (
        <>
          <RenderCommandFilter
            {...commonProps}
            selected={selected as string[]}
          />
          {footer(filter.mode === "multi")}
        </>
      );
    case "date":
      return (
        <RenderDateFilter
          {...commonProps}
          ref={dateDraftRef}
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
          {footer(true)}
        </>
      );
    case "department":
      return (
        <>
          <RenderDepartmentFilter
            {...commonProps}
            selectedOrgs={selected as FacilityOrganizationRead[]}
          />
          {footer(false)}
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
            handleClose={handleClose}
            facilityId={facilityId}
          />
          {footer(true, <NavigationHelper isActiveFilter />)}
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
          {footer(filter.mode === "multi")}
        </>
      );
    case "care_team":
    case "facility_user":
      return (
        <>
          <RenderFacilityUserFilter
            {...commonProps}
            selectedUsers={selected as UserReadMinimal[]}
          />
          {footer(false)}
        </>
      );
    default:
      return null;
  }
}
