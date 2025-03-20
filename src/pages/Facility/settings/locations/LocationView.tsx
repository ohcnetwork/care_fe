import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import query from "@/Utils/request/query";
import { LocationList } from "@/types/location/location";
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
  const generateBreadcrumbs = (location: any) => {
    const breadcrumbs = [];
    let current = location;
    while (current?.id) {
      breadcrumbs.unshift({
        name: current.name,
        id: current.id,
      });
      current = current.parent;
    }
    return breadcrumbs;
  };
  const breadcrumbs = location ? generateBreadcrumbs(location) : [];

  return (
    <>
      <Breadcrumb className="m-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="text-sm text-gray-900 hover:underline hover:underline-offset-2"
            >
              <Link href={`/locations`}>{t("home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((breadcrumb, index) => (
            <BreadcrumbItem key={breadcrumb.id}>
              {index === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-gray-900">
                  {breadcrumb.name}
                </span>
              ) : (
                <>
                  <BreadcrumbLink
                    asChild
                    className="text-sm text-gray-900 hover:underline hover:underline-offset-2"
                  >
                    <Link href={`${breadcrumb.id}`}>{breadcrumb.name}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <Page title={location?.name || t("location")}>
        <div className="space-y-6 ml-3 md:ml-0">
          <div className="flex flex-col justify-between items-start gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{t("locations")}</h2>
              <Badge variant="outline">
                {t(`location_form__${location?.form}`)}
              </Badge>
              <Badge
                variant={
                  location?.status === "active" ? "default" : "secondary"
                }
                className="capitalize"
              >
                {location?.status}
              </Badge>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-2">
              <div className="w-full md:w-72">
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
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                {location && "mode" in location && location.mode === "kind" && (
                  <Button
                    variant="primary"
                    onClick={handleAddLocation}
                    className="w-full md:w-auto"
                  >
                    <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
                    {t("add_location")}
                  </Button>
                )}
                {locationOrganizations && (
                  <LinkDepartmentsSheet
                    entityType="location"
                    entityId={id}
                    currentOrganizations={locationOrganizations.results}
                    facilityId={facilityId}
                    trigger={
                      <Button variant="outline" className="w-full md:w-auto">
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

          <LocationSheet
            open={isSheetOpen}
            onOpenChange={handleSheetClose}
            facilityId={facilityId}
            location={selectedLocation || undefined}
            parentId={id}
          />
        </div>
      </Page>
    </>
  );
}
