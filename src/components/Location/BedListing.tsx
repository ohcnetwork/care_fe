import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  BedAvailableSelected,
  BedAvailableUnselected,
  BedUnavailableSelected,
  BedUnavailableUnselected,
} from "@/CAREUI/icons/CustomIcons";
import { TagBadges } from "@/components/Tags/TagBadges";
import { LocationRead } from "@/types/location/location";
import { buildLocationPath } from "@/types/location/utils";

interface BedListingProps {
  beds: LocationRead[];
  selectedBed: LocationRead | null;
  onBedSelect: (bed: LocationRead) => void;
  onCheckStatus: (bed: LocationRead) => void;
  showParent?: boolean;
}

export function BedListing({
  beds,
  selectedBed,
  onBedSelect,
  onCheckStatus,
  showParent = false,
}: BedListingProps) {
  if (beds.length === 0) return null;
  return (
    <RadioGroup
      value={selectedBed?.id || ""}
      onValueChange={(id, eventDetails) => {
        const bed = beds.find((b) => b.id === id);
        if (bed?.operational_status === "U") {
          onBedSelect(bed);
        } else {
          eventDetails?.cancel();
          if (bed?.current_encounter?.status === "discharged")
            onCheckStatus(bed);
        }
      }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {beds.map((bed) => {
        const isAvailable = bed.operational_status === "U";
        const isDischargedBed = bed.current_encounter?.status === "discharged";
        const isSelected = selectedBed?.id === bed.id;
        const isClickable = isAvailable || isDischargedBed;
        const segments = buildLocationPath(bed);
        const fullPath = segments.map((s) => s.name).join(" › ");
        const shortPath = segments
          .map((s) => s.name)
          .slice(-2)
          .join(" › ");

        return (
          <Card
            key={bed.id}
            className={cn(
              "min-h-32 relative border rounded-lg pt-3 pb-1",
              isSelected && "border-green-600 bg-green-50",
              !isSelected &&
                isClickable &&
                "border-gray-400 hover:border-green-200 cursor-pointer",
              !isSelected &&
                !isClickable &&
                "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed",
            )}
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("button, a, input, [role='radio']")
              )
                return;
              // The card supplies pointer convenience; its radio owns keyboard selection.
              event.preventDefault();
              if (isAvailable) {
                onBedSelect(bed);
              } else if (isDischargedBed) {
                onCheckStatus(bed);
              }
            }}
          >
            <FieldLabel
              htmlFor={bed.id}
              className="w-full flex-col gap-0 cursor-inherit"
            >
              <RadioGroupItem
                value={bed.id}
                id={bed.id}
                className="absolute top-2 right-2 size-4"
                disabled={!isClickable}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isAvailable && isDischargedBed) {
                    event.preventDefault();
                    onCheckStatus(bed);
                  }
                }}
              />
              <span className="relative">
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
              </span>
              <span className="text-xs text-center font-medium mt-2">
                {bed.name}
              </span>
            </FieldLabel>
            <div className="flex flex-col items-center">
              <TagBadges
                tags={bed.tags}
                className="justify-center mt-1 px-1"
                size="xs"
              />
              {showParent && segments.length > 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs mt-1 text-gray-400 truncate max-w-full cursor-default">
                      {shortPath}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>{fullPath}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </Card>
        );
      })}
    </RadioGroup>
  );
}
