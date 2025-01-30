import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
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

import query from "@/Utils/request/query";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./components/LocationSheet";

interface Props {
  id: string;
  facilityId: string;
}

export default function LocationView({ id, facilityId }: Props) {
  const { t } = useTranslation();

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

  return (
    <Page title={location?.name || t("location")}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">{t("child_locations")}</h2>
            <Badge variant="outline">{location?.form.toUpperCase()}</Badge>
            <Badge
              variant={location?.status === "active" ? "default" : "secondary"}
            >
              {location?.status}
            </Badge>
            {location && "mode" in location && location.mode === "kind" && (
              <Button variant="default" onClick={handleAddLocation}>
                <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
                {t("add_child_location")}
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children?.results?.length ? (
                children.results.map((childLocation: LocationList) => (
                  <Card key={childLocation.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap">
                          <div className="space-y-1 mb-2">
                            <h3 className="text-lg font-semibold">
                              {childLocation.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {childLocation.form.toUpperCase()}
                              </Badge>
                              <Badge
                                variant={
                                  childLocation.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {childLocation.status}
                              </Badge>
                              <Badge
                                variant={
                                  childLocation.availability_status ===
                                  "available"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {childLocation.availability_status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditLocation(childLocation)}
                            >
                              <CareIcon icon="l-pen" className="h-4 w-4" />
                            </Button>
                            <Button variant="link" asChild>
                              <Link
                                href={`/facility/${facilityId}/location/${childLocation.id}`}
                              >
                                {t("view_details")}
                                <CareIcon
                                  icon="l-arrow-right"
                                  className="h-4 w-4"
                                />
                              </Link>
                            </Button>
                          </div>
                        </div>
                        {childLocation.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {childLocation.description}
                          </p>
                        )}
                        {childLocation.has_children && (
                          <div className="text-sm text-primary">
                            <CareIcon
                              icon="l-folder"
                              className="h-4 w-4 inline mr-1"
                            />
                            {t("has_child_locations")}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
