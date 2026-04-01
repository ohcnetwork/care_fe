import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoints from "@/hooks/useBreakpoints";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueueServicePoints } from "./useQueueServicePoints";

export const ServicePointsDropDown = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    assignedServicePointIds,
    assignedServicePoints,
    allServicePoints,
    isLoading,
    toggleServicePoint,
  } = useQueueServicePoints();
  const defaultServicePoints = useBreakpoints({ default: 2, sm: 6 });

  if (isLoading) {
    return (
      <div className="flex">
        <Skeleton className="h-11 w-40 rounded-r-none rounded-l-md" />
        <Skeleton className="h-11 w-10 rounded-l-none rounded-r-md" />
      </div>
    );
  }

  const activeServicePointCount = assignedServicePoints.length;
  const hasServicePoints = allServicePoints.length > 0;
  const isEmpty = !hasServicePoints;
  const isTriggerDisabled = !hasServicePoints;

  return (
    <div className="flex">
      <div className="flex gap-1 rounded-r-none border border-r-0 border-gray-300 rounded-l-md p-1.5 bg-white items-center justify-center">
        {isEmpty ? (
          <span className="text-sm font-medium">
            {t("no_service_points_available")}
          </span>
        ) : assignedServicePointIds.length === 0 ? (
          <span className="text-sm font-medium">
            {t("assign_service_points")}
          </span>
        ) : (
          <div className="flex gap-1 items-center justify-center">
            {assignedServicePoints
              .slice(0, defaultServicePoints)
              .map((subQueue) => {
                return (
                  <div
                    key={subQueue.id}
                    className="flex w-48 items-center justify-center gap-1 border border-gray-300 py-0.5 px-1.5 rounded-sm bg-gray-50 whitespace-nowrap"
                  >
                    <div className="bg-primary-200 border border-primary-500 w-2 h-2 rounded-full" />
                    <span className="text-sm text-gray-950 font-medium truncate">
                      {subQueue.name}
                    </span>
                  </div>
                );
              })}
            {activeServicePointCount > defaultServicePoints && (
              <span className="text-sm text-gray-950 font-medium">
                {"+"}
                {t("count_more", {
                  count: activeServicePointCount - defaultServicePoints,
                })}
              </span>
            )}
          </div>
        )}
      </div>
      <DropdownMenu
        open={isTriggerDisabled ? false : isOpen}
        onOpenChange={(open) => setIsOpen(isTriggerDisabled ? false : open)}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-l-none w-10 h-11 border border-gray-300 bg-white"
            aria-label={t("assign_service_points")}
            disabled={isTriggerDisabled}
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
                {allServicePoints.map((subQueue) => {
                  const checkboxId = `sp-dropdown-${subQueue.id}`;
                  const isSelected = assignedServicePointIds.includes(
                    subQueue.id,
                  );
                  return (
                    <label
                      key={subQueue.id}
                      htmlFor={checkboxId}
                      className="flex items-center justify-between rounded-sm w-full p-1 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 p-1">
                        <Checkbox
                          id={checkboxId}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleServicePoint(subQueue.id, checked as boolean)
                          }
                        />
                        <span className="text-sm font-medium">
                          {subQueue.name}
                        </span>
                      </div>
                    </label>
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
