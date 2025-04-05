import { CaretSortIcon, CubeIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Link } from "raviger";
import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import Page from "@/components/Common/Page";
import PageTitle from "@/components/Common/PageTitle";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { LocationTreeNode } from "@/pages/Facility/locations/LocationNavbar";
import DeviceCard from "@/pages/Facility/settings/devices/components/DeviceCard";
import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import deviceApi from "@/types/device/deviceApi";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface Props {
  facilityId: string;
}

function getParentChain(location: LocationList): Set<string> {
  const parentIds = new Set<string>();
  let current = location.parent;

  while (current) {
    parentIds.add(current.id);
    current = current.parent;
  }

  return parentIds;
}

export default function DevicesList({ facilityId }: Props) {
  const { t } = useTranslation();
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [locationParents, setLocationParents] = useState<LocationList[]>([]);

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    cacheBlacklist: ["search_text", "current_location"],
  });

  const { data: allLocations } = useQuery({
    queryKey: ["locations", facilityId, "all"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode: "kind" },
    }),
  });

  const { data: locations } = useQuery({
    queryKey: ["locations", facilityId],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
    }),
  });

  // Use TanStack Query with query.debounced for API call
  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices", facilityId, qParams],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        search_text: qParams.search_text,
        current_location: selectedLocationId || undefined,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        care_type: qParams.care_type || undefined,
      },
    }),
  });

  const selectedLocation = useMemo(
    () => locations?.results?.find((loc) => loc.id === selectedLocationId),
    [locations, selectedLocationId],
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

  const handleLocationSelect = useCallback(
    (location: LocationList) => {
      setSelectedLocationId(location.id);
      updateQuery({ current_location: location.id });
      const parentIds = getParentChain(location);
      parentIds.add(location.id);
      setExpandedLocations(new Set([...expandedLocations, ...parentIds]));
    },
    [expandedLocations, facilityId],
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (value: string) => {
      updateQuery({ search_text: value || undefined });
    },
    [updateQuery],
  );

  // Handle care type filter change
  const handleCareTypeChange = useCallback(
    (careType: string | null) => {
      updateQuery({ care_type: careType || undefined });
    },
    [updateQuery],
  );

  useEffect(() => {
    if (selectedLocationId && locations?.results) {
      const parents: LocationList[] = [];
      let currentLocation = locations.results.find(
        (loc) => loc.id === selectedLocationId,
      );

      while (currentLocation?.parent?.id) {
        const parent = locations.results.find(
          (loc) => loc.id === currentLocation?.parent?.id,
        );
        if (parent) {
          parents.unshift(parent);
          currentLocation = parent;
        } else {
          break;
        }
      }
      setLocationParents(parents);
    } else {
      setLocationParents([]);
    }
  }, [selectedLocationId, locations?.results]);

  const pluginDevices = usePluginDevices();

  return (
    <Page title={t("devices")} hideTitleOnPage className="p-0">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 min-h-[calc(100vh-5rem)]">
          <div className="w-64 shadow-lg bg-white rounded-lg hidden md:block flex-shrink-0">
            <div className="p-4">
              <h2 className="text-lg font-semibold">{t("locations")}</h2>
            </div>
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
                        selectedLocationId={selectedLocationId || null}
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

          <div className="flex-1 flex flex-col gap-4 bg-white shadow-lg rounded-lg p-6">
            {selectedLocation && (
              <Breadcrumb className="m-4">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      asChild
                      className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                      onClick={() => {
                        setSelectedLocationId(null);
                        updateQuery({ current_location: undefined });
                      }}
                    >
                      <button type="button">{t("home")}</button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {locationParents.length > 0 && <BreadcrumbSeparator />}

                  {locationParents.map((parent, index) => (
                    <React.Fragment key={parent.id}>
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          asChild
                          className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                          onClick={() => {
                            setSelectedLocationId(parent.id);
                            updateQuery({ current_location: parent.id });
                          }}
                        >
                          <button type="button">{parent.name}</button>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {index < locationParents.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  ))}

                  <BreadcrumbSeparator />

                  <BreadcrumbItem>
                    <span className="font-semibold text-gray-900">
                      {selectedLocation.name}
                    </span>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <PageTitle title={t("devices")} className="mt-0" />
                <Badge
                  className="bg-purple-50 text-purple-700 text-sm font-medium rounded-xl px-3 w-max"
                  variant="outline"
                >
                  {isLoading
                    ? t("loading")
                    : t("entity_count", {
                        count: devices?.count ?? 0,
                        entity: t("device"),
                      })}
                </Badge>
              </div>
              {pluginDevices.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="white" className="flex items-center gap-2">
                      {t("add_device")}
                      <CareIcon icon="l-angle-down" className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {pluginDevices.map((pluginDevice) => {
                      const DeviceIcon = pluginDevice.icon || CubeIcon;
                      return (
                        <DropdownMenuItem
                          key={pluginDevice.type}
                          className="capitalize"
                          asChild
                        >
                          <Link
                            href={`/devices/create?type=${pluginDevice.type}`}
                          >
                            <DeviceIcon className="h-4 w-4 mr-1" />
                            {pluginDevice.type}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuItem asChild>
                      <Link href="/devices/create">
                        <CubeIcon className="h-4 w-4 mr-1" />
                        {t("other")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="primary" asChild>
                  <Link href="/devices/create">
                    <PlusIcon className="h-4 w-4" />
                    {t("add_device")}
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder={t("search_devices")}
                  value={qParams.search_text || ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              {pluginDevices.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      {qParams.care_type ? (
                        <span className="capitalize">{qParams.care_type}</span>
                      ) : (
                        t("filter_by_type")
                      )}
                      <CaretSortIcon className="ml-2 size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2">
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-normal"
                        onClick={() => handleCareTypeChange(null)}
                      >
                        {t("all_types")}
                      </Button>
                      <Separator />
                      {pluginDevices.map((device) => {
                        const DeviceIcon = device.icon || CubeIcon;
                        return (
                          <Button
                            key={device.type}
                            variant="ghost"
                            className="w-full capitalize justify-start font-normal"
                            onClick={() => handleCareTypeChange(device.type)}
                          >
                            <DeviceIcon className="mr-2 size-4" />
                            {device.type}
                          </Button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardGridSkeleton count={6} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices?.results?.length ? (
                    devices.results.map((device) => (
                      <DeviceCard key={device.id} device={device} />
                    ))
                  ) : (
                    <Card className="col-span-full">
                      <CardContent className="p-6 text-center text-gray-500">
                        {qParams.search_text || qParams.care_type
                          ? t("no_devices_matching_filters")
                          : t("no_devices_available")}
                      </CardContent>
                    </Card>
                  )}
                </div>
                {devices && devices.count > resultsPerPage && (
                  <div className="flex justify-center">
                    <Pagination totalCount={devices.count} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
