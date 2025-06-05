// TODO: This is a temporary fix to the location multi select.
// This doesn't account for nested locations.
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import query from "@/Utils/request/query";
import { LocationList, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationTreeNodeProps {
  location: LocationList;
  selectedLocationIds: string[];
  onSelect: (locationId: string) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
  searchQuery: string;
}

function LocationTreeNode({
  location,
  selectedLocationIds,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
  searchQuery,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = selectedLocationIds.includes(location.id);
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
      },
    }),

    staleTime: 5 * 60 * 1000,
  });

  const hasChildren = children?.results && children.results.length > 0;

  // Filter children based on search query
  const filteredChildren = children?.results?.filter((child) =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Check if this location or any of its children match the search query
  const locationMatches = location.name
    .toLowerCase()
    .includes(searchQuery.toLowerCase());
  const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

  // If there's a search query and neither this location nor its children match, don't render
  if (searchQuery && !locationMatches && !hasMatchingChildren) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "group flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer",
        )}
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
        <div className="flex items-center flex-1 text-sm gap-2 w-0">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{location.name}</span>
        </div>
        {!isSelected && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-8 w-8 shrink-0 rounded-lg border shadow-sm hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(location.id);
            }}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>
      {isExpanded && filteredChildren && filteredChildren.length > 0 && (
        <div className="pl-2">
          {filteredChildren.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              selectedLocationIds={selectedLocationIds}
              onSelect={onSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={onToggleExpand}
              level={level}
              facilityId={facilityId}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationMultiSelectProps {
  facilityId: string;
  value: string[];
  onChange: (value: string[]) => void;
}

function SelectedLocationPill({
  locationId,
  locations,
  onRemove,
}: {
  locationId: string;
  locations?: LocationList[];
  onRemove: (id: string) => void;
}) {
  const location = locations?.find((loc) => loc.id === locationId);

  if (!locations) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(locationId);
          }}
          className="h-5 w-5 rounded-full p-0"
          variant="ghost"
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
      <span className="text-sm font-medium">
        {location?.name || locationId}
      </span>
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(locationId);
        }}
        className="h-5 w-5 rounded-full p-0"
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

  // Query for all locations (needed for selected location details)
  const { data: allLocations } = useQuery({
    queryKey: ["locations", facilityId, "all", "kind"],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mode: "kind",
        all: true,
      },
      pageSize: 1000,
    }),
  });

  // Create a map of all locations for quick lookup
  const locationsMap = useMemo(() => {
    const map = new Map<string, LocationList>();
    allLocations?.results?.forEach((loc) => {
      map.set(loc.id, loc);
    });
    return map;
  }, [allLocations?.results]);

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
    onChange(
      value.includes(locationId)
        ? value.filter((id) => id !== locationId)
        : [...value, locationId],
    );
  };

  const handleRemove = (locationId: string) => {
    onChange(value.filter((id) => id !== locationId));
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {value.length > 0 && (
        <>
          <ScrollArea className="max-h-[calc(20vh-2rem)]">
            <div className="flex flex-wrap gap-2 px-3">
              {value.map((locationId) => (
                <SelectedLocationPill
                  key={locationId}
                  locationId={locationId}
                  locations={Array.from(locationsMap.values())}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </ScrollArea>
          <div className="lex flex-col border-b py-1" />
        </>
      )}
      <div className="relative w-full px-3 pt-1">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 size-4" />
        <input
          type="text"
          placeholder={t("search_locations")}
          className="w-full rounded-md border border-input bg-background pl-8 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollArea className="max-h-[calc(80vh-10rem)]">
        <div className="p-2">
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
          ) : topLevelLocations?.results &&
            topLevelLocations.results.length > 0 ? (
            <>
              {topLevelLocations.results.map((location) => (
                <LocationTreeNode
                  key={location.id}
                  location={location}
                  selectedLocationIds={value}
                  onSelect={handleSelect}
                  expandedLocations={expandedLocations}
                  onToggleExpand={handleToggleExpand}
                  facilityId={facilityId}
                  searchQuery={searchQuery}
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
