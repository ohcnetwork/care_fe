import { useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import DeviceCard from "@/pages/Facility/settings/devices/components/DeviceCard";
import DeviceSheet from "@/pages/Facility/settings/devices/components/DeviceSheet";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
}

interface PageQueryParams {
  device_id: string | null;
  sheet?: "view" | "link-to-location" | null;
}

export default function DevicesList({ facilityId }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [{ device_id, sheet }, setQueryParams] =
    useQueryParams<PageQueryParams>();

  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["devices", facilityId, page, limit, searchQuery],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        offset: (page - 1) * limit,
        limit,
        name: searchQuery || undefined,
      },
    }),
  });

  const handleAddDevice = () => {
    navigate(`/facility/${facilityId}/settings/devices/create`);
  };

  const handleViewDevice = (deviceId: string) => {
    setQueryParams({ sheet: "view", device_id: deviceId });
  };

  const handleLinkDevice = (deviceId: string) => {
    setQueryParams({ sheet: "link-to-location", device_id: deviceId });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{t("devices")}</h2>
          <Button variant="default" onClick={handleAddDevice}>
            <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
            {t("add_device")}
          </Button>
        </div>
        <div className="w-72">
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
                <DeviceCard
                  key={device.id}
                  device={device}
                  onView={handleViewDevice}
                  onLink={handleLinkDevice}
                />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {searchQuery
                    ? t("no_devices_found")
                    : t("no_devices_available")}
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
      <DeviceSheet
        open={sheet === "view"}
        onOpenChange={() => setQueryParams({ sheet: null, device_id })}
        facilityId={facilityId}
        device={
          device_id
            ? data?.results?.find((device) => device.id === device_id)
            : undefined
        }
      />
    </div>
  );
}
