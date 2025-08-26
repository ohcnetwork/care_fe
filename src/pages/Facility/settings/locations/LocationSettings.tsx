import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnimatedWrapper } from "@/components/Common/AnimatedWrapper";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import { useLocationManagement } from "@/hooks/useLocationManagement";

import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
import { LocationTreeNode } from "@/pages/Facility/locations/LocationNavbar";
import facilityApi from "@/types/facility/facilityApi";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationMap from "./LocationMap";
import LocationSheet from "./LocationSheet";
import LocationView from "./LocationView";
import { LocationCard } from "./components/LocationCard";
import { LocationTable } from "./components/LocationTable";

interface LocationSettingsProps {
  facilityId: string;
  locationId?: string;
}

export default function LocationSettings({
  facilityId,
  locationId,
}: LocationSettingsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useView("locations", "list");
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  const { data: parentLocations } = useQuery({
    queryKey: ["locations", facilityId, "top"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mode: "kind",
        ordering: "sort_index",
        parent: "",
      },
    }),
  });

  const ITEMS_PER_PAGE = 9;

  const {
    page: currentPage,
    setPage: setCurrentPage,
    searchQuery,
    setSearchQuery,
    selectedLocation: locationToEdit,
    isSheetOpen,
    children: childLocations,
    isLoading,
    currentPageItems,
    handleMove,
    handleAddLocation,
    handleEditLocation,
    handleSheetClose,
    isLastPage,
  } = useLocationManagement({
    facilityId,
    parentId: locationId,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const { data: mapLocations } = useQuery({
    queryKey: ["locations", facilityId, "map"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        limit: 1000,
        ordering: "sort_index",
      },
    }),
    enabled: activeTab === "map",
  });

  // Reset page to 1 when locationId changes
  useEffect(() => {
    setCurrentPage(1);
  }, [locationId, setCurrentPage]);

  const handleLocationSelect = useCallback(
    (location: LocationListType) => {
      navigate(`/facility/${facilityId}/settings/locations/${location.id}`);
    },
    [facilityId],
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

  const handleMoveUp = useCallback(
    (location: LocationListType) => handleMove(location, "up"),
    [handleMove],
  );

  const handleMoveDown = useCallback(
    (location: LocationListType) => handleMove(location, "down"),
    [handleMove],
  );

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
                  {parentLocations?.results?.length ? (
                    parentLocations.results.map((location) => (
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
                    <div className="flex flex-col justify-between items-start gap-2 sm:gap-4 md:pt-4 md:px-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                        <Input
                          data-cy="location-search-input"
                          placeholder={t("search_by_name")}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full lg:w-72"
                        />
                        <div className="w-full sm:w-auto flex justify-center sm:justify-start">
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
                      {/* Desktop table view */}
                      <div className="hidden lg:block md:px-4">
                        {isLoading ? (
                          <TableSkeleton count={5} />
                        ) : currentPageItems?.length ? (
                          <LocationTable
                            locations={currentPageItems}
                            onEdit={handleEditLocation}
                            onView={handleLocationSelect}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            facilityId={facilityId}
                            isFirstPage={currentPage === 1}
                            isLastPage={isLastPage}
                            currentPage={currentPage}
                            setPage={setCurrentPage}
                          />
                        ) : (
                          <Card>
                            <CardContent className="p-4 text-center text-gray-500">
                              {t("no_locations_found")}
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Mobile and tablet card view */}
                      <div
                        className="lg:hidden flex flex-col gap-4 sm:px-4"
                        data-cy="location-card-container"
                      >
                        {isLoading ? (
                          <CardGridSkeleton count={3} />
                        ) : currentPageItems?.length ? (
                          <div className="flex flex-col gap-4">
                            {currentPageItems.map((childLocation, index) => (
                              <AnimatedWrapper
                                key={childLocation.id}
                                keyValue={childLocation.id}
                                data-testid={`location-card-${childLocation.id}`}
                              >
                                <LocationCard
                                  location={childLocation}
                                  onEdit={handleEditLocation}
                                  onView={handleLocationSelect}
                                  onMoveUp={handleMoveUp}
                                  onMoveDown={handleMoveDown}
                                  facilityId={facilityId}
                                  index={index}
                                  totalCount={currentPageItems.length}
                                  isFirstPage={currentPage === 1}
                                  isLastPage={isLastPage}
                                  currentPage={currentPage}
                                  setPage={setCurrentPage}
                                />
                              </AnimatedWrapper>
                            ))}
                          </div>
                        ) : (
                          <Card>
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
