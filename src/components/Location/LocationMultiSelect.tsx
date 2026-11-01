// TODO: This is a temporary fix to the location multi select.
// This doesn't account for nested locations.
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface BaseLocationTreeNodeProps {
  location: LocationRead;
  selectedLocations: LocationValue[];
  onSelect: (locationId: string) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
  addLocationsToMap: (locations: LocationRead[]) => void;
  renderLocationInfo: (location: LocationRead) => React.ReactNode;
  getPaddingLeft: (level: number) => string;
  className?: string;
}

function BaseLocationTreeNode({
  location,
  selectedLocations,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
  addLocationsToMap,
  renderLocationInfo,
  getPaddingLeft,
  className,
}: BaseLocationTreeNodeProps) {
  const { t } = useTranslation();
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = selectedLocations.some((loc) => loc.id === location.id);

  // Fetch children when expanded
  const { data: children, isLoading } = useQuery({
    queryKey: ["locations", facilityId, "children", location.id, "kind"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location.id,
        mode: "kind",
        limit: 100,
      },
    }),
    enabled: isExpanded && location.has_sub_locations,
    staleTime: 5 * 60 * 1000,
  });

  // Add children to the global map when they are fetched
  useEffect(() => {
    if (children?.results) {
      addLocationsToMap(children.results);
    }
  }, [children?.results, addLocationsToMap]);

  const hasChildren = location.has_sub_locations;
  const hasChildrenResults = children?.results && children.results.length > 0;
  const shouldShowExpand =
    hasChildren && (isExpanded ? hasChildrenResults : true);

  const handleRowClick = () => {
    if (shouldShowExpand) {
      onToggleExpand(location.id);
    }
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "group flex items-center py-1 rounded-md hover:bg-gray-50 transition-colors my-1",
          isSelected && "bg-primary-100/50 border border-primary-200",
          shouldShowExpand && "cursor-pointer hover:bg-gray-100",
          className,
        )}
        style={{ paddingLeft: getPaddingLeft(level) }}
        onClick={handleRowClick}
      >
        {isLoading ? (
          <Button variant="ghost" size="icon" className="size-6">
            <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </Button>
        ) : shouldShowExpand ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 hover:bg-gray-100"
            aria-label={`${t(isExpanded ? "collapse" : "expand")} ${location.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(location.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        ) : (
          <span className="w-7" />
        )}

        {renderLocationInfo(location)}

        {!isSelected && (
          <Button
            variant="ghost"
            size="icon"
            className="mx-2 size-8 shrink-0 rounded-lg border shadow-sm hover:bg-white hover:border-gray-300"
            aria-label={`${t("select")} ${location.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(location.id);
            }}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {hasChildren &&
        isExpanded &&
        children?.results &&
        children.results.length > 0 && (
          <div className="pl-2">
            {children.results.map((child) => (
              <BaseLocationTreeNode
                key={child.id}
                location={child}
                selectedLocations={selectedLocations}
                onSelect={onSelect}
                expandedLocations={expandedLocations}
                onToggleExpand={onToggleExpand}
                level={level + 1}
                facilityId={facilityId}
                addLocationsToMap={addLocationsToMap}
                renderLocationInfo={(childLocation) => {
                  const ChildIcon =
                    LocationTypeIcons[
                      childLocation.form as keyof typeof LocationTypeIcons
                    ];
                  return (
                    <div className="flex items-center flex-1 text-sm gap-2 h-8 w-0">
                      <ChildIcon className="size-4 shrink-0 text-gray-600" />
                      <span className="truncate font-medium text-gray-900">
                        {childLocation.name}
                      </span>
                    </div>
                  );
                }}
                getPaddingLeft={getPaddingLeft}
                className={className}
              />
            ))}
          </div>
        )}
    </div>
  );
}

interface LocationTreeNodeProps {
  location: LocationRead;
  selectedLocations: LocationValue[];
  onSelect: (locationId: string) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
  addLocationsToMap: (locations: LocationRead[]) => void;
}

