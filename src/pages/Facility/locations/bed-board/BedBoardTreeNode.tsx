import { useQuery } from "@tanstack/react-query";
import { Bed, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { LocationRead, LocationTypeIcons } from "@/types/location/location";

import { locationChildrenQuery } from "./locationQueries";
import { useLocationsWithBeds } from "./useLocationsWithBeds";

interface BedBoardTreeNodeProps {
  facilityId: string;
  location: LocationRead;
  level: number;
  selectedLocationId?: string;
  isExpanded: (locationId: string) => boolean;
  onToggle: (locationId: string, expanded: boolean) => void;
  onSelect: (location: LocationRead) => void;
}

export function BedBoardTreeNode({
  facilityId,
  location,
  level,
  selectedLocationId,
  isExpanded,
  onToggle,
  onSelect,
}: BedBoardTreeNodeProps) {
  const { t } = useTranslation();
  const Icon = LocationTypeIcons[location.form];
  const isSelected = location.id === selectedLocationId;
  // The flag says whether there is anything to expand, so a leaf has no arrow.
  const expanded = location.has_sub_locations && isExpanded(location.id);

  const { data: subLocations, isLoading: isLoadingSubLocations } = useQuery({
    ...locationChildrenQuery(facilityId, location.id, "kind"),
    enabled: expanded,
  });
  // Only sub-locations that lead to beds belong on a bed board.
  const { locations: children, isLoading: isCheckingBeds } =
    useLocationsWithBeds(facilityId, subLocations?.results);
  const isLoading = isLoadingSubLocations || isCheckingBeds;
  // Once they are known, a location whose sub-locations hold no beds has
  // nothing to expand either.
  const canExpand =
    location.has_sub_locations &&
    !(subLocations && !isCheckingBeds && children.length === 0);

  return (
    <li>
      <div
        className={cn(
          "flex items-center rounded-md",
          isSelected
            ? "bg-primary/10 font-medium text-primary"
            : "hover:bg-muted",
        )}
        style={{ paddingLeft: `${level * 1.25}rem` }}
      >
        {canExpand ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-expanded={expanded}
            aria-label={`${t(expanded ? "collapse" : "expand")} ${location.name}`}
            onClick={() => onToggle(location.id, !expanded)}
          >
            {expanded ? (
              <ChevronDown aria-hidden="true" />
            ) : (
              <ChevronRight aria-hidden="true" />
            )}
          </Button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <button
          type="button"
          aria-current={isSelected ? "true" : undefined}
          className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => {
            onSelect(location);
            if (canExpand) onToggle(location.id, true);
          }}
        >
          <Icon
            className={cn(
              "size-4 shrink-0",
              !isSelected && "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span className="truncate">{location.name}</span>
          {location.status !== "active" && (
            <Badge variant="secondary" size="xs">
              {t("inactive")}
            </Badge>
          )}
          {location.has_beds && (
            <Bed
              className="ml-auto size-3.5 shrink-0 text-muted-foreground"
              role="img"
              aria-label={t("has_beds")}
            />
          )}
        </button>
      </div>
      {expanded &&
        canExpand &&
        (isLoading ? (
          <div
            role="status"
            className="space-y-1 py-1"
            style={{ paddingLeft: `${(level + 1) * 1.25 + 1.75}rem` }}
          >
            <span className="sr-only">{t("loading")}</span>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        ) : (
          <ul>
            {children.map((child) => (
              <BedBoardTreeNode
                key={child.id}
                facilityId={facilityId}
                location={child}
                level={level + 1}
                selectedLocationId={selectedLocationId}
                isExpanded={isExpanded}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </ul>
        ))}
    </li>
  );
}
