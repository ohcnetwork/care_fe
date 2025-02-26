import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import PageTitle from "@/components/Common/PageTitle";
import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { LocationSearch } from "@/components/Location/LocationSearch";

import query from "@/Utils/request/query";
import DeviceCard from "@/pages/Facility/settings/devices/components/DeviceCard";
import deviceApi from "@/types/device/deviceApi";
import { LocationList } from "@/types/location/location";

interface Props {
  facilityId: string;
}

export default function DevicesList({ facilityId }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );

  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: [
      "devices",
      facilityId,
      page,
      limit,
      searchQuery,
      selectedLocation,
    ],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        offset: (page - 1) * limit,
        limit,
        name: searchQuery || undefined,
        location: selectedLocation?.id || undefined,
      },
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-4">
          <PageTitle title={t("devices")} />
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-2 sm:gap-4">
          <div className="w-full sm:w-72">
            <Input
              placeholder={t("search_by_name")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-60">
            <LocationSearch
              facilityId={facilityId}
              onSelect={setSelectedLocation}
              value={selectedLocation}
            />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardGridSkeleton count={6} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.results?.length ? (
              data.results.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {t("no_devices_available")}
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
    </div>
  );
}
