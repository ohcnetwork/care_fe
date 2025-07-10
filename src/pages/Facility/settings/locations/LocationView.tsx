import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

import { AnimatedWrapper } from "@/components/Common/AnimatedWrapper";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import { useLocationManagement } from "@/hooks/useLocationManagement";

import query from "@/Utils/request/query";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./LocationSheet";
import { LocationCard } from "./components/LocationCard";
import { LocationTable } from "./components/LocationTable";

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
  const limit = 12;

  const { data: location, isLoading: isLocationLoading } = useQuery({
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

  const {
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    selectedLocation,
    isSheetOpen,
    children,
    isLoading,
    currentPageItems,
    handleMove,
    handleAddLocation,
    handleEditLocation,
    handleSheetClose,
    isLastPage,
  } = useLocationManagement({
    facilityId,
    parentId: id,
    itemsPerPage: limit,
    isNested,
  });

  useEffect(() => {
    setPage(1);
  }, [id, setPage]);

  const handleViewLocation = (location: LocationList) => {
    if (isNested && onSelectLocation) {
      onSelectLocation(location);
    } else {
      navigate(`/facility/${facilityId}/settings/locations/${location.id}`);
    }
  };

  const handleBreadcrumbClick = (breadcrumbId: string) => {
    if (!isNested) return;

    if (breadcrumbId === id) return;

    if (onSelectLocation) {
      const locationForNavigation = { id: breadcrumbId } as LocationList;
      onSelectLocation(locationForNavigation);
    } else if (onBackToParent) {
      onBackToParent();
    }
  };

  const generateBreadcrumbs = (locationData: any) => {
    const breadcrumbs = [];
    let current = locationData;

    breadcrumbs.unshift({
      name: current.name,
      id: current.id,
    });

    while (current?.parent?.id) {
      breadcrumbs.unshift({
        name: current.parent.name || "",
        id: current.parent.id,
      });
      current = current.parent;
    }

    return breadcrumbs;
  };

  const breadcrumbs = location ? generateBreadcrumbs(location) : [];

  const handleMoveUp = (location: LocationList) => handleMove(location, "up");
  const handleMoveDown = (location: LocationList) =>
    handleMove(location, "down");

  return (
    <>
      <Breadcrumb className="md:m-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild={!isNested}
              className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
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
                    className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
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
                        href={`/facility/${facilityId}/settings/locations/${breadcrumb.id}`}
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
        <div className="space-y-6">
          <div className="flex flex-col justify-between items-start gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {isLocationLoading ? (
                <>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{location?.name}</h2>
                  <Badge variant="outline" className="whitespace-nowrap">
                    {t(`location_form__${location?.form}`)}
                  </Badge>
                  <Badge
                    variant={
                      location?.status === "active" ? "primary" : "secondary"
                    }
                    className="capitalize whitespace-nowrap"
                  >
                    {location?.status}
                  </Badge>
                </>
              )}
            </div>
            <div className="flex flex-col xl:flex-row justify-between items-start w-full gap-4">
              <div className="w-full xl:w-72">
                <Input
                  data-cy="location-child-search-input"
                  placeholder={t("search_by_name")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto justify-evenly">
                {!isLocationLoading &&
                  location &&
                  "mode" in location &&
                  location.mode === "kind" && (
                    <Button
                      data-cy="add-child-location-button"
                      variant="primary"
                      onClick={handleAddLocation}
                      className="w-full sm:w-auto"
                    >
                      <CareIcon icon="l-plus" className="size-4 mr-2" />
                      {t("add_location")}
                    </Button>
                  )}
                {!isLocationLoading && locationOrganizations && (
                  <LinkDepartmentsSheet
                    entityType="location"
                    entityId={id}
                    currentOrganizations={locationOrganizations.results}
                    facilityId={facilityId}
                    trigger={
                      <Button variant="outline" className="w-full md:w-auto">
                        <CareIcon icon="l-building" className="size-4 mr-2" />
                        {t("manage_organization", { count: 0 })}
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
              <>
                {/* Desktop view skeleton */}
                <div className="hidden lg:block">
                  <TableSkeleton count={5} />
                </div>

                {/* Mobile view skeleton */}
                <div className="lg:hidden flex flex-col gap-4">
                  <CardGridSkeleton count={3} />
                </div>
              </>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden lg:block">
                  {currentPageItems?.length ? (
                    <LocationTable
                      locations={currentPageItems}
                      onEdit={handleEditLocation}
                      onView={handleViewLocation}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      facilityId={facilityId}
                      isFirstPage={page === 1}
                      isLastPage={isLastPage}
                      currentPage={page}
                      setPage={setPage}
                    />
                  ) : (
                    <Card>
                      <CardContent className="p-4 text-center text-gray-500">
                        {searchQuery
                          ? t("no_locations_found")
                          : t("no_child_locations_found")}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Mobile and tablet card view */}
                <div className="lg:hidden flex flex-col gap-4">
                  {currentPageItems?.length ? (
                    <div className="flex flex-col gap-4">
                      {currentPageItems.map((child, index) => (
                        <AnimatedWrapper
                          key={child.id}
                          keyValue={child.id}
                          data-testid={`location-card-${child.id}`}
                        >
                          <LocationCard
                            location={child}
                            onEdit={handleEditLocation}
                            onView={handleViewLocation}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            facilityId={facilityId}
                            index={index}
                            totalCount={currentPageItems.length}
                            isFirstPage={page === 1}
                            isLastPage={isLastPage}
                            currentPage={page}
                            setPage={setPage}
                          />
                        </AnimatedWrapper>
                      ))}
                    </div>
                  ) : (
                    <Card>
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
                      onChange={setPage}
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
