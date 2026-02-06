import { cn } from "@/lib/utils";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  BedAvailableSelected,
  BedAvailableUnselected,
} from "@/CAREUI/icons/CustomIcons";
import { LocationAssociationRead } from "@/types/location/association";

interface LinkedBedListingProps {
  linkedBeds: LocationAssociationRead[];
  selectedLinkedBed: LocationAssociationRead | undefined;
  onLinkedBedSelect: (bed: LocationAssociationRead) => void;
}

export function LinkedBedListing({
  linkedBeds,
  selectedLinkedBed,
  onLinkedBedSelect,
}: LinkedBedListingProps) {
  if (linkedBeds.length === 0) return null;

  return (
    <RadioGroup
      value={selectedLinkedBed?.id || ""}
      onValueChange={(value) => {
        const bed = linkedBeds.find((b) => b.id === value);
        if (bed) onLinkedBedSelect(bed);
      }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
    >
      {linkedBeds.map((linkedBed) => {
        const isSelected = selectedLinkedBed?.id === linkedBed.id;

        return (
          <div
            key={linkedBed.id}
            className={cn(
              "h-32 relative border rounded-lg pt-3 pb-1 cursor-pointer",
              isSelected && "border-green-600 bg-green-50",
              !isSelected && "border-gray-400 hover:border-green-200",
            )}
            onClick={() => onLinkedBedSelect(linkedBed)}
          >
            <div className="absolute top-2 right-2">
              <RadioGroupItem
                value={linkedBed.id}
                id={linkedBed.id}
                className="size-4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                {isSelected ? (
                  <BedAvailableSelected className="size-10 mt-4" />
                ) : (
                  <BedAvailableUnselected className="size-10 mt-4" />
                )}
              </div>
              <p className="text-xs text-center font-medium mt-2">
                {linkedBed.location.name}
              </p>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
