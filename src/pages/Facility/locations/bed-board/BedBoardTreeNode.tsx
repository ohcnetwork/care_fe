import { useQuery } from "@tanstack/react-query";
import { Bed, ChevronDown } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { LocationRead, LocationTypeIcons } from "@/types/location/location";

import { locationChildrenQuery } from "./locationQueries";

interface BedBoardTreeNodeProps {
  facilityId: string;
  location: LocationRead;
  selectedLocationId?: string;
  /** Keeps the sub-locations that lead to a bed. */
  filterWithBeds: (locations: LocationRead[] | undefined) => LocationRead[];
  hasBedsBelow: (location: LocationRead) => boolean;
  isExpanded: (locationId: string) => boolean;
  onToggle: (locationId: string, expanded: boolean) => void;
  onSelect: (location: LocationRead) => void;
}

export function BedBoardTreeNode({
  facilityId,
  location,
  selectedLocationId,
  filterWithBeds,
  hasBedsBelow,
  isExpanded,
  onToggle,
  onSelect,
}: BedBoardTreeNodeProps) {
  const { t } = useTranslation();
  const childrenId = useId();
  const Icon = LocationTypeIcons[location.form];
  const isSelected = location.id === selectedLocationId;

  // A location with no bed anywhere below it has no arrow, so the arrow never
  // opens onto nothing.
  const canExpand = location.has_sub_locations && hasBedsBelow(location);
  const expanded = canExpand && isExpanded(location.id);

  const { data: subLocations, isLoading: isLoadingChildren } = useQuery({
    ...locationChildrenQuery(facilityId, location.id, "kind"),
    enabled: expanded,
  });
  // Only sub-locations that lead to beds belong on a bed board.
  const children = filterWithBeds(subLocations?.results);

  const showChildren = expanded && children.length > 0;

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
          {canExpand && location.has_beds && (
            <Bed
              className="ml-auto size-3.5 shrink-0 text-blue-600"
              role="img"
              aria-label={t("has_beds")}
            />
          )}
        </button>
        {canExpand ? (
          <Button
            type="button"
            variant="tertiary"
            size="icon"
            className="size-9 shrink-0"
            aria-expanded={expanded}
            aria-busy={(expanded && isLoadingChildren) || undefined}
            aria-controls={showChildren ? childrenId : undefined}
            aria-label={`${t(expanded ? "collapse" : "expand")} ${location.name}`}
            onClick={() => onToggle(location.id, !expanded)}
          >
            {expanded && isLoadingChildren ? (
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
          // Takes the place of the expand button, so the bed icon lines up
          // with the arrows of the rows above and below.
          <span className="flex size-9 shrink-0 items-center justify-center">
            {location.has_beds && (
              <Bed
                className="size-3.5 text-blue-600"
                role="img"
                aria-label={t("has_beds")}
              />
            )}
          </span>
        )}
      </div>
      {showChildren && (
        <ul id={childrenId} className="ms-2.5 min-w-0">
          {children.map((child) => (
            <BedBoardTreeNode
              key={child.id}
              facilityId={facilityId}
              location={child}
              selectedLocationId={selectedLocationId}
              filterWithBeds={filterWithBeds}
              hasBedsBelow={hasBedsBelow}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
