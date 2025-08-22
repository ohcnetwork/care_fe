// TODO: This is a temporary fix to the location multi select.
// This doesn't account for nested locations.
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import query from "@/Utils/request/query";
import { LocationList, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationTreeNodeProps {
  location: LocationList;
  selectedLocations: LocationValue[];
  onSelect: (locationId: string) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
  searchQuery: string;
  addLocationsToMap: (locations: LocationList[]) => void;
}

function LocationTreeNode({
  location,
  selectedLocations,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
  searchQuery,
  addLocationsToMap,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = selectedLocations.some((loc) => loc.id === location.id);
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons];

  // Only fetch children when expanded
  const { data: children, isLoading } = useQuery({
    queryKey: ["locations", facilityId, "children", location.id, "kind"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location.id,
        mode: "kind",
        ordering: "sort_index",
        limit: 100,
      },
    }),

    staleTime: 5 * 60 * 1000,
  });

  // Add children to the global map when they are fetched
  useMemo(() => {
    if (children?.results) {
      addLocationsToMap(children.results);
    }
  }, [children?.results, addLocationsToMap]);

  const hasChildren = children?.results && children.results.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={cn("group flex items-center py-1 px-2 rounded-md")}
        style={{ paddingLeft: `${level}rem` }}
      >
        {isLoading ? (
          <Button variant="ghost" size="icon" className="size-6">
            <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </Button>
        ) : hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
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
          <span className="w-6" />
        )}
        <div className="flex items-center flex-1 text-sm gap-2 h-8 w-0">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{location.name}</span>
        </div>
        {!isSelected && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 size-8 shrink-0 rounded-lg border shadow-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(location.id);
            }}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>
      {isExpanded && children?.results && children.results.length > 0 && (
        <div className="pl-2">
          {children.results.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              selectedLocations={selectedLocations}
              onSelect={onSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={onToggleExpand}
              level={level}
              facilityId={facilityId}
              searchQuery={searchQuery}
              addLocationsToMap={addLocationsToMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationValue {
  id: string;
  name: string;
}

interface LocationMultiSelectProps {
  facilityId: string;
  value: LocationValue[];
  onChange: (value: LocationValue[]) => void;
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
      <span className="text-sm font-medium">{location.name}</span>
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

export default function LocationMultiSelect({
  facilityId,
  value,
  onChange,
}: LocationMultiSelectProps) {
  const { t } = useTranslation();
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allFetchedLocations, setAllFetchedLocations] = useState<
    Map<string, LocationList>
  >(new Map());

  // Query for top-level locations
  const { data: topLevelLocations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId, "top", "kind"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: "",
        mode: "kind",
        ordering: "sort_index",
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
  useMemo(() => {
    const newMap = new Map(allFetchedLocations);

    topLevelLocations?.results?.forEach((loc) => {
      newMap.set(loc.id, loc);
    });

    searchResultsData?.results?.forEach((loc) => {
      newMap.set(loc.id, loc);
    });

    setAllFetchedLocations(newMap);
  }, [topLevelLocations?.results, searchResultsData?.results]);

  // Function to add locations to the global map (used by LocationTreeNode)
  const addLocationsToMap = useCallback((locations: LocationList[]) => {
    setAllFetchedLocations((prev) => {
      const newMap = new Map(prev);
      locations.forEach((loc) => {
        newMap.set(loc.id, loc);
      });
      return newMap;
    });
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !searchResultsData?.results) return [];

    const results: Array<{
      location: LocationList;
      level: number;
      path: string[];
    }> = [];

    // Function to build path from root to a location
    const buildPath = (locationId: string): string[] => {
      const path: string[] = [];
      let currentLocation = allFetchedLocations.get(locationId);

      // Traverse up the parent chain to build the path
      while (currentLocation?.parent?.id) {
        const parentLocation = allFetchedLocations.get(
          currentLocation.parent.id,
        );
        if (parentLocation) {
          path.unshift(parentLocation.name);
          currentLocation = parentLocation;
        } else {
          break;
        }
      }

      return path;
    };

    searchResultsData.results.forEach((location) => {
      const path = buildPath(location.id);
      results.push({ location, level: path.length, path });
    });

    return results;
  }, [searchQuery, searchResultsData?.results, allFetchedLocations]);

  // Create a map of all available locations for quick lookup
  const locationsMap = useMemo(() => {
    const map = new Map<string, LocationList>();

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
      : [...value, { id: location.id, name: location.name }];
    onChange(newValue);
  };

  const handleRemove = (locationId: string) => {
    onChange(value.filter((v) => v.id !== locationId));
  };

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      {value.length > 0 && (
        <>
          <ScrollArea className="max-h-32">
            <div className="flex flex-wrap gap-2 px-3">
              {value.map((location) => (
                <SelectedLocationPill
                  key={location.id}
                  location={location}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="flex flex-col border-b py-1" />
        </>
      )}
      <div className="relative w-full px-3 pt-1">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 size-4" />
        <Input
          type="text"
          placeholder={t("search_locations")}
          className="w-full rounded-md bg-background pl-8 py-2 text-sm focus-visible:ring-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 pb-4">
          {isLoadingLocations ? (
            <div className="p-4">
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-full animate-pulse rounded-md bg-gray-200"
                  />
                ))}
              </div>
            </div>
          ) : searchQuery.trim() && searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((result) => {
                const Icon =
                  LocationTypeIcons[
                    result.location.form as keyof typeof LocationTypeIcons
                  ];
                return (
                  <div
                    key={result.location.id}
                    className="flex items-center py-1 rounded-md hover:bg-gray-50"
                  >
                    <span className="w-3" />
                    <div className="flex items-center flex-1 text-sm gap-2">
                      <Icon className="size-5 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">
                          {result.location.name}
                        </span>
                        {result.path.length > 0 && (
                          <span className="text-xs text-gray-500 truncate">
                            {result.path.join(" > ")}
                          </span>
                        )}
                      </div>
                    </div>
                    {!value.some((v) => v.id === result.location.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2 size-8 shrink-0 rounded-lg border shadow-sm hover:bg-background"
                        onClick={() => handleSelect(result.location.id)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : searchQuery.trim() && isSearching ? (
            <div className="p-4">
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-full animate-pulse rounded-md bg-gray-200"
                  />
                ))}
              </div>
            </div>
          ) : searchQuery.trim() && searchResults.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              {t("no_locations_found")}
            </div>
          ) : topLevelLocations?.results &&
            topLevelLocations.results.length > 0 ? (
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
                  searchQuery={searchQuery}
                  addLocationsToMap={addLocationsToMap}
                />
              ))}
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500">
              {t("no_locations_available")}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
