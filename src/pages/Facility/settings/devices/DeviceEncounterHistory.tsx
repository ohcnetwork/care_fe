import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import deviceApi from "@/types/device/deviceApi";

import { DeviceEncounterCard } from "./components/DeviceEncounterCard";

interface Props {
  facilityId: string;
  deviceId: string;
  trigger: React.ReactNode;
}

const DeviceEncounterHistory = ({ facilityId, deviceId, trigger }: Props) => {
  const { t } = useTranslation();

  const { data: encountersData, isLoading } = useQuery({
    queryKey: ["deviceEncounterHistory", facilityId, deviceId],
    queryFn: query.paginated(deviceApi.encounterHistory, {
      pathParams: {
        facilityId,
        deviceId,
      },
    }),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md pr-2 pl-3">
        <SheetHeader className="space-y-1 px-1">
          <SheetTitle className="text-xl font-semibold">
            {t("device_encounter_history")}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div>
            {isLoading ? (
              <div>
                <div className="grid gap-5 my-5">
                  <CardListSkeleton count={RESULTS_PER_PAGE_LIMIT} />
                </div>
              </div>
            ) : (
              <div>
                {encountersData?.results?.length === 0 ? (
                  <div className="p-2">
                    <div className="h-full space-y-2 rounded-lg bg-white px-7 py-12 border border-secondary-300">
                      <div className="flex w-full items-center justify-center text-lg text-secondary-600">
                        <div className="h-full flex w-full items-center justify-center">
                          <span className="text-sm text-gray-500">
                            {t("no_encounters_found")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="grid gap-4 my-5">
                    {encountersData?.results?.map((encounterData) => (
                      <li key={encounterData.id} className="w-full">
                        <DeviceEncounterCard
                          key={encounterData.id}
                          encounterData={encounterData}
                        />
                      </li>
                    ))}
                    <div className="flex w-full items-center justify-center">
                      <div
                        className={cn(
                          "flex w-full justify-center",
                          (encountersData?.count ?? 0) > RESULTS_PER_PAGE_LIMIT
                            ? "visible"
                            : "invisible",
                        )}
                      ></div>
                    </div>
                  </ul>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default DeviceEncounterHistory;
