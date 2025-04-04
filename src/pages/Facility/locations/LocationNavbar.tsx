import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { LocationList, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationTreeNodeProps {
  location: LocationList;
  selectedLocationId: string | null;
  onSelect: (location: LocationList) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
}

export function LocationTreeNode({
  location,
  selectedLocationId,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = location.id === selectedLocationId;
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons];

  // Query for this node's children
  const { data: children, isLoading } = useQuery({
    queryKey: ["locations", facilityId, "children", location.id, "kind"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location.id,
        mode: "kind",
      },
    }),
    enabled: true,
  });

  const hasChildren = children?.results && children.results.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100",
          isSelected && "bg-blue-100 text-blue-800",
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
        <div
          className="flex items-center flex-1 text-sm gap-2 w-0"
          onClick={() => onSelect(location)}
        >
          <Icon className="size-4" />
          <span className="truncate">{location.name}</span>
        </div>
      </div>
      {isExpanded && children?.results && children.results.length > 0 && (
        <div className="pl-2">
          {children.results.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              selectedLocationId={selectedLocationId}
              onSelect={onSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              facilityId={facilityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationNavbarProps {
  facilityId: string;
  selectedLocationId: string | null;
  expandedLocations: Set<string>;
  onLocationSelect: (location: LocationList) => void;
  onToggleExpand: (locationId: string) => void;
}

export default function LocationNavbar({
  facilityId,
  selectedLocationId,
  expandedLocations,
  onLocationSelect,
  onToggleExpand,
}: LocationNavbarProps) {
  const { t } = useTranslation();

  const { data: allLocations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId, "mine", "kind"],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mine: true,
        mode: "kind",
      },
      pageSize: 100,
    }),
  });

  const topLevelLocations = allLocations?.results || [];

  if (topLevelLocations.length === 0) {
    return null;
  }

  return (
    <div className="w-64 shadow-lg bg-white rounded-lg hidden md:block">
      <div className="p-4">
        <h2 className="text-lg font-semibold">{t("locations")}</h2>
      </div>
      <ScrollArea>
        <div className="p-2">
          {isLoadingLocations ? (
            <div className="p-4">
              <CardGridSkeleton count={3} />
            </div>
          ) : (
            topLevelLocations.map((location) => (
              <LocationTreeNode
                key={location.id}
                location={location}
                selectedLocationId={selectedLocationId}
                onSelect={onLocationSelect}
                expandedLocations={expandedLocations}
                onToggleExpand={onToggleExpand}
                facilityId={facilityId}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
