import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import PageTitle from "@/components/Common/PageTitle";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { LocationSearch } from "@/components/Location/LocationSearch";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import DeviceCard from "@/pages/Facility/settings/devices/components/DeviceCard";
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

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    cacheBlacklist: ["search_text", "current_location"],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["devices", facilityId, qParams, resultsPerPage],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        search_text: qParams.search_text,
        current_location: qParams.current_location,
        search_type: searchType,
        limit: resultsPerPage,
        offset: (qParams.page - 1) * resultsPerPage,
      },
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-4">
          <PageTitle title={t("devices")} />
        </div>
        <div className="flex flex-wrap sm:flex-row  items-center gap-4">
          <div className="flex items-center rounded-lg bg-gray-50 w-full sm:w-auto">
            <Select
              value={searchType}
              onValueChange={(value: "name" | "location") => {
                setSearchType(value);
                updateQuery({
                  [value === "name" ? "current_location" : "search_text"]: "",
                });
              }}
            >
              <SelectTrigger className="w-36 border border-gray-300 rounded-lg px-4 py-2 rounded-r-none ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t("name")}</SelectItem>
                <SelectItem value="location">{t("location")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-64">
              {searchType === "name" ? (
                <Input
                  placeholder={t("search_by_name")}
                  value={qParams.search_text || ""}
                  onChange={(e) =>
                    updateQuery({
                      search_text: e.target.value,
                      current_location: "",
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary rounded-l-none"
                />
              ) : (
                <LocationSearch
                  facilityId={facilityId}
                  onSelect={(location: LocationList | null) => {
                    updateQuery({
                      current_location: location?.id || "",
                      search_text: "",
                    });
                    setSelectedLocation(location);
                  }}
                  value={selectedLocation}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary rounded-l-none"
                />
              )}
            </div>
          </div>
          <Button variant="primary" asChild>
            <Link href="/devices/create">
              <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
              {t("add_device")}
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardGridSkeleton count={6} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.results?.length ? (
              data.results.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))
            ) : (
              <Card className="col-span-full border border-gray-200 shadow-sm">
                <CardContent className="p-8 text-center text-gray-500">
                  {t("no_devices_available")}
                </CardContent>
              </Card>
            )}
          </div>
          <Pagination totalCount={data?.count ?? 0} />
        </div>
      )}
    </div>
  );
}
