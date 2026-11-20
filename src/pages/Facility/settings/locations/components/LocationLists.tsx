import { useTranslation } from "react-i18next";

import { EyebrowTitle, Muted } from "@/components/ui/typography";

import { LocationRead } from "@/types/location/location";

import { BedGrid } from "./BedGrid";
import { SubLocationTable } from "./SubLocationTable";

interface LocationListsProps {
  facilityId: string;
  /** Every sub-location and bed of the place; `search` narrows what shows. */
  subLocations: LocationRead[];
  beds: LocationRead[];
  search: string;
  /** The top of the facility lists only locations, so it needs no heading. */
  showSubLocationHeading: boolean;
  onManage: (location: LocationRead) => void;
  onMove: (
    siblings: LocationRead[],
    location: LocationRead,
    direction: "up" | "down",
  ) => void;
  onDelete: (location: LocationRead) => void;
}

/**
 * The sub-locations of a place as a table and its beds as a grid, narrowed
 * to the ones whose name matches the search.
 */
export function LocationLists({
  facilityId,
  subLocations,
  beds,
  search,
  showSubLocationHeading,
  onManage,
  onMove,
  onDelete,
}: LocationListsProps) {
  const { t } = useTranslation();
  const term = search.trim().toLowerCase();
  const matches = (location: LocationRead) =>
    location.name.toLowerCase().includes(term);
  const shownSubLocations = subLocations.filter(matches);
  const shownBeds = beds.filter(matches);

  if (shownSubLocations.length + shownBeds.length === 0) {
    return (
      <Muted className="py-6 text-center">{t("no_locations_found")}</Muted>
    );
  }

  // The order is that of the whole list, so it stays fixed while only a part
  // of the list shows.
  const moveIn = (siblings: LocationRead[]) =>
    term
      ? undefined
      : (location: LocationRead, direction: "up" | "down") =>
          onMove(siblings, location, direction);

  return (
    <>
      {shownSubLocations.length > 0 && (
        <section className="space-y-2">
          {showSubLocationHeading && (
            <EyebrowTitle className="text-muted-foreground">
              {t("sub_locations")} · {subLocations.length}
            </EyebrowTitle>
          )}
          <SubLocationTable
            facilityId={facilityId}
            locations={shownSubLocations}
            onManage={onManage}
            onMove={moveIn(subLocations)}
            onDelete={onDelete}
          />
        </section>
      )}
      {shownBeds.length > 0 && (
        <section className="space-y-2">
          <EyebrowTitle className="text-muted-foreground">
            {t("beds")} · {beds.length}
          </EyebrowTitle>
          <BedGrid
            beds={shownBeds}
            onManage={onManage}
            onMove={moveIn(beds)}
            onDelete={onDelete}
          />
        </section>
      )}
    </>
  );
}
