import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const [searchLocation, setSearchLocation] = useState<LocationList | null>(
    null,
  );

  const limit = 12;

  const { data: devices, isLoading } = useQuery({
    queryKey: ["devices", facilityId, searchLocation?.id],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        current_location: searchLocation?.id,
        offset: (page - 1) * limit,
        limit,
      },
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <PageTitle title={t("devices")} className="mt-2" />
          <Badge
            className="bg-purple-50 text-purple-700 ml-2 text-sm font-medium rounded-xl px-3 w-max"
            variant="outline"
          >
            {isLoading
              ? t("loading")
              : t("entity_count_other", {
                  count: devices?.count ?? 0,
                  entity: "Device",
                })}
          </Badge>
        </div>
        <LocationSearch
          facilityId={facilityId}
          onSelect={setSearchLocation}
          value={searchLocation}
        />
        <Button variant="primary" asChild>
          <Link href="/devices/create">
            <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
            {t("add_device")}
          </Link>
        </Button>
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
                  {t("no_devices_available")}
                </CardContent>
              </Card>
            )}
          </div>
          {devices && devices.count > limit && (
            <div className="flex justify-center">
              <Pagination
                data={{ totalCount: devices.count }}
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
