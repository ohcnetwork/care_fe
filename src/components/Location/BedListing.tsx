import { cn } from "@/lib/utils";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  BedAvailableSelected,
  BedAvailableUnselected,
  BedUnavailableSelected,
  BedUnavailableUnselected,
} from "@/CAREUI/icons/CustomIcons";
import { LocationRead } from "@/types/location/location";

interface BedListingProps {
  beds: LocationRead[];
  selectedBed: LocationRead | null;
  onBedSelect: (bed: LocationRead) => void;
  onCheckStatus: (bed: LocationRead) => void;
}

export function BedListing({
  beds,
  selectedBed,
  onBedSelect,
  onCheckStatus,
}: BedListingProps) {
  if (beds.length === 0) return null;
  return (
    <RadioGroup
      value={selectedBed?.id || ""}
      onValueChange={(id) => {
        const bed = beds.find((b) => b.id === id);
        if (bed) onBedSelect(bed);
      }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
    >
      {beds.map((bed) => {
        const isAvailable = bed.operational_status === "U";
        const isDischargedBed = bed.current_encounter?.status === "discharged";
        const isSelected = selectedBed?.id === bed.id;
        const isClickable = isAvailable || isDischargedBed;

        return (
          <div
            key={bed.id}
            className={cn(
              "h-32 relative border rounded-lg pt-3 pb-1",
              isSelected && "border-green-600 bg-green-50",
              !isSelected &&
                isClickable &&
                "border-gray-400 hover:border-green-200 cursor-pointer",
              !isSelected &&
                !isClickable &&
                "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed",
            )}
            onClick={() => {
              if (isAvailable) {
                onBedSelect(bed);
              } else if (isDischargedBed) {
                onCheckStatus(bed);
              }
            }}
          >
            <div className="absolute top-2 right-2">
              <RadioGroupItem
                value={bed.id}
                id={bed.id}
                className="size-4"
                disabled={!isClickable}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                {isAvailable ? (
                  isSelected ? (
                    <BedAvailableSelected className="size-10 mt-4" />
                  ) : (
                    <BedAvailableUnselected className="size-10 mt-4" />
                  )
                ) : isSelected ? (
                  <BedUnavailableSelected className="size-10 mt-4" />
                ) : (
                  <BedUnavailableUnselected className="size-10 mt-4" />
                )}
              </div>
              <p className="text-xs text-center font-medium mt-2">{bed.name}</p>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
