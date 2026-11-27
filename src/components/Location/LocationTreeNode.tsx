import { useQuery } from "@tanstack/react-query";
import { Bed, ChevronDown } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { locationChildrenQuery } from "@/pages/Facility/locations/bed-board/locationQueries";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";

interface LocationTreeNodeProps {
  facilityId: string;
  location: LocationRead;
  selectedLocationId?: string;
  isExpanded: (locationId: string) => boolean;
  onToggle: (locationId: string, expanded: boolean) => void;
  onSelect: (location: LocationRead) => void;
  /** Without it, a row has an arrow when it has sub-locations. */
  canExpand?: (location: LocationRead) => boolean;
  filterChildren?: (locations: LocationRead[] | undefined) => LocationRead[];
  showBeds?: boolean;
}

export function LocationTreeNode({
  facilityId,
  location,
  selectedLocationId,
  isExpanded,
  onToggle,
  onSelect,
  canExpand = (row) => row.has_sub_locations,
  filterChildren = (rows) => rows ?? [],
  showBeds = false,
}: LocationTreeNodeProps) {
  const { t } = useTranslation();
  const childrenId = useId();
  const Icon = LocationTypeIcons[location.form];
  const isSelected = location.id === selectedLocationId;
  const hasArrow = canExpand(location);
  const expanded = hasArrow && isExpanded(location.id);

  const { data: subLocations, isLoading } = useQuery({
    ...locationChildrenQuery(facilityId, location.id, "kind"),
    enabled: expanded,
  });
  const children = filterChildren(subLocations?.results);
  const showChildren = expanded && children.length > 0;
  const bedIcon = (className: string) =>
    showBeds &&
    location.has_beds && (
      <Bed className={className} role="img" aria-label={t("has_beds")} />
    );

  return (
    <li>
      <div
        className={cn(
          "flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 text-sm",
          isSelected
            ? "bg-primary/10 font-medium text-primary"
            : "hover:bg-muted",
        )}
      >
        <button
          type="button"
          aria-current={isSelected ? "true" : undefined}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => onSelect(location)}
        >
          <Icon
            className={cn(
              "size-4 shrink-0",
              !isSelected && "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span className="min-w-0 leading-tight wrap-anywhere">
            {location.name}
          </span>
          {location.status !== "active" && (
            <Badge variant="secondary" size="xs">
              {t("inactive")}
            </Badge>
          )}
          {hasArrow && bedIcon("ml-auto size-3.5 shrink-0 text-blue-600")}
        </button>
        {hasArrow ? (
          <Button
            type="button"
            variant="tertiary"
            size="icon"
            className="size-9 shrink-0"
            aria-expanded={expanded}
            aria-busy={(expanded && isLoading) || undefined}
            aria-controls={showChildren ? childrenId : undefined}
            aria-label={`${t(expanded ? "collapse" : "expand")} ${location.name}`}
            onClick={() => onToggle(location.id, !expanded)}
          >
            {expanded && isLoading ? (
              <Spinner />
            ) : (
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "transition-transform motion-reduce:transition-none",
                  expanded && "rotate-180",
                )}
              />
            )}
          </Button>
        ) : (
          // Keeps the bed icon in line with the arrows above and below.
          showBeds && (
            <span className="flex size-9 shrink-0 items-center justify-center">
              {bedIcon("size-3.5 text-blue-600")}
            </span>
          )
        )}
      </div>
      {showChildren && (
        <ul id={childrenId} className="ms-2.5 min-w-0">
          {children.map((child) => (
            <LocationTreeNode
              key={child.id}
              facilityId={facilityId}
              location={child}
              selectedLocationId={selectedLocationId}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onSelect={onSelect}
              canExpand={canExpand}
              filterChildren={filterChildren}
              showBeds={showBeds}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
