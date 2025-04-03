import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import query from "@/Utils/request/query";
import {
  LocationForm,
  LocationList as LocationListType,
  LocationTypeIcons,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationTreeNodeProps {
  location: LocationListType;
  level?: number;
  facilityId: string;
  selectedLocationId: string | null;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  onLocationSelect: (location: LocationListType) => void;
}

export function LocationTreeNode({
  location,
  level = 0,
  facilityId,
  selectedLocationId,
  expandedLocations,
  onToggleExpand,
  onLocationSelect,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = location.id === selectedLocationId;
  const LocationTypeIcon = location.form
    ? LocationTypeIcons[location.form as LocationForm]
    : null;

  const { data: nodeChildren, isLoading } = useQuery({
    queryKey: ["locations", facilityId, "children", location.id, "kind"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location.id,
        mode: "kind",
      },
    }),
    enabled: isExpanded || location.has_children,
  });

  const hasChildren =
    location.has_children || (nodeChildren?.results?.length ?? 0) > 0;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100",
          isSelected && "bg-blue-100 text-blue-800",
        )}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-4"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(location.id);
            }}
          >
            {isLoading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : isExpanded ? (
              <CareIcon icon="l-angle-down" className="size-4" />
            ) : (
              <CareIcon icon="l-angle-right" className="size-4" />
            )}
          </Button>
        ) : (
          <span className="w-2" />
        )}
        <div
          className="flex items-center flex-1 text-sm gap-2 w-0"
          onClick={() => onLocationSelect(location)}
        >
          {LocationTypeIcon && <LocationTypeIcon className="size-4 shrink-0" />}
          <span className="truncate">{location.name}</span>
        </div>
      </div>
      {isExpanded &&
        nodeChildren?.results &&
        nodeChildren.results.length > 0 && (
          <div className="pl-2">
            {nodeChildren.results.map((child) => (
              <LocationTreeNode
                key={child.id}
                location={child}
                level={level + 1}
                facilityId={facilityId}
                selectedLocationId={selectedLocationId}
                expandedLocations={expandedLocations}
                onToggleExpand={onToggleExpand}
                onLocationSelect={onLocationSelect}
              />
            ))}
          </div>
        )}
    </div>
  );
}
