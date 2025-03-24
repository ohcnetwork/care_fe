import { CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { LocationList } from "@/types/location/location";

interface BedListingProps {
  beds: LocationList[];
  selectedBed: string | null;
  onBedSelect: (bedId: string) => void;
  onCheckStatus: (bed: LocationList) => void;
}

export function BedListing({
  beds,
  selectedBed,
  onBedSelect,
  onCheckStatus,
}: BedListingProps) {
  const { t } = useTranslation();

  return (
    <RadioGroup
      value={selectedBed || ""}
      onValueChange={onBedSelect}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
    >
      {beds.map((bed) => {
        const isAvailable = !bed.current_encounter;
        const isSelected = selectedBed === bed.id;

        return (
          <div
            key={bed.id}
            className={cn(
              "h-32 relative border rounded-lg pt-3 pb-1",
              isSelected && "border-green-600 bg-green-50",
              !isSelected &&
                isAvailable &&
                "border-gray-400 hover:border-green-200 cursor-pointer",
              !isSelected &&
                !isAvailable &&
                "border-gray-100 bg-gray-50 hover:border-red-200 cursor-pointer",
            )}
            onClick={() => {
              if (isAvailable) {
                onBedSelect(bed.id);
              } else {
                onCheckStatus(bed);
              }
            }}
          >
            <div className="absolute top-2 right-2">
              <RadioGroupItem
                value={bed.id}
                id={bed.id}
                className="h-4 w-4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img
                  src={
                    isAvailable
                      ? isSelected
                        ? "/images/bed-available-selected.svg"
                        : "/images/bed-available.svg"
                      : isSelected
                        ? "/images/bed-unavailable-selected.svg"
                        : "/images/bed-unavailable.svg"
                  }
                  alt="Bed"
                  className="h-8 w-8 mt-4"
                />
              </div>
              <p className="text-xs text-center font-medium">{bed.name}</p>

              {!isAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 mt-2 text-xs py-0 px-2 bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckStatus(bed);
                  }}
                >
                  <CalendarClock className="h-4 w-4 mr-2" />
                  {t("check_status")}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
