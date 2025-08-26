import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import { useLocationManagement } from "@/hooks/useLocationManagement";

import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
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

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  const ITEMS_PER_PAGE = 12;

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
      <div className="space-y-6 mx-auto max-w-4xl md:pt-3">
        <div className="flex justify-between w-full gap-4">
          <h3>{t("locations")}</h3>
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
                <div className="flex flex-col flex-wrap sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                  <div className="relative w-full sm:w-[18rem] max-w-full">
                    <CareIcon
                      icon="l-search"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
                    />
                    <Input
                      data-cy="location-search-input"
                      placeholder={t("search_by_name")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8"
                    />
                  </div>

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

                {isLoading ? (
                  <div className="grid grid-cols-1 gap-3">
                    <CardGridSkeleton count={4} />
                  </div>
                ) : (
                  <div className="space-y-6 md:pb-6">
                    {currentPageItems?.length ? (
                      <>
                        {/* Desktop table view */}
                        <div
                          className="hidden sm:block rounded-lg border"
                          data-cy="location-list"
                        >
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
                        </div>

                        {/* Mobile card view */}
                        <div className="block sm:hidden space-y-4">
                          {currentPageItems.map((childLocation, index) => (
                            <LocationCard
                              key={childLocation.id}
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
                          ))}
                        </div>
                      </>
                    ) : (
                      <Card className="col-span-full">
                        <CardContent className="p-6 text-center text-gray-500">
                          {t("no_locations_found")}
                        </CardContent>
                      </Card>
                    )}

                    {childLocations &&
                      childLocations.count > ITEMS_PER_PAGE && (
                        <div className="flex justify-center">
                          <Pagination
                            data={{ totalCount: childLocations.count }}
                            onChange={setCurrentPage}
                            defaultPerPage={ITEMS_PER_PAGE}
                            cPage={currentPage}
                          />
                        </div>
                      )}
                  </div>
                )}
              </>
            )}
          </>
        )}
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
