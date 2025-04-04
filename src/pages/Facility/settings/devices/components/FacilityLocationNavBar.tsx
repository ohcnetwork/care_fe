import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

function buildLocationHierarchy(locations: LocationList[]) {
  const childrenMap = new Map<string, LocationList[]>();
  const topLevelLocations: LocationList[] = [];

  locations.forEach((location) => {
    if (!location.parent || Object.keys(location.parent).length === 0) {
      topLevelLocations.push(location);
    } else {
      const parentId = location.parent.id;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)?.push(location);
    }
  });

  return { childrenMap, topLevelLocations };
}

interface LocationTreeNodeProps {
  location: LocationList;
  selectedLocationId: string | null;
  onSelect: (location: LocationList) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
  searchQuery?: string;
  mode?: string;
  childrenMap: Map<string, LocationList[]>;
  allLocations: LocationList[];
}

function LocationTreeNode({
  location,
  selectedLocationId,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
  searchQuery,
  mode,
  childrenMap,
  allLocations,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = location.id === selectedLocationId;

  const children = useMemo(
    () => childrenMap.get(location.id) || [],
    [childrenMap, location.id],
  );

  const filteredChildren = useMemo(() => {
    if (!searchQuery) return children;

    const matchesSearch = (name: string) =>
      name.toLowerCase().includes(searchQuery.toLowerCase());

    return children.filter(
      (child) =>
        matchesSearch(child.name) ||
        hasMatchingDescendant(child.id, allLocations, matchesSearch),
    );
  }, [children, searchQuery, allLocations]);

  const hasChildren = childrenMap.has(location.id);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100",
          isSelected && "bg-blue-100 text-blue-800",
        )}
        style={{ paddingLeft: `${level}rem` }}
      >
        {hasChildren ? ( // Changed from location.has_children to hierarchy-based check
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(location.id);
            }}
          >
            {/* Add back the icon content */}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <span className="w-6" />
        )}
        <div
          onClick={() => onSelect(location)}
          className="flex items-center flex-1 text-sm gap-2 cursor-pointer"
        >
          <span className="truncate">{location.name}</span>
        </div>
      </div>
      {isExpanded && filteredChildren.length > 0 && (
        <div>
          {filteredChildren.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              selectedLocationId={selectedLocationId}
              onSelect={onSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              facilityId={facilityId}
              searchQuery={searchQuery}
              mode={mode}
              childrenMap={childrenMap}
              allLocations={allLocations}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FacilityLocationNavBarProps {
  facilityId: string;
  selectedLocationId: string | null;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  onLocationSelect: (location: LocationList) => void;
  searchQuery?: string;
  mode?: string;
}

export default function FacilityLocationNavBar({
  facilityId,
  selectedLocationId,
  expandedLocations,
  onToggleExpand,
  onLocationSelect,
  searchQuery,
  mode,
}: FacilityLocationNavBarProps) {
  const { t } = useTranslation();

  const { data: locations, isLoading } = useQuery<{
    results: LocationList[];
  }>({
    queryKey: ["locations", facilityId, mode, searchQuery],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {},
    }),
    refetchOnWindowFocus: false,
    // Removed the select function to match the expected return type
  });

  const { childrenMap, topLevelLocations } = useMemo(
    () => buildLocationHierarchy(locations?.results || []),
    [locations?.results],
  );

  const filteredTopLevel = useMemo(() => {
    if (!searchQuery) return topLevelLocations;

    const matchesSearch = (name: string) =>
      name.toLowerCase().includes(searchQuery.toLowerCase());

    return topLevelLocations.filter(
      (loc) =>
        matchesSearch(loc.name) ||
        hasMatchingDescendant(loc.id, locations?.results || [], matchesSearch),
    );
  }, [topLevelLocations, searchQuery, locations]);

  return (
    <div className="w-64 shadow-lg bg-white rounded-lg min-h-[calc(100vh-10rem)] pt-2">
      <div className="p-4">
        <h2 className="text-lg font-semibold">{t("locations")}</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-14rem)]">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            filteredTopLevel?.map((location: LocationList) => (
              <LocationTreeNode
                key={location.id}
                location={location}
                selectedLocationId={selectedLocationId}
                onSelect={onLocationSelect}
                expandedLocations={expandedLocations}
                onToggleExpand={onToggleExpand}
                facilityId={facilityId}
                searchQuery={searchQuery}
                mode={mode}
                childrenMap={childrenMap}
                allLocations={locations?.results || []}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function hasMatchingDescendant(
  parentId: string,
  allLocations: LocationList[],
  matches: (name: string) => boolean,
): boolean {
  const children = allLocations.filter((loc) => loc.parent?.id === parentId);
  return children.some(
    (child) =>
      matches(child.name) ||
      hasMatchingDescendant(child.id, allLocations, matches),
  );
}
