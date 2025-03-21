import { CubeIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import PageTitle from "@/components/Common/PageTitle";
import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import DeviceCard from "@/pages/Facility/settings/devices/components/DeviceCard";
import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
}

export default function DevicesList({ facilityId }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const pluginDevices = usePluginDevices();

  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["devices", facilityId, page, limit],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        offset: (page - 1) * limit,
        limit,
      },
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <PageTitle title={t("devices")} />
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
          <Button variant="white" asChild>
            <Link href="/devices/create">
              <PlusIcon className="h-4 w-4" />
              {t("add_device")}
            </Link>
          </Button>
        )}
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
