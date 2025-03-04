import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bed,
  Building2,
  ChevronDown,
  ChevronRight,
  Home,
  Hotel,
  LandPlot,
  Layers,
  LayoutGrid,
  MapPin,
  Route,
  Split,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";

import query from "@/Utils/request/query";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

// Types
type LocationFormType = keyof typeof LocationIcon;

interface LocationState {
  selectedLocationId: string | null;
  selectedLocation: LocationListType | null;
  expandedLocations: Set<string>;
  searchQuery: string;
}

// Constants
const LocationIcon = {
  si: Building2, // Site
  bu: Hotel, // Building
  wi: Split, // Wing
  wa: Users, // Ward
  lvl: Layers, // Level
  co: Store, // Counter
  ro: LayoutGrid, // Room
  bd: Bed, // Bed
  ve: Truck, // Vehicle
  ho: Home, // Home
  ca: Home, // Cabin
  rd: Route, // Road
  area: LandPlot, // Area
  jdn: MapPin, // Junction
  vi: Building2, // Village
} as const;

const QUERY_LIMIT = 100;

// Utility functions
function getLocationIcon(
  form: LocationFormType,
): (typeof LocationIcon)[LocationFormType] {
  return LocationIcon[form] || Building2;
}

function getParentChain(location: LocationListType): Set<string> {
  const parentIds = new Set<string>();
  let current = location.parent;

  while (current) {
    parentIds.add(current.id);
    current = current.parent;
  }

  return parentIds;
}

// Hook for location data management
function useLocationState(): LocationState & {
  handleLocationSelect: (location: LocationListType) => void;
  handleToggleExpand: (locationId: string) => void;
  handleSearchChange: (value: string) => void;
  handleLocationData: (location: LocationListType | undefined) => void;
} {
  const [state, setState] = useState<LocationState>({
    selectedLocationId: null,
    selectedLocation: null,
    expandedLocations: new Set(),
    searchQuery: "",
  });

  const handleLocationSelect = useCallback((location: LocationListType) => {
    if (!location.id) {
      setState((prev) => ({
        ...prev,
        selectedLocationId: null,
        selectedLocation: null,
        searchQuery: "",
      }));
      return;
    }

    const parentIds = getParentChain(location);
    setState((prev) => ({
      ...prev,
      selectedLocationId: location.id,
      selectedLocation: location,
      searchQuery: "",
      expandedLocations: new Set([...prev.expandedLocations, ...parentIds]),
    }));
  }, []);

  const handleToggleExpand = useCallback((locationId: string) => {
    setState((prev) => {
      const next = new Set(prev.expandedLocations);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return { ...prev, expandedLocations: next };
    });
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleLocationData = useCallback(
    (location: LocationListType | undefined) => {
      if (!location) return;

      setState((prev) => {
        if (
          !prev.selectedLocation ||
          location.id === prev.selectedLocationId ||
          prev.selectedLocation.id === location.id
        ) {
          return prev;
        }
        return {
          ...prev,
          selectedLocation: {
            ...prev.selectedLocation,
            parent: location,
          },
        };
      });
    },
    [],
  );

  return {
    ...state,
    handleLocationSelect,
    handleToggleExpand,
    handleSearchChange,
    handleLocationData,
  };
}

interface LocationTreeProps {
  location: LocationListType;
  selectedLocationId: string | null;
  onSelect: (location: LocationListType) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
}

function LocationTreeNode({
  location,
  selectedLocationId,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
}: LocationTreeProps) {
  const hasChildren = location.has_children;
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = location.id === selectedLocationId;
  const Icon = getLocationIcon(location.form as keyof typeof LocationIcon);
  const nodeRef = React.useRef<HTMLDivElement>(null);

  // Scroll into view when selected
  React.useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  // Query for this node's children
  const { data: children, isLoading } = useQuery({
    queryKey: ["locations", facilityId, "children", location.id],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location.id,
        limit: 100,
        mode: "kind",
      },
    }),
    enabled: isExpanded && hasChildren,
  });

  return (
    <div className="space-y-1">
      <div
        ref={nodeRef}
        className={`flex items-center py-1 px-2 rounded-md cursor-pointer ${
          isSelected ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${level * 1}rem` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(location.id);
            }}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <span className="w-6" />
        )}
        <div
          className="flex items-center flex-1 text-sm gap-2"
          onClick={() => onSelect(location)}
        >
          <Icon className="h-4 w-4" />
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