function LocationTreeNode({
  location,
  selectedLocations,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
  addLocationsToMap,
}: LocationTreeNodeProps) {
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons];

  const renderLocationInfo = (location: LocationRead) => (
    <div className="flex items-center flex-1 text-sm gap-2 h-8 w-0">
      <Icon className="size-4 shrink-0" />
      <span className="truncate font-medium">{location.name}</span>
    </div>
  );

  const getPaddingLeft = (level: number) => `${level}rem`;

  return (
    <BaseLocationTreeNode
      location={location}
      selectedLocations={selectedLocations}
      onSelect={onSelect}
      expandedLocations={expandedLocations}
      onToggleExpand={onToggleExpand}
      level={level}
      facilityId={facilityId}
      addLocationsToMap={addLocationsToMap}
      renderLocationInfo={renderLocationInfo}
      getPaddingLeft={getPaddingLeft}
    />
  );
}

interface SearchResultTreeNodeProps {
  location: LocationRead;
  selectedLocations: LocationValue[];
  onSelect: (locationId: string) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
  addLocationsToMap: (locations: LocationRead[]) => void;
  path: string[];
}

function SearchResultTreeNode({
  location,
  selectedLocations,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
  addLocationsToMap,
  path,
}: SearchResultTreeNodeProps) {
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons];

  const renderLocationInfo = (location: LocationRead) => (
    <div className="flex items-center flex-1 text-sm gap-2 min-w-0">
      <Icon className="size-4 shrink-0 text-gray-600" />
      <div className="flex flex-col min-w-0 justify-center flex-1 h-8 w-0">
        <span className="truncate font-medium text-gray-900">
          {location.name}
        </span>
        {level === 0 && path.length > 0 && (
          <span className="text-xs text-gray-500 truncate">
            {path.join(" > ")}
          </span>
        )}
      </div>
    </div>
  );

  const getPaddingLeft = (level: number) => `${level * 1.5}rem`;

  return (
    <BaseLocationTreeNode
      location={location}
      selectedLocations={selectedLocations}
      onSelect={onSelect}
      expandedLocations={expandedLocations}
      onToggleExpand={onToggleExpand}
      level={level}
      facilityId={facilityId}
      addLocationsToMap={addLocationsToMap}
      renderLocationInfo={renderLocationInfo}
      getPaddingLeft={getPaddingLeft}
    />
  );
}

interface LocationValue {
  id: string;
  name: string;
}

interface LocationMultiSelectProps<T extends LocationValue> {
  facilityId: string;
  value: T[];
  onChange: (value: (T | LocationRead)[]) => void;
}

function SelectedLocationPill({
  location,
  onRemove,
}: {
  location: LocationValue;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
      <span className="text-sm font-medium text-nowrap truncate max-w-[100px] sm:max-w-none">
        {location.name}
      </span>
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(location.id);
        }}
        className="size-5 rounded-full p-0"
        variant="ghost"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}

