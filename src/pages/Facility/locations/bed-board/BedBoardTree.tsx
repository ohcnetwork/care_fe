import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LocationRead } from "@/types/location/location";
import { buildLocationPath } from "@/types/location/utils";

import { BedBoardTreeNode } from "./BedBoardTreeNode";

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
  // The path to the open location is expanded by default. `toggled` holds
  // only what the user expanded or collapsed by hand.
  const [toggled, setToggled] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );
  const pathIds = selectedLocation
    ? buildLocationPath(selectedLocation).map((location) => location.id)
    : [];

  // When another location opens, show the path to it again even if a part of
  // it was collapsed by hand.
  const [shownLocationId, setShownLocationId] = useState(selectedLocation?.id);
  if (shownLocationId !== selectedLocation?.id) {
    setShownLocationId(selectedLocation?.id);
    setToggled(
      (previous) =>
        new Map([...previous].filter(([id]) => !pathIds.includes(id))),
    );
  }

  return (
    <nav aria-label={t("locations")}>
      <ul>
        {roots.map((root) => (
          <BedBoardTreeNode
            key={root.id}
            facilityId={facilityId}
            location={root}
            level={0}
            selectedLocationId={selectedLocationId}
            isExpanded={(id) => toggled.get(id) ?? pathIds.includes(id)}
            onToggle={(id, expanded) =>
              setToggled((previous) => new Map(previous).set(id, expanded))
            }
            onSelect={onSelect}
          />
        ))}
      </ul>
    </nav>
  );
}
