import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";

import { handleLocationReorder } from "@/Utils/locationOrder";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./LocationSheet";
import { AnimatedLocationCard } from "./components/AnimatedLocationCard";

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

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      id,
      "children",
      { page, limit: limit + 2, searchQuery },
    ],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: id,
        offset: Math.max(0, (page - 1) * limit - 1),
        limit: limit + 2,
        name: searchQuery || undefined,
        ordering: "sort_index",
      },
    }),
  });

  const { mutate: updateLocationOrder } = useMutation({
    mutationFn: (params: {
      locations: { locationId: string; data: any }[];
      previousData?: any;
      onSuccess?: () => void;
    }) => {
      const batchRequests = params.locations.map(
        ({ locationId, data }, index) => ({
          url: locationApi.update.path
            .replace("{facility_id}", facilityId)
            .replace("{id}", locationId),
          method: locationApi.update.method,
          reference_id: `location_${index}`,
          body: {
            ...data,
            id: locationId,
            location_type: {
              code: data.location_type?.code || "OTHER",
            },
          },
        }),
      );

      return mutate(routes.batchRequest)({
        requests: batchRequests,
      });
    },
    onSuccess: (data, variables) => {
      // Only invalidate queries if there's no custom onSuccess handler
      if (!variables.onSuccess) {
        queryClient.invalidateQueries({
          queryKey: ["locations", facilityId, id, "children"],
        });
        toast.success(t("location_order_updated"));
      } else {
        // Call the custom onSuccess handler
        variables.onSuccess();
        toast.success(t("location_order_updated"));
      }
    },
    onError: (error, variables) => {
      // Revert the optimistic update if API call fails
      if (variables.previousData) {
        queryClient.setQueryData(
          [
            "locations",
            facilityId,
            id,
            "children",
            { page, limit: limit + 2, searchQuery },
          ],
          variables.previousData,
        );
      }
      toast.error(t("failed_to_update_order"));
      console.error("Failed to update location order:", error);
    },
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
      onSelectLocation(location);
    } else {
      navigate(`/facility/${facilityId}/settings/location/${location.id}`);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedLocation(null);
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

  const currentPageItems = children?.results?.slice(
    page === 1 ? 0 : 1,
    page === 1 ? limit : limit + 1,
  );

  const handleMove = (location: LocationList, direction: "up" | "down") => {
    if (!children?.results) return;

    const currentIndex = children.results.findIndex(
      (loc) => loc.id === location.id,
    );
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Check if we need to change pages
    if (targetIndex < 0 && page > 1) {
      setPage(page - 1);
      return;
    }
    if (
      targetIndex >= children.results.length &&
      children.count > page * limit
    ) {
      setPage(page + 1);
      return;
    }

    handleLocationReorder({
      location,
      locations: children.results,
      queryClient,
      queryKey: [
        "locations",
        facilityId,
        id,
        "children",
        { page, limit: limit + 2, searchQuery },
      ],
      previousData: children,
      direction,
      updateMutation: updateLocationOrder,
      onSuccess: () => {
        // Invalidate the query to fetch fresh data
        queryClient.invalidateQueries({
          queryKey: ["locations", facilityId, id, "children"],
        });
      },
    });
  };

  const handleMoveUp = (location: LocationList) => handleMove(location, "up");

  const handleMoveDown = (location: LocationList) =>
    handleMove(location, "down");

  return (
    <>
      <Breadcrumb className="m-4">
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
                </>
              )}
            </div>
            <div className="flex flex-col xl:flex-row justify-between items-start w-full gap-4">
              <div className="w-full xl:w-72">
                <Input
                  data-cy="location-child-search-input"
                  placeholder={t("search_by_name")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
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
                        {t("manage_organization_other")}
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
              <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
                <CardGridSkeleton count={2} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
                  {currentPageItems?.length ? (
                    <AnimatePresence initial={false} mode="popLayout">
                      {currentPageItems.map((child, index) => (
                        <AnimatedLocationCard
                          key={child.id}
                          location={child}
                          onEdit={handleEditLocation}
                          onView={handleViewLocation}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          facilityId={facilityId}
                          index={index}
                          totalCount={currentPageItems.length}
                          isFirstPage={page === 1}
                          isLastPage={
                            children?.count
                              ? children.count <= page * limit
                              : false
                          }
                        />
                      ))}
                    </AnimatePresence>
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
