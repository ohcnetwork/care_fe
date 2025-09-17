import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useBreakpoints from "@/hooks/useBreakpoints";
import {
  SchedulableResourceType,
  ScheduleResource,
} from "@/types/scheduling/schedule";
import {
  TokenSubQueueRead,
  TokenSubQueueStatus,
} from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useInServicePoints } from "./useInServicePoints";

export const ServicePointsDropDown = ({
  subQueues,
  resource,
}: {
  subQueues: TokenSubQueueRead[];
  resource: ScheduleResource | undefined;
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { servicePointIds, setServicePointToggle } = useInServicePoints({
    resource: resource as ScheduleResource,
    resourceType: resource?.resource_type as SchedulableResourceType,
  });
  const defaultServicePoints = useBreakpoints({ default: 2, sm: 6 });

  const activeSerPointCount = subQueues
    .filter((subQueue) => servicePointIds.includes(subQueue.id))
    .filter(
      (subQueue) => subQueue.status === TokenSubQueueStatus.ACTIVE,
    ).length;

  return (
    <div className="flex">
      <div className="flex gap-1 rounded-r-none border border-r-0 border-gray-300 rounded-l-md p-1.5  w-fit bg-white items-center justify-center">
        {servicePointIds.length === 0 ? (
          <span className="text-sm font-medium">
            {t("assign_service_points")}
          </span>
        ) : (
          <div className="flex gap-1 items-center justify-center">
            {subQueues
              .filter((subQueue) => servicePointIds.includes(subQueue.id))
              .slice(0, defaultServicePoints)
              .map((subQueue) => {
                return (
                  <div
                    key={subQueue.id}
                    className="flex items-center justify-center gap-1 border border-gray-300 py-0.5 px-1.5 rounded-sm bg-gray-50 whitespace-nowrap"
                  >
                    <div className="bg-primary-200 border border-primary-500 w-2 h-2 rounded-full" />
                    <span className="text-sm text-gray-950 font-medium">
                      {subQueue.name}
                    </span>
                  </div>
                );
              })}
            {activeSerPointCount > defaultServicePoints && (
              <span className="text-sm text-gray-950 font-medium">
                {`+${activeSerPointCount - defaultServicePoints}`} {t("more")}
              </span>
            )}
          </div>
        )}
      </div>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-l-none w-10 h-11 border border-gray-300 bg-white"
          >
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-55 rounded-lg border border-gray-300 shadow-xl  w-full"
        >
          <div className="flex flex-col gap-2 p-2 items-start justify-start">
            <div className="w-full">
              <DropdownMenuLabel className="text-xs font-medium px-3 text-gray-600">
                {t("assigned_service_points")}
              </DropdownMenuLabel>
              <div>
                {subQueues.map((subQueue) => {
                  const isSelected = servicePointIds.includes(subQueue.id);
                  return (
                    <div
                      key={subQueue.id}
                      className="flex items-center justify-between rounded-sm w-full p-1 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-3 p-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            setServicePointToggle(
                              subQueue.id,
                              checked as boolean,
                            )
                          }
                        />
                        <span className="text-sm font-medium">
                          {subQueue.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-gray-200 w-full pt-3 pb-1 px-1">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                {t("done")}
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
