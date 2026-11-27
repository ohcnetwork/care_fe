import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LocationTreeNode } from "@/components/Location/LocationTreeNode";
import { LocationTreeSkeleton } from "@/components/Location/LocationTreeSkeleton";

import { LocationRead } from "@/types/location/location";
import { buildLocationPath } from "@/types/location/utils";

import { useBedLocations } from "./useLocationsWithBeds";

interface BedBoardTreeProps {
  facilityId: string;
  roots: LocationRead[];
  selectedLocationId?: string;
  /** The open location with its parent chain, once it has loaded. */
  selectedLocation?: LocationRead;
  onSelect: (location: LocationRead) => void;
}

export function BedBoardTree({
  facilityId,
  roots,
  selectedLocationId,
  selectedLocation,
  onSelect,
}: BedBoardTreeProps) {
  const { t } = useTranslation();
  // `expanded` holds what is open. Opening a location adds the path to it and
  // never closes anything: the rest of the tree stays as the user left it.
  const [expanded, setExpanded] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );
  // Read once here: each node asks it what to show below itself.
  const { filterWithBeds, hasBedsBelow, isLoading } =
    useBedLocations(facilityId);
  const [shownLocationId, setShownLocationId] = useState<string>();

  // Opens the parents of the location, not the location itself: only its
  // arrow expands it.
  const expandPath = (location: LocationRead) =>
    setExpanded((previous) => {
      const next = new Map(previous);
      buildLocationPath(location)
        .slice(0, -1)
        .forEach((step) => next.set(step.id, true));
      return next;
    });

  // The location can also open from the board (a room, a breadcrumb link), or
  // from a link to it.
  if (selectedLocation && shownLocationId !== selectedLocation.id) {
    setShownLocationId(selectedLocation.id);
    expandPath(selectedLocation);
  }

  const select = (location: LocationRead) => {
    setShownLocationId(location.id);
    expandPath(location);
    onSelect(location);
  };

  // Until the list is read no row knows whether it has an arrow.
  if (isLoading) return <LocationTreeSkeleton />;

  return (
    <nav aria-label={t("locations")}>
      <ul>
        {roots.map((root) => (
          <LocationTreeNode
            key={root.id}
            facilityId={facilityId}
            location={root}
            selectedLocationId={selectedLocationId}
            canExpand={(location) =>
              location.has_sub_locations && hasBedsBelow(location)
            }
            filterChildren={filterWithBeds}
            showBeds
            isExpanded={(id) => expanded.get(id) ?? false}
            onToggle={(id, isOpen) =>
              setExpanded((previous) => new Map(previous).set(id, isOpen))
            }
            onSelect={select}
          />
        ))}
      </ul>
    </nav>
  );
}
