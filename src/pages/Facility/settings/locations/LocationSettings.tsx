import { useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useState } from "react";
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
import { LocationTreeNode } from "@/pages/Facility/locations/LocationNavbar";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationMap from "./LocationMap";
import LocationSheet from "./LocationSheet";
import LocationView from "./LocationView";
import { LocationCard } from "./components/LocationCard";

interface LocationSettingsProps {
  facilityId: string;
  locationId?: string;
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

export default function LocationSettings({
  facilityId,
  locationId,
}: LocationSettingsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useView("locations", "list");
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<LocationListType | null>(
    null,
  );
  const ITEMS_PER_PAGE = 9;

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.facility.show, {
      pathParams: { id: facilityId },
    }),
  });

  const { data: allLocations } = useQuery({
    queryKey: ["locations", facilityId, "all"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode: "kind" },
    }),
  });

  const { data: _locationOrgs } = useQuery({
    queryKey: ["location", locationId, "organizations"],
    queryFn: query(locationApi.getOrganizations, {
      pathParams: { facility_id: facilityId, id: locationId as string },
    }),
    enabled: !!locationId,
  });

  const { data: childLocations, isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      "children",
      locationId,
      currentPage,
      searchQuery,
    ],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: locationId || "",
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        name: searchQuery || undefined,
        mode: locationId ? undefined : "kind",
      },
    }),
    enabled: true,
  });

  const { data: mapLocations } = useQuery({
    queryKey: ["locations", facilityId, "map"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        limit: 1000,
      },
    }),
    enabled: activeTab === "map",
  });

  const handleLocationSelect = useCallback(
    (location: LocationListType) => {
      navigate(`/facility/${facilityId}/settings/locations/${location.id}`);
      const parentIds = getParentChain(location);
      parentIds.add(location.id);
      setExpandedLocations(new Set([...expandedLocations, ...parentIds]));
    },
    [expandedLocations, facilityId],
  );

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

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleAddLocation = useCallback(() => {
    setLocationToEdit(null);
    setIsSheetOpen(true);
  }, []);

  const handleEditLocation = useCallback((location: LocationListType) => {
    setLocationToEdit(location);
    setIsSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
    setLocationToEdit(null);
    queryClient.invalidateQueries({ queryKey: ["locations", facilityId] });
    if (locationId) {
      queryClient.invalidateQueries({
        queryKey: ["location", facilityId, locationId],
      });
    }
  }, [facilityId, queryClient, locationId]);

  return (
    <Page title={t("locations")} hideTitleOnPage className="p-0">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4">
          <h3>{t("locations")}</h3>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "list" | "map")}
            className="mt-2 sm:mt-0"
          >
            <TabsList className="flex">
              <TabsTrigger
                value="list"
                id="location-list-view"
                className="data-[state=active]:text-primary"
              >
                <CareIcon icon="l-list-ul" className="text-lg" />
                <span>{t("list")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="map"
                id="location-map-view"
                className="data-[state=active]:text-primary"
              >
                <CareIcon icon="l-map" className="text-lg" />
                <span>{t("map")}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex">
          {activeTab !== "map" && (
            <div className="w-64 shadow-lg bg-white rounded-lg hidden md:block flex-shrink-0">
              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="p-4">
                  {allLocations?.results?.length ? (
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
                          selectedLocationId={locationId || null}
                          expandedLocations={expandedLocations}
                          onToggleExpand={handleToggleExpand}
                          onSelect={handleLocationSelect}
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

          <div
            className={cn(
              "flex-1 space-y-3 sm:space-y-4 rounded-lg  md:shadow-lg overflow-hidden",
              activeTab !== "map" && "ml-0 md:ml-4 md:bg-white md:p-4 ",
            )}
          >
            {activeTab === "map" ? (
              <LocationMap
                locations={mapLocations?.results || []}
                onLocationClick={handleLocationSelect}
                onLocationEdit={handleEditLocation}
                facilityName={facilityData?.name || t("facility")}
                searchQuery={searchQuery}
                isEditing={isSheetOpen}
              />
            ) : (
              <>
                {locationId ? (
                  <LocationView
                    id={locationId}
                    facilityId={facilityId}
                    isNested={true}
                    onBackToParent={() =>
                      navigate(`/facility/${facilityId}/settings/locations`)
                    }
                    onSelectLocation={handleLocationSelect}
                  />
                ) : (
                  <>
                    <div className="flex flex-col justify-between items-start gap-2 sm:gap-4">
                      <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                        <Input
                          data-cy="location-search-input"
                          placeholder={t("search_by_name")}
                          defaultValue={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="w-full lg:w-72"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                          <Button
                            data-cy="add-main-location-button"
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

                    <div className="space-y-4 overflow-hidden">
                      <div
                        className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4"
                        data-cy="location-card-container"
                      >
                        {isLoading ? (
                          <CardGridSkeleton count={2} />
                        ) : childLocations?.results?.length ? (
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
                              {t("no_locations_found")}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      {childLocations &&
                        childLocations.count > ITEMS_PER_PAGE && (
                          <div className="flex justify-center mt-2 sm:mt-4">
                            <Pagination
                              data={{ totalCount: childLocations.count }}
                              onChange={setCurrentPage}
                              defaultPerPage={ITEMS_PER_PAGE}
                              cPage={currentPage}
                            />
                          </div>
                        )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <LocationSheet
          open={isSheetOpen}
          onOpenChange={handleSheetClose}
          location={locationToEdit || undefined}
          facilityId={facilityId}
          parentId={locationId || undefined}
        />
      </div>
    </Page>
  );
}
