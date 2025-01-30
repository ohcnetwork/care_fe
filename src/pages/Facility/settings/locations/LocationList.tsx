import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import {
  LocationList as LocationListType,
  getLocationFormLabel,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./LocationSheet";

interface Props {
  facilityId: string;
}

export default function LocationList({ facilityId }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationListType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["locations", facilityId, page, limit, searchQuery],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
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

  const handleEditLocation = (location: LocationListType) => {
    setSelectedLocation(location);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedLocation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{t("locations")}</h2>
          <Button variant="default" onClick={handleAddLocation}>
            <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
            {t("add_location")}
          </Button>
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardGridSkeleton count={6} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.results?.length ? (
              data.results.map((location: LocationListType) => (
                <Card key={location.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col h-full">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap">
                          <div className="space-y-1 mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {location.name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLocation(location)}
                              >
                                <CareIcon icon="l-pen" className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {getLocationFormLabel(location.form)}
                              </Badge>
                              <Badge
                                variant={
                                  location.status === "active"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {location.status}
                              </Badge>
                              <Badge
                                variant={
                                  location.availability_status === "available"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {location.availability_status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 flex justify-end">
                        <Button variant="link" asChild>
                          <Link href={`/location/${location.id}`}>
                            {t("view_details")}
                            <CareIcon
                              icon="l-arrow-right"
                              className="h-4 w-4 ml-2"
                            />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {searchQuery
                    ? t("no_locations_found")
                    : t("no_locations_available")}
                </CardContent>
              </Card>
            )}
          </div>
          {data && data.count > limit && (
            <div className="flex justify-center">
              <Pagination
                data={{ totalCount: data.count }}
                onChange={(page, _) => setPage(page)}
                defaultPerPage={limit}
                cPage={page}
              />
            </div>
          )}
        </div>
      )}
      <LocationSheet
        open={isSheetOpen}
        onOpenChange={handleSheetClose}
        facilityId={facilityId}
        location={selectedLocation || undefined}
      />
    </div>
  );
}
