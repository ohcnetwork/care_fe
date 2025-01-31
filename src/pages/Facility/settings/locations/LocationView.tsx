import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import query from "@/Utils/request/query";
import { LocationList, getLocationFormLabel } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./LocationSheet";
import { LocationCard } from "./components/LocationCard";

interface Props {
  id: string;
  facilityId: string;
}

export default function LocationView({ id, facilityId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const limit = 12;

  const { data: location } = useQuery({
    queryKey: ["location", facilityId, id],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id },
    }),
  });

  const { data: locationOrganizations } = useQuery({
    queryKey: ["location", id, "organizations"],
    queryFn: query(locationApi.getOrganizations, {
      pathParams: { facility_id: facilityId, id },
    }),
  });

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      id,
      "children",
      { page, limit, searchQuery },
    ],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: id,
        offset: (page - 1) * limit,
        limit,
        name: searchQuery || undefined,
      },
    }),
  });

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsSheetOpen(true);
  };

  const handleEditLocation = (location: LocationList) => {
    setSelectedLocation(location);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedLocation(null);
  };

  if (!location)
    return (
      <div className="p-4">
        <CardGridSkeleton count={6} />
      </div>
    );

  return (
    <Page title={location?.name || t("location")}>
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="flex flex-col justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">{t("locations")}</h2>
              <Badge variant="outline">
                {getLocationFormLabel(location?.form)}
              </Badge>
              <Badge
                variant={
                  location?.status === "active" ? "default" : "secondary"
                }
              >
                {location?.status}
              </Badge>
              {location && "mode" in location && location.mode === "kind" && (
                <Button variant="default" onClick={handleAddLocation}>
                  <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
                  {t("add_location")}
                </Button>
              )}
            </div>
            <div className="w-72">
              <Input
                placeholder={t("search_by_name")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
          </div>
          {locationOrganizations && (
            <LinkDepartmentsSheet
              entityType="location"
              entityId={id}
              currentOrganizations={locationOrganizations.results}
              facilityId={facilityId}
              trigger={
                <Button variant="outline">
                  <CareIcon icon="l-building" className="h-4 w-4 mr-2" />
                  {t("manage_organizations")}
                </Button>
              }
              onUpdate={() => {
                queryClient.invalidateQueries({
                  queryKey: ["location", facilityId, id],
                });
              }}
            />
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children?.results?.length ? (
                children.results.map((childLocation: LocationList) => (
                  <LocationCard
                    key={childLocation.id}
                    location={childLocation}
                    onEdit={handleEditLocation}
                  />
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {searchQuery
                      ? t("no_locations_found")
                      : t("no_child_locations_found")}
                  </CardContent>
                </Card>
              )}
            </div>
            {children && children.count > limit && (
              <div className="flex justify-center">
                <Pagination
                  data={{ totalCount: children.count }}
                  onChange={(page, _) => setPage(page)}
                  defaultPerPage={limit}
                  cPage={page}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <LocationSheet
        open={isSheetOpen}
        onOpenChange={handleSheetClose}
        facilityId={facilityId}
        location={selectedLocation || undefined}
        parentId={id}
      />
    </Page>
  );
}