interface ChildLocationCardProps {
  location: LocationListType;
  onClick: () => void;
  facilityId: string;
}

interface BedCardProps extends Omit<ChildLocationCardProps, "onClick"> {
  onClick?: () => void;
}

function BedCard({ location, facilityId }: BedCardProps) {
  const { t } = useTranslation();
  const isOccupied = !!location.current_encounter;

  return (
    <div
      className={`border rounded-lg overflow-hidden shadow-sm h-fit ${
        isOccupied ? "bg-white border-gray-200" : "bg-green-50 border-green-200"
      }`}
    >
      <div
        className={`px-4 py-3 flex justify-between items-center ${
          isOccupied
            ? "bg-blue-50 border-b border-blue-100"
            : "bg-green-100 border-b border-green-200"
        }`}
      >
        <div className="flex items-center">
          <Bed
            className={`h-4 w-4 mr-2 ${isOccupied ? "text-blue-600" : "text-green-600"}`}
          />
          <span className="font-medium">{location.name}</span>
        </div>
        <div
          className={`text-xs px-2 py-1 rounded-full ${
            isOccupied
              ? "bg-blue-100 text-blue-800"
              : "bg-green-200 text-green-800"
          }`}
        >
          {isOccupied ? t("occupied") : t("available")}
        </div>
      </div>

      <div>
        {!location.current_encounter ? (
          <div className="flex flex-col items-center justify-center py-4 h-auto">
            <p className="text-sm text-gray-600 mb-3">
              {t("ready_for_admission")}
            </p>
          </div>
        ) : (
          <EncounterInfoCard
            encounter={location.current_encounter}
            facilityId={facilityId}
            hideBorder={true}
          />
        )}
      </div>
    </div>
  );
}

