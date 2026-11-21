import { cn } from "@/lib/utils";

import { LocationRead } from "@/types/location/location";

import { BedPatientDetails } from "./BedPatientDetails";
import { BedVacantDetails } from "./BedVacantDetails";
import { BedState, getBedState } from "./bedState";

const TILE_STYLES = {
  patient:
    "border-border bg-card shadow-xs transition hover:border-foreground/25 hover:shadow-md",
  // Held for someone: tinted like a free slot, but solid.
  reserved:
    "border-amber-500/40 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-400/5",
  // An empty slot: dashed, so free beds stand apart from occupied ones at a glance.
  free: "border-dashed border-green-600/40 bg-green-50/60 dark:border-green-400/30 dark:bg-green-400/5",
  unavailable: "border-border bg-muted/50",
} as const satisfies Record<BedState, string>;

interface BedTileProps {
  bed: LocationRead;
  facilityId: string;
}

export function BedTile({ bed, facilityId }: BedTileProps) {
  const state = getBedState(bed);

  return (
    <li
      data-cy="bed-tile"
      data-state={state}
      className={cn(
        "group relative flex min-w-0 flex-col rounded-xl border text-sm",
        TILE_STYLES[state],
      )}
    >
      {bed.current_encounter ? (
        <BedPatientDetails
          bed={bed}
          encounter={bed.current_encounter}
          facilityId={facilityId}
        />
      ) : (
        <BedVacantDetails bed={bed} facilityId={facilityId} />
      )}
    </li>
  );
}
