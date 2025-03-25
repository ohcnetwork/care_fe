import { CaretSortIcon, CubeIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Link } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import Page from "@/components/Common/Page";
import PageTitle from "@/components/Common/PageTitle";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { LocationSearch } from "@/components/Location/LocationSearch";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import DeviceCard from "@/pages/Facility/settings/devices/components/DeviceCard";
import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import deviceApi from "@/types/device/deviceApi";
import { LocationList } from "@/types/location/location";

interface Props {
  facilityId: string;
}

export default function DevicesList({ facilityId }: Props) {
  const { t } = useTranslation();
  const [searchType, setSearchType] = useState<"name" | "location">("name");
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const pluginDevices = usePluginDevices();

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    cacheBlacklist: ["search_text", "current_location"],
  });

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

  // Use TanStack Query with query.debounced for API call
  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices", facilityId, qParams],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        search_text: qParams.search_text,
        current_location: qParams.current_location,
        search_type: searchType,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        care_type: qParams.care_type || undefined,
      },
    }),
  });

  return (
    <Page title={t("devices")} hideTitleOnPage className="p-0">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                      <Link href={`/devices/create?type=${pluginDevice.type}`}>
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
          <div className="flex flex-col w-full rounded-lg bg-gray-50 p-2">
            <div className="flex items-center w-full">
              <Select
                value={searchType}
                onValueChange={(value: "name" | "location") => {
                  setSearchType(value);
                  updateQuery({ search_type: value });
                }}
              >
                <SelectTrigger className="w-24 sm:w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base rounded-r-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t("name")}</SelectItem>
                  <SelectItem value="location">{t("location")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-full sm:w-64">
                {searchType === "name" ? (
                  <Input
                    placeholder={t("search_by_name")}
                    value={qParams.search_text || ""}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-9 border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-primary focus:border-primary rounded-l-none"
                  />
                ) : (
                  <LocationSearch
                    facilityId={facilityId}
                    onSelect={(location) => {
                      updateQuery({ current_location: location?.id || "" });
                      setSelectedLocation(location);
                    }}
                    value={selectedLocation}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-primary focus:border-primary rounded-l-none"
                  />
                )}
              </div>
            </div>

            {(qParams.search_text || qParams.current_location) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {qParams.search_text && (
                  <Badge variant="outline" className="rounded-2xl">
                    {t("name")}: {qParams.search_text}
                    <span
                      onClick={() => updateQuery({ search_text: "" })}
                      className="ml-2 cursor-pointer"
                    >
                      <CareIcon icon="l-times" className="h-4 w-4" />
                    </span>
                  </Badge>
                )}
                {qParams.current_location && (
                  <Badge variant="outline" className="rounded-2xl">
                    {t("location")}: {selectedLocation?.name}
                    <span
                      onClick={() => {
                        updateQuery({ current_location: "" });
                        setSelectedLocation(null);
                      }}
                      className="ml-2 cursor-pointer"
                    >
                      <CareIcon icon="l-times" className="h-4 w-4" />
                    </span>
                  </Badge>
                )}
              </div>
            )}
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
                  <CaretSortIcon className="ml-2 h-4 w-4" />
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
                        <DeviceIcon className="mr-2 h-4 w-4" />
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
    </Page>
  );
}
