import { Bed } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocationRead } from "@/types/location/location";

import { LocationActionsMenu } from "./LocationActionsMenu";

interface BedGridProps {
  beds: LocationRead[];
  /** Opens everything that can be changed about a bed. */
  onManage: (bed: LocationRead) => void;
  /** Reordering is offered only when the list is not filtered. */
  onMove?: (bed: LocationRead, direction: "up" | "down") => void;
  onDelete: (bed: LocationRead) => void;
}

/**
 * The beds of a location. Beds are many and alike, so they sit in a compact
 * grid; each one opens its details, tags and departments.
 */
export function BedGrid({ beds, onManage, onMove, onDelete }: BedGridProps) {
  const { t } = useTranslation();

  return (
    <ul
      data-cy="location-beds"
      className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-2"
    >
      {beds.map((bed, index) => (
        <li
          key={bed.id}
          className="relative flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card py-1.5 pr-1 pl-3 text-sm shadow-xs hover:bg-muted"
        >
          <Bed
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            {/* Stretched over the tile, so the whole tile opens the bed. */}
            <button
              type="button"
              className="block max-w-full cursor-pointer truncate text-left font-medium outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
              onClick={() => onManage(bed)}
            >
              {bed.name}
            </button>
            <p className="truncate text-xs text-muted-foreground">
              {bed.status !== "active"
                ? t(bed.status)
                : t(`location_operational_status__${bed.operational_status}`)}
            </p>
          </div>
          <LocationActionsMenu
            locationName={bed.name}
            className="relative z-10"
            onMoveUp={onMove && index > 0 ? () => onMove(bed, "up") : undefined}
            onMoveDown={
              onMove && index < beds.length - 1
                ? () => onMove(bed, "down")
                : undefined
            }
            onDelete={
              !bed.has_children && !bed.current_encounter
                ? () => onDelete(bed)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
