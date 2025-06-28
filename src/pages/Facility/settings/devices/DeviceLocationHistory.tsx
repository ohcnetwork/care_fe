import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Page from "@/components/Common/Page";
import PaginationComponent from "@/components/Common/Pagination";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { DeviceLocationCard } from "@/pages/Facility/settings/devices/components/DeviceLocationCard";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
  deviceId: string;
}

const DeviceLocationHistory = ({ facilityId, deviceId }: Props) => {
  const { t } = useTranslation();

  const [qParams, setQueryParams] = useQueryParams<{ page?: number }>();

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["deviceLocationHistory", facilityId, deviceId, qParams],
    queryFn: query(deviceApi.locationHistory, {
      queryParams: {
        limit: RESULTS_PER_PAGE_LIMIT,
        offset: ((qParams.page ?? 1) - 1) * RESULTS_PER_PAGE_LIMIT,
      },
      pathParams: {
        facilityId,
        id: deviceId,
      },
    }),
  });

  return (
    <Page title={t("device_location_history")} className="mt-8">
      <div>
        {isLoading ? (
          <div>
            <div className="grid gap-5 my-5">
              <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
            </div>
          </div>
        ) : (
          <div>
            {locationsData?.results?.length === 0 ? (
              <div className="p-2">
                <div className="h-full space-y-2 rounded-lg bg-white px-7 py-12 border border-secondary-300">
                  <div className="flex w-full items-center justify-center text-lg text-secondary-600">
                    <div className="h-full flex w-full items-center justify-center">
                      <span className="text-sm text-gray-500">
                        {t("no_locations_found")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ul className="grid gap-4 my-5">
                {locationsData?.results?.map((locationData) => (
                  <li key={locationData.id} className="w-full">
                    <DeviceLocationCard
                      key={locationData.id}
                      locationData={locationData}
                    />
                  </li>
                ))}
                <div className="flex w-full items-center justify-center">
                  <div
                    className={cn(
                      "flex w-full justify-center",
                      (locationsData?.count ?? 0) > RESULTS_PER_PAGE_LIMIT
                        ? "visible"
                        : "invisible",
                    )}
                  >
                    <PaginationComponent
                      cPage={qParams.page ?? 1}
                      defaultPerPage={RESULTS_PER_PAGE_LIMIT}
                      data={{ totalCount: locationsData?.count ?? 0 }}
                      onChange={(page) => setQueryParams({ page })}
                    />
                  </div>
                </div>
              </ul>
            )}
          </div>
        )}
      </div>
    </Page>
  );
};

export default DeviceLocationHistory;
