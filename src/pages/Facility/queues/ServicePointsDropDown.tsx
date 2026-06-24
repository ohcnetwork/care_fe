import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoints from "@/hooks/useBreakpoints";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueueServicePoints } from "./useQueueServicePoints";

export const ServicePointsDropDown = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { assignedServicePointIds, allServicePoints, toggleServicePoint } =
    useQueueServicePoints();
  const defaultServicePoints = useBreakpoints({
    default: 1,
    lg: 3,
    xl: 4,
    "2xl": 6,
  });

  if (!allServicePoints) {
    return (
      <div className="flex w-full sm:w-auto">
        <Skeleton className="h-9 w-full sm:w-40 rounded-r-none rounded-l-md" />
        <Skeleton className="h-9 w-10 rounded-l-none rounded-r-md shrink-0" />
      </div>
    );
  }

  const activeServicePointCount = allServicePoints.filter((subQueue) =>
    assignedServicePointIds.includes(subQueue.id),
  ).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full sm:w-auto items-stretch text-left rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="flex min-w-0 flex-1 gap-1 p-1 overflow-hidden items-center">
            {assignedServicePointIds.length === 0 ? (
              <span className="text-sm font-medium px-2 py-1 text-gray-600 whitespace-nowrap">
                {t("assign_service_points")}
              </span>
            ) : (
              <div className="flex gap-1 items-center min-w-0 flex-wrap sm:flex-nowrap">
                {allServicePoints
                  .filter((subQueue) =>
                    assignedServicePointIds.includes(subQueue.id),
                  )
                  .slice(0, defaultServicePoints)
                  .map((subQueue) => {
                    return (
                      <div
                        key={subQueue.id}
                        className="flex max-w-40 items-center gap-1 border border-gray-300 py-0.5 px-1.5 rounded-sm bg-gray-50 min-w-0"
                      >
                        <div className="bg-primary-200 border border-primary-500 w-2 h-2 rounded-full shrink-0" />
                        <span className="text-sm text-gray-950 font-medium truncate">
                          {subQueue.name}
                        </span>
                      </div>
                    );
                  })}
                {activeServicePointCount > defaultServicePoints && (
                  <span className="text-sm text-gray-950 font-medium whitespace-nowrap px-1">
                    {"+"}
                    {t("count_more", {
                      count: activeServicePointCount - defaultServicePoints,
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center w-10 border-l border-gray-300 shrink-0">
            <ChevronDownIcon className="size-4" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(90vw,20rem)] max-h-[60vh] overflow-y-auto rounded-lg border border-gray-300 shadow-xl"
      >
        <div className="flex flex-col gap-2 p-2 items-start justify-start">
          <div className="w-full">
            <DropdownMenuLabel className="text-xs font-medium px-3 text-gray-600">
              {t("assigned_service_points")}
            </DropdownMenuLabel>
            <div>
              {allServicePoints.map((subQueue) => {
                const isSelected = assignedServicePointIds.includes(
                  subQueue.id,
                );
                return (
                  <div
                    key={subQueue.id}
                    className="flex items-center justify-between rounded-sm w-full p-1 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      toggleServicePoint(subQueue.id, !isSelected);
                    }}
                  >
                    <div className="flex items-center space-x-3 p-1">
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                        tabIndex={-1}
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
  );
};
