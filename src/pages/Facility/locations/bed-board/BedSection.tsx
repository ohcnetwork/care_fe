import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { LocationRead, LocationTypeIcons } from "@/types/location/location";

import { BedCountsLabel } from "./BedCountsLabel";
import { BedTile } from "./BedTile";
import { BedCounts } from "./bedState";

interface BedSectionProps {
  facilityId: string;
  /** The room this section belongs to. Leave out for the open location's own beds. */
  room?: LocationRead;
  onOpenRoom?: (room: LocationRead) => void;
  beds: LocationRead[];
  counts: BedCounts;
}

export function BedSection({
  facilityId,
  room,
  onOpenRoom,
  beds,
  counts,
}: BedSectionProps) {
  const { t } = useTranslation();
  const Icon = room ? LocationTypeIcons[room.form] : null;

  return (
    <section aria-label={room ? room.name : t("beds")} className="space-y-3">
      {room && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2.5 min-w-0 max-w-full"
            onClick={() => onOpenRoom?.(room)}
          >
            {Icon && <Icon aria-hidden="true" />}
            <span className="truncate">{room.name}</span>
            <ChevronRight
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
          <BedCountsLabel counts={counts} />
        </div>
      )}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
        {beds.map((bed) => (
          <BedTile key={bed.id} bed={bed} facilityId={facilityId} />
        ))}
      </ul>
    </section>
  );
}
