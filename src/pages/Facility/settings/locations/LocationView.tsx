import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import React, { useState } from "react";
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
  isNested?: boolean;
  onBackToParent?: () => void;
  onSelectLocation?: (location: LocationList) => void;
}

export default function LocationView({
  id,
  facilityId,
  isNested,
  onBackToParent,
  onSelectLocation,
}: Props) {
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

  const handleViewLocation = (location: LocationList) => {
    if (isNested && onSelectLocation) {
      // When nested in LocationSettings, use the provided callback for navigation
      // No need to call onBackToParent first, just directly select the new location
      onSelectLocation(location);
    } else {
      // For standalone view, use raviger navigation to the appropriate settings URL
      navigate(`/facility/${facilityId}/settings/location/${location.id}`);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedLocation(null);
  };

  const handleBreadcrumbClick = (breadcrumbId: string) => {
    if (!isNested) return; // For standalone view, use the Link component

    if (breadcrumbId === id) {
      // Current location, do nothing
      return;
    }

    if (onSelectLocation) {
      // For parent locations, we need to navigate to that location
      const locationForNavigation = { id: breadcrumbId } as LocationList;
      onSelectLocation(locationForNavigation);
    } else if (onBackToParent) {
      // Fallback to parent navigation if onSelectLocation is not provided
      onBackToParent();
    }
  };

  if (!location)
    return (
      <div className="p-4">
        <CardGridSkeleton count={6} />
      </div>
    );

  // Use a generic type that works with API responses without being too strict
  const generateBreadcrumbs = (locationData: any) => {
    const breadcrumbs = [];
    let current = locationData;

    // Add the current location
    breadcrumbs.unshift({
      name: current.name,
      id: current.id,
    });

    // Add all parent locations in the chain
    while (current?.parent && current.parent.id) {
      breadcrumbs.unshift({
        name: current.parent.name || "",
        id: current.parent.id,
      });
      // Move up to the parent
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
              asChild={!isNested}
              className="text-sm text-gray-900 hover:underline hover:underline-offset-2"
              onClick={isNested && onBackToParent ? onBackToParent : undefined}
            >
              {isNested ? (
                <span>{t("home")}</span>
              ) : (
                <Link href={`/facility/${facilityId}/settings/locations`}>
                  {t("home")}
                </Link>
              )}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {breadcrumbs.map((breadcrumb, index) => (
            <BreadcrumbItem key={breadcrumb.id}>
              {index === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-gray-900">
                  {breadcrumb.name}
                </span>
              ) : (
                <>
                  <BreadcrumbLink
                    asChild={!isNested}
                    className="text-sm text-gray-900 hover:underline hover:underline-offset-2"
                    onClick={
                      isNested
                        ? () => handleBreadcrumbClick(breadcrumb.id)
                        : undefined
                    }
                  >
                    {isNested ? (
                      <span>{breadcrumb.name}</span>
                    ) : (
                      <Link
                        href={`/facility/${facilityId}/settings/location/${breadcrumb.id}`}
                      >
                        {breadcrumb.name}
                      </Link>
                    )}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <Page hideTitleOnPage title={location?.name || t("location")}>
        <div className="space-y-6 px-4">
          <div className="flex flex-col justify-between items-start gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold">{location?.name}</h2>
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
            <div className="flex flex-col xl:flex-row justify-between items-start w-full gap-4">
              <Input
                placeholder={t("search_by_name")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full xl:w-72"
              />
              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                {location && "mode" in location && location.mode === "kind" && (
                  <Button
                    variant="primary"
                    onClick={handleAddLocation}
                    className="w-full sm:w-auto"
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
                      <Button variant="outline" className="w-full sm:w-auto">
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

          <div className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                <CardGridSkeleton count={6} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
                  {children?.results?.length ? (
                    children.results.map((child) => (
                      <LocationCard
                        key={child.id}
                        location={child}
                        onEdit={handleEditLocation}
                        onView={handleViewLocation}
                        facilityId={facilityId}
                      />
                    ))
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
                {children && children.count > limit && (
                  <div className="flex justify-center mt-4">
                    <Pagination
                      data={{ totalCount: children.count }}
                      onChange={(page) => setPage(page)}
                      defaultPerPage={limit}
                      cPage={page}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Page>

      <LocationSheet
        open={isSheetOpen}
        onOpenChange={handleSheetClose}
        facilityId={facilityId}
        location={selectedLocation || undefined}
        parentId={id}
      />
    </>
  );
}
