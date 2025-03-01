import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import AssociateDeviceSheet from "@/pages/Encounters/AssociateDeviceSheet";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import DeviceCard from "@/pages/Facility/settings/devices/components/DeviceCard";
import deviceApi from "@/types/device/deviceApi";

export const EncounterDevicesTab = ({
  facilityId,
  encounter,
}: EncounterTabProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [isDeviceSheetOpen, setIsDeviceSheetOpen] = useState(false);

  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["devices", facilityId, page, limit],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facilityId },
      queryParams: {
        current_encounter: encounter.id,
        offset: (page - 1) * limit,
        limit,
      },
    }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4"></div>
        <Button variant="primary" onClick={() => setIsDeviceSheetOpen(true)}>
          <CareIcon icon="l-plus" className="h-4 w-4 m-auto center" />
          {t("associate_device")}
        </Button>
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
      <AssociateDeviceSheet
        open={isDeviceSheetOpen}
        onOpenChange={setIsDeviceSheetOpen}
        facilityId={facilityId}
        encounterId={encounter.id}
      />
    </div>
  );
};
