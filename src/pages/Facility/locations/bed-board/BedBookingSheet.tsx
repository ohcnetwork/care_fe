import { useQuery } from "@tanstack/react-query";
import { UserRoundX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import EncounterInfoCard from "@/components/Encounter/EncounterInfoCard";

import query from "@/Utils/request/query";
import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface BedBookingSheetProps {
  bed: LocationRead;
  facilityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * A bed can be marked occupied without a current patient on it, for example
 * when it is booked ahead. This looks up who holds it.
 */
export function BedBookingSheet({
  bed,
  facilityId,
  open,
  onOpenChange,
}: BedBookingSheetProps) {
  const { t } = useTranslation();

  const { data: associations, isLoading } = useQuery({
    queryKey: ["location-associations", facilityId, bed.id],
    queryFn: query(locationApi.listAssociations, {
      pathParams: {
        facility_external_id: facilityId,
        location_external_id: bed.id,
      },
    }),
    enabled: open,
  });

  const encounter = associations?.results?.[0]?.encounter;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="md" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{t("bed_encounter_details")}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {isLoading ? (
            <div role="status" className="space-y-3">
              <span className="sr-only">{t("loading")}</span>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : encounter ? (
            <EncounterInfoCard encounter={encounter} facilityId={facilityId} />
          ) : (
            <EmptyState
              icon={
                <UserRoundX className="size-8 text-placeholder-foreground" />
              }
              title={t("no_encounter_associated")}
              description={t("no_encounter_linked_to_bed")}
              className="py-12"
            />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
