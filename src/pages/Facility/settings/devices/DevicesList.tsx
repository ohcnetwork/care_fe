import { CaretSortIcon, CubeIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import {
  FilterIcon as Funnel,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Link } from "raviger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import PageTitle from "@/components/Common/PageTitle";
import {
  CardGridSkeleton,
  CardListSkeleton,
} from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";
import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { LocationTreeNode } from "@/pages/Facility/locations/LocationNavbar";
import { getParentChain } from "@/pages/Facility/locations/Utils";
import {
  DeviceCard,
  DeviceTable,
} from "@/pages/Facility/settings/devices/components/DevicesRender";
import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import deviceApi from "@/types/device/deviceApi";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface Props {
  facilityId: string;
}

export default function DevicesList({ facilityId }: Props) {
  const { t } = useTranslation();
  const pluginDevices = usePluginDevices();
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    disableCache: true,
  });
  const isMobile = useBreakpoints({ default: true, md: false });

  useEffect(() => {
    if (!qParams.locationId) {
      setExpandedLocations(new Set());
    }
  }, [qParams.locationId]);

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
    (location: LocationListType) => {
      updateQuery({ locationId: location.id });

      const parentChain = getParentChain(location);
      const parentIds = parentChain.map((loc) => loc.id);
      parentIds.push(location.id);

      setExpandedLocations(new Set([...expandedLocations, ...parentIds]));
    },
    [expandedLocations, updateQuery],
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

  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices", facilityId, qParams],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        current_location: qParams.locationId || undefined,
        search_text: qParams.search_text || undefined,
        care_type: qParams.care_type || undefined,
      },
    }),
  });

  const { data: allLocations } = useQuery({
    queryKey: ["locations", facilityId, "all"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode: "kind", parent: "" },
    }),
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full min-h-[calc(100vh-10rem)]">
      {showLocationFilter && !isMobile && (
        <div className="md:w-1/4 min-h-full">
          <Card className="w-full h-full flex flex-col">
            <CardContent className="p-4 flex-grow overflow-auto h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-800">
                  {t("locations")}
                </h3>
              </div>
              {allLocations?.results?.length
                ? allLocations.results
                    .filter(
                      (loc) =>
                        !loc.parent || Object.keys(loc.parent).length === 0,
                    )
                    .map((location) => (
                      <LocationTreeNode
                        showAllForms={true}
                        key={location.id}
                        location={location}
                        facilityId={facilityId}
                        selectedLocationId={qParams.locationId || null}
                        expandedLocations={expandedLocations}
                        onToggleExpand={handleToggleExpand}
                        onSelect={handleLocationSelect}
                      />
                    ))
                : t("no_locations_available")}
            </CardContent>
          </Card>
        </div>
      )}
      {isMobile && (
        <Sheet open={showLocationFilter} onOpenChange={setShowLocationFilter}>
          <SheetContent
            side="bottom"
            className="h-[80vh] w-full sm:max-w-md bottom-0 right-0 top-auto rounded-tl-[10px] rounded-tr-[10px] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>{t("locations")}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pt-2 max-h-[calc(80vh-80px)] overflow-auto">
              {allLocations?.results?.length
                ? allLocations.results.map((location) => (
                    <LocationTreeNode
                      key={location.id}
                      showAllForms={true}
                      location={location}
                      facilityId={facilityId}
                      selectedLocationId={qParams.locationId || null}
                      expandedLocations={expandedLocations}
                      onToggleExpand={handleToggleExpand}
                      onSelect={(loc) => {
                        handleLocationSelect(loc);
                        setShowLocationFilter(false);
                      }}
                    />
                  ))
                : t("no_locations_available")}
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="flex-1 flex">
        <div className="w-full flex flex-col h-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <PageTitle title={t("devices")} className="mt-2" />
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className={cn(
                    "flex items-center gap-2 w-full sm:w-auto",
                    (!isMobile && showLocationFilter) ||
                      (isMobile && qParams.locationId)
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-700 border-blue-700"
                      : "",
                  )}
                  onClick={() => setShowLocationFilter(!showLocationFilter)}
                >
                  <Funnel className="size-4" />
                  {t("filter_by_locations")}
                </Button>

                {qParams.locationId && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuery({ locationId: undefined })}
                    title={t("clear_location_filter")}
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
              </div>

              {pluginDevices.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="w-full sm:w-auto">
                    <Button
                      variant="white"
                      className="flex items-center justify-between gap-2 w-full sm:w-auto"
                    >
                      {t("add_device")}
                      <CareIcon icon="l-angle-down" className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] md:w-auto"
                  >
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
                            <DeviceIcon className="size-4 mr-1" />
                            {pluginDevice.type}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuItem asChild>
                      <Link href="/devices/create">
                        <CubeIcon className="size-4 mr-1" />
                        {t("other")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="white"
                  asChild
                  data-cy="add-device-button"
                  className="w-full sm:w-auto"
                >
                  <Link href="/devices/create">
                    <PlusIcon className="size-4" />
                    {t("add_device")}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
              <Input
                data-cy="search-devices-input"
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
                <PopoverContent
                  className="min-w-[var(--radix-popover-trigger-width)] max-w-[200px] p-2"
                  align="end"
                >
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

          <div className="flex-grow overflow-auto">
            {isLoading ? (
              <div className="grid gap-2">
                {!isMobile ? (
                  <CardListSkeleton count={7} />
                ) : (
                  <CardGridSkeleton count={4} />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div data-cy="devices-list">
                  {devices?.results?.length ? (
                    !isMobile ? (
                      <DeviceTable devices={devices.results} />
                    ) : (
                      <DeviceCard devices={devices.results} />
                    )
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-gray-500">
                        {qParams.search_text ||
                        qParams.care_type ||
                        qParams.locationId
                          ? t("no_devices_matching_filters")
                          : t("no_devices_available")}
                      </CardContent>
                    </Card>
                  )}
                </div>
                {devices && devices.count > resultsPerPage && (
                  <div className="flex justify-center mt-6">
                    <Pagination totalCount={devices.count} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