function LocationCard({ location, onClick }: ChildLocationCardProps) {
  const { t } = useTranslation();
  const Icon = getLocationIcon(location.form as keyof typeof LocationIcon);

  return (
    <div
      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Icon className="h-4 w-4 mr-2 text-gray-600" />
          <span className="font-medium">{location.name}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {location.description || t("no_description")}
        </p>

        <div className="flex justify-between text-sm">
          <div className="flex items-center">
            <span className="capitalize text-gray-600">
              {t(`location_form__${location.form}`)}
            </span>
          </div>

          <div className="flex items-center">
            <span
              className={`capitalize ${
                location.availability_status === "available"
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              {location.availability_status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChildLocationCard(props: ChildLocationCardProps) {
  const isBed = props.location.form === "bd";
  return isBed ? (
    <BedCard {...props} onClick={undefined} />
  ) : (
    <LocationCard {...props} />
  );
}

function SelectedLocationChildren({
  facilityId,
  selectedLocationId,
  onSelect,
  searchQuery,
  onLocationData,
}: {
  facilityId: string;
  selectedLocationId: string;
  onSelect: (location: LocationListType) => void;
  searchQuery: string;
  onLocationData: (location: LocationListType | undefined) => void;
}) {
  const { t } = useTranslation();
  const { data: children, isLoading } = useQuery({
    queryKey: ["locations", facilityId, "children", selectedLocationId, "full"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: selectedLocationId,
        limit: 100,
      },
    }),
    enabled: !!selectedLocationId,
  });

  // Update parent location data when children are loaded
  React.useEffect(() => {
    const firstChild = children?.results?.[0];
    if (firstChild?.parent) {
      onLocationData(firstChild.parent);
    }
  }, [children?.results, onLocationData]);

  // Filter children based on search query
  const filteredChildren = React.useMemo(() => {
    if (!searchQuery || !children?.results) return children?.results || [];
    const searchLower = searchQuery.toLowerCase();
    return children.results.filter((loc) =>
      loc.name.toLowerCase().includes(searchLower),
    );
  }, [children?.results, searchQuery]);

  if (isLoading) {
    return <CardGridSkeleton count={6} />;
  }

  if (!children?.results?.length) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center text-gray-500">
          {t("no_child_locations")}
        </CardContent>
      </Card>
    );
  }

  if (searchQuery && filteredChildren.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6 text-center text-gray-500">
          {t("no_locations_found")}
        </CardContent>
      </Card>
    );
  }

  return filteredChildren.map((child) => (
    <ChildLocationCard
      key={child.id}
      location={child}
      onClick={() => onSelect(child)}
      facilityId={facilityId}
    />
  ));
}

function Breadcrumbs({
  location,
  onSelect,
  t,
}: {
  location: LocationListType;
  onSelect: (location: LocationListType) => void;
  t: (key: string) => string;
}) {
  const items = [];
  let current: LocationListType | undefined = location;

  while (current) {
    items.unshift(current);
    current = current.parent;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              <BreadcrumbLink
                className={`hover:text-primary cursor-pointer ${
                  index === items.length - 1 ? "font-medium text-primary" : ""
                }`}
                onClick={() =>
                  onSelect(
                    index === 0
                      ? ({ id: "", name: "" } as LocationListType)
                      : item,
                  )
                }
              >
                {index === 0 ? t("locations") : item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function LocationSummary({ locations }: { locations: LocationListType[] }) {
  const { t } = useTranslation();

  const summary = React.useMemo(() => {
    const beds = locations.filter((loc) => loc.form === "bd");
    const nonBeds = locations.filter((loc) => loc.form !== "bd");
    const availableBeds = beds.filter((bed) => !bed.current_encounter);

    return {
      totalLocations: locations.length,
      hasNonBeds: nonBeds.length > 0,
      totalBeds: beds.length,
      availableBeds: availableBeds.length,
      occupiedBeds: beds.length - availableBeds.length,
    };
  }, [locations]);

  if (!locations.length) return null;

  return (
    <div className="flex gap-4 flex-wrap">
      {summary.hasNonBeds && (
        <Badge
          variant="secondary"
          className="flex items-center gap-2 px-2 font-medium"
        >
          <span>{t("total_locations")}</span>
          <span>{summary.totalLocations}</span>
        </Badge>
      )}
      {summary.totalBeds > 0 && (
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-2 px-2 font-medium">
            <span>{t("available_beds")}</span>
            <span>{summary.availableBeds}</span>
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-2 px-2 font-medium">
            <span>{t("occupied_beds")}</span>
            <span>{summary.occupiedBeds}</span>
          </Badge>
        </div>
      )}
    </div>
  );
}

export default function LocationList({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const {
    selectedLocationId,
    selectedLocation,
    expandedLocations,
    searchQuery,
    handleLocationSelect,
    handleToggleExpand,
    handleSearchChange,
    handleLocationData,
  } = useLocationState();

  const { data: allLocations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId, "all"],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mine: true,
        page_size: QUERY_LIMIT,
      },
    }),
  });

  const { data: selectedChildren } = useQuery({
    queryKey: ["locations", facilityId, "children", selectedLocationId, "full"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: selectedLocationId,
        limit: 100,
      },
    }),
    enabled: !!selectedLocationId,
  });

  const topLevelLocations = useMemo(() => {
    if (!allLocations?.results) return [];
    return allLocations.results.filter(
      (loc) => !loc.parent || Object.keys(loc.parent).length === 0,
    );
  }, [allLocations?.results]);

  return (
    <div className="flex px-4 space-x-4 h-[calc(100vh-4rem)]">
      {/* Left sidebar - Location tree */}
      {topLevelLocations.length > 0 && (
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
                    onSelect={handleLocationSelect}
                    expandedLocations={expandedLocations}
                    onToggleExpand={handleToggleExpand}
                    facilityId={facilityId}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 p-6 space-y-4 rounded-lg bg-white shadow-lg">
        <div className="flex flex-col gap-4">
          {selectedLocation && (
            <Breadcrumbs
              location={selectedLocation}
              onSelect={handleLocationSelect}
              t={t}
            />
          )}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <h2 className="text-lg font-semibold whitespace-nowrap">
                {selectedLocation ? selectedLocation.name : t("locations")}
              </h2>
              {selectedLocationId ? (
                selectedChildren?.results && (
                  <LocationSummary locations={selectedChildren.results} />
                )
              ) : (
                <LocationSummary locations={topLevelLocations} />
              )}
            </div>
            <div className="w-full sm:w-72 shrink-0">
              <Input
                placeholder={t("search_by_name")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
                disabled={!selectedLocationId}
              />
            </div>
          </div>
        </div>

        {selectedLocationId ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectedLocationChildren
                  facilityId={facilityId}
                  selectedLocationId={selectedLocationId}
                  onSelect={handleLocationSelect}
                  searchQuery={searchQuery}
                  onLocationData={handleLocationData}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {topLevelLocations.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {t("no_locations")}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topLevelLocations.map((location) => (
                  <ChildLocationCard
                    key={location.id}
                    location={location}
                    onClick={() => handleLocationSelect(location)}
                    facilityId={facilityId}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
