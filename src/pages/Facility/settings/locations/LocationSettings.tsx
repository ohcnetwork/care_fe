import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationMap from "./LocationMap";
import LocationSheet from "./LocationSheet";
import LocationView from "./LocationView";
import { LocationCard } from "./components/LocationCard";
import { LocationTreeNode } from "./components/LocationTreeNode";

interface LocationSettingsProps {
  facilityId: string;
  locationId?: string;
}

// Helper function to get parent chain for a location
function getParentChain(location: LocationListType): Set<string> {
  const parentIds = new Set<string>();
  let current = location.parent;

  while (current) {
    parentIds.add(current.id);
    current = current.parent;
  }

  return parentIds;
}

export default function LocationSettings({
  facilityId,
  locationId,
}: LocationSettingsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // State for view mode (list or map)
  const [activeTab, setActiveTab] = useView("locations", "list");

  // State for location navigation
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    locationId || null,
  );
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );

  // State for location content
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<LocationListType | null>(
    null,
  );

  const ITEMS_PER_PAGE = 9;

  // Fetch facility data for the facility name
  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.facility.show, {
      pathParams: { id: facilityId },
    }),
  });

  // Fetch all locations for the navigation tree
  const { data: allLocations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId, "all"],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        // Removed mode filter to include both "kind" and "instance" (beds)
      },
      pageSize: 100,
    }),
  });

  // Fetch details of the selected location
  const { data: selectedLocation } = useQuery({
    queryKey: ["location", facilityId, selectedLocationId],
    queryFn: query(locationApi.get, {
      pathParams: {
        facility_id: facilityId,
        id: selectedLocationId as string,
      },
    }),
    enabled: !!selectedLocationId,
  });

  // Fetch organizations linked to the selected location
  const { data: _locationOrgs } = useQuery({
    queryKey: ["location", selectedLocationId, "organizations"],
    queryFn: query(locationApi.getOrganizations, {
      pathParams: { facility_id: facilityId, id: selectedLocationId as string },
    }),
    enabled: !!selectedLocationId,
  });

  // Fetch child locations of the selected location
  const { data: childLocations, isLoading: isLoadingChildren } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      "children",
      selectedLocationId,
      currentPage,
      searchQuery,
    ],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: selectedLocationId || undefined,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        name: searchQuery || undefined,
      },
    }),
    enabled: true,
  });

  // Fetch parent locations for breadcrumb if selectedLocation is a LocationDetail
  const { data: _parentLocations = [] } = useQuery({
    queryKey: ["locations", facilityId, "breadcrumbs", selectedLocationId],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        // Removed mode filter to include both "kind" and "instance" (beds)
      },
      pageSize: 1000,
    }),
    enabled: !!selectedLocationId && !!selectedLocation,
    select: (data: { results: LocationListType[] }) => {
      if (!selectedLocation) return [];

      // Build breadcrumb chain manually from all locations
      const allLocations = data.results || [];
      const breadcrumbChain: { id: string; name: string }[] = [];
      breadcrumbChain.push({
        id: selectedLocation.id,
        name: selectedLocation.name,
      });

      // Look for parent relationships in all locations
      const locationMap = new Map<string, LocationListType>();
      allLocations.forEach((loc: LocationListType) => {
        locationMap.set(loc.id, loc);
      });

      // Find parent chain
      let currentLocation = allLocations.find(
        (loc: LocationListType) => loc.id === selectedLocationId && loc.parent,
      );

      while (currentLocation?.parent) {
        const parentLocation = locationMap.get(currentLocation.parent.id);
        if (parentLocation) {
          breadcrumbChain.unshift({
            id: parentLocation.id,
            name: parentLocation.name,
          });
          currentLocation = parentLocation;
        } else {
          break;
        }
      }

      return breadcrumbChain;
    },
  });

  // Commenting out unused breadcrumbs - we'll keep parentLocations for possible future use
  // const _breadcrumbs = useMemo(() => {
  //   return parentLocations;
  // }, [parentLocations]);

  // Handle location selection
  const handleLocationSelect = useCallback(
    (location: LocationListType) => {
      setSelectedLocationId(location.id);
      setSearchQuery("");
      setCurrentPage(1);

      // Expand the parent chain
      const parentIds = getParentChain(location);
      parentIds.add(location.id);
      setExpandedLocations(new Set([...expandedLocations, ...parentIds]));
    },
    [expandedLocations],
  );

  // Toggle expanded state of a location in the navigation
  const handleToggleExpand = useCallback((locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  // Handle page change for child locations pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle adding a new location
  const handleAddLocation = useCallback(() => {
    setLocationToEdit(null);
    setIsSheetOpen(true);
  }, []);

  // Handle editing a location
  const handleEditLocation = useCallback((location: LocationListType) => {
    setLocationToEdit(location);
    setIsSheetOpen(true);
  }, []);

  // Handle closing the location form sheet
  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
    setLocationToEdit(null);
    queryClient.invalidateQueries({ queryKey: ["locations", facilityId] });
    if (selectedLocationId) {
      queryClient.invalidateQueries({
        queryKey: ["location", facilityId, selectedLocationId],
      });
    }
  }, [facilityId, queryClient, selectedLocationId]);

  return (
    <Page title={t("locations")} hideTitleOnPage className="p-0">
      <div className="container mx-auto px-2 sm:px-4 pb-8">
        {/* List/Map view toggle - simplified without background */}
        <div className="flex items-center mb-2 sm:mb-4 ">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "list" | "map")}
          >
            <TabsList className="flex">
              <TabsTrigger
                value="list"
                id="location-list-view"
                className="data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-1">
                  <CareIcon icon="l-list-ul" className="text-lg" />
                  <span>{t("list")}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="map"
                id="location-map-view"
                className="data-[state=active]:text-primary"
              >
                <div className="flex items-center gap-1">
                  <CareIcon icon="l-map" className="text-lg" />
                  <span>{t("map")}</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex">
          {/* Left sidebar navigation - hidden in map view */}
          {activeTab !== "map" && (
            <div className="w-64 shadow-lg bg-white rounded-lg hidden md:block flex-shrink-0">
              <div className="p-4">
                <h2 className="text-lg font-semibold">{t("locations")}</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="p-2">
                  {isLoadingLocations ? (
                    <div className="p-4">
                      <CardGridSkeleton count={3} />
                    </div>
                  ) : allLocations?.results &&
                    allLocations.results.length > 0 ? (
                    allLocations.results
                      .filter(
                        (loc) =>
                          !loc.parent || Object.keys(loc.parent).length === 0,
                      )
                      .map((location) => (
                        <LocationTreeNode
                          key={location.id}
                          location={location}
                          facilityId={facilityId}
                          selectedLocationId={selectedLocation?.id || null}
                          expandedLocations={expandedLocations}
                          onToggleExpand={handleToggleExpand}
                          onLocationSelect={handleLocationSelect}
                        />
                      ))
                  ) : (
                    <div className="p-4 text-sm text-gray-500">
                      {t("no_locations_available")}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Main content area - full width in map view */}
          <div
            className={cn(
              "flex-1 p-3 sm:p-6 space-y-3 sm:space-y-4 rounded-lg bg-white shadow-lg overflow-hidden",
              activeTab !== "map" && "ml-0 md:ml-4",
            )}
          >
            {/* Map view takes full content area */}
            {activeTab === "map" ? (
              <LocationMap
                locations={allLocations?.results || []}
                onLocationClick={handleEditLocation}
                facilityName={facilityData?.name || t("facility")}
                searchQuery={searchQuery}
                isEditing={isSheetOpen}
              />
            ) : (
              /* List view with header content */
              <>
                {selectedLocationId ? (
                  <LocationView
                    id={selectedLocationId}
                    facilityId={facilityId}
                    isNested={true}
                    onBackToParent={() => setSelectedLocationId(null)}
                    onSelectLocation={handleLocationSelect}
                  />
                ) : (
                  <>
                    {/* Content header for top-level view */}
                    <div className="flex flex-col justify-between items-start gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-semibold">
                          {t("locations")}
                        </h2>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                        <Input
                          placeholder={t("search_by_name")}
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="w-full lg:w-72"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                          <Button
                            variant="primary"
                            onClick={handleAddLocation}
                            className="w-full sm:w-auto"
                          >
                            <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
                            {t("add_location")}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Location children grid */}
                    <div className="space-y-4 overflow-hidden">
                      {isLoadingChildren ? (
                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                          <CardGridSkeleton count={6} />
                        </div>
                      ) : (
                        <div className="space-y-4 overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                            {childLocations?.results?.length ? (
                              childLocations.results.map(
                                (childLocation: LocationListType) => (
                                  <LocationCard
                                    key={childLocation.id}
                                    location={childLocation}
                                    onEdit={handleEditLocation}
                                    onView={handleLocationSelect}
                                    facilityId={facilityId}
                                  />
                                ),
                              )
                            ) : (
                              <Card className="col-span-full">
                                <CardContent className="p-4 text-center text-gray-500">
                                  {searchQuery
                                    ? t("no_locations_found")
                                    : t("no_child_locations_found")}
                                </CardContent>
                              </Card>
                            )}
                          </div>
                          {childLocations &&
                            childLocations.count > ITEMS_PER_PAGE && (
                              <div className="flex justify-center mt-2 sm:mt-4">
                                <Pagination
                                  data={{ totalCount: childLocations.count }}
                                  onChange={(page) => handlePageChange(page)}
                                  defaultPerPage={ITEMS_PER_PAGE}
                                  cPage={currentPage}
                                />
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Location edit/add sheet */}
        <LocationSheet
          open={isSheetOpen}
          onOpenChange={handleSheetClose}
          location={locationToEdit || undefined}
          facilityId={facilityId}
          parentId={selectedLocationId || undefined}
        />
      </div>
    </Page>
  );
}