export default function LocationMultiSelect<T extends LocationValue>({
  facilityId,
  value,
  onChange,
}: LocationMultiSelectProps<T>) {
  const { t } = useTranslation();
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allFetchedLocations, setAllFetchedLocations] = useState<
    Map<string, LocationRead>
  >(new Map());

  // Query for top-level locations
  const { data: topLevelLocations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId, "top", "kind"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: "",
        mode: "kind",
      },
    }),
  });

  // Query for search results using backend search
  const { data: searchResultsData, isLoading: isSearching } = useQuery({
    queryKey: ["locations", facilityId, "search", searchQuery],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mode: "kind",
        name: searchQuery.trim() || undefined,
        all: true,
        limit: 100,
      },
    }),
    enabled: searchQuery.trim().length > 0,
  });

  // Update allFetchedLocations when new data comes in
  useEffect(() => {
    setAllFetchedLocations((prev) => {
      const newMap = new Map(prev);
      topLevelLocations?.results?.forEach((loc) => newMap.set(loc.id, loc));
      searchResultsData?.results?.forEach((loc) => newMap.set(loc.id, loc));
      return newMap;
    });
  }, [topLevelLocations?.results, searchResultsData?.results]);

  // Function to add locations to the global map (used by LocationTreeNode)
  const addLocationsToMap = useCallback((locations: LocationRead[]) => {
    setAllFetchedLocations((prev) => {
      const newMap = new Map(prev);
      locations.forEach((loc) => {
        newMap.set(loc.id, loc);
      });
      return newMap;
    });
  }, []);

  const searchLocations = searchResultsData?.results;
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !searchLocations) return [];

    const results: Array<{
      location: LocationRead;
      level: number;
      path: string[];
    }> = [];

    // Function to build path from root to a location
    const buildPath = (location: LocationRead): string[] => {
      const path: string[] = [];
      let currentParent = location.parent;

      // Traverse up the parent chain using the nested parent data from API
      while (currentParent?.name) {
        path.unshift(currentParent.name);
        currentParent = currentParent.parent;
      }

      return path;
    };

    searchLocations.forEach((location) => {
      const path = buildPath(location);
      results.push({ location, level: path.length, path });
    });

    return results;
  }, [searchQuery, searchLocations]);

  // Create a map of all available locations for quick lookup
  const locationsMap = useMemo(() => {
    const map = new Map<string, LocationRead>();

    // Add all fetched locations
    allFetchedLocations.forEach((loc) => {
      map.set(loc.id, loc);
    });

    return map;
  }, [allFetchedLocations]);

  const handleToggleExpand = (locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  const handleSelect = (locationId: string) => {
    const location = locationsMap.get(locationId);
    if (!location) return;

    const newValue = value.some((v) => v.id === locationId)
      ? value.filter((v) => v.id !== locationId)
      : [...value, location];
    onChange(newValue);
  };

  const handleRemove = (locationId: string) => {
    onChange(value.filter((v) => v.id !== locationId));
  };

  const renderContent = () => {
    if (isLoadingLocations) {
      return <FormSkeleton rows={4} />;
    }

    if (searchQuery.trim()) {
      if (isSearching) {
        return <FormSkeleton rows={4} />;
      }

      if (searchResults.length > 0) {
        return (
          <>
            {searchResults.map((result) => (
              <SearchResultTreeNode
                key={result.location.id}
                location={result.location}
                selectedLocations={value}
                onSelect={handleSelect}
                expandedLocations={expandedLocations}
                onToggleExpand={handleToggleExpand}
                level={0}
                facilityId={facilityId}
                addLocationsToMap={addLocationsToMap}
                path={result.path}
              />
            ))}
          </>
        );
      }

      return (
        <div className="p-4 text-sm text-gray-500 text-center">
          {t("no_locations_found")}
        </div>
      );
    }

    if (topLevelLocations?.results && topLevelLocations.results.length > 0) {
      return (
        <>
          {topLevelLocations.results.map((location) => (
            <LocationTreeNode
              key={location.id}
              location={location}
              selectedLocations={value}
              onSelect={handleSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={handleToggleExpand}
              facilityId={facilityId}
              addLocationsToMap={addLocationsToMap}
            />
          ))}
        </>
      );
    }

    return (
      <div className="p-4 text-sm text-gray-500">
        {t("no_locations_available")}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-clip">
      {value.length > 0 && (
        <div className="flex shrink-0 flex-nowrap gap-2 overflow-x-auto border-b p-1.5 sm:max-h-32 sm:flex-wrap">
          {value.map((location) => (
            <SelectedLocationPill
              key={location.id}
              location={location}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
      <div className="shrink-0 border-b border-gray-100 p-2 shadow-xs">
        <InputGroup className="border-input/30 bg-input/30 rounded-sm shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50">
          <InputGroupInput
            type="text"
            aria-label={t("search_locations")}
            placeholder={t("search_locations")}
            className="text-base sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search className="size-4 opacity-50" />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="min-h-0 flex-none overflow-y-auto overscroll-contain scrollbar-gutter-auto p-2 pb-4 h-[45dvh] md:h-[30dvh] in-data-[slot=drawer-content]:h-auto in-data-[slot=drawer-content]:flex-1">
        {renderContent()}
      </div>
    </div>
  );
}
